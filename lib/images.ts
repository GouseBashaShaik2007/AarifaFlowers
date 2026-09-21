// Server side checks for uploaded photos.
//
// The browser already cropped, resized and converted the photo (see lib/clientImages.ts).
// The server only makes sure the upload really is a photo before it is stored.

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export type ImageType = "image/webp" | "image/png" | "image/jpeg";

const ascii = (bytes: Uint8Array, from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));

/**
 * Looks at the first bytes of a file to see what it really is, whatever its name says.
 * Returns null for anything that is not a WebP, PNG or JPEG photo.
 */
export function sniffImage(bytes: Uint8Array): ImageType | null {
  if (bytes.length > 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "image/webp";
  if (bytes.length > 8 && bytes[0] === 0x89 && ascii(bytes, 1, 4) === "PNG") return "image/png";
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  return null;
}
