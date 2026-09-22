"use client";

import { useRouter } from "next/navigation";

/**
 * The sort menu above the garlands. It is the phone's own menu, which is easy to use with a thumb.
 * Each choice comes with the address to open, prepared on the server so the filters and the search are kept.
 */
export default function SortSelect({
  label,
  value,
  options,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; href: string }[];
}) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => {
          const choice = options.find((o) => o.value === e.target.value);
          if (choice) router.push(choice.href, { scroll: false });
        }}
        className="min-h-11 rounded-full border border-line bg-white px-3 text-sm font-medium text-ink outline-none focus:border-rose"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
