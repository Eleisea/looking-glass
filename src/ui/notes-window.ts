const ICON_CLOSE = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const ICON_GLASS = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><g fill="currentColor"><path d="M16 27.15c3.733 0 6.76-4.867 6.76-10.87S19.733 5.41 16 5.41s-6.76 4.867-6.76 10.87S12.267 27.15 16 27.15m5.76-10.87c0 2.845-.72 5.373-1.83 7.158c-1.118 1.8-2.535 2.712-3.93 2.712s-2.812-.912-3.93-2.712a11 11 0 0 1-1.024-2.172l9.85-10.134c.543 1.49.864 3.249.864 5.148"/><path d="M16 1a5.67 5.67 0 0 0-4.719 2.525l-1.024 1.536a3 3 0 0 1-1.154 1.02l-1.583.79a5 5 0 0 0-2.303 6.568l.601 1.304a3 3 0 0 1 0 2.514l-.601 1.304a5 5 0 0 0 2.303 6.567l1.583.791a3 3 0 0 1 1.154 1.02l1.024 1.536a5.67 5.67 0 0 0 9.438 0l1.024-1.536a3 3 0 0 1 1.154-1.02l1.583-.79a5 5 0 0 0 2.303-6.568l-.602-1.304a3 3 0 0 1 0-2.514l.602-1.304a5 5 0 0 0-2.303-6.567l-1.583-.791a3 3 0 0 1-1.154-1.02l-1.024-1.536A5.67 5.67 0 0 0 15.999 1m-3.055 3.635a3.67 3.67 0 0 1 6.11 0l1.024 1.536a5 5 0 0 0 1.924 1.698l1.582.792a3 3 0 0 1 1.382 3.94l-.601 1.304a5 5 0 0 0 0 4.19l.601 1.304a3 3 0 0 1-1.382 3.94l-1.582.792a5 5 0 0 0-1.924 1.698l-1.024 1.536a3.67 3.67 0 0 1-6.11 0l-1.024-1.536a5 5 0 0 0-1.924-1.698l-1.582-.792a3 3 0 0 1-1.382-3.94l.601-1.304a5 5 0 0 0 0-4.19l-.6-1.305a3 3 0 0 1 1.382-3.94l1.582-.792a5 5 0 0 0 1.924-1.698z"/></g></svg>`;
const ICON_EMPTY = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`;

import type { SpindleFrontendContext } from "lumiverse-spindle-types";

export interface NotesWindow {
  root: HTMLElement;
  show(): void;
  hide(): void;
  toggle(): void;
  updateContent(html: string): void;
  updateCharacterId(id: string): void;
  destroy(): void;
}

export function createNotesWindow(ctx: SpindleFrontendContext): NotesWindow {
  const root = document.createElement("div");
  root.className = "lg-window hidden";
  root.style.width = "400px";
  root.style.height = "500px";
  root.style.top = "100px";
  root.style.right = "100px";

  // Persistent storage for position and size
  const STORAGE_KEY = "looking-glass-window-prefs";
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  if (saved.width) root.style.width = saved.width;
  if (saved.height) root.style.height = saved.height;
  if (saved.top) root.style.top = saved.top;
  if (saved.left) root.style.left = saved.left;
  if (saved.right && !saved.left) root.style.right = saved.right;

  const header = document.createElement("div");
  header.className = "lg-window-header";
  header.innerHTML = `
    <div class="lg-window-title">${ICON_GLASS} Creator Notes</div>
    <button class="lg-window-close">${ICON_CLOSE}</button>
  `;

  const content = document.createElement("div");
  content.className = "lg-window-content";
  content.innerHTML = `
    <div class="lg-notes-empty" style="padding: 20px;">
      ${ICON_EMPTY}
      <p>Loading notes...</p>
    </div>
  `;

  const resizeHandle = document.createElement("div");
  resizeHandle.className = "lg-window-resize-handle";

  root.appendChild(header);
  root.appendChild(content);
  root.appendChild(resizeHandle);
  document.body.appendChild(root);

  let isDragging = false;
  let isResizing = false;
  let startX = 0;
  let startY = 0;
  let startW = 0;
  let startH = 0;
  let startTop = 0;
  let startLeft = 0;

  function savePrefs() {
    const prefs = {
      width: root.style.width,
      height: root.style.height,
      top: root.style.top,
      left: root.style.left,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }

  // Dragging
  header.addEventListener("mousedown", (e) => {
    if (e.target === header.querySelector(".lg-window-close")) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = root.getBoundingClientRect();
    startTop = rect.top;
    startLeft = rect.left;
    header.style.cursor = "grabbing";
    e.preventDefault();
  });

  // Resizing
  resizeHandle.addEventListener("mousedown", (e) => {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startW = root.offsetWidth;
    startH = root.offsetHeight;
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      root.style.top = `${startTop + dy}px`;
      root.style.left = `${startLeft + dx}px`;
      root.style.right = "auto";
    } else if (isResizing) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      root.style.width = `${Math.max(280, startW + dx)}px`;
      root.style.height = `${Math.max(200, startH + dy)}px`;
    }
  });

  window.addEventListener("mouseup", () => {
    if (isDragging || isResizing) {
      isDragging = false;
      isResizing = false;
      header.style.cursor = "";
      savePrefs();
    }
  });

  const closeBtn = header.querySelector(".lg-window-close") as HTMLElement;
  closeBtn.onclick = () => hide();

  function show() {
    root.classList.remove("hidden");
    // Ensure it's on screen
    const rect = root.getBoundingClientRect();
    if (rect.top < 0) root.style.top = "0px";
    if (rect.left < 0) root.style.left = "0px";
    if (rect.right > window.innerWidth) root.style.left = `${window.innerWidth - rect.width}px`;
    if (rect.bottom > window.innerHeight) root.style.top = `${window.innerHeight - rect.height}px`;
  }

  function hide() {
    root.classList.add("hidden");
  }

  function toggle() {
    if (root.classList.contains("hidden")) show();
    else hide();
  }

  let currentFrame: any = null;

  function updateContent(html: string) {
    if (currentFrame) {
      currentFrame.element.remove();
      currentFrame = null;
    }

    let finalHtml = html;
    if (!html.includes("<p>") && !html.includes("<div>") && !html.includes("<style>")) {
      finalHtml = html.split("\n\n").map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
    }

    const frameHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          :root { color-scheme: dark; }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            color: #e0e0e0;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            word-wrap: break-word;
          }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.2); border-radius: 3px; }
        </style>
      </head>
      <body>
        ${finalHtml}
      </body>
      </html>
    `;

    currentFrame = ctx.dom.createSandboxFrame({
      html: frameHtml
    });

    currentFrame.element.style.width = "100%";
    currentFrame.element.style.height = "100%";
    currentFrame.element.style.border = "none";
    currentFrame.element.style.background = "transparent";
    currentFrame.element.style.display = "block";

    content.innerHTML = "";
    content.appendChild(currentFrame.element);
  }

  function updateCharacterId(id: string) {
    root.setAttribute("data-char-id", id);
  }

  return {
    root,
    show,
    hide,
    toggle,
    updateContent,
    updateCharacterId,
    destroy() {
      root.remove();
    }
  };
}
