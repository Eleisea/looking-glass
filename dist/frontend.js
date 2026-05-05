// src/ui/styles.ts
var NOTES_CSS = `
.lg-float-widget {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--lumiverse-fill-subtle);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--lumiverse-border);
}

.lg-float-widget:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  border-color: var(--lumiverse-accent);
}

.lg-float-widget svg {
  width: 24px;
  height: 24px;
  fill: var(--lumiverse-text-muted);
  transition: fill 0.2s ease;
}

.lg-float-widget:hover svg {
  fill: var(--lumiverse-accent);
}

.lg-window {
  position: fixed;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  background: var(--lcs-glass-bg, var(--lumiverse-bg-elevated));
  backdrop-filter: blur(var(--lcs-glass-blur, 12px));
  -webkit-backdrop-filter: blur(var(--lcs-glass-blur, 12px));
  border: 1px solid var(--lcs-glass-border, var(--lumiverse-border));
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), var(--lumiverse-highlight-inset);
  overflow: hidden;
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  min-width: 280px;
  min-height: 200px;
  color: var(--lumiverse-text);
  font-family: var(--lumiverse-font-sans, system-ui, -apple-system, sans-serif);
}

.lg-window.hidden {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.95) translateY(10px);
}

.lg-window-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid var(--lumiverse-border);
  cursor: grab;
  user-select: none;
}

.lg-window-header:active {
  cursor: grabbing;
}

.lg-window-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--lumiverse-text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.lg-window-title svg {
  width: 14px;
  height: 14px;
  fill: var(--lumiverse-accent);
}

.lg-window-close {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--lumiverse-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lg-window-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--lumiverse-text);
}

.lg-window-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  line-height: 1.6;
  font-size: 14px;
  scrollbar-width: thin;
  scrollbar-color: var(--lumiverse-border) transparent;
}

.lg-window-content::-webkit-scrollbar {
  width: 6px;
}

.lg-window-content::-webkit-scrollbar-thumb {
  background-color: var(--lumiverse-border);
  border-radius: 3px;
}

.lg-window-content p {
  margin-bottom: 1em;
}

.lg-window-content h1, .lg-window-content h2, .lg-window-content h3 {
  margin: 1.5em 0 0.5em;
  font-weight: 600;
  color: var(--lumiverse-accent);
}

.lg-window-content h1:first-child, .lg-window-content h2:first-child {
  margin-top: 0;
}

.lg-window-content code {
  background: var(--lumiverse-fill-subtle);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: var(--lumiverse-font-mono, monospace);
  font-size: 0.9em;
}

.lg-window-content blockquote {
  border-left: 3px solid var(--lumiverse-accent);
  margin: 1em 0;
  padding-left: 1em;
  color: var(--lumiverse-text-muted);
  font-style: italic;
}

.lg-window-resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, var(--lumiverse-border) 50%);
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.lg-window-resize-handle:hover {
  opacity: 1;
  background: linear-gradient(135deg, transparent 50%, var(--lumiverse-accent) 50%);
}

/* Markdown formatting helpers */
.lg-notes-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--lumiverse-text-dim);
  text-align: center;
  gap: 12px;
}

.lg-notes-empty svg {
  width: 48px;
  height: 48px;
  opacity: 0.2;
}
`;

// src/ui/notes-window.ts
var ICON_CLOSE = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
var ICON_GLASS = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`;
var ICON_EMPTY = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`;
function createNotesWindow() {
  const root = document.createElement("div");
  root.className = "lg-window hidden";
  root.style.width = "400px";
  root.style.height = "500px";
  root.style.top = "100px";
  root.style.right = "100px";
  const STORAGE_KEY = "looking-glass-window-prefs";
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  if (saved.width)
    root.style.width = saved.width;
  if (saved.height)
    root.style.height = saved.height;
  if (saved.top)
    root.style.top = saved.top;
  if (saved.left)
    root.style.left = saved.left;
  if (saved.right && !saved.left)
    root.style.right = saved.right;
  const header = document.createElement("div");
  header.className = "lg-window-header";
  header.innerHTML = `
    <div class="lg-window-title">${ICON_GLASS} Creator Notes</div>
    <button class="lg-window-close">${ICON_CLOSE}</button>
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
      left: root.style.left
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }
  header.addEventListener("mousedown", (e) => {
    if (e.target === header.querySelector(".lg-window-close"))
      return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = root.getBoundingClientRect();
    startTop = rect.top;
    startLeft = rect.left;
    header.style.cursor = "grabbing";
    e.preventDefault();
  });
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
  const closeBtn = header.querySelector(".lg-window-close");
  closeBtn.onclick = () => hide();
  function show() {
    root.classList.remove("hidden");
    const rect = root.getBoundingClientRect();
    if (rect.top < 0)
      root.style.top = "0px";
    if (rect.left < 0)
      root.style.left = "0px";
    if (rect.right > window.innerWidth)
      root.style.left = `${window.innerWidth - rect.width}px`;
    if (rect.bottom > window.innerHeight)
      root.style.top = `${window.innerHeight - rect.height}px`;
  }
  function hide() {
    root.classList.add("hidden");
  }
  function toggle() {
    if (root.classList.contains("hidden"))
      show();
    else
      hide();
  }
  function updateContent(html) {
    if (!html.includes("<p>") && !html.includes("<div>")) {
      const formatted = html.split(`

`).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
      content.innerHTML = formatted;
    } else {
      content.innerHTML = html;
    }
  }
  return {
    root,
    show,
    hide,
    toggle,
    updateContent,
    destroy() {
      root.remove();
    }
  };
}

// src/frontend.ts
var ICON_GLASS2 = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`;
function setup(ctx) {
  const cleanups = [];
  const removeStyle = ctx.dom.addStyle(NOTES_CSS);
  cleanups.push(removeStyle);
  const windowUI = createNotesWindow();
  cleanups.push(() => windowUI.destroy());
  const widget = ctx.ui.createFloatWidget({
    width: 48,
    height: 48,
    tooltip: "Character Notes (Looking Glass)",
    chromeless: true
  });
  cleanups.push(() => widget.destroy());
  const widgetContent = document.createElement("div");
  widgetContent.className = "lg-float-widget";
  widgetContent.innerHTML = ICON_GLASS2;
  widget.root.appendChild(widgetContent);
  const POS_KEY = "looking-glass-widget-pos";
  const savedPos = JSON.parse(localStorage.getItem(POS_KEY) || "{}");
  if (savedPos.x !== undefined && savedPos.y !== undefined) {
    widget.moveTo(savedPos.x, savedPos.y);
  }
  widget.onDragEnd((pos) => {
    localStorage.setItem(POS_KEY, JSON.stringify(pos));
  });
  function requestNotes() {
    ctx.sendToBackend({ type: "get_notes" });
  }
  widgetContent.addEventListener("click", (e) => {
    e.stopPropagation();
    windowUI.toggle();
    if (!ctx.dom.query(".lg-window").classList.contains("hidden")) {
      requestNotes();
    }
  });
  const msgUnsub = ctx.onBackendMessage((msg) => {
    if (msg.type === "notes_result") {
      windowUI.updateContent(msg.notes);
    } else if (msg.type === "chat_switched") {
      if (!ctx.dom.query(".lg-window").classList.contains("hidden")) {
        requestNotes();
      }
    }
  });
  cleanups.push(msgUnsub);
  return () => {
    cleanups.forEach((c) => c());
  };
}
export {
  setup
};
