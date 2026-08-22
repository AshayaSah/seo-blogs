import { marked, parseInline } from "marked";

// GitHub-flavored markdown, synchronous rendering for server components.
marked.setOptions({ gfm: true, breaks: false, async: false });

/**
 * Render a post body to HTML.
 *
 * NOTE: `content_body` is first-party (produced by our agent and gated by the
 * admin review flow), so it is trusted here. If untrusted authors ever gain
 * write access, pipe this through a sanitizer (e.g. sanitize-html / DOMPurify)
 * before rendering with dangerouslySetInnerHTML.
 */
export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown) as string;
}

/**
 * Render a single line of inline markdown (bold, italic, code spans, links).
 * No block elements — use for post titles and section titles.
 */
export function renderInlineMarkdown(md: string): string {
  return parseInline(md, { async: false }) as string;
}

/**
 * Strip all markdown/HTML syntax from a string, returning plain text.
 * Used for character-length checks, JSON-LD headlines, and <title>/OG tags
 * where semantics require the visible text, not the markup.
 */
export function stripMarkdown(md: string): string {
  const html = renderInlineMarkdown(md);
  return html.replace(/<[^>]+>/g, "");
}
