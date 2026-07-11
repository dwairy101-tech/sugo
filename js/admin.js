(() => {
  "use strict";

  const DEFAULT_WORKER_URL = "https://sugo.dwairy101.workers.dev";
  const MENU_CACHE_KEY = "sugo_integrated_menu_v1_cache";
  const CTRL_RENAME = "__rename__";
  const CTRL_DELETE = "__delete__";
  const REQUEST_TIMEOUT_MS = 15000;

  const state = {
    loaded: false,
    loading: null,
    contentError: "",
    menuError: "",
    paneOverrides: Object.create(null),
    parsedPaneOverrides: Object.create(null),
    menuState: readMenuCache(),
    transformedData: null,
    customPanes: Object.create(null),
    activeDialog: null,
    activePaneId: "",
    adminPassword: String(window.__SUGO_ADMIN_PASSWORD || "")
  };

  function workerUrl() {
    return String(window.SUGO_WORKER_URL || DEFAULT_WORKER_URL).replace(/\/+$/, "");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);
  }

  function cleanText(value, max = 300000) {
    return String(value ?? "").replace(/\u0000/g, "").slice(0, max);
  }

  function normalizeId(value, prefix = "custom") {
    const normalized = String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0600-\u06ff_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 150);
    return normalized || `${prefix}-${Date.now().toString(36)}`;
  }

  function clone(value) {
    if (typeof structuredClone === "function") {
      try { return structuredClone(value); } catch (_error) {}
    }
    return JSON.parse(JSON.stringify(value));
  }

  function readMenuCache() {
    try {
      const parsed = JSON.parse(localStorage.getItem(MENU_CACHE_KEY) || "{}");
      return normalizeMenuState(parsed);
    } catch (_error) {
      return normalizeMenuState({});
    }
  }

  function writeMenuCache(menu) {
    try { localStorage.setItem(MENU_CACHE_KEY, JSON.stringify(normalizeMenuState(menu))); } catch (_error) {}
  }

  function normalizeMenuState(menu) {
    const source = menu && typeof menu === "object" ? menu : {};
    const seen = new Set();
    const items = Array.isArray(source.items) ? source.items.filter((item) => {
      if (!item || typeof item !== "object") return false;
      const id = String(item.id || item.paneId || "").trim();
      if (!id || seen.has(id)) return false;
      if (!["root", "category", "section", "topic"].includes(String(item.type || ""))) return false;
      seen.add(id);
      return true;
    }).map((item) => ({
      type: String(item.type || "topic"),
      id: String(item.id || item.paneId || ""),
      label: cleanText(item.label || item.title || "", 180),
      rootKey: cleanText(item.rootKey || "", 160),
      categoryKey: cleanText(item.categoryKey || "", 180),
      sectionKey: cleanText(item.sectionKey || "", 180),
      paneId: String(item.paneId || item.id || ""),
      body: cleanText(item.body || "", 300000),
      html: cleanText(item.html || "", 900000),
      updatedAt: cleanText(item.updatedAt || "", 80)
    })) : [];
    return {
      version: 1,
      updatedAt: source.updatedAt || null,
      items
    };
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), Math.max(1000, Number(timeoutMs) || REQUEST_TIMEOUT_MS));
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function readJsonResponse(response) {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.ok) {
      const error = new Error(payload?.error || `Request failed (${response.status})`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  }

  async function loadRemoteData({ force = false } = {}) {
    if (state.loaded && !force) return snapshot();
    if (state.loading && !force) return state.loading;

    state.loading = (async () => {
      const base = workerUrl();
      const [contentResult, menuResult] = await Promise.allSettled([
        fetchWithTimeout(`${base}/content?ts=${Date.now()}`, { cache: "no-store" }).then(readJsonResponse),
        fetchWithTimeout(`${base}/menu?ts=${Date.now()}`, { cache: "no-store" }).then(readJsonResponse)
      ]);

      state.contentError = "";
      state.menuError = "";

      if (contentResult.status === "fulfilled") {
        const overrides = contentResult.value?.content?.paneOverrides;
        state.paneOverrides = overrides && typeof overrides === "object" ? overrides : Object.create(null);
        rebuildParsedOverrides();
      } else {
        state.contentError = contentResult.reason?.message || "Content sync failed.";
      }

      if (menuResult.status === "fulfilled") {
        state.menuState = normalizeMenuState(menuResult.value?.menu || {});
        writeMenuCache(state.menuState);
      } else {
        state.menuError = menuResult.reason?.message || "Menu sync failed.";
      }

      rebuildTransformedData();
      state.loaded = true;
      dispatchDataReady("remote-load");
      return snapshot();
    })().finally(() => {
      state.loading = null;
    });

    return state.loading;
  }

  function baseContent() {
    return window.SUGO?.KnowledgeBaseContent || null;
  }

  function baseData() {
    return window.SUGO?.KnowledgeBaseData || null;
  }

  function createTemplate(html) {
    const template = document.createElement("template");
    template.innerHTML = String(html || "");
    return template;
  }

  const STRUCTURED_BLOCK_TAGS = new Set([
    "ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "DIV", "DL", "DT", "DD", "FIELDSET",
    "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "H1", "H2", "H3", "H4", "H5", "H6",
    "HEADER", "HR", "MAIN", "NAV", "P", "PRE", "SECTION", "TABLE", "TBODY", "THEAD",
    "TFOOT", "TR"
  ]);

  function structuredTextFromNode(node) {
    if (!node) return "";
    const output = [];
    const pushBreak = () => {
      if (!output.length || output[output.length - 1] === "\n") return;
      output.push("\n");
    };

    function walk(current, listContext = null) {
      if (!current) return;
      if (current.nodeType === Node.TEXT_NODE) {
        output.push(String(current.nodeValue || "").replace(/\u00a0/g, " "));
        return;
      }
      if (current.nodeType !== Node.ELEMENT_NODE && current.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;

      const tag = current.nodeType === Node.ELEMENT_NODE ? current.tagName : "";
      if (tag === "BR") {
        pushBreak();
        return;
      }
      if (tag === "LI") {
        pushBreak();
        let marker = "• ";
        if (listContext?.type === "ol") marker = `${listContext.index}. `;
        output.push(marker);
        const nestedLists = [];
        for (const child of current.childNodes) {
          if (child.nodeType === Node.ELEMENT_NODE && ["UL", "OL"].includes(child.tagName)) nestedLists.push(child);
          else walk(child, listContext);
        }
        pushBreak();
        nestedLists.forEach((nested) => walk(nested));
        return;
      }
      if (tag === "UL" || tag === "OL") {
        pushBreak();
        let index = Number(current.getAttribute?.("start") || 1);
        for (const child of current.children || []) {
          if (child.tagName !== "LI") continue;
          walk(child, { type: tag.toLowerCase(), index });
          index += 1;
        }
        pushBreak();
        return;
      }
      if (tag === "TD" || tag === "TH") {
        if (output.length && output[output.length - 1] !== "\n") output.push(" | ");
      }

      const block = STRUCTURED_BLOCK_TAGS.has(tag);
      if (block) pushBreak();
      for (const child of current.childNodes || []) walk(child, listContext);
      if (block) pushBreak();
    }

    walk(node);
    return cleanText(output.join("")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim());
  }

  function textFrom(root, selector, { structured = false } = {}) {
    const node = root?.querySelector(selector);
    return structured ? structuredTextFromNode(node) : cleanText(node?.textContent || "");
  }

  function extractMacroFields(root) {
    const fields = [];
    const nodes = root ? [...root.querySelectorAll("[data-field], .macro-field")] : [];
    for (const node of nodes) {
      const label = textFrom(node, "[data-label], .macro-label, h3, strong");
      const text = textFrom(node, "[data-text], .macro-body, pre, p", { structured: true });
      if (label || text) fields.push({ label: label || "Text", text });
    }
    return fields;
  }

  function compactComparableText(value) {
    return String(value || "")
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[\s\u200e\u200f]+/g, "")
      .replace(/[.,،؛;:!?؟'"`~_\-–—()\[\]{}]/g, "");
  }

  function recoverCompleteText(candidate, base) {
    const current = cleanText(candidate || "").trim();
    const fallback = cleanText(base || "").trim();
    if (!current) return fallback;
    if (!fallback) return current;
    const currentCompact = compactComparableText(current);
    const fallbackCompact = compactComparableText(fallback);
    if (currentCompact === fallbackCompact) return fallback;
    if (currentCompact.length >= 24 && currentCompact.length < fallbackCompact.length * 0.72 && fallbackCompact.includes(currentCompact)) {
      return fallback;
    }
    return current;
  }

  function canonicalMacroField(label) {
    const key = String(label || "").toLowerCase().replace(/[\s_\-:：]+/g, "").trim();
    const aliases = {
      answer: "answer", "الإجابة": "answer", "الاجابة": "answer",
      ticket: "ticket", "التذكرة": "ticket",
      form: "form", "النموذج": "form",
      mention: "mention", "المنشن": "mention", "الإشارة": "mention",
      escalation: "escalation", "التصعيد": "escalation",
      internalnotes: "internalnotes", "ملاحظاتداخلية": "internalnotes",
      text: "text", "النص": "text"
    };
    return aliases[key] || key;
  }

  function mergeMacroFields(candidateFields, baseFields) {
    const candidate = Array.isArray(candidateFields) ? candidateFields.map((field) => ({ ...field })) : [];
    const base = Array.isArray(baseFields) ? baseFields : [];
    const byKey = new Map(candidate.map((field) => [canonicalMacroField(field.label), field]));
    for (const baseField of base) {
      const key = canonicalMacroField(baseField.label);
      const existing = byKey.get(key);
      if (!existing) {
        const copy = clone(baseField);
        candidate.push(copy);
        byKey.set(key, copy);
      } else {
        existing.text = recoverCompleteText(existing.text, baseField.text);
        if (!String(existing.label || "").trim()) existing.label = baseField.label;
      }
    }
    return candidate;
  }

  function mergePaneCompleteness(pane, basePane) {
    if (!pane || !basePane) return pane;
    if (pane.format === "support_macro") {
      for (const language of ["english", "arabic"]) {
        const current = pane[language] && typeof pane[language] === "object" ? pane[language] : {};
        const base = basePane[language] && typeof basePane[language] === "object" ? basePane[language] : {};
        pane[language] = {
          title: String(current.title || base.title || pane.title || ""),
          fields: mergeMacroFields(current.fields, base.fields)
        };
      }
    } else {
      pane.english = recoverCompleteText(pane.english, basePane.english);
      pane.arabic = recoverCompleteText(pane.arabic, basePane.arabic);
    }
    return pane;
  }

  function parseOverrideHtml(basePane, html) {
    if (!basePane || !html) return null;
    const template = createTemplate(html);
    const root = template.content.querySelector("[data-sugo-pane-override]");

    if (root) {
      const format = root.dataset.format === "support_macro" ? "support_macro" : "dual";
      const pane = clone(basePane);
      pane.format = format;
      if (format === "dual") {
        pane.english = textFrom(root, '[data-language="english"] [data-content]', { structured: true });
        pane.arabic = textFrom(root, '[data-language="arabic"] [data-content]', { structured: true });
      } else {
        const en = root.querySelector('[data-language="english"]');
        const ar = root.querySelector('[data-language="arabic"]');
        pane.english = {
          title: textFrom(en, "[data-title]") || basePane.english?.title || basePane.title,
          fields: extractMacroFields(en)
        };
        pane.arabic = {
          title: textFrom(ar, "[data-title]") || basePane.arabic?.title || basePane.title,
          fields: extractMacroFields(ar)
        };
      }
      pane._adminOverride = true;
      pane._overrideHtml = html;
      return mergePaneCompleteness(pane, basePane);
    }

    const pane = clone(basePane);
    const all = template.content;
    if (basePane.format === "support_macro") {
      const columns = [...all.querySelectorAll(".macro-col, [dir]")];
      const englishColumn = columns.find((node) => String(node.getAttribute("dir") || "").toLowerCase() !== "rtl") || all;
      const arabicColumn = columns.find((node) => String(node.getAttribute("dir") || "").toLowerCase() === "rtl");
      const englishFields = extractMacroFields(englishColumn);
      const arabicFields = extractMacroFields(arabicColumn);
      if (englishFields.length || arabicFields.length) {
        pane.english = {
          title: textFrom(englishColumn, ".macro-title, h2") || pane.english?.title || pane.title,
          fields: englishFields.length ? englishFields : clone(pane.english?.fields || [])
        };
        pane.arabic = {
          title: textFrom(arabicColumn, ".macro-title, h2") || pane.arabic?.title || pane.title,
          fields: arabicFields.length ? arabicFields : clone(pane.arabic?.fields || [])
        };
      } else {
        pane.english = { title: pane.english?.title || pane.title, fields: [{ label: "Text", text: structuredTextFromNode(all) }] };
      }
    } else {
      const rtl = all.querySelector('[dir="rtl"], .lang-block.ar, .ar');
      const ltr = all.querySelector('[dir="ltr"], .lang-block.en, .en');
      const wholeText = structuredTextFromNode(all);
      pane.english = ltr ? structuredTextFromNode(ltr) : cleanText(!rtl ? wholeText : pane.english || "");
      pane.arabic = rtl ? structuredTextFromNode(rtl) : cleanText(pane.arabic || "");
    }
    pane._adminOverride = true;
    pane._overrideHtml = html;
    return mergePaneCompleteness(pane, basePane);
  }

  function rebuildParsedOverrides() {
    state.parsedPaneOverrides = Object.create(null);
    const content = baseContent();
    for (const [paneId, record] of Object.entries(state.paneOverrides || {})) {
      const basePane = content?.getPane?.(paneId);
      if (!basePane || !record?.html) continue;
      const parsed = parseOverrideHtml(basePane, record.html);
      if (parsed) state.parsedPaneOverrides[paneId] = parsed;
    }
  }

  function serializePane(pane) {
    const format = pane?.format === "support_macro" ? "support_macro" : "dual";
    const parts = [`<article data-sugo-pane-override="1" data-format="${format}">`];
    if (format === "dual") {
      parts.push(
        `<section data-language="english" dir="ltr"><pre data-content>${escapeHtml(pane.english || "")}</pre></section>`,
        `<section data-language="arabic" dir="rtl"><pre data-content>${escapeHtml(pane.arabic || "")}</pre></section>`
      );
    } else {
      for (const [key, dir] of [["english", "ltr"], ["arabic", "rtl"]]) {
        const block = pane[key] && typeof pane[key] === "object" ? pane[key] : {};
        parts.push(`<section data-language="${key}" dir="${dir}">`);
        parts.push(`<h2 data-title>${escapeHtml(block.title || pane.title || "")}</h2>`);
        for (const field of Array.isArray(block.fields) ? block.fields : []) {
          parts.push(`<div data-field><h3 data-label>${escapeHtml(field.label || "Text")}</h3><pre data-text>${escapeHtml(field.text || "")}</pre></div>`);
        }
        parts.push("</section>");
      }
    }
    parts.push("</article>");
    return parts.join("");
  }

  function paneText(pane, language = "all") {
    if (!pane) return "";
    const blockText = (block) => {
      if (pane.format === "dual") return String(block || "");
      if (!block || typeof block !== "object") return "";
      const values = [];
      if (block.title) values.push(String(block.title));
      for (const field of Array.isArray(block.fields) ? block.fields : []) {
        if (field.label) values.push(String(field.label));
        if (field.text) values.push(String(field.text));
      }
      return values.join("\n\n").trim();
    };
    const english = blockText(pane.english);
    const arabic = blockText(pane.arabic);
    if (["english", "en"].includes(language)) return english;
    if (["arabic", "ar"].includes(language)) return arabic;
    return [english, arabic].filter(Boolean).join("\n\n");
  }

  function isControl(item, kind = "") {
    if (!item) return false;
    const control = item.rootKey === CTRL_RENAME || item.rootKey === CTRL_DELETE;
    return kind ? control && item.rootKey === kind : control;
  }

  function controlTarget(item) {
    return {
      level: String(item.categoryKey || item.type || ""),
      key: String(item.sectionKey || item.paneId || item.id || "")
    };
  }

  function findControl(kind, level, key) {
    return state.menuState.items.find((item) => {
      const target = controlTarget(item);
      return isControl(item, kind) && target.level === level && target.key === key;
    }) || null;
  }

  function removeControl(kind, level, key) {
    state.menuState.items = state.menuState.items.filter((item) => {
      const target = controlTarget(item);
      return !(isControl(item, kind) && target.level === level && target.key === key);
    });
  }

  function setRename(level, key, label) {
    removeControl(CTRL_RENAME, level, key);
    state.menuState.items.push({
      type: level,
      id: `rename-${level}-${normalizeId(key, level)}`,
      label: cleanText(label, 180),
      rootKey: CTRL_RENAME,
      categoryKey: level,
      sectionKey: key,
      paneId: key,
      updatedAt: new Date().toISOString()
    });
  }

  function setDelete(level, key) {
    removeControl(CTRL_DELETE, level, key);
    removeControl(CTRL_RENAME, level, key);
    state.menuState.items.push({
      type: level,
      id: `delete-${level}-${normalizeId(key, level)}`,
      label: "",
      rootKey: CTRL_DELETE,
      categoryKey: level,
      sectionKey: key,
      paneId: key,
      updatedAt: new Date().toISOString()
    });
  }

  function findCustomMenuItem(level, key) {
    return state.menuState.items.find((item) => !isControl(item) && item.type === level && (item.id === key || item.paneId === key)) || null;
  }

  function renameMenuTarget(level, key, label) {
    const custom = findCustomMenuItem(level, key);
    if (custom) {
      custom.label = cleanText(label, 180);
      custom.updatedAt = new Date().toISOString();
      return;
    }
    setRename(level, key, label);
  }

  function deleteMenuTarget(level, key) {
    const custom = findCustomMenuItem(level, key);
    if (!custom) {
      setDelete(level, key);
      return;
    }
    const removed = new Set([custom.id, custom.paneId].filter(Boolean));
    let changed = true;
    while (changed) {
      changed = false;
      for (const item of state.menuState.items) {
        if (isControl(item) || removed.has(item.id)) continue;
        if (removed.has(item.rootKey) || removed.has(item.categoryKey) || removed.has(item.sectionKey)) {
          removed.add(item.id);
          if (item.paneId) removed.add(item.paneId);
          changed = true;
        }
      }
    }
    state.menuState.items = state.menuState.items.filter((item) => {
      if (isControl(item)) return true;
      return !removed.has(item.id) && !removed.has(item.paneId);
    });
  }

  function applyControlsAndCustomItems(navigation) {
    const roots = clone(navigation || []);

    const rootResult = roots.filter((root) => !findControl(CTRL_DELETE, "root", root.id));
    for (const root of rootResult) {
      const rootRename = findControl(CTRL_RENAME, "root", root.id);
      if (rootRename?.label) root.title = rootRename.label;

      root.categories = (root.categories || []).filter((category) => !findControl(CTRL_DELETE, "category", category.id));
      for (const category of root.categories) {
        const categoryRename = findControl(CTRL_RENAME, "category", category.id);
        if (categoryRename?.label) category.title = categoryRename.label;
        category.sections = (category.sections || []).filter((section) => !findControl(CTRL_DELETE, "section", section.id));
        for (const section of category.sections) {
          const sectionRename = findControl(CTRL_RENAME, "section", section.id);
          if (sectionRename?.label) section.title = sectionRename.label;
          section.topics = (section.topics || []).filter((topic) => !findControl(CTRL_DELETE, "topic", topic.id));
          for (const topic of section.topics) {
            const topicRename = findControl(CTRL_RENAME, "topic", topic.id);
            if (topicRename?.label) topic.title = topicRename.label;
          }
        }
      }
    }

    const customItems = state.menuState.items.filter((item) => !isControl(item));
    for (const item of customItems.filter((row) => row.type === "root")) {
      if (!rootResult.some((root) => root.id === item.id)) {
        rootResult.push({ id: item.id, title: item.label || "New Menu", shortTitle: item.label || "New Menu", categories: [] });
      }
    }
    for (const item of customItems.filter((row) => row.type === "category")) {
      const root = rootResult.find((row) => row.id === item.rootKey);
      if (root && !root.categories.some((category) => category.id === item.id)) {
        root.categories.push({ id: item.id, title: item.label || "New Category", sections: [] });
      }
    }
    for (const item of customItems.filter((row) => row.type === "section")) {
      const root = rootResult.find((row) => row.id === item.rootKey);
      const category = root?.categories?.find((row) => row.id === item.categoryKey);
      if (category && !category.sections.some((section) => section.id === item.id)) {
        category.sections.push({ id: item.id, title: item.label || "New Section", topics: [] });
      }
    }
    for (const item of customItems.filter((row) => row.type === "topic")) {
      const root = rootResult.find((row) => row.id === item.rootKey);
      const category = root?.categories?.find((row) => row.id === item.categoryKey);
      const section = category?.sections?.find((row) => row.id === item.sectionKey);
      const paneId = item.paneId || item.id;
      if (section && !section.topics.some((topic) => topic.id === paneId)) {
        section.topics.push({ id: paneId, title: item.label || "New Topic" });
      }
      if (root && category && section) {
        const basePane = {
          id: paneId,
          visible: true,
          format: "dual",
          title: item.label || "New Topic",
          library: root.id,
          rootTitle: root.title,
          categoryId: category.id,
          category: category.title,
          sectionId: section.id,
          section: section.title,
          path: [root.title, category.title, section.title, item.label || "New Topic"],
          english: item.body || "",
          arabic: ""
        };
        state.customPanes[paneId] = item.html ? (parseOverrideHtml(basePane, item.html) || basePane) : basePane;
      }
    }

    return rootResult;
  }

  function rebuildTransformedData() {
    const source = baseData();
    if (!source?.navigation) {
      state.transformedData = null;
      return null;
    }
    state.customPanes = Object.create(null);
    const navigation = applyControlsAndCustomItems(source.navigation);
    const topicsById = Object.create(null);
    let categoryCount = 0;
    let sectionCount = 0;
    let topicCount = 0;
    const byLibrary = Object.create(null);

    for (const root of navigation) {
      let rootTopics = 0;
      for (const category of root.categories || []) {
        categoryCount += 1;
        for (const section of category.sections || []) {
          sectionCount += 1;
          for (const topic of section.topics || []) {
            topicCount += 1;
            rootTopics += 1;
            const pane = getPane(topic.id);
            topicsById[topic.id] = {
              id: topic.id,
              title: topic.title,
              library: root.id,
              rootTitle: root.title,
              categoryId: category.id,
              category: category.title,
              sectionId: section.id,
              section: section.title,
              path: [root.title, category.title, section.title, topic.title],
              visible: true,
              format: pane?.format || "dual"
            };
          }
        }
      }
      byLibrary[root.id] = { topicCount: rootTopics };
    }

    state.transformedData = {
      version: "phase-18-admin-overlay",
      navigation,
      topicsById,
      stats: {
        rootCount: navigation.length,
        categoryCount,
        sectionCount,
        topicCount,
        byLibrary
      },
      getLibrary(id) {
        return navigation.find((root) => root.id === id) || null;
      },
      getTopic(id) {
        return topicsById[String(id || "")] || null;
      }
    };
    return state.transformedData;
  }

  function getPane(paneId) {
    const id = String(paneId || "").trim();
    if (!id) return null;
    const raw = state.parsedPaneOverrides[id] || state.customPanes[id] || baseContent()?.getPane?.(id) || null;
    if (!raw) return null;
    const meta = state.transformedData?.topicsById?.[id];
    if (!meta) return raw;
    return {
      ...raw,
      title: meta.title || raw.title,
      library: meta.library || raw.library,
      rootTitle: meta.rootTitle || raw.rootTitle,
      categoryId: meta.categoryId || raw.categoryId,
      category: meta.category || raw.category,
      sectionId: meta.sectionId || raw.sectionId,
      section: meta.section || raw.section,
      path: Array.isArray(meta.path) ? meta.path.slice() : raw.path
    };
  }

  function listPanes({ visibleOnly = false } = {}) {
    const ids = new Set();
    const values = [];
    for (const pane of baseContent()?.listPanes?.({ visibleOnly: false }) || []) {
      const resolved = getPane(pane.id);
      if (!resolved || ids.has(resolved.id)) continue;
      ids.add(resolved.id);
      values.push(resolved);
    }
    for (const pane of Object.values(state.customPanes)) {
      if (!pane || ids.has(pane.id)) continue;
      ids.add(pane.id);
      values.push(pane);
    }
    return visibleOnly ? values.filter((pane) => pane.visible !== false) : values;
  }

  function getPaneText(paneId, language = "all") {
    return paneText(getPane(paneId), language);
  }

  function getSearchDocument(paneId) {
    const pane = getPane(paneId);
    if (!pane) return null;
    return {
      id: pane.id,
      title: pane.title,
      library: pane.library,
      category: pane.category,
      section: pane.section,
      path: Array.isArray(pane.path) ? pane.path.slice() : [],
      visible: pane.visible !== false,
      englishText: paneText(pane, "english"),
      arabicText: paneText(pane, "arabic")
    };
  }

  function getKnowledgeBaseData() {
    return state.transformedData || baseData();
  }

  function snapshot() {
    return {
      loaded: state.loaded,
      paneOverrideCount: Object.keys(state.paneOverrides).length,
      menuItemCount: state.menuState.items.length,
      contentError: state.contentError,
      menuError: state.menuError
    };
  }

  function dispatchDataReady(source) {
    window.SUGO?.KnowledgeBaseMatcher?.invalidate?.();
    window.SUGO?.Search?.invalidate?.();
    document.dispatchEvent(new CustomEvent("sugo:admindataready", {
      detail: { source, ...snapshot() }
    }));
  }

  function authHeaders(password) {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${String(password || "")}`
    };
  }

  function mediaApi() {
    return window.SUGO?.KnowledgeBaseMedia || null;
  }

  const MEDIA_ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
  const MEDIA_MAX_BYTES = 8 * 1024 * 1024;

  function validateMediaFile(file) {
    if (!(file instanceof File)) throw new Error("Choose an image file first.");
    if (!MEDIA_ALLOWED_TYPES.has(String(file.type || "").toLowerCase())) {
      throw new Error("Only PNG, JPG, and WebP images are allowed.");
    }
    if (file.size > MEDIA_MAX_BYTES) throw new Error("Image size must not exceed 8 MB.");
    return file;
  }

  async function uploadMediaFile(topicId, file, passwordValue = "") {
    const password = resolvedPassword(passwordValue);
    if (!password) throw new Error("Admin password is required.");
    validateMediaFile(file);
    const form = new FormData();
    form.append("topicId", String(topicId || ""));
    form.append("file", file, file.name);
    const response = await fetchWithTimeout(`${workerUrl()}/admin/media/upload`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${password}` },
      body: form
    }, 60000);
    try {
      return await readJsonResponse(response);
    } catch (error) {
      if (error.status === 401) clearPassword();
      throw error;
    }
  }

  async function saveTopicMedia(topicId, guides, passwordValue = "") {
    const password = resolvedPassword(passwordValue);
    if (!password) throw new Error("Admin password is required.");
    const response = await fetchWithTimeout(`${workerUrl()}/admin/media/topic`, {
      method: "POST",
      headers: authHeaders(password),
      body: JSON.stringify({ topicId, guides })
    }, 45000);
    let payload;
    try { payload = await readJsonResponse(response); }
    catch (error) {
      if (error.status === 401) clearPassword();
      throw error;
    }
    mediaApi()?.setTopicOverride?.(topicId, payload.topic || { guides, updatedAt: payload.updatedAt });
    return payload;
  }

  async function resetTopicMedia(topicId, passwordValue = "") {
    const password = resolvedPassword(passwordValue);
    if (!password) throw new Error("Admin password is required.");
    const response = await fetchWithTimeout(`${workerUrl()}/admin/media/topic/reset`, {
      method: "POST",
      headers: authHeaders(password),
      body: JSON.stringify({ topicId })
    }, 45000);
    let payload;
    try { payload = await readJsonResponse(response); }
    catch (error) {
      if (error.status === 401) clearPassword();
      throw error;
    }
    mediaApi()?.clearTopicOverride?.(topicId);
    return payload;
  }

  function resolvedPassword(value = "") {
    const password = String(value || state.adminPassword || window.__SUGO_ADMIN_PASSWORD || "");
    if (password) {
      state.adminPassword = password;
      window.__SUGO_ADMIN_PASSWORD = password;
    }
    return password;
  }

  function clearPassword() {
    state.adminPassword = "";
    window.__SUGO_ADMIN_PASSWORD = "";
  }

  async function savePane(pane, passwordValue = "") {
    const password = resolvedPassword(passwordValue);
    if (!password) throw new Error("Admin password is required.");
    const html = serializePane(pane);
    const response = await fetchWithTimeout(`${workerUrl()}/admin/pane`, {
      method: "POST",
      headers: authHeaders(password),
      body: JSON.stringify({ paneId: pane.id, html })
    });
    let payload;
    try { payload = await readJsonResponse(response); }
    catch (error) {
      if (error.status === 401) clearPassword();
      throw error;
    }
    state.paneOverrides[pane.id] = { html, updatedAt: payload.updatedAt || new Date().toISOString() };
    state.parsedPaneOverrides[pane.id] = { ...clone(pane), _adminOverride: true, _overrideHtml: html };
    rebuildTransformedData();
    dispatchDataReady("pane-save");
    document.dispatchEvent(new CustomEvent("sugo:adminpanechange", { detail: { paneId: pane.id, action: "save" } }));
    return payload;
  }

  async function resetPane(paneId, passwordValue = "") {
    const password = resolvedPassword(passwordValue);
    if (!password) throw new Error("Admin password is required.");
    const response = await fetchWithTimeout(`${workerUrl()}/admin/pane/reset`, {
      method: "POST",
      headers: authHeaders(password),
      body: JSON.stringify({ paneId })
    });
    let payload;
    try { payload = await readJsonResponse(response); }
    catch (error) {
      if (error.status === 401) clearPassword();
      throw error;
    }
    delete state.paneOverrides[paneId];
    delete state.parsedPaneOverrides[paneId];
    rebuildTransformedData();
    dispatchDataReady("pane-reset");
    document.dispatchEvent(new CustomEvent("sugo:adminpanechange", { detail: { paneId, action: "reset" } }));
    return payload;
  }

  async function saveMenu(passwordValue = "") {
    const password = resolvedPassword(passwordValue);
    if (!password) throw new Error("Admin password is required.");
    state.menuState.updatedAt = new Date().toISOString();
    const response = await fetchWithTimeout(`${workerUrl()}/admin/menu`, {
      method: "POST",
      headers: authHeaders(password),
      body: JSON.stringify({ menu: state.menuState })
    });
    let payload;
    try { payload = await readJsonResponse(response); }
    catch (error) {
      if (error.status === 401) clearPassword();
      throw error;
    }
    writeMenuCache(state.menuState);
    rebuildTransformedData();
    dispatchDataReady("menu-save");
    document.dispatchEvent(new CustomEvent("sugo:adminmenuchange", { detail: { action: "save" } }));
    return payload;
  }

  function closeDialog() {
    if (state.activeDialog?.isConnected) state.activeDialog.remove();
    state.activeDialog = null;
    document.body.classList.remove("has-admin-dialog");
  }

  function createDialog(title) {
    closeDialog();
    const backdrop = document.createElement("div");
    backdrop.className = "admin-dialog-backdrop";
    backdrop.innerHTML = `
      <section class="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="adminDialogTitle">
        <header class="admin-dialog__header">
          <div><span class="admin-dialog__kicker">SUGO SOP</span><h2 id="adminDialogTitle"></h2></div>
          <button class="admin-dialog__close" type="button" aria-label="Close">×</button>
        </header>
        <div class="admin-dialog__body"></div>
      </section>
    `;
    backdrop.querySelector("#adminDialogTitle").textContent = title;
    backdrop.querySelector(".admin-dialog__close").addEventListener("click", closeDialog);
    backdrop.addEventListener("mousedown", (event) => {
      if (event.target === backdrop) closeDialog();
    });
    backdrop.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
      }
    });
    document.body.append(backdrop);
    document.body.classList.add("has-admin-dialog");
    state.activeDialog = backdrop;
    window.setTimeout(() => backdrop.querySelector("input, textarea, select, button")?.focus(), 0);
    return backdrop.querySelector(".admin-dialog__body");
  }

  function statusMessage(container, message, type = "") {
    let status = container.querySelector(".admin-dialog__status");
    if (!status) {
      status = document.createElement("div");
      status.className = "admin-dialog__status";
      status.setAttribute("role", "status");
      container.append(status);
    }
    status.textContent = message;
    status.dataset.type = type;
    return status;
  }

  function makePasswordField() {
    const field = document.createElement("label");
    field.className = "admin-field";
    field.innerHTML = `<span>Admin password</span><input type="password" autocomplete="current-password" data-admin-password>`;
    const input = field.querySelector("input");
    input.value = state.adminPassword;
    return field;
  }

  function editablePaneFromForm(form, original) {
    const pane = clone(original);
    if (pane.format === "dual") {
      pane.english = form.querySelector('[name="english"]')?.value || "";
      pane.arabic = form.querySelector('[name="arabic"]')?.value || "";
      return pane;
    }
    for (const language of ["english", "arabic"]) {
      const section = form.querySelector(`[data-admin-language-section="${language}"]`);
      const title = section?.querySelector('[data-admin-title]')?.value || pane[language]?.title || pane.title;
      const fields = [...(section?.querySelectorAll("[data-admin-field-row]") || [])].map((row) => ({
        label: row.querySelector('[data-admin-field-label]')?.value || "Text",
        text: row.querySelector('[data-admin-field-text]')?.value || ""
      }));
      pane[language] = { title, fields };
    }
    return pane;
  }

  function createMacroLanguageEditor(language, block) {
    const section = document.createElement("section");
    section.className = "admin-language-editor";
    section.dataset.adminLanguageSection = language;
    section.dir = language === "arabic" ? "rtl" : "ltr";
    const heading = document.createElement("h3");
    heading.textContent = language === "arabic" ? "Arabic content" : "English content";
    section.append(heading);

    const titleField = document.createElement("label");
    titleField.className = "admin-field";
    titleField.innerHTML = `<span>Title</span><input type="text" data-admin-title>`;
    titleField.querySelector("input").value = block?.title || "";
    section.append(titleField);

    const list = document.createElement("div");
    list.className = "admin-macro-fields";
    for (const field of Array.isArray(block?.fields) ? block.fields : []) {
      list.append(createMacroFieldRow(field));
    }
    section.append(list);

    const add = document.createElement("button");
    add.type = "button";
    add.className = "admin-secondary-button";
    add.textContent = "Add";
    add.addEventListener("click", () => list.append(createMacroFieldRow({ label: "Text", text: "" })));
    section.append(add);
    return section;
  }

  function createMacroFieldRow(field) {
    const row = document.createElement("div");
    row.className = "admin-macro-field";
    row.dataset.adminFieldRow = "true";
    row.innerHTML = `
      <label class="admin-field"><span>Label</span><input type="text" data-admin-field-label></label>
      <label class="admin-field admin-field--wide"><span>Text</span><textarea rows="6" data-admin-field-text></textarea></label>
      <button class="admin-remove-button" type="button">Delete</button>
    `;
    row.querySelector('[data-admin-field-label]').value = field?.label || "Text";
    row.querySelector('[data-admin-field-text]').value = field?.text || "";
    row.querySelector(".admin-remove-button").addEventListener("click", () => row.remove());
    return row;
  }


  function markMediaDirty(node) {
    const section = node?.closest?.("[data-admin-media-manager]");
    if (!section) return;
    section.dataset.mediaDirty = "true";
    const badge = section.querySelector("[data-admin-media-state]");
    if (badge) {
      badge.textContent = "Unsaved changes";
      badge.dataset.dirty = "true";
    }
    updateMediaManagerCount(section);
  }

  function updateMediaManagerCount(section) {
    if (!section) return;
    const guides = section.querySelectorAll("[data-admin-media-guide]").length;
    const images = section.querySelectorAll("[data-admin-media-image]").length;
    const output = section.querySelector("[data-admin-media-count]");
    if (output) output.textContent = `${guides} guide${guides === 1 ? "" : "s"} · ${images} image${images === 1 ? "" : "s"}`;
  }

  function setMediaPreview(row, source, label = "") {
    const image = row.querySelector("[data-admin-media-preview]");
    const empty = row.querySelector("[data-admin-media-empty]");
    const name = row.querySelector("[data-admin-media-file-name]");
    if (source) {
      image.src = source;
      image.hidden = false;
      empty.hidden = true;
    } else {
      image.removeAttribute("src");
      image.hidden = true;
      empty.hidden = false;
    }
    if (name) name.textContent = label || "No replacement selected";
  }

  function createMediaImageRow(imageData = {}, guideTitle = "Visual Guide") {
    const row = document.createElement("article");
    row.className = "admin-media-image";
    row.dataset.adminMediaImage = "true";
    row._mediaData = clone(imageData || {});
    row._mediaFile = null;
    row.innerHTML = `
      <div class="admin-media-image__preview">
        <img data-admin-media-preview alt="" loading="lazy" decoding="async">
        <span data-admin-media-empty>No image selected</span>
      </div>
      <div class="admin-media-image__content">
        <div class="admin-media-image__meta">
          <strong data-admin-media-file-name></strong>
          <span>PNG, JPG or WebP · maximum 8 MB</span>
        </div>
        <div class="admin-media-caption-grid">
          <label class="admin-field"><span>English caption</span><input type="text" data-admin-media-caption-en></label>
          <label class="admin-field" dir="rtl"><span>الوصف العربي</span><input type="text" data-admin-media-caption-ar dir="rtl"></label>
        </div>
        <input type="file" accept="image/png,image/jpeg,image/webp" data-admin-media-file hidden>
        <div class="admin-media-image__actions">
          <button type="button" class="admin-secondary-button" data-admin-media-replace>Replace</button>
          <button type="button" class="admin-icon-button" data-admin-media-up title="Move up" aria-label="Move image up">↑</button>
          <button type="button" class="admin-icon-button" data-admin-media-down title="Move down" aria-label="Move image down">↓</button>
          <button type="button" class="admin-remove-button" data-admin-media-delete>Delete</button>
        </div>
      </div>
    `;

    const captionEn = row.querySelector("[data-admin-media-caption-en]");
    const captionAr = row.querySelector("[data-admin-media-caption-ar]");
    captionEn.value = imageData.captionEn || imageData.alt || `Visual reference — ${guideTitle}`;
    captionAr.value = imageData.captionAr || `مرجع مرئي — ${guideTitle}`;
    setMediaPreview(row, imageData.src || "", imageData.fileName || imageData.alt || "Existing image");

    const fileInput = row.querySelector("[data-admin-media-file]");
    row.querySelector("[data-admin-media-replace]").addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        validateMediaFile(file);
      } catch (error) {
        window.alert(error.message || "Invalid image.");
        fileInput.value = "";
        return;
      }
      if (row._mediaObjectUrl) URL.revokeObjectURL(row._mediaObjectUrl);
      row._mediaObjectUrl = URL.createObjectURL(file);
      row._mediaFile = file;
      setMediaPreview(row, row._mediaObjectUrl, file.name);
      markMediaDirty(row);
    });
    captionEn.addEventListener("input", () => markMediaDirty(row));
    captionAr.addEventListener("input", () => markMediaDirty(row));
    row.querySelector("[data-admin-media-delete]").addEventListener("click", () => {
      if (!window.confirm("Remove this image from the visual guide? The change is applied after Save.")) return;
      if (row._mediaObjectUrl) URL.revokeObjectURL(row._mediaObjectUrl);
      const section = row.closest("[data-admin-media-manager]");
      row.remove();
      markMediaDirty(section);
    });
    row.querySelector("[data-admin-media-up]").addEventListener("click", () => {
      const previous = row.previousElementSibling;
      if (previous) {
        row.parentElement.insertBefore(row, previous);
        markMediaDirty(row);
      }
    });
    row.querySelector("[data-admin-media-down]").addEventListener("click", () => {
      const next = row.nextElementSibling;
      if (next) {
        row.parentElement.insertBefore(next, row);
        markMediaDirty(row);
      }
    });
    return row;
  }

  function createMediaGuideCard(guide = {}, pane = {}) {
    const card = document.createElement("section");
    card.className = "admin-media-guide";
    card.dataset.adminMediaGuide = "true";
    card.dataset.guideId = guide.id || `admin-${pane.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    card.innerHTML = `
      <header class="admin-media-guide__header">
        <div class="admin-media-guide__fields">
          <label class="admin-field"><span>Guide title</span><input type="text" data-admin-media-guide-title></label>
          <label class="admin-field"><span>Category</span><input type="text" data-admin-media-guide-category></label>
        </div>
        <button type="button" class="admin-danger-button" data-admin-media-delete-guide>Delete guide</button>
      </header>
      <div class="admin-media-guide__images" data-admin-media-images></div>
      <button type="button" class="admin-secondary-button admin-media-add-image" data-admin-media-add-image>+ Add image</button>
    `;
    const title = card.querySelector("[data-admin-media-guide-title]");
    const category = card.querySelector("[data-admin-media-guide-category]");
    title.value = guide.title || pane.title || "Visual Guide";
    category.value = guide.category || pane.category || "Visual Guides";
    const list = card.querySelector("[data-admin-media-images]");
    for (const image of Array.isArray(guide.images) ? guide.images : []) list.append(createMediaImageRow(image, title.value));
    title.addEventListener("input", () => markMediaDirty(card));
    category.addEventListener("input", () => markMediaDirty(card));
    card.querySelector("[data-admin-media-add-image]").addEventListener("click", () => {
      const row = createMediaImageRow({}, title.value || pane.title || "Visual Guide");
      list.append(row);
      markMediaDirty(card);
      row.querySelector("[data-admin-media-file]").click();
    });
    card.querySelector("[data-admin-media-delete-guide]").addEventListener("click", () => {
      if (!window.confirm("Delete this complete visual guide? The change is applied after Save.")) return;
      const section = card.closest("[data-admin-media-manager]");
      card.querySelectorAll("[data-admin-media-image]").forEach((row) => {
        if (row._mediaObjectUrl) URL.revokeObjectURL(row._mediaObjectUrl);
      });
      card.remove();
      markMediaDirty(section);
    });
    return card;
  }

  function createMediaManager(pane, form) {
    const media = mediaApi();
    const guides = media?.getGuidesForTopic?.(pane.id) || [];
    const hasOverride = Boolean(media?.hasTopicOverride?.(pane.id));
    const section = document.createElement("section");
    section.className = "admin-media-manager";
    section.dataset.adminMediaManager = "true";
    section.dataset.mediaDirty = "false";
    section.innerHTML = `
      <header class="admin-media-manager__header">
        <div>
          <span class="admin-media-manager__kicker">Visual Guides</span>
          <h3>Article screenshots</h3>
          <p>Add, replace, arrange, or remove explanation images. New files upload only when you press Save.</p>
        </div>
        <div class="admin-media-manager__summary">
          <span data-admin-media-count></span>
          <span data-admin-media-state>Saved</span>
        </div>
      </header>
      <div class="admin-media-manager__toolbar">
        <button type="button" class="admin-secondary-button" data-admin-media-add-guide>+ Add visual guide</button>
        ${hasOverride ? '<button type="button" class="admin-danger-button" data-admin-media-reset>Restore original images</button>' : ''}
      </div>
      <div class="admin-media-manager__list" data-admin-media-guide-list></div>
      <p class="admin-media-manager__note">Deleting an uploaded image removes it from this topic. Unused files are automatically deleted from Cloudflare KV after saving.</p>
    `;
    const list = section.querySelector("[data-admin-media-guide-list]");
    for (const guide of guides) list.append(createMediaGuideCard(clone(guide), pane));
    section.querySelector("[data-admin-media-add-guide]").addEventListener("click", () => {
      const card = createMediaGuideCard({ title: pane.title, category: pane.category, images: [] }, pane);
      list.append(card);
      markMediaDirty(section);
      card.querySelector("[data-admin-media-add-image]").click();
    });
    section.querySelector("[data-admin-media-reset]")?.addEventListener("click", async () => {
      if (!window.confirm("Restore the original bundled screenshots for this topic? Uploaded images that are no longer used will be deleted.")) return;
      const password = form.querySelector("[data-admin-password]").value;
      statusMessage(form, "Restoring original visual guides…");
      try {
        await resetTopicMedia(pane.id, password);
        closeDialog();
      } catch (error) {
        statusMessage(form, error.message || "Visual guides reset failed.", "error");
      }
    });
    updateMediaManagerCount(section);
    return section;
  }

  async function collectAndSaveMediaManager(section, topicId, password) {
    if (!section || section.dataset.mediaDirty !== "true") return { saved: false, skipped: true };
    const guides = [];
    const cards = [...section.querySelectorAll("[data-admin-media-guide]")];
    for (let guideIndex = 0; guideIndex < cards.length; guideIndex += 1) {
      const card = cards[guideIndex];
      const title = cleanText(card.querySelector("[data-admin-media-guide-title]")?.value || "Visual Guide", 300);
      const category = cleanText(card.querySelector("[data-admin-media-guide-category]")?.value || "Visual Guides", 300);
      const images = [];
      const rows = [...card.querySelectorAll("[data-admin-media-image]")];
      for (let imageIndex = 0; imageIndex < rows.length; imageIndex += 1) {
        const row = rows[imageIndex];
        let data = { ...(row._mediaData || {}) };
        if (row._mediaFile) {
          const upload = await uploadMediaFile(topicId, row._mediaFile, password);
          data = { ...data, ...(upload.image || {}) };
          row._mediaData = data;
          row._mediaFile = null;
        }
        if (!data.src && !data.storageKey) continue;
        images.push({
          id: cleanText(data.id, 180) || `image-${imageIndex + 1}`,
          src: cleanText(data.src, 3000),
          storageKey: cleanText(data.storageKey, 1000),
          mimeType: cleanText(data.mimeType, 100),
          fileName: cleanText(data.fileName, 300),
          alt: cleanText(data.alt, 500) || `${title} — step ${imageIndex + 1}`,
          captionEn: cleanText(row.querySelector("[data-admin-media-caption-en]")?.value, 1200),
          captionAr: cleanText(row.querySelector("[data-admin-media-caption-ar]")?.value, 1200),
          step: imageIndex + 1
        });
      }
      if (!images.length) continue;
      let guideId = cleanText(card.dataset.guideId, 220);
      if (!guideId.startsWith(`admin-${topicId}-`)) {
        guideId = `admin-${topicId}-${guideIndex + 1}-${normalizeId(title, "guide")}`.slice(0, 220);
      }
      guides.push({ id: guideId, title, category, topicIds: [topicId], images });
    }
    const payload = await saveTopicMedia(topicId, guides, password);
    section.dataset.mediaDirty = "false";
    const stateBadge = section.querySelector("[data-admin-media-state]");
    if (stateBadge) {
      stateBadge.textContent = "Saved";
      delete stateBadge.dataset.dirty;
    }
    return payload;
  }

  async function openTopicEditor(paneId) {
    await loadRemoteData().catch(() => snapshot());
    await mediaApi()?.load?.().catch(() => null);
    const pane = getPane(paneId);
    if (!pane) return false;
    state.activePaneId = pane.id;
    const body = createDialog("Edit topic");
    const form = document.createElement("form");
    form.className = "admin-topic-form";
    form.innerHTML = `<div class="admin-topic-meta"><strong></strong><span></span></div>`;
    form.querySelector("strong").textContent = pane.title;
    form.querySelector("span").textContent = [pane.category, pane.section].filter(Boolean).join(" · ");
    form.append(makePasswordField());

    if (pane.format === "dual") {
      const grid = document.createElement("div");
      grid.className = "admin-language-grid";
      const english = document.createElement("label");
      english.className = "admin-field admin-field--wide";
      english.innerHTML = `<span>English content</span><textarea name="english" rows="18" dir="ltr"></textarea>`;
      english.querySelector("textarea").value = pane.english || "";
      const arabic = document.createElement("label");
      arabic.className = "admin-field admin-field--wide";
      arabic.innerHTML = `<span>Arabic content</span><textarea name="arabic" rows="18" dir="rtl"></textarea>`;
      arabic.querySelector("textarea").value = pane.arabic || "";
      grid.append(english, arabic);
      form.append(grid);
    } else {
      const grid = document.createElement("div");
      grid.className = "admin-language-grid";
      grid.append(
        createMacroLanguageEditor("english", pane.english),
        createMacroLanguageEditor("arabic", pane.arabic)
      );
      form.append(grid);
    }

    const mediaManager = createMediaManager(pane, form);
    form.append(mediaManager);

    const actions = document.createElement("div");
    actions.className = "admin-dialog__actions";
    actions.innerHTML = `
      ${state.paneOverrides[pane.id] ? '<button type="button" class="admin-danger-button" data-admin-reset>Reset</button>' : ''}
      <span class="admin-dialog__actions-spacer"></span>
      <button type="button" class="admin-secondary-button" data-admin-cancel>Cancel</button>
      <button type="submit" class="admin-primary-button">Save</button>
    `;
    form.append(actions);

    actions.querySelector("[data-admin-cancel]").addEventListener("click", closeDialog);
    actions.querySelector("[data-admin-reset]")?.addEventListener("click", async () => {
      if (!window.confirm("Reset this section to original content?")) return;
      const password = form.querySelector("[data-admin-password]").value;
      statusMessage(form, "Resetting…");
      try {
        await resetPane(pane.id, password);
        closeDialog();
      } catch (error) {
        statusMessage(form, error.message || "Reset failed.", "error");
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const password = form.querySelector("[data-admin-password]").value;
      const edited = editablePaneFromForm(form, pane);
      const mediaSection = form.querySelector("[data-admin-media-manager]");
      statusMessage(form, mediaSection?.dataset.mediaDirty === "true" ? "Uploading images and saving…" : "Saving…");
      try {
        await collectAndSaveMediaManager(mediaSection, pane.id, password);
        await savePane(edited, password);
        closeDialog();
      } catch (error) {
        statusMessage(form, error.message || "Save failed.", "error");
      }
    });

    body.append(form);
    return true;
  }

  function hierarchyOptions() {
    const data = getKnowledgeBaseData();
    return Array.isArray(data?.navigation) ? data.navigation : [];
  }

  function fillSelect(select, items, placeholder, getValue = (item) => item.id, getLabel = (item) => item.title) {
    const current = select.value;
    select.replaceChildren(new Option(placeholder, ""));
    for (const item of items || []) select.append(new Option(getLabel(item), getValue(item)));
    if ([...select.options].some((option) => option.value === current)) select.value = current;
  }

  function createMenuItemRecord(level, name, path, content = {}) {
    const id = normalizeId(name, level);
    const now = new Date().toISOString();
    if (level === "category") {
      return { type: "category", id, label: name, rootKey: path.root, categoryKey: "", sectionKey: "", paneId: id, body: "", html: "", updatedAt: now };
    }
    if (level === "section") {
      return { type: "section", id, label: name, rootKey: path.root, categoryKey: path.category, sectionKey: "", paneId: id, body: "", html: "", updatedAt: now };
    }
    const paneId = id;
    const pane = {
      id: paneId,
      visible: true,
      format: "dual",
      title: name,
      library: path.root,
      rootTitle: "",
      categoryId: path.category,
      category: "",
      sectionId: path.section,
      section: "",
      path: [],
      english: content.english || "",
      arabic: content.arabic || ""
    };
    return { type: "topic", id: paneId, label: name, rootKey: path.root, categoryKey: path.category, sectionKey: path.section, paneId, body: content.english || "", html: serializePane(pane), updatedAt: now };
  }

  async function openMenuEditor() {
    await loadRemoteData().catch(() => snapshot());
    const body = createDialog("Menu");
    const form = document.createElement("form");
    form.className = "admin-menu-form";
    form.innerHTML = `
      <div class="admin-menu-grid">
        <label class="admin-field"><span>Root</span><select data-menu-root></select></label>
        <label class="admin-field"><span>Category</span><select data-menu-category></select></label>
        <label class="admin-field"><span>Section</span><select data-menu-section></select></label>
        <label class="admin-field"><span>Topic</span><select data-menu-topic></select></label>
      </div>
      <label class="admin-field"><span>Level</span><select data-menu-level>
        <option value="root">Root</option>
        <option value="category">Category</option>
        <option value="section">Section</option>
        <option value="topic">Topic</option>
      </select></label>
      <label class="admin-field"><span>Name</span><input type="text" data-menu-name></label>
      <div class="admin-menu-topic-content" hidden>
        <label class="admin-field admin-field--wide"><span>English content</span><textarea rows="7" data-menu-english dir="ltr"></textarea></label>
        <label class="admin-field admin-field--wide"><span>Arabic content</span><textarea rows="7" data-menu-arabic dir="rtl"></textarea></label>
      </div>
    `;
    form.append(makePasswordField());
    const actionBar = document.createElement("div");
    actionBar.className = "admin-dialog__actions";
    actionBar.innerHTML = `
      <button type="button" class="admin-secondary-button" data-menu-add>Add</button>
      <button type="button" class="admin-secondary-button" data-menu-rename>Edit name</button>
      <button type="button" class="admin-danger-button" data-menu-delete>Delete</button>
      <span class="admin-dialog__actions-spacer"></span>
      <button type="button" class="admin-secondary-button" data-menu-cancel>Cancel</button>
    `;
    form.append(actionBar);
    body.append(form);

    const rootSelect = form.querySelector("[data-menu-root]");
    const categorySelect = form.querySelector("[data-menu-category]");
    const sectionSelect = form.querySelector("[data-menu-section]");
    const topicSelect = form.querySelector("[data-menu-topic]");
    const levelSelect = form.querySelector("[data-menu-level]");
    const nameInput = form.querySelector("[data-menu-name]");
    const topicContent = form.querySelector(".admin-menu-topic-content");

    function selectedRoot() { return hierarchyOptions().find((root) => root.id === rootSelect.value) || null; }
    function selectedCategory() { return selectedRoot()?.categories?.find((item) => item.id === categorySelect.value) || null; }
    function selectedSection() { return selectedCategory()?.sections?.find((item) => item.id === sectionSelect.value) || null; }
    function selectedTopic() { return selectedSection()?.topics?.find((item) => item.id === topicSelect.value) || null; }

    function refreshRoots() {
      fillSelect(rootSelect, hierarchyOptions().filter((root) => ["kb", "sv"].includes(root.id)), "Choose root");
      if (!rootSelect.value && rootSelect.options.length > 1) rootSelect.selectedIndex = 1;
      refreshCategories();
    }
    function refreshCategories() {
      fillSelect(categorySelect, selectedRoot()?.categories || [], "Choose category");
      if (!categorySelect.value && categorySelect.options.length > 1) categorySelect.selectedIndex = 1;
      refreshSections();
    }
    function refreshSections() {
      fillSelect(sectionSelect, selectedCategory()?.sections || [], "Choose section");
      if (!sectionSelect.value && sectionSelect.options.length > 1) sectionSelect.selectedIndex = 1;
      refreshTopics();
    }
    function refreshTopics() {
      fillSelect(topicSelect, selectedSection()?.topics || [], "Choose topic");
      if (!topicSelect.value && topicSelect.options.length > 1) topicSelect.selectedIndex = 1;
      syncName();
    }
    function selectedTarget() {
      const level = levelSelect.value;
      if (level === "root") return selectedRoot();
      if (level === "category") return selectedCategory();
      if (level === "section") return selectedSection();
      return selectedTopic();
    }
    function syncName() {
      const target = selectedTarget();
      nameInput.value = target?.title || "";
      topicContent.hidden = levelSelect.value !== "topic";
    }

    rootSelect.addEventListener("change", refreshCategories);
    categorySelect.addEventListener("change", refreshSections);
    sectionSelect.addEventListener("change", refreshTopics);
    topicSelect.addEventListener("change", syncName);
    levelSelect.addEventListener("change", syncName);
    refreshRoots();

    async function commit(mutator, success) {
      const password = form.querySelector("[data-admin-password]").value;
      const previous = clone(state.menuState);
      try {
        mutator();
        rebuildTransformedData();
        statusMessage(form, "Saving…");
        await saveMenu(password);
        statusMessage(form, success, "success");
        refreshRoots();
      } catch (error) {
        state.menuState = previous;
        rebuildTransformedData();
        statusMessage(form, error.message || "Save failed.", "error");
      }
    }

    actionBar.querySelector("[data-menu-add]").addEventListener("click", async () => {
      const level = levelSelect.value;
      if (level === "root") {
        statusMessage(form, "The approved application keeps the two original roots.", "error");
        return;
      }
      const name = nameInput.value.trim();
      if (!name) {
        statusMessage(form, "Name is required.", "error");
        return;
      }
      const path = { root: rootSelect.value, category: categorySelect.value, section: sectionSelect.value };
      if (!path.root || (level !== "category" && !path.category) || (level === "topic" && !path.section)) {
        statusMessage(form, "Choose the parent item first.", "error");
        return;
      }
      const record = createMenuItemRecord(level, name, path, {
        english: form.querySelector("[data-menu-english]").value,
        arabic: form.querySelector("[data-menu-arabic]").value
      });
      await commit(() => {
        if (state.menuState.items.some((item) => item.id === record.id || item.paneId === record.paneId)) {
          record.id = `${record.id}-${Date.now().toString(36).slice(-4)}`;
          if (record.type === "topic") record.paneId = record.id;
        }
        state.menuState.items.push(record);
      }, "Saved.");
    });

    actionBar.querySelector("[data-menu-rename]").addEventListener("click", async () => {
      const level = levelSelect.value;
      const target = selectedTarget();
      const name = nameInput.value.trim();
      if (!target || !name) {
        statusMessage(form, "Choose an item and enter its name.", "error");
        return;
      }
      await commit(() => renameMenuTarget(level, target.id, name), "Saved.");
    });

    actionBar.querySelector("[data-menu-delete]").addEventListener("click", async () => {
      const level = levelSelect.value;
      const target = selectedTarget();
      if (!target) {
        statusMessage(form, "Choose an item first.", "error");
        return;
      }
      if (level === "root") {
        statusMessage(form, "The approved application keeps the two original roots.", "error");
        return;
      }
      if (!window.confirm(`Delete ${target.title}?`)) return;
      await commit(() => deleteMenuTarget(level, target.id), "Saved.");
    });

    actionBar.querySelector("[data-menu-cancel]").addEventListener("click", closeDialog);
    return true;
  }

  function injectMenuEditButton() {
    const navigation = document.querySelector(".sidebar-navigation");
    const toggle = navigation?.querySelector("[data-navigation-menu-toggle]");
    if (!navigation || !toggle || navigation.querySelector("[data-admin-menu-edit]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sidebar-navigation__edit";
    button.dataset.adminMenuEdit = "true";
    button.textContent = "Edit";
    button.title = "Edit menu";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void openMenuEditor();
    });
    navigation.append(button);
  }

  function injectTopicEditButton(paneId) {
    const actions = document.querySelector(`.article-view[data-pane-id="${CSS.escape(paneId)}"] .article-view__actions`);
    if (!actions || actions.querySelector("[data-admin-topic-edit]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "article-action-button";
    button.dataset.adminTopicEdit = paneId;
    button.innerHTML = `<span class="article-action-button__label">Edit</span>`;
    button.addEventListener("click", () => void openTopicEditor(paneId));
    actions.append(button);
  }

  function installDomHooks() {
    injectMenuEditButton();
    document.addEventListener("sugo:articleview", (event) => {
      const paneId = String(event.detail?.paneId || "");
      if (paneId) window.setTimeout(() => injectTopicEditButton(paneId), 0);
    });
    document.addEventListener("sugo:adminpanechange", (event) => {
      const paneId = String(event.detail?.paneId || "");
      if (paneId && window.SUGO?.ArticleView?.currentPane === paneId) window.SUGO.ArticleView.refresh();
    });
  }

  rebuildTransformedData();

  window.SUGO = window.SUGO || {};
  window.SUGO.Admin = Object.freeze({
    version: "20260712-admin-media-v2",
    load: loadRemoteData,
    getPane,
    listPanes,
    getPaneText,
    getSearchDocument,
    getKnowledgeBaseData,
    openTopicEditor,
    openMenuEditor,
    savePane,
    resetPane,
    saveMenu,
    uploadMediaFile,
    saveTopicMedia,
    resetTopicMedia,
    closeDialog,
    serializePane,
    parseOverrideHtml,
    get state() { return snapshot(); },
    get menuState() { return clone(state.menuState); },
    get passwordStoredForSession() { return Boolean(state.adminPassword); }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      installDomHooks();
      void loadRemoteData().catch(() => snapshot());
    }, { once: true });
  } else {
    installDomHooks();
    void loadRemoteData().catch(() => snapshot());
  }
})();
