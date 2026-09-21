/**
 * Counts one tap on a WhatsApp button. Sends only the garland id, never anything about the visitor.
 * Uses sendBeacon so the count still arrives while WhatsApp opens.
 */
export function trackTap(id: string): void {
  try {
    const body = new Blob([JSON.stringify({ id })], { type: "application/json" });
    if (!navigator.sendBeacon("/api/track", body)) {
      void fetch("/api/track", { method: "POST", body, keepalive: true });
    }
  } catch {
    // Counting is a bonus. It must never get in the way of opening WhatsApp.
  }
}
