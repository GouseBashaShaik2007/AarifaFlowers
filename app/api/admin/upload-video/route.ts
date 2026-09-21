import { isAdmin } from "@/lib/auth";
import { putVideo } from "@/lib/store";
import { looksLikeMp4, MAX_VIDEO_BYTES } from "@/lib/videos";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Please log in again." }, { status: 401 });

  let file: File | null = null;
  try {
    const value = (await request.formData()).get("file");
    file = value instanceof File ? value : null;
  } catch {
    return Response.json({ error: "Could not read the upload." }, { status: 400 });
  }
  if (!file || file.size === 0) return Response.json({ error: "No video received." }, { status: 400 });
  if (file.size > MAX_VIDEO_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    const limit = MAX_VIDEO_BYTES / 1024 / 1024;
    return Response.json({ error: `This video is ${mb} MB. The limit is ${limit} MB. Shorten or compress it and try again.` }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!looksLikeMp4(bytes)) {
    return Response.json({ error: "That file is not an MP4 video. Please use an MP4." }, { status: 400 });
  }

  try {
    return Response.json({ url: await putVideo(bytes) });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Upload failed." }, { status: 500 });
  }
}
