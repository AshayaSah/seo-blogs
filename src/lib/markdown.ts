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

/**
 * Demote every <h1> in rendered article HTML to <h2>. Article bodies may be
 * ingested with `# …` (or literal <h1>) headings, but a page may only have one
 * <h1> — the post title rendered by the page template. Promotes nothing; the
 * sole <h1> lives outside the article body.
 */
export function demoteH1ToH2(html: string): string {
  return html
    .replace(/<h1(\s[^>]*)?>/gi, "<h2$1>")
    .replace(/<\/h1>/gi, "</h2>");
}

/**
 * Render a post body or section to HTML, then normalize heading levels so the
 * article never emits an <h1> from its own content.
 */
export function renderArticleHtml(content: string, format: "markdown" | "html"): string {
  const html = format === "html" ? content : renderMarkdown(content);
  return demoteH1ToH2(html);
}

/** Word-safe truncation with a trailing ellipsis, for metas and previews. */
export function limitText(text: string | null | undefined, max = 160): string {
  if (!text) return "";
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1).split(/\s/);
  cut.pop();
  const truncated = cut.join(" ").replace(/[,;:]+$/, "");
  return `${truncated}…`;
}
