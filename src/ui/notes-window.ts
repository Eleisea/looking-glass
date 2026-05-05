const ICON_CLOSE = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const ICON_GLASS = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`;
const ICON_EMPTY = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`;

export interface NotesWindow {
  root: HTMLElement;
  show(): void;
  hide(): void;
  toggle(): void;
  updateContent(html: string): void;
  destroy(): void;
}

export function createNotesWindow(): NotesWindow {
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

  function updateContent(html: string) {
    // Simple text-to-html conversion for newlines if it's not already HTML
    if (!html.includes("<p>") && !html.includes("<div>")) {
      const formatted = html
        .split("\n\n")
        .map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`)
        .join("");
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
