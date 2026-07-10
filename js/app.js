(() => {
  "use strict";

  const STORAGE_KEY_THEME = "sugo_ui_theme_v1";
  const STORAGE_KEY_FAVORITES = "sugo_favorite_panes_v1";
  const STORAGE_KEY_RECENT = "sugo_recent_panes_v1";
  const STORAGE_KEY_AI_FAVORITES = "sugo_favorite_ai_tickets_v1";
  const STORAGE_KEY_QUICK_ACCESS_TAB = "sugo_quick_access_tab_v1";
  const MAX_RECENT = 10;
  const MAX_FAVORITES_DISPLAY = 16;
  const MAX_AI_FAVORITES = 12;
  const SUPPORTED_THEMES = new Set(["dark"]);
  const WORKSPACES = Object.freeze({
    ASK_AI: "ask_ai",
    CREATE_TICKET: "create_ticket",
    UPLOAD_IMAGE: "upload_image"
  });
  const TICKET_TYPES = Object.freeze([
    Object.freeze({
      value: "customer_reply",
      label: "Customer reply",
      hint: "Customer reply mode: write a clean ready-to-send SUGO support response.",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v10H9l-5 4v-14Z"/><path d="M8 9h8M8 12.5h5"/></svg>'
    }),
    Object.freeze({
      value: "missing_info",
      label: "Missing information",
      hint: "Missing information mode: write a polite request that asks only for required data/evidence.",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 10.5v5M12 7.5h.01"/></svg>'
    }),
    Object.freeze({
      value: "internal_escalation",
      label: "Internal escalation",
      hint: "Internal escalation mode: summarize the issue, evidence, missing info, and recommended escalation path.",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18.5h16M6 15l4-4 3 3 5-6"/><path d="M14 8h4v4"/></svg>'
    }),
    Object.freeze({
      value: "policy_sensitive",
      label: "Policy-sensitive reply",
      hint: "Policy-sensitive mode: avoid promises, avoid blame, and keep wording safe for bans, abuse, payments, VIP, agency, or withdrawals.",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 19 6v5.5c0 4.2-2.7 7.4-7 9-4.3-1.6-7-4.8-7-9V6l7-2.5Z"/><path d="m9 12 2 2 4-4"/></svg>'
    })
  ]);
  const TICKET_TONES = Object.freeze([
    Object.freeze({ value: "professional", label: "Pro" }),
    Object.freeze({ value: "empathetic", label: "Empathy" }),
    Object.freeze({ value: "firm", label: "Firm" })
  ]);
  const TICKET_OUTPUT_TYPE_TEXT = Object.freeze({
    customer_reply: "clean customer-facing ticket",
    missing_info: "missing-information request",
    internal_escalation: "internal escalation summary",
    policy_sensitive: "safe policy-sensitive reply"
  });
  const TICKET_OUTPUT_TONE_TEXT = Object.freeze({
    professional: "professional",
    empathetic: "empathetic",
    firm: "firm but polite"
  });
  const TICKET_QUICK_PROMPTS = Object.freeze([
    Object.freeze({
      label: "Ready reply",
      prompt: "Write a ready-to-send customer support reply based on this case.",
      type: "customer_reply"
    }),
    Object.freeze({
      label: "Missing info",
      prompt: "Write a polite missing-information request and list exactly what the user must provide.",
      type: "missing_info"
    }),
    Object.freeze({
      label: "Escalation note",
      prompt: "Create an internal escalation summary with evidence required and recommended next team/action.",
      type: "internal_escalation"
    }),
    Object.freeze({
      label: "Polish reply",
      prompt: "Rewrite the customer reply to be shorter, safer, and more professional.",
      type: "customer_reply"
    })
  ]);
  const ASK_AI_QUICK_PROMPTS = Object.freeze([
    Object.freeze({ label: "Agent action", prompt: "What is the correct agent action for this case?" }),
    Object.freeze({ label: "Missing info", prompt: "Check the relevant SOP and list the missing information needed before escalation." }),
    Object.freeze({ label: "Escalation", prompt: "Explain the escalation path and what evidence is required." }),
    Object.freeze({ label: "Short reply draft", prompt: "Give a short customer reply draft, but keep it as an agent answer not a ticket." })
  ]);
  const ASK_AI_RESPONSE_MODES = Object.freeze([
    Object.freeze({ value: "brief", label: "Brief" }),
    Object.freeze({ value: "detailed", label: "Detailed" }),
    Object.freeze({ value: "step", label: "Steps" })
  ]);
  const ASK_AI_KNOWLEDGE_MODES = Object.freeze([
    Object.freeze({ value: "hybrid", label: "Hybrid" }),
    Object.freeze({ value: "sop_only", label: "SOP Only" })
  ]);
  const ASK_AI_FOCUS_MODES = Object.freeze([
    Object.freeze({
      value: "agent",
      label: "Agent guidance",
      hint: "Agent guidance mode: correct action, policy conditions, missing info, and safe support guidance.",
      instruction: "This request came from the dedicated Ask AI workspace. Treat it as an agent-facing support answer. Give the correct action, relevant SOP conditions, missing information, and safe customer guidance. Do not write a customer ticket unless the user specifically asks inside the question."
    }),
    Object.freeze({
      value: "sop_check",
      label: "SOP check + confidence",
      hint: "SOP check mode: verifies the strongest KB match, confidence, and missing details before answering.",
      instruction: "This request came from the dedicated Ask AI workspace. Treat it as an agent-facing SOP check. Start with the best matching policy/procedure, mention confidence when useful, separate what is confirmed by SOP from what needs verification, and avoid writing a customer ticket."
    }),
    Object.freeze({
      value: "troubleshoot",
      label: "Troubleshooting steps",
      hint: "Troubleshooting mode: returns ordered actions, evidence needed, and escalation trigger.",
      instruction: "This request came from the dedicated Ask AI workspace. Treat it as an agent-facing troubleshooting answer. Provide practical steps in the correct order, include what evidence to request, and mention when to escalate. Do not write a customer ticket."
    }),
    Object.freeze({
      value: "escalation",
      label: "Escalation review",
      hint: "Escalation mode: checks whether escalation is needed and what information must be attached.",
      instruction: "This request came from the dedicated Ask AI workspace. Treat it as an escalation review. Identify whether escalation is needed, which team/path should handle it if known, what missing information/evidence is required, and what the agent should avoid promising. Do not write a customer ticket."
    })
  ]);
  const VISION_QUICK_PROMPTS = Object.freeze([
    Object.freeze({ label: "Read screenshot", prompt: "Read the screenshot and identify the visible issue, error message, and correct agent action." }),
    Object.freeze({ label: "Ban evidence", prompt: "Check if this image supports a ban/moderation decision and what wording should be used safely." }),
    Object.freeze({ label: "Payment evidence", prompt: "Analyze payment/recharge/withdrawal evidence and list missing details before escalation." }),
    Object.freeze({ label: "Reply from image", prompt: "Create a safe customer reply based on the attached image and SOP match." })
  ]);
  const VISION_OUTPUT_TYPES = Object.freeze([
    Object.freeze({ value: "answer", label: "Vision answer" }),
    Object.freeze({ value: "ticket", label: "Vision ticket" })
  ]);
  const VISION_RESPONSE_MODES = Object.freeze([
    Object.freeze({ value: "brief", label: "Brief" }),
    Object.freeze({ value: "detailed", label: "Detailed" }),
    Object.freeze({ value: "step", label: "Steps" })
  ]);
  const VISION_KNOWLEDGE_MODES = Object.freeze([
    Object.freeze({ value: "hybrid", label: "Hybrid" }),
    Object.freeze({ value: "sop_only", label: "SOP Only" })
  ]);
  const VISION_ANALYSIS_TYPES = Object.freeze([
    Object.freeze({
      value: "screenshot_case",
      label: "Screenshot case reading",
      shortLabel: "screenshot reading",
      kbQuery: "screenshot visible issue support case SUGO app",
      instruction: "Read the screenshot carefully. Identify visible text, error messages, UI state, account or transaction clues, and the likely support category. Separate what is visible from what is assumed."
    }),
    Object.freeze({
      value: "ban_moderation",
      label: "Ban / moderation evidence",
      shortLabel: "ban / moderation evidence",
      kbQuery: "ban abuse report moderation violation screenshot evidence",
      instruction: "Treat the image as possible moderation or ban evidence. Describe only visible evidence, avoid unsupported accusations, and use safe policy wording. If the image is insufficient, request more evidence or escalate."
    }),
    Object.freeze({
      value: "payment_evidence",
      label: "Recharge / withdrawal evidence",
      shortLabel: "payment or withdrawal evidence",
      kbQuery: "recharge payment withdrawal invoice transaction receipt screenshot",
      instruction: "Treat the image as recharge, payment, withdrawal, exchange, or balance evidence. Extract visible amounts, order IDs, dates, status messages, and missing details before escalation. Do not promise refunds or credit."
    }),
    Object.freeze({
      value: "account_identity",
      label: "Account / profile / agency",
      shortLabel: "account / profile / agency check",
      kbQuery: "account profile identity verification user id agency host screenshot",
      instruction: "Treat the image as account, profile, agency, host, or identity evidence. Extract visible IDs/names/status carefully and request verification if ownership or identity is not conclusive."
    }),
    Object.freeze({
      value: "app_error",
      label: "App error / crash screenshot",
      shortLabel: "app error / crash screenshot",
      kbQuery: "app error crash bug technical issue screenshot not working",
      instruction: "Treat the image as an app issue screenshot. Identify the exact visible error or crash state, then give refresh/log/upload/cache/device steps and escalation trigger if the issue continues."
    })
  ]);
  const TICKET_IMAGE_MAX_FILE_BYTES = 8 * 1024 * 1024;
  const TICKET_IMAGE_MAX_BASE64_CHARS = 6500000;
  const TICKET_IMAGE_MAX_EDGE = 1600;
  const TICKET_IMAGE_JPEG_QUALITY = 0.84;
  const TICKET_IMAGE_ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
  const ticketWorkspaceState = {
    type: "customer_reply",
    tone: "professional",
    caseDetails: "",
    userId: "",
    orderId: "",
    evidence: "",
    generatedOutput: ""
  };
  const ticketRequestState = {
    status: "idle",
    message: "",
    responseBranch: "",
    requestId: 0,
    kbConfidence: "",
    kbPrimaryRoute: ""
  };
  let ticketAttachedImage = null;
  const askAIWorkspaceState = {
    query: "",
    response: "brief",
    sop: "hybrid",
    focus: "agent",
    answer: "",
    currentQuestion: "",
    lastExchange: null
  };
  const askAIRequestState = {
    status: "idle",
    message: "",
    responseBranch: "",
    requestId: 0,
    kbConfidence: "",
    kbConfidenceScore: 0,
    kbPrimaryRoute: "",
    topics: [],
    lastRequest: null,
    copyStatus: ""
  };
  const visionWorkspaceState = {
    output: "answer",
    response: "brief",
    sop: "hybrid",
    analysis: "screenshot_case",
    userId: "",
    contextId: "",
    note: "",
    answer: "",
    currentQuery: ""
  };
  const visionRequestState = {
    status: "idle",
    message: "",
    responseBranch: "",
    requestId: 0,
    kbConfidence: "",
    kbConfidenceScore: 0,
    kbPrimaryRoute: "",
    topics: [],
    lastRequest: null,
    copyStatus: ""
  };
  let visionAttachedImage = null;
  const articleViewState = {
    paneId: "",
    activeLanguage: "ar",
    activeType: "",
    copyStatus: ""
  };
  const SEARCH_RESULT_LIMIT = 60;
  const SEARCH_LANGUAGES = Object.freeze([
    Object.freeze({ value: "all", label: "All" }),
    Object.freeze({ value: "english", label: "English" }),
    Object.freeze({ value: "arabic", label: "Arabic" })
  ]);
  const searchViewState = {
    query: "",
    language: "all",
    category: "",
    section: "",
    results: [],
    index: null,
    returnMode: "",
    inputTimer: 0,
    composing: false
  };
  const root = document.documentElement;

  const ICONS = Object.freeze({
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.5 12 3l8.5 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/></svg>',
    bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
    askAI: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.45 4.05L17.5 8.5l-4.05 1.45L12 14l-1.45-4.05L6.5 8.5l4.05-1.45L12 3Z"/><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h14v4a2.5 2.5 0 0 0 0 5v4H5v-4a2.5 2.5 0 0 0 0-5v-4Z"/><path d="M12 7.5v9"/></svg>',
    upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4"/><path d="m8 8 4-4 4 4"/><path d="M5 14.5v4.5h14v-4.5"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.47 6.03.88-4.36 4.25 1.03 6-5.4-2.84-5.4 2.84 1.03-6-4.36-4.25 6.03-.88L12 3Z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h11M8 12h11M8 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg>',
    folder: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 6.5h6l2 2h9v9.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V6.5Z"/><path d="M3.5 9h17"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
    reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V4h4"/><path d="M5.2 5.2A8 8 0 1 1 4 15"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 14.5 14.5 9"/><path d="M7.5 16.5 5 19a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0" transform="translate(3 -3)"/><path d="m13.5 7.5 2.5-2.5a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0"/></svg>',
    notes: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h9l3 3V20H6V3.5Z"/><path d="M15 3.5V7h3M9 11h6M9 14.5h6M9 18h4"/></svg>',
    image: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="9.5" r="1.5"/><path d="m5.5 17 4.5-4 3 2.5 2.5-2 3 2.5"/></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V4.5h6V7M7.5 7l.8 12h7.4l.8-12M10 10.5v5M14 10.5v5"/></svg>',
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 5 16 7-16 7 3-7-3-7Z"/><path d="M7 12h13"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>',
    stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>'
  });

  function readStoredTheme() {
    try {
      return window.localStorage.getItem(STORAGE_KEY_THEME);
    } catch (_error) {
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      window.localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch (_error) {
      /* Storage may be unavailable in private or restricted contexts. */
    }
  }

  function applyTheme(_theme, { persist = true } = {}) {
    const resolved = "dark";
    root.dataset.theme = resolved;

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.content = "#080809";

    if (persist) storeTheme(resolved);

    document.dispatchEvent(new CustomEvent("sugo:themechange", {
      detail: { theme: resolved }
    }));

    return resolved;
  }

  function createShellRegion(className, { hidden = true } = {}) {
    const region = document.createElement("div");
    region.className = className;
    if (hidden) {
      region.setAttribute("aria-hidden", "true");
    }
    return region;
  }

  function createBrand() {
    const brand = document.createElement("div");
    brand.className = "topbar__brand";
    brand.innerHTML = `
      <span class="topbar__brand-mark" aria-hidden="true">S</span>
      <span class="topbar__brand-copy">
        <strong class="topbar__brand-title">SUGO SOP</strong>
        <span class="topbar__brand-subtitle">Knowledge Lounge · MENA</span>
      </span>
    `;
    return brand;
  }

  function createBreadcrumb() {
    const breadcrumb = document.createElement("nav");
    breadcrumb.id = "sugoBreadcrumb";
    breadcrumb.className = "topbar__breadcrumb";
    breadcrumb.setAttribute("aria-label", "Breadcrumb");
    breadcrumb.setAttribute("aria-live", "polite");
    breadcrumb.innerHTML = `
      <span class="topbar__breadcrumb-icon">${ICONS.home}</span>
      <span class="topbar__breadcrumb-current">SUGO SOP</span>
    `;
    return breadcrumb;
  }

  function createHeaderUtilities() {
    const utilities = document.createElement("div");
    utilities.className = "topbar__utilities";
    utilities.innerHTML = `
      <span class="topbar__notification" aria-hidden="true">
        <span class="topbar__notification-icon">${ICONS.bell}</span>
        <span class="topbar__notification-badge">0</span>
      </span>
      <span class="topbar__utility-divider" aria-hidden="true"></span>
      <span class="topbar__context-avatar" aria-hidden="true">S</span>
      <span class="topbar__context-copy">
        <strong>SUGO SOP</strong>
        <span>Knowledge Lounge · MENA</span>
      </span>
    `;
    return utilities;
  }

  function createHeader() {
    const header = document.createElement("header");
    header.className = "app-shell__header topbar shell-surface";
    header.append(createBrand(), createBreadcrumb(), createHeaderUtilities());
    return header;
  }

  function safeReadJsonList(key) {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function safeWriteJsonList(key, list) {
    try {
      window.localStorage.setItem(key, JSON.stringify(Array.isArray(list) ? list : []));
    } catch (_error) {
      /* Storage may be unavailable in private or restricted contexts. */
    }
  }

  function readStoredQuickAccessTab() {
    try {
      return window.localStorage.getItem(STORAGE_KEY_QUICK_ACCESS_TAB) === "recent"
        ? "recent"
        : "favorites";
    } catch (_error) {
      return "favorites";
    }
  }

  function storeQuickAccessTab(tab) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY_QUICK_ACCESS_TAB,
        tab === "recent" ? "recent" : "favorites"
      );
    } catch (_error) {
      /* Storage may be unavailable in private or restricted contexts. */
    }
  }

  function normalizePaneId(value) {
    return String(value || "").trim();
  }

  function getTopicMetadata(paneId) {
    const id = normalizePaneId(paneId);
    if (!id) {
      return null;
    }

    const data = getKnowledgeBaseData();
    let topic = null;

    try {
      if (data && typeof data.getTopic === "function") {
        topic = data.getTopic(id);
      } else if (data?.topicsById && typeof data.topicsById === "object") {
        topic = data.topicsById[id];
      } else if (data && typeof data === "object") {
        topic = data[id];
      }
    } catch (_error) {
      topic = null;
    }

    if (topic) {
      const title = String(topic.title || topic.label || "").trim();
      const pathParts = Array.isArray(topic.path)
        ? topic.path.map((part) => String(part || "").trim()).filter(Boolean)
        : String(topic.path || "").split("›").map((part) => part.trim()).filter(Boolean);
      const path = pathParts.join(" › ");

      return {
        ...topic,
        id,
        title: title || id,
        path: path || "SUGO SOP",
        pathParts
      };
    }

    const navButton = document.querySelector(`[data-pane="${CSS.escape(id)}"]`);
    if (!navButton) {
      return null;
    }

    const title = String(navButton.dataset.topicTitle || navButton.textContent || id).trim();
    const path = String(navButton.dataset.topicPath || "SUGO SOP").trim();
    return { id, title: title || id, path: path || "SUGO SOP" };
  }

  function uniquePaneIds(list) {
    const seen = new Set();
    const values = [];

    for (const rawId of Array.isArray(list) ? list : []) {
      const id = normalizePaneId(rawId);
      if (!id || seen.has(id)) {
        continue;
      }
      seen.add(id);
      values.push(id);
    }

    return values;
  }

  function getVisiblePaneEntries(key, limit) {
    const entries = [];
    for (const id of uniquePaneIds(safeReadJsonList(key))) {
      const topic = getTopicMetadata(id);
      if (!topic) {
        continue;
      }
      entries.push(topic);
      if (entries.length >= limit) {
        break;
      }
    }
    return entries;
  }

  function getAiFavoriteEntries() {
    const seen = new Set();
    const entries = [];

    for (const rawItem of safeReadJsonList(STORAGE_KEY_AI_FAVORITES)) {
      if (!rawItem || typeof rawItem !== "object") {
        continue;
      }
      const id = String(rawItem.id || "").trim();
      if (!id || seen.has(id)) {
        continue;
      }
      seen.add(id);
      entries.push({
        ...rawItem,
        id,
        title: String(rawItem.title || "Generated Ticket").trim() || "Generated Ticket"
      });
      if (entries.length >= MAX_AI_FAVORITES) {
        break;
      }
    }

    return entries;
  }

  function createQuickAccessItem({ id, title, path, kind, removable = false }) {
    const item = document.createElement("div");
    item.className = "quick-access-item";
    item.dataset.quickAccessKind = kind;

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "quick-access-item__open";
    openButton.dataset.quickAccessOpen = id;
    openButton.dataset.quickAccessOpenKind = kind;
    openButton.title = title;

    const icon = document.createElement("span");
    icon.className = `quick-access-item__icon quick-access-item__icon--${kind}`;
    if (kind === "ai") {
      icon.textContent = "AI";
    } else {
      icon.innerHTML = kind === "favorite" ? ICONS.star : ICONS.clock;
    }

    const copy = document.createElement("span");
    copy.className = "quick-access-item__copy";

    const name = document.createElement("span");
    name.className = "quick-access-item__name";
    name.textContent = title;

    const itemPath = document.createElement("span");
    itemPath.className = "quick-access-item__path";
    itemPath.textContent = path;

    copy.append(name, itemPath);
    openButton.append(icon, copy);
    item.append(openButton);

    if (removable) {
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "quick-access-item__remove";
      removeButton.dataset.quickAccessRemove = id;
      removeButton.dataset.quickAccessRemoveKind = kind;
      removeButton.title = "Remove favorite";
      removeButton.setAttribute("aria-label", `Remove ${title} from Favorites`);
      removeButton.innerHTML = ICONS.close;
      item.append(removeButton);
    }

    return item;
  }

  function renderQuickAccessList(list, entries, emptyText) {
    const fragment = document.createDocumentFragment();

    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "quick-access-empty";
      empty.textContent = emptyText;
      fragment.append(empty);
    } else {
      for (const entry of entries) {
        fragment.append(createQuickAccessItem(entry));
      }
    }

    list.replaceChildren(fragment);
  }

  function renderFavoritesList(list, aiEntries, paneEntries) {
    const fragment = document.createDocumentFragment();

    if (aiEntries.length) {
      const label = document.createElement("div");
      label.className = "quick-access-group-label";
      label.textContent = "Generated Tickets";
      fragment.append(label);
      for (const entry of aiEntries) {
        fragment.append(createQuickAccessItem(entry));
      }
    }

    for (const entry of paneEntries) {
      fragment.append(createQuickAccessItem(entry));
    }

    if (!aiEntries.length && !paneEntries.length) {
      const empty = document.createElement("div");
      empty.className = "quick-access-empty";
      empty.textContent = "No favorites yet. Open any macro and press Add Favorite.";
      fragment.append(empty);
    }

    list.replaceChildren(fragment);
  }

  function refreshQuickAccess() {
    const favoriteList = document.getElementById("sugoFavoritesList");
    const recentList = document.getElementById("sugoRecentList");
    if (!favoriteList || !recentList) {
      return;
    }

    const paneFavorites = getVisiblePaneEntries(
      STORAGE_KEY_FAVORITES,
      MAX_FAVORITES_DISPLAY
    ).map((topic) => ({
      ...topic,
      kind: "favorite",
      removable: true
    }));

    const aiFavorites = getAiFavoriteEntries().map((item) => ({
      id: item.id,
      title: item.title,
      path: "AI Generated Ticket",
      kind: "ai",
      removable: true
    }));

    const favoriteEntries = [...aiFavorites, ...paneFavorites].slice(
      0,
      MAX_FAVORITES_DISPLAY + MAX_AI_FAVORITES
    );
    const recentEntries = getVisiblePaneEntries(STORAGE_KEY_RECENT, MAX_RECENT).map(
      (topic) => ({ ...topic, kind: "recent", removable: false })
    );

    renderFavoritesList(favoriteList, aiFavorites, paneFavorites);
    renderQuickAccessList(
      recentList,
      recentEntries,
      "Recently opened macros will appear here."
    );

    const favoriteCount = document.getElementById("sugoFavCount");
    const recentCount = document.getElementById("sugoRecentCount");
    const clearRecent = document.getElementById("sugoClearRecentBtn");

    if (favoriteCount) {
      favoriteCount.textContent = String(favoriteEntries.length);
    }
    if (recentCount) {
      recentCount.textContent = String(recentEntries.length);
    }
    if (clearRecent) {
      clearRecent.disabled = recentEntries.length === 0;
    }
  }

  function setQuickAccessTab(tab, { open } = {}) {
    const resolved = tab === "recent" ? "recent" : "favorites";
    const panel = document.getElementById("sugoFavRecentPanel");
    if (!panel) {
      return;
    }

    if (open === true) {
      panel.classList.add("is-open");
    } else if (open === false) {
      panel.classList.remove("is-open");
    }

    panel.querySelectorAll("[data-quick-access-tab]").forEach((button) => {
      const selected = button.dataset.quickAccessTab === resolved;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
      button.setAttribute(
        "aria-expanded",
        String(selected && panel.classList.contains("is-open"))
      );
      button.tabIndex = selected ? 0 : -1;
    });

    panel.querySelectorAll("[data-quick-access-section]").forEach((section) => {
      const selected = section.dataset.quickAccessSection === resolved;
      section.classList.toggle("is-active", selected);
      section.hidden = !selected;
    });

    storeQuickAccessTab(resolved);
  }

  function closeQuickAccess() {
    const active = document.querySelector(
      "[data-quick-access-tab].is-active"
    )?.dataset.quickAccessTab;
    setQuickAccessTab(active || "favorites", { open: false });
  }

  function removePaneFavorite(paneId) {
    const id = normalizePaneId(paneId);
    if (!id) {
      return;
    }
    const favorites = uniquePaneIds(safeReadJsonList(STORAGE_KEY_FAVORITES)).filter(
      (item) => item !== id
    );
    safeWriteJsonList(STORAGE_KEY_FAVORITES, favorites);
    refreshQuickAccess();
    document.dispatchEvent(new CustomEvent("sugo:favoriteschange", {
      detail: { paneId: id, favorite: false }
    }));
  }

  function removeAiFavorite(ticketId) {
    const id = String(ticketId || "").trim();
    if (!id) {
      return;
    }
    const favorites = safeReadJsonList(STORAGE_KEY_AI_FAVORITES).filter(
      (item) => item && String(item.id || "").trim() !== id
    );
    safeWriteJsonList(STORAGE_KEY_AI_FAVORITES, favorites);
    refreshQuickAccess();
    document.dispatchEvent(new CustomEvent("sugo:aifavoriteschange", {
      detail: { ticketId: id, favorite: false }
    }));
  }

  function setFavorite(paneId, enabled) {
    const id = normalizePaneId(paneId);
    if (!id || !getTopicMetadata(id)) {
      return false;
    }

    const favorites = uniquePaneIds(safeReadJsonList(STORAGE_KEY_FAVORITES)).filter(
      (item) => item !== id
    );
    if (enabled) {
      favorites.unshift(id);
    }
    safeWriteJsonList(STORAGE_KEY_FAVORITES, favorites);
    refreshQuickAccess();
    document.dispatchEvent(new CustomEvent("sugo:favoriteschange", {
      detail: { paneId: id, favorite: Boolean(enabled) }
    }));
    return true;
  }

  function isFavorite(paneId) {
    const id = normalizePaneId(paneId);
    return uniquePaneIds(safeReadJsonList(STORAGE_KEY_FAVORITES)).includes(id);
  }

  function toggleFavorite(paneId) {
    return setFavorite(paneId, !isFavorite(paneId));
  }

  function recordRecent(paneId) {
    const id = normalizePaneId(paneId);
    if (!id || !getTopicMetadata(id)) {
      return false;
    }

    const recents = uniquePaneIds(safeReadJsonList(STORAGE_KEY_RECENT)).filter(
      (item) => item !== id
    );
    recents.unshift(id);
    safeWriteJsonList(STORAGE_KEY_RECENT, recents.slice(0, MAX_RECENT));
    refreshQuickAccess();
    return true;
  }

  function setAiFavorite(payload, enabled) {
    if (!payload || typeof payload !== "object") {
      return false;
    }
    const id = String(payload.id || "").trim();
    if (!id) {
      return false;
    }

    const favorites = safeReadJsonList(STORAGE_KEY_AI_FAVORITES).filter(
      (item) => item && String(item.id || "").trim() !== id
    );
    if (enabled) {
      favorites.unshift({ ...payload, id });
    }
    safeWriteJsonList(STORAGE_KEY_AI_FAVORITES, favorites.slice(0, MAX_AI_FAVORITES));
    refreshQuickAccess();
    document.dispatchEvent(new CustomEvent("sugo:aifavoriteschange", {
      detail: { ticketId: id, favorite: Boolean(enabled) }
    }));
    return true;
  }

  function createQuickAccessPanel() {
    const panel = document.createElement("section");
    panel.id = "sugoFavRecentPanel";
    panel.className = "quick-access-panel";
    panel.setAttribute("aria-label", "Quick Access");
    panel.innerHTML = `
      <div class="quick-access-tabs" role="tablist" aria-label="Quick Access buttons">
        <button id="sugoFavoritesTab" class="quick-access-tab is-active" type="button" data-quick-access-tab="favorites" role="tab" aria-controls="sugoFavoritesSection" aria-selected="true" aria-expanded="false" tabindex="0">
          <span>Favorites</span>
          <span class="quick-access-count" id="sugoFavCount">0</span>
        </button>
        <button id="sugoRecentTab" class="quick-access-tab" type="button" data-quick-access-tab="recent" role="tab" aria-controls="sugoRecentSection" aria-selected="false" aria-expanded="false" tabindex="-1">
          <span>Recent</span>
          <span class="quick-access-count" id="sugoRecentCount">0</span>
        </button>
      </div>
      <div class="quick-access-drawer" id="sugoQuickAccessDrawer">
        <div id="sugoFavoritesSection" class="quick-access-section is-active" data-quick-access-section="favorites" role="tabpanel" aria-labelledby="sugoFavoritesTab">
          <div class="quick-access-list" id="sugoFavoritesList"></div>
        </div>
        <div id="sugoRecentSection" class="quick-access-section" data-quick-access-section="recent" role="tabpanel" aria-labelledby="sugoRecentTab" hidden>
          <div class="quick-access-section__header">
            <span>Recently opened</span>
            <button class="quick-access-clear" id="sugoClearRecentBtn" type="button" title="Clear recently used">Clear</button>
          </div>
          <div class="quick-access-list" id="sugoRecentList"></div>
        </div>
      </div>
    `;
    return panel;
  }

  function bindQuickAccess(panel) {
    panel.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-quick-access-tab]");
      if (tab && panel.contains(tab)) {
        const selected = tab.classList.contains("is-active");
        const open = panel.classList.contains("is-open");
        if (selected && open) {
          closeQuickAccess();
        } else {
          setQuickAccessTab(tab.dataset.quickAccessTab, { open: true });
        }
        return;
      }

      const clear = event.target.closest("#sugoClearRecentBtn");
      if (clear && panel.contains(clear)) {
        safeWriteJsonList(STORAGE_KEY_RECENT, []);
        refreshQuickAccess();
        document.dispatchEvent(new CustomEvent("sugo:recentcleared"));
        return;
      }

      const remove = event.target.closest("[data-quick-access-remove]");
      if (remove && panel.contains(remove)) {
        const kind = remove.dataset.quickAccessRemoveKind;
        if (kind === "ai") {
          removeAiFavorite(remove.dataset.quickAccessRemove);
        } else {
          removePaneFavorite(remove.dataset.quickAccessRemove);
        }
        return;
      }

      const openItem = event.target.closest("[data-quick-access-open]");
      if (!openItem || !panel.contains(openItem)) {
        return;
      }

      const id = openItem.dataset.quickAccessOpen;
      const kind = openItem.dataset.quickAccessOpenKind;
      closeQuickAccess();

      if (kind === "ai") {
        const payload = getAiFavoriteEntries().find((item) => item.id === id) || null;
        selectWorkspace(WORKSPACES.CREATE_TICKET, { source: "favorite-ai-ticket" });
        document.dispatchEvent(new CustomEvent("sugo:openaiticketfavorite", {
          detail: { ticketId: id, payload }
        }));
      } else {
        openNavigationTopic(id, {
          source: kind,
          persist: true,
          addToRecent: true,
          emit: true
        });
      }
    });

    panel.addEventListener("keydown", (event) => {
      const tab = event.target.closest("[data-quick-access-tab]");
      if (!tab || !panel.contains(tab)) {
        return;
      }
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }
      event.preventDefault();
      const next = tab.dataset.quickAccessTab === "favorites" ? "recent" : "favorites";
      setQuickAccessTab(next, { open: panel.classList.contains("is-open") });
      panel.querySelector(`[data-quick-access-tab="${next}"]`)?.focus();
    });
  }

  const LIBRARIES = Object.freeze({
    KB: "kb",
    SV: "sv"
  });

  const LIBRARY_LABELS = Object.freeze({
    [LIBRARIES.KB]: "SUGO Knowledgebase — MENA",
    [LIBRARIES.SV]: "SUGO SV — Organized Support Macros"
  });

  const STORAGE_KEY_LAST_PANE = "sugo_last_pane";

  function getKnowledgeBaseData() {
    try {
      return window.SUGO?.Admin?.getKnowledgeBaseData?.() || window.SUGO?.KnowledgeBaseData || null;
    } catch (_error) {
      return window.SUGO?.KnowledgeBaseData || null;
    }
  }

  function getKnowledgeBaseContent() {
    const admin = window.SUGO?.Admin;
    if (admin?.getPane && admin?.getPaneText && admin?.getSearchDocument && admin?.listPanes) return admin;
    return window.SUGO?.KnowledgeBaseContent || null;
  }

  function getLibraryData(libraryId) {
    const data = getKnowledgeBaseData();
    if (!data) {
      return null;
    }
    if (typeof data.getLibrary === "function") {
      return data.getLibrary(libraryId);
    }
    return Array.isArray(data.navigation)
      ? data.navigation.find((library) => library.id === libraryId) || null
      : null;
  }

  function getNavigationStats() {
    return getKnowledgeBaseData()?.stats || {
      rootCount: 0,
      categoryCount: 0,
      sectionCount: 0,
      topicCount: 0,
      byLibrary: {}
    };
  }

  function createNavigationRootButton({ id, library, label }) {
    const button = document.createElement("button");
    button.id = id;
    button.type = "button";
    button.className = "navigation-root-button";
    button.dataset.library = library;
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute(
      "aria-controls",
      library === LIBRARIES.KB ? "rootKBChildren" : "rootSVTicketsChildren"
    );

    const icon = document.createElement("span");
    icon.className = "navigation-root-button__icon";
    icon.innerHTML = ICONS.folder;

    const copy = document.createElement("span");
    copy.className = "navigation-root-button__copy";
    copy.textContent = label;

    const count = document.createElement("span");
    count.className = "navigation-root-button__count";
    count.dataset.libraryCount = library;
    count.textContent = "0";
    count.setAttribute("aria-label", "0 topics");

    const chevron = document.createElement("span");
    chevron.className = "navigation-root-button__chevron";
    chevron.innerHTML = ICONS.chevron;

    button.append(icon, copy, count, chevron);
    return button;
  }

  function createNavigationShell() {
    const navigation = document.createElement("section");
    navigation.className = "sidebar-navigation";
    navigation.setAttribute("aria-label", "Menu");

    const heading = document.createElement("button");
    heading.type = "button";
    heading.className = "sidebar-navigation__heading sidebar-navigation__toggle";
    heading.dataset.navigationMenuToggle = "true";
    heading.setAttribute("aria-expanded", "false");
    heading.setAttribute("aria-controls", "sidebarNav");
    heading.innerHTML = `
      <span class="sidebar-navigation__heading-icon">${ICONS.menu}</span>
      <span class="sidebar-navigation__heading-label">Menu</span>
      <span class="sidebar-navigation__heading-chevron">${ICONS.chevron}</span>
    `;

    const rootList = document.createElement("div");
    rootList.id = "sidebarNav";
    rootList.className = "navigation-root-list";
    rootList.hidden = true;

    const noResults = document.createElement("div");
    noResults.id = "noResults";
    noResults.className = "navigation-no-results";
    noResults.textContent = "No results found.";
    noResults.hidden = true;

    const kbButton = createNavigationRootButton({
      id: "rootKB",
      library: LIBRARIES.KB,
      label: LIBRARY_LABELS[LIBRARIES.KB]
    });
    const kbChildren = document.createElement("div");
    kbChildren.id = "rootKBChildren";
    kbChildren.className = "navigation-root-children";
    kbChildren.dataset.libraryChildren = LIBRARIES.KB;
    kbChildren.hidden = true;

    const svButton = createNavigationRootButton({
      id: "rootSVTickets",
      library: LIBRARIES.SV,
      label: LIBRARY_LABELS[LIBRARIES.SV]
    });
    const svChildren = document.createElement("div");
    svChildren.id = "rootSVTicketsChildren";
    svChildren.className = "navigation-root-children";
    svChildren.dataset.libraryChildren = LIBRARIES.SV;
    svChildren.hidden = true;

    rootList.append(noResults, kbButton, kbChildren, svButton, svChildren);

    const headingRow = document.createElement("div");
    headingRow.className = "sidebar-navigation__header";
    const editMenu = document.createElement("button");
    editMenu.type = "button";
    editMenu.className = "sidebar-navigation__edit";
    editMenu.dataset.adminMenuEdit = "true";
    editMenu.textContent = "Edit";
    editMenu.title = "Edit menu";
    editMenu.setAttribute("aria-label", "Edit menu");
    headingRow.append(heading, editMenu);

    navigation.append(headingRow, rootList);
    return navigation;
  }

  function createNavigationCount(value, className) {
    const count = document.createElement("span");
    count.className = className;
    count.textContent = String(value);
    count.setAttribute("aria-hidden", "true");
    return count;
  }

  function createCategoryNode(library, category) {
    const wrapper = document.createElement("div");
    wrapper.className = "navigation-category";
    wrapper.dataset.categoryId = category.id;
    wrapper.dataset.library = library.id;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "navigation-node navigation-node--category";
    button.dataset.navLevel = "category";
    button.dataset.categoryId = category.id;
    button.dataset.library = library.id;
    button.setAttribute("aria-expanded", "false");

    const childrenId = `nav-category-${library.id}-${category.id}`;
    button.setAttribute("aria-controls", childrenId);

    const marker = document.createElement("span");
    marker.className = "navigation-node__marker";
    marker.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.className = "navigation-node__label";
    label.textContent = category.title;
    label.title = category.title;

    const topicCount = category.sections.reduce(
      (total, section) => total + section.topics.length,
      0
    );
    const count = createNavigationCount(topicCount, "navigation-node__count");

    const chevron = document.createElement("span");
    chevron.className = "navigation-node__chevron";
    chevron.innerHTML = ICONS.chevron;

    button.append(marker, label, count, chevron);

    const children = document.createElement("div");
    children.id = childrenId;
    children.className = "navigation-category__children";
    children.hidden = true;

    for (const section of category.sections) {
      children.append(createSectionNode(library, category, section));
    }

    wrapper.append(button, children);
    return wrapper;
  }

  function createSectionNode(library, category, section) {
    const wrapper = document.createElement("div");
    wrapper.className = "navigation-section";
    wrapper.dataset.sectionId = section.id;
    wrapper.dataset.categoryId = category.id;
    wrapper.dataset.library = library.id;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "navigation-node navigation-node--section";
    button.dataset.navLevel = "section";
    button.dataset.sectionId = section.id;
    button.dataset.categoryId = category.id;
    button.dataset.library = library.id;
    button.setAttribute("aria-expanded", "false");

    const childrenId = `nav-section-${library.id}-${section.id}`;
    button.setAttribute("aria-controls", childrenId);

    const marker = document.createElement("span");
    marker.className = "navigation-node__marker";
    marker.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.className = "navigation-node__label";
    label.textContent = section.title;
    label.title = section.title;

    const count = createNavigationCount(section.topics.length, "navigation-node__count");

    const chevron = document.createElement("span");
    chevron.className = "navigation-node__chevron";
    chevron.innerHTML = ICONS.chevron;

    button.append(marker, label, count, chevron);

    const children = document.createElement("div");
    children.id = childrenId;
    children.className = "navigation-section__children";
    children.hidden = true;

    for (const topic of section.topics) {
      const topicButton = document.createElement("button");
      topicButton.type = "button";
      topicButton.className = "navigation-topic";
      topicButton.dataset.pane = topic.id;
      topicButton.dataset.topicTitle = topic.title;
      topicButton.dataset.topicPath = [
        library.title,
        category.title,
        section.title
      ].join(" › ");
      topicButton.setAttribute("aria-selected", "false");
      topicButton.title = topic.title;

      const dot = document.createElement("span");
      dot.className = "navigation-topic__dot";
      dot.setAttribute("aria-hidden", "true");

      const label = document.createElement("span");
      label.className = "navigation-topic__label";
      label.textContent = topic.title;

      topicButton.append(dot, label);
      children.append(topicButton);
    }

    wrapper.append(button, children);
    return wrapper;
  }

  function renderNavigationTree() {
    const data = getKnowledgeBaseData();
    if (!data || !Array.isArray(data.navigation)) {
      return false;
    }

    for (const library of data.navigation) {
      const mount = document.querySelector(
        `.navigation-root-children[data-library-children="${CSS.escape(library.id)}"]`
      );
      if (!mount) {
        continue;
      }

      const rootButton = document.querySelector(`.navigation-root-button[data-library="${CSS.escape(library.id)}"]`);
      const rootLabel = rootButton?.querySelector(".navigation-root-button__copy");
      if (rootLabel) rootLabel.textContent = library.title;
      if (rootButton) rootButton.hidden = false;

      const fragment = document.createDocumentFragment();
      for (const category of library.categories) {
        fragment.append(createCategoryNode(library, category));
      }
      mount.replaceChildren(fragment);

      const count = library.categories.reduce(
        (total, category) => total + category.sections.reduce(
          (sectionTotal, section) => sectionTotal + section.topics.length,
          0
        ),
        0
      );
      const badge = document.querySelector(
        `[data-library-count="${CSS.escape(library.id)}"]`
      );
      if (badge) {
        badge.textContent = String(count);
        badge.setAttribute("aria-label", `${count} topics`);
      }
    }

    document.dispatchEvent(new CustomEvent("sugo:navigationready", {
      detail: { stats: getNavigationStats() }
    }));
    refreshQuickAccess();
    return true;
  }

  function resolveLibrary(value) {
    return Object.values(LIBRARIES).includes(value) ? value : "";
  }

  function setExpandableState(button, expanded) {
    if (!button) {
      return false;
    }
    const targetId = button.getAttribute("aria-controls");
    const target = targetId ? document.getElementById(targetId) : null;
    const isExpanded = Boolean(expanded && target);

    button.setAttribute("aria-expanded", String(isExpanded));
    button.classList.toggle("is-open", isExpanded);
    if (target) {
      target.hidden = !isExpanded;
    }
    return isExpanded;
  }

  function setRootExpanded(libraryId, expanded) {
    const library = resolveLibrary(libraryId);
    if (!library) {
      return false;
    }
    const button = document.querySelector(
      `.navigation-root-button[data-library="${CSS.escape(library)}"]`
    );
    return setExpandableState(button, expanded);
  }

  function collapseNavigationDescendants(container) {
    if (!container) {
      return;
    }
    container.querySelectorAll(
      '.navigation-node[aria-expanded="true"]'
    ).forEach((button) => setExpandableState(button, false));
  }

  function clearNavigationSelection() {
    document.querySelectorAll(".navigation-topic.is-active").forEach((button) => {
      button.classList.remove("is-active");
      button.setAttribute("aria-selected", "false");
    });
  }

  function resetNavigationTree({ clearLastPane = true } = {}) {
    document.querySelectorAll(".navigation-root-button").forEach((button) => {
      button.classList.remove("is-selected", "is-open");
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-expanded", "false");
    });

    document.querySelectorAll(".navigation-root-children").forEach((children) => {
      children.hidden = true;
      collapseNavigationDescendants(children);
    });

    clearNavigationSelection();

    if (clearLastPane) {
      try {
        window.localStorage.removeItem(STORAGE_KEY_LAST_PANE);
      } catch (_error) {
        /* Storage may be unavailable. */
      }
    }
  }

  function setLibrary(
    value,
    {
      source = "api",
      updateBreadcrumb = true,
      reveal = true
    } = {}
  ) {
    const resolved = resolveLibrary(value);
    const sidebar = document.querySelector(".app-shell__sidebar");

    document.querySelectorAll(".navigation-root-button[data-library]").forEach((button) => {
      const selected = button.dataset.library === resolved;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
      if (!selected) {
        setExpandableState(button, false);
      }
    });

    if (resolved && reveal) {
      setRootExpanded(resolved, true);
    }

    if (!resolved) {
      document.querySelectorAll(".navigation-root-children").forEach((children) => {
        children.hidden = true;
      });
    }


    if (sidebar) {
      sidebar.dataset.activeLibrary = resolved;
    }

    if (updateBreadcrumb) {
      setBreadcrumb(resolved ? ["SUGO SOP", LIBRARY_LABELS[resolved]] : ["SUGO SOP"]);
    }

    document.dispatchEvent(new CustomEvent("sugo:librarychange", {
      detail: {
        library: resolved,
        label: resolved ? LIBRARY_LABELS[resolved] : "",
        source
      }
    }));

    return resolved;
  }

  function closeSiblingNavigationNodes(button, wrapperSelector) {
    const wrapper = button.closest(wrapperSelector);
    const parent = wrapper?.parentElement;
    if (!wrapper || !parent) {
      return;
    }

    for (const sibling of parent.children) {
      if (sibling === wrapper || !sibling.matches(wrapperSelector)) {
        continue;
      }
      const siblingButton = sibling.querySelector(
        ':scope > .navigation-node[aria-expanded="true"]'
      );
      if (siblingButton) {
        setExpandableState(siblingButton, false);
      }
      collapseNavigationDescendants(sibling);
    }
  }

  function toggleCategory(button) {
    const expanded = button.getAttribute("aria-expanded") === "true";
    closeSiblingNavigationNodes(button, ".navigation-category");
    setExpandableState(button, !expanded);
  }

  function toggleSection(button) {
    const expanded = button.getAttribute("aria-expanded") === "true";
    closeSiblingNavigationNodes(button, ".navigation-section");
    setExpandableState(button, !expanded);
  }

  function revealTopicPath(topic) {
    if (!topic) {
      return false;
    }

    setLibrary(topic.library, {
      source: "topic-sync",
      updateBreadcrumb: false,
      reveal: true
    });

    const root = document.querySelector(
      `.navigation-root-children[data-library-children="${CSS.escape(topic.library)}"]`
    );
    const categoryButton = root?.querySelector(
      `.navigation-node--category[data-category-id="${CSS.escape(topic.categoryId)}"]`
    );
    if (categoryButton) {
      closeSiblingNavigationNodes(categoryButton, ".navigation-category");
      setExpandableState(categoryButton, true);
    }

    const sectionButton = root?.querySelector(
      `.navigation-node--section[data-section-id="${CSS.escape(topic.sectionId)}"]`
    );
    if (sectionButton) {
      closeSiblingNavigationNodes(sectionButton, ".navigation-section");
      setExpandableState(sectionButton, true);
    }

    const topicButton = root?.querySelector(
      `.navigation-topic[data-pane="${CSS.escape(topic.id)}"]`
    );
    topicButton?.scrollIntoView({ block: "nearest" });
    return Boolean(topicButton);
  }

  function persistLastPane(paneId) {
    try {
      window.localStorage.setItem(STORAGE_KEY_LAST_PANE, paneId);
    } catch (_error) {
      /* Storage may be unavailable. */
    }
  }

  function readLastPane() {
    try {
      return String(window.localStorage.getItem(STORAGE_KEY_LAST_PANE) || "").trim();
    } catch (_error) {
      return "";
    }
  }

  function openNavigationTopic(
    paneId,
    {
      source = "navigation",
      persist = true,
      addToRecent = true,
      emit = true
    } = {}
  ) {
    const topic = getTopicMetadata(paneId);
    if (!topic) {
      return false;
    }

    revealTopicPath(topic);
    clearNavigationSelection();

    const button = document.querySelector(
      `.navigation-topic[data-pane="${CSS.escape(topic.id)}"]`
    );
    if (button) {
      button.classList.add("is-active");
      button.setAttribute("aria-selected", "true");
    }

    const breadcrumb = [
      "SUGO SOP",
      topic.rootTitle,
      topic.category,
      topic.section,
      topic.title
    ].filter(Boolean);
    setBreadcrumb(breadcrumb);
    renderArticleDetail(topic.id);

    if (persist) {
      persistLastPane(topic.id);
    }
    if (addToRecent) {
      recordRecent(topic.id);
    }

    if (emit) {
      document.dispatchEvent(new CustomEvent("sugo:openpane", {
        detail: {
          paneId: topic.id,
          source,
          topic
        }
      }));
    }

    return true;
  }

  function setNavigationMenuExpanded(expanded) {
    const toggle = document.querySelector("[data-navigation-menu-toggle]");
    const menu = document.getElementById("sidebarNav");
    if (!toggle || !menu) {
      return false;
    }

    const isExpanded = Boolean(expanded);
    toggle.setAttribute("aria-expanded", String(isExpanded));
    toggle.classList.toggle("is-open", isExpanded);
    menu.hidden = !isExpanded;
    return isExpanded;
  }

  function bindNavigationShell(sidebar) {
    sidebar.addEventListener("click", (event) => {
      const editMenuButton = event.target.closest("[data-admin-menu-edit]");
      if (editMenuButton && sidebar.contains(editMenuButton)) {
        event.preventDefault();
        event.stopPropagation();
        if (window.SUGO?.Admin?.openMenuEditor) {
          void window.SUGO.Admin.openMenuEditor();
        }
        return;
      }

      const menuToggle = event.target.closest("[data-navigation-menu-toggle]");
      if (menuToggle && sidebar.contains(menuToggle)) {
        const expanded = menuToggle.getAttribute("aria-expanded") === "true";
        setNavigationMenuExpanded(!expanded);
        return;
      }
      const rootButton = event.target.closest(".navigation-root-button[data-library]");
      if (rootButton && sidebar.contains(rootButton)) {
        const library = rootButton.dataset.library;
        const selected = rootButton.getAttribute("aria-pressed") === "true";
        const expanded = rootButton.getAttribute("aria-expanded") === "true";

        if (selected && expanded) {
          setRootExpanded(library, false);
        } else {
          setLibrary(library, {
            source: "navigation-root",
            reveal: true
          });
        }
        return;
      }

      const categoryButton = event.target.closest(
        '.navigation-node[data-nav-level="category"]'
      );
      if (categoryButton && sidebar.contains(categoryButton)) {
        setLibrary(categoryButton.dataset.library, {
          source: "navigation-category",
          updateBreadcrumb: false,
          reveal: true
        });
        toggleCategory(categoryButton);
        return;
      }

      const sectionButton = event.target.closest(
        '.navigation-node[data-nav-level="section"]'
      );
      if (sectionButton && sidebar.contains(sectionButton)) {
        toggleSection(sectionButton);
        return;
      }

      const topicButton = event.target.closest(".navigation-topic[data-pane]");
      if (topicButton && sidebar.contains(topicButton)) {
        openNavigationTopic(topicButton.dataset.pane, {
          source: "navigation",
          persist: true,
          addToRecent: true,
          emit: true
        });
      }
    });

  }

  function createSidebarTools() {
    const sidebar = createShellRegion("app-shell__sidebar shell-surface", { hidden: false });
    sidebar.setAttribute("aria-label", "Primary tools");

    const tools = document.createElement("div");
    tools.className = "sidebar-tools";
    tools.innerHTML = `
      <div class="sidebar-tools__search">
        <span class="sidebar-tools__search-icon">${ICONS.search}</span>
        <label class="visually-hidden" for="searchInput">Search Arabic / English keywords...</label>
        <input
          id="searchInput"
          type="search"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="Search Arabic / English keywords..."
        >
        <kbd class="sidebar-tools__key-hint" aria-hidden="true">Enter</kbd>
      </div>

      <div class="sidebar-tools__actions" aria-label="AI workspaces">
        <button class="sidebar-tool-button sidebar-tool-button--primary" id="askAIBtn" type="button" data-workspace="${WORKSPACES.ASK_AI}" aria-pressed="false" title="Ask AI">
          <span class="sidebar-tool-button__icon">${ICONS.askAI}</span>
          <span class="sidebar-tool-button__label">Ask AI</span>
        </button>
        <button class="sidebar-tool-button" id="createTicketBtn" type="button" data-workspace="${WORKSPACES.CREATE_TICKET}" aria-pressed="false" title="Open dedicated ticket workspace">
          <span class="sidebar-tool-button__icon">${ICONS.ticket}</span>
          <span class="sidebar-tool-button__label">Create Ticket</span>
        </button>
        <button class="sidebar-tool-button" id="sugoVisionUploadBtn" type="button" data-workspace="${WORKSPACES.UPLOAD_IMAGE}" aria-pressed="false" title="Open dedicated image workspace">
          <span class="sidebar-tool-button__icon">${ICONS.upload}</span>
          <span class="sidebar-tool-button__label">Upload image</span>
        </button>
      </div>
    `;

    const quickAccess = createQuickAccessPanel();
    const navigation = createNavigationShell();
    tools.append(quickAccess, navigation);
    sidebar.append(tools);
    bindQuickAccess(quickAccess);
    bindNavigationShell(sidebar);
    setQuickAccessTab(readStoredQuickAccessTab(), { open: false });
    refreshQuickAccess();
    return sidebar;
  }

  function getTicketType(value) {
    return TICKET_TYPES.find((item) => item.value === value) || TICKET_TYPES[0];
  }

  function updateTicketTypeSelection(container, value, { focus = false, emit = true } = {}) {
    const selected = getTicketType(value);
    ticketWorkspaceState.type = selected.value;

    container.querySelectorAll(".ticket-type-card[data-ticket-type]").forEach((button) => {
      const isSelected = button.dataset.ticketType === selected.value;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-checked", String(isSelected));
      button.tabIndex = isSelected ? 0 : -1;
      if (isSelected && focus) {
        button.focus();
      }
    });

    const hint = container.querySelector("#ticketTypeHint");
    if (hint) {
      hint.textContent = selected.hint;
    }

    if (emit) {
      document.dispatchEvent(new CustomEvent("sugo:tickettypechange", {
        detail: { type: selected.value, label: selected.label }
      }));
    }

    renderTicketPreviewPanel();
    return selected;
  }

  function createTicketTypeSelector() {
    const section = document.createElement("section");
    section.className = "ticket-type-section";
    section.setAttribute("aria-labelledby", "ticketTypeTitle");

    const heading = document.createElement("div");
    heading.className = "ticket-type-section__heading";
    heading.innerHTML = `
      <h2 id="ticketTypeTitle">Ticket type</h2>
    `;

    const group = document.createElement("div");
    group.className = "ticket-type-grid";
    group.setAttribute("role", "radiogroup");
    group.setAttribute("aria-label", "Ticket type");

    TICKET_TYPES.forEach((type) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ticket-type-card";
      button.dataset.ticketType = type.value;
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", "false");
      button.innerHTML = `
        <span class="ticket-type-card__icon">${type.icon}</span>
        <span class="ticket-type-card__label">${type.label}</span>
        <span class="ticket-type-card__status" aria-hidden="true"></span>
      `;
      group.append(button);
    });

    const hint = document.createElement("p");
    hint.id = "ticketTypeHint";
    hint.className = "ticket-type-hint";
    hint.setAttribute("aria-live", "polite");

    section.append(heading, group, hint);

    group.addEventListener("click", (event) => {
      const button = event.target.closest(".ticket-type-card[data-ticket-type]");
      if (!button || !group.contains(button)) {
        return;
      }
      updateTicketTypeSelection(section, button.dataset.ticketType, { focus: false });
    });

    group.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
        return;
      }

      const buttons = [...group.querySelectorAll(".ticket-type-card[data-ticket-type]")];
      if (!buttons.length) {
        return;
      }

      const currentIndex = Math.max(0, buttons.findIndex((button) => button.getAttribute("aria-checked") === "true"));
      let nextIndex = currentIndex;

      if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = buttons.length - 1;
      } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % buttons.length;
      } else {
        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      }

      event.preventDefault();
      updateTicketTypeSelection(section, buttons[nextIndex].dataset.ticketType, { focus: true });
    });

    updateTicketTypeSelection(section, ticketWorkspaceState.type, { emit: false });
    return section;
  }

  function emitTicketCaseChange(source = "input") {
    document.dispatchEvent(new CustomEvent("sugo:ticketcasechange", {
      detail: {
        source,
        caseDetails: ticketWorkspaceState.caseDetails,
        type: ticketWorkspaceState.type
      }
    }));
    renderTicketPreviewPanel();
  }

  function createTicketCaseSection() {
    const section = document.createElement("section");
    section.className = "ticket-case-section";
    section.setAttribute("aria-labelledby", "ticketCaseTitle");

    const heading = document.createElement("div");
    heading.className = "ticket-case-section__heading";
    heading.innerHTML = '<h2 id="ticketCaseTitle">Customer conversation / Case details</h2>';

    const textarea = document.createElement("textarea");
    textarea.id = "sugoTicketInput";
    textarea.className = "ticket-case-section__textarea";
    textarea.rows = 8;
    textarea.value = ticketWorkspaceState.caseDetails;
    textarea.placeholder = "Paste the customer message, agent notes, issue type, screenshots text, payment/order details, or what happened...";
    textarea.spellcheck = true;
    textarea.dataset.ticketCase = "caseDetails";

    const hint = document.createElement("p");
    hint.id = "sugoTicketCaseHint";
    hint.className = "ticket-case-section__hint";
    hint.textContent = "Use this only when you want a final ticket/customer reply or escalation-ready text.";

    const chips = document.createElement("div");
    chips.className = "ticket-case-prompts";
    chips.setAttribute("aria-label", "Create Ticket quick prompts");

    TICKET_QUICK_PROMPTS.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ticket-case-prompt";
      button.dataset.ticketPrompt = item.prompt;
      button.dataset.ticketPromptType = item.type;
      button.textContent = item.label;
      chips.append(button);
    });

    textarea.addEventListener("input", () => {
      ticketWorkspaceState.caseDetails = textarea.value;
      emitTicketCaseChange("input");
    });

    textarea.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void requestTicketGeneration("keyboard");
      }
    });

    chips.addEventListener("click", (event) => {
      const button = event.target.closest(".ticket-case-prompt[data-ticket-prompt-type]");
      if (!button || !chips.contains(button)) {
        return;
      }
      const typeSection = document.querySelector(".ticket-type-section");
      if (typeSection) {
        updateTicketTypeSelection(typeSection, button.dataset.ticketPromptType);
      } else {
        ticketWorkspaceState.type = getTicketType(button.dataset.ticketPromptType).value;
      }
      textarea.focus();
      emitTicketCaseChange("quick-prompt");
    });

    section.append(heading, textarea, hint, chips);
    return section;
  }

  function getTicketTone(value) {
    return TICKET_TONES.find((item) => item.value === value) || TICKET_TONES[0];
  }

  function emitTicketDetailsChange(field) {
    document.dispatchEvent(new CustomEvent("sugo:ticketdetailschange", {
      detail: {
        field,
        type: ticketWorkspaceState.type,
        tone: ticketWorkspaceState.tone,
        userId: ticketWorkspaceState.userId,
        orderId: ticketWorkspaceState.orderId,
        evidence: ticketWorkspaceState.evidence
      }
    }));
    renderTicketPreviewPanel();
  }

  function updateTicketToneSelection(container, value, { focus = false, emit = true } = {}) {
    const selected = getTicketTone(value);
    ticketWorkspaceState.tone = selected.value;

    container.querySelectorAll(".ticket-tone-button[data-ticket-tone]").forEach((button) => {
      const isSelected = button.dataset.ticketTone === selected.value;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
      button.tabIndex = isSelected ? 0 : -1;
      if (isSelected && focus) {
        button.focus();
      }
    });

    if (emit) {
      emitTicketDetailsChange("tone");
    }
    return selected;
  }

  function createTicketTextField({ id, label, value, icon, multiline = false, wide = false, placeholder }) {
    const field = document.createElement("div");
    field.className = `ticket-detail-field${wide ? " ticket-detail-field--wide" : ""}`;

    const labelElement = document.createElement("label");
    labelElement.className = "ticket-detail-field__label";
    labelElement.htmlFor = id;
    labelElement.innerHTML = `
      <span class="ticket-detail-field__label-icon" aria-hidden="true">${icon}</span>
      <span>${label}</span>
    `;

    const control = document.createElement(multiline ? "textarea" : "input");
    control.id = id;
    control.className = "ticket-detail-field__control";
    control.value = value;
    control.placeholder = placeholder;
    control.autocomplete = "off";
    control.spellcheck = false;
    if (multiline) {
      control.rows = 3;
    } else {
      control.type = "text";
    }

    field.append(labelElement, control);
    return { field, control };
  }

  function createTicketDetailsForm() {
    const section = document.createElement("section");
    section.className = "ticket-details-section";
    section.setAttribute("aria-labelledby", "ticketDetailsTitle");

    const heading = document.createElement("div");
    heading.className = "ticket-details-section__heading";
    heading.innerHTML = '<h2 id="ticketDetailsTitle">Ticket details</h2>';

    const form = document.createElement("div");
    form.className = "ticket-details-form";
    form.setAttribute("aria-label", "Ticket details");

    const user = createTicketTextField({
      id: "sugoTicketUserId",
      label: "User ID / UID",
      value: ticketWorkspaceState.userId,
      icon: ICONS.user,
      placeholder: "Optional"
    });
    user.control.dataset.ticketDetail = "userId";

    const order = createTicketTextField({
      id: "sugoTicketOrderId",
      label: "Order / Room / Agency ID",
      value: ticketWorkspaceState.orderId,
      icon: ICONS.link,
      placeholder: "Optional"
    });
    order.control.dataset.ticketDetail = "orderId";

    const evidence = createTicketTextField({
      id: "sugoTicketEvidence",
      label: "Evidence / Internal notes",
      value: ticketWorkspaceState.evidence,
      icon: ICONS.notes,
      multiline: true,
      wide: true,
      placeholder: "Optional: screenshots, time, amount, country, device, payment method, previous action, or escalation note..."
    });
    evidence.control.dataset.ticketDetail = "evidence";

    form.append(user.field, order.field, evidence.field);

    const tone = document.createElement("div");
    tone.className = "ticket-tone-field";
    tone.innerHTML = `
      <span class="ticket-tone-field__label" id="ticketToneLabel">Tone</span>
      <div class="ticket-tone-control" role="group" aria-labelledby="ticketToneLabel"></div>
    `;
    const toneControl = tone.querySelector(".ticket-tone-control");

    TICKET_TONES.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ticket-tone-button";
      button.dataset.ticketTone = item.value;
      button.setAttribute("aria-pressed", "false");
      button.textContent = item.label;
      toneControl.append(button);
    });

    section.append(heading, form, tone);

    form.addEventListener("input", (event) => {
      const control = event.target.closest("[data-ticket-detail]");
      if (!control || !form.contains(control)) {
        return;
      }
      const key = control.dataset.ticketDetail;
      if (!Object.prototype.hasOwnProperty.call(ticketWorkspaceState, key)) {
        return;
      }
      ticketWorkspaceState[key] = control.value;
      emitTicketDetailsChange(key);
    });

    toneControl.addEventListener("click", (event) => {
      const button = event.target.closest(".ticket-tone-button[data-ticket-tone]");
      if (!button || !toneControl.contains(button)) {
        return;
      }
      updateTicketToneSelection(tone, button.dataset.ticketTone);
    });

    toneControl.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        return;
      }
      const buttons = [...toneControl.querySelectorAll(".ticket-tone-button[data-ticket-tone]")];
      if (!buttons.length) {
        return;
      }
      const currentIndex = Math.max(0, buttons.findIndex((button) => button.getAttribute("aria-pressed") === "true"));
      let nextIndex = currentIndex;
      if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = buttons.length - 1;
      } else if (event.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % buttons.length;
      } else {
        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      }
      event.preventDefault();
      updateTicketToneSelection(tone, buttons[nextIndex].dataset.ticketTone, { focus: true });
    });

    updateTicketToneSelection(tone, ticketWorkspaceState.tone, { emit: false });
    return section;
  }

  function formatTicketImageBytes(bytes) {
    const value = Number(bytes || 0);
    if (value < 1024) {
      return `${value} B`;
    }
    if (value < 1024 * 1024) {
      return `${(value / 1024).toFixed(1)} KB`;
    }
    return `${(value / (1024 * 1024)).toFixed(2)} MB`;
  }

  function readTicketImageAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read the selected image."));
      reader.readAsDataURL(file);
    });
  }

  function loadTicketImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("The selected file could not be opened as an image."));
      image.src = dataUrl;
    });
  }

  function estimateTicketImageBytes(base64) {
    const clean = String(base64 || "").replace(/\s+/g, "");
    return Math.max(0, Math.floor(clean.length * 0.75));
  }

  async function prepareTicketImageForAI(file) {
    const suppliedType = String(file?.type || "").toLowerCase();
    const rawType = suppliedType === "image/jpg" ? "image/jpeg" : suppliedType;
    if (!TICKET_IMAGE_ALLOWED_TYPES.has(rawType)) {
      throw new Error("Supported image types: JPG, PNG, or WebP only.");
    }
    if (Number(file?.size || 0) > TICKET_IMAGE_MAX_FILE_BYTES) {
      throw new Error(`Image is too large. Max ${formatTicketImageBytes(TICKET_IMAGE_MAX_FILE_BYTES)} before compression.`);
    }

    const originalDataUrl = await readTicketImageAsDataUrl(file);
    const image = await loadTicketImage(originalDataUrl);
    const originalWidth = image.naturalWidth || image.width;
    const originalHeight = image.naturalHeight || image.height;
    if (!originalWidth || !originalHeight) {
      throw new Error("Image dimensions could not be detected.");
    }

    const scale = Math.min(1, TICKET_IMAGE_MAX_EDGE / Math.max(originalWidth, originalHeight));
    const width = Math.max(1, Math.round(originalWidth * scale));
    const height = Math.max(1, Math.round(originalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("The selected file could not be opened as an image.");
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", TICKET_IMAGE_JPEG_QUALITY);
    const base64 = dataUrl.split(",")[1] || "";
    if (!base64 || base64.length > TICKET_IMAGE_MAX_BASE64_CHARS) {
      throw new Error("Image is still too large after compression. Please choose a clearer/smaller screenshot.");
    }

    return {
      mimeType: "image/jpeg",
      data: base64,
      name: file.name || "attached-image.jpg",
      originalType: rawType,
      originalSize: Number(file.size || 0),
      size: estimateTicketImageBytes(base64),
      width,
      height,
      originalWidth,
      originalHeight,
      previewDataUrl: dataUrl
    };
  }

  function getTicketImageMetadata() {
    if (!ticketAttachedImage) {
      return null;
    }
    return {
      mimeType: ticketAttachedImage.mimeType,
      name: ticketAttachedImage.name,
      size: ticketAttachedImage.size,
      width: ticketAttachedImage.width,
      height: ticketAttachedImage.height,
      originalType: ticketAttachedImage.originalType,
      originalSize: ticketAttachedImage.originalSize,
      originalWidth: ticketAttachedImage.originalWidth,
      originalHeight: ticketAttachedImage.originalHeight
    };
  }

  function buildTicketImagePayload() {
    if (!ticketAttachedImage) {
      return undefined;
    }
    return [{
      mimeType: ticketAttachedImage.mimeType,
      data: ticketAttachedImage.data,
      name: ticketAttachedImage.name,
      width: ticketAttachedImage.width,
      height: ticketAttachedImage.height
    }];
  }

  function emitTicketImageChange(source = "input") {
    document.dispatchEvent(new CustomEvent("sugo:ticketimagechange", {
      detail: {
        source,
        hasImage: Boolean(ticketAttachedImage),
        image: getTicketImageMetadata()
      }
    }));
    renderTicketPreviewPanel();
  }

  function setTicketImageStatus(section, message, isError = false) {
    const status = section?.querySelector("#sugoTicketImageStatus");
    if (!status) {
      return;
    }
    status.textContent = String(message || "");
    status.classList.toggle("is-active", Boolean(message));
    status.classList.toggle("is-error", Boolean(message) && isError);
  }

  function renderTicketImagePreview(section) {
    const preview = section?.querySelector("#sugoTicketImagePreview");
    if (!preview) {
      return;
    }
    if (!ticketAttachedImage) {
      preview.classList.remove("has-image");
      preview.replaceChildren();
      return;
    }

    const image = document.createElement("img");
    image.className = "ticket-image-preview__thumb";
    image.src = ticketAttachedImage.previewDataUrl;
    image.alt = "Attached image preview";

    const metadata = document.createElement("div");
    metadata.className = "ticket-image-preview__meta";

    const name = document.createElement("strong");
    name.className = "ticket-image-preview__name";
    name.textContent = ticketAttachedImage.name;

    const details = document.createElement("span");
    details.className = "ticket-image-preview__details";
    details.textContent = `${ticketAttachedImage.width}×${ticketAttachedImage.height} · ${formatTicketImageBytes(ticketAttachedImage.size)} compressed`;
    metadata.append(name, details);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "ticket-image-preview__remove";
    remove.title = "Remove image";
    remove.setAttribute("aria-label", "Remove image");
    remove.innerHTML = ICONS.trash;
    remove.addEventListener("click", () => {
      ticketAttachedImage = null;
      renderTicketImagePreview(section);
      setTicketImageStatus(section, "");
      emitTicketImageChange("remove");
      section.querySelector(".ticket-image-dropzone")?.focus();
    });

    preview.classList.add("has-image");
    preview.replaceChildren(image, metadata, remove);
  }

  async function handleTicketImageFile(section, file, source = "input") {
    if (!file) {
      return false;
    }
    setTicketImageStatus(section, "Preparing image for AI analysis…");
    try {
      ticketAttachedImage = await prepareTicketImageForAI(file);
      renderTicketImagePreview(section);
      setTicketImageStatus(section, "");
      emitTicketImageChange(source);
      return true;
    } catch (error) {
      ticketAttachedImage = null;
      renderTicketImagePreview(section);
      setTicketImageStatus(section, error?.message || String(error), true);
      emitTicketImageChange("error");
      return false;
    }
  }

  function createTicketAttachmentSection() {
    const section = document.createElement("section");
    section.className = "ticket-image-section";
    section.setAttribute("aria-labelledby", "ticketImageTitle");

    const heading = document.createElement("div");
    heading.className = "ticket-image-section__heading";
    heading.innerHTML = '<h2 id="ticketImageTitle">Image / Screenshot evidence</h2>';

    const input = document.createElement("input");
    input.id = "sugoTicketImageInput";
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    input.hidden = true;

    const dropzone = document.createElement("button");
    dropzone.type = "button";
    dropzone.className = "ticket-image-dropzone";
    dropzone.setAttribute("aria-describedby", "sugoTicketImageHelp sugoTicketImageStatus");
    dropzone.innerHTML = `
      <span class="ticket-image-dropzone__icon" aria-hidden="true">${ICONS.image}</span>
      <span class="ticket-image-dropzone__copy">
        <strong>Click to upload image</strong>
        <span id="sugoTicketImageHelp">Supports JPG, PNG, and WebP. The image is compressed locally before being sent to the AI Worker.</span>
      </span>
    `;

    const status = document.createElement("div");
    status.id = "sugoTicketImageStatus";
    status.className = "ticket-image-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    const preview = document.createElement("div");
    preview.id = "sugoTicketImagePreview";
    preview.className = "ticket-image-preview";
    preview.setAttribute("aria-live", "polite");

    dropzone.addEventListener("click", () => input.click());
    input.addEventListener("change", async () => {
      const [file] = input.files || [];
      await handleTicketImageFile(section, file, "input");
      input.value = "";
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        dropzone.classList.add("is-dragging");
      });
    });
    ["dragleave", "drop"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        dropzone.classList.remove("is-dragging");
      });
    });
    dropzone.addEventListener("drop", async (event) => {
      const [file] = event.dataTransfer?.files || [];
      await handleTicketImageFile(section, file, "drop");
    });

    section.append(heading, input, dropzone, status, preview);
    renderTicketImagePreview(section);
    return section;
  }

  function getTicketPreviewSnapshot() {
    const type = getTicketType(ticketWorkspaceState.type);
    const tone = getTicketTone(ticketWorkspaceState.tone);
    return {
      type: type.value,
      typeLabel: type.label,
      typeText: TICKET_OUTPUT_TYPE_TEXT[type.value] || "ticket",
      tone: tone.value,
      toneLabel: tone.label,
      toneText: TICKET_OUTPUT_TONE_TEXT[tone.value] || "professional",
      knowledgeMode: "SOP Only",
      caseDetails: ticketWorkspaceState.caseDetails,
      userId: ticketWorkspaceState.userId,
      orderId: ticketWorkspaceState.orderId,
      evidence: ticketWorkspaceState.evidence,
      generatedOutput: ticketWorkspaceState.generatedOutput,
      image: getTicketImageMetadata()
    };
  }

  function createTicketPreviewValue(label, value, icon, { multiline = false } = {}) {
    const item = document.createElement("div");
    item.className = `ticket-preview-value${multiline ? " ticket-preview-value--multiline" : ""}`;

    const heading = document.createElement("div");
    heading.className = "ticket-preview-value__heading";
    heading.innerHTML = `
      <span class="ticket-preview-value__icon" aria-hidden="true">${icon}</span>
      <span class="ticket-preview-value__label"></span>
    `;
    heading.querySelector(".ticket-preview-value__label").textContent = label;

    const output = document.createElement(multiline ? "p" : "div");
    output.className = "ticket-preview-value__content";
    const clean = String(value || "").trim();
    output.textContent = clean || "Optional";
    output.classList.toggle("is-empty", !clean);

    item.append(heading, output);
    return item;
  }

  function resetTicketRequestState({ abort = false } = {}) {
    ticketRequestState.requestId += 1;
    if (abort) {
      window.SUGO?.WorkerAPI?.abort?.();
    }
    ticketRequestState.status = "idle";
    ticketRequestState.message = "";
    ticketRequestState.responseBranch = "";
    ticketRequestState.kbConfidence = "";
    ticketRequestState.kbPrimaryRoute = "";
  }

  function clearTicketWorkspaceState({ focus = false, source = "clear" } = {}) {
    resetTicketRequestState({ abort: true });
    ticketWorkspaceState.caseDetails = "";
    ticketWorkspaceState.userId = "";
    ticketWorkspaceState.orderId = "";
    ticketWorkspaceState.evidence = "";
    ticketWorkspaceState.generatedOutput = "";
    ticketAttachedImage = null;

    const caseInput = document.getElementById("sugoTicketInput");
    const userInput = document.getElementById("sugoTicketUserId");
    const orderInput = document.getElementById("sugoTicketOrderId");
    const evidenceInput = document.getElementById("sugoTicketEvidence");
    if (caseInput) caseInput.value = "";
    if (userInput) userInput.value = "";
    if (orderInput) orderInput.value = "";
    if (evidenceInput) evidenceInput.value = "";

    const imageSection = document.querySelector(".ticket-image-section");
    if (imageSection) {
      renderTicketImagePreview(imageSection);
      setTicketImageStatus(imageSection, "");
    }

    emitTicketCaseChange(source);
    emitTicketDetailsChange("all");
    emitTicketImageChange(source);
    document.dispatchEvent(new CustomEvent("sugo:ticketoutputchange", {
      detail: { source, output: "" }
    }));
    if (focus) {
      caseInput?.focus();
    }
    return getTicketPreviewSnapshot();
  }

  async function requestTicketGeneration(source = "preview") {
    const caseInput = document.getElementById("sugoTicketInput");
    const hasCase = Boolean(ticketWorkspaceState.caseDetails.trim());
    const hasImage = Boolean(ticketAttachedImage);
    if (!hasCase && !hasImage) {
      caseInput?.classList.add("is-invalid");
      caseInput?.focus();
      window.setTimeout(() => caseInput?.classList.remove("is-invalid"), 520);
      return { ok: false, code: "EMPTY_TICKET_REQUEST" };
    }
    if (ticketRequestState.status === "loading") {
      return { ok: false, code: "REQUEST_IN_PROGRESS" };
    }

    const snapshot = getTicketPreviewSnapshot();
    document.dispatchEvent(new CustomEvent("sugo:ticketgeneraterequest", {
      detail: { source, ...snapshot }
    }));

    const workerAPI = window.SUGO?.WorkerAPI;
    if (!workerAPI?.generateTicket) {
      ticketRequestState.status = "error";
      ticketRequestState.message = "The AI service is not available.";
      renderTicketPreviewPanel();
      return { ok: false, code: "WORKER_API_UNAVAILABLE" };
    }

    const requestId = ticketRequestState.requestId + 1;
    ticketRequestState.requestId = requestId;
    ticketRequestState.status = "loading";
    ticketRequestState.message = "Searching the knowledge base…";
    ticketRequestState.responseBranch = "";
    ticketRequestState.kbConfidence = "";
    ticketRequestState.kbPrimaryRoute = "";
    ticketWorkspaceState.generatedOutput = "";
    renderTicketPreviewPanel();

    try {
      const result = await workerAPI.generateTicket({
        type: ticketWorkspaceState.type,
        tone: ticketWorkspaceState.tone,
        caseDetails: ticketWorkspaceState.caseDetails,
        userId: ticketWorkspaceState.userId,
        orderId: ticketWorkspaceState.orderId,
        evidence: ticketWorkspaceState.evidence,
        images: buildTicketImagePayload(),
        imageMeta: getTicketImageMetadata(),
        responseMode: "detailed",
        sopMode: "sop_only"
      }, {
        onProgress(progress) {
          if (requestId !== ticketRequestState.requestId) return;
          const liveText = String(progress?.text || "").trim();
          if (liveText) {
            ticketWorkspaceState.generatedOutput = liveText;
            renderTicketPreviewPanel();
          }
        }
      });

      if (requestId !== ticketRequestState.requestId) {
        return { ok: false, code: "STALE_REQUEST" };
      }
      ticketRequestState.status = "success";
      ticketRequestState.message = "";
      ticketRequestState.responseBranch = result.responseBranch || "";
      ticketRequestState.kbConfidence = result.kb?.confidence || "";
      ticketRequestState.kbPrimaryRoute = result.kb?.primaryRoute?.name || "";
      applyGeneratedTicket({ output: result.answer }, { source: "worker" });
      return { ok: true, ...result };
    } catch (error) {
      if (requestId !== ticketRequestState.requestId) {
        return { ok: false, code: "STALE_REQUEST" };
      }
      ticketRequestState.status = "error";
      ticketRequestState.message = String(error?.message || "AI could not generate the ticket.");
      ticketRequestState.responseBranch = "";
      renderTicketPreviewPanel();
      document.dispatchEvent(new CustomEvent("sugo:ticketgenerationerror", {
        detail: {
          source,
          code: error?.code || "WORKER_REQUEST_FAILED",
          message: ticketRequestState.message
        }
      }));
      return { ok: false, code: error?.code || "WORKER_REQUEST_FAILED", error };
    }
  }

  function applyGeneratedTicket(result = {}, { source = "smart-ticket-builder" } = {}) {
    const payload = typeof result === "string" ? { output: result } : (result || {});

    if (Object.prototype.hasOwnProperty.call(payload, "type")) {
      ticketWorkspaceState.type = getTicketType(payload.type).value;
      const typeSection = document.querySelector(".ticket-type-section");
      if (typeSection) {
        updateTicketTypeSelection(typeSection, ticketWorkspaceState.type, { emit: false });
      }
    }
    if (Object.prototype.hasOwnProperty.call(payload, "tone")) {
      ticketWorkspaceState.tone = getTicketTone(payload.tone).value;
      const detailsSection = document.querySelector(".ticket-details-section");
      if (detailsSection) {
        updateTicketToneSelection(detailsSection, ticketWorkspaceState.tone, { emit: false });
      }
    }

    ["caseDetails", "userId", "orderId", "evidence"].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        ticketWorkspaceState[key] = String(payload[key] ?? "");
      }
    });
    ticketWorkspaceState.generatedOutput = String(
      payload.output ?? payload.text ?? payload.ticket ?? ""
    ).trim();

    const controls = {
      caseDetails: document.getElementById("sugoTicketInput"),
      userId: document.getElementById("sugoTicketUserId"),
      orderId: document.getElementById("sugoTicketOrderId"),
      evidence: document.getElementById("sugoTicketEvidence")
    };
    Object.entries(controls).forEach(([key, control]) => {
      if (control) control.value = ticketWorkspaceState[key];
    });

    renderTicketPreviewPanel();
    document.dispatchEvent(new CustomEvent("sugo:ticketoutputchange", {
      detail: {
        source,
        output: ticketWorkspaceState.generatedOutput,
        snapshot: getTicketPreviewSnapshot()
      }
    }));
    return getTicketPreviewSnapshot();
  }

  function renderTicketPreviewPanel() {
    const preview = document.querySelector(".app-shell__preview");
    const activeWorkspace = document.querySelector(".app-shell")?.dataset.activeWorkspace || "";
    if (!preview) {
      return;
    }
    if (activeWorkspace !== WORKSPACES.CREATE_TICKET) {
      preview.classList.remove("has-content");
      preview.replaceChildren();
      return;
    }

    const snapshot = getTicketPreviewSnapshot();
    const panel = document.createElement("aside");
    panel.className = "ticket-preview-panel";
    panel.setAttribute("aria-label", "Create Ticket options");

    const scroller = document.createElement("div");
    scroller.className = "ticket-preview-panel__scroll";

    const header = document.createElement("header");
    header.className = "ticket-preview-panel__header";
    header.innerHTML = `
      <span class="ticket-preview-panel__header-icon" aria-hidden="true">${ICONS.ticket}</span>
      <span class="ticket-preview-panel__header-copy">
        <h2>Output</h2>
        <p>This is locked to <strong>Ticket</strong> output.</p>
      </span>
      <span class="ticket-preview-panel__badge">Ticket</span>
    `;

    const summary = document.createElement("div");
    summary.className = "ticket-preview-panel__summary";
    summary.innerHTML = "<strong>Output:</strong> ";
    summary.append(`${snapshot.typeText} · ${snapshot.toneText} · ${snapshot.knowledgeMode}.`);

    scroller.append(header, summary);

    if (ticketRequestState.status === "loading") {
      const requestStatus = document.createElement("div");
      requestStatus.className = "ticket-preview-panel__request-status is-loading";
      requestStatus.setAttribute("role", "status");
      requestStatus.setAttribute("aria-live", "polite");
      requestStatus.innerHTML = '<span class="ticket-preview-panel__spinner" aria-hidden="true"></span><span></span>';
      requestStatus.querySelector("span:last-child").textContent = ticketRequestState.message || "Searching the knowledge base…";
      scroller.append(requestStatus);
    } else if (ticketRequestState.status === "error") {
      const requestStatus = document.createElement("div");
      requestStatus.className = "ticket-preview-panel__request-status is-error";
      requestStatus.setAttribute("role", "alert");
      const errorText = document.createElement("p");
      errorText.textContent = ticketRequestState.message;
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "ticket-preview-panel__retry";
      retry.textContent = "Try again";
      retry.addEventListener("click", () => void requestTicketGeneration("retry"));
      requestStatus.append(errorText, retry);
      scroller.append(requestStatus);
    }

    if (snapshot.generatedOutput) {
      const generatedSection = document.createElement("section");
      generatedSection.className = "ticket-preview-panel__generated-section";
      const generatedTitle = document.createElement("h3");
      generatedTitle.textContent = "Generated Ticket";
      const generated = document.createElement("div");
      generated.className = "ticket-preview-panel__generated";
      generated.innerHTML = window.SUGO?.WorkerAPI?.renderMarkdown
        ? window.SUGO.WorkerAPI.renderMarkdown(snapshot.generatedOutput)
        : snapshot.generatedOutput.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
      generatedSection.append(generatedTitle, generated);
      scroller.append(generatedSection);
    }

    const caseValue = createTicketPreviewValue(
      "Customer conversation / Case details",
      snapshot.caseDetails,
      ICONS.notes,
      { multiline: true }
    );

    const details = document.createElement("section");
    details.className = "ticket-preview-panel__section";
    const detailsTitle = document.createElement("h3");
    detailsTitle.textContent = "Ticket details";
    const detailsGrid = document.createElement("div");
    detailsGrid.className = "ticket-preview-panel__details";
    detailsGrid.append(
      createTicketPreviewValue("User ID / UID", snapshot.userId, ICONS.user),
      createTicketPreviewValue("Order / Room / Agency ID", snapshot.orderId, ICONS.link),
      createTicketPreviewValue("Evidence / Internal notes", snapshot.evidence, ICONS.notes, { multiline: true })
    );
    details.append(detailsTitle, detailsGrid);

    scroller.append(caseValue, details);

    if (ticketAttachedImage) {
      const imageSection = document.createElement("section");
      imageSection.className = "ticket-preview-panel__section";
      const title = document.createElement("h3");
      title.textContent = "Image / Screenshot evidence";
      const imageRow = document.createElement("div");
      imageRow.className = "ticket-preview-panel__image";

      const image = document.createElement("img");
      image.src = ticketAttachedImage.previewDataUrl;
      image.alt = "Attached image preview";

      const metadata = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = ticketAttachedImage.name;
      const data = document.createElement("span");
      data.textContent = `${ticketAttachedImage.width}×${ticketAttachedImage.height} · ${formatTicketImageBytes(ticketAttachedImage.size)} compressed`;
      metadata.append(name, data);
      imageRow.append(image, metadata);
      imageSection.append(title, imageRow);
      scroller.append(imageSection);
    }

    const actions = document.createElement("div");
    actions.className = "ticket-preview-panel__actions";

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "ticket-preview-panel__clear";
    clear.textContent = "Clear";
    clear.disabled = ticketRequestState.status === "loading";
    clear.addEventListener("click", () => clearTicketWorkspaceState({ focus: true }));

    const generate = document.createElement("button");
    generate.type = "button";
    generate.id = "sugoTicketSubmit";
    generate.className = "ticket-preview-panel__generate";
    generate.disabled = ticketRequestState.status === "loading";
    generate.textContent = ticketRequestState.status === "loading" ? "Generating…" : "Generate Ticket";
    generate.addEventListener("click", () => void requestTicketGeneration("preview"));

    actions.append(clear, generate);
    panel.append(scroller, actions);
    preview.classList.add("has-content");
    preview.replaceChildren(panel);
  }


  function getAskAIFocus(value = askAIWorkspaceState.focus) {
    return ASK_AI_FOCUS_MODES.find((item) => item.value === value) || ASK_AI_FOCUS_MODES[0];
  }

  function getAskAIResponse(value = askAIWorkspaceState.response) {
    return ASK_AI_RESPONSE_MODES.find((item) => item.value === value) || ASK_AI_RESPONSE_MODES[0];
  }

  function getAskAIKnowledgeMode(value = askAIWorkspaceState.sop) {
    return ASK_AI_KNOWLEDGE_MODES.find((item) => item.value === value) || ASK_AI_KNOWLEDGE_MODES[0];
  }

  function emitAskAIStateChange(source = "input") {
    document.dispatchEvent(new CustomEvent("sugo:askaistatechange", {
      detail: {
        source,
        query: askAIWorkspaceState.query,
        response: askAIWorkspaceState.response,
        sop: askAIWorkspaceState.sop,
        focus: askAIWorkspaceState.focus
      }
    }));
    renderAskAIOutputPanel();
  }

  function resetAskAIRequestState({ abort = false } = {}) {
    askAIRequestState.requestId += 1;
    if (abort) window.SUGO?.WorkerAPI?.abort?.();
    askAIRequestState.status = "idle";
    askAIRequestState.message = "";
    askAIRequestState.responseBranch = "";
    askAIRequestState.kbConfidence = "";
    askAIRequestState.kbConfidenceScore = 0;
    askAIRequestState.kbPrimaryRoute = "";
    askAIRequestState.topics = [];
    askAIRequestState.lastRequest = null;
    askAIRequestState.copyStatus = "";
  }

  function updateAskAIOptionSelection(group, value, { emit = true } = {}) {
    if (group === "response") {
      askAIWorkspaceState.response = getAskAIResponse(value).value;
    } else if (group === "sop") {
      askAIWorkspaceState.sop = getAskAIKnowledgeMode(value).value;
    } else if (group === "focus") {
      askAIWorkspaceState.focus = getAskAIFocus(value).value;
    } else {
      return false;
    }

    document.querySelectorAll(`[data-ask-ai-option="${group}"]`).forEach((button) => {
      const selected = button.dataset.value === askAIWorkspaceState[group];
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    const hint = document.getElementById("sugoAskAIHint");
    if (hint) hint.textContent = getAskAIFocus().hint;
    if (emit) emitAskAIStateChange(`option:${group}`);
    return true;
  }

  function bindAskAIOptionKeyboard(groupElement) {
    groupElement.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      const buttons = [...groupElement.querySelectorAll("button:not(:disabled)")];
      if (!buttons.length) return;
      const activeIndex = Math.max(0, buttons.indexOf(document.activeElement));
      let nextIndex = activeIndex;
      if (["ArrowRight", "ArrowDown"].includes(event.key)) nextIndex = (activeIndex + 1) % buttons.length;
      if (["ArrowLeft", "ArrowUp"].includes(event.key)) nextIndex = (activeIndex - 1 + buttons.length) % buttons.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = buttons.length - 1;
      event.preventDefault();
      buttons[nextIndex].focus();
      buttons[nextIndex].click();
    });
  }

  function createAskAIPrimaryCard() {
    const card = document.createElement("section");
    card.className = "ask-ai-card ask-ai-card--primary";

    const label = document.createElement("label");
    label.className = "ask-ai-card__label";
    label.htmlFor = "sugoAskAIInput";
    label.textContent = "Question / Case details";

    const textarea = document.createElement("textarea");
    textarea.id = "sugoAskAIInput";
    textarea.className = "ask-ai-card__textarea";
    textarea.rows = 9;
    textarea.placeholder = "Example: user cannot receive recharge coins, what should the agent check and what should we reply?";
    textarea.value = askAIWorkspaceState.query;
    textarea.addEventListener("input", () => {
      askAIWorkspaceState.query = textarea.value;
      textarea.classList.remove("is-invalid");
      emitAskAIStateChange("input");
    });
    textarea.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        void requestAskAIAnswer("keyboard");
      }
    });

    const hint = document.createElement("p");
    hint.id = "sugoAskAIHint";
    hint.className = "ask-ai-card__hint";
    hint.textContent = getAskAIFocus().hint;

    const chips = document.createElement("div");
    chips.className = "ask-ai-card__chips";
    chips.setAttribute("aria-label", "Ask AI quick prompts");
    ASK_AI_QUICK_PROMPTS.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ask-ai-chip";
      button.textContent = item.label;
      button.addEventListener("click", () => {
        const current = textarea.value.trim();
        textarea.value = current ? `${current}\n${item.prompt}` : item.prompt;
        askAIWorkspaceState.query = textarea.value;
        textarea.focus();
        emitAskAIStateChange("quick-prompt");
      });
      chips.append(button);
    });

    const actions = document.createElement("div");
    actions.className = "ask-ai-card__actions";
    const generate = document.createElement("button");
    generate.id = "sugoAskAISubmit";
    generate.type = "button";
    generate.className = "ask-ai-card__submit";
    generate.disabled = askAIRequestState.status === "loading";
    generate.textContent = askAIRequestState.status === "loading" ? "Generating…" : "Generate AI Answer";
    generate.addEventListener("click", () => void requestAskAIAnswer("workspace"));

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "ask-ai-card__clear";
    clear.disabled = askAIRequestState.status === "loading";
    clear.textContent = "Clear";
    clear.addEventListener("click", () => clearAskAIWorkspace({ focus: true }));
    actions.append(generate, clear);
    card.append(label, textarea, hint, chips, actions);
    return card;
  }

  function createAskAIOptionsCard() {
    const card = document.createElement("aside");
    card.className = "ask-ai-card ask-ai-options";
    card.setAttribute("aria-label", "Ask AI options");

    const title = document.createElement("h2");
    title.className = "ask-ai-options__title";
    title.textContent = "Ask AI Options";
    card.append(title);

    const createGroup = (labelText, groupName, options, { stacked = false } = {}) => {
      const group = document.createElement("section");
      group.className = "ask-ai-options__group";
      const label = document.createElement("h3");
      label.textContent = labelText;
      const controls = document.createElement("div");
      controls.className = stacked ? "ask-ai-options__stack" : `ask-ai-options__segments${options.length === 3 ? " is-three" : ""}`;
      controls.setAttribute("role", "group");
      controls.setAttribute("aria-label", labelText);
      options.forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = stacked ? "ask-ai-focus" : "ask-ai-segment";
        button.dataset.askAiOption = groupName;
        button.dataset.value = item.value;
        button.textContent = item.label;
        const selected = askAIWorkspaceState[groupName] === item.value;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
        button.addEventListener("click", () => updateAskAIOptionSelection(groupName, item.value));
        controls.append(button);
      });
      bindAskAIOptionKeyboard(controls);
      group.append(label, controls);
      return group;
    };

    card.append(
      createGroup("Answer depth", "response", ASK_AI_RESPONSE_MODES),
      createGroup("Knowledge mode", "sop", ASK_AI_KNOWLEDGE_MODES),
      createGroup("Ask AI focus", "focus", ASK_AI_FOCUS_MODES, { stacked: true })
    );

    const note = document.createElement("p");
    note.className = "ask-ai-options__note";
    note.innerHTML = "This is locked to <strong>Answer</strong> output.";
    card.append(note);
    return card;
  }

  function createAskAIStatus() {
    if (!["loading", "error", "stopped"].includes(askAIRequestState.status)) return null;
    const status = document.createElement("div");
    status.className = `ask-ai-output__status is-${askAIRequestState.status}`;
    status.setAttribute("role", askAIRequestState.status === "error" ? "alert" : "status");
    status.setAttribute("aria-live", "polite");
    if (askAIRequestState.status === "loading") {
      const spinner = document.createElement("span");
      spinner.className = "ask-ai-output__spinner";
      spinner.setAttribute("aria-hidden", "true");
      const text = document.createElement("span");
      text.textContent = askAIRequestState.message || "Searching the knowledge base…";
      status.append(spinner, text);
    } else {
      const text = document.createElement("p");
      text.textContent = askAIRequestState.message;
      status.append(text);
      if (askAIRequestState.lastRequest) {
        const retry = document.createElement("button");
        retry.type = "button";
        retry.className = "ask-ai-output__retry";
        retry.textContent = "Try again";
        retry.addEventListener("click", () => void retryAskAIAnswer());
        status.append(retry);
      }
    }
    return status;
  }

  function renderAskAISources(container) {
    if (!askAIWorkspaceState.answer || askAIRequestState.status === "loading") return;
    const meta = document.createElement("section");
    meta.className = "ask-ai-output__sources";

    const cards = document.createElement("div");
    cards.className = "ask-ai-output__meta";
    const values = [
      ["Confidence", askAIRequestState.kbConfidence ? `${askAIRequestState.kbConfidence[0].toUpperCase()}${askAIRequestState.kbConfidence.slice(1)} · ${askAIRequestState.kbConfidenceScore}` : "Low · 0"],
      ["Best match", askAIRequestState.topics[0]?.title || "No direct SOP match"],
      ["Mode", getAskAIKnowledgeMode().label]
    ];
    values.forEach(([label, value]) => {
      const card = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = label;
      const output = document.createElement("span");
      output.textContent = String(value);
      card.append(strong, output);
      cards.append(card);
    });

    const sourceLabel = document.createElement("h3");
    sourceLabel.textContent = "Sources";
    const chips = document.createElement("div");
    chips.className = "ask-ai-output__source-chips";
    const topics = askAIRequestState.topics.slice(0, 4);
    if (topics.length) {
      topics.forEach((topic) => {
        const chip = document.createElement("span");
        chip.className = `ask-ai-source-chip is-${topic.confidence || askAIRequestState.kbConfidence || "low"}`;
        chip.textContent = topic.title || topic.id;
        chip.title = topic.path || topic.id;
        chips.append(chip);
      });
    } else {
      const chip = document.createElement("span");
      chip.className = "ask-ai-source-chip is-low";
      chip.textContent = "No direct SOP match";
      chips.append(chip);
    }
    meta.append(cards, sourceLabel, chips);
    container.append(meta);
  }

  function createAskAIFollowup() {
    const form = document.createElement("form");
    form.className = "ask-ai-output__followup";
    const textarea = document.createElement("textarea");
    textarea.id = "aiFollowupInput";
    textarea.rows = 1;
    textarea.placeholder = "Ask a follow-up question…";
    textarea.disabled = askAIRequestState.status === "loading";
    textarea.addEventListener("input", () => {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    });
    const ask = document.createElement("button");
    ask.id = "aiFollowupBtn";
    ask.type = "submit";
    ask.disabled = askAIRequestState.status === "loading";
    ask.innerHTML = `<span>Ask</span>${ICONS.send}`;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = textarea.value.trim();
      if (!query) {
        textarea.focus();
        return;
      }
      textarea.value = "";
      textarea.style.height = "auto";
      void requestAskAIAnswer("follow-up", { query, isFollowup: true });
    });
    form.append(textarea, ask);
    return form;
  }

  function renderAskAIOutputPanel() {
    const preview = document.querySelector(".app-shell__preview");
    const activeWorkspace = document.querySelector(".app-shell")?.dataset.activeWorkspace || "";
    if (!preview) return;
    if (activeWorkspace !== WORKSPACES.ASK_AI) {
      if (activeWorkspace !== WORKSPACES.CREATE_TICKET) {
        preview.classList.remove("has-content");
        preview.replaceChildren();
      }
      return;
    }

    const panel = document.createElement("aside");
    panel.className = "ask-ai-output";
    panel.setAttribute("aria-label", "AI Answer");
    const scroller = document.createElement("div");
    scroller.className = "ask-ai-output__scroll";

    const header = document.createElement("header");
    header.className = "ask-ai-output__header";
    header.innerHTML = `
      <span class="ask-ai-output__header-icon" aria-hidden="true">${ICONS.askAI}</span>
      <span class="ask-ai-output__header-copy"><h2>AI Answer</h2><p>This is locked to <strong>Answer</strong> output.</p></span>
      <span class="ask-ai-output__badge">Answer</span>
    `;
    const summary = document.createElement("div");
    summary.className = "ask-ai-output__summary";
    summary.innerHTML = "<strong>Output:</strong> ";
    summary.append(`${getAskAIFocus().label} · ${getAskAIResponse().label} · ${getAskAIKnowledgeMode().label}.`);
    scroller.append(header, summary);

    const status = createAskAIStatus();
    if (status) scroller.append(status);

    if (askAIWorkspaceState.currentQuestion) {
      const question = document.createElement("section");
      question.className = "ask-ai-output__question";
      const label = document.createElement("strong");
      label.textContent = "Question / Case details";
      const value = document.createElement("p");
      value.textContent = askAIWorkspaceState.currentQuestion;
      question.append(label, value);
      scroller.append(question);
    }

    if (askAIWorkspaceState.answer) {
      const answer = document.createElement("section");
      answer.className = "ask-ai-output__answer";
      answer.innerHTML = window.SUGO?.WorkerAPI?.renderMarkdown
        ? window.SUGO.WorkerAPI.renderMarkdown(askAIWorkspaceState.answer)
        : askAIWorkspaceState.answer.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
      scroller.append(answer);
      renderAskAISources(scroller);
      scroller.append(createAskAIFollowup());
    } else if (askAIRequestState.status === "idle") {
      const empty = document.createElement("div");
      empty.className = "ask-ai-output__empty";
      empty.innerHTML = `<span aria-hidden="true">${ICONS.askAI}</span><p>Use this for agent guidance, SOP explanation, correct action, missing info, and escalation path.</p>`;
      scroller.append(empty);
    }

    const actions = document.createElement("div");
    actions.className = "ask-ai-output__actions";
    if (askAIRequestState.status === "loading") {
      const stop = document.createElement("button");
      stop.type = "button";
      stop.className = "ask-ai-output__stop";
      stop.innerHTML = `${ICONS.stop}<span>Stop</span>`;
      stop.addEventListener("click", stopAskAIAnswer);
      actions.append(stop);
    } else if (askAIWorkspaceState.answer) {
      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "ask-ai-output__copy";
      copy.innerHTML = `${ICONS.copy}<span>${askAIRequestState.copyStatus || "Copy"}</span>`;
      copy.addEventListener("click", () => void copyAskAIAnswer());
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "ask-ai-output__retry-action";
      retry.textContent = "Try again";
      retry.addEventListener("click", () => void retryAskAIAnswer());
      actions.append(copy, retry);
    }

    panel.append(scroller);
    if (actions.childElementCount) panel.append(actions);
    preview.classList.add("has-content");
    preview.replaceChildren(panel);
  }

  function renderAskAIWorkspace() {
    const workspace = document.querySelector(".app-shell__workspace");
    if (!workspace) return;
    workspace.removeAttribute("aria-hidden");
    workspace.classList.add("has-content");
    const view = document.createElement("div");
    view.className = "ask-ai-workspace";
    view.innerHTML = `
      <header class="ask-ai-workspace__hero">
        <span class="ask-ai-workspace__hero-icon" aria-hidden="true">${ICONS.askAI}</span>
        <span class="ask-ai-workspace__hero-copy">
          <span class="ask-ai-workspace__kicker">Dedicated AI Workspace</span>
          <h1>Ask AI Console</h1>
          <p>Ask SUGO policy, troubleshooting, account, payment, agency, host, game, or escalation questions. This workspace creates an agent answer only.</p>
        </span>
      </header>
    `;
    const grid = document.createElement("div");
    grid.className = "ask-ai-workspace__grid";
    grid.append(createAskAIPrimaryCard(), createAskAIOptionsCard());
    view.append(grid);
    workspace.replaceChildren(view);
    setBreadcrumb(["SUGO SOP", "Ask AI"]);
    renderAskAIOutputPanel();
  }

  function clearAskAIWorkspace({ focus = false } = {}) {
    resetAskAIRequestState({ abort: true });
    askAIWorkspaceState.query = "";
    askAIWorkspaceState.answer = "";
    askAIWorkspaceState.currentQuestion = "";
    askAIWorkspaceState.lastExchange = null;
    const input = document.getElementById("sugoAskAIInput");
    if (input) input.value = "";
    renderAskAIOutputPanel();
    if (focus) input?.focus();
    document.dispatchEvent(new CustomEvent("sugo:askAIclear"));
    return getAskAISnapshot();
  }

  function getAskAISnapshot() {
    return {
      query: askAIWorkspaceState.query,
      response: askAIWorkspaceState.response,
      sop: askAIWorkspaceState.sop,
      focus: askAIWorkspaceState.focus,
      answer: askAIWorkspaceState.answer,
      currentQuestion: askAIWorkspaceState.currentQuestion,
      lastExchange: askAIWorkspaceState.lastExchange ? { ...askAIWorkspaceState.lastExchange } : null,
      requestState: {
        status: askAIRequestState.status,
        message: askAIRequestState.message,
        responseBranch: askAIRequestState.responseBranch,
        kbConfidence: askAIRequestState.kbConfidence,
        kbConfidenceScore: askAIRequestState.kbConfidenceScore,
        kbPrimaryRoute: askAIRequestState.kbPrimaryRoute
      }
    };
  }

  function stopAskAIAnswer() {
    if (askAIRequestState.status !== "loading") return false;
    askAIRequestState.requestId += 1;
    window.SUGO?.WorkerAPI?.abort?.();
    askAIRequestState.status = "stopped";
    askAIRequestState.message = "AI response stopped. You can edit the question or press Try again.";
    renderAskAIOutputPanel();
    return true;
  }

  async function copyAskAIAnswer() {
    const text = askAIWorkspaceState.answer.trim();
    if (!text) return false;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.append(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      askAIRequestState.copyStatus = "Copied";
      renderAskAIOutputPanel();
      window.setTimeout(() => {
        askAIRequestState.copyStatus = "";
        renderAskAIOutputPanel();
      }, 1200);
      return true;
    } catch (_error) {
      askAIRequestState.copyStatus = "Copy failed";
      renderAskAIOutputPanel();
      return false;
    }
  }

  async function requestAskAIAnswer(source = "workspace", options = {}) {
    const input = document.getElementById("sugoAskAIInput");
    const query = String(options.query ?? askAIWorkspaceState.query).trim();
    if (!query) {
      input?.classList.add("is-invalid");
      input?.focus();
      window.setTimeout(() => input?.classList.remove("is-invalid"), 520);
      return { ok: false, code: "EMPTY_ASK_REQUEST" };
    }
    if (askAIRequestState.status === "loading") return { ok: false, code: "REQUEST_IN_PROGRESS" };
    const workerAPI = window.SUGO?.WorkerAPI;
    if (!workerAPI?.generateAnswer) {
      askAIRequestState.status = "error";
      askAIRequestState.message = "The AI service is not available.";
      renderAskAIOutputPanel();
      return { ok: false, code: "WORKER_API_UNAVAILABLE" };
    }

    const isFollowup = Boolean(options.isFollowup);
    const priorMessages = Array.isArray(options.priorMessages)
      ? options.priorMessages.map((message) => ({ ...message }))
      : isFollowup && askAIWorkspaceState.lastExchange
        ? [
            { role: "user", content: askAIWorkspaceState.lastExchange.question },
            { role: "assistant", content: askAIWorkspaceState.lastExchange.answer }
          ]
        : [];
    const lastRequest = {
      query,
      kbQuery: query,
      priorMessages,
      isFollowup,
      responseMode: askAIWorkspaceState.response,
      sopMode: askAIWorkspaceState.sop,
      focus: askAIWorkspaceState.focus
    };
    const requestId = askAIRequestState.requestId + 1;
    askAIRequestState.requestId = requestId;
    askAIRequestState.status = "loading";
    askAIRequestState.message = "Searching the knowledge base…";
    askAIRequestState.responseBranch = "";
    askAIRequestState.kbConfidence = "";
    askAIRequestState.kbConfidenceScore = 0;
    askAIRequestState.kbPrimaryRoute = "";
    askAIRequestState.topics = [];
    askAIRequestState.lastRequest = lastRequest;
    askAIWorkspaceState.currentQuestion = query;
    askAIWorkspaceState.answer = "";
    renderAskAIWorkspace();

    document.dispatchEvent(new CustomEvent("sugo:askaigeneraterequest", {
      detail: { source, query, isFollowup, response: askAIWorkspaceState.response, sop: askAIWorkspaceState.sop, focus: askAIWorkspaceState.focus }
    }));

    try {
      const result = await workerAPI.generateAnswer({
        query,
        kbQuery: query,
        priorMessages,
        responseMode: askAIWorkspaceState.response,
        sopMode: askAIWorkspaceState.sop,
        askToolInstruction: getAskAIFocus().instruction
      }, {
        onProgress(progress) {
          if (requestId !== askAIRequestState.requestId) return;
          const liveText = String(progress?.text || "").trim();
          if (liveText) {
            askAIWorkspaceState.answer = liveText;
            renderAskAIOutputPanel();
          }
        }
      });
      if (requestId !== askAIRequestState.requestId) return { ok: false, code: "STALE_REQUEST" };
      askAIRequestState.status = "success";
      askAIRequestState.message = "";
      askAIRequestState.responseBranch = result.responseBranch || "";
      askAIRequestState.kbConfidence = result.kb?.confidence || "low";
      askAIRequestState.kbConfidenceScore = Number(result.kb?.confidenceScore || 0);
      askAIRequestState.kbPrimaryRoute = result.kb?.primaryRoute?.name || "";
      askAIRequestState.topics = Array.isArray(result.kb?.topics) ? result.kb.topics.slice(0, 12) : [];
      askAIWorkspaceState.answer = result.answer;
      askAIWorkspaceState.lastExchange = { question: query, answer: result.answer };
      renderAskAIWorkspace();
      document.dispatchEvent(new CustomEvent("sugo:askaianswer", {
        detail: { source, query, answer: result.answer, responseBranch: result.responseBranch, kbConfidence: askAIRequestState.kbConfidence }
      }));
      return { ok: true, ...result };
    } catch (error) {
      if (requestId !== askAIRequestState.requestId) return { ok: false, code: "STALE_REQUEST" };
      askAIRequestState.status = error?.name === "AbortError" ? "stopped" : "error";
      askAIRequestState.message = String(error?.message || "AI could not generate the answer.");
      askAIRequestState.responseBranch = "";
      renderAskAIWorkspace();
      document.dispatchEvent(new CustomEvent("sugo:askaigenerationerror", {
        detail: { source, code: error?.code || "WORKER_REQUEST_FAILED", message: askAIRequestState.message }
      }));
      return { ok: false, code: error?.code || "WORKER_REQUEST_FAILED", error };
    }
  }

  function retryAskAIAnswer() {
    const request = askAIRequestState.lastRequest;
    if (!request) return Promise.resolve({ ok: false, code: "NO_PREVIOUS_REQUEST" });
    return requestAskAIAnswer("retry", {
      query: request.query,
      isFollowup: request.isFollowup,
      priorMessages: request.priorMessages
    });
  }

  function applyAskAIAnswer(result = {}, { source = "api" } = {}) {
    const payload = typeof result === "string" ? { answer: result } : (result || {});
    if (Object.prototype.hasOwnProperty.call(payload, "query")) {
      askAIWorkspaceState.query = String(payload.query || "");
      askAIWorkspaceState.currentQuestion = askAIWorkspaceState.query;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "response")) askAIWorkspaceState.response = getAskAIResponse(payload.response).value;
    if (Object.prototype.hasOwnProperty.call(payload, "sop")) askAIWorkspaceState.sop = getAskAIKnowledgeMode(payload.sop).value;
    if (Object.prototype.hasOwnProperty.call(payload, "focus")) askAIWorkspaceState.focus = getAskAIFocus(payload.focus).value;
    askAIWorkspaceState.answer = String(payload.answer ?? payload.output ?? payload.text ?? "").trim();
    if (askAIWorkspaceState.answer && askAIWorkspaceState.currentQuestion) {
      askAIWorkspaceState.lastExchange = { question: askAIWorkspaceState.currentQuestion, answer: askAIWorkspaceState.answer };
    }
    askAIRequestState.status = askAIWorkspaceState.answer ? "success" : "idle";
    askAIRequestState.message = "";
    askAIRequestState.responseBranch = String(payload.responseBranch || "json");
    askAIRequestState.kbConfidence = String(payload.kbConfidence || "high");
    askAIRequestState.kbConfidenceScore = Number(payload.kbConfidenceScore || 0);
    askAIRequestState.kbPrimaryRoute = String(payload.kbPrimaryRoute || "");
    askAIRequestState.topics = Array.isArray(payload.topics) ? payload.topics.map((topic) => ({ ...topic })) : [];
    if (document.querySelector(".app-shell")?.dataset.activeWorkspace === WORKSPACES.ASK_AI) renderAskAIWorkspace();
    document.dispatchEvent(new CustomEvent("sugo:askaianswer", { detail: { source, ...getAskAISnapshot() } }));
    return getAskAISnapshot();
  }


  function getVisionOption(list, value) {
    return list.find((item) => item.value === value) || list[0];
  }

  function getVisionAnalysis(value = visionWorkspaceState.analysis) {
    return getVisionOption(VISION_ANALYSIS_TYPES, value);
  }

  function getVisionImageMetadata() {
    if (!visionAttachedImage) return null;
    return {
      mimeType: visionAttachedImage.mimeType,
      name: visionAttachedImage.name,
      size: visionAttachedImage.size,
      width: visionAttachedImage.width,
      height: visionAttachedImage.height,
      originalType: visionAttachedImage.originalType,
      originalSize: visionAttachedImage.originalSize,
      originalWidth: visionAttachedImage.originalWidth,
      originalHeight: visionAttachedImage.originalHeight
    };
  }

  function buildVisionImagePayload() {
    if (!visionAttachedImage) return undefined;
    return [{
      mimeType: visionAttachedImage.mimeType,
      data: visionAttachedImage.data,
      name: visionAttachedImage.name,
      width: visionAttachedImage.width,
      height: visionAttachedImage.height
    }];
  }

  function emitVisionStateChange(source = "input") {
    document.dispatchEvent(new CustomEvent("sugo:visionstatechange", {
      detail: {
        source,
        output: visionWorkspaceState.output,
        response: visionWorkspaceState.response,
        sop: visionWorkspaceState.sop,
        analysis: visionWorkspaceState.analysis,
        userId: visionWorkspaceState.userId,
        contextId: visionWorkspaceState.contextId,
        note: visionWorkspaceState.note,
        hasImage: Boolean(visionAttachedImage),
        image: getVisionImageMetadata()
      }
    }));
    renderVisionOutputPanel();
  }

  function resetVisionRequestState({ abort = false } = {}) {
    visionRequestState.requestId += 1;
    if (abort) window.SUGO?.WorkerAPI?.abort?.();
    visionRequestState.status = "idle";
    visionRequestState.message = "";
    visionRequestState.responseBranch = "";
    visionRequestState.kbConfidence = "";
    visionRequestState.kbConfidenceScore = 0;
    visionRequestState.kbPrimaryRoute = "";
    visionRequestState.topics = [];
    visionRequestState.lastRequest = null;
    visionRequestState.copyStatus = "";
  }

  function updateVisionOptionSelection(group, value, { emit = true } = {}) {
    const optionLists = {
      output: VISION_OUTPUT_TYPES,
      response: VISION_RESPONSE_MODES,
      sop: VISION_KNOWLEDGE_MODES,
      analysis: VISION_ANALYSIS_TYPES
    };
    const list = optionLists[group];
    if (!list) return false;
    visionWorkspaceState[group] = getVisionOption(list, value).value;
    document.querySelectorAll(`[data-vision-option="${group}"]`).forEach((button) => {
      const selected = button.dataset.value === visionWorkspaceState[group];
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    const note = document.getElementById("sugoVisionOptionPreview");
    if (note) {
      note.innerHTML = `<strong>Output:</strong> ${getVisionOption(VISION_OUTPUT_TYPES, visionWorkspaceState.output).label} · ${getVisionAnalysis().shortLabel} · ${getVisionOption(VISION_KNOWLEDGE_MODES, visionWorkspaceState.sop).label}.`;
    }
    if (emit) emitVisionStateChange(`option:${group}`);
    return true;
  }

  function bindVisionOptionKeyboard(groupElement) {
    groupElement.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      const buttons = [...groupElement.querySelectorAll("button:not(:disabled)")];
      if (!buttons.length) return;
      const currentIndex = Math.max(0, buttons.indexOf(document.activeElement));
      let nextIndex = currentIndex;
      if (["ArrowRight", "ArrowDown"].includes(event.key)) nextIndex = (currentIndex + 1) % buttons.length;
      if (["ArrowLeft", "ArrowUp"].includes(event.key)) nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = buttons.length - 1;
      event.preventDefault();
      buttons[nextIndex].focus();
      buttons[nextIndex].click();
    });
  }

  function setVisionImageStatus(message, isError = false) {
    const status = document.getElementById("sugoVisionWorkspaceStatus");
    if (!status) return;
    status.textContent = String(message || "");
    status.classList.toggle("is-active", Boolean(message));
    status.classList.toggle("is-error", Boolean(message) && isError);
  }

  function renderVisionImagePreview() {
    const preview = document.getElementById("sugoVisionWorkspacePreview");
    if (!preview) return;
    if (!visionAttachedImage) {
      preview.classList.remove("has-image");
      preview.replaceChildren();
      return;
    }
    const image = document.createElement("img");
    image.className = "vision-image-preview__thumb";
    image.src = visionAttachedImage.previewDataUrl;
    image.alt = "Uploaded image preview";
    const metadata = document.createElement("div");
    metadata.className = "vision-image-preview__meta";
    const name = document.createElement("strong");
    name.className = "vision-image-preview__name";
    name.textContent = visionAttachedImage.name;
    const details = document.createElement("span");
    details.className = "vision-image-preview__details";
    details.textContent = `${visionAttachedImage.width}×${visionAttachedImage.height} · ${formatTicketImageBytes(visionAttachedImage.size)} compressed`;
    metadata.append(name, details);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "vision-image-preview__remove";
    remove.title = "Remove image";
    remove.setAttribute("aria-label", "Remove image");
    remove.innerHTML = ICONS.trash;
    remove.addEventListener("click", () => {
      visionAttachedImage = null;
      renderVisionImagePreview();
      setVisionImageStatus("");
      resetVisionRequestState({ abort: true });
      visionWorkspaceState.answer = "";
      visionWorkspaceState.currentQuery = "";
      emitVisionStateChange("remove");
      document.getElementById("sugoVisionDropzone")?.focus();
    });
    preview.classList.add("has-image");
    preview.replaceChildren(image, metadata, remove);
  }

  async function handleVisionImageFile(file, source = "input") {
    if (!file) return false;
    setVisionImageStatus("Preparing image for AI analysis…");
    try {
      visionAttachedImage = await prepareTicketImageForAI(file);
      resetVisionRequestState({ abort: true });
      visionWorkspaceState.answer = "";
      visionWorkspaceState.currentQuery = "";
      renderVisionImagePreview();
      setVisionImageStatus("Image is ready. Add notes if needed, then click Analyze Image.");
      emitVisionStateChange(source);
      return true;
    } catch (error) {
      visionAttachedImage = null;
      renderVisionImagePreview();
      setVisionImageStatus(error?.message || String(error), true);
      emitVisionStateChange("error");
      return false;
    }
  }

  function createVisionPrimaryCard() {
    const card = document.createElement("section");
    card.className = "vision-card vision-card--primary";

    const label = document.createElement("h2");
    label.className = "vision-card__label";
    label.textContent = "Image / Screenshot evidence";

    const input = document.createElement("input");
    input.id = "sugoVisionWorkspaceInput";
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    input.hidden = true;

    const dropzone = document.createElement("button");
    dropzone.id = "sugoVisionDropzone";
    dropzone.type = "button";
    dropzone.className = "vision-dropzone";
    dropzone.setAttribute("aria-describedby", "sugoVisionDropHelp sugoVisionWorkspaceStatus");
    dropzone.innerHTML = `
      <span class="vision-dropzone__icon" aria-hidden="true">${ICONS.image}</span>
      <span class="vision-dropzone__copy">
        <strong>Click to upload image</strong>
        <span id="sugoVisionDropHelp">Supports JPG, PNG, and WebP. The image is compressed locally before being sent to the AI Worker.</span>
      </span>
    `;
    dropzone.addEventListener("click", () => input.click());
    input.addEventListener("change", async () => {
      const [file] = input.files || [];
      await handleVisionImageFile(file, "input");
      input.value = "";
    });
    ["dragenter", "dragover"].forEach((eventName) => dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      dropzone.classList.add("is-dragging");
    }));
    ["dragleave", "drop"].forEach((eventName) => dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      dropzone.classList.remove("is-dragging");
      if (eventName === "drop") {
        const [file] = event.dataTransfer?.files || [];
        if (file) void handleVisionImageFile(file, "drop");
      }
    }));

    const status = document.createElement("div");
    status.id = "sugoVisionWorkspaceStatus";
    status.className = "vision-image-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    const preview = document.createElement("div");
    preview.id = "sugoVisionWorkspacePreview";
    preview.className = "vision-image-preview";
    preview.setAttribute("aria-live", "polite");

    const detailGrid = document.createElement("div");
    detailGrid.className = "vision-detail-grid";
    detailGrid.setAttribute("aria-label", "Image case details");
    const fields = [
      { key: "userId", id: "sugoVisionUserId", label: "User ID / UID", type: "input", placeholder: "Optional" },
      { key: "contextId", id: "sugoVisionContextId", label: "Order / Room / Agency ID", type: "input", placeholder: "Optional" },
      { key: "note", id: "sugoVisionCaseNote", label: "Case note / what should AI check?", type: "textarea", placeholder: "Optional: describe what happened, what the screenshot should prove, user complaint, amount, country, device, or previous action..." }
    ];
    fields.forEach((field) => {
      const wrapper = document.createElement("label");
      wrapper.className = `vision-field${field.type === "textarea" ? " is-wide" : ""}`;
      const caption = document.createElement("span");
      caption.textContent = field.label;
      const control = document.createElement(field.type === "textarea" ? "textarea" : "input");
      control.id = field.id;
      control.placeholder = field.placeholder;
      control.value = visionWorkspaceState[field.key];
      if (field.type === "textarea") control.rows = 4;
      control.addEventListener("input", () => {
        visionWorkspaceState[field.key] = control.value;
        emitVisionStateChange(`field:${field.key}`);
      });
      if (field.type === "textarea") {
        control.addEventListener("keydown", (event) => {
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            void requestVisionAnalysis("keyboard");
          }
        });
      }
      wrapper.append(caption, control);
      detailGrid.append(wrapper);
    });

    const chips = document.createElement("div");
    chips.className = "vision-card__chips";
    chips.setAttribute("aria-label", "Upload Image quick prompts");
    VISION_QUICK_PROMPTS.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "vision-chip";
      button.textContent = item.label;
      button.addEventListener("click", () => {
        const textarea = document.getElementById("sugoVisionCaseNote");
        const current = visionWorkspaceState.note.trim();
        visionWorkspaceState.note = current ? `${current}\n${item.prompt}` : item.prompt;
        if (textarea) {
          textarea.value = visionWorkspaceState.note;
          textarea.focus();
        }
        emitVisionStateChange("quick-prompt");
      });
      chips.append(button);
    });

    const actions = document.createElement("div");
    actions.className = "vision-card__actions";
    const analyze = document.createElement("button");
    analyze.id = "sugoVisionSubmit";
    analyze.type = "button";
    analyze.className = "vision-card__submit";
    analyze.disabled = visionRequestState.status === "loading";
    analyze.textContent = visionRequestState.status === "loading" ? "Analyzing…" : "Analyze Image";
    analyze.addEventListener("click", () => void requestVisionAnalysis("workspace"));
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "vision-card__clear";
    clear.disabled = visionRequestState.status === "loading";
    clear.textContent = "Clear";
    clear.addEventListener("click", () => clearVisionWorkspace({ focus: true }));
    actions.append(analyze, clear);

    card.append(label, input, dropzone, status, preview, detailGrid, chips, actions);
    window.setTimeout(renderVisionImagePreview, 0);
    return card;
  }

  function createVisionOptionsCard() {
    const card = document.createElement("aside");
    card.className = "vision-card vision-options";
    card.setAttribute("aria-label", "Upload Image options");
    const title = document.createElement("h2");
    title.className = "vision-options__title";
    title.textContent = "Upload Image Options";
    card.append(title);

    const createGroup = (labelText, groupName, options, { stacked = false } = {}) => {
      const group = document.createElement("section");
      group.className = "vision-options__group";
      const label = document.createElement("h3");
      label.textContent = labelText;
      const controls = document.createElement("div");
      controls.className = stacked ? "vision-options__stack" : `vision-options__segments${options.length === 3 ? " is-three" : ""}`;
      controls.setAttribute("role", "group");
      controls.setAttribute("aria-label", labelText);
      options.forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = stacked ? "vision-focus" : "vision-segment";
        button.dataset.visionOption = groupName;
        button.dataset.value = item.value;
        button.textContent = item.label;
        const selected = visionWorkspaceState[groupName] === item.value;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
        button.addEventListener("click", () => updateVisionOptionSelection(groupName, item.value));
        controls.append(button);
      });
      bindVisionOptionKeyboard(controls);
      group.append(label, controls);
      return group;
    };

    card.append(
      createGroup("AI output", "output", VISION_OUTPUT_TYPES),
      createGroup("Detail level", "response", VISION_RESPONSE_MODES),
      createGroup("Knowledge mode", "sop", VISION_KNOWLEDGE_MODES),
      createGroup("Image analysis type", "analysis", VISION_ANALYSIS_TYPES, { stacked: true })
    );
    const note = document.createElement("p");
    note.id = "sugoVisionOptionPreview";
    note.className = "vision-options__note";
    note.innerHTML = `<strong>Output:</strong> ${getVisionOption(VISION_OUTPUT_TYPES, visionWorkspaceState.output).label} · ${getVisionAnalysis().shortLabel} · ${getVisionOption(VISION_KNOWLEDGE_MODES, visionWorkspaceState.sop).label}.`;
    card.append(note);
    return card;
  }

  function buildVisionInstruction() {
    return [
      "This request came from the dedicated Upload Image workspace, not the normal Ask AI or Create Ticket workspace.",
      "The image is the primary evidence. Read visible content carefully, but never invent unreadable text, hidden details, IDs, amounts, dates, or policy decisions.",
      getVisionAnalysis().instruction,
      visionWorkspaceState.output === "ticket"
        ? "Final output must be a customer-ready Vision Ticket. Use the image as evidence internally, but do not mention internal analysis, confidence labels, or source chips."
        : "Final output must be agent-facing Vision Answer. Include visible findings, likely SOP match, correct action, missing information, and escalation path when needed.",
      "For sensitive cases such as ban, abuse, recharge, withdrawal, VIP, agency, host, identity, or account ownership, be conservative and request verification/escalation if the SOP or image is not conclusive."
    ].join(" ");
  }

  function buildVisionQuery() {
    const parts = [
      "Upload Image workspace request.",
      `Selected image analysis type: ${visionWorkspaceState.analysis}.`,
      `Selected output: ${visionWorkspaceState.output}.`
    ];
    const userId = visionWorkspaceState.userId.trim();
    const contextId = visionWorkspaceState.contextId.trim();
    const note = visionWorkspaceState.note.trim();
    if (userId) parts.push(`User ID / UID: ${userId}`);
    if (contextId) parts.push(`Order / Room / Agency ID: ${contextId}`);
    if (note) parts.push(`Case note / requested check:\n${note}`);
    if (!note) {
      parts.push(visionWorkspaceState.output === "ticket"
        ? "Create a safe customer-ready reply based on the attached image and the strongest SUGO SOP match."
        : "Analyze the attached image and explain the visible issue, likely SOP match, correct agent action, missing information, and escalation path if needed.");
    }
    return parts.join("\n\n");
  }

  function getVisionSnapshot() {
    return {
      output: visionWorkspaceState.output,
      response: visionWorkspaceState.response,
      sop: visionWorkspaceState.sop,
      analysis: visionWorkspaceState.analysis,
      userId: visionWorkspaceState.userId,
      contextId: visionWorkspaceState.contextId,
      note: visionWorkspaceState.note,
      answer: visionWorkspaceState.answer,
      currentQuery: visionWorkspaceState.currentQuery,
      image: getVisionImageMetadata(),
      requestState: {
        status: visionRequestState.status,
        message: visionRequestState.message,
        responseBranch: visionRequestState.responseBranch,
        kbConfidence: visionRequestState.kbConfidence,
        kbConfidenceScore: visionRequestState.kbConfidenceScore,
        kbPrimaryRoute: visionRequestState.kbPrimaryRoute
      }
    };
  }

  function createVisionStatus() {
    if (!["loading", "error", "stopped"].includes(visionRequestState.status)) return null;
    const status = document.createElement("div");
    status.className = `vision-output__status is-${visionRequestState.status}`;
    status.setAttribute("role", visionRequestState.status === "error" ? "alert" : "status");
    status.setAttribute("aria-live", "polite");
    if (visionRequestState.status === "loading") {
      const spinner = document.createElement("span");
      spinner.className = "vision-output__spinner";
      spinner.setAttribute("aria-hidden", "true");
      const text = document.createElement("span");
      text.textContent = visionRequestState.message || "Sending image to AI analysis…";
      status.append(spinner, text);
    } else {
      const text = document.createElement("p");
      text.textContent = visionRequestState.message;
      status.append(text);
      if (visionRequestState.lastRequest) {
        const retry = document.createElement("button");
        retry.type = "button";
        retry.className = "vision-output__retry";
        retry.textContent = "Try again";
        retry.addEventListener("click", () => void retryVisionAnalysis());
        status.append(retry);
      }
    }
    return status;
  }

  function renderVisionSources(container) {
    if (!visionWorkspaceState.answer || visionRequestState.status === "loading") return;
    const meta = document.createElement("section");
    meta.className = "vision-output__sources";
    const cards = document.createElement("div");
    cards.className = "vision-output__meta";
    const values = [
      ["Confidence", visionRequestState.kbConfidence ? `${visionRequestState.kbConfidence[0].toUpperCase()}${visionRequestState.kbConfidence.slice(1)} · ${visionRequestState.kbConfidenceScore.toFixed(1)}` : "Not available"],
      ["Best match", visionRequestState.kbPrimaryRoute || "No single route"],
      ["Mode", `${getVisionOption(VISION_OUTPUT_TYPES, visionWorkspaceState.output).label} · ${getVisionOption(VISION_RESPONSE_MODES, visionWorkspaceState.response).label}`]
    ];
    values.forEach(([label, value]) => {
      const item = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = label;
      const span = document.createElement("span");
      span.textContent = value;
      item.append(strong, span);
      cards.append(item);
    });
    meta.append(cards);
    if (visionRequestState.topics.length) {
      const title = document.createElement("h3");
      title.textContent = "Sources";
      const chips = document.createElement("div");
      chips.className = "vision-output__source-chips";
      visionRequestState.topics.slice(0, 6).forEach((topic) => {
        const chip = document.createElement("span");
        chip.className = `vision-source-chip is-${topic.confidence || "low"}`;
        chip.textContent = topic.title || topic.paneId || "SUGO SOP";
        chips.append(chip);
      });
      meta.append(title, chips);
    }
    container.append(meta);
  }

  function renderVisionOutputPanel() {
    const preview = document.querySelector(".app-shell__preview");
    if (!preview) return;
    const activeWorkspace = document.querySelector(".app-shell")?.dataset.activeWorkspace;
    if (activeWorkspace !== WORKSPACES.UPLOAD_IMAGE) return;
    const panel = document.createElement("section");
    panel.className = "vision-output";
    const scroller = document.createElement("div");
    scroller.className = "vision-output__scroll";
    const header = document.createElement("header");
    header.className = "vision-output__header";
    header.innerHTML = `
      <span class="vision-output__header-icon" aria-hidden="true">${ICONS.image}</span>
      <span class="vision-output__header-copy">
        <h2>${visionWorkspaceState.output === "ticket" ? "Vision Ticket" : "Vision Answer"}</h2>
        <p>${visionWorkspaceState.output === "ticket" ? "Customer-ready output based on the image and SUGO SOP." : "Agent guidance based on the visible image evidence and SUGO SOP."}</p>
      </span>
      <span class="vision-output__badge">Image analysis</span>
    `;
    scroller.append(header);
    const status = createVisionStatus();
    if (status) scroller.append(status);
    if (visionAttachedImage) {
      const evidence = document.createElement("section");
      evidence.className = "vision-output__evidence";
      const image = document.createElement("img");
      image.src = visionAttachedImage.previewDataUrl;
      image.alt = "Image evidence preview";
      const copy = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = visionAttachedImage.name;
      const span = document.createElement("span");
      span.textContent = `${visionAttachedImage.width}×${visionAttachedImage.height} · ${formatTicketImageBytes(visionAttachedImage.size)}`;
      copy.append(strong, span);
      evidence.append(image, copy);
      scroller.append(evidence);
    }
    if (visionWorkspaceState.currentQuery) {
      const query = document.createElement("section");
      query.className = "vision-output__query";
      const label = document.createElement("strong");
      label.textContent = "Case note / requested check";
      const value = document.createElement("p");
      value.textContent = visionWorkspaceState.note.trim() || "Analyze the attached image using the selected analysis type.";
      query.append(label, value);
      scroller.append(query);
    }
    if (visionWorkspaceState.answer) {
      const answer = document.createElement("section");
      answer.className = "vision-output__answer";
      answer.innerHTML = window.SUGO?.WorkerAPI?.renderMarkdown
        ? window.SUGO.WorkerAPI.renderMarkdown(visionWorkspaceState.answer)
        : visionWorkspaceState.answer.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
      scroller.append(answer);
      renderVisionSources(scroller);
    } else if (visionRequestState.status === "idle") {
      const empty = document.createElement("div");
      empty.className = "vision-output__empty";
      empty.innerHTML = `<span aria-hidden="true">${ICONS.image}</span><p>Upload a screenshot or evidence image, choose the analysis type, then click Analyze Image.</p>`;
      scroller.append(empty);
    }
    const actions = document.createElement("div");
    actions.className = "vision-output__actions";
    if (visionRequestState.status === "loading") {
      const stop = document.createElement("button");
      stop.type = "button";
      stop.className = "vision-output__stop";
      stop.innerHTML = `${ICONS.stop}<span>Stop</span>`;
      stop.addEventListener("click", stopVisionAnalysis);
      actions.append(stop);
    } else if (visionWorkspaceState.answer) {
      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "vision-output__copy";
      copy.innerHTML = `${ICONS.copy}<span>${visionRequestState.copyStatus || "Copy"}</span>`;
      copy.addEventListener("click", () => void copyVisionAnswer());
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "vision-output__retry-action";
      retry.textContent = "Try again";
      retry.addEventListener("click", () => void retryVisionAnalysis());
      actions.append(copy, retry);
    }
    panel.append(scroller);
    if (actions.childElementCount) panel.append(actions);
    preview.classList.add("has-content");
    preview.replaceChildren(panel);
  }

  function renderVisionWorkspace() {
    const workspace = document.querySelector(".app-shell__workspace");
    if (!workspace) return;
    workspace.removeAttribute("aria-hidden");
    workspace.classList.add("has-content");
    const view = document.createElement("div");
    view.className = "vision-workspace";
    view.innerHTML = `
      <header class="vision-workspace__hero">
        <span class="vision-workspace__hero-icon" aria-hidden="true">${ICONS.image}</span>
        <span class="vision-workspace__hero-copy">
          <span class="vision-workspace__kicker">Dedicated Vision Workspace</span>
          <h1>Upload Image Console</h1>
          <p>Upload a screenshot or evidence image, then let AI read it, match it with SUGO SOP, and return either agent guidance or a ready ticket.</p>
        </span>
      </header>
    `;
    const grid = document.createElement("div");
    grid.className = "vision-workspace__grid";
    grid.append(createVisionPrimaryCard(), createVisionOptionsCard());
    view.append(grid);
    workspace.replaceChildren(view);
    setBreadcrumb(["SUGO SOP", "Upload Image"]);
    renderVisionImagePreview();
    renderVisionOutputPanel();
  }

  function clearVisionWorkspace({ focus = false } = {}) {
    resetVisionRequestState({ abort: true });
    visionWorkspaceState.userId = "";
    visionWorkspaceState.contextId = "";
    visionWorkspaceState.note = "";
    visionWorkspaceState.answer = "";
    visionWorkspaceState.currentQuery = "";
    visionAttachedImage = null;
    ["sugoVisionUserId", "sugoVisionContextId", "sugoVisionCaseNote"].forEach((id) => {
      const control = document.getElementById(id);
      if (control) control.value = "";
    });
    renderVisionImagePreview();
    setVisionImageStatus("");
    renderVisionOutputPanel();
    if (focus) document.getElementById("sugoVisionDropzone")?.focus();
    document.dispatchEvent(new CustomEvent("sugo:visionclear"));
    return getVisionSnapshot();
  }

  function stopVisionAnalysis() {
    if (visionRequestState.status !== "loading") return false;
    visionRequestState.requestId += 1;
    window.SUGO?.WorkerAPI?.abort?.();
    visionRequestState.status = "stopped";
    visionRequestState.message = "Image analysis stopped. You can adjust the options or press Try again.";
    renderVisionOutputPanel();
    return true;
  }

  async function copyVisionAnswer() {
    const text = visionWorkspaceState.answer.trim();
    if (!text) return false;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.append(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      visionRequestState.copyStatus = "Copied";
      renderVisionOutputPanel();
      window.setTimeout(() => {
        visionRequestState.copyStatus = "";
        renderVisionOutputPanel();
      }, 1200);
      return true;
    } catch (_error) {
      visionRequestState.copyStatus = "Copy failed";
      renderVisionOutputPanel();
      return false;
    }
  }

  async function requestVisionAnalysis(source = "workspace", options = {}) {
    const dropzone = document.getElementById("sugoVisionDropzone");
    if (!visionAttachedImage) {
      dropzone?.classList.add("is-invalid");
      setVisionImageStatus("Please upload an image first.", true);
      dropzone?.focus();
      window.setTimeout(() => dropzone?.classList.remove("is-invalid"), 520);
      return { ok: false, code: "IMAGE_REQUIRED" };
    }
    if (visionRequestState.status === "loading") return { ok: false, code: "REQUEST_IN_PROGRESS" };
    const workerAPI = window.SUGO?.WorkerAPI;
    const method = visionWorkspaceState.output === "ticket" ? workerAPI?.generateTicket : workerAPI?.generateAnswer;
    if (typeof method !== "function") {
      visionRequestState.status = "error";
      visionRequestState.message = "The AI service is not available.";
      renderVisionOutputPanel();
      return { ok: false, code: "WORKER_API_UNAVAILABLE" };
    }

    const query = String(options.query || buildVisionQuery()).trim();
    const kbQuery = String(options.kbQuery || visionWorkspaceState.note.trim() || getVisionAnalysis().kbQuery).trim();
    const lastRequest = {
      query,
      kbQuery,
      output: visionWorkspaceState.output,
      response: visionWorkspaceState.response,
      sop: visionWorkspaceState.sop,
      analysis: visionWorkspaceState.analysis,
      userId: visionWorkspaceState.userId,
      contextId: visionWorkspaceState.contextId,
      note: visionWorkspaceState.note
    };
    const requestId = visionRequestState.requestId + 1;
    visionRequestState.requestId = requestId;
    visionRequestState.status = "loading";
    visionRequestState.message = "Sending image to AI analysis…";
    visionRequestState.responseBranch = "";
    visionRequestState.kbConfidence = "";
    visionRequestState.kbConfidenceScore = 0;
    visionRequestState.kbPrimaryRoute = "";
    visionRequestState.topics = [];
    visionRequestState.lastRequest = lastRequest;
    visionWorkspaceState.currentQuery = query;
    visionWorkspaceState.answer = "";
    renderVisionWorkspace();
    document.dispatchEvent(new CustomEvent("sugo:visionanalysisrequest", {
      detail: { source, output: visionWorkspaceState.output, response: visionWorkspaceState.response, sop: visionWorkspaceState.sop, analysis: visionWorkspaceState.analysis }
    }));

    try {
      const result = await method.call(workerAPI, {
        query,
        kbQuery,
        images: buildVisionImagePayload(),
        imageMeta: getVisionImageMetadata(),
        responseMode: visionWorkspaceState.response,
        sopMode: visionWorkspaceState.sop,
        askToolInstruction: buildVisionInstruction()
      }, {
        onProgress(progress) {
          if (requestId !== visionRequestState.requestId) return;
          const liveText = String(progress?.text || "").trim();
          if (liveText) {
            visionWorkspaceState.answer = liveText;
            renderVisionOutputPanel();
          }
        }
      });
      if (requestId !== visionRequestState.requestId) return { ok: false, code: "STALE_REQUEST" };
      visionRequestState.status = "success";
      visionRequestState.message = "";
      visionRequestState.responseBranch = result.responseBranch || "";
      visionRequestState.kbConfidence = result.kb?.confidence || "low";
      visionRequestState.kbConfidenceScore = Number(result.kb?.confidenceScore || 0);
      visionRequestState.kbPrimaryRoute = result.kb?.primaryRoute?.name || "";
      visionRequestState.topics = Array.isArray(result.kb?.topics) ? result.kb.topics.slice(0, 12) : [];
      visionWorkspaceState.answer = result.answer;
      if (visionWorkspaceState.output === "ticket") {
        window.SUGO?.TicketBuilder?.applyGeneratedTicket?.({
          output: result.answer,
          userId: visionWorkspaceState.userId,
          orderId: visionWorkspaceState.contextId,
          evidence: visionWorkspaceState.note
        }, { source: "vision-ticket" });
      }
      renderVisionWorkspace();
      document.dispatchEvent(new CustomEvent("sugo:visionanalysis", {
        detail: { source, output: visionWorkspaceState.output, answer: result.answer, responseBranch: result.responseBranch, kbConfidence: visionRequestState.kbConfidence }
      }));
      return { ok: true, ...result };
    } catch (error) {
      if (requestId !== visionRequestState.requestId) return { ok: false, code: "STALE_REQUEST" };
      visionRequestState.status = error?.name === "AbortError" ? "stopped" : "error";
      visionRequestState.message = String(error?.message || "AI could not analyze the image.");
      visionRequestState.responseBranch = "";
      renderVisionWorkspace();
      document.dispatchEvent(new CustomEvent("sugo:visionanalysiserror", {
        detail: { source, code: error?.code || "WORKER_REQUEST_FAILED", message: visionRequestState.message }
      }));
      return { ok: false, code: error?.code || "WORKER_REQUEST_FAILED", error };
    }
  }

  function retryVisionAnalysis() {
    const request = visionRequestState.lastRequest;
    if (!request) return Promise.resolve({ ok: false, code: "NO_PREVIOUS_REQUEST" });
    visionWorkspaceState.output = getVisionOption(VISION_OUTPUT_TYPES, request.output).value;
    visionWorkspaceState.response = getVisionOption(VISION_RESPONSE_MODES, request.response).value;
    visionWorkspaceState.sop = getVisionOption(VISION_KNOWLEDGE_MODES, request.sop).value;
    visionWorkspaceState.analysis = getVisionAnalysis(request.analysis).value;
    visionWorkspaceState.userId = request.userId;
    visionWorkspaceState.contextId = request.contextId;
    visionWorkspaceState.note = request.note;
    return requestVisionAnalysis("retry", { query: request.query, kbQuery: request.kbQuery });
  }

  function applyVisionResult(result = {}, { source = "api" } = {}) {
    const payload = typeof result === "string" ? { answer: result } : (result || {});
    ["userId", "contextId", "note"].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(payload, key)) visionWorkspaceState[key] = String(payload[key] ?? "");
    });
    if (Object.prototype.hasOwnProperty.call(payload, "output")) visionWorkspaceState.output = getVisionOption(VISION_OUTPUT_TYPES, payload.output).value;
    if (Object.prototype.hasOwnProperty.call(payload, "response")) visionWorkspaceState.response = getVisionOption(VISION_RESPONSE_MODES, payload.response).value;
    if (Object.prototype.hasOwnProperty.call(payload, "sop")) visionWorkspaceState.sop = getVisionOption(VISION_KNOWLEDGE_MODES, payload.sop).value;
    if (Object.prototype.hasOwnProperty.call(payload, "analysis")) visionWorkspaceState.analysis = getVisionAnalysis(payload.analysis).value;
    visionWorkspaceState.answer = String(payload.answer ?? payload.text ?? "").trim();
    visionWorkspaceState.currentQuery = String(payload.query || buildVisionQuery());
    visionRequestState.status = visionWorkspaceState.answer ? "success" : "idle";
    visionRequestState.message = "";
    visionRequestState.responseBranch = String(payload.responseBranch || "json");
    visionRequestState.kbConfidence = String(payload.kbConfidence || "high");
    visionRequestState.kbConfidenceScore = Number(payload.kbConfidenceScore || 0);
    visionRequestState.kbPrimaryRoute = String(payload.kbPrimaryRoute || "");
    visionRequestState.topics = Array.isArray(payload.topics) ? payload.topics.map((topic) => ({ ...topic })) : [];
    if (document.querySelector(".app-shell")?.dataset.activeWorkspace === WORKSPACES.UPLOAD_IMAGE) renderVisionWorkspace();
    document.dispatchEvent(new CustomEvent("sugo:visionanalysis", { detail: { source, ...getVisionSnapshot() } }));
    return getVisionSnapshot();
  }


  function getArticlePane(paneId) {
    const id = normalizePaneId(paneId);
    if (!id) return null;
    try {
      return getKnowledgeBaseContent()?.getPane?.(id) || null;
    } catch (_error) {
      return null;
    }
  }

  function articleFieldType(label, text) {
    const value = String(label || "").trim().toLowerCase();
    const body = String(text || "").trim().toLowerCase();
    const combined = `${value}\n${body}`;

    if (/reporter\s*:|violator\s+id\s*:|desc\s*:|description\s*:|vip team|sugo reporting group|escalate|internal note|care\s*\/\s*escalation/.test(combined)) {
      if (/reporter\s*:|violator\s+id\s*:|desc\s*:|description\s*:/.test(combined)) return "form";
      if (/mention|sugo reporting group|@/.test(combined)) return "mention";
      return "escalation";
    }
    if (/المبلّغ\s*:|المبلغ\s*:|آي دي المخالف\s*:|اي دي المخالف\s*:|الوصف\s*:/.test(combined)) return "form";
    if (/المنشن|منشن|يتم التصعيد|مجموعة\s+sugo|فريق\s+vip|@/.test(combined)) return "mention";
    if (/العناية|التصعيد|ملاحظة داخلية|للموظف فقط|للدعم فقط/.test(combined)) return "escalation";

    if (/answer|الإجابة|الاجابة/.test(value)) return "answer";
    if (/ticket|التذكرة|التذكره/.test(value)) return "ticket";
    if (/mention|المنشن/.test(value)) return "mention";
    if (/form|النموذج/.test(value)) return "form";
    if (/care|escalation|العناية|التصعيد/.test(value)) return "escalation";
    if (/use case|usage|internal|الاستخدام/.test(value)) return "internal";
    return "text";
  }

  function articleTypeLabel(type) {
    const labels = {
      all: "All",
      answer: "Answer",
      ticket: "Ticket",
      mention: "Mention",
      form: "Form",
      text: "Text",
      escalation: "Escalation",
      internal: "Internal Notes"
    };
    return labels[type] || String(type || "Text");
  }

  function articleLanguageLabel(language) {
    const labels = { all: "All", en: "English", ar: "Arabic" };
    return labels[language] || String(language || "English");
  }

  function articleBestDefaultType(types) {
    const values = [...new Set((types || []).filter(Boolean))];
    if (values.includes("answer")) return "answer";
    if (values.includes("ticket")) return "ticket";
    if (values.includes("form")) return "form";
    if (values.includes("text")) return "text";
    return values[0] || "all";
  }

  function articleCopyLabel(type, language = "en", isInternal = false) {
    if (isInternal) {
      if (type === "form") return "Copy Internal Form";
      if (type === "mention") return "Copy Internal Mention";
      if (type === "escalation") return "Copy Internal Note";
      return "Copy Internal Info";
    }
    const prefix = language === "ar" ? "Copy AR" : "Copy EN";
    if (type === "ticket") return `${prefix} Ticket`;
    if (type === "answer") return `${prefix} Answer`;
    return language === "ar" ? "Copy Arabic" : "Copy English";
  }

  function articleLanguageBlock(pane, language) {
    return language === "ar" ? pane?.arabic : pane?.english;
  }

  function articleFieldsForLanguage(pane, language) {
    if (!pane) return [];
    const block = articleLanguageBlock(pane, language);
    if (pane.format === "support_macro") {
      const source = block && typeof block === "object" ? block : {};
      let fields = Array.isArray(source.fields) ? source.fields : [];
      if (!fields.length) {
        fields = ["answer", "mention", "ticket"].filter((key) => source[key]).map((key) => ({
          label: language === "ar"
            ? ({ answer: "الإجابة", mention: "المنشن / التصعيد", ticket: "التذكرة" }[key] || key)
            : articleTypeLabel(key),
          text: source[key]
        }));
      }
      return fields.map((field, index) => {
        const fallbackLabel = language === "ar" ? "النص" : "Text";
        const label = String(field?.label || fallbackLabel).trim() || fallbackLabel;
        const text = String(field?.text || "").trim();
        const type = articleFieldType(label, text);
        const internal = ["form", "mention", "escalation", "internal"].includes(type);
        return {
          key: `${language}-${index}`,
          index,
          language,
          label,
          text,
          type,
          internal
        };
      }).filter((field) => field.text);
    }

    const text = String(block || "").trim();
    return text ? [{
      key: `${language}-0`,
      index: 0,
      language,
      label: language === "ar" ? "العربية" : "English",
      text,
      type: "text",
      internal: false
    }] : [];
  }

  function articleFields(pane) {
    return [
      ...articleFieldsForLanguage(pane, "en"),
      ...articleFieldsForLanguage(pane, "ar")
    ];
  }

  function articleAvailableLanguages(fields) {
    return ["en", "ar"].filter((language) => (fields || []).some((field) => field.language === language && field.text));
  }

  function isArticleHeadingBlock(block) {
    const line = String(block || "").trim();
    if (!line || line.includes("\n") || line.length > 92) return false;
    if (/^[•*\-]|^\d+[.)]\s/.test(line)) return false;
    return !/[.!?;:]$/.test(line);
  }

  function appendArticleInline(container, value) {
    const text = String(value || "");
    const labelMatch = text.match(/^([^:：]{1,46}[:：])\s+(.+)$/u);
    const source = labelMatch ? labelMatch[2] : text;

    if (labelMatch) {
      const strong = document.createElement("strong");
      strong.className = "article-inline-label";
      strong.textContent = `${labelMatch[1]} `;
      container.append(strong);
    }

    const urlPattern = /(https?:\/\/[^\s]+)/gi;
    let cursor = 0;
    for (const match of source.matchAll(urlPattern)) {
      const index = match.index || 0;
      if (index > cursor) container.append(document.createTextNode(source.slice(cursor, index)));
      const link = document.createElement("a");
      link.className = "article-inline-link";
      link.href = match[0];
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = match[0];
      container.append(link);
      cursor = index + match[0].length;
    }
    if (cursor < source.length) container.append(document.createTextNode(source.slice(cursor)));
  }

  function appendArticleTextLines(container, text) {
    const lines = String(text || "")
      .replace(/\r/g, "")
      .replace(/\u00a0/g, " ")
      .split("\n");

    let paragraph = null;
    let currentList = null;
    let currentListType = "";

    function closeParagraph() {
      paragraph = null;
    }

    function closeList() {
      currentList = null;
      currentListType = "";
    }

    function ensureParagraph() {
      if (!paragraph) {
        paragraph = document.createElement("p");
        paragraph.className = "article-rich-text__paragraph";
        container.append(paragraph);
      } else {
        paragraph.append(document.createElement("br"));
      }
      return paragraph;
    }

    function ensureList(type) {
      if (currentList && currentListType === type) return currentList;
      closeParagraph();
      currentListType = type;
      currentList = document.createElement(type);
      currentList.className = `article-rich-text__list article-rich-text__list--${type}`;
      container.append(currentList);
      return currentList;
    }

    for (const rawLine of lines) {
      const line = rawLine.replace(/[ \t]+$/g, "").trim();
      if (!line) {
        closeParagraph();
        closeList();
        continue;
      }

      const ordered = line.match(/^([0-9٠-٩]+)\s*[.)\-:]\s*(.+)$/u);
      const bullet = line.match(/^[•●▪◦‣⁃*+\-–—]\s*(.+)$/u);
      if (ordered || bullet) {
        const type = ordered ? "ol" : "ul";
        const list = ensureList(type);
        const item = document.createElement("li");
        item.dataset.marker = ordered ? `${ordered[1]}.` : "•";
        const copy = document.createElement("span");
        copy.className = "article-rich-text__list-copy";
        appendArticleInline(copy, ordered ? ordered[2] : bullet[1]);
        item.append(copy);
        list.append(item);
        continue;
      }

      closeList();
      appendArticleInline(ensureParagraph(), line);
    }
  }

  function createArticleLanguageContent(pane, field) {
    const language = field.language || "en";
    const direction = language === "ar" ? "rtl" : "ltr";
    const wrapper = document.createElement("section");
    wrapper.className = `article-language-section article-language-section--${language}`;
    wrapper.dataset.articleLanguage = language;
    wrapper.dataset.articleType = "text";
    wrapper.dir = direction;

    const languageHeader = document.createElement("header");
    languageHeader.className = "article-language-section__header";
    const languageName = document.createElement("h2");
    languageName.textContent = language === "ar" ? "العربية" : "English";
    languageHeader.append(languageName);
    wrapper.append(languageHeader);

    let blocks = String(field.text || "").replace(/\r/g, "").split(/\n\s*\n+/).map((item) => item.trim()).filter(Boolean);
    const sourceBlock = articleLanguageBlock(pane, language);
    const sourceTitle = sourceBlock && typeof sourceBlock === "object" ? String(sourceBlock.title || "").trim() : "";
    const first = String(blocks[0] || "").trim();
    if (blocks.length && (first === pane.title || (sourceTitle && first === sourceTitle))) blocks = blocks.slice(1);

    const leadBlocks = [];
    const sections = [];
    let currentSection = null;

    for (const block of blocks) {
      const blockLines = String(block || "").split("\n");
      const possibleHeading = String(blockLines[0] || "").trim();
      if (isArticleHeadingBlock(possibleHeading)) {
        currentSection = { label: possibleHeading, blocks: [] };
        sections.push(currentSection);
        const remainder = blockLines.slice(1).join("\n").trim();
        if (remainder) currentSection.blocks.push(remainder);
      } else if (currentSection) {
        currentSection.blocks.push(block);
      } else {
        leadBlocks.push(block);
      }
    }

    if (leadBlocks.length) {
      const lead = document.createElement("div");
      lead.className = "article-content-lead article-rich-text";
      appendArticleTextLines(lead, leadBlocks.join("\n\n"));
      wrapper.append(lead);
    }

    if (!sections.length && !leadBlocks.length && field.text) {
      const card = document.createElement("section");
      card.className = "article-content-card";
      card.dataset.articleLanguage = language;
      card.dataset.articleType = "text";
      const body = document.createElement("div");
      body.className = "article-content-card__body article-rich-text";
      appendArticleTextLines(body, field.text);
      card.append(body);
      wrapper.append(card);
      return wrapper;
    }

    for (const section of sections) {
      const card = document.createElement("section");
      card.className = "article-content-card";
      card.dataset.articleLanguage = language;
      card.dataset.articleType = "text";
      const title = document.createElement("h2");
      title.className = "article-content-card__title";
      title.textContent = section.label;
      const body = document.createElement("div");
      body.className = "article-content-card__body article-rich-text";
      appendArticleTextLines(body, section.blocks.join("\n\n"));
      card.append(title, body);
      wrapper.append(card);
    }
    return wrapper;
  }

  function createArticleFieldCard(field) {
    const card = document.createElement("section");
    card.className = `article-content-card article-content-card--${field.type} article-content-card--${field.language}`;
    if (field.internal) card.classList.add("article-content-card--internal");
    card.dataset.articleType = field.type;
    card.dataset.articleLanguage = field.language;
    card.dataset.articleFieldKey = field.key;
    card.dir = field.language === "ar" ? "rtl" : "ltr";

    const header = document.createElement("header");
    header.className = "article-content-card__header";
    const title = document.createElement("h2");
    title.className = "article-content-card__title";
    title.textContent = field.label;
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "article-copy-button";
    copy.dir = "ltr";
    copy.dataset.articleCopyKey = field.key;
    copy.innerHTML = `<span aria-hidden="true">${ICONS.copy}</span><span class="article-copy-button__label">${articleCopyLabel(field.type, field.language, field.internal)}</span>`;
    header.append(title, copy);

    const body = document.createElement("div");
    body.className = "article-content-card__body article-rich-text";
    appendArticleTextLines(body, field.text);
    card.append(header, body);
    return card;
  }

  function createArticleDisplayControls(languages, types) {
    const wrapper = document.createElement("section");
    wrapper.className = "article-display-controls";
    wrapper.setAttribute("aria-label", "Display Options");

    const head = document.createElement("header");
    head.className = "article-display-controls__head";
    head.innerHTML = "<strong>Display Options</strong><span>Choose what to show</span>";
    wrapper.append(head);

    const languageValues = languages.length > 1 ? ["all", ...languages] : languages;
    const typeValues = types.length > 1 ? ["all", ...types] : types;

    const rows = [
      { label: "Language", values: languageValues, attribute: "articleLanguageFilter", labeler: articleLanguageLabel },
      { label: "Content", values: typeValues, attribute: "articleFilter", labeler: articleTypeLabel }
    ];

    for (const row of rows) {
      const item = document.createElement("div");
      item.className = "article-display-controls__row";
      const label = document.createElement("span");
      label.className = "article-display-controls__label";
      label.textContent = row.label;
      const group = document.createElement("div");
      group.className = "article-display-controls__group";
      group.setAttribute("role", "tablist");
      group.setAttribute("aria-label", row.label);
      for (const value of row.values) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "article-display-control";
        button.dataset[row.attribute] = value;
        button.setAttribute("role", "tab");
        button.textContent = row.labeler(value);
        group.append(button);
      }
      item.append(label, group);
      wrapper.append(item);
    }
    return wrapper;
  }

  function createArticleMacroGrid(fields, languages) {
    const grid = document.createElement("div");
    grid.className = "article-macro-grid";
    for (const language of languages) {
      const column = document.createElement("section");
      column.className = `article-language-column article-language-column--${language}`;
      column.dataset.articleLanguageColumn = language;
      column.dir = language === "ar" ? "rtl" : "ltr";
      const heading = document.createElement("h2");
      heading.className = "article-language-column__title";
      heading.textContent = language === "ar" ? "العربية" : "English";
      column.append(heading);
      for (const field of fields.filter((item) => item.language === language)) {
        column.append(createArticleFieldCard(field));
      }
      grid.append(column);
    }
    return grid;
  }

  function articleRelatedTopics(pane, limit = 6) {
    const topicMap = getKnowledgeBaseData()?.topicsById || {};
    return Object.values(topicMap)
      .filter((topic) => topic && topic.id !== pane.id && topic.sectionId === pane.sectionId)
      .slice(0, limit);
  }

  async function copyArticleText(text, button, successLabel = "Copied") {
    const value = String(text || "").trim();
    if (!value) return false;
    const label = button?.querySelector(".article-copy-button__label, .article-action-button__label");
    const original = label?.textContent || "Copy";
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const area = document.createElement("textarea");
        area.value = value;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.append(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      if (label) label.textContent = successLabel;
      window.setTimeout(() => {
        if (label?.isConnected) label.textContent = original;
      }, 1500);
      return true;
    } catch (_error) {
      if (label) label.textContent = "Copy failed";
      window.setTimeout(() => {
        if (label?.isConnected) label.textContent = original;
      }, 1800);
      return false;
    }
  }

  function readArticleFilterPreference(key, allowed, fallback) {
    let stored = "";
    try { stored = String(localStorage.getItem(key) || ""); } catch (_error) {}
    return allowed.includes(stored) ? stored : fallback;
  }

  function applyArticleVisibility({ language = articleViewState.activeLanguage, type = articleViewState.activeType, focus = "" } = {}) {
    const view = document.querySelector(".article-view");
    if (!view) return false;

    const languageButtons = [...view.querySelectorAll("[data-article-language-filter]")];
    const typeButtons = [...view.querySelectorAll("[data-article-filter]")];
    const availableLanguages = languageButtons.map((button) => button.dataset.articleLanguageFilter);
    const availableTypes = typeButtons.map((button) => button.dataset.articleFilter);
    const resolvedLanguage = availableLanguages.includes(language) ? language : (availableLanguages.includes("ar") ? "ar" : (availableLanguages[0] || "all"));
    const resolvedType = availableTypes.includes(type) ? type : (availableTypes[0] || "all");

    articleViewState.activeLanguage = resolvedLanguage;
    articleViewState.activeType = resolvedType;
    try {
      localStorage.setItem("sugo_content_filter_lang_v2", resolvedLanguage);
      localStorage.setItem("sugo_content_filter_type_v2", resolvedType);
    } catch (_error) {}

    languageButtons.forEach((button) => {
      const selected = button.dataset.articleLanguageFilter === resolvedLanguage;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && focus === "language") button.focus();
    });
    typeButtons.forEach((button) => {
      const selected = button.dataset.articleFilter === resolvedType;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && focus === "type") button.focus();
    });

    let visibleCount = 0;
    view.querySelectorAll(".article-content-card[data-article-language][data-article-type]").forEach((card) => {
      const languageValue = card.dataset.articleLanguage || "all";
      const typeValue = card.dataset.articleType || "text";
      const languageMatches = resolvedLanguage === "all" || languageValue === resolvedLanguage;
      const typeMatches = resolvedType === "all" || typeValue === resolvedType;
      const visible = languageMatches && typeMatches;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    view.querySelectorAll(".article-language-section[data-article-language]").forEach((section) => {
      const languageValue = section.dataset.articleLanguage || "all";
      const languageMatches = resolvedLanguage === "all" || languageValue === resolvedLanguage;
      const typeMatches = resolvedType === "all" || resolvedType === "text";
      const visibleCards = [...section.querySelectorAll(".article-content-card[data-article-language]")].some((card) => !card.hidden);
      const visible = languageMatches && typeMatches && (visibleCards || !section.querySelector(".article-content-card"));
      section.hidden = !visible;
      if (visible && !section.querySelector(".article-content-card")) visibleCount += 1;
    });

    const macroGrid = view.querySelector(".article-macro-grid");
    if (macroGrid) {
      let visibleColumns = 0;
      macroGrid.querySelectorAll("[data-article-language-column]").forEach((column) => {
        const languageValue = column.dataset.articleLanguageColumn;
        const languageMatches = resolvedLanguage === "all" || languageValue === resolvedLanguage;
        const hasVisibleCard = [...column.querySelectorAll(".article-content-card")].some((card) => !card.hidden);
        const visible = languageMatches && hasVisibleCard;
        column.hidden = !visible;
        if (visible) visibleColumns += 1;
      });
      macroGrid.classList.toggle("is-single-column", visibleColumns === 1);
    }

    const empty = view.querySelector(".article-filter-empty");
    if (empty) empty.hidden = visibleCount > 0;
    return true;
  }

  function applyArticleTypeFilter(type, { focus = false } = {}) {
    return applyArticleVisibility({ type, focus: focus ? "type" : "" });
  }

  function applyArticleLanguageFilter(language, { focus = false } = {}) {
    return applyArticleVisibility({ language, focus: focus ? "language" : "" });
  }

  function updateArticleFavoriteButton(paneId) {
    const active = isFavorite(paneId);
    document.querySelectorAll(`[data-article-favorite="${CSS.escape(paneId)}"]`).forEach((button) => {
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", String(active));
      const label = button.querySelector(".article-action-button__label");
      if (label) label.textContent = active ? "Favorited" : "Add Favorite";
      button.title = active ? "Remove from Favorites" : "Add to Favorites";
    });
  }

  function renderArticleSidePanel(pane) {
    const preview = document.querySelector(".app-shell__preview");
    if (!preview) return;
    preview.classList.add("has-content");
    preview.removeAttribute("aria-hidden");

    const panel = document.createElement("aside");
    panel.className = "article-side-panel";
    panel.setAttribute("aria-label", "Topic details");

    const header = document.createElement("header");
    header.className = "article-side-panel__header";
    header.innerHTML = `
      <span class="article-side-panel__icon" aria-hidden="true">${ICONS.folder}</span>
      <span class="article-side-panel__heading">
        <strong>${pane.title}</strong>
        <span>${pane.rootTitle}</span>
      </span>
    `;

    const details = document.createElement("dl");
    details.className = "article-side-panel__details";
    [["Category", pane.category], ["Section", pane.section], ["Topic", pane.title]].forEach(([label, value]) => {
      const item = document.createElement("div");
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = value || "—";
      item.append(term, description);
      details.append(item);
    });

    const relatedSection = document.createElement("section");
    relatedSection.className = "article-related";
    const relatedTitle = document.createElement("h2");
    relatedTitle.textContent = "Related Topics";
    const relatedList = document.createElement("div");
    relatedList.className = "article-related__list";
    const related = articleRelatedTopics(pane);
    for (const topic of related) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "article-related__item";
      button.dataset.relatedPane = topic.id;
      button.innerHTML = `<span aria-hidden="true">${ICONS.notes}</span><span><strong></strong><small></small></span><span class="article-related__chevron" aria-hidden="true">${ICONS.chevron}</span>`;
      button.querySelector("strong").textContent = topic.title;
      button.querySelector("small").textContent = topic.section;
      relatedList.append(button);
    }
    relatedSection.append(relatedTitle, relatedList);

    panel.append(header, details);
    if (related.length) panel.append(relatedSection);
    preview.replaceChildren(panel);

    panel.addEventListener("click", (event) => {
      const relatedButton = event.target.closest("[data-related-pane]");
      if (!relatedButton || !panel.contains(relatedButton)) return;
      openNavigationTopic(relatedButton.dataset.relatedPane, {
        source: "related-topic",
        persist: true,
        addToRecent: true,
        emit: true
      });
    });
  }

  function renderArticleDetail(paneId, { preserveFilter = false } = {}) {
    const pane = getArticlePane(paneId);
    const topic = getTopicMetadata(paneId);
    const workspace = document.querySelector(".app-shell__workspace");
    if (!pane || !topic || !workspace) return false;

    document.querySelectorAll(".sidebar-tool-button[data-workspace]").forEach((button) => {
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
    });
    const shell = document.querySelector(".app-shell");
    if (shell) shell.dataset.activeWorkspace = "article";

    const samePane = articleViewState.paneId === pane.id;
    articleViewState.paneId = pane.id;
    const fields = articleFields(pane);
    const languages = articleAvailableLanguages(fields);
    const languageValues = languages.length > 1 ? ["all", ...languages] : languages;
    const types = [...new Set(fields.map((field) => field.type))];
    const typeValues = types.length > 1 ? ["all", ...types] : types;

    if (!preserveFilter || !samePane || !languageValues.includes(articleViewState.activeLanguage)) {
      articleViewState.activeLanguage = languageValues.includes("all") ? "all" : (languageValues[0] || "all");
    }
    if (!preserveFilter || !samePane || !typeValues.includes(articleViewState.activeType)) {
      articleViewState.activeType = typeValues.includes("all") ? "all" : (typeValues[0] || "all");
    }

    workspace.classList.add("has-content");
    workspace.removeAttribute("aria-hidden");

    const view = document.createElement("article");
    view.className = "article-view";
    view.dataset.paneId = pane.id;

    const hero = document.createElement("header");
    hero.className = "article-view__hero";
    hero.innerHTML = `
      <span class="article-view__hero-icon" aria-hidden="true">${ICONS.folder}</span>
      <span class="article-view__hero-copy">
        <span class="article-view__kicker"></span>
        <h1></h1>
        <p></p>
      </span>
      <span class="article-view__actions"></span>
    `;
    hero.querySelector(".article-view__kicker").textContent = pane.rootTitle;
    hero.querySelector("h1").textContent = pane.title;
    hero.querySelector("p").textContent = [pane.category, pane.section].filter(Boolean).join(" · ");

    const actions = hero.querySelector(".article-view__actions");
    if (languages.includes("en")) {
      const copyEnglish = document.createElement("button");
      copyEnglish.type = "button";
      copyEnglish.className = "article-action-button";
      copyEnglish.dataset.articleCopyLanguage = "english";
      copyEnglish.title = "Copy English";
      copyEnglish.innerHTML = `<span aria-hidden="true">${ICONS.copy}</span><span class="article-action-button__label">Copy English</span>`;
      actions.append(copyEnglish);
    }
    if (languages.includes("ar")) {
      const copyArabic = document.createElement("button");
      copyArabic.type = "button";
      copyArabic.className = "article-action-button";
      copyArabic.dataset.articleCopyLanguage = "arabic";
      copyArabic.title = "Copy Arabic";
      copyArabic.innerHTML = `<span aria-hidden="true">${ICONS.copy}</span><span class="article-action-button__label">Copy Arabic</span>`;
      actions.append(copyArabic);
    }
    const favoriteButton = document.createElement("button");
    favoriteButton.type = "button";
    favoriteButton.className = "article-action-button";
    favoriteButton.dataset.articleFavorite = pane.id;
    favoriteButton.setAttribute("aria-pressed", "false");
    favoriteButton.innerHTML = `<span aria-hidden="true">${ICONS.star}</span><span class="article-action-button__label">Add Favorite</span>`;
    actions.append(favoriteButton);

    const content = document.createElement("div");
    content.className = "article-view__content";
    content.append(createArticleDisplayControls(languages, types));

    if (pane.format === "support_macro") {
      content.append(createArticleMacroGrid(fields, languages));
    } else {
      const dual = document.createElement("div");
      dual.className = "article-dual-content";
      for (const language of languages) {
        const field = fields.find((item) => item.language === language);
        if (field) dual.append(createArticleLanguageContent(pane, field));
      }
      content.append(dual);
    }

    const empty = document.createElement("div");
    empty.className = "article-filter-empty";
    empty.textContent = "No matching content.";
    empty.hidden = true;
    content.append(empty);

    view.append(hero, content);
    workspace.replaceChildren(view);
    renderArticleSidePanel(pane);
    updateArticleFavoriteButton(pane.id);
    applyArticleVisibility();

    view.addEventListener("click", (event) => {
      const languageFilter = event.target.closest("[data-article-language-filter]");
      if (languageFilter && view.contains(languageFilter)) {
        applyArticleLanguageFilter(languageFilter.dataset.articleLanguageFilter);
        return;
      }
      const typeFilter = event.target.closest("[data-article-filter]");
      if (typeFilter && view.contains(typeFilter)) {
        applyArticleTypeFilter(typeFilter.dataset.articleFilter);
        return;
      }
      const favorite = event.target.closest("[data-article-favorite]");
      if (favorite && view.contains(favorite)) {
        toggleFavorite(favorite.dataset.articleFavorite);
        updateArticleFavoriteButton(favorite.dataset.articleFavorite);
        return;
      }
      const copyLanguage = event.target.closest("[data-article-copy-language]");
      if (copyLanguage && view.contains(copyLanguage)) {
        const language = copyLanguage.dataset.articleCopyLanguage;
        void copyArticleText(getKnowledgeBaseContent()?.getPaneText?.(pane.id, language) || "", copyLanguage);
        return;
      }
      const copyField = event.target.closest("[data-article-copy-key]");
      if (copyField && view.contains(copyField)) {
        const field = fields.find((item) => item.key === copyField.dataset.articleCopyKey);
        if (field) void copyArticleText(field.text, copyField);
      }
    });

    view.addEventListener("keydown", (event) => {
      const languageTab = event.target.closest("[data-article-language-filter]");
      const typeTab = event.target.closest("[data-article-filter]");
      const tab = languageTab || typeTab;
      if (!tab || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      const selector = languageTab ? "[data-article-language-filter]" : "[data-article-filter]";
      const tabs = [...tab.parentElement.querySelectorAll(selector)];
      if (!tabs.length) return;
      const index = Math.max(0, tabs.indexOf(tab));
      let next = index;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      event.preventDefault();
      const target = tabs[next];
      if (languageTab) applyArticleLanguageFilter(target.dataset.articleLanguageFilter, { focus: true });
      else applyArticleTypeFilter(target.dataset.articleFilter, { focus: true });
    });

    articleViewState.copyStatus = "";
    setBreadcrumb(pane.path || [pane.rootTitle, pane.category, pane.section, pane.title]);
    document.dispatchEvent(new CustomEvent("sugo:articleview", {
      detail: {
        paneId: pane.id,
        format: pane.format,
        languages: languages.slice(),
        types: types.slice(),
        activeLanguage: articleViewState.activeLanguage,
        activeType: articleViewState.activeType
      }
    }));
    return true;
  }


  function normalizeSearchText(value) {
    const source = String(value || "").trim();
    if (!source) return "";
    const matcher = window.SUGO?.KnowledgeBaseMatcher;
    if (matcher && typeof matcher.normalize === "function") {
      try { return String(matcher.normalize(source) || "").trim(); } catch (_error) {}
    }
    return source
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
      .replace(/[أإآٱ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getSearchPaneArabicTitle(pane) {
    if (!pane) return "";
    if (pane.format === "support_macro" && pane.arabic && typeof pane.arabic === "object") {
      return String(pane.arabic.title || "").trim();
    }
    const arabicText = getKnowledgeBaseContent()?.getPaneText?.(pane.id, "arabic") || "";
    return String(arabicText).split(/\r?\n/).map((line) => line.trim()).find(Boolean) || "";
  }

  function buildSearchIndex() {
    if (Array.isArray(searchViewState.index)) return searchViewState.index;
    const data = getKnowledgeBaseData();
    const content = getKnowledgeBaseContent();
    const topics = Object.values(data?.topicsById || {});
    const index = [];

    for (const topic of topics) {
      if (!topic?.id) continue;
      const documentData = content?.getSearchDocument?.(topic.id);
      const pane = content?.getPane?.(topic.id);
      if (!documentData || !pane) continue;
      const title = String(topic.title || documentData.title || topic.id).trim();
      const arabicTitle = getSearchPaneArabicTitle(pane);
      const category = String(topic.category || documentData.category || "").trim();
      const section = String(topic.section || documentData.section || "").trim();
      const rootTitle = String(topic.rootTitle || pane.rootTitle || "").trim();
      const pathParts = Array.isArray(topic.path) ? topic.path.map((part) => String(part || "").trim()).filter(Boolean) : [];
      const englishText = String(documentData.englishText || "");
      const arabicText = String(documentData.arabicText || "");
      index.push({
        id: topic.id,
        title,
        arabicTitle,
        library: String(topic.library || documentData.library || ""),
        rootTitle,
        category,
        categoryId: String(topic.categoryId || ""),
        section,
        sectionId: String(topic.sectionId || ""),
        pathParts,
        englishText,
        arabicText,
        titleNorm: normalizeSearchText(title),
        arabicTitleNorm: normalizeSearchText(arabicTitle),
        categoryNorm: normalizeSearchText(category),
        sectionNorm: normalizeSearchText(section),
        pathNorm: normalizeSearchText(pathParts.join(" ")),
        englishNorm: normalizeSearchText(englishText),
        arabicNorm: normalizeSearchText(arabicText)
      });
    }

    searchViewState.index = index;
    return index;
  }

  function scoreSearchLanguage(item, queryNorm, terms, language) {
    const isArabic = language === "arabic";
    const body = isArabic ? item.arabicNorm : item.englishNorm;
    const localTitle = isArabic ? item.arabicTitleNorm : item.titleNorm;
    const sharedTitle = item.titleNorm;
    const path = item.pathNorm;
    const category = item.categoryNorm;
    const section = item.sectionNorm;
    let score = 0;
    let hits = 0;

    if (localTitle === queryNorm || sharedTitle === queryNorm) score += 240;
    if (localTitle.startsWith(queryNorm) || sharedTitle.startsWith(queryNorm)) score += 80;
    if (localTitle.includes(queryNorm) || sharedTitle.includes(queryNorm)) score += 125;
    if (category.includes(queryNorm)) score += 70;
    if (section.includes(queryNorm)) score += 66;
    if (path.includes(queryNorm)) score += 55;
    if (body.includes(queryNorm)) score += 38;

    for (const term of terms) {
      let matched = false;
      if (localTitle.includes(term) || sharedTitle.includes(term)) {
        score += 34;
        matched = true;
      }
      if (category.includes(term)) {
        score += 17;
        matched = true;
      }
      if (section.includes(term)) {
        score += 15;
        matched = true;
      }
      if (path.includes(term)) {
        score += 9;
        matched = true;
      }
      if (body.includes(term)) {
        score += 4;
        matched = true;
      }
      if (matched) hits += 1;
    }

    if (terms.length) score += (hits / terms.length) * 42;
    return { score, hits };
  }

  function searchSnippet(text, terms, maxLength = 250) {
    const source = String(text || "").replace(/\r/g, "").trim();
    if (!source) return "";
    const lines = source.split(/\n+/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
    let bestLine = lines[0] || source;
    let bestScore = -1;
    for (const line of lines) {
      const normalized = normalizeSearchText(line);
      let score = 0;
      for (const term of terms) {
        if (normalized.includes(term)) score += 1;
      }
      if (score > bestScore || (score === bestScore && line.length > bestLine.length && line.length < 420)) {
        bestLine = line;
        bestScore = score;
      }
    }
    const compact = bestLine.replace(/\s+/g, " ").trim();
    if (compact.length <= maxLength) return compact;
    return `${compact.slice(0, maxLength - 1).trimEnd()}…`;
  }

  function getSearchCategories() {
    const seen = new Set();
    const values = [];
    for (const item of buildSearchIndex()) {
      if (!item.category || seen.has(item.categoryId || item.category)) continue;
      seen.add(item.categoryId || item.category);
      values.push({ id: item.categoryId || item.category, label: item.category });
    }
    return values.sort((a, b) => a.label.localeCompare(b.label));
  }

  function getSearchSections(categoryId = searchViewState.category) {
    const seen = new Set();
    const values = [];
    for (const item of buildSearchIndex()) {
      if (categoryId && item.categoryId !== categoryId) continue;
      if (!item.section || seen.has(item.sectionId || item.section)) continue;
      seen.add(item.sectionId || item.section);
      values.push({ id: item.sectionId || item.section, label: item.section });
    }
    return values.sort((a, b) => a.label.localeCompare(b.label));
  }

  function runSearch(query = searchViewState.query) {
    const rawQuery = String(query || "").trim();
    const queryNorm = normalizeSearchText(rawQuery);
    const terms = queryNorm.split(/\s+/).filter((term) => term.length > 1 || /^\d+$/.test(term));
    if (!queryNorm || !terms.length) return [];

    const results = [];
    for (const item of buildSearchIndex()) {
      if (searchViewState.category && item.categoryId !== searchViewState.category) continue;
      if (searchViewState.section && item.sectionId !== searchViewState.section) continue;

      const english = scoreSearchLanguage(item, queryNorm, terms, "english");
      const arabic = scoreSearchLanguage(item, queryNorm, terms, "arabic");
      let language = english.score >= arabic.score ? "english" : "arabic";
      let score = Math.max(english.score, arabic.score);
      let hits = Math.max(english.hits, arabic.hits);

      if (searchViewState.language === "english") {
        language = "english";
        score = english.score;
        hits = english.hits;
      } else if (searchViewState.language === "arabic") {
        language = "arabic";
        score = arabic.score;
        hits = arabic.hits;
      }
      if (score <= 0 || hits <= 0) continue;

      const snippetText = language === "arabic" ? item.arabicText : item.englishText;
      results.push({
        ...item,
        score,
        hits,
        matchedLanguage: language,
        snippet: searchSnippet(snippetText, terms)
      });
    }

    return results
      .sort((a, b) => b.score - a.score || b.hits - a.hits || a.title.localeCompare(b.title))
      .slice(0, SEARCH_RESULT_LIMIT);
  }

  function selectSearchResult(paneId, source = "search-result") {
    return openNavigationTopic(paneId, {
      source,
      persist: true,
      addToRecent: true,
      emit: true
    });
  }

  function askFromSearchResult(paneId, title) {
    openNavigationTopic(paneId, {
      source: "search-ask",
      persist: true,
      addToRecent: true,
      emit: false
    });
    selectWorkspace(WORKSPACES.ASK_AI, {
      source: "search-ask",
      query: String(title || searchViewState.query || "").trim()
    });
    window.setTimeout(() => document.getElementById("sugoAskAIInput")?.focus(), 0);
  }

  function setSearchWorkspaceMode() {
    document.querySelectorAll(".sidebar-tool-button[data-workspace]").forEach((button) => {
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
    });
    const shell = document.querySelector(".app-shell");
    if (!shell) return;
    if (shell.dataset.activeWorkspace !== "search") {
      searchViewState.returnMode = shell.dataset.activeWorkspace || (articleViewState.paneId ? "article" : "");
    }
    shell.dataset.activeWorkspace = "search";
  }

  function createSearchLanguageControls() {
    const group = document.createElement("div");
    group.className = "search-filter-tabs";
    group.setAttribute("role", "tablist");
    group.setAttribute("aria-label", "Language");
    for (const item of SEARCH_LANGUAGES) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "search-filter-tab";
      button.dataset.searchLanguage = item.value;
      button.setAttribute("role", "tab");
      const selected = searchViewState.language === item.value;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-selected", String(selected));
      button.textContent = item.label;
      group.append(button);
    }
    return group;
  }

  function createSearchFilters() {
    const panel = document.createElement("section");
    panel.className = "search-filter-panel";
    panel.innerHTML = `
      <header class="search-filter-panel__header">
        <span aria-hidden="true">${ICONS.search}</span>
        <strong>Search in topics</strong>
      </header>
    `;

    const languageField = document.createElement("div");
    languageField.className = "search-filter-field";
    const languageLabel = document.createElement("span");
    languageLabel.className = "search-filter-label";
    languageLabel.textContent = "Language";
    languageField.append(languageLabel, createSearchLanguageControls());

    const categoryField = document.createElement("label");
    categoryField.className = "search-filter-field";
    const categoryLabel = document.createElement("span");
    categoryLabel.className = "search-filter-label";
    categoryLabel.textContent = "Category";
    const categorySelect = document.createElement("select");
    categorySelect.className = "search-filter-select";
    categorySelect.dataset.searchCategory = "";
    const categoryPlaceholder = document.createElement("option");
    categoryPlaceholder.value = "";
    categoryPlaceholder.textContent = "Choose category";
    categorySelect.append(categoryPlaceholder);
    for (const category of getSearchCategories()) {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.label;
      option.selected = category.id === searchViewState.category;
      categorySelect.append(option);
    }
    categoryField.append(categoryLabel, categorySelect);

    const sectionField = document.createElement("label");
    sectionField.className = "search-filter-field";
    const sectionLabel = document.createElement("span");
    sectionLabel.className = "search-filter-label";
    sectionLabel.textContent = "Section";
    const sectionSelect = document.createElement("select");
    sectionSelect.className = "search-filter-select";
    sectionSelect.dataset.searchSection = "";
    sectionSelect.disabled = !searchViewState.category;
    const sectionPlaceholder = document.createElement("option");
    sectionPlaceholder.value = "";
    sectionPlaceholder.textContent = searchViewState.category ? "Choose section" : "Choose category first";
    sectionSelect.append(sectionPlaceholder);
    for (const section of getSearchSections()) {
      const option = document.createElement("option");
      option.value = section.id;
      option.textContent = section.label;
      option.selected = section.id === searchViewState.section;
      sectionSelect.append(option);
    }
    sectionField.append(sectionLabel, sectionSelect);

    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "search-filter-reset";
    reset.dataset.searchReset = "";
    reset.innerHTML = `<span aria-hidden="true">${ICONS.reset}</span><span>Reset</span>`;
    reset.disabled = searchViewState.language === "all" && !searchViewState.category && !searchViewState.section;

    panel.append(languageField, categoryField, sectionField, reset);
    return panel;
  }

  function createSearchBestMatch(result) {
    const panel = document.createElement("section");
    panel.className = "search-best-match";
    if (!result) {
      panel.hidden = true;
      return panel;
    }
    panel.innerHTML = `
      <header class="search-best-match__top">
        <span class="search-best-match__badge">Best Match</span>
        <span class="search-best-match__language"></span>
      </header>
      <h2></h2>
      <p class="search-best-match__path"></p>
      <p class="search-best-match__snippet"></p>
      <div class="search-best-match__actions">
        <button type="button" data-search-open=""></button>
        <button type="button" data-search-ask=""></button>
      </div>
    `;
    panel.querySelector(".search-best-match__language").textContent = result.matchedLanguage === "arabic" ? "Arabic" : "English";
    panel.querySelector("h2").textContent = result.title;
    panel.querySelector(".search-best-match__path").textContent = [result.category, result.section].filter(Boolean).join(" · ");
    const snippet = panel.querySelector(".search-best-match__snippet");
    snippet.textContent = result.snippet;
    snippet.dir = result.matchedLanguage === "arabic" ? "rtl" : "ltr";
    const open = panel.querySelector("[data-search-open]");
    open.dataset.searchOpen = result.id;
    open.textContent = "Open SOP";
    const ask = panel.querySelector("[data-search-ask]");
    ask.dataset.searchAsk = result.id;
    ask.dataset.searchTitle = result.title;
    ask.textContent = "Ask AI";
    return panel;
  }

  function bindSearchPanel(panel) {
    panel.addEventListener("click", (event) => {
      const language = event.target.closest("[data-search-language]");
      if (language && panel.contains(language)) {
        searchViewState.language = language.dataset.searchLanguage || "all";
        renderSearchView(searchViewState.query);
        return;
      }
      const reset = event.target.closest("[data-search-reset]");
      if (reset && panel.contains(reset)) {
        searchViewState.language = "all";
        searchViewState.category = "";
        searchViewState.section = "";
        renderSearchView(searchViewState.query);
        return;
      }
      const open = event.target.closest("[data-search-open]");
      if (open && panel.contains(open)) {
        selectSearchResult(open.dataset.searchOpen, "search-best-match");
        return;
      }
      const ask = event.target.closest("[data-search-ask]");
      if (ask && panel.contains(ask)) {
        askFromSearchResult(ask.dataset.searchAsk, ask.dataset.searchTitle);
      }
    });

    panel.addEventListener("change", (event) => {
      if (event.target.matches("[data-search-category]")) {
        searchViewState.category = event.target.value;
        searchViewState.section = "";
        renderSearchView(searchViewState.query);
      } else if (event.target.matches("[data-search-section]")) {
        searchViewState.section = event.target.value;
        renderSearchView(searchViewState.query);
      }
    });
  }

  function renderSearchSidePanel(results) {
    const preview = document.querySelector(".app-shell__preview");
    if (!preview) return;
    preview.classList.add("has-content");
    preview.removeAttribute("aria-hidden");
    const panel = document.createElement("aside");
    panel.className = "search-side-panel";
    panel.setAttribute("aria-label", "Search in topics");
    panel.append(createSearchBestMatch(results[0]), createSearchFilters());
    preview.replaceChildren(panel);
    bindSearchPanel(panel);
  }

  function createSearchResultCard(result, index) {
    const card = document.createElement("article");
    card.className = "search-result-card";
    if (index === 0) card.classList.add("is-best-match");
    card.dataset.searchResult = result.id;

    const icon = document.createElement("span");
    icon.className = "search-result-card__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = ICONS.notes;

    const body = document.createElement("div");
    body.className = "search-result-card__body";
    const top = document.createElement("div");
    top.className = "search-result-card__top";
    const title = document.createElement("h3");
    title.textContent = result.title;
    const language = document.createElement("span");
    language.className = "search-result-card__language";
    language.textContent = result.matchedLanguage === "arabic" ? "Arabic" : "English";
    top.append(title, language);

    const path = document.createElement("p");
    path.className = "search-result-card__path";
    path.textContent = [result.category, result.section].filter(Boolean).join(" · ");

    const snippet = document.createElement("p");
    snippet.className = "search-result-card__snippet";
    snippet.textContent = result.snippet;
    snippet.dir = result.matchedLanguage === "arabic" ? "rtl" : "ltr";

    const actions = document.createElement("div");
    actions.className = "search-result-card__actions";
    const open = document.createElement("button");
    open.type = "button";
    open.dataset.searchOpen = result.id;
    open.textContent = "Open SOP";
    const ask = document.createElement("button");
    ask.type = "button";
    ask.dataset.searchAsk = result.id;
    ask.dataset.searchTitle = result.title;
    ask.textContent = "Ask AI";
    actions.append(open, ask);

    body.append(top, path, snippet, actions);
    card.append(icon, body);
    return card;
  }

  function renderSearchView(query = searchViewState.query) {
    const workspace = document.querySelector(".app-shell__workspace");
    if (!workspace) return false;
    const rawQuery = String(query || "").trim();
    if (!rawQuery) return restoreSearchReturnView();

    searchViewState.query = rawQuery;
    searchViewState.results = runSearch(rawQuery);
    setSearchWorkspaceMode();
    workspace.classList.add("has-content");
    workspace.removeAttribute("aria-hidden");

    const view = document.createElement("section");
    view.className = "search-view";
    const hero = document.createElement("header");
    hero.className = "search-view__hero";
    hero.innerHTML = `
      <span class="search-view__hero-icon" aria-hidden="true">${ICONS.search}</span>
      <span class="search-view__hero-copy">
        <span class="search-view__kicker">Search in topics</span>
        <h1>Search</h1>
        <p></p>
      </span>
      <button type="button" class="search-view__new" data-search-new="">New search</button>
    `;
    hero.querySelector("p").textContent = rawQuery;

    const summary = document.createElement("div");
    summary.className = "search-view__summary";
    const count = document.createElement("strong");
    count.textContent = String(searchViewState.results.length);
    const label = document.createElement("span");
    label.textContent = searchViewState.results.length === 1 ? "topic" : "topics";
    summary.append(count, label);

    const results = document.createElement("div");
    results.className = "search-results";
    if (!searchViewState.results.length) {
      const empty = document.createElement("div");
      empty.className = "search-results__empty";
      empty.innerHTML = `<span aria-hidden="true">${ICONS.search}</span><strong>No results found.</strong>`;
      results.append(empty);
    } else {
      const groups = [];
      const byRoot = new Map();
      searchViewState.results.forEach((result, index) => {
        const key = result.rootTitle || "SUGO SOP";
        if (!byRoot.has(key)) {
          const group = { title: key, items: [] };
          byRoot.set(key, group);
          groups.push(group);
        }
        byRoot.get(key).items.push({ result, index });
      });
      for (const groupData of groups) {
        const group = document.createElement("h2");
        group.className = "search-results__group";
        group.innerHTML = `<span></span><small></small>`;
        group.querySelector("span").textContent = groupData.title;
        group.querySelector("small").textContent = String(groupData.items.length);
        results.append(group);
        for (const entry of groupData.items) {
          results.append(createSearchResultCard(entry.result, entry.index));
        }
      }
    }

    view.append(hero, summary, results);
    workspace.replaceChildren(view);
    renderSearchSidePanel(searchViewState.results);
    setBreadcrumb(["SUGO SOP", "Search"]);

    view.addEventListener("click", (event) => {
      const newSearch = event.target.closest("[data-search-new]");
      if (newSearch && view.contains(newSearch)) {
        const input = document.getElementById("searchInput");
        input?.focus();
        input?.select();
        return;
      }
      const open = event.target.closest("[data-search-open]");
      if (open && view.contains(open)) {
        selectSearchResult(open.dataset.searchOpen);
        return;
      }
      const ask = event.target.closest("[data-search-ask]");
      if (ask && view.contains(ask)) {
        askFromSearchResult(ask.dataset.searchAsk, ask.dataset.searchTitle);
      }
    });

    document.dispatchEvent(new CustomEvent("sugo:searchresults", {
      detail: {
        query: rawQuery,
        count: searchViewState.results.length,
        language: searchViewState.language,
        category: searchViewState.category,
        section: searchViewState.section
      }
    }));
    return true;
  }

  function restoreSearchReturnView() {
    const mode = searchViewState.returnMode;
    searchViewState.query = "";
    searchViewState.results = [];
    searchViewState.returnMode = "";
    if (mode === "article" && articleViewState.paneId) {
      return renderArticleDetail(articleViewState.paneId, { preserveFilter: true });
    }
    if (Object.values(WORKSPACES).includes(mode)) {
      return selectWorkspace(mode, { source: "search-restore" });
    }
    if (articleViewState.paneId) {
      return renderArticleDetail(articleViewState.paneId, { preserveFilter: true });
    }
    clearWorkspaceContent();
    const preview = document.querySelector(".app-shell__preview");
    if (preview) {
      preview.classList.remove("has-content");
      preview.setAttribute("aria-hidden", "true");
      preview.replaceChildren();
    }
    setBreadcrumb(["SUGO SOP"]);
    return true;
  }

  function scheduleSearchRender(value) {
    window.clearTimeout(searchViewState.inputTimer);
    searchViewState.inputTimer = window.setTimeout(() => {
      const query = String(value || "").trim();
      if (query) renderSearchView(query);
      else restoreSearchReturnView();
    }, 90);
  }

  function renderCreateTicketWorkspace() {
    const workspace = document.querySelector(".app-shell__workspace");
    if (!workspace) {
      return;
    }

    workspace.removeAttribute("aria-hidden");
    workspace.classList.add("has-content");

    const view = document.createElement("div");
    view.className = "ticket-workspace";
    view.innerHTML = `
      <header class="ticket-workspace__hero">
        <span class="ticket-workspace__hero-icon">${ICONS.ticket}</span>
        <span class="ticket-workspace__hero-copy">
          <h1>Create Ticket</h1>
          <p>Build a clean ready-to-send customer reply, escalation note, or missing-information request from the case details. This workspace is locked to Ticket output.</p>
        </span>
      </header>
    `;
    view.append(
      createTicketTypeSelector(),
      createTicketCaseSection(),
      createTicketDetailsForm(),
      createTicketAttachmentSection()
    );
    workspace.replaceChildren(view);
    setBreadcrumb(["SUGO SOP", "Create Ticket"]);
    renderTicketPreviewPanel();
  }

  function clearWorkspaceContent() {
    const workspace = document.querySelector(".app-shell__workspace");
    if (!workspace) {
      return;
    }
    workspace.classList.remove("has-content");
    workspace.setAttribute("aria-hidden", "true");
    workspace.replaceChildren();
  }

  function renderSelectedWorkspace(workspace) {
    if (workspace === WORKSPACES.ASK_AI) {
      renderAskAIWorkspace();
      return;
    }
    if (workspace === WORKSPACES.CREATE_TICKET) {
      renderCreateTicketWorkspace();
      return;
    }
    if (workspace === WORKSPACES.UPLOAD_IMAGE) {
      renderVisionWorkspace();
      return;
    }
    clearWorkspaceContent();
    setBreadcrumb(["SUGO SOP"]);
    renderTicketPreviewPanel();
    renderAskAIOutputPanel();
  }

  function getWorkspaceButton(workspace) {
    return document.querySelector(`.sidebar-tool-button[data-workspace="${workspace}"]`);
  }

  function selectWorkspace(workspace, { source = "api", query = "" } = {}) {
    if (!Object.values(WORKSPACES).includes(workspace)) {
      return false;
    }

    document.querySelectorAll(".sidebar-tool-button[data-workspace]").forEach((button) => {
      const isSelected = button.dataset.workspace === workspace;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });

    const shell = document.querySelector(".app-shell");
    if (shell) {
      shell.dataset.activeWorkspace = workspace;
    }

    const resolvedQuery = String(query || "").trim();
    if (workspace === WORKSPACES.ASK_AI && resolvedQuery && !askAIWorkspaceState.query.trim()) {
      askAIWorkspaceState.query = resolvedQuery;
    }
    renderSelectedWorkspace(workspace);

    document.dispatchEvent(new CustomEvent("sugo:workspacechange", {
      detail: { workspace, source, query: String(query || "").trim() }
    }));

    return true;
  }

  function bindSidebarTools(sidebar) {
    const searchInput = sidebar.querySelector("#searchInput");

    sidebar.addEventListener("click", (event) => {
      const button = event.target.closest(".sidebar-tool-button[data-workspace]");
      if (!button || !sidebar.contains(button)) {
        return;
      }
      selectWorkspace(button.dataset.workspace, { source: "sidebar" });
    });

    if (!searchInput) {
      return;
    }

    searchInput.addEventListener("compositionstart", () => {
      searchViewState.composing = true;
    });

    searchInput.addEventListener("compositionend", () => {
      searchViewState.composing = false;
      scheduleSearchRender(searchInput.value);
    });

    searchInput.addEventListener("input", () => {
      document.dispatchEvent(new CustomEvent("sugo:searchinput", {
        detail: { query: searchInput.value }
      }));
      if (!searchViewState.composing) scheduleSearchRender(searchInput.value);
    });

    searchInput.addEventListener("focus", () => {
      if (searchInput.value.trim()) scheduleSearchRender(searchInput.value);
    });

    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        searchInput.value = "";
        restoreSearchReturnView();
        return;
      }
      if (event.key !== "Enter" || event.shiftKey) {
        return;
      }
      event.preventDefault();
      window.clearTimeout(searchViewState.inputTimer);
      selectWorkspace(WORKSPACES.ASK_AI, {
        source: "search-enter",
        query: searchInput.value
      });
      getWorkspaceButton(WORKSPACES.ASK_AI)?.focus();
    });
  }

  function mountApplicationShell() {
    const mount = document.getElementById("app");
    if (!mount) {
      return;
    }

    const shell = document.createElement("div");
    shell.className = "app-shell";

    const header = createHeader();

    const body = document.createElement("div");
    body.className = "app-shell__body";

    const sidebar = createSidebarTools();
    const workspace = createShellRegion("app-shell__workspace shell-surface");
    const preview = createShellRegion("app-shell__preview shell-surface");

    body.append(sidebar, workspace, preview);
    shell.append(header, body);
    mount.replaceChildren(shell);

    bindSidebarTools(sidebar);
    renderNavigationTree();
    setNavigationMenuExpanded(false);

    const lastPane = readLastPane();
    if (lastPane && getTopicMetadata(lastPane)) {
      openNavigationTopic(lastPane, {
        source: "restore",
        persist: false,
        addToRecent: false,
        emit: false
      });
    }
  }

  function setBreadcrumb(labels) {
    const breadcrumb = document.getElementById("sugoBreadcrumb");
    if (!breadcrumb) {
      return;
    }

    const cleaned = Array.isArray(labels)
      ? labels.map((label) => String(label || "").trim()).filter(Boolean)
      : [];

    const values = cleaned.length ? cleaned : ["SUGO SOP"];
    const fragment = document.createDocumentFragment();

    const icon = document.createElement("span");
    icon.className = "topbar__breadcrumb-icon";
    icon.innerHTML = ICONS.home;
    fragment.append(icon);

    values.forEach((label, index) => {
      const item = document.createElement("span");
      item.className = "topbar__breadcrumb-item";
      if (index === values.length - 1) {
        item.classList.add("topbar__breadcrumb-current");
      }
      item.textContent = label;
      fragment.append(item);
    });

    breadcrumb.replaceChildren(fragment);
  }

  function initializeFoundation() {
    /* The rebuilt interface is intentionally English-only and permanently LTR. */
    root.lang = "en";
    root.dir = "ltr";

    applyTheme("dark", { persist: false });

    mountApplicationShell();
  }

  window.SUGO = window.SUGO || {};
  window.SUGO.FavoritesRecent = Object.freeze({
    refresh: refreshQuickAccess,
    recordRecent,
    setFavorite,
    toggleFavorite,
    isFavorite,
    setAiFavorite,
    open(tab = "favorites") {
      setQuickAccessTab(tab, { open: true });
    },
    close: closeQuickAccess,
    get favorites() {
      return [...safeReadJsonList(STORAGE_KEY_FAVORITES)];
    },
    get recent() {
      return [...safeReadJsonList(STORAGE_KEY_RECENT)];
    }
  });
  window.SUGO.Navigation = Object.freeze({
    render: renderNavigationTree,
    openPane: openNavigationTopic,
    reset: resetNavigationTree,
    selectLibrary: setLibrary,
    setMenuExpanded: setNavigationMenuExpanded,
    getTopic: getTopicMetadata,
    get stats() {
      return getNavigationStats();
    },
    get activePane() {
      return document.querySelector(".navigation-topic.is-active")?.dataset.pane || "";
    }
  });
  window.SUGO.AIConsole = Object.freeze({
    quickPrompts: ASK_AI_QUICK_PROMPTS.map((item) => ({ ...item })),
    responseModes: ASK_AI_RESPONSE_MODES.map((item) => ({ ...item })),
    knowledgeModes: ASK_AI_KNOWLEDGE_MODES.map((item) => ({ ...item })),
    focusModes: ASK_AI_FOCUS_MODES.map(({ value, label, hint }) => ({ value, label, hint })),
    setQuery(value) {
      askAIWorkspaceState.query = String(value ?? "");
      const input = document.getElementById("sugoAskAIInput");
      if (input) input.value = askAIWorkspaceState.query;
      emitAskAIStateChange("api");
      return askAIWorkspaceState.query;
    },
    setOption(group, value) {
      return updateAskAIOptionSelection(group, value);
    },
    generate(options = {}) {
      return requestAskAIAnswer("api", options);
    },
    retry: retryAskAIAnswer,
    stop: stopAskAIAnswer,
    clear() {
      return clearAskAIWorkspace({ focus: false });
    },
    copy: copyAskAIAnswer,
    applyAnswer(result, options) {
      return applyAskAIAnswer(result, options);
    },
    refresh() {
      if (document.querySelector(".app-shell")?.dataset.activeWorkspace === WORKSPACES.ASK_AI) renderAskAIWorkspace();
      return getAskAISnapshot();
    },
    get state() {
      return getAskAISnapshot();
    },
    get lastRequestBody() {
      return window.SUGO?.WorkerAPI?.lastRequestBody || null;
    }
  });
  window.SUGO.VisionConsole = Object.freeze({
    quickPrompts: VISION_QUICK_PROMPTS.map((item) => ({ ...item })),
    outputTypes: VISION_OUTPUT_TYPES.map((item) => ({ ...item })),
    responseModes: VISION_RESPONSE_MODES.map((item) => ({ ...item })),
    knowledgeModes: VISION_KNOWLEDGE_MODES.map((item) => ({ ...item })),
    analysisTypes: VISION_ANALYSIS_TYPES.map(({ value, label, shortLabel }) => ({ value, label, shortLabel })),
    setOption(group, value) {
      return updateVisionOptionSelection(group, value);
    },
    setDetails(details = {}) {
      ["userId", "contextId", "note"].forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(details, key)) visionWorkspaceState[key] = String(details[key] ?? "");
      });
      if (document.querySelector(".app-shell")?.dataset.activeWorkspace === WORKSPACES.UPLOAD_IMAGE) renderVisionWorkspace();
      emitVisionStateChange("api-details");
      return getVisionSnapshot();
    },
    async attachImage(file) {
      return handleVisionImageFile(file, "api");
    },
    clearImage() {
      visionAttachedImage = null;
      renderVisionImagePreview();
      setVisionImageStatus("");
      emitVisionStateChange("clear-image");
      return null;
    },
    analyze(options = {}) {
      return requestVisionAnalysis("api", options);
    },
    retry: retryVisionAnalysis,
    stop: stopVisionAnalysis,
    clear() {
      return clearVisionWorkspace({ focus: false });
    },
    copy: copyVisionAnswer,
    applyResult(result, options) {
      return applyVisionResult(result, options);
    },
    refresh() {
      if (document.querySelector(".app-shell")?.dataset.activeWorkspace === WORKSPACES.UPLOAD_IMAGE) renderVisionWorkspace();
      return getVisionSnapshot();
    },
    getImagePayload() {
      const payload = buildVisionImagePayload();
      return payload ? payload.map((item) => ({ ...item })) : undefined;
    },
    get state() {
      return getVisionSnapshot();
    },
    get lastRequestBody() {
      return window.SUGO?.WorkerAPI?.lastRequestBody || null;
    }
  });
  window.SUGO.Search = Object.freeze({
    search(query) {
      const value = String(query || "").trim();
      const input = document.getElementById("searchInput");
      if (input) input.value = value;
      return value ? renderSearchView(value) : restoreSearchReturnView();
    },
    setLanguage(language) {
      const allowed = SEARCH_LANGUAGES.some((item) => item.value === language);
      searchViewState.language = allowed ? language : "all";
      if (searchViewState.query) renderSearchView(searchViewState.query);
      return searchViewState.language;
    },
    setCategory(categoryId) {
      searchViewState.category = String(categoryId || "");
      searchViewState.section = "";
      if (searchViewState.query) renderSearchView(searchViewState.query);
      return searchViewState.category;
    },
    setSection(sectionId) {
      searchViewState.section = String(sectionId || "");
      if (searchViewState.query) renderSearchView(searchViewState.query);
      return searchViewState.section;
    },
    resetFilters() {
      searchViewState.language = "all";
      searchViewState.category = "";
      searchViewState.section = "";
      if (searchViewState.query) renderSearchView(searchViewState.query);
      return true;
    },
    clear() {
      const input = document.getElementById("searchInput");
      if (input) input.value = "";
      return restoreSearchReturnView();
    },
    invalidate() {
      searchViewState.index = null;
      return true;
    },
    get state() {
      return {
        query: searchViewState.query,
        language: searchViewState.language,
        category: searchViewState.category,
        section: searchViewState.section,
        count: searchViewState.results.length,
        results: searchViewState.results.map((item) => ({
          id: item.id,
          title: item.title,
          category: item.category,
          section: item.section,
          rootTitle: item.rootTitle,
          matchedLanguage: item.matchedLanguage,
          score: item.score
        }))
      };
    }
  });
  window.SUGO.ArticleView = Object.freeze({
    open(paneId) {
      return openNavigationTopic(paneId, {
        source: "article-api",
        persist: true,
        addToRecent: true,
        emit: true
      });
    },
    setFilter(type) {
      return applyArticleTypeFilter(type, { focus: false });
    },
    setLanguage(language) {
      return applyArticleLanguageFilter(language, { focus: false });
    },
    refresh() {
      return articleViewState.paneId
        ? renderArticleDetail(articleViewState.paneId, { preserveFilter: true })
        : false;
    },
    related(paneId = articleViewState.paneId) {
      const pane = getArticlePane(paneId);
      return pane ? articleRelatedTopics(pane).map((topic) => ({ ...topic })) : [];
    },
    get currentPane() {
      return articleViewState.paneId;
    },
    get activeLanguage() {
      return articleViewState.activeLanguage;
    },
    get activeType() {
      return articleViewState.activeType;
    }
  });
  window.SUGO.TicketBuilder = Object.freeze({
    types: TICKET_TYPES.map(({ value, label }) => ({ value, label })),
    tones: TICKET_TONES.map(({ value, label }) => ({ value, label })),
    selectType(value) {
      const section = document.querySelector(".ticket-type-section");
      if (!section) {
        ticketWorkspaceState.type = getTicketType(value).value;
        return getTicketType(value);
      }
      return updateTicketTypeSelection(section, value);
    },
    selectTone(value) {
      const section = document.querySelector(".ticket-details-section");
      if (!section) {
        ticketWorkspaceState.tone = getTicketTone(value).value;
        return getTicketTone(value);
      }
      return updateTicketToneSelection(section, value);
    },
    setCaseDetails(value) {
      ticketWorkspaceState.caseDetails = String(value ?? "");
      const textarea = document.getElementById("sugoTicketInput");
      if (textarea) {
        textarea.value = ticketWorkspaceState.caseDetails;
      }
      emitTicketCaseChange("api");
      return ticketWorkspaceState.caseDetails;
    },
    clearCaseDetails() {
      ticketWorkspaceState.caseDetails = "";
      const textarea = document.getElementById("sugoTicketInput");
      if (textarea) {
        textarea.value = "";
        textarea.focus();
      }
      emitTicketCaseChange("clear");
      return "";
    },
    async attachImage(file) {
      const section = document.querySelector(".ticket-image-section");
      if (!section) {
        ticketAttachedImage = await prepareTicketImageForAI(file);
        emitTicketImageChange("api");
        return getTicketImageMetadata();
      }
      const didAttach = await handleTicketImageFile(section, file, "api");
      return didAttach ? getTicketImageMetadata() : null;
    },
    clearImage() {
      ticketAttachedImage = null;
      const section = document.querySelector(".ticket-image-section");
      if (section) {
        renderTicketImagePreview(section);
        setTicketImageStatus(section, "");
      }
      emitTicketImageChange("clear");
      return null;
    },
    generate() {
      return requestTicketGeneration("api");
    },
    abort() {
      resetTicketRequestState({ abort: true });
      renderTicketPreviewPanel();
      return { ...ticketRequestState };
    },
    clear() {
      return clearTicketWorkspaceState({ focus: false, source: "api" });
    },
    applyGeneratedTicket(result, options) {
      return applyGeneratedTicket(result, options);
    },
    refreshPreview() {
      renderTicketPreviewPanel();
      return getTicketPreviewSnapshot();
    },
    getImagePayload() {
      const payload = buildTicketImagePayload();
      return payload ? payload.map((item) => ({ ...item })) : undefined;
    },
    setDetails(details = {}) {
      ["userId", "orderId", "evidence"].forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(details, key)) {
          ticketWorkspaceState[key] = String(details[key] ?? "");
        }
      });
      if (Object.prototype.hasOwnProperty.call(details, "tone")) {
        ticketWorkspaceState.tone = getTicketTone(details.tone).value;
      }
      if (document.querySelector(".ticket-details-section")) {
        renderCreateTicketWorkspace();
      }
      emitTicketDetailsChange("all");
      return { ...ticketWorkspaceState };
    },
    clearDetails() {
      ticketWorkspaceState.userId = "";
      ticketWorkspaceState.orderId = "";
      ticketWorkspaceState.evidence = "";
      ticketWorkspaceState.tone = "professional";
      if (document.querySelector(".ticket-details-section")) {
        renderCreateTicketWorkspace();
      }
      emitTicketDetailsChange("all");
      return { ...ticketWorkspaceState };
    },
    get type() {
      return ticketWorkspaceState.type;
    },
    get caseDetails() {
      return ticketWorkspaceState.caseDetails;
    },
    get attachment() {
      return getTicketImageMetadata();
    },
    get preview() {
      return getTicketPreviewSnapshot();
    },
    get generatedOutput() {
      return ticketWorkspaceState.generatedOutput;
    },
    get requestState() {
      return { ...ticketRequestState };
    },
    get lastRequestBody() {
      return window.SUGO?.WorkerAPI?.lastRequestBody || null;
    },
    get details() {
      return {
        userId: ticketWorkspaceState.userId,
        orderId: ticketWorkspaceState.orderId,
        evidence: ticketWorkspaceState.evidence,
        tone: ticketWorkspaceState.tone
      };
    }
  });
  window.SUGO.Foundation = Object.freeze({
    applyTheme,
    setBreadcrumb,
    selectWorkspace,
    selectLibrary: setLibrary,
    supportedThemes: [...SUPPORTED_THEMES],
    workspaces: { ...WORKSPACES },
    libraries: { ...LIBRARIES }
  });

  document.addEventListener("sugo:admindataready", () => {
    renderNavigationTree();
    refreshQuickAccess();
    searchViewState.index = null;
    window.SUGO?.KnowledgeBaseMatcher?.invalidate?.();
    const activePane = articleViewState.paneId;
    if (activePane && getArticlePane(activePane)) {
      renderArticleDetail(activePane, { preserveFilter: true });
    }
  });

  initializeFoundation();
})();
