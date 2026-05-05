const ICON_CLOSE = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const ICON_GLASS = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><g fill="currentColor"><path d="M16 27.15c3.733 0 6.76-4.867 6.76-10.87S19.733 5.41 16 5.41s-6.76 4.867-6.76 10.87S12.267 27.15 16 27.15m5.76-10.87c0 2.845-.72 5.373-1.83 7.158c-1.118 1.8-2.535 2.712-3.93 2.712s-2.812-.912-3.93-2.712a11 11 0 0 1-1.024-2.172l9.85-10.134c.543 1.49.864 3.249.864 5.148"/><path d="M16 1a5.67 5.67 0 0 0-4.719 2.525l-1.024 1.536a3 3 0 0 1-1.154 1.02l-1.583.79a5 5 0 0 0-2.303 6.568l.601 1.304a3 3 0 0 1 0 2.514l-.601 1.304a5 5 0 0 0 2.303 6.567l1.583.791a3 3 0 0 1 1.154 1.02l1.024 1.536a5.67 5.67 0 0 0 9.438 0l1.024-1.536a3 3 0 0 1 1.154-1.02l1.583-.79a5 5 0 0 0 2.303-6.568l-.602-1.304a3 3 0 0 1 0-2.514l.602-1.304a5 5 0 0 0-2.303-6.567l-1.583-.791a3 3 0 0 1-1.154-1.02l-1.024-1.536A5.67 5.67 0 0 0 15.999 1m-3.055 3.635a3.67 3.67 0 0 1 6.11 0l1.024 1.536a5 5 0 0 0 1.924 1.698l1.582.792a3 3 0 0 1 1.382 3.94l-.601 1.304a5 5 0 0 0 0 4.19l.601 1.304a3 3 0 0 1-1.382 3.94l-1.582.792a5 5 0 0 0-1.924 1.698l-1.024 1.536a3.67 3.67 0 0 1-6.11 0l-1.024-1.536a5 5 0 0 0-1.924-1.698l-1.582-.792a3 3 0 0 1-1.382-3.94l.601-1.304a5 5 0 0 0 0-4.19l-.6-1.305a3 3 0 0 1 1.382-3.94l1.582-.792a5 5 0 0 0 1.924-1.698z"/></g></svg>`;
const ICON_EMPTY = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`;

import { NOTES_CSS } from "./styles";
import { marked } from "marked";

export interface NotesWindow {
  root: HTMLElement;
  show(): void;
  hide(): void;
  toggle(): void;
  updateContent(html: string): void;
  updateCharacterId(id: string): void;
  updateSettings(settings: { renderMode: string, alwaysInject: boolean }): void;
  destroy(): void;
}

export function createNotesWindow(): NotesWindow {
  // --- Persistent Position Settings ---
  const STORAGE_KEY_PREFS = "looking-glass-window-prefs";
  const savedPrefs = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFS) || "{}");
  
  let currentSettings = { renderMode: "window", alwaysInject: false };

  // --- Style Manager for Main Document ---
  const globalStyleId = "lg-global-styles";
  const updateGlobalStyles = (css: string) => {
    let styleEl = document.getElementById(globalStyleId) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = globalStyleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  };

  const host = document.createElement("div");
  host.className = "lg-window-host";
  host.style.position = "fixed";
  host.style.top = "0";
  host.style.left = "0";
  host.style.width = "0";
  host.style.height = "0";
  host.style.zIndex = "10000";
  host.style.pointerEvents = "none";

  const shadow = host.attachShadow({ mode: "open" });

  const baseStyle = document.createElement("style");
  baseStyle.textContent = NOTES_CSS;
  shadow.appendChild(baseStyle);

  const body = document.createElement("body");
  body.style.margin = "0";
  body.style.padding = "0";
  body.style.display = "contents";

  const root = document.createElement("div");
  root.className = "lg-window hidden";
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

  const content = document.createElement("div");
  content.className = "lg-window-content";
  content.innerHTML = `
    <div class="lg-notes-empty">
      ${ICON_EMPTY}
      <p>Loading notes...</p>
    </div>
  `;

  const resizeHandle = document.createElement("div");
  resizeHandle.className = "lg-window-resize-handle";

  root.appendChild(header);
  root.appendChild(content);
  root.appendChild(resizeHandle);
  body.appendChild(root);
  shadow.appendChild(body);
  document.body.appendChild(host);

  // --- Logic ---
  let currentRawContent = "";

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

  window.addEventListener("mousemove", (e) => {
    if (isDragging) {
      root.style.top = `${startTop + (e.clientY - startY)}px`;
      root.style.left = `${startLeft + (e.clientX - startX)}px`;
      root.style.right = "auto";
    } else if (isResizing) {
      root.style.width = `${Math.max(280, startW + (e.clientX - startX))}px`;
      root.style.height = `${Math.max(200, startH + (e.clientY - startY))}px`;
    }
  });

  window.addEventListener("mouseup", () => {
    if (isDragging || isResizing) {
      isDragging = false; isResizing = false;
      header.style.cursor = "";
      savePrefs();
    }
  });

  const closeBtn = header.querySelector(".lg-window-close") as HTMLElement;
  closeBtn.onclick = () => hide();

  function show() {
    root.classList.remove("hidden");
    updateContent(currentRawContent);
  }

  function hide() {
    root.classList.add("hidden");
    if (currentSettings.renderMode === "global" && !currentSettings.alwaysInject) {
      updateGlobalStyles("");
    }
  }

  function toggle() {
    if (root.classList.contains("hidden")) show();
    else hide();
  }

  function updateContent(raw: string) {
    currentRawContent = raw;
    Promise.resolve(marked.parse(raw)).then((parsed) => {
      // 1. Render content into the window (Shadow DOM)
      // We keep styles inside the window in both modes so the window itself is ALWAYS styled.
      content.innerHTML = parsed as string;

      // 2. Handle Global (Main App) Styles
      if (currentSettings.renderMode === "global") {
        const temp = document.createElement("div");
        temp.innerHTML = parsed as string;
        const cssContent = Array.from(temp.querySelectorAll("style")).map(s => s.textContent).join("\n");
        
        if (!root.classList.contains("hidden") || currentSettings.alwaysInject) {
          updateGlobalStyles(cssContent);
        } else {
          updateGlobalStyles("");
        }
      } else {
        updateGlobalStyles("");
      }
    });
  }

  function updateCharacterId(id: string) {
    root.setAttribute("data-char-id", id);
  }

  function updateSettings(settings: { renderMode: string, alwaysInject: boolean }) {
    currentSettings = settings;
    updateContent(currentRawContent);
  }

  return {
    root: host,
    show, hide, toggle,
    updateContent,
    updateCharacterId,
    updateSettings,
    destroy() {
      updateGlobalStyles("");
      host.remove();
    }
  };
}
