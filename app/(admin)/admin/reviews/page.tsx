import Link from "next/link";
import ReviewRow from "@/components/admin/ReviewRow";
import { requireAdmin } from "@/lib/auth";
import { listReviews } from "@/lib/siteContent";

export default async function ReviewsPage() {
  await requireAdmin();
  const reviews = await listReviews();
  const shown = reviews.filter((r) => r.published).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Customer stories</h1>
          <p className="text-sm text-muted">
            {reviews.length} saved · {shown} shown on the website
          </p>
        </div>
        <Link
          href="/admin/reviews/new"
          className="flex min-h-12 items-center rounded-full bg-rose px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(184,50,90,0.8)] transition hover:bg-rose-deep"
        >
          + Add story
        </Link>
      </div>

      {reviews.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {reviews.map((r) => (
            <ReviewRow key={r.id} review={r} />
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-line bg-white/60 p-10 text-center">
          <p className="text-4xl">💬</p>
          <p className="mt-3 font-medium text-ink">No customer stories yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            The Customer stories section stays hidden on the website until you add and show your first one. Only add
            real stories from real customers.
          </p>
          <Link
            href="/admin/reviews/new"
            className="mt-5 inline-flex min-h-12 items-center rounded-full bg-rose px-6 text-sm font-semibold text-white hover:bg-rose-deep"
          >
            + Add story
          </Link>
        </div>
      )}
    </div>
  );
}
