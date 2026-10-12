export type RenderMode = "widget" | "global";

export interface LgSettings {
  renderMode: RenderMode;
  alwaysInject: boolean;
}

export const SETTINGS_KEY = "looking-glass-settings";

export function loadSettings(): LgSettings {
  let stored: Partial<{ renderMode: string; alwaysInject: boolean }> = {};
  try {
    stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") ?? {};
  } catch {
    stored = {};
  }
  return {
    // "window" was the pre-1.2 name for what is now the widget-only mode.
    renderMode: stored.renderMode === "global" ? "global" : "widget",
    alwaysInject: stored.alwaysInject === true,
  };
}

export interface SettingsUI {
  root: HTMLElement;
  destroy(): void;
}

export function createSettingsUI(onChanged: (settings: LgSettings) => void): SettingsUI {
  const settings = loadSettings();

  const root = document.createElement("section");
  root.className = "lg-settings-card";
  root.style.cssText = `
    background: var(--lumiverse-bg-elevated);
    border: 1px solid var(--lumiverse-border);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
  `;

  const header = document.createElement("header");
  header.style.marginBottom = "16px";
  header.innerHTML = `<h3 style="margin:0; color:var(--lumiverse-accent);">Looking Glass</h3>`;

  const body = document.createElement("div");

  // Render Mode
  const modeItem = document.createElement("div");
  modeItem.style.marginBottom = "16px";
  modeItem.innerHTML = `
    <label style="display:block; font-weight:600; margin-bottom:4px;">Style Rendering Mode</label>
    <select id="lg-mode-select" style="width:100%; padding:8px; border-radius:6px; background:var(--lumiverse-fill-subtle); color:inherit; border:1px solid var(--lumiverse-border);">
      <option value="widget" ${settings.renderMode === "widget" ? "selected" : ""}>Widget Only (Isolated)</option>
      <option value="global" ${settings.renderMode === "global" ? "selected" : ""}>Global (Entire App)</option>
    </select>
    <p style="font-size:0.8em; opacity:0.6; margin-top:4px;">Widget Only keeps everything the notes contain (styles, backgrounds, effects like rain) inside the Looking Glass widget. Global lets the notes re-theme the entire Lumiverse interface.</p>
  `;

  // Always Inject
  const alwaysItem = document.createElement("div");
  alwaysItem.id = "lg-always-container";
  alwaysItem.style.opacity = settings.renderMode === "widget" ? "0.5" : "1";
  alwaysItem.innerHTML = `
    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
      <input type="checkbox" id="lg-always-check" ${settings.alwaysInject ? "checked" : ""} ${settings.renderMode === "widget" ? "disabled" : ""}>
      <span>Always Apply Global Styles</span>
    </label>
    <p style="font-size:0.8em; opacity:0.6; margin-top:4px;">Keep the notes' global styling and ambient effects active even when the Looking Glass widget is closed.</p>
  `;

  body.appendChild(modeItem);
  body.appendChild(alwaysItem);
  root.appendChild(header);
  root.appendChild(body);

  const modeSelect = modeItem.querySelector("#lg-mode-select") as HTMLSelectElement;
  const alwaysCheck = alwaysItem.querySelector("#lg-always-check") as HTMLInputElement;

  function update() {
    settings.renderMode = modeSelect.value === "global" ? "global" : "widget";
    settings.alwaysInject = alwaysCheck.checked;

    // UI state
    alwaysItem.style.opacity = settings.renderMode === "widget" ? "0.5" : "1";
    alwaysCheck.disabled = settings.renderMode === "widget";

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    onChanged({ ...settings });
  }

  modeSelect.addEventListener("change", update);
  alwaysCheck.addEventListener("change", update);

  return {
    root,
    destroy() {
      root.remove();
    },
  };
}
