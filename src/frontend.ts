import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import { NOTES_CSS } from "./ui/styles";
import { createNotesWindow } from "./ui/notes-window";

const ICON_GLASS = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`;

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
    console.log("[Looking Glass] Received message from backend:", msg.type);
    if (msg.type === "notes_result") {
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
