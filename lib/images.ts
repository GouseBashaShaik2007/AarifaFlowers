import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Turns an uploaded photo into a web friendly WebP (keeps transparency)
 * plus a small thumbnail for cards. Cut-outs with a transparent background
 * are cropped to the garland so every product fills its card the same way.
 */
export async function processImage(input: Buffer): Promise<{ full: Buffer; thumb: Buffer }> {
  let source = await sharp(input, { failOn: "none" }).rotate().toBuffer();

  const meta = await sharp(source).metadata();
  if (meta.hasAlpha) {
    try {
      const trimmed = await sharp(source).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
      // Ignore a trim that would leave almost nothing, which means the image was not a real cut-out.
      if (trimmed.info.width > 80 && trimmed.info.height > 80) {
        const pad = Math.round(Math.max(trimmed.info.width, trimmed.info.height) * 0.04);
        source = await sharp(trimmed.data)
          .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
      }
    } catch {
      // Keep the untrimmed image if trimming fails.
    }
  }

  const base = sharp(source);
  const full = await base
    .clone()
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 86, alphaQuality: 92 })
    .toBuffer();
  const thumb = await base
    .clone()
    .resize({ width: 600, height: 600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80, alphaQuality: 85 })
    .toBuffer();
  return { full, thumb };
}
