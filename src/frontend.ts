import type { SpindleFrontendContext } from 'lumiverse-spindle-types';
import { marked } from 'marked';

export function setup(ctx: SpindleFrontendContext) {
  // Add some styles
  const removeStyle = ctx.dom.addStyle(`
    .scribe-container {
      padding: 16px;
      color: var(--lumiverse-text);
      font-family: inherit;
      overflow-y: auto;
      height: 100%;
      box-sizing: border-box;
    }
    .scribe-container h1, .scribe-container h2, .scribe-container h3 {
      margin-top: 0;
      color: var(--lumiverse-text);
    }
    .scribe-container a {
      color: var(--lumiverse-accent);
      text-decoration: none;
    }
    .scribe-container a:hover {
      text-decoration: underline;
    }
    .scribe-container p {
      margin-bottom: 12px;
      line-height: 1.5;
    }
    .scribe-widget-chrome {
      background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: inherit;
      color: var(--lumiverse-text);
    }
    .scribe-widget-header {
      background: var(--lumiverse-fill);
      padding: 8px 12px;
      border-bottom: 1px solid var(--lumiverse-border);
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: grab;
    }
    .scribe-widget-header:active {
      cursor: grabbing;
    }
    .scribe-widget-close {
      background: none;
      border: none;
      color: var(--lumiverse-text-muted);
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
    }
    .scribe-widget-close:hover {
      color: var(--lumiverse-text);
    }
    .scribe-widget-content {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }
    .scribe-widget-content h1, .scribe-widget-content h2, .scribe-widget-content h3 {
      margin-top: 0;
    }
    .scribe-error {
      color: var(--lumiverse-text-muted);
      font-style: italic;
    }
  `);

  // State
  let currentNotes = '';
  
  // Register Drawer Tab
  const tab = ctx.ui.registerDrawerTab({
    id: 'scribe_tab',
    title: "Creator's Notes",
    shortName: 'Notes',
    description: "View the active character's creator notes",
    keywords: ['notes', 'creator', 'character'],
    headerTitle: "Creator's Notes"
  });

  const tabContainer = document.createElement('div');
  tabContainer.className = 'scribe-container';
  tab.root.appendChild(tabContainer);

  // Register Float Widget
  const widget = ctx.ui.createFloatWidget({
    width: 320,
    height: 400,
    initialPosition: { x: window.innerWidth - 340, y: 100 },
    snapToEdge: true,
    tooltip: "Creator's Notes",
    chromeless: true,
  });

  widget.root.innerHTML = `
    <div class="scribe-widget-chrome">
      <div class="scribe-widget-header">
        <span>Creator's Notes</span>
        <button class="scribe-widget-close" aria-label="Close widget">&times;</button>
      </div>
      <div class="scribe-widget-content"></div>
    </div>
  `;
  
  const widgetContent = widget.root.querySelector('.scribe-widget-content') as HTMLElement;
  const widgetCloseBtn = widget.root.querySelector('.scribe-widget-close') as HTMLElement;
  
  // Hide the widget by default, let user toggle it via the tab
  widget.setVisible(false);

  widgetCloseBtn.addEventListener('click', () => {
    widget.setVisible(false);
  });

  // Controls for toggling widget from the tab
  const toggleBtnContainer = document.createElement('div');
  toggleBtnContainer.style.marginBottom = '16px';
  toggleBtnContainer.style.paddingBottom = '16px';
  toggleBtnContainer.style.borderBottom = '1px solid var(--lumiverse-border)';
  
  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = 'Toggle Floating Window';
  toggleBtn.style.cssText = `
    padding: 8px 12px;
    background: var(--lumiverse-fill);
    border: 1px solid var(--lumiverse-border);
    border-radius: var(--lumiverse-radius);
    color: var(--lumiverse-text);
    cursor: pointer;
    font-weight: bold;
    width: 100%;
  `;
  toggleBtn.addEventListener('mouseover', () => {
    toggleBtn.style.background = 'var(--lumiverse-fill-subtle)';
  });
  toggleBtn.addEventListener('mouseout', () => {
    toggleBtn.style.background = 'var(--lumiverse-fill)';
  });
  toggleBtn.addEventListener('click', () => {
    widget.setVisible(!widget.isVisible());
  });
  
  toggleBtnContainer.appendChild(toggleBtn);
  tabContainer.appendChild(toggleBtnContainer);

  const notesContainer = document.createElement('div');
  tabContainer.appendChild(notesContainer);

  // Render function
  async function renderNotes(content: string) {
    currentNotes = content;
    let html = '';
    
    if (!content || content.trim() === '') {
      html = '<div class="scribe-error">No creator notes available for this character.</div>';
    } else {
      // Parse markdown to HTML
      try {
        html = await marked.parse(content);
      } catch (err) {
        html = '<div class="scribe-error">Error parsing notes as Markdown.</div>';
      }
    }
    
    // Inject into Tab
    notesContainer.innerHTML = html;
    
    // Inject into Widget
    if (widgetContent) {
      widgetContent.innerHTML = html;
    }
  }

  // Listen to Backend
  const unsubBackend = ctx.onBackendMessage(async (payload: any) => {
    if (payload.type === 'creator_notes') {
      await renderNotes(payload.content);
    }
  });

  // Request initial data
  ctx.sendToBackend({ type: 'get_creator_notes' });

  // Cleanup
  return () => {
    unsubBackend();
    removeStyle();
    tab.destroy();
    widget.destroy();
  };
}
