/** A thin bar at the very top of every page. The owner writes the text in the admin page. */
export default function AnnouncementBar({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <div
      role="note"
      className="border-b border-line bg-marigold-soft px-4 py-2 text-center text-[13px] font-medium leading-snug text-ink sm:text-sm"
    >
      {text}
    </div>
  );
}
