"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { bulkUpdateAction, markAllFreshAction } from "@/app/(admin)/admin/actions";
import Modal from "./Modal";

const UNDO_SECONDS = 15;

type Toast = { kind: "done"; ids: string[] } | { kind: "undone" } | { kind: "error"; message: string };

/** The morning button: turn Fresh Today on for every garland, then switch off what you cannot make today. */
export default function DailyReset({ total, notFresh }: { total: number; notFresh: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [pending, start] = useTransition();

  // The undo notice goes away on its own.
  useEffect(() => {
    if (!toast || toast.kind === "error") return;
    const timer = setTimeout(() => setToast(null), toast.kind === "done" ? UNDO_SECONDS * 1000 : 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const reset = () => {
    setConfirming(false);
    start(async () => {
      const res = await markAllFreshAction();
      if (!res.ok) {
        setToast({ kind: "error", message: res.error });
        return;
      }
      setToast({ kind: "done", ids: res.ids ?? [] });
      router.refresh();
    });
  };

  const undo = (ids: string[]) => {
    start(async () => {
      const res = await bulkUpdateAction(ids, { available: false });
      setToast(res.ok ? { kind: "undone" } : { kind: "error", message: res.error });
      router.refresh();
    });
  };

  const nothingToDo = notFresh === 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={pending || total === 0}
        className="min-h-12 rounded-full border border-leaf bg-mint-soft px-5 text-sm font-semibold text-leaf transition hover:bg-leaf hover:text-white disabled:opacity-50"
      >
        🌿 Mark all Fresh Today
      </button>

      <Modal open={confirming} onClose={() => setConfirming(false)} title={`Mark all ${total} garlands as Fresh Today?`}>
        <p className="text-sm text-muted">
          {nothingToDo
            ? "Every garland is already marked Fresh Today, so nothing will change."
            : notFresh === 1
              ? "1 garland is marked Not available right now. It will be turned on. You can undo this straight afterwards."
              : `${notFresh} garlands are marked Not available right now. They will all be turned on. You can undo this straight afterwards.`}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={reset}
            disabled={nothingToDo}
            className="min-h-12 flex-1 rounded-xl bg-leaf px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Yes, mark all
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="min-h-12 flex-1 rounded-xl border border-line bg-white px-5 text-sm font-semibold text-ink"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {toast && (
        <div
          role={toast.kind === "error" ? "alert" : "status"}
          className={`fixed inset-x-3 top-3 z-[70] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm shadow-xl ${
            toast.kind === "error" ? "bg-red-600 text-white" : "bg-ink text-white"
          }`}
        >
          <span>
            {toast.kind === "done" &&
              (toast.ids.length === 0
                ? "Everything was already Fresh Today."
                : `Marked ${toast.ids.length} garland${toast.ids.length === 1 ? "" : "s"} Fresh Today.`)}
            {toast.kind === "undone" && "Undone."}
            {toast.kind === "error" && toast.message}
          </span>
          {toast.kind === "done" && toast.ids.length > 0 && (
            <button
              type="button"
              onClick={() => undo(toast.ids)}
              disabled={pending}
              className="min-h-11 shrink-0 rounded-lg px-3 font-semibold text-marigold underline-offset-2 hover:underline disabled:opacity-60"
            >
              Undo
            </button>
          )}
          {toast.kind === "error" && (
            <button type="button" onClick={() => setToast(null)} className="min-h-11 shrink-0 px-2 font-semibold">
              Close
            </button>
          )}
        </div>
      )}
    </>
  );
}
