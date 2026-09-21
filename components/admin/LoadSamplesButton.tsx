"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { loadSamplesAction } from "@/app/(admin)/admin/actions";

export default function LoadSamplesButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError("");
            const res = await loadSamplesAction();
            if (!res.ok) setError(res.error);
            else router.refresh();
          })
        }
        className="rounded-full border border-rose px-5 py-2.5 text-sm font-semibold text-rose transition hover:bg-rose-soft disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add sample garlands"}
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
