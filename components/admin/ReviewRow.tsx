"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteReviewAction, setReviewPublishedAction } from "@/app/(admin)/admin/actions";
import { thumbOf } from "@/lib/catalog";
import type { Review } from "@/lib/content";

export default function ReviewRow({ review }: { review: Review }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [published, setPublished] = useState(review.published);
  const [error, setError] = useState("");

  const toggle = () => {
    setError("");
    setPublished((p) => !p);
    start(async () => {
      const res = await setReviewPublishedAction(review.id, !published);
      if (!res.ok) {
        setPublished((p) => !p);
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  };

  const remove = () => {
    if (!window.confirm(`Delete the story from ${review.name}? This cannot be undone.`)) return;
    start(async () => {
      const res = await deleteReviewAction(review.id);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  };

  return (
    <li className="rounded-2xl border border-line bg-white p-3 sm:p-4">
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-cream-deep">
          {review.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbOf(review.photo)} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full place-items-center text-2xl">💬</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{review.name}</p>
          <p className="text-sm text-marigold" aria-label={`${review.rating} out of 5 stars`}>
            {"★".repeat(review.rating)}
            <span className="text-line">{"★".repeat(5 - review.rating)}</span>
            {review.event && <span className="ms-2 text-xs text-muted">{review.event}</span>}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{review.text}</p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={published}
          onClick={toggle}
          disabled={pending}
          className={`flex min-h-12 flex-1 items-center justify-between gap-3 rounded-xl border px-3 text-sm font-medium disabled:opacity-60 ${
            published ? "border-leaf/40 bg-mint-soft text-ink" : "border-line bg-white text-muted"
          }`}
        >
          <span>{published ? "Shown on website" : "Hidden"}</span>
          <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${published ? "bg-leaf" : "bg-line"}`}>
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                published ? "start-[1.4rem]" : "start-0.5"
              }`}
            />
          </span>
        </button>
        <Link
          href={`/admin/reviews/${review.id}`}
          className="flex min-h-12 items-center rounded-xl border border-line px-5 font-semibold text-ink hover:border-rose hover:text-rose"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="min-h-12 rounded-xl px-3 font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          Delete
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </li>
  );
}
