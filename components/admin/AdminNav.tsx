"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Garlands", match: (p: string) => p === "/admin" || p.startsWith("/admin/products") },
  { href: "/admin/reviews", label: "Customer stories", match: (p: string) => p.startsWith("/admin/reviews") },
  { href: "/admin/settings", label: "Announcements", match: (p: string) => p.startsWith("/admin/settings") },
  { href: "/admin/instagram", label: "Instagram", match: (p: string) => p.startsWith("/admin/instagram") },
];

/** Switches between the parts of the admin panel. Scrolls sideways on a small phone. */
export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-2 sm:px-6">
        {LINKS.map((l) => {
          const active = l.match(pathname);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-medium transition ${
                active ? "bg-rose text-white" : "text-ink hover:bg-rose-soft"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
