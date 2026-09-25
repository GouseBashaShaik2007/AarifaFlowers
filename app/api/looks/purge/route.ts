import { purgeOldLooks } from "@/lib/looks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Deletes shared Try On photos older than 30 days. Cloudflare runs it once a day (see worker.mjs).
// Anyone may call it. It only ever deletes photos that are already expired, so it cannot do harm.
export async function POST() {
  try {
    return Response.json({ removed: await purgeOldLooks() });
  } catch (err) {
    console.error("could not delete old looks", err);
    return Response.json({ error: "Could not delete old looks." }, { status: 500 });
  }
}
