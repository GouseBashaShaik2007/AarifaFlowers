import { isAdmin } from "@/lib/auth";
import { FLOWERS, OCCASIONS, TYPES, label } from "@/lib/catalog";
import { SuggestError, suggestListing } from "@/lib/ai";

export const runtime = "nodejs";
// Writing four languages can take a little while.
export const maxDuration = 60;

const MAX_IMAGES = 3;
const MAX_IMAGE_CHARS = 1_400_000; // about 1 MB of image data once decoded

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Please log in again." }, { status: 401 });

  let body: { images?: unknown; occasions?: unknown; types?: unknown; flowers?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Could not read the request." }, { status: 400 });
  }

  const images = Array.isArray(body.images) ? body.images : [];
  const valid = images.filter(
    (s): s is string => typeof s === "string" && s.length > 100 && s.length < MAX_IMAGE_CHARS && /^[A-Za-z0-9+/=]+$/.test(s),
  );
  if (valid.length === 0) return Response.json({ error: "Add at least one photo first." }, { status: 400 });

  const names = (value: unknown, list: readonly { id: string }[], toLabel: (id: string) => string) =>
    (Array.isArray(value) ? value : [])
      .filter((v): v is string => typeof v === "string" && list.some((o) => o.id === v))
      .map(toLabel);

  try {
    const suggestion = await suggestListing(valid.slice(0, MAX_IMAGES), {
      occasions: names(body.occasions, OCCASIONS, (id) => label(OCCASIONS, id, "en")),
      types: names(body.types, TYPES, (id) => label(TYPES, id, "en")),
      flowers: names(body.flowers, FLOWERS, (id) => label(FLOWERS, id, "en")),
    });
    return Response.json(suggestion);
  } catch (err) {
    if (err instanceof SuggestError) return Response.json({ error: err.message }, { status: err.status });
    console.error(err);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
