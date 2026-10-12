import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import { NOTES_CSS } from "./ui/styles";
import { ICON_GLASS } from "./ui/icons";
import { createNotesWindow } from "./ui/notes-window";
import { createSettingsUI, loadSettings } from "./ui/settings";

function isPoppedOut(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("desktopWidgetExtension");
}

export function setup(ctx: SpindleFrontendContext) {
  const cleanups: (() => void)[] = [];
  const poppedOut = isPoppedOut();

  // 1. Add base styles
  const removeStyle = ctx.dom.addStyle(NOTES_CSS);
  cleanups.push(removeStyle);

  // 2. Create the notes window (registered as the primary float widget / desktop popout target)
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

  // Initial settings sync
  windowUI.setSettings(loadSettings());

  // 3. Mount Settings UI (only in main application window, not in native pop-out)
  if (!poppedOut) {
    try {
      const settingsMount = ctx.ui.mount("settings_extensions");
      const settingsUI = createSettingsUI((settings) => {
        windowUI.setSettings(settings);
        if (settings.renderMode === "global" && settings.alwaysInject && !windowUI.hasNotes()) {
          requestNotes();
        }
      });
      settingsMount.appendChild(settingsUI.root);
      cleanups.push(() => settingsUI.destroy());
    } catch (err) {
      console.warn("[Looking Glass] Could not mount settings UI", err);
    }

    // 4. Create the float widget launcher icon on the page
    try {
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

      // Persistence for launcher widget position
      const POS_KEY = "looking-glass-widget-pos";
      const savedPos = JSON.parse(localStorage.getItem(POS_KEY) || "{}");
      if (savedPos.x !== undefined && savedPos.y !== undefined) {
        widget.moveTo(savedPos.x, savedPos.y);
      }

      widget.onDragEnd((pos) => {
        localStorage.setItem(POS_KEY, JSON.stringify(pos));
      });

      widgetContent.addEventListener("click", (e) => {
        e.stopPropagation();
        windowUI.toggle();
        if (windowUI.isOpen()) {
          requestNotes();
        }
      });
    } catch (err) {
      console.warn("[Looking Glass] Could not create launcher float widget", err);
    }
  }

  // 5. Pre-fetch notes if needed or if popped out
  if (poppedOut || globalStylesWanted()) {
    requestNotes();
  }

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

  // 7. Handle widget returned from native pop-out
  if (!poppedOut && typeof window !== "undefined") {
    const handleReturned = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail && (detail.extensionId === "looking_glass" || detail.extensionId === "looking-glass")) {
        windowUI.show();
        requestNotes();
      }
    };
    window.addEventListener("spindle:desktop-widget-returned", handleReturned);
    cleanups.push(() => window.removeEventListener("spindle:desktop-widget-returned", handleReturned));
  }

  return () => {
    cleanups.forEach((c) => c());
  };
}
