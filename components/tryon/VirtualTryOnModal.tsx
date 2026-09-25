"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { tr, type Product } from "@/lib/catalog";
import type { Dictionary } from "@/lib/i18n";
import { lookMessage } from "@/lib/tryon";
import {
  downloadPicture,
  exportLook,
  loadGarland,
  loadPerson,
  startingPlacement,
  type Garland,
  type Person,
} from "@/lib/tryonCanvas";
import { waLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "../icons";
import { trackTap } from "../track";
import Turnstile, { turnstileOn } from "./Turnstile";
import { useOverlayGesture } from "./useOverlayGesture";

const pill =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-line bg-white px-2 py-2 text-center text-[13px] leading-tight font-medium text-ink transition hover:border-rose/50 active:scale-[0.98] disabled:opacity-50";

/**
 * The Try On screen. The customer adds a photo, moves the garland into place, and orders the look on WhatsApp.
 * Loaded only when the Try On button is pressed, so other visitors never download it.
 */
export default function VirtualTryOnModal({
  product,
  t,
  onClose,
}: {
  product: Product;
  t: Dictionary;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [garland, setGarland] = useState<Garland | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [busy, setBusy] = useState<"" | "photo" | "order" | "save">("");
  const [message, setMessage] = useState("");
  const [openHref, setOpenHref] = useState("");
  const [token, setToken] = useState("");
  const gesture = useOverlayGesture(stage, { cx: 0.5, cy: 0.58, w: 0.6, rot: 0 });
  const urls = useRef<{ garland?: string; person?: string }>({});
  const name = tr(product.name, "en");

  // Show the screen as a real dialog: focus stays inside it and Escape closes it.
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    const page = document.documentElement;
    const before = page.style.overflow;
    page.style.overflow = "hidden";
    const created = urls.current;
    return () => {
      page.style.overflow = before;
      if (created.garland) URL.revokeObjectURL(created.garland);
      if (created.person) URL.revokeObjectURL(created.person);
    };
  }, []);

  useEffect(() => {
    let stopped = false;
    loadGarland(product.images[0])
      .then((loaded) => {
        if (stopped) return;
        urls.current.garland = loaded.url;
        setGarland(loaded);
      })
      .catch(() => {
        if (!stopped) setMessage(t.tryOnErrorGarland);
      });
    return () => {
      stopped = true;
    };
  }, [product.images, t.tryOnErrorGarland]);

  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !garland) return;
    setBusy("photo");
    setMessage("");
    setOpenHref("");
    try {
      const next = await loadPerson(file);
      if (urls.current.person) URL.revokeObjectURL(urls.current.person);
      urls.current.person = next.url;
      setPerson(next);
      gesture.place(startingPlacement(next, garland));
    } catch {
      setMessage(t.tryOnErrorPhoto);
    } finally {
      setBusy("");
    }
  }

  async function saveImage() {
    if (!person || !garland) return;
    setBusy("save");
    try {
      downloadPicture(await exportLook(person, garland, gesture.placement), "aarifa-flowers-look.jpg");
    } catch {
      setMessage(t.tryOnErrorPhoto);
    } finally {
      setBusy("");
    }
  }

  async function orderLook() {
    if (!person || !garland) return;
    setMessage("");
    setOpenHref("");
    if (turnstileOn && !token) {
      setMessage(t.tryOnCheck);
      return;
    }
    setBusy("order");
    try {
      const picture = await exportLook(person, garland, gesture.placement);
      const form = new FormData();
      form.append("file", picture, "look.jpg");
      if (token) form.append("token", token);
      const response = await fetch("/api/look", { method: "POST", body: form });
      const result = (await response.json().catch(() => ({}))) as { id?: string };
      if (!response.ok || !result.id) throw new Error("upload failed");

      trackTap(product.id);
      const href = waLink(lookMessage(product, result.id));
      setOpenHref(href);
      window.location.assign(href);
    } catch {
      // The photo could not be uploaded. WhatsApp still works: the customer attaches the saved picture in the chat.
      setMessage(t.tryOnErrorUpload);
      setOpenHref(waLink(lookMessage(product)));
    } finally {
      setBusy("");
    }
  }

  const placement = gesture.placement;
  const ready = Boolean(person && garland);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="try-on-title"
      className="m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-cream p-0 text-ink backdrop:bg-black/60 sm:m-auto sm:h-auto sm:max-h-[94dvh] sm:w-[min(94vw,32rem)] sm:rounded-3xl sm:shadow-2xl"
    >
      <div className="flex h-dvh flex-col sm:h-auto sm:max-h-[94dvh]">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-white px-4 py-3">
          <h2 id="try-on-title" className="h-display min-w-0 truncate text-lg font-semibold text-rose-deep">
            {t.tryOnTitle}
          </h2>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label={t.tryOnClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-2xl leading-none text-muted hover:bg-cream-deep"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {!person ? (
            <div className="mx-auto max-w-sm text-center">
              {garland && (
                <div className="photo-bg mx-auto grid aspect-square w-40 place-items-center overflow-hidden rounded-3xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={garland.url} alt={name} className="h-full w-full object-contain p-3" />
                </div>
              )}
              <p className="mt-4 text-base text-ink/90">{garland ? t.tryOnIntro : message || t.tryOnLoading}</p>
              <label
                className={`mt-5 inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-dashed border-rose px-6 py-3 text-base font-semibold text-rose transition hover:bg-rose-soft ${
                  garland && busy === "" ? "" : "pointer-events-none opacity-40"
                }`}
              >
                <span aria-hidden="true">📷</span>
                {busy === "photo" ? t.tryOnPreparing : t.tryOnChoose}
                <input type="file" accept="image/*" className="sr-only" disabled={!garland || busy !== ""} onChange={choosePhoto} />
              </label>
            </div>
          ) : (
            <>
              <div
                ref={stage}
                {...gesture.handlers}
                tabIndex={0}
                role="application"
                aria-label={t.tryOnStage}
                className="relative mx-auto touch-none select-none overflow-hidden rounded-2xl bg-line outline-none [--photo:44dvh] focus-visible:ring-2 focus-visible:ring-rose sm:[--photo:46dvh]"
                style={{ width: `min(100%, calc(var(--photo) * ${person.ratio}))`, aspectRatio: String(person.ratio) }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={person.url} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover" />
                {garland && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={garland.url}
                    alt={name}
                    draggable={false}
                    className="pointer-events-none absolute max-w-none select-none"
                    style={{
                      left: `${placement.cx * 100}%`,
                      top: `${placement.cy * 100}%`,
                      width: `${placement.w * 100}%`,
                      transform: `translate(-50%, -50%) rotate(${placement.rot}deg)`,
                      filter: "drop-shadow(0 3px 5px rgba(0, 0, 0, 0.3))",
                    }}
                  />
                )}
              </div>

              <p className="mt-3 text-center text-sm text-muted">{t.tryOnHint}</p>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <button type="button" className={pill} onClick={() => gesture.nudge(1 / 1.08)}>
                  <span aria-hidden="true">−</span> {t.tryOnSmaller}
                </button>
                <button type="button" className={pill} onClick={() => gesture.nudge(1.08)}>
                  <span aria-hidden="true">+</span> {t.tryOnBigger}
                </button>
                <button type="button" className={pill} onClick={() => gesture.nudge(1, -4)}>
                  <span aria-hidden="true">↺</span> {t.tryOnTurnLeft}
                </button>
                <button type="button" className={pill} onClick={() => gesture.nudge(1, 4)}>
                  <span aria-hidden="true">↻</span> {t.tryOnTurnRight}
                </button>
                <button
                  type="button"
                  className={pill}
                  onClick={() => garland && gesture.place(startingPlacement(person, garland))}
                >
                  {t.tryOnReset}
                </button>
                <label className={`${pill} cursor-pointer`}>
                  <span aria-hidden="true">📷</span> {t.tryOnChange}
                  <input type="file" accept="image/*" className="sr-only" disabled={busy !== ""} onChange={choosePhoto} />
                </label>
              </div>

              <p className="mt-4 text-center text-xs text-muted">{t.tryOnPreview}</p>
            </>
          )}

          <div aria-live="polite" className="mt-3 text-center text-sm">
            {person && message && <p className="font-medium text-red-700">{message}</p>}
            {!person && garland && message && <p className="font-medium text-red-700">{message}</p>}
            {openHref && (
              <a
                href={openHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-wa px-5 py-2.5 font-semibold text-white hover:bg-wa-deep"
              >
                <WhatsAppIcon className="h-5 w-5" />
                {t.tryOnOpenWhatsApp}
              </a>
            )}
          </div>

          {person && turnstileOn && (
            <div className="mt-3 flex justify-center">
              <Turnstile onToken={setToken} />
            </div>
          )}
        </div>

        {person && (
          <footer className="shrink-0 border-t border-line bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={orderLook}
                disabled={!ready || busy !== ""}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-wa px-5 py-3 text-base font-semibold text-white shadow-[0_6px_18px_-6px_rgba(21,128,61,0.7)] transition hover:bg-wa-deep active:scale-[0.98] disabled:opacity-60"
              >
                {busy === "order" ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <WhatsAppIcon className="h-5 w-5" />
                )}
                <span className="leading-tight">{busy === "order" ? t.tryOnPreparing : t.tryOnOrder}</span>
              </button>
              <button type="button" onClick={saveImage} disabled={!ready || busy !== ""} className={`${pill} sm:px-5`}>
                {t.tryOnSave}
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] leading-snug text-muted">{t.tryOnConsent}</p>
          </footer>
        )}
      </div>
    </dialog>
  );
}
