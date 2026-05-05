const ICON_CLOSE = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const ICON_GLASS = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><g fill="currentColor"><path d="M16 27.15c3.733 0 6.76-4.867 6.76-10.87S19.733 5.41 16 5.41s-6.76 4.867-6.76 10.87S12.267 27.15 16 27.15m5.76-10.87c0 2.845-.72 5.373-1.83 7.158c-1.118 1.8-2.535 2.712-3.93 2.712s-2.812-.912-3.93-2.712a11 11 0 0 1-1.024-2.172l9.85-10.134c.543 1.49.864 3.249.864 5.148"/><path d="M16 1a5.67 5.67 0 0 0-4.719 2.525l-1.024 1.536a3 3 0 0 1-1.154 1.02l-1.583.79a5 5 0 0 0-2.303 6.568l.601 1.304a3 3 0 0 1 0 2.514l-.601 1.304a5 5 0 0 0 2.303 6.567l1.583.791a3 3 0 0 1 1.154 1.02l1.024 1.536a5.67 5.67 0 0 0 9.438 0l1.024-1.536a3 3 0 0 1 1.154-1.02l1.583-.79a5 5 0 0 0 2.303-6.568l-.602-1.304a3 3 0 0 1 0-2.514l.602-1.304a5 5 0 0 0-2.303-6.567l-1.583-.791a3 3 0 0 1-1.154-1.02l-1.024-1.536A5.67 5.67 0 0 0 15.999 1m-3.055 3.635a3.67 3.67 0 0 1 6.11 0l1.024 1.536a5 5 0 0 0 1.924 1.698l1.582.792a3 3 0 0 1 1.382 3.94l-.601 1.304a5 5 0 0 0 0 4.19l.601 1.304a3 3 0 0 1-1.382 3.94l-1.582.792a5 5 0 0 0-1.924 1.698l-1.024 1.536a3.67 3.67 0 0 1-6.11 0l-1.024-1.536a5 5 0 0 0-1.924-1.698l-1.582-.792a3 3 0 0 1-1.382-3.94l.601-1.304a5 5 0 0 0 0-4.19l-.6-1.305a3 3 0 0 1 1.382-3.94l1.582-.792a5 5 0 0 0 1.924-1.698z"/></g></svg>`;
const ICON_EMPTY = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`;
const ICON_SETTINGS = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;

import { NOTES_CSS } from "./styles";
import { marked } from "marked";

export interface NotesWindow {
  root: HTMLElement;
  show(): void;
  hide(): void;
  toggle(): void;
  updateContent(html: string): void;
  updateCharacterId(id: string): void;
  destroy(): void;
}

export function createNotesWindow(): NotesWindow {
  // --- Persistent Settings ---
  const STORAGE_KEY_PREFS = "looking-glass-window-prefs";
  const STORAGE_KEY_SETTINGS = "looking-glass-settings";
  
  const savedPrefs = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFS) || "{}");
  const settings = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) || JSON.stringify({
    renderMode: "window", // "window" | "global"
    alwaysInject: false,
  }));

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
      <button class="lg-window-settings" title="Settings">${ICON_SETTINGS}</button>
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

  const settingsPanel = document.createElement("div");
  settingsPanel.className = "lg-settings-panel hidden";
  settingsPanel.innerHTML = `
    <div class="lg-settings-header">
      <span>Settings</span>
      <button class="lg-settings-close">${ICON_CLOSE}</button>
    </div>
    <div class="lg-settings-body">
      <div class="lg-setting-item">
        <label>Style Rendering</label>
        <select id="lg-setting-mode">
          <option value="window" ${settings.renderMode === "window" ? "selected" : ""}>Window Only (Isolated)</option>
          <option value="global" ${settings.renderMode === "global" ? "selected" : ""}>Global (Affects Entire App)</option>
        </select>
        <p class="lg-setting-hint">"Global" allows character notes to re-theme the entire Lumiverse interface.</p>
      </div>
      <div class="lg-setting-item ${settings.renderMode === 'window' ? 'disabled' : ''}" id="lg-always-item">
        <label class="lg-checkbox-label">
          <input type="checkbox" id="lg-setting-always" ${settings.alwaysInject ? "checked" : ""}>
          <span>Always Apply Styles</span>
        </label>
        <p class="lg-setting-hint">Apply global styles even when this window is closed.</p>
      </div>
    </div>
  `;

  const resizeHandle = document.createElement("div");
  resizeHandle.className = "lg-window-resize-handle";

  root.appendChild(header);
  root.appendChild(content);
  root.appendChild(settingsPanel);
  root.appendChild(resizeHandle);
  body.appendChild(root);
  shadow.appendChild(body);
  document.body.appendChild(host);

  // --- Logic ---
  let currentRawContent = "";

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    updateContent(currentRawContent);
    
    // UI Feedback
    const alwaysItem = settingsPanel.querySelector("#lg-always-item") as HTMLElement;
    if (settings.renderMode === "window") alwaysItem.classList.add("disabled");
    else alwaysItem.classList.remove("disabled");
  }

  // Settings Handlers
  const settingsBtn = header.querySelector(".lg-window-settings") as HTMLElement;
  const settingsClose = settingsPanel.querySelector(".lg-settings-close") as HTMLElement;
  const modeSelect = settingsPanel.querySelector("#lg-setting-mode") as HTMLSelectElement;
  const alwaysCheck = settingsPanel.querySelector("#lg-setting-always") as HTMLInputElement;

  settingsBtn.onclick = () => settingsPanel.classList.remove("hidden");
  settingsClose.onclick = () => settingsPanel.classList.add("hidden");

  modeSelect.onchange = () => {
    settings.renderMode = modeSelect.value;
    saveSettings();
  };
  alwaysCheck.onchange = () => {
    settings.alwaysInject = alwaysCheck.checked;
    saveSettings();
  };

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
    if (settings.renderMode === "global") {
      updateContent(currentRawContent);
    }
  }

  function hide() {
    root.classList.add("hidden");
    // If not "always inject", clear global styles when hidden
    if (settings.renderMode === "global" && !settings.alwaysInject) {
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
      if (settings.renderMode === "global") {
        // Extract styles
        const temp = document.createElement("div");
        temp.innerHTML = parsed as string;
        const styles = Array.from(temp.querySelectorAll("style"));
        const cssContent = styles.map(s => s.textContent).join("\n");
        
        // Remove styles from the HTML that goes into the window to avoid duplication/flashing
        styles.forEach(s => s.remove());
        content.innerHTML = temp.innerHTML;

        // Apply globally if window is open OR alwaysInject is true
        if (!root.classList.contains("hidden") || settings.alwaysInject) {
          updateGlobalStyles(cssContent);
        } else {
          updateGlobalStyles("");
        }
      } else {
        // Window Only: Just render everything into the shadow DOM
        updateGlobalStyles(""); // Clear any previous global styles
        content.innerHTML = parsed as string;
      }
    });
  }

  function updateCharacterId(id: string) {
    root.setAttribute("data-char-id", id);
  }

  return {
    root: host,
    show, hide, toggle,
    updateContent,
    updateCharacterId,
    destroy() {
      updateGlobalStyles("");
      host.remove();
    }
  };
}
