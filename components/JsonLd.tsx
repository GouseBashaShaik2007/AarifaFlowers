/**
 * Facts about the business or a garland, written for search engines such as Google. Visitors never see it.
 * The "<" is escaped so that no text in the data can end the script early.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
