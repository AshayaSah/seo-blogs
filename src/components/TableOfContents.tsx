import { renderInlineMarkdown } from "@/src/lib/markdown";

export type TocSection = { id: string; title: string };

export default function TableOfContents({ sections }: { sections: TocSection[] }) {
  if (sections.length < 2) return null;

  return (
    <nav aria-label="Table of contents" className="mb-8 rounded-xl border border-border bg-muted p-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Table of contents
      </h2>
      <ul className="flex flex-col gap-1.5 text-[0.95rem]">
        {sections.map((section) => (
          <li key={section.id}>
            <a href={`#${section.id}`} className="text-primary hover:underline">
              <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(section.title) }} />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
