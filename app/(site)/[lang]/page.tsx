import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon } from "@/components/icons";
import CustomerStories from "@/components/CustomerStories";
import FaqSection from "@/components/FaqSection";
import FitPhoto from "@/components/FitPhoto";
import InstagramShowcase from "@/components/InstagramShowcase";
import ProductCard from "@/components/ProductCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import { OCCASIONS, isCutout, isLang, thumbOf, tr } from "@/lib/catalog";
import { getDict } from "@/lib/i18n";
import { visibleReels } from "@/lib/instagram";
import { getFaq, getInstagramSettings, getPublishedReviews, getSiteSettings } from "@/lib/siteContent";
import { listProducts } from "@/lib/store";
import { customMessage, generalMessage, waLink } from "@/lib/whatsapp";

const OCCASION_BG: Record<string, string> = {
  wedding: "bg-rose-soft",
  pooja: "bg-marigold-soft",
  events: "bg-lavender-soft",
  special: "bg-mint-soft",
  custom: "bg-peach-soft",
};

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);

  const products = await listProducts();
  const featured = products.filter((p) => p.featured).slice(0, 8);
  const sets = products.filter((p) => p.types.includes("set")).slice(0, 4);
  const reviews = (await getPublishedReviews()).slice(0, 6);
  const instagram = await getInstagramSettings();
  const faq = await getFaq();
  const leadTime = tr((await getSiteSettings()).leadTime, lang);
  const heroPics = (featured.length ? featured : products).filter((p) => p.images[0]).slice(0, 3);

  const occasionImage = (id: string) => {
    const matches = products.filter((p) => p.occasions.includes(id as never) && p.images[0]);
    const pick = matches.find((p) => p.featured) ?? matches[0];
    return pick ? { src: thumbOf(pick.images[0]), alt: tr(pick.name, lang) } : null;
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#fff0df] via-cream to-[#ffe3ec]">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 md:py-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3 py-1.5 text-xs font-semibold text-rose-deep">
              🌸 {t.handmade} · {t.fresh}
            </p>
            <h1 className="h-display mt-4 text-4xl font-semibold text-rose-deep sm:text-5xl md:text-6xl">{t.tagline}</h1>
            <p className="mt-4 max-w-lg text-base text-muted sm:text-lg">{t.heroSub}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={`/${lang}/garlands`}
                className="inline-flex items-center gap-2 rounded-full bg-rose px-6 py-3.5 text-base font-semibold text-white shadow-[0_8px_20px_-8px_rgba(184,50,90,0.8)] transition hover:bg-rose-deep active:scale-[0.98]"
              >
                {t.browse}
                <ArrowIcon />
              </Link>
              <WhatsAppButton href={waLink(generalMessage)} size="lg" track="general">
                {t.orderWhatsApp}
              </WhatsAppButton>
            </div>
          </div>

          {heroPics.length > 0 && (
            <div className="relative mx-auto aspect-square w-full max-w-md">
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-rose-soft via-white to-marigold-soft" />
              {isCutout(heroPics[0].images[0]) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbOf(heroPics[0].images[0])}
                  alt={tr(heroPics[0].name, lang)}
                  className="absolute inset-0 h-full w-full object-contain p-3 drop-shadow-xl"
                />
              ) : (
                // An ordinary photo is shown as a tall framed picture, not as a rectangle inside the round shape.
                <div className="absolute inset-y-1 left-1/2 aspect-[4/5] -translate-x-1/2 overflow-hidden rounded-[2rem] border-4 border-white bg-cream shadow-xl">
                  <FitPhoto src={thumbOf(heroPics[0].images[0])} alt={tr(heroPics[0].name, lang)} eager />
                </div>
              )}
              {heroPics[1] && (
                <div className="absolute -bottom-1 start-0 h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-cream shadow-lg sm:h-32 sm:w-32">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbOf(heroPics[1].images[0])}
                    alt={tr(heroPics[1].name, lang)}
                    className={`h-full w-full ${isCutout(heroPics[1].images[0]) ? "object-contain p-2" : "object-cover"}`}
                  />
                </div>
              )}
              {heroPics[2] && (
                <div className="absolute end-0 top-2 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-cream shadow-lg sm:h-28 sm:w-28">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbOf(heroPics[2].images[0])}
                    alt={tr(heroPics[2].name, lang)}
                    className={`h-full w-full ${isCutout(heroPics[2].images[0]) ? "object-contain p-2" : "object-cover"}`}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Occasions */}
      <section className="mx-auto mt-14 max-w-6xl px-4 sm:px-6">
        <h2 className="h-display text-3xl font-semibold text-ink sm:text-4xl">{t.shopByOccasion}</h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
          {OCCASIONS.map((o, i) => {
            const img = occasionImage(o.id);
            return (
              <li key={o.id} className={i === OCCASIONS.length - 1 ? "col-span-2 md:col-span-1" : ""}>
                <Link
                  href={`/${lang}/garlands?occasion=${o.id}`}
                  className={`group flex h-full flex-col items-center gap-3 rounded-3xl border border-line p-4 text-center transition hover:-translate-y-0.5 hover:shadow-lg ${OCCASION_BG[o.id]}`}
                >
                  <span className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-white/70 sm:h-28 sm:w-28">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img.src}
                        alt={img.alt}
                        loading="lazy"
                        className={`absolute inset-0 h-full w-full transition group-hover:scale-105 ${isCutout(img.src) ? "object-contain p-2" : "object-cover"}`}
                      />
                    ) : (
                      <span className="text-4xl">{o.emoji}</span>
                    )}
                  </span>
                  <span className="text-sm font-semibold leading-snug text-ink sm:text-base">{o.label[lang]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="h-display text-3xl font-semibold text-ink sm:text-4xl">{t.featured}</h2>
            <Link
              href={`/${lang}/garlands`}
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-rose hover:text-rose-deep"
            >
              {t.viewAll}
              <ArrowIcon />
            </Link>
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} lang={lang} t={t} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sets and combos */}
      {sets.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="h-display text-3xl font-semibold text-ink sm:text-4xl">🎁 {t.setsTitle}</h2>
            <Link
              href={`/${lang}/garlands?type=set`}
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-rose hover:text-rose-deep"
            >
              {t.viewSets}
              <ArrowIcon />
            </Link>
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {sets.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} lang={lang} t={t} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Customer stories. Shown only when at least one is published. */}
      <CustomerStories reviews={reviews} t={t} />

      {/* How it works */}
      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <h2 className="h-display text-3xl font-semibold text-ink sm:text-4xl">{t.howItWorks}</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { title: t.step1Title, text: t.step1Text },
            { title: t.step2Title, text: t.step2Text },
            { title: t.step3Title, text: t.step3Text },
          ].map((s, i) => (
            <li key={i} className="flex gap-4 rounded-3xl border border-line bg-white p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-rose text-lg font-semibold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold text-ink">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        {leadTime && (
          <p className="mt-4 rounded-2xl bg-marigold-soft px-4 py-3 text-sm font-medium text-ink">⏱️ {leadTime}</p>
        )}
      </section>

      {/* Instagram reels */}
      {instagram.enabled && visibleReels(instagram).length > 0 && <InstagramShowcase t={t} settings={instagram} />}

      {/* Custom design */}
      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start gap-5 rounded-[2rem] bg-gradient-to-br from-rose to-[#d9562f] p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div className="max-w-xl">
            <h2 className="h-display text-2xl font-semibold sm:text-3xl">✨ {t.customTitle}</h2>
            <p className="mt-2 text-white/90">{t.customText}</p>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:items-stretch">
            <Link
              href={`/${lang}/custom`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-semibold text-rose-deep transition hover:bg-cream active:scale-[0.98]"
            >
              {t.builderCta}
              <ArrowIcon />
            </Link>
            <WhatsAppButton href={waLink(customMessage)} variant="outline" size="lg" track="custom">
              {t.customPhoto}
            </WhatsAppButton>
          </div>
        </div>
      </section>

      {/* Questions and answers. Last on the page, just above the footer. */}
      {faq.enabled && <FaqSection items={faq.items} lang={lang} title={t.faqTitle} />}
    </>
  );
}
