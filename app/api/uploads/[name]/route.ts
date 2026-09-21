import { promises as fs } from "node:fs";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/store";

// Serves photos and videos uploaded while running with local file storage.
// On Cloudflare or Vercel with Supabase, files come straight from Supabase and this route is not used.
export async function GET(request: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const match = /^[a-z0-9-]+\.(webp|mp4)$/i.exec(name);
  if (!match) return new Response("Not found", { status: 404 });
  const isVideo = match[1].toLowerCase() === "mp4";

  let file: Buffer;
  try {
    file = await fs.readFile(path.join(UPLOAD_DIR, name));
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const headers: Record<string, string> = {
    "Content-Type": isVideo ? "video/mp4" : "image/webp",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
  };

  // Browsers ask for a video in pieces so it can start quickly and skip around. Safari insists on this.
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  if (isVideo && range && (range[1] || range[2])) {
    const size = file.length;
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(size - 1, end);
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(new Uint8Array(file.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }

  return new Response(new Uint8Array(file), { headers: { ...headers, "Content-Length": String(file.length) } });
}
