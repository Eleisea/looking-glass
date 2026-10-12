import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import { NOTES_CSS } from "./styles";
import { ICON_CLOSE, ICON_EMPTY, ICON_GLASS } from "./icons";
import { loadSettings, type LgSettings } from "./settings";
import { renderNotes, scopePageSelectors, type RenderedNotes } from "../render/pipeline";

export type NotesStatus = "loading" | "ok" | "empty" | "no_chat" | "error";

export interface NotesPayload {
  status: NotesStatus;
  /** Resolved creator notes when `status` is "ok"; a human-readable message otherwise. */
  text: string;
}

export interface NotesWindow {
  show(): void;
  hide(): void;
  toggle(): void;
  isOpen(): boolean;
  hasNotes(): boolean;
  setNotes(payload: NotesPayload): void;
  setCharacterId(id: string): void;
  setSettings(settings: LgSettings): void;
  destroy(): void;
}

interface Overlay {
  root: HTMLElement;
  destroy(): void;
}

const BODY_SCOPE = ".lg-body";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Page-level mount. Uses the Spindle app-mount API (needs the
 * `app_manipulation` permission) and only falls back to a plain body child if
 * the host refuses, so the extension keeps working until it is granted.
 */
function mountOverlay(ctx: SpindleFrontendContext, className: string): Overlay {
  try {
    const handle = ctx.ui.mountApp({ className, position: "end" });
    return { root: handle.root, destroy: () => handle.destroy() };
  } catch (err) {
    console.warn("[Looking Glass] mountApp unavailable (grant 'app_manipulation' to Looking Glass); using document.body", err);
    const root = document.createElement("div");
    root.className = className;
    document.body.appendChild(root);
    return { root, destroy: () => root.remove() };
  }
}

/** A single <style> in the host document, managed through the DOM helper. */
function createStyleSlot(ctx: SpindleFrontendContext) {
  let remove: (() => void) | null = null;
  let current = "";
  const set = (css: string): void => {
    if (css === current) return;
    remove?.();
    remove = null;
    current = css;
    if (css) remove = ctx.dom.addStyle(css);
  };
  return { set, clear: () => set("") };
}

/**
 * Top-level elements the notes position with `position: fixed` (blood rain,
 * fog, vignettes...). These are the "ambient" layer of a card.
 */
function findFixedRoots(container: HTMLElement): HTMLElement[] {
  const roots: HTMLElement[] = [];
  for (const el of Array.from(container.querySelectorAll<HTMLElement>("*"))) {
    if (getComputedStyle(el).position !== "fixed") continue;
    if (roots.some((root) => root.contains(el))) continue;
    roots.push(el);
  }
  return roots;
}

export function createNotesWindow(ctx: SpindleFrontendContext): NotesWindow {
  const STORAGE_KEY_PREFS = "looking-glass-window-prefs";
  const savedPrefs = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFS) || "{}");

  let settings: LgSettings = loadSettings();
  let notes: NotesPayload = { status: "loading", text: "" };
  let open = false;

  let rendered: RenderedNotes | null = null;
  let renderedFor = "";
  let windowKey = "";
  let layerKey = "";
  let layer: Overlay | null = null;

  const hoistedStyle = createStyleSlot(ctx);
  const globalStyle = createStyleSlot(ctx);

  // ── Widget window (Shadow DOM) ────────────────────────────────────────────
  const overlay = mountOverlay(ctx, "lg-window-host");
  const host = overlay.root;
  Object.assign(host.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    zIndex: "10000",
    pointerEvents: "none",
    display: "none", // start hidden
  });

  const shadow = host.attachShadow({ mode: "open" });

  const baseStyle = document.createElement("style");
  baseStyle.textContent = NOTES_CSS;
  shadow.appendChild(baseStyle);

  // Author CSS from the notes, scoped to this shadow root.
  const authorStyle = document.createElement("style");
  shadow.appendChild(authorStyle);

  const root = document.createElement("div");
  root.className = "lg-window";
  root.style.width = "400px";
  root.style.height = "500px";
  root.style.top = "100px";
  root.style.right = "100px";
  root.style.pointerEvents = "auto";

  if (savedPrefs.width) root.style.width = savedPrefs.width;
  if (savedPrefs.height) root.style.height = savedPrefs.height;
  if (savedPrefs.top) root.style.top = savedPrefs.top;
  if (savedPrefs.left) root.style.left = savedPrefs.left;
  if (savedPrefs.right && !savedPrefs.left) root.style.right = savedPrefs.right;

  const header = document.createElement("div");
  header.className = "lg-window-header";
  header.innerHTML = `
    <div class="lg-window-title">${ICON_GLASS} Looking Glass</div>
    <div class="lg-window-controls">
      <button class="lg-window-close" title="Close">${ICON_CLOSE}</button>
    </div>
  `;

  // The viewport is the notes' stand-in <body> and confines fixed elements.
  const viewport = document.createElement("div");
  viewport.className = "lg-viewport lg-body";

  const content = document.createElement("div");
  content.className = "lg-window-content";
  viewport.appendChild(content);

  const resizeHandle = document.createElement("div");
  resizeHandle.className = "lg-window-resize-handle";

  root.appendChild(header);
  root.appendChild(viewport);
  root.appendChild(resizeHandle);
  shadow.appendChild(root);

  // ── Drag / resize ─────────────────────────────────────────────────────────
  let isDragging = false;
  let isResizing = false;
  let startX = 0, startY = 0, startW = 0, startH = 0, startTop = 0, startLeft = 0;

  function savePrefs() {
    const prefs = { width: root.style.width, height: root.style.height, top: root.style.top, left: root.style.left };
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
  }

  header.addEventListener("mousedown", (e) => {
    if ((e.target as HTMLElement).closest("button")) return;
    isDragging = true;
    startX = e.clientX; startY = e.clientY;
    const rect = root.getBoundingClientRect();
    startTop = rect.top; startLeft = rect.left;
    header.style.cursor = "grabbing";
    e.preventDefault();
  });

  resizeHandle.addEventListener("mousedown", (e) => {
    isResizing = true;
    startX = e.clientX; startY = e.clientY;
    startW = root.offsetWidth; startH = root.offsetHeight;
    e.preventDefault();
  });

  const onMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      root.style.top = `${startTop + (e.clientY - startY)}px`;
      root.style.left = `${startLeft + (e.clientX - startX)}px`;
      root.style.right = "auto";
    } else if (isResizing) {
      root.style.width = `${Math.max(280, startW + (e.clientX - startX))}px`;
      root.style.height = `${Math.max(200, startH + (e.clientY - startY))}px`;
    }
  };

  const onMouseUp = () => {
    if (isDragging || isResizing) {
      isDragging = false; isResizing = false;
      header.style.cursor = "";
      savePrefs();
    }
  };

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);

  const closeBtn = header.querySelector(".lg-window-close") as HTMLElement;
  closeBtn.onclick = () => hide();

  // ── Rendering ─────────────────────────────────────────────────────────────
  function hasNotes(): boolean {
    return notes.status === "ok" && notes.text.trim().length > 0;
  }

  function ensureRendered(): void {
    if (renderedFor === notes.text && rendered) return;
    try {
      rendered = renderNotes(notes.text);
    } catch (err) {
      console.error("[Looking Glass] Failed to render creator notes", err);
      rendered = { html: `<pre>${escapeHtml(notes.text)}</pre>`, css: "", hoisted: "" };
    }
    renderedFor = notes.text;
  }

  /** Global mode: the notes' ambient (position:fixed) elements live in a page-level layer. */
  function syncGlobalLayer(active: boolean): void {
    if (!active || !rendered || !rendered.html.trim()) {
      layer?.destroy();
      layer = null;
      layerKey = "";
      return;
    }
    if (layer && layerKey === renderedFor) return;

    layer?.destroy();
    layer = mountOverlay(ctx, "lg-global-layer");
    Object.assign(layer.root.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      zIndex: "2",
    });
    layer.root.innerHTML = rendered.html;
    // The global stylesheet is already in the document, so computed styles are
    // accurate: keep only what the notes pin to the viewport.
    layer.root.replaceChildren(...findFixedRoots(layer.root));
    layerKey = renderedFor;
  }

  function renderWindow(): void {
    if (!open) return;

    const key = `${notes.status}|${renderedFor}|${notes.text.length}|${settings.renderMode}|${layer ? 1 : 0}`;
    if (key === windowKey) return;
    windowKey = key;

    if (notes.status !== "ok" || !rendered) {
      const message = notes.status === "loading" ? "Loading notes..." : notes.text;
      authorStyle.textContent = "";
      content.className = "lg-window-content";
      content.innerHTML = `<div class="lg-notes-empty">${ICON_EMPTY}<p>${escapeHtml(message)}</p></div>`;
      return;
    }

    const hasAuthorCss = rendered.css.trim().length > 0;
    authorStyle.textContent = scopePageSelectors(rendered.css, BODY_SCOPE);
    content.className = hasAuthorCss ? "lg-window-content" : "lg-window-content lg-prose";
    content.innerHTML = rendered.html;
    content.scrollTop = 0;

    // In global mode the ambient elements already live in the page layer.
    if (layer) {
      for (const el of findFixedRoots(content)) el.remove();
    }
  }

  function update(): void {
    const globalMode = settings.renderMode === "global";
    const wantRender = hasNotes() && (open || (globalMode && settings.alwaysInject));

    if (wantRender) ensureRendered();

    const globalActive = wantRender && globalMode && !!rendered;
    hoistedStyle.set(wantRender && rendered ? rendered.hoisted : "");
    globalStyle.set(globalActive && rendered ? rendered.css : "");
    syncGlobalLayer(globalActive);
    renderWindow();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  function show(): void {
    open = true;
    host.style.display = "block";
    windowKey = "";
    update();
  }

  function hide(): void {
    open = false;
    host.style.display = "none";
    update();
  }

  function toggle(): void {
    if (open) hide();
    else show();
  }

  return {
    show,
    hide,
    toggle,
    isOpen: () => open,
    hasNotes,
    setNotes(payload) {
      notes = payload;
      update();
    },
    setCharacterId(id) {
      root.setAttribute("data-char-id", id);
    },
    setSettings(next) {
      settings = next;
      windowKey = "";
      update();
    },
    destroy() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      layer?.destroy();
      layer = null;
      hoistedStyle.clear();
      globalStyle.clear();
      overlay.destroy();
    },
  };
}
