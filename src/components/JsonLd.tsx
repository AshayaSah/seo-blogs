/**
 * Renders a JSON-LD structured-data block. Escapes `<` to `<` per the
 * Next.js JSON-LD guidance to avoid HTML/XSS injection via string fields.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
