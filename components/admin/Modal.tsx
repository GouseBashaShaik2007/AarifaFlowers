"use client";

import { useEffect, useRef } from "react";

/**
 * A pop-up box built on the browser's own dialog element. It closes with the Escape key,
 * keeps keyboard focus inside, and closes when you tap the dark area around it.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl bg-white p-0 text-ink shadow-2xl backdrop:bg-black/45"
    >
      <div className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </dialog>
  );
}
