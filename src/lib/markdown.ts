import { marked } from "marked";

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
