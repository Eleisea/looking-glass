export interface SettingsUI {
  root: HTMLElement;
  destroy(): void;
}

export function createSettingsUI(onChanged: (settings: { renderMode: string, alwaysInject: boolean }) => void): SettingsUI {
  const STORAGE_KEY = "looking-glass-settings";
  const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify({
    renderMode: "window",
    alwaysInject: false,
  }));

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
      <option value="window" ${settings.renderMode === "window" ? "selected" : ""}>Window Only (Isolated)</option>
      <option value="global" ${settings.renderMode === "global" ? "selected" : ""}>Global (Entire App)</option>
    </select>
    <p style="font-size:0.8em; opacity:0.6; margin-top:4px;">Global allows character notes to re-theme the entire Lumiverse interface.</p>
  `;

  // Always Inject
  const alwaysItem = document.createElement("div");
  alwaysItem.id = "lg-always-container";
  alwaysItem.style.opacity = settings.renderMode === "window" ? "0.5" : "1";
  alwaysItem.innerHTML = `
    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
      <input type="checkbox" id="lg-always-check" ${settings.alwaysInject ? "checked" : ""} ${settings.renderMode === "window" ? "disabled" : ""}>
      <span>Always Apply Global Styles</span>
    </label>
    <p style="font-size:0.8em; opacity:0.6; margin-top:4px;">Apply global styles even when the Looking Glass window is closed.</p>
  `;

  body.appendChild(modeItem);
  body.appendChild(alwaysItem);
  root.appendChild(header);
  root.appendChild(body);

  const modeSelect = modeItem.querySelector("#lg-mode-select") as HTMLSelectElement;
  const alwaysCheck = alwaysItem.querySelector("#lg-always-check") as HTMLInputElement;

  function update() {
    settings.renderMode = modeSelect.value;
    settings.alwaysInject = alwaysCheck.checked;
    
    // UI state
    alwaysItem.style.opacity = settings.renderMode === "window" ? "0.5" : "1";
    alwaysCheck.disabled = settings.renderMode === "window";
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    onChanged(settings);
  }

  modeSelect.addEventListener("change", update);
  alwaysCheck.addEventListener("change", update);

  return {
    root,
    destroy() {
      root.remove();
    }
  };
}
