"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { deleteReviewAction, saveReviewAction } from "@/app/(admin)/admin/actions";
import type { Review } from "@/lib/content";
import ImageUploader, { type UploaderHandle } from "./ImageUploader";

const field =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-rose focus:ring-2 focus:ring-rose/20";

export default function ReviewForm({ review }: { review?: Review }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");
  const [waiting, setWaiting] = useState(0);
  const uploader = useRef<UploaderHandle>(null);

  const [name, setName] = useState(review?.name ?? "");
  const [event, setEvent] = useState(review?.event ?? "");
  const [text, setText] = useState(review?.text ?? "");
  const [rating, setRating] = useState(review?.rating ?? 5);
  const [photo, setPhoto] = useState<string | null>(review?.photo ?? null);
  const [published, setPublished] = useState(review?.published ?? true);

  const save = () => {
    setError("");
    if (!name.trim()) return setError("Please enter the customer name.");
    if (!text.trim()) return setError("Please enter what the customer said.");
    start(async () => {
      let finalPhoto = photo;
      if (waiting > 0) {
        setStage("Adding the photo…");
        try {
          finalPhoto = ((await uploader.current?.flush()) ?? [])[0] ?? photo;
        } catch (err) {
          setStage("");
          setError(err instanceof Error ? err.message : "The photo could not be uploaded. Nothing was saved.");
          return;
        }
      }
      setStage("Saving…");
      const res = await saveReviewAction({ id: review?.id, name, event, text, rating, photo: finalPhoto, published });
      setStage("");
      if (!res.ok) return setError(res.error);
      router.push("/admin/reviews");
      router.refresh();
    });
  };

  const remove = () => {
    if (!review || !window.confirm(`Delete the story from ${review.name}? This cannot be undone.`)) return;
    start(async () => {
      const res = await deleteReviewAction(review.id);
      if (!res.ok) return setError(res.error);
      router.push("/admin/reviews");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">{review ? "Edit customer story" : "Add a customer story"}</h1>
        <Link href="/admin/reviews" className="flex min-h-11 items-center text-sm font-medium text-muted hover:text-rose">
          ← Back to list
        </Link>
      </div>

      <section className="rounded-3xl border border-line bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Customer</h2>
        <p className="mt-0.5 text-sm text-muted">
          Use the first name and the area, for example Ananya S., Banjara Hills. Only add what the customer agreed to
          share.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
              Name and area <span className="text-rose">*</span>
            </label>
            <input id="name" className={field} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="event" className="mb-1.5 block text-sm font-medium text-ink">
              Event <span className="font-normal text-muted">optional</span>
            </label>
            <input
              id="event"
              className={field}
              value={event}
              maxLength={80}
              placeholder="Wedding varmala, Ganesh pooja, housewarming"
              onChange={(e) => setEvent(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="text" className="mb-1.5 block text-sm font-medium text-ink">
              What they said <span className="text-rose">*</span>
            </label>
            <textarea
              id="text"
              rows={4}
              className={field}
              value={text}
              maxLength={600}
              onChange={(e) => setText(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted">Write it as the customer said it, in their own words.</p>
          </div>
          <div>
            <p id="rating-label" className="mb-1.5 text-sm font-medium text-ink">
              Rating
            </p>
            <div role="radiogroup" aria-labelledby="rating-label" className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  onClick={() => setRating(n)}
                  className={`h-12 w-12 rounded-xl text-2xl transition ${
                    n <= rating ? "bg-marigold-soft text-marigold" : "text-line hover:bg-cream-deep"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Photo</h2>
        <p className="mt-0.5 text-sm text-muted">Optional. A real photo from the event builds the most trust.</p>
        <div className="mt-4">
          <ImageUploader
            ref={uploader}
            images={photo ? [photo] : []}
            onChange={(next) => setPhoto(next[0] ?? null)}
            onWaitingChange={setWaiting}
            maxPhotos={1}
            autoRemoveDefault={false}
          />
        </div>
      </section>

      <button
        type="button"
        role="switch"
        aria-checked={published}
        onClick={() => setPublished((p) => !p)}
        className="flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4 text-start"
      >
        <span>
          <span className="block font-medium text-ink">Show on the website</span>
          <span className="block text-sm text-muted">Customers see it in Customer stories on the home page.</span>
        </span>
        <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${published ? "bg-leaf" : "bg-line"}`}>
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
              published ? "start-[1.4rem]" : "start-0.5"
            }`}
          />
        </span>
      </button>

      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-cream/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        {review ? (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="min-h-12 rounded-full px-4 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Delete story
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/reviews"
            className="flex min-h-12 items-center rounded-full border border-line bg-white px-5 text-sm font-medium text-ink"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="min-h-12 rounded-full bg-rose px-7 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(184,50,90,0.8)] transition hover:bg-rose-deep disabled:opacity-60"
          >
            {pending ? stage || "Saving…" : "Save story"}
          </button>
        </div>
      </div>
    </form>
  );
}
