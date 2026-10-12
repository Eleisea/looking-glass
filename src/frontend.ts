import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import { NOTES_CSS } from "./ui/styles";
import { ICON_GLASS } from "./ui/icons";
import { createNotesWindow } from "./ui/notes-window";
import { createSettingsUI, loadSettings } from "./ui/settings";

export function setup(ctx: SpindleFrontendContext) {
  const cleanups: (() => void)[] = [];

  // 1. Add base styles
  const removeStyle = ctx.dom.addStyle(NOTES_CSS);
  cleanups.push(removeStyle);

  // 2. Create the notes window
  const windowUI = createNotesWindow(ctx);
  cleanups.push(() => windowUI.destroy());

  function requestNotes() {
    ctx.sendToBackend({ type: "get_notes" });
  }

  /** Global styles are applied while the widget is open, or always when opted in. */
  function globalStylesWanted() {
    const settings = loadSettings();
    return settings.renderMode === "global" && settings.alwaysInject;
  }

  // 3. Mount Settings UI to the extensions settings area
  const settingsMount = ctx.ui.mount("settings_extensions");
  const settingsUI = createSettingsUI((settings) => {
    windowUI.setSettings(settings);
    if (settings.renderMode === "global" && settings.alwaysInject && !windowUI.hasNotes()) {
      requestNotes();
    }
  });
  settingsMount.appendChild(settingsUI.root);
  cleanups.push(() => settingsUI.destroy());

  // Initial settings sync
  windowUI.setSettings(loadSettings());

  // 4. Create the float widget
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

  // 5. Handle interactions

  // Pre-fetch so global styles are live before the widget is ever opened
  if (globalStylesWanted()) {
    requestNotes();
  }

  widgetContent.addEventListener("click", (e) => {
    e.stopPropagation();
    windowUI.toggle();
    if (windowUI.isOpen()) {
      requestNotes();
    }
  });

  // 6. Backend message handling
  const msgUnsub = ctx.onBackendMessage((msg: any) => {
    if (msg.type === "notes_result") {
      if (msg.characterId) windowUI.setCharacterId(msg.characterId);
      windowUI.setNotes({ status: msg.status ?? "ok", text: msg.notes ?? "" });
    } else if (msg.type === "chat_switched") {
      if (windowUI.isOpen() || globalStylesWanted()) {
        requestNotes();
      }
    }
  });
  cleanups.push(msgUnsub);

  return () => {
    cleanups.forEach(c => c());
  };
}
