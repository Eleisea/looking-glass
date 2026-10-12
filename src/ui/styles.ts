export const NOTES_CSS = `
.lg-float-widget {
  width: 48px;
  height: 48px;
  aspect-ratio: 1 / 1;
  flex: 0 0 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--lumiverse-fill-subtle);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--lumiverse-border);
  overflow: hidden;
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
  background: var(--lg-window-bg, var(--lcs-glass-bg, var(--lumiverse-bg-elevated)));
  /*backdrop-filter: var(--lg-window-backdrop, blur(var(--lg-window-blur, var(--lcs-glass-blur, 12px))));*/
  /*-webkit-backdrop-filter: var(--lg-window-backdrop, blur(var(--lg-window-blur, var(--lcs-glass-blur, 12px))));*/
  border: var(--lg-window-border, 1px solid var(--lcs-glass-border, var(--lumiverse-border)));
  border-radius: 16px;
  box-shadow: var(--lg-window-shadow, 0 20px 50px rgba(0, 0, 0, 0.4), var(--lumiverse-highlight-inset));
  overflow: hidden;
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  min-width: 280px;
  min-height: 200px;
  color: var(--lumiverse-text);
  font-family: var(--lumiverse-font-sans, system-ui, -apple-system, sans-serif);
  pointer-events: auto;
}

.lg-window[data-lg-window] {
  /* Scope for internal overrides */
}

.lg-window.hidden {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.95) translateY(10px);
}

.lg-window.popped-out {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  min-height: 100vh !important;
  max-height: 100vh !important;
  border-radius: 0 !important;
  border: none !important;
  box-shadow: none !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  margin: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  background: var(--lg-window-bg, var(--lcs-glass-bg, var(--lumiverse-bg-elevated))) !important;
  overflow: hidden !important;
}

.lg-window.popped-out .lg-window-header {
  flex: 0 0 auto !important;
  border-radius: 0 !important;
  border-top: none !important;
  border-left: none !important;
  border-right: none !important;
}

.lg-window.popped-out .lg-viewport {
  flex: 1 1 0 !important;
  min-height: 0 !important;
  height: auto !important;
  position: relative !important;
  overflow: hidden !important;
}

.lg-window.popped-out .lg-window-content {
  position: absolute !important;
  inset: 0 !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
}

.lg-window.popped-out .lg-window-resize-handle {
  display: none !important;
}

.lg-window-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--lg-header-bg, rgba(255, 255, 255, 0.03));
  border-bottom: 1px solid var(--lumiverse-border);
  cursor: grab;
  user-select: none;
  z-index: 2;
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

.lg-window-controls {
  display: flex;
  align-items: center;
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

.lg-global-layer {
  position: fixed !important;
  inset: 0 !important;
  pointer-events: none !important;
  z-index: 9990 !important;
  overflow: hidden !important;
}

/* The viewport doubles as the notes' <body> (see scopePageSelectors) and
   confines position:fixed descendants (rain, overlays, body:before) to the
   widget. "contain: paint" makes it their containing block and clips them. */
.lg-viewport {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  contain: layout paint;
  isolation: isolate;
}

.lg-window-content {
  position: absolute;
  inset: 0;
  padding: 20px;
  overflow-x: hidden;
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

/* Default prose styling: only for plain-markdown notes (no author <style>). */
.lg-prose p {
  margin-bottom: 1em;
}

.lg-prose h1, .lg-prose h2, .lg-prose h3 {
  margin: 1.5em 0 0.5em;
  font-weight: 600;
  color: var(--lumiverse-accent);
}

.lg-prose h1:first-child, .lg-prose h2:first-child {
  margin-top: 0;
}

.lg-prose code {
  background: var(--lumiverse-fill-subtle);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: var(--lumiverse-font-mono, monospace);
  font-size: 0.9em;
}

.lg-prose blockquote {
  border-left: 3px solid var(--lumiverse-accent);
  margin: 1em 0;
  padding-left: 1em;
  color: var(--lumiverse-text-muted);
  font-style: italic;
}

.lg-prose img {
  max-width: 100%;
  height: auto;
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

/* Settings Panel */
.lg-settings-panel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--lumiverse-bg-elevated);
  z-index: 100;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.lg-settings-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--lumiverse-border);
  font-weight: 600;
  color: var(--lumiverse-accent);
}

.lg-settings-close {
  background: none;
  border: none;
  color: var(--lumiverse-text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
}

.lg-settings-close:hover {
  background: var(--lumiverse-fill-hover);
  color: var(--lumiverse-text);
}

.lg-settings-body {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}

.lg-setting-item {
  margin-bottom: 20px;
}

.lg-setting-item label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--lumiverse-text);
}

.lg-setting-item select {
  width: 100%;
  padding: 8px;
  border-radius: 6px;
  background: var(--lumiverse-fill-subtle);
  border: 1px solid var(--lumiverse-border);
  color: var(--lumiverse-text);
  font-family: inherit;
  outline: none;
}

.lg-setting-item select:focus {
  border-color: var(--lumiverse-accent);
}

.lg-setting-hint {
  font-size: 0.75rem;
  color: var(--lumiverse-text-muted);
  margin: 6px 0 0 0;
  line-height: 1.4;
}

.lg-checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.lg-checkbox-label input {
  margin: 0;
  width: 16px;
  height: 16px;
  accent-color: var(--lumiverse-accent);
}

.lg-setting-item.disabled {
  opacity: 0.5;
  pointer-events: none;
}
`;
