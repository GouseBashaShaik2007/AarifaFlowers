import { isAdmin } from "@/lib/auth";
import { getProduct, recordTap } from "@/lib/store";

export const runtime = "nodejs";

// Public endpoint. Keep it cheap and hard to abuse.
const hits = new Map<string, { n: number; reset: number }>();
const LIMIT_PER_MINUTE = 40;

function tooMany(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    if (hits.size > 5000) hits.clear();
    hits.set(ip, { n: 1, reset: now + 60_000 });
    return false;
  }
  entry.n++;
  return entry.n > LIMIT_PER_MINUTE;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (tooMany(ip)) return new Response(null, { status: 429 });

  let id = "";
  try {
    const body = (await request.json()) as { id?: unknown };
    id = typeof body.id === "string" ? body.id : "";
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!/^[a-z0-9-]{1,80}$/.test(id)) return new Response(null, { status: 400 });

  // The shop owner testing buttons should not change the numbers.
  if (await isAdmin()) return new Response(null, { status: 204 });

  try {
    if (id !== "general" && id !== "custom" && !(await getProduct(id))) return new Response(null, { status: 404 });
    await recordTap(id);
  } catch (err) {
    console.error("tap not counted", err);
  }
  return new Response(null, { status: 204 });
}
