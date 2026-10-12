import { marked } from "marked";
import DOMPurify from "dompurify";
import { processMarkdownInHtml } from "./island-markdown";

function getPurify(): typeof DOMPurify {
  if (typeof (DOMPurify as any)?.sanitize === "function") return DOMPurify;
  if (typeof (DOMPurify as any)?.default?.sanitize === "function") return (DOMPurify as any).default;
  if (typeof DOMPurify === "function") {
    const root = typeof window !== "undefined" ? window : (globalThis as any).window;
    if (root) return (DOMPurify as any)(root);
  }
  return DOMPurify;
}

/**
 * Creator-notes rendering pipeline.
 *
 * Mirrors how Lumiverse renders card HTML in chat (see the html-islands docs):
 * markdown is applied to text between tags, never to the HTML as a whole;
 * <style> blocks are pulled out, sanitised and returned separately; the
 * remaining markup is sanitised with DOMPurify.
 */

export interface RenderedNotes {
  /** Sanitised body markup (no <style> elements). */
  html: string;
  /** Sanitised author CSS, with @import / @font-face removed (see `hoisted`). */
  css: string;
  /**
   * @import (Google Fonts only) and @font-face rules. Fonts declared inside a
   * shadow root are not registered by browsers, so these must live in the
   * document stylesheet in every render mode.
   */
  hoisted: string;
}

const HAS_HTML_RE = /<\/?[a-z][\w:-]*(?:\s[^>]*)?\/?>/i;
const DOCUMENT_HTML_RE = /<(?:!doctype\b|html\b|head\b|body\b)/i;
const STYLE_TAG_RE = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi;
const FENCE_RE = /^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[`~]*[ \t]*$/gm;
const SAFE_DATA_IMAGE_RE = /^data:image\/(?:png|apng|jpeg|jpg|gif|webp|avif|bmp);/i;
const FORBID_TAGS = ["script", "iframe", "frame", "object", "embed", "meta", "base", "link", "math", "style", "form"];
const FORBID_ATTR = ["srcdoc", "formaction"];
const ALLOWED_IMPORT_HOSTS = new Set(["fonts.googleapis.com"]);

// ── Markdown ────────────────────────────────────────────────────────────────

function parseBlock(markdown: string): string {
  return marked.parse(markdown, { async: false, breaks: true, gfm: true }) as string;
}

function parseInline(markdown: string): string {
  return marked.parseInline(markdown, { async: false, breaks: true, gfm: true }) as string;
}

function renderBlockText(markdown: string): string {
  const leading = markdown.match(/^\s*/)?.[0] ?? "";
  const trailing = markdown.match(/(?<!\s)\s*$/)?.[0] ?? "";
  const core = markdown.trim();
  if (!core) return markdown;

  let html = parseBlock(core);
  // A lone <p> is marked wrapping a piece of a tag-split sentence: unwrap it so
  // the sentence stays inline, unless the text was set apart by a blank line.
  const blockSeparated = /\n[^\S\n]*\n/.test(leading) || /\n[^\S\n]*\n/.test(trailing);
  const single = html.match(/^<p>([\s\S]*)<\/p>\s*$/);
  if (!blockSeparated && single && !/<\/p>\s*<p\b/i.test(html)) html = single[1];
  return `${leading}${html}${trailing}`;
}

function renderInlineText(markdown: string): string {
  const leading = markdown.match(/^\s*/)?.[0] ?? "";
  const trailing = markdown.match(/(?<!\s)\s*$/)?.[0] ?? "";
  const core = markdown.trim();
  if (!core) return markdown;
  return `${leading}${parseInline(core)}${trailing}`;
}

/** Full documents (<html>/<body>) are reduced to their <style>s + body markup. */
function normalizeDocumentHtml(html: string): string {
  if (!DOCUMENT_HTML_RE.test(html)) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const parts: string[] = [];
  for (const style of doc.head.querySelectorAll("style")) parts.push(style.outerHTML);
  const body = doc.body.innerHTML.trim();
  if (body) parts.push(body);
  return parts.length > 0 ? parts.join("\n") : html;
}

/** Apply markdown to `raw`, leaving fenced code to the markdown parser. */
function applyMarkdown(raw: string): string {
  const pieces: string[] = [];
  let cursor = 0;

  const flush = (segment: string): void => {
    if (!segment.trim()) {
      pieces.push(segment);
      return;
    }
    pieces.push(HAS_HTML_RE.test(segment) ? processMarkdownInHtml(segment, { renderBlockText, renderInlineText }) : parseBlock(segment));
  };

  FENCE_RE.lastIndex = 0;
  for (let m = FENCE_RE.exec(raw); m; m = FENCE_RE.exec(raw)) {
    flush(raw.slice(cursor, m.index));
    pieces.push(parseBlock(m[0]));
    cursor = m.index + m[0].length;
  }
  flush(raw.slice(cursor));
  return pieces.join("\n");
}

// ── CSS ─────────────────────────────────────────────────────────────────────

function sanitizeCss(css: string): string {
  return css
    .replace(/<\/style/gi, "<\\/style")
    .replace(/url\(\s*(['"]?)\s*javascript:[\s\S]*?\)/gi, "url($1about:blank)")
    .replace(/\bexpression\s*\(/gi, "x-expression(")
    .replace(/\b(?:behavior|-moz-binding)\s*:/gi, "x-blocked-property:");
}

function isAllowedImport(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl.trim());
    return url.protocol === "https:" && ALLOWED_IMPORT_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

/** Split @import (allow-listed) and @font-face out of the author CSS. */
function splitHoistedCss(css: string): { hoisted: string; rest: string } {
  const hoisted: string[] = [];

  let rest = css
    .replace(/@import\s+url\(\s*(['"]?)(.*?)\1\s*\)[^;]*;?/gi, (match, _q: string, url: string) => {
      if (isAllowedImport(url)) hoisted.push(match.trim().replace(/;?$/, ";"));
      return "";
    })
    .replace(/@import\s+(['"])(.*?)\1[^;]*;?/gi, (match, _q: string, url: string) => {
      if (isAllowedImport(url)) hoisted.push(match.trim().replace(/;?$/, ";"));
      return "";
    });

  rest = rest.replace(/@font-face\s*\{[^}]*\}/gi, (match) => {
    hoisted.push(match);
    return "";
  });

  return { hoisted: hoisted.join("\n"), rest };
}

/**
 * Re-target page-level selectors (`html`, `body`, `:root`) at a stand-in
 * element. Used when the notes are confined to the widget, where there is no
 * real <body> for card CSS such as `body { background: ... }` or
 * `body:before { position: fixed }` to hit.
 */
export function scopePageSelectors(css: string, scope: string): string {
  return css.replace(/([^{}@;]+)\{/g, (match, prelude: string) => {
    const scoped = prelude
      .replace(/:root\b/gi, scope)
      .replace(/(^|[\s,>+~(])(?:html|body)(?![\w-])/gi, `$1${scope}`);
    return scoped === prelude ? match : `${scoped}{`;
  });
}

// ── HTML ────────────────────────────────────────────────────────────────────

function isAllowedImageSrc(src: string): boolean {
  const trimmed = src.trim();
  if (!trimmed) return false;
  if (SAFE_DATA_IMAGE_RE.test(trimmed) || trimmed.startsWith("blob:")) return true;
  if (!/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(trimmed)) return true; // relative
  try {
    const url = new URL(trimmed, window.location.origin);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeMarkup(html: string): string {
  const purify = getPurify();
  const fragment = purify.sanitize(html, {
    ADD_ATTR: (name: string) => {
      const n = name.toLowerCase();
      return n.includes("-") && !n.startsWith("data-") && !n.startsWith("aria-") && !n.includes(":");
    },
    ALLOW_DATA_ATTR: true,
    ALLOW_ARIA_ATTR: true,
    FORBID_TAGS,
    FORBID_ATTR,
    RETURN_DOM_FRAGMENT: true,
  }) as DocumentFragment;

  for (const a of fragment.querySelectorAll("a[href], area[href]")) {
    const href = a.getAttribute("href") || "";
    if (/^\s*(?:javascript|data|vbscript):/i.test(href)) {
      a.removeAttribute("href");
    } else {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    }
  }

  for (const img of fragment.querySelectorAll("img")) {
    if (!isAllowedImageSrc(img.getAttribute("src") || "")) {
      img.remove();
      continue;
    }
    img.removeAttribute("srcset");
    if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
  }

  const wrapper = document.createElement("div");
  wrapper.appendChild(fragment);
  return wrapper.innerHTML;
}

// ── Public API ──────────────────────────────────────────────────────────────

export function renderNotes(source: string): RenderedNotes {
  const raw = normalizeDocumentHtml(source.replace(/\r\n?/g, "\n"));
  const withMarkdown = applyMarkdown(raw);

  const cssBlocks: string[] = [];
  const markup = withMarkdown.replace(STYLE_TAG_RE, (_m, css: string) => {
    const clean = sanitizeCss(css);
    if (clean.trim()) cssBlocks.push(clean);
    return "";
  });

  const { hoisted, rest } = splitHoistedCss(cssBlocks.join("\n"));
  return { html: sanitizeMarkup(markup), css: rest, hoisted };
}
