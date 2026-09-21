import { isAdmin } from "@/lib/auth";
import { MAX_UPLOAD_BYTES, processImage } from "@/lib/images";
import { putImage } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Please log in again." }, { status: 401 });

  let file: File | null = null;
  try {
    const form = await request.formData();
    const value = form.get("file");
    file = value instanceof File ? value : null;
  } catch {
    return Response.json({ error: "Could not read the upload." }, { status: 400 });
  }
  if (!file || file.size === 0) return Response.json({ error: "No photo received." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: "Photo is too large (max 8 MB)." }, { status: 413 });

  try {
    const { full, thumb } = await processImage(Buffer.from(await file.arrayBuffer()));
    const url = await putImage(full, thumb);
    return Response.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
