/**
 * Markdown-inside-HTML processing for creator notes.
 *
 * This is a trimmed port of Lumiverse's own `htmlIslandMarkdown` (see
 * LumiRef/frontend/src/components/chat/htmlIslandMarkdown.ts). Instead of
 * handing the whole notes string to a markdown parser (which turns any
 * indented line that follows a blank line into a code block and mangles card
 * HTML), the HTML is tokenised first and markdown is only applied to the *text*
 * that sits between tags:
 *
 *  - text directly inside block containers (div, section, li, td, ...) is
 *    rendered as block markdown,
 *  - text inside inline/phrasing containers (span, a, p, headings, ...) is
 *    rendered as inline markdown,
 *  - whitespace-only text (indentation between tags) is left untouched,
 *  - <style>, <script>, <pre>, <code> and <svg> subtrees are never touched.
 */

const STYLE_PLACEHOLDER_RE = /^<!--ISLAND_STYLE_\d+-->$/;
const VOID_HTML_TAG_RE = /^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b/i;
const RAW_TEXT_CONTEXT_TAGS = new Set(["code", "pre", "script"]);
const NO_MARKDOWN_SUBTREE_TAGS = new Set(["svg"]);

// Tags the sanitizer keeps. Unknown tags (card pseudo markers such as <close>)
// must not establish markdown context or an unclosed one would force inline
// rendering for the rest of the notes.
const KEPT_TAGS = new Set([
  "a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b",
  "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas",
  "caption", "center", "cite", "code", "col", "colgroup", "content", "data",
  "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt",
  "em", "fieldset", "figcaption", "figure", "font", "footer", "h1", "h2", "h3",
  "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img",
  "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark",
  "marquee", "menu", "meter", "nav", "nobr", "ol", "optgroup", "option",
  "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s",
  "samp", "section", "select", "small", "source", "spacer", "span", "strike",
  "strong", "style", "sub", "summary", "sup", "svg", "table", "tbody", "td",
  "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt",
  "u", "ul", "var", "video", "wbr",
]);

// Only these containers may promote child text into block markdown (headings,
// lists, ...). Everything else stays inline to avoid emitting invalid HTML such
// as <span><h1>..</h1></span>.
const BLOCK_MARKDOWN_PARENT_TAGS = new Set([
  "article", "aside", "blockquote", "body", "dd", "details", "div", "fieldset",
  "figcaption", "figure", "footer", "header", "html", "li", "main", "nav",
  "section", "td", "th",
]);

export interface IslandMarkdownRenderer {
  renderBlockText: (markdown: string) => string;
  renderInlineText: (markdown: string) => string;
}

interface TagStack {
  tags: string[];
  positions: Map<string, number[]>;
}

function updateTagStack(part: string, stack: TagStack, rawText: { depth: number }): void {
  const close = part.match(/^<\/([a-z][\w:-]*)\b/i);
  if (close) {
    const tag = close[1].toLowerCase();
    if (RAW_TEXT_CONTEXT_TAGS.has(tag)) rawText.depth = Math.max(0, rawText.depth - 1);
    if (!KEPT_TAGS.has(tag) || stack.tags.length === 0) return;
    const idx = stack.positions.get(tag)?.pop();
    if (idx !== undefined) {
      // Closing a mismatched tag must not repeatedly shift its descendants.
      stack.tags[idx] = "";
      while (stack.tags[stack.tags.length - 1] === "") stack.tags.pop();
    }
    return;
  }

  const open = part.match(/^<([a-z][\w:-]*)\b/i);
  if (!open) return;

  const tag = open[1].toLowerCase();
  if (RAW_TEXT_CONTEXT_TAGS.has(tag)) rawText.depth += 1;
  if (!KEPT_TAGS.has(tag)) return;

  const selfClosing = /\/\s*>$/.test(part) || VOID_HTML_TAG_RE.test(part);
  if (!selfClosing) {
    let positions = stack.positions.get(tag);
    if (!positions) {
      positions = [];
      stack.positions.set(tag, positions);
    }
    positions.push(stack.tags.length);
    stack.tags.push(tag);
  }
}

function shouldRenderInline(stack: TagStack): boolean {
  const current = stack.tags[stack.tags.length - 1];
  return current != null && !BLOCK_MARKDOWN_PARENT_TAGS.has(current);
}

function isMarkdownExcluded(stack: TagStack): boolean {
  if (stack.tags.length === 0) return false;
  for (const tag of NO_MARKDOWN_SUBTREE_TAGS) {
    if (stack.positions.get(tag)?.length) return true;
  }
  return false;
}

export function processMarkdownInHtml(html: string, renderer: IslandMarkdownRenderer): string {
  // Shield <style> blocks behind placeholders so their CSS is never tokenised.
  const styleBlocks = new Map<string, string>();
  const chunks: string[] = [];
  const styleOpen = /<style[\s>]/gi;
  const styleClose = /<\/style\s*>/gi;
  let cursor = 0;
  let open: RegExpExecArray | null;
  while ((open = styleOpen.exec(html)) !== null) {
    styleClose.lastIndex = styleOpen.lastIndex;
    if (!styleClose.exec(html)) break;
    const marker = "<!--ISLAND_STYLE_" + styleBlocks.size + "-->";
    chunks.push(html.slice(cursor, open.index), marker);
    cursor = styleClose.lastIndex;
    styleBlocks.set(marker, html.slice(open.index, cursor));
    styleOpen.lastIndex = cursor;
  }
  chunks.push(html.slice(cursor));

  const parts = chunks.join("").split(/(<[^>]*>)/);
  const restore = (part: string): string =>
    styleBlocks.size > 0 && part.includes("<!--ISLAND_STYLE_")
      ? part.replace(/<!--ISLAND_STYLE_\d+-->/g, (m) => styleBlocks.get(m) ?? m)
      : part;

  const stack: TagStack = { tags: [], positions: new Map() };
  const rawText = { depth: 0 };
  const out: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    // Odd indices are tags/comments, even indices are the text between them.
    if (i % 2 === 1) {
      out.push(part.startsWith("<!--") ? restore(part) : part);
      if (!part.startsWith("<!--")) updateTagStack(part, stack, rawText);
      continue;
    }

    if (rawText.depth > 0 || isMarkdownExcluded(stack) || STYLE_PLACEHOLDER_RE.test(part.trim())) {
      out.push(part);
      continue;
    }
    if (!part.trim()) {
      out.push(part);
      continue;
    }

    out.push(shouldRenderInline(stack) ? renderer.renderInlineText(part) : renderer.renderBlockText(part));
  }

  return out.join("");
}
