// Shown at once while the next page is being prepared, so a tap on a garland or a link gives instant feedback
// instead of a blank wait. The header and footer stay in place around it.

const bar = "animate-pulse rounded-full bg-line";

export default function Loading() {
  return (
    <div aria-hidden="true" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className={`${bar} h-9 w-56 max-w-full`} />
      <div className={`${bar} mt-4 h-5 w-80 max-w-full`} />
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="overflow-hidden rounded-3xl border border-line bg-white">
            <div className="aspect-[4/5] animate-pulse bg-cream-deep" />
            <div className="space-y-3 p-4">
              <div className={`${bar} h-4 w-4/5`} />
              <div className={`${bar} h-4 w-2/5`} />
              <div className="h-10 animate-pulse rounded-full bg-line" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
