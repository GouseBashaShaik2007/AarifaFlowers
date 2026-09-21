import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GarlandBuilder from "@/components/GarlandBuilder";
import { isLang } from "@/lib/catalog";
import { getDict } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDict(lang);
  return { title: t.builderTitle, description: t.builderSub };
}

export default async function CustomPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <GarlandBuilder lang={lang} t={getDict(lang)} />;
}
