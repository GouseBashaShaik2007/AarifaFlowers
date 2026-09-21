import Link from "next/link";

// Shown when a garland or page does not exist. Kept language neutral because it has no access to the route language.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-6xl">💐</p>
      <h1 className="h-display mt-4 text-3xl font-semibold text-ink">404</h1>
      <p className="mt-2 text-muted">Page not found · पेज नहीं मिला · పేజీ కనబడలేదు · صفحہ نہیں ملا</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-rose px-6 py-3 text-sm font-semibold text-white hover:bg-rose-deep"
      >
        Aarifa Flowers
      </Link>
    </div>
  );
}
