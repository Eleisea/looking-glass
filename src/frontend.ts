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
    shortName: 'LookGlass',
    description: "Configure LookingGlass renderer location",
    keywords: ['notes', 'creator', 'character', 'settings', 'lookingglass'],
    headerTitle: "LookingGlass",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32"><g fill="currentColor"><path d="M16 27.15c3.733 0 6.76-4.867 6.76-10.87S19.733 5.41 16 5.41s-6.76 4.867-6.76 10.87S12.267 27.15 16 27.15m5.76-10.87c0 2.845-.72 5.373-1.83 7.158c-1.118 1.8-2.535 2.712-3.93 2.712s-2.812-.912-3.93-2.712a11 11 0 0 1-1.024-2.172l9.85-10.134c.543 1.49.864 3.249.864 5.148"/><path d="M16 1a5.67 5.67 0 0 0-4.719 2.525l-1.024 1.536a3 3 0 0 1-1.154 1.02l-1.583.79a5 5 0 0 0-2.303 6.568l.601 1.304a3 3 0 0 1 0 2.514l-.601 1.304a5 5 0 0 0 2.303 6.567l1.583.791a3 3 0 0 1 1.154 1.02l1.024 1.536a5.67 5.67 0 0 0 9.438 0l1.024-1.536a3 3 0 0 1 1.154-1.02l1.583-.79a5 5 0 0 0 2.303-6.568l-.602-1.304a3 3 0 0 1 0-2.514l.602-1.304a5 5 0 0 0-2.303-6.567l-1.583-.791a3 3 0 0 1-1.154-1.02l-1.024-1.536A5.67 5.67 0 0 0 15.999 1m-3.055 3.635a3.67 3.67 0 0 1 6.11 0l1.024 1.536a5 5 0 0 0 1.924 1.698l1.582.792a3 3 0 0 1 1.382 3.94l-.601 1.304a5 5 0 0 0 0 4.19l.601 1.304a3 3 0 0 1-1.382 3.94l-1.582.792a5 5 0 0 0-1.924 1.698l-1.024 1.536a3.67 3.67 0 0 1-6.11 0l-1.024-1.536a5 5 0 0 0-1.924-1.698l-1.582-.792a3 3 0 0 1-1.382-3.94l.601-1.304a5 5 0 0 0 0-4.19l-.6-1.305a3 3 0 0 1 1.382-3.94l1.582-.792a5 5 0 0 0 1.924-1.698z"/></g></svg>`
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
      <div id="lg-settings-debug" style="margin-top: 8px; color: var(--lumiverse-text-dim); font-size: 10px;"></div>
    </div>
  `;

  const selectEl = tab.root.querySelector('#lg-renderer-select') as HTMLSelectElement;
  selectEl.value = activeRenderer;
  selectEl.addEventListener('change', (e) => {
    activeRenderer = (e.target as HTMLSelectElement).value as any;
    try { localStorage.setItem('lookingglass_renderer', activeRenderer); } catch(e){}
    applyRendererMode();
  });

  const debugEl = tab.root.querySelector('#lg-settings-debug') as HTMLElement;
  const statusEl = tab.root.querySelector('#lg-settings-status') as HTMLElement;

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

  // 3. Shadow DOM Piercing Helper
  function findInShadows(selector: string, root: ParentNode = document): Element | null {
    const el = root.querySelector(selector);
    if (el) return el;
    
    const all = root.querySelectorAll('*');
    for (const node of Array.from(all)) {
      if (node.shadowRoot) {
        const found = findInShadows(selector, node.shadowRoot);
        if (found) return found;
      }
    }
    return null;
  }

  // 4. Profile Panel DOM Observer
  let profileSectionNode: HTMLElement | null = null;
  const profileObserver = new MutationObserver(() => {
    if (activeRenderer !== 'profile' || isCleaningUp) return;
    
    // Look for the Profile panel container, potentially inside shadow roots
    const selectors = [
      '[class*="CharacterProfile_profile__"]',
      '[class*="CharacterProfile_groupProfile__"]',
      '.profile',
      '.groupProfile',
      '[class*="CharacterProfile_profile"]'
    ];
    
    let profileContainer: Element | null = null;
    for (const s of selectors) {
      profileContainer = findInShadows(s);
      if (profileContainer) break;
    }
    
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

  // 5. Listen to Backend
  let lastBackendUpdate = 0;
  const unsubBackend = ctx.onBackendMessage(async (payload: any) => {
    if (payload.type === 'creator_notes') {
      lastBackendUpdate = Date.now();
      currentNotes = payload.content;
      await renderNotesToDOM();
      
      if (statusEl) {
        if (payload.error) {
          statusEl.textContent = `Error: ${payload.error}`;
          statusEl.style.color = 'var(--lumiverse-error)';
        } else {
          statusEl.textContent = 'Notes loaded successfully.';
          statusEl.style.color = 'var(--lumiverse-text-muted)';
        }
      }
      if (debugEl) {
        debugEl.textContent = `Last update: ${new Date().toLocaleTimeString()} (Length: ${currentNotes.length})`;
      }
    }
  });

  // 6. Request data with retry
  function requestNotes() {
    if (isCleaningUp) return;
    ctx.sendToBackend({ type: 'get_creator_notes' });
    
    // If no response after 5 seconds, retry once (maybe backend worker was sleeping)
    setTimeout(() => {
      if (lastBackendUpdate === 0 && !isCleaningUp) {
        ctx.sendToBackend({ type: 'get_creator_notes' });
        if (debugEl) debugEl.textContent = 'Retrying backend request...';
      }
    }, 5000);
  }

  requestNotes();

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
