// Browser only. Never import this file from server code.
//
// Prepares a photo for upload: crops empty transparent edges, shrinks it, and makes a full size
// copy plus a small thumbnail as WebP. This used to run on the server with sharp, but sharp cannot
// run on Cloudflare Workers, so the phone or computer does the work instead.

const FULL_SIDE = 1200;
const THUMB_SIDE = 600;
// A pixel counts as "part of the garland" when it is more than about 5% visible.
const VISIBLE_ALPHA = 12;

type Canvas = HTMLCanvasElement;

function newCanvas(width: number, height: number): Canvas {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

async function toCanvas(blob: Blob): Promise<Canvas> {
  const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
  const canvas = newCanvas(bitmap.width, bitmap.height);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
  bitmap.close();
  return canvas;
}

/** Crops a cut-out photo to the garland, with a small margin, so every product fills its card the same way. */
function trimTransparent(source: Canvas): Canvas {
  const { width, height } = source;
  const { data } = source.getContext("2d")!.getImageData(0, 0, width, height);

  let top = height;
  let left = width;
  let right = -1;
  let bottom = -1;
  let hasTransparency = false;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha < 250) hasTransparency = true;
      if (alpha > VISIBLE_ALPHA) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (!hasTransparency || right < 0) return source;

  const w = right - left + 1;
  const h = bottom - top + 1;
  // Ignore a crop that would leave almost nothing. That means it was not a real cut-out.
  if (w <= 80 || h <= 80) return source;

  const pad = Math.round(Math.max(w, h) * 0.04);
  const out = newCanvas(w + pad * 2, h + pad * 2);
  out.getContext("2d")!.drawImage(source, left, top, w, h, pad, pad, w, h);
  return out;
}

/** Shrinks to fit inside a square of `side` pixels. Never makes a photo bigger. */
function fitInside(source: Canvas, side: number): Canvas {
  const scale = Math.min(1, side / Math.max(source.width, source.height));
  if (scale === 1) return source;
  const out = newCanvas(source.width * scale, source.height * scale);
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, out.width, out.height);
  return out;
}

function encode(canvas: Canvas, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not prepare this photo."))),
      "image/webp",
      quality,
    ),
  );
}

export async function prepareForUpload(photo: Blob): Promise<{ full: Blob; thumb: Blob }> {
  const trimmed = trimTransparent(await toCanvas(photo));
  const full = await encode(fitInside(trimmed, FULL_SIDE), 0.86);
  const thumb = await encode(fitInside(trimmed, THUMB_SIDE), 0.8);
  return { full, thumb };
}
