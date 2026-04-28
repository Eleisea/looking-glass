import type { SpindleFrontendContext } from 'lumiverse-spindle-types';
import { marked } from 'marked';

export function setup(ctx: SpindleFrontendContext) {
  let isCleaningUp = false;

  // Add some styles
  const removeStyle = ctx.dom.addStyle(`
    .lg-container {
      padding: 16px;
      color: var(--lumiverse-text);
      font-family: inherit;
      overflow-y: auto;
      height: 100%;
      box-sizing: border-box;
    }
    .lg-setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--lumiverse-border);
    }
    .lg-select {
      background: var(--lumiverse-fill);
      color: var(--lumiverse-text);
      border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius);
      padding: 6px 12px;
      cursor: pointer;
    }
    .lg-content-renderer {
      color: var(--lumiverse-text);
      font-family: inherit;
      line-height: 1.5;
    }
    .lg-content-renderer h1, .lg-content-renderer h2, .lg-content-renderer h3 {
      margin-top: 0;
      color: var(--lumiverse-text);
    }
    .lg-content-renderer a {
      color: var(--lumiverse-accent);
      text-decoration: none;
    }
    .lg-content-renderer a:hover {
      text-decoration: underline;
    }
    .lg-content-renderer p {
      margin-bottom: 12px;
    }
    /* Float widget specific styles */
    .lg-widget-chrome {
      background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    .lg-widget-header {
      background: var(--lumiverse-fill);
      padding: 8px 12px;
      border-bottom: 1px solid var(--lumiverse-border);
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: grab;
    }
    .lg-widget-close {
      background: none;
      border: none;
      color: var(--lumiverse-text-muted);
      cursor: pointer;
      font-size: 16px;
    }
    .lg-widget-content {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }
    /* Profile Panel Injection styles */
    .lg-profile-section {
      margin-top: 16px;
      margin-bottom: 16px;
      background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border);
      border-radius: var(--lumiverse-radius);
      overflow: hidden;
    }
    .lg-profile-header {
      padding: 10px 14px;
      font-weight: bold;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid var(--lumiverse-border);
    }
    .lg-profile-content {
      padding: 14px;
      font-size: 13px;
    }
    .lg-error {
      color: var(--lumiverse-text-muted);
      font-style: italic;
    }
  `);

  // State
  let currentNotes = '';
  let activeRenderer: 'float' | 'profile' | 'none' = 'float';
  
  // Try loading setting from localStorage if available
  try {
    const saved = localStorage.getItem('lookingglass_renderer');
    if (saved) activeRenderer = saved as any;
  } catch(e) {}

  // 1. Settings Tab
  const tab = ctx.ui.registerDrawerTab({
    id: 'looking_glass_settings',
    title: "LookingGlass Settings",
    shortName: 'LG Settings',
    description: "Configure LookingGlass renderer location",
    keywords: ['notes', 'creator', 'character', 'settings', 'lookingglass'],
    headerTitle: "LookingGlass"
  });

  tab.root.innerHTML = `
    <div class="lg-container">
      <div class="lg-setting-row">
        <div>
          <strong>Renderer Location</strong>
          <div style="font-size: 12px; color: var(--lumiverse-text-muted); margin-top: 4px;">
            Choose where the notes should be displayed.
          </div>
        </div>
        <select id="lg-renderer-select" class="lg-select">
          <option value="float">Floating Window</option>
          <option value="profile">Profile Panel (Sidebar)</option>
          <option value="none">Hidden</option>
        </select>
      </div>
      
      <div id="lg-settings-status" style="margin-top: 20px; color: var(--lumiverse-text-muted); font-size: 12px;">Waiting for backend...</div>
    </div>
  `;

  const selectEl = tab.root.querySelector('#lg-renderer-select') as HTMLSelectElement;
  selectEl.value = activeRenderer;
  selectEl.addEventListener('change', (e) => {
    activeRenderer = (e.target as HTMLSelectElement).value as any;
    try { localStorage.setItem('lookingglass_renderer', activeRenderer); } catch(e){}
    applyRendererMode();
  });

  // 2. Float Widget
  const widget = ctx.ui.createFloatWidget({
    width: 320,
    height: 400,
    initialPosition: { x: window.innerWidth - 340, y: 100 },
    snapToEdge: true,
    tooltip: "Creator's Notes",
    chromeless: true,
  });

  widget.root.innerHTML = `
    <div class="lg-widget-chrome">
      <div class="lg-widget-header">
        <span>Creator's Notes</span>
        <button class="lg-widget-close" aria-label="Close widget">&times;</button>
      </div>
      <div class="lg-widget-content lg-content-renderer"></div>
    </div>
  `;
  
  const widgetContent = widget.root.querySelector('.lg-widget-content') as HTMLElement;
  const widgetCloseBtn = widget.root.querySelector('.lg-widget-close') as HTMLElement;
  
  widgetCloseBtn.addEventListener('click', () => {
    widget.setVisible(false);
    if (activeRenderer === 'float') {
      activeRenderer = 'none';
      selectEl.value = 'none';
      try { localStorage.setItem('lookingglass_renderer', 'none'); } catch(e){}
    }
  });

  // 3. Profile Panel DOM Observer
  let profileSectionNode: HTMLElement | null = null;
  const profileObserver = new MutationObserver(() => {
    if (activeRenderer !== 'profile' || isCleaningUp) return;
    
    // Look for the Profile panel container
    const profileContainer = document.querySelector('[class*="CharacterProfile_profile__"], [class*="CharacterProfile_groupProfile__"]');
    if (profileContainer) {
      if (!profileSectionNode || !profileContainer.contains(profileSectionNode)) {
        injectIntoProfilePanel(profileContainer as HTMLElement);
      }
    }
  });
  
  profileObserver.observe(document.body, { childList: true, subtree: true });

  function injectIntoProfilePanel(container: HTMLElement) {
    if (profileSectionNode && profileSectionNode.parentNode) {
      profileSectionNode.parentNode.removeChild(profileSectionNode);
    }
    
    profileSectionNode = document.createElement('div');
    profileSectionNode.className = 'lg-profile-section';
    profileSectionNode.innerHTML = `
      <div class="lg-profile-header">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
        Creator's Notes
      </div>
      <div class="lg-profile-content lg-content-renderer"></div>
    `;
    
    // Append it safely
    container.appendChild(profileSectionNode);
    renderNotesToDOM();
  }

  function applyRendererMode() {
    // Float widget
    if (activeRenderer === 'float') {
      widget.setVisible(true);
    } else {
      widget.setVisible(false);
    }
    
    // Profile Panel
    if (activeRenderer !== 'profile' && profileSectionNode && profileSectionNode.parentNode) {
      profileSectionNode.parentNode.removeChild(profileSectionNode);
      profileSectionNode = null;
    }
    
    renderNotesToDOM();
  }

  // Render function
  async function renderNotesToDOM() {
    let html = '';
    
    if (!currentNotes || currentNotes.trim() === '') {
      html = '<div class="lg-error">No creator notes available for this character.</div>';
    } else {
      try {
        html = await marked.parse(currentNotes);
      } catch (err) {
        html = '<div class="lg-error">Error parsing notes as Markdown.</div>';
      }
    }
    
    if (activeRenderer === 'float' && widgetContent) {
      widgetContent.innerHTML = html;
    }
    
    if (activeRenderer === 'profile' && profileSectionNode) {
      const pContent = profileSectionNode.querySelector('.lg-profile-content');
      if (pContent) pContent.innerHTML = html;
    }
  }

  // Listen to Backend
  const unsubBackend = ctx.onBackendMessage(async (payload: any) => {
    if (payload.type === 'creator_notes') {
      currentNotes = payload.content;
      await renderNotesToDOM();
      
      const statusEl = tab.root.querySelector('#lg-settings-status');
      if (statusEl) statusEl.textContent = 'Notes loaded successfully.';
    }
  });

  // Request initial data
  ctx.sendToBackend({ type: 'get_creator_notes' });

  // Initial apply
  applyRendererMode();

  // Cleanup
  return () => {
    isCleaningUp = true;
    unsubBackend();
    removeStyle();
    tab.destroy();
    widget.destroy();
    profileObserver.disconnect();
    if (profileSectionNode && profileSectionNode.parentNode) {
      profileSectionNode.parentNode.removeChild(profileSectionNode);
    }
  };
}
