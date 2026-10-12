import type { SpindleFrontendContext, SpindleFloatWidgetHandle } from "lumiverse-spindle-types";
import { NOTES_CSS } from "./styles";
import { ICON_CLOSE, ICON_EMPTY, ICON_GLASS, ICON_POPOUT, ICON_RETURN } from "./icons";
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

function getTauriInvoke(): ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  if (typeof w.__TAURI__?.core?.invoke === "function") return w.__TAURI__.core.invoke;
  if (typeof w.__TAURI_INTERNALS__?.invoke === "function") return w.__TAURI_INTERNALS__.invoke;
  return null;
}

function isDesktopWindow(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as any;
  return typeof w.__TAURI__ !== "undefined" || typeof w.__TAURI_INTERNALS__ !== "undefined";
}

function isPoppedOut(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("desktopWidgetExtension") === "looking_glass";
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

export function createNotesWindow(ctx: SpindleFrontendContext): NotesWindow {
  const STORAGE_KEY_PREFS = "looking-glass-window-prefs";
  const savedPrefs = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFS) || "{}");
  const poppedOut = isPoppedOut();

  let settings: LgSettings = loadSettings();
  let notes: NotesPayload = { status: "loading", text: "" };
  let open = poppedOut;

  let rendered: RenderedNotes | null = null;
  let renderedFor = "";
  let windowKey = "";
  let layerKey = "";
  let layer: Overlay | null = null;

  const hoistedStyle = createStyleSlot(ctx);
  const globalStyle = createStyleSlot(ctx);

  // ── Floating Widget / Window surface ──────────────────────────────────────
  const defaultW = savedPrefs.width ? parseInt(savedPrefs.width, 10) : 400;
  const defaultH = savedPrefs.height ? parseInt(savedPrefs.height, 10) : 500;
  const defaultX = savedPrefs.left ? parseInt(savedPrefs.left, 10) : Math.max(16, window.innerWidth - 450);
  const defaultY = savedPrefs.top ? parseInt(savedPrefs.top, 10) : 100;

  let floatWidget: SpindleFloatWidgetHandle | null = null;
  let overlay: Overlay | null = null;
  let host: HTMLElement;

  try {
    floatWidget = ctx.ui.createFloatWidget({
      width: defaultW,
      height: defaultH,
      initialPosition: { x: defaultX, y: defaultY },
      chromeless: true,
      tooltip: "Looking Glass - Notes",
    });
    host = floatWidget.root;
    host.style.width = "100%";
    host.style.height = "100%";
    host.style.pointerEvents = "auto";
    if (!poppedOut) {
      floatWidget.setVisible(false);
    }
  } catch (err) {
    console.warn("[Looking Glass] createFloatWidget unavailable; falling back to app mount", err);
    overlay = mountOverlay(ctx, "lg-window-host");
    host = overlay.root;
    Object.assign(host.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: "10000",
      pointerEvents: "none",
      display: "none",
    });
  }

  const shadow = host.attachShadow({ mode: "open" });

  const baseStyle = document.createElement("style");
  baseStyle.textContent = NOTES_CSS;
  shadow.appendChild(baseStyle);

  // Author CSS from the notes, scoped to this shadow root.
  const authorStyle = document.createElement("style");
  shadow.appendChild(authorStyle);

  const root = document.createElement("div");
  root.className = "lg-window";
  if (floatWidget) {
    root.style.position = "relative";
    root.style.width = "100%";
    root.style.height = "100%";
    root.style.top = "0";
    root.style.left = "0";
  } else {
    root.style.position = "fixed";
    root.style.width = savedPrefs.width || "400px";
    root.style.height = savedPrefs.height || "500px";
    root.style.top = savedPrefs.top || "100px";
    root.style.left = savedPrefs.left || "100px";
  }
  root.style.pointerEvents = "auto";

  const header = document.createElement("div");
  header.className = "lg-window-header";
  header.innerHTML = `
    <div class="lg-window-title">${ICON_GLASS} Looking Glass</div>
    <div class="lg-window-controls">
      <button class="lg-window-popout" title="${poppedOut ? "Return to Lumiverse window" : "Pop out to desktop window"}">${poppedOut ? ICON_RETURN : ICON_POPOUT}</button>
      <button class="lg-window-close" title="Close">${ICON_CLOSE}</button>
    </div>
  `;

  const popoutBtn = header.querySelector(".lg-window-popout") as HTMLElement;
  if (!isDesktopWindow()) {
    popoutBtn.style.display = "none";
  } else {
    popoutBtn.onclick = () => {
      const invoke = getTauriInvoke();
      if (invoke && floatWidget) {
        void invoke(poppedOut ? "return_extension_widget" : "show_extension_widget", {
          widgetId: floatWidget.widgetId,
        });
      }
    };
  }

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
  let startX = 0, startY = 0, startW = defaultW, startH = defaultH, startTop = defaultY, startLeft = defaultX;

  function savePrefs() {
    let w = root.style.width;
    let h = root.style.height;
    let t = root.style.top;
    let l = root.style.left;
    if (floatWidget) {
      const pos = floatWidget.getPosition?.() || { x: defaultX, y: defaultY };
      t = `${pos.y}px`;
      l = `${pos.x}px`;
      w = `${startW}px`;
      h = `${startH}px`;
    }
    const prefs = { width: w, height: h, top: t, left: l };
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
  }

  floatWidget?.onDragEnd?.((pos) => {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFS) || "{}");
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify({ ...current, left: `${pos.x}px`, top: `${pos.y}px` }));
  });

  header.addEventListener("mousedown", (e) => {
    if ((e.target as HTMLElement).closest("button")) return;
    isDragging = true;
    startX = e.clientX; startY = e.clientY;
    if (floatWidget) {
      const pos = floatWidget.getPosition?.() || { x: defaultX, y: defaultY };
      startTop = pos.y; startLeft = pos.x;
    } else {
      const rect = root.getBoundingClientRect();
      startTop = rect.top; startLeft = rect.left;
    }
    header.style.cursor = "grabbing";
    e.preventDefault();
  });

  resizeHandle.addEventListener("mousedown", (e) => {
    isResizing = true;
    startX = e.clientX; startY = e.clientY;
    startW = floatWidget ? (floatWidget.getPosition?.() ? root.offsetWidth : defaultW) : root.offsetWidth;
    startH = floatWidget ? (floatWidget.getPosition?.() ? root.offsetHeight : defaultH) : root.offsetHeight;
    e.preventDefault();
  });

  const onMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newTop = startTop + (e.clientY - startY);
      const newLeft = startLeft + (e.clientX - startX);
      if (floatWidget) {
        floatWidget.moveTo(newLeft, newTop);
      } else {
        root.style.top = `${newTop}px`;
        root.style.left = `${newLeft}px`;
        root.style.right = "auto";
      }
    } else if (isResizing) {
      const newW = Math.max(280, startW + (e.clientX - startX));
      const newH = Math.max(200, startH + (e.clientY - startY));
      if (floatWidget) {
        floatWidget.setSize(newW, newH);
      } else {
        root.style.width = `${newW}px`;
        root.style.height = `${newH}px`;
      }
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
  closeBtn.onclick = () => {
    if (poppedOut) {
      const invoke = getTauriInvoke();
      if (invoke && floatWidget) {
        void invoke("return_extension_widget", { widgetId: floatWidget.widgetId });
        return;
      }
    }
    hide();
  };

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
      rendered = {
        html: `<pre>${escapeHtml(notes.text)}</pre>`,
        ambientHtml: "",
        contentHtml: `<pre>${escapeHtml(notes.text)}</pre>`,
        css: "",
        hoisted: "",
      };
    }
    renderedFor = notes.text;
  }

  /** Global mode: the notes' ambient (position:fixed) elements live in a page-level layer. */
  function syncGlobalLayer(active: boolean): void {
    if (!active || !rendered || !rendered.ambientHtml.trim()) {
      layer?.destroy();
      layer = null;
      layerKey = "";
      return;
    }
    if (layer && layerKey === renderedFor) return;

    if (!layer) {
      layer = mountOverlay(ctx, "lg-global-layer");
    }
    Object.assign(layer.root.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      zIndex: "9990",
      overflow: "hidden",
    });
    layer.root.innerHTML = rendered.ambientHtml;
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

    // In global mode with active ambient layer, render contentHtml so ambient overlays aren't duplicated.
    // In widget mode, render full html so ambient overlays are confined to widget.
    content.innerHTML = layer ? rendered.contentHtml : rendered.html;
    content.scrollTop = 0;
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
    if (floatWidget) {
      floatWidget.setVisible(true);
    } else {
      host.style.display = "block";
    }
    windowKey = "";
    update();
  }

  function hide(): void {
    open = false;
    if (floatWidget) {
      floatWidget.setVisible(false);
    } else {
      host.style.display = "none";
    }
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
      if (floatWidget) floatWidget.destroy();
      overlay?.destroy();
    },
  };
}
