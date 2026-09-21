// Limits and checks for uploaded videos. Safe to import anywhere.

/**
 * The largest video accepted. Videos go through the website server, and the free hosting plans limit how much
 * data one request may carry and how much video can be sent to visitors each month. Short 720p clips are
 * about 2 to 5 MB, so this leaves room. For bigger files see the README.
 */
export const MAX_VIDEO_BYTES = 10 * 1024 * 1024;

/** Videos longer than this get a gentle warning. They are heavy on a phone connection. */
export const LONG_VIDEO_SECONDS = 45;

/** True when the bytes start like an MP4 or QuickTime file: four size bytes, then the letters "ftyp". */
export function looksLikeMp4(bytes: Uint8Array): boolean {
  return (
    bytes.length > 12 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70
  );
}
