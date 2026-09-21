import { isAdmin } from "@/lib/auth";
import { MAX_UPLOAD_BYTES, sniffImage } from "@/lib/images";
import { putImage } from "@/lib/store";

export const runtime = "nodejs";

async function readPhoto(value: FormDataEntryValue | null): Promise<Buffer | null> {
  if (!(value instanceof File) || value.size === 0) return null;
  return Buffer.from(await value.arrayBuffer());
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Please log in again." }, { status: 401 });

  let full: Buffer | null;
  let thumb: Buffer | null;
  try {
    const form = await request.formData();
    full = await readPhoto(form.get("file"));
    thumb = await readPhoto(form.get("thumb"));
  } catch {
    return Response.json({ error: "Could not read the upload." }, { status: 400 });
  }
  if (!full) return Response.json({ error: "No photo received." }, { status: 400 });
  if (full.length > MAX_UPLOAD_BYTES || (thumb && thumb.length > MAX_UPLOAD_BYTES)) {
    return Response.json({ error: "Photo is too large (max 8 MB)." }, { status: 413 });
  }

  const type = sniffImage(full);
  if (!type) return Response.json({ error: "That file is not a photo. Please use a JPG or PNG." }, { status: 400 });
  // The small copy must be the same kind of file. If it is missing or different, reuse the full size photo.
  if (!thumb || sniffImage(thumb) !== type) thumb = full;

  try {
    const url = await putImage(full, thumb, type);
    return Response.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
