import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import { NOTES_CSS } from "./ui/styles";
import { createNotesWindow } from "./ui/notes-window";

const ICON_GLASS = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><g fill="currentColor"><path d="M16 27.15c3.733 0 6.76-4.867 6.76-10.87S19.733 5.41 16 5.41s-6.76 4.867-6.76 10.87S12.267 27.15 16 27.15m5.76-10.87c0 2.845-.72 5.373-1.83 7.158c-1.118 1.8-2.535 2.712-3.93 2.712s-2.812-.912-3.93-2.712a11 11 0 0 1-1.024-2.172l9.85-10.134c.543 1.49.864 3.249.864 5.148"/><path d="M16 1a5.67 5.67 0 0 0-4.719 2.525l-1.024 1.536a3 3 0 0 1-1.154 1.02l-1.583.79a5 5 0 0 0-2.303 6.568l.601 1.304a3 3 0 0 1 0 2.514l-.601 1.304a5 5 0 0 0 2.303 6.567l1.583.791a3 3 0 0 1 1.154 1.02l1.024 1.536a5.67 5.67 0 0 0 9.438 0l1.024-1.536a3 3 0 0 1 1.154-1.02l1.583-.79a5 5 0 0 0 2.303-6.568l-.602-1.304a3 3 0 0 1 0-2.514l.602-1.304a5 5 0 0 0-2.303-6.567l-1.583-.791a3 3 0 0 1-1.154-1.02l-1.024-1.536A5.67 5.67 0 0 0 15.999 1m-3.055 3.635a3.67 3.67 0 0 1 6.11 0l1.024 1.536a5 5 0 0 0 1.924 1.698l1.582.792a3 3 0 0 1 1.382 3.94l-.601 1.304a5 5 0 0 0 0 4.19l.601 1.304a3 3 0 0 1-1.382 3.94l-1.582.792a5 5 0 0 0-1.924 1.698l-1.024 1.536a3.67 3.67 0 0 1-6.11 0l-1.024-1.536a5 5 0 0 0-1.924-1.698l-1.582-.792a3 3 0 0 1-1.382-3.94l.601-1.304a5 5 0 0 0 0-4.19l-.6-1.305a3 3 0 0 1 1.382-3.94l1.582-.792a5 5 0 0 0 1.924-1.698z"/></g></svg>`;

export function setup(ctx: SpindleFrontendContext) {
  const cleanups: (() => void)[] = [];

  // 1. Add styles
  const removeStyle = ctx.dom.addStyle(NOTES_CSS);
  cleanups.push(removeStyle);

  // 2. Create the notes window
  const windowUI = createNotesWindow();
  cleanups.push(() => windowUI.destroy());

  // 3. Create the float widget
  const widget = ctx.ui.createFloatWidget({
    width: 48,
    height: 48,
    tooltip: "Character Notes (Looking Glass)",
    chromeless: true,
  });
  cleanups.push(() => widget.destroy());

  const widgetContent = document.createElement("div");
  widgetContent.className = "lg-float-widget";
  widgetContent.innerHTML = ICON_GLASS;
  widget.root.appendChild(widgetContent);

  // Persistence for widget position
  const POS_KEY = "looking-glass-widget-pos";
  const savedPos = JSON.parse(localStorage.getItem(POS_KEY) || "{}");
  if (savedPos.x !== undefined && savedPos.y !== undefined) {
    widget.moveTo(savedPos.x, savedPos.y);
  }

  widget.onDragEnd((pos) => {
    localStorage.setItem(POS_KEY, JSON.stringify(pos));
  });

  // 4. Handle interactions
  function requestNotes() {
    console.log("[Looking Glass] Requesting notes from backend...");
    ctx.sendToBackend({ type: "get_notes" });
  }

  widgetContent.addEventListener("click", (e) => {
    e.stopPropagation();
    windowUI.toggle();
    if (!windowUI.root.classList.contains("hidden")) {
      requestNotes();
    }
  });

  // 5. Backend message handling
  const msgUnsub = ctx.onBackendMessage((msg: any) => {
    console.log("[Looking Glass] Received message from backend:", msg.type, msg);
    if (msg.type === "notes_result") {
      if (msg.characterId) windowUI.updateCharacterId(msg.characterId);
      windowUI.updateContent(msg.notes);
    } else if (msg.type === "chat_switched") {
      // Refresh notes if window is open
      if (!windowUI.root.classList.contains("hidden")) {
        requestNotes();
      }
    }
  });
  cleanups.push(msgUnsub);

  // Return cleanup
  return () => {
    cleanups.forEach(c => c());
  };
}
