// Browser only. Never import this file from server code.
//
// Loads the customer's photo and the garland, and merges them into one picture to share.
// Everything happens on the customer's phone. Nothing is uploaded until they press Order.

import { TARGET_LOOK_BYTES } from "./tryon";

/** Where the garland sits on the photo. Every number is relative to the photo, so it does not depend on screen size. */
export type Placement = {
  /** Centre of the garland, as a fraction of the photo width and height. */
  cx: number;
  cy: number;
  /** Width of the garland as a fraction of the photo width. */
  w: number;
  /** Turn in degrees. */
  rot: number;
};

export type Person = {
  /** A small copy for showing on screen. */
  url: string;
  /** The picture the look is drawn on. */
  canvas: HTMLCanvasElement;
  /** Width divided by height. */
  ratio: number;
};

export type Garland = {
  url: string;
  bitmap: ImageBitmap;
  /** Height divided by width. */
  ratio: number;
};

const MAX_SIDE = 1080;

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not prepare the picture."))), type, quality),
  );
}

/** Reads a photo from the phone. It is turned the right way up and shrunk, so a 12 megapixel photo stays light. */
export async function loadPerson(file: File): Promise<Person> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d")!;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const shown = await toBlob(canvas, "image/jpeg", 0.9);
  return { url: URL.createObjectURL(shown), canvas, ratio: canvas.width / canvas.height };
}

/**
 * Loads the garland photo. It is fetched, not put in an image tag, so the merged picture can be saved afterwards.
 * A photo from another address that does not allow this would otherwise block saving the picture.
 */
export async function loadGarland(src: string): Promise<Garland> {
  const response = await fetch(src, { mode: "cors" });
  if (!response.ok) throw new Error("The garland photo could not be loaded.");
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  return { url: URL.createObjectURL(blob), bitmap, ratio: bitmap.height / bitmap.width };
}

/** A good first position: on the chest, sized to fit inside the photo. */
export function startingPlacement(person: Person, garland: Garland): Placement {
  // Stay under 60% of the photo height, and under 80% of its width.
  const heightLimit = (0.6 / garland.ratio) * (person.canvas.height / person.canvas.width);
  return { cx: 0.5, cy: 0.58, w: Math.max(0.15, Math.min(0.8, heightLimit)), rot: 0 };
}

/**
 * Draws the garland on the photo and saves it as a JPEG. The picture is made smaller until it is light enough
 * to upload quickly on a mobile connection.
 */
export async function exportLook(person: Person, garland: Garland, placement: Placement): Promise<Blob> {
  let scale = 1;
  let smallest: Blob | null = null;
  for (let round = 0; round < 4; round++) {
    const width = Math.round(person.canvas.width * scale);
    const height = Math.round(person.canvas.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d")!;
    context.imageSmoothingQuality = "high";
    context.drawImage(person.canvas, 0, 0, width, height);

    const garlandWidth = placement.w * width;
    const garlandHeight = garlandWidth * garland.ratio;
    context.save();
    context.translate(placement.cx * width, placement.cy * height);
    context.rotate((placement.rot * Math.PI) / 180);
    // A soft shadow, so the garland sits on the photo instead of looking pasted on.
    context.shadowColor = "rgba(0, 0, 0, 0.3)";
    context.shadowBlur = garlandWidth * 0.02;
    context.shadowOffsetY = garlandWidth * 0.01;
    context.drawImage(garland.bitmap, -garlandWidth / 2, -garlandHeight / 2, garlandWidth, garlandHeight);
    context.restore();

    for (const quality of [0.82, 0.72, 0.62, 0.5]) {
      const blob = await toBlob(canvas, "image/jpeg", quality);
      if (!smallest || blob.size < smallest.size) smallest = blob;
      if (blob.size <= TARGET_LOOK_BYTES) return blob;
    }
    scale *= 0.8;
  }
  return smallest!;
}

/** Gives the customer the picture as a file, for a phone that cannot upload it. */
export function downloadPicture(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
