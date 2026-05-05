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
