import type { Metadata } from "next";
import Link from "next/link";
import "../../globals.css";
import { FlowerLogo } from "@/components/icons";
import { isAdmin } from "@/lib/auth";
import { poppins } from "@/lib/fonts";
import { logoutAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | Aarifa Flowers",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const loggedIn = await isAdmin();
  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-screen bg-cream">
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link href="/admin" className="flex items-center gap-2.5">
              <FlowerLogo className="h-8 w-8" />
              <span className="font-semibold text-rose-deep">Aarifa Flowers</span>
              <span className="rounded-full bg-rose-soft px-2 py-0.5 text-xs font-semibold text-rose-deep">Admin</span>
            </Link>
            {loggedIn && (
              <div className="flex items-center gap-4 text-sm">
                <Link href="/en" target="_blank" className="font-medium text-muted hover:text-rose">
                  View website
                </Link>
                <form action={logoutAction}>
                  <button type="submit" className="font-medium text-muted hover:text-rose">
                    Log out
                  </button>
                </form>
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
