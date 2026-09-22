"use client";

import { useState } from "react";

/**
 * Marks the row of chips when there are more of them off to the side, so the edge can fade as a hint to swipe.
 * It only sets an attribute on the row, so nothing re-renders while the visitor swipes.
 */
function trackOverflow(row: HTMLDivElement | null) {
  if (!row) return;
  const update = () => {
    // Right to left pages scroll to negative numbers, so only the size of the move counts.
    row.dataset.more = String(row.scrollWidth - row.clientWidth - Math.abs(row.scrollLeft) > 4);
  };
  update();
  row.addEventListener("scroll", update, { passive: true });
  const watch = new ResizeObserver(update);
  watch.observe(row);
  return () => {
    row.removeEventListener("scroll", update);
    watch.disconnect();
  };
}

/**
 * Stays at the top of the screen while you scroll a long list of garlands.
 * The occasion buttons scroll sideways. The other filters open under the Filters button.
 * The buttons themselves are links prepared on the server and passed in.
 */
export default function FilterBar({
  primary,
  more,
  label,
  activeCount,
}: {
  primary: React.ReactNode;
  more: React.ReactNode;
  label: string;
  activeCount: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky top-[var(--header-offset,65px)] z-30 border-b border-line bg-cream/95 backdrop-blur transition-[top] duration-200 motion-reduce:transition-none">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center gap-2 py-2">
          <div
            ref={trackOverflow}
            className="-mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] data-[more=true]:[-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-36px),transparent)] data-[more=true]:[mask-image:linear-gradient(to_right,#000_calc(100%-36px),transparent)] rtl:data-[more=true]:[-webkit-mask-image:linear-gradient(to_left,#000_calc(100%-36px),transparent)] rtl:data-[more=true]:[mask-image:linear-gradient(to_left,#000_calc(100%-36px),transparent)] [&::-webkit-scrollbar]:hidden"
          >
            {primary}
          </div>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition ${
              open || activeCount > 0 ? "border-rose text-rose" : "border-line bg-white text-ink"
            }`}
          >
            <span aria-hidden="true">⚙️</span>
            {label}
            {activeCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1 text-xs font-semibold text-white">
                {activeCount}
              </span>
            )}
          </button>
        </div>
        {open && <div className="space-y-3 pb-3">{more}</div>}
      </div>
    </div>
  );
}
