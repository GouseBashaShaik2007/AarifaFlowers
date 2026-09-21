// Garlands a visitor has saved with the heart button. They live only in this browser, so no account is needed.
// Browser only. Read it with useSaved(), which stays in step across every heart and the header.

import { useSyncExternalStore } from "react";
import { MAX_SAVED } from "./savedLimit";

export { MAX_SAVED };

const KEY = "aarifa-saved";
const EMPTY: readonly string[] = [];

let cache: readonly string[] | null = null;
let toast = "";
let toastTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function read(): readonly string[] {
  try {
    const list: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list)
      ? list.filter((v): v is string => typeof v === "string" && /^[a-z0-9-]{1,80}$/.test(v)).slice(0, MAX_SAVED)
      : EMPTY;
  } catch {
    return EMPTY;
  }
}

function getSaved(): readonly string[] {
  if (cache === null) cache = read();
  return cache;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Another tab saved or removed a garland.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The saved garland ids, oldest first. Empty on the server and during the first browser render. */
export function useSaved(): readonly string[] {
  return useSyncExternalStore(subscribe, getSaved, () => EMPTY);
}

/** True once the page is running in the browser, so we never claim "nothing saved" before we have looked. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** Saves or removes one garland. Returns "full" when the list already has the most it can hold. */
export function toggleSaved(id: string): "added" | "removed" | "full" {
  const list = getSaved();
  let next: readonly string[];
  let result: "added" | "removed" | "full";
  if (list.includes(id)) {
    next = list.filter((v) => v !== id);
    result = "removed";
  } else if (list.length >= MAX_SAVED) {
    return "full";
  } else {
    next = [...list, id];
    result = "added";
  }
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private windows can refuse to store. The heart still works until the page is closed.
  }
  notify();
  return result;
}

/** A short message shown at the bottom of the screen for a few seconds. */
export function showToast(message: string): void {
  toast = message;
  notify();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast = "";
    notify();
  }, 2800);
}

export function useToast(): string {
  return useSyncExternalStore(
    subscribe,
    () => toast,
    () => "",
  );
}
