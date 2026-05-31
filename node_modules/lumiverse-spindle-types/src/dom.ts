import type { RequestInitDTO } from "./api";

/** DOM helper API provided to frontend extension modules. */
export interface SpindleDOMHelper {
  /** Inject sanitized HTML into the host document at the given target. */
  inject(target: string | Element, html: string, position?: InsertPosition): Element;

  /** Create a style element in the host document. Returns a removal function. */
  addStyle(css: string): () => void;

  /** Create an element in the host document with optional attributes. */
  createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attrs?: Record<string, string>
  ): HTMLElementTagNameMap[K];

  /** Create a host-managed sandboxed iframe for isolated scriptable content. */
  createSandboxFrame(options: SpindleSandboxFrameOptions): SpindleSandboxFrameHandle;

  /** Query inside the extension-owned host DOM. */
  query(selector: string): Element | null;

  /** Query all matches inside the extension-owned host DOM. */
  queryAll(selector: string): Element[];

  /** Remove all DOM created by the extension helper. */
  cleanup(): void;
}

export type SpindleMountPoint =
  | "sidebar"
  | "chat_toolbar"
  | "message_footer"
  | "settings_extensions";

// ── Drawer Tab ──

export interface SpindleDrawerTabOptions {
  /** Unique tab identifier. Used internally for routing and state. */
  id: string;
  /** Full display title shown in the panel header and command palette listing. */
  title: string;
  /** Short label shown beneath the sidebar icon (max ~8 chars, truncated with ellipsis). Falls back to `title` if omitted. */
  shortName?: string;
  /** One-line description shown in the command palette. Falls back to "Open {title} extension tab" if omitted. */
  description?: string;
  /** Keywords for command palette fuzzy search (e.g. ["settings", "config", "options"]). The extension name is always included automatically. */
  keywords?: string[];
  /** Title shown in the panel header navbar. Falls back to `title` if omitted. Useful when the header needs a shorter label than the command palette entry. */
  headerTitle?: string;
  /** URL to a 16x16 or 24x24 icon image. Mutually exclusive with `iconSvg`. */
  iconUrl?: string;
  /** Inline SVG string for the tab icon. Mutually exclusive with `iconUrl`. */
  iconSvg?: string;
}

export interface SpindleDrawerTabHandle {
  root: HTMLElement;
  tabId: string;
  setTitle(title: string): void;
  /** Update the short label shown beneath the sidebar icon. */
  setShortName(shortName: string): void;
  setBadge(text: string | null): void;
  activate(): void;
  destroy(): void;
  /** Register a callback fired when the active drawer tab switches to this tab. Returns an unsubscribe function. */
  onActivate(handler: () => void): () => void;
}

// ── Float Widget ──

export interface SpindleFloatWidgetOptions {
  width?: number;
  height?: number;
  initialPosition?: { x: number; y: number };
  snapToEdge?: boolean;
  tooltip?: string;
  /** Strip default container chrome (border, background, shadow, border-radius).
   *  The extension fully owns the visual presentation. */
  chromeless?: boolean;
  /** When true, the widget is created in fullscreen mode anchored to the
   *  viewport origin (0,0) and sized to fill the entire viewport. */
  fullscreen?: boolean;
}

export interface SpindleFloatWidgetHandle {
  root: HTMLElement;
  widgetId: string;
  moveTo(x: number, y: number): void;
  getPosition(): { x: number; y: number };
  /** Update the widget's rendered width/height in the host container. */
  setSize(width: number, height: number): void;
  setVisible(visible: boolean): void;
  isVisible(): boolean;
  /** Toggle fullscreen mode. When enabled the host resizes the widget to
   *  fill the viewport and anchors it at (0,0). Disabling restores the
   *  previous size and position. */
  setFullscreen(fullscreen: boolean): void;
  /** Returns true when the widget is currently in fullscreen mode. */
  isFullscreen(): boolean;
  destroy(): void;
  onDragEnd(handler: (pos: { x: number; y: number }) => void): () => void;
}

// ── Dock Panel ──

export type SpindleDockEdge = "left" | "right" | "top" | "bottom";

export interface SpindleDockPanelOptions {
  edge: SpindleDockEdge;
  title: string;
  size: number;
  minSize?: number;
  maxSize?: number;
  resizable?: boolean;
  iconUrl?: string;
  startCollapsed?: boolean;
}

export interface SpindleDockPanelHandle {
  root: HTMLElement;
  panelId: string;
  collapse(): void;
  expand(): void;
  isCollapsed(): boolean;
  setTitle(title: string): void;
  destroy(): void;
  onVisibilityChange(handler: (visible: boolean) => void): () => void;
}

// ── App Mount ──

export interface SpindleAppMountOptions {
  className?: string;
  position?: "start" | "end";
}

export interface SpindleAppMountHandle {
  root: HTMLElement;
  mountId: string;
  setVisible(visible: boolean): void;
  destroy(): void;
}

// ── Input Bar Action ──

export interface SpindleInputBarActionOptions {
  id: string;
  label: string;
  subtitle?: string;
  iconSvg?: string;
  iconUrl?: string;
  enabled?: boolean;
}

export interface SpindleInputBarActionHandle {
  actionId: string;
  setLabel(label: string): void;
  setSubtitle(subtitle?: string): void;
  setEnabled(enabled: boolean): void;
  onClick(handler: () => void): () => void;
  destroy(): void;
}

// ── Sandboxed Frame ──

export interface SpindleSandboxFrameOptions {
  /** HTML document or fragment rendered inside the sandboxed iframe. */
  html: string;
  /** Automatically resize the host iframe to fit the child content. Default: `true`. */
  autoResize?: boolean;
  /** Initial host iframe height in CSS pixels. Default: `minHeight` or `40`. */
  initialHeight?: number;
  /** Minimum host iframe height in CSS pixels. Default: `40`. */
  minHeight?: number;
  /** Maximum host iframe height in CSS pixels. Default: `4000`. */
  maxHeight?: number;
}

export interface SpindleSandboxFrameHandle {
  /** The sandboxed iframe element. Extensions may place and style it like any other element. */
  element: HTMLIFrameElement;
  /** Replace the child document contents. */
  setContent(html: string): void;
  /** Send a message payload into the child sandbox runtime. */
  postMessage(payload: unknown): void;
  /** Receive payloads sent from the child sandbox runtime. */
  onMessage(handler: (payload: unknown) => void): () => void;
  /** Destroy the sandbox and remove the iframe from the DOM. */
  destroy(): void;
}

/** API exposed inside the sandboxed iframe as `window.spindleSandbox`. */
export interface SpindleSandboxAPI {
  postMessage(payload: unknown): void;
  onMessage(handler: (payload: unknown) => void): () => void;
  requestResize(height?: number): void;
  /** Fetch a URL through the extension's CORS proxy. Requires the `cors_proxy` permission. */
  corsProxy(url: string, options?: RequestInitDTO): Promise<unknown>;
}

export interface SpindleUploadFile {
  name: string;
  mimeType: string;
  sizeBytes: number;
  bytes: Uint8Array;
}

export interface SpindleMessageTagIntercept {
  extensionId: string;
  tagName: string;
  attrs: Record<string, string>;
  content: string;
  fullMatch: string;
  messageId?: string;
  chatId?: string;
  isUser?: boolean;
  isStreaming?: boolean;
}

export interface SpindleMessageTagInterceptorOptions {
  tagName: string;
  attrs?: Record<string, string>;
  removeFromMessage?: boolean;
}

export interface SpindleMessageWidgetOptions {
  /** Message ID that should host the widget. */
  messageId: string;
  /** Stable extension-defined widget ID, unique within the target message. */
  widgetId: string;
  /** HTML document or fragment rendered inside a host-managed opaque-origin iframe. */
  html: string;
  /** Minimum iframe height in CSS pixels. Default: 40. */
  minHeight?: number;
  /** Maximum iframe height in CSS pixels. Default: 4000. */
  maxHeight?: number;
}

/** Options for `permissions.request()` — displayed in the system confirmation modal. */
export interface PermissionRequestOptions {
  /** Human-readable explanation of why the extension needs these permissions.
   *  Shown to the user in the confirmation modal. */
  reason?: string;
}

// ── Text Editor ──

export interface SpindleTextEditorOptions {
  /** Modal title. Default: "Edit Text" */
  title?: string;
  /** Initial text content. Default: "" */
  value?: string;
  /** Placeholder text. Default: "" */
  placeholder?: string;
  /** Enable macro syntax highlighting and insertion panel. Default: true */
  macros?: boolean;
}

export interface SpindleTextEditorResult {
  /** The edited text (or original value if cancelled) */
  text: string;
  /** True if the user dismissed the editor without confirming */
  cancelled: boolean;
}

// ── Context Menu ──

export interface SpindleContextMenuOptions {
  /** Screen position to render the menu at. */
  position: { x: number; y: number };
  /** Menu items. Items with `type: 'divider'` render as visual separators. */
  items: SpindleContextMenuItemDef[];
}

export interface SpindleContextMenuItemDef {
  /** Unique key returned when this item is selected. */
  key: string;
  /** Display label. Ignored for dividers. */
  label: string;
  /** Render as disabled (greyed out, not clickable). */
  disabled?: boolean;
  /** Render in danger/red style. */
  danger?: boolean;
  /** Render with active/highlighted style. */
  active?: boolean;
  /** Set to `'divider'` for a visual separator. Default: `'item'`. */
  type?: "item" | "divider";
}

export interface SpindleContextMenuResult {
  /** The `key` of the selected item, or `null` if the menu was dismissed without selection. */
  selectedKey: string | null;
}

// ── Modal ──

/**
 * Options for `ctx.ui.showModal()`.
 * The host renders a system-themed modal overlay with a header (title + close button).
 * The extension receives an HTMLElement (`root` on the handle) and fully owns the body content.
 */
export interface SpindleModalOptions {
  /** Modal title displayed in the header. */
  title: string;
  /** Optional width override. Default: `420`. Clamped to viewport. */
  width?: number;
  /** Optional max-height override. Default: `520`. Clamped to viewport. */
  maxHeight?: number;
  /**
   * If true, clicking the backdrop does NOT dismiss the modal.
   * The user must use the close button or the extension must call `dismiss()`.
   * Default: `false` (backdrop click dismisses).
   */
  persistent?: boolean;
}

/**
 * Handle returned by `ctx.ui.showModal()`.
 * Provides direct DOM access to the modal body and lifecycle controls.
 *
 * Extensions may have at most **2 stacked modals** open simultaneously
 * (e.g. one primary modal and one nested text editor). Attempting to open
 * a third modal will throw an error.
 */
export interface SpindleModalHandle {
  /** The body container element. The extension fully owns this element's contents. */
  root: HTMLElement;
  /** Unique modal ID assigned by the host. */
  modalId: string;
  /** Programmatically close the modal. */
  dismiss(): void;
  /** Update the header title. */
  setTitle(title: string): void;
  /**
   * Register a callback invoked when the modal is dismissed
   * (by the user, by `dismiss()`, or by extension cleanup).
   * Returns an unsubscribe function.
   */
  onDismiss(handler: () => void): () => void;
}

// ── Confirmation Modal ──

/** Visual variant for confirmation modals. Controls the accent color of the confirm button. */
export type SpindleConfirmVariant = "info" | "warning" | "danger" | "success";

/**
 * Options for `ctx.ui.showConfirm()`.
 * The host renders a system-themed confirmation modal with a message,
 * variant-colored accent, and actionable buttons.
 */
export interface SpindleConfirmOptions {
  /** Modal title displayed in the header. */
  title: string;
  /** Body text explaining what the user is confirming. */
  message: string;
  /**
   * Visual variant that controls the confirm button's accent color.
   * - `'info'` — neutral/blue (default)
   * - `'warning'` — yellow/amber
   * - `'danger'` — red — use for destructive or irreversible actions
   * - `'success'` — green
   */
  variant?: SpindleConfirmVariant;
  /** Label for the confirm (primary) button. Default: `"Confirm"`. */
  confirmLabel?: string;
  /** Label for the cancel (secondary) button. Default: `"Cancel"`. */
  cancelLabel?: string;
}

/**
 * Result returned by `ctx.ui.showConfirm()`.
 */
export interface SpindleConfirmResult {
  /** `true` if the user clicked the confirm button, `false` if they cancelled or dismissed. */
  confirmed: boolean;
}

// ── UI Event Helpers ──

export type SpindleUIDomActionEventType = "click" | "pointerdown" | "pointerup";

export interface SpindleUIKeyboardState {
  /** True when the host believes a virtual keyboard is currently visible. */
  visible: boolean;
  /** Safe bottom inset in CSS pixels that keeps content above the keyboard. */
  insetBottom: number;
  /** Current visual viewport width in CSS pixels. */
  viewportWidth: number;
  /** Current visual viewport height in CSS pixels. */
  viewportHeight: number;
}

export interface SpindleUIDrawerState {
  /** Whether the side drawer is currently visible. */
  open: boolean;
  /** Active drawer tab, if any. */
  tabId: string | null;
}

export interface SpindleUISettingsState {
  /** Whether the settings modal is currently visible. */
  open: boolean;
  /** Active settings view identifier. */
  view: string;
}

export interface SpindleUIDomActionDetail {
  /** Matched action identifier read from the target element. */
  actionId: string;
  /** DOM event type that triggered the callback. */
  eventType: SpindleUIDomActionEventType;
  /** Matched descendant element that carried the action identifier. */
  element: HTMLElement;
  /** Bound extension-owned root used for delegation. */
  root: Element;
  /** Native DOM event from the host document. */
  originalEvent: Event;
}

export interface SpindleUIDomActionBindingOptions {
  /** Attribute used to resolve action IDs. Default: `id`. */
  attribute?: string;
  /** Event types to listen for. Default: `["click"]`. */
  events?: SpindleUIDomActionEventType[];
}

export interface SpindleUIEventsHelper {
  /** Read the current virtual keyboard snapshot. */
  getKeyboardState(): SpindleUIKeyboardState;
  /** Subscribe to keyboard visibility / safe-area changes. */
  onKeyboardChange(handler: (state: SpindleUIKeyboardState) => void): () => void;
  /** Read the current side drawer snapshot. */
  getDrawerState(): SpindleUIDrawerState;
  /** Subscribe to side drawer open/close and tab changes. */
  onDrawerChange(handler: (state: SpindleUIDrawerState) => void): () => void;
  /** Read the current settings modal snapshot. */
  getSettingsState(): SpindleUISettingsState;
  /** Subscribe to settings modal open/close and active-view changes. */
  onSettingsChange(handler: (state: SpindleUISettingsState) => void): () => void;
  /**
   * Delegate action handlers from extension-owned DOM.
   *
   * This is intended for non-sandbox UI where the extension injects or mounts
   * host DOM directly and wants to react to user interaction without wiring
   * global document listeners. By default the helper matches descendant
   * elements by `id`, but `options.attribute` can be used instead.
   */
  bindActionHandlers(
    target: string | Element,
    handlers: Record<string, (detail: SpindleUIDomActionDetail) => void>,
    options?: SpindleUIDomActionBindingOptions,
  ): () => void;
}

// ── Frontend Process Lifecycle ──

/** Controller passed to a frontend process instance spawned by the backend runtime. */
export interface SpindleFrontendProcessContext {
  /** Host-assigned ID unique within the extension runtime. */
  processId: string;
  /** Frontend handler key used when the backend called `spindle.frontendProcesses.spawn()`. */
  kind: string;
  /** Optional extension-defined stable key passed at spawn time. */
  key?: string;
  /** Arbitrary spawn payload provided by the backend. */
  payload: unknown;
  /** Optional backend-side bookkeeping metadata snapshot. */
  metadata?: Record<string, unknown>;
  /** Signal that startup completed successfully. Required for startup watchdogs. */
  ready(): void;
  /** Refresh the host-side heartbeat timer for long-lived loops. */
  heartbeat(): void;
  /** Send a process-scoped message back to the backend runtime. */
  send(payload: unknown): void;
  /** Subscribe to process-scoped messages from the backend runtime. */
  onMessage(handler: (payload: unknown) => void): () => void;
  /** Mark the process as completed and release host tracking. */
  complete(result?: unknown): void;
  /** Mark the process as failed. */
  fail(error: string): void;
  /** Called when the backend requests graceful termination. */
  onStop(handler: (detail: { reason?: string }) => void): () => void;
}

/** Registry exposed to frontend modules for backend-spawned frontend processes. */
export interface SpindleFrontendProcessRegistry {
  /**
   * Register a process handler for the given `kind`.
   *
   * The returned cleanup function unregisters the handler. If the handler
   * itself returns a cleanup function, the host should call it when the
   * process is stopped, replaced, or the extension is unloaded.
   */
  register(
    kind: string,
    handler: (
      process: SpindleFrontendProcessContext,
    ) => void | (() => void) | Promise<void | (() => void)>,
  ): () => void;
}

/** Context object provided to frontend extension modules */
export interface SpindleFrontendContext {
  dom: SpindleDOMHelper;
  events: {
    on(event: string, handler: (payload: unknown) => void): () => void;
    emit(event: string, payload: unknown): void;
  };
  ui: {
    events: SpindleUIEventsHelper;
    mount(point: SpindleMountPoint): Element;
    registerDrawerTab(options: SpindleDrawerTabOptions): SpindleDrawerTabHandle;
    createFloatWidget(options?: SpindleFloatWidgetOptions): SpindleFloatWidgetHandle;
    requestDockPanel(options: SpindleDockPanelOptions): SpindleDockPanelHandle;
    mountApp(options?: SpindleAppMountOptions): SpindleAppMountHandle;
    registerInputBarAction(options: SpindleInputBarActionOptions): SpindleInputBarActionHandle;
    /** Show a themed context menu at the given position and wait for the user's selection.
     *  Returns the `key` of the selected item, or `null` if the menu was dismissed. */
    showContextMenu(options: SpindleContextMenuOptions): Promise<SpindleContextMenuResult>;
    /**
     * Open a system-themed modal overlay.
     * The host renders the chrome (backdrop, header with title & close button);
     * the extension owns the body via the returned handle's `root` element.
     *
     * **Stack limit:** A maximum of 2 modals may be open per extension at any
     * time (e.g. one primary modal and one nested text editor or confirmation).
     * Exceeding this limit throws an error.
     *
     * @example
     * ```ts
     * const modal = ctx.ui.showModal({ title: 'Nudge History' })
     * modal.root.innerHTML = '<ul><li>Item 1</li></ul>'
     * modal.onDismiss(() => console.log('closed'))
     * ```
     */
    showModal(options: SpindleModalOptions): SpindleModalHandle;
    /**
     * Show a system-themed confirmation modal and wait for the user's response.
     * Returns `{ confirmed: true }` if the user clicks the confirm button,
     * or `{ confirmed: false }` if they cancel or dismiss the modal.
     *
     * The confirm button is styled according to the `variant` option
     * (info, warning, danger, success) to signal intent to the user.
     *
     * Counts toward the **2 stacked modals** limit per extension.
     *
     * @example
     * ```ts
     * const { confirmed } = await ctx.ui.showConfirm({
     *   title: 'Delete History',
     *   message: 'This will permanently erase all nudge history for this character.',
     *   variant: 'danger',
     *   confirmLabel: 'Delete',
     * })
     * if (confirmed) {
     *   ctx.sendToBackend({ type: 'delete_history', characterId })
     * }
     * ```
     */
    showConfirm(options: SpindleConfirmOptions): Promise<SpindleConfirmResult>;
  };
  uploads: {
    pickFile(options?: {
      accept?: string[];
      multiple?: boolean;
      maxSizeBytes?: number;
    }): Promise<SpindleUploadFile[]>;
  };
  permissions: {
    getGranted(): Promise<string[]>;
    /** Request that the given permissions be granted. Returns the updated granted list.
     *  A system-level confirmation modal is shown to the user before any permissions are applied.
     *  Privileged permissions (e.g. cors_proxy) require admin/owner approval.
     *  Rejects with an error if the user denies the request. */
    request(permissions: string[], options?: PermissionRequestOptions): Promise<string[]>;
  };
  /**
   * Get the currently active chat and character.
   * Returns immediately from the frontend app state — no async, no backend roundtrip.
   * Works reliably on page refresh, extension reload, and initial load.
   *
   * @example
   * ```ts
   * const { chatId, characterId } = ctx.getActiveChat()
   * if (chatId) {
   *   ctx.sendToBackend({ type: 'init', chatId, characterId })
   * }
   * ```
   */
  getActiveChat(): { chatId: string | null; characterId: string | null };
  sendToBackend(payload: unknown): void;
  onBackendMessage(handler: (payload: unknown) => void): () => void;
  /** Structured lifecycle hooks for backend-spawned frontend processes. */
  processes: SpindleFrontendProcessRegistry;
  messages: {
    registerTagInterceptor(
      options: SpindleMessageTagInterceptorOptions,
      handler: (payload: SpindleMessageTagIntercept) => void
    ): () => void;
    /** Render or replace a sandboxed widget below a message. Returns a cleanup function. */
    renderWidget(
      options: SpindleMessageWidgetOptions,
      handler?: (payload: unknown) => void,
    ): () => void;
    /** Remove a previously rendered message widget. */
    removeWidget(messageId: string, widgetId: string): void;
  };
  characters: {
    /** Read a character through the host app's authenticated API. */
    get(characterId: string): Promise<unknown>;
  };
  chats: {
    /** Update a message through the host app's authenticated API. */
    updateMessage(chatId: string, messageId: string, input: { content?: string }): Promise<unknown>;
  };
  manifest: import("./manifest").SpindleManifest;
}

/** What a frontend extension module must export */
export interface SpindleFrontendModule {
  setup(ctx: SpindleFrontendContext): void | (() => void);
  teardown?(): void;
}
