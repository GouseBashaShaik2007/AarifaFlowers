import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SavedList from "@/components/SavedList";
import { isLang } from "@/lib/catalog";
import { getDict } from "@/lib/i18n";
import { listProducts } from "@/lib/store";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  // A private list, so search engines have no reason to show it.
  return { title: getDict(lang).savedTitle, robots: { index: false } };
}

export default async function SavedPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const products = await listProducts();
  return <SavedList products={products} lang={lang} t={getDict(lang)} />;
}
