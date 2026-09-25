import { sniffImage } from "@/lib/images";
import { putLook } from "@/lib/looks";
import { MAX_LOOK_BYTES } from "@/lib/tryon";

export const runtime = "nodejs";

// Public endpoint, so it is kept small and hard to abuse:
// a size limit, a check that the file really is a photo, a per-visitor limit,
// and the Cloudflare Turnstile check when TURNSTILE_SECRET_KEY is set.
const hits = new Map<string, { n: number; reset: number }>();
const LIMIT_PER_10_MINUTES = 8;

function tooMany(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    if (hits.size > 5000) hits.clear();
    hits.set(ip, { n: 1, reset: now + 600_000 });
    return false;
  }
  entry.n++;
  return entry.n > LIMIT_PER_10_MINUTES;
}

async function passesTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Not turned on.
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip !== "unknown") body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const result = (await res.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (tooMany(ip)) return Response.json({ error: "Too many tries. Please wait a few minutes." }, { status: 429 });

  // Refuse a big upload before reading it.
  if (Number(request.headers.get("content-length") ?? 0) > MAX_LOOK_BYTES + 20_000) {
    return Response.json({ error: "The photo is too large." }, { status: 413 });
  }

  let file: FormDataEntryValue | null;
  let token = "";
  try {
    const form = await request.formData();
    file = form.get("file");
    const value = form.get("token");
    token = typeof value === "string" ? value : "";
  } catch {
    return Response.json({ error: "Could not read the upload." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "No photo received." }, { status: 400 });
  if (file.size > MAX_LOOK_BYTES) return Response.json({ error: "The photo is too large." }, { status: 413 });

  if (!(await passesTurnstile(token, ip))) {
    return Response.json({ error: "The security check failed. Please try again." }, { status: 403 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const type = sniffImage(bytes);
  if (!type) return Response.json({ error: "That file is not a photo." }, { status: 400 });

  try {
    const { id } = await putLook(bytes, type);
    return Response.json({ id });
  } catch (err) {
    console.error("look not saved", err);
    return Response.json({ error: "Could not save the photo." }, { status: 500 });
  }
}
