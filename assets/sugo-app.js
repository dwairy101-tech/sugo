// ===== extracted from #sugo-runtime-js =====
// ===== legacy-runtime-script-1 =====

// Global variables and helper functions
const paneContent = {};
const renderedPanes = new Set();
let sugoTopicsCache = null;

const SUGO_PANE_BASE_URL = './assets/panes/';
const SUGO_PANE_INDEX_URL = './assets/sugo-pane-index.json';
let sugoPaneIndexPromise = null;

function setPane(id, html) {
  if (!id) return;
  paneContent[id] = { en: html || '' };
  sugoTopicsCache = null;
}

function sugoPaneUrl(id) {
  return SUGO_PANE_BASE_URL + encodeURIComponent(String(id || '')) + '.html';
}

function sugoPaneLoadingHtml(id) {
  return '<div class="doc-card"><p>Loading SOP content…</p><p dir="rtl">جاري تحميل المحتوى…</p></div>';
}

async function fetchSugoPaneHtml(id) {
  id = String(id || '').trim();
  if (!id) return '';
  if (paneContent[id] && paneContent[id].en) return paneContent[id].en;
  const response = await fetch(sugoPaneUrl(id), { cache: 'force-cache' });
  if (!response.ok) throw new Error('Pane file not found: ' + id);
  const html = await response.text();
  setPane(id, html);
  return html;
}

function sugoBuildPaneIndexMap(items) {
  const map = Object.create(null);
  (items || []).forEach(item => { if (item && item.id) map[item.id] = item; });
  window.SUGO_PANE_SEARCH_BY_ID = map;
  return map;
}

function sugoGetPaneIndexEntry(id) {
  const key = String(id || '');
  if (!key) return null;
  const map = window.SUGO_PANE_SEARCH_BY_ID || sugoBuildPaneIndexMap(window.SUGO_PANE_SEARCH_INDEX || []);
  return map[key] || null;
}

function sugoGetTitleOnlyTopics() {
  if (!document || !document.querySelectorAll) return [];
  return Array.from(document.querySelectorAll('.nav-l000-btn[data-pane]')).map(btn => {
    const id = btn.getAttribute('data-pane') || '';
    const title = (btn.textContent || '').trim() || id.replace(/-/g, ' ');
    const l00 = btn.closest('.nav-l00');
    const l0 = btn.closest('.nav-l0');
    const root = btn.closest('.nav-lroot');
    const navText = (node, selector) => {
      try {
        const span = node && node.querySelector(':scope > ' + selector + ' span');
        return span ? (span.textContent || '').trim() : '';
      } catch { return ''; }
    };
    const section = navText(l00, '.nav-l00-btn');
    const category = navText(l0, '.nav-l0-btn');
    const library = navText(root, '.nav-lroot-btn');
    const path = [library, category, section].filter(Boolean).join(' › ');
    return {
      id, title, label: title, category, section, library, path,
      enText: '', arText: '',
      allText: `${id} ${title} ${path}`.toLowerCase(),
      titleNorm: `${id.replace(/-/g, ' ')} ${title}`.toLowerCase(),
      pathNorm: path.toLowerCase(),
      bodyNorm: '', tags: []
    };
  });
}

function sugoGetSearchTopicsSync() {
  const loaded = Array.isArray(window.SUGO_PANE_SEARCH_INDEX) ? window.SUGO_PANE_SEARCH_INDEX : null;
  return loaded && loaded.length ? loaded : sugoGetTitleOnlyTopics();
}

async function sugoEnsurePaneIndexReady() {
  if (Array.isArray(window.SUGO_PANE_SEARCH_INDEX) && window.SUGO_PANE_SEARCH_INDEX.length) return window.SUGO_PANE_SEARCH_INDEX;
  if (!sugoPaneIndexPromise) {
    sugoPaneIndexPromise = fetch(SUGO_PANE_INDEX_URL, { cache: 'force-cache' })
      .then(r => { if (!r.ok) throw new Error('Search index not found'); return r.json(); })
      .then(items => {
        window.SUGO_PANE_SEARCH_INDEX = Array.isArray(items) ? items : [];
        sugoBuildPaneIndexMap(window.SUGO_PANE_SEARCH_INDEX);
        sugoTopicsCache = null;
        try { if (window.SUGO_SPEED_COMPLETE_ANSWER && window.SUGO_SPEED_COMPLETE_ANSWER.rebuildIndex) window.SUGO_SPEED_COMPLETE_ANSWER.rebuildIndex(); } catch {}
        return window.SUGO_PANE_SEARCH_INDEX;
      })
      .catch(err => { console.warn('[SUGO] Search index load failed', err); return sugoGetTitleOnlyTopics(); });
  }
  return sugoPaneIndexPromise;
}
window.sugoEnsurePaneIndexReady = sugoEnsurePaneIndexReady;
window.fetchSugoPaneHtml = fetchSugoPaneHtml;

function formatTextWithLists(text) {
  if (!text) return '';
  const lines = String(text).replace(/\u00a0/g, ' ').split(/\r?\n/);
  let activeList = null;
  let expectedOl = 1;
  let result = [];

  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const inline = (value) => esc(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');

  const classify = (line) => {
    let m;
    if ((m = line.match(/^\s*(\d+)[.\-)]\s*(.*)$/))) return { kind:'ol', number:parseInt(m[1], 10) || 1, content:m[2] || '' };
    if ((m = line.match(/^\s*[-–—]\s+(.*)$/))) return { kind:'ul', content:m[1] || '' };
    if ((m = line.match(/^\s*[•]\s*(.*)$/))) return { kind:'ul', content:m[1] || '' };
    if ((m = line.match(/^\s*\*\s+(.*)$/))) return { kind:'ul', content:m[1] || '' };
    return null;
  };
  const nextClassified = (fromIndex) => {
    for (let j = fromIndex; j < lines.length; j++) {
      if (String(lines[j]).trim() === '') continue;
      return classify(lines[j]);
    }
    return null;
  };
  const closeList = () => {
    if (!activeList) return;
    result.push(activeList === 'ol' ? '</ol>' : '</ul>');
    activeList = null;
    expectedOl = 1;
  };
  const openList = (kind, start) => {
    const safeStart = Math.max(1, Number(start) || 1);
    if (activeList !== kind) {
      closeList();
      if (kind === 'ol') {
        result.push(`<ol${safeStart > 1 ? ` start="${safeStart}"` : ''} style="margin: 0.75rem 0 0.75rem 1.5rem; padding-left: 1.1rem;">`);
        expectedOl = safeStart;
      } else {
        result.push('<ul style="margin: 0.75rem 0 0.75rem 1.5rem; padding-left: 1.1rem;">');
      }
      activeList = kind;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = String(raw).trim();
    const item = classify(raw);

    if (!trimmed) {
      const next = nextClassified(i + 1);
      if (activeList && next && next.kind === activeList) continue;
      closeList();
      result.push('<div class="sugo-copy-spacer" style="margin: 0.5rem 0;"></div>');
      continue;
    }

    if (item) {
      if (item.kind === 'ol') {
        if (activeList === 'ol') {
          const n = item.number || expectedOl;
          if (n > expectedOl + 1) { closeList(); openList('ol', n); }
        } else {
          openList('ol', item.number || 1);
        }
        result.push(`<li style="margin-bottom: 0.35rem; line-height: 1.6;">${inline(item.content.trim())}</li>`);
        expectedOl += 1;
      } else {
        openList('ul', 1);
        result.push(`<li style="margin-bottom: 0.35rem; line-height: 1.6;">${inline(item.content.trim())}</li>`);
      }
      continue;
    }

    closeList();
    let nextNonEmpty = null;
    for (let j = i + 1; j < lines.length; j++) {
      if (String(lines[j]).trim() !== '') { nextNonEmpty = lines[j]; break; }
    }
    const isHeading = (i === 0) || Boolean(nextNonEmpty && classify(nextNonEmpty));
    result.push(isHeading
      ? `<p style="margin: 0.75rem 0; line-height: 1.6; font-size: 0.97rem; font-weight: 700;">${inline(trimmed)}</p>`
      : `<p style="margin: 0.75rem 0; line-height: 1.6;">${inline(trimmed)}</p>`);
  }
  closeList();
  return result.join('');
}

function escapeAttrText(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const SUGO_LANG_FILTER_LABELS = {
  all: 'All',
  en: 'English',
  ar: 'Arabic'
};

const SUGO_TYPE_FILTER_LABELS = {
  all: 'All',
  answer: 'Answer',
  ticket: 'Ticket',
  mention: 'Mention',
  form: 'Form',
  text: 'Text',
  escalation: 'Escalation',
  internal: 'Internal Notes'
};

function sugoUniqueValues(items) {
  const seen = new Set();
  return (items || []).filter(item => {
    const value = String(item || '').trim();
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function sugoFieldTypeFromLabel(label, text) {
  const value = String(label || '').trim().toLowerCase();
  const body = String(text || '').trim().toLowerCase();
  const combined = `${value}\n${body}`;

  // Internal-only material: forms, mentions, escalation notes, agent notes.
  if (/reporter\s*:|violator\s+id\s*:|desc\s*:|description\s*:|vip team|sugo reporting group|escalate|internal note|care\s*\/\s*escalation/.test(combined)) {
    if (/reporter\s*:|violator\s+id\s*:|desc\s*:|description\s*:/.test(combined)) return 'form';
    if (/mention|sugo reporting group|@/.test(combined)) return 'mention';
    return 'escalation';
  }
  if (/المبلّغ\s*:|المبلغ\s*:|آي دي المخالف\s*:|اي دي المخالف\s*:|الوصف\s*:/.test(combined)) return 'form';
  if (/المنشن|منشن|يتم التصعيد|مجموعة\s+sugo|فريق\s+vip|@/.test(combined)) return 'mention';
  if (/العناية|التصعيد|ملاحظة داخلية|للموظف فقط|للدعم فقط/.test(combined)) return 'escalation';

  if (/answer|الإجابة|الاجابة/.test(value)) return 'answer';
  if (/ticket|التذكرة|التذكره/.test(value)) return 'ticket';
  if (/mention|المنشن/.test(value)) return 'mention';
  if (/form|النموذج/.test(value)) return 'form';
  if (/care|escalation|العناية|التصعيد/.test(value)) return 'escalation';
  if (/use case|usage|الاستخدام/.test(value)) return 'internal';
  return 'text';
}

function sugoFieldIsInternal(field) {
  const type = sugoFieldTypeFromLabel(field && field.label, field && field.text);
  return ['form', 'mention', 'escalation', 'internal'].includes(type);
}

function sugoDisplayFieldLabel(field, type, lang) {
  const label = String((field && field.label) || '').trim();
  const lower = label.toLowerCase();
  const isAr = lang === 'ar';
  if (type === 'form') return isAr ? 'النموذج الداخلي' : 'Internal Form';
  if (type === 'mention') return isAr ? 'المنشن / التصعيد' : 'Mention / Escalation';
  if (type === 'escalation') return isAr ? 'ملاحظة داخلية' : 'Internal Note';
  if (type === 'internal') return isAr ? 'معلومة داخلية' : 'Internal Info';
  if ((lower === 'ticket' || label === 'التذكرة' || label === 'التذكره') && sugoFieldIsInternal(field)) {
    return isAr ? 'ملاحظة داخلية' : 'Internal Note';
  }
  return label || (isAr ? 'النص' : 'Text');
}

function sugoCopyAllowedField(field) {
  if (!field || sugoFieldIsInternal(field)) return false;
  const type = sugoFieldTypeFromLabel(field.label, field.text);
  return type === 'answer' || type === 'ticket';
}

function sugoCopyLabelForField(field, lang) {
  const type = sugoFieldTypeFromLabel(field && field.label, field && field.text);
  const prefix = lang === 'en' ? '📋 Copy EN' : 'Copy AR';
  if (type === 'ticket') return `${prefix} Ticket`;
  if (type === 'answer') return `${prefix} Answer`;
  return `${prefix} Text`;
}

function sugoInternalCopyLabelForField(field, lang) {
  const type = sugoFieldTypeFromLabel(field && field.label, field && field.text);
  const prefix = lang === 'en' ? '📋 Copy Internal' : 'Copy Internal';
  if (type === 'form') return `${prefix} Form`;
  if (type === 'mention') return `${prefix} Mention`;
  if (type === 'escalation') return `${prefix} Note`;
  return `${prefix} Info`;
}

function sugoBestDefaultType(types) {
  const list = sugoUniqueValues(types);
  if (list.includes('answer')) return 'answer';
  if (list.includes('ticket')) return 'ticket';
  if (list.includes('form')) return 'form';
  if (list.includes('text')) return 'text';
  return list[0] || 'all';
}

function sugoCreateViewControls(langs, types, defaultLang, defaultType) {
  const langList = sugoUniqueValues(langs);
  const typeList = sugoUniqueValues(types);
  const langButtons = langList.length > 1 ? ['all', ...langList] : langList;
  const typeButtons = typeList.length > 1 ? ['all', ...typeList] : typeList;
  const safeDefaultLang = langButtons.includes(defaultLang) ? defaultLang : (langButtons.includes('ar') ? 'ar' : (langButtons[0] || 'all'));
  const safeDefaultType = typeButtons.includes(defaultType) ? defaultType : (typeButtons[0] || 'all');

  function renderButtons(group, values, activeValue, labels) {
    return values.map(value => {
      const active = value === activeValue ? ' active' : '';
      const label = labels[value] || value;
      return `<button type="button" class="sugo-view-btn${active}" data-filter-group="${group}" data-value="${value}">${label}</button>`;
    }).join('');
  }

  return `
    <div class="sugo-view-controls" data-default-lang="${safeDefaultLang}" data-default-type="${safeDefaultType}">
      <div class="sugo-view-head">
        <div class="sugo-view-title">Display Options</div>
        <div class="sugo-view-hint">Choose what to show</div>
      </div>
      <div class="sugo-view-row">
        <div class="sugo-view-row-label">Language</div>
        <div class="sugo-view-group">${renderButtons('lang', langButtons, safeDefaultLang, SUGO_LANG_FILTER_LABELS)}</div>
      </div>
      <div class="sugo-view-row">
        <div class="sugo-view-row-label">Content</div>
        <div class="sugo-view-group">${renderButtons('type', typeButtons, safeDefaultType, SUGO_TYPE_FILTER_LABELS)}</div>
      </div>
    </div>
  `;
}

function sugoApplyContentVisibility(card) {
  if (!card) return;
  const controls = card.querySelector('.sugo-view-controls');
  if (!controls) return;
  const langBtn = controls.querySelector('.sugo-view-btn.active[data-filter-group="lang"]');
  const typeBtn = controls.querySelector('.sugo-view-btn.active[data-filter-group="type"]');
  const activeLang = langBtn ? langBtn.getAttribute('data-value') : (controls.getAttribute('data-default-lang') || 'all');
  const activeType = typeBtn ? typeBtn.getAttribute('data-value') : (controls.getAttribute('data-default-type') || 'all');
  let visibleCount = 0;

  card.querySelectorAll('.sugo-section').forEach(section => {
    const lang = section.getAttribute('data-lang') || 'all';
    const type = section.getAttribute('data-type') || 'text';
    const langOk = activeLang === 'all' || lang === 'all' || lang === activeLang;
    const typeOk = activeType === 'all' || type === activeType;
    const show = langOk && typeOk;
    section.classList.toggle('content-filtered-hidden', !show);
    if (show) visibleCount++;
  });

  card.querySelectorAll('.macro-col').forEach(col => {
    const sections = Array.from(col.querySelectorAll('.sugo-section'));
    if (!sections.length) return;
    const hasVisible = sections.some(section => !section.classList.contains('content-filtered-hidden'));
    col.classList.toggle('sugo-col-hidden', !hasVisible);
  });

  card.querySelectorAll('.macro-grid').forEach(grid => {
    const visibleCols = Array.from(grid.querySelectorAll('.macro-col')).filter(col => !col.classList.contains('sugo-col-hidden')).length;
    grid.classList.toggle('sugo-single-col', visibleCols === 1);
  });

  card.querySelectorAll('.sugo-internal-panel').forEach(panel => {
    const visibleInternal = Array.from(panel.querySelectorAll('.sugo-section')).some(section => !section.classList.contains('content-filtered-hidden'));
    panel.classList.toggle('sugo-panel-hidden', !visibleInternal);
  });

  const empty = card.querySelector('.sugo-filter-empty');
  if (empty) empty.style.display = visibleCount ? 'none' : 'block';
}

function initContentVisibilityControls(scope) {
  const root = scope || document;
  root.querySelectorAll('.sugo-view-controls').forEach(controls => {
    if (controls.__sugoViewControlsReady) return;
    controls.__sugoViewControlsReady = true;
    const card = controls.closest('.doc-card');

    ['lang', 'type'].forEach(group => {
      const stored = localStorage.getItem(`sugo_content_filter_${group}`);
      if (!stored) return;
      const savedBtn = controls.querySelector(`.sugo-view-btn[data-filter-group="${group}"][data-value="${stored}"]`);
      if (!savedBtn) return;
      controls.querySelectorAll(`.sugo-view-btn[data-filter-group="${group}"]`).forEach(btn => btn.classList.remove('active'));
      savedBtn.classList.add('active');
    });

    controls.addEventListener('click', event => {
      const btn = event.target.closest('.sugo-view-btn');
      if (!btn || !controls.contains(btn)) return;
      event.preventDefault();
      const group = btn.getAttribute('data-filter-group');
      controls.querySelectorAll(`.sugo-view-btn[data-filter-group="${group}"]`).forEach(item => item.classList.remove('active'));
      btn.classList.add('active');
      try { localStorage.setItem(`sugo_content_filter_${group}`, btn.getAttribute('data-value')); } catch(e) {}
      sugoApplyContentVisibility(card);
    });

    sugoApplyContentVisibility(card);
  });
}

function createDualContent(eng, arb) {
  const engFormatted = formatTextWithLists(eng);
  const arbFormatted = formatTextWithLists(arb);
  return `
    <div class="doc-card">
      ${sugoCreateViewControls(['en', 'ar'], ['text'], 'ar', 'text')}
      <div class="copy-buttons">
        <button class="copy-btn" data-copy-text="${escapeAttrText(eng)}">📋 Copy English</button>
        <button class="copy-btn" data-copy-text="${escapeAttrText(arb)}">Copy Arabic</button>
      </div>
      <div class="sugo-section" data-lang="en" data-type="text">
        <div class="lang-divider"><span>English</span><hr></div>
        <div style="line-height:1.7; color: var(--text-secondary); margin-bottom: 32px;">${engFormatted}</div>
      </div>
      <div class="sugo-section" data-lang="ar" data-type="text">
        <div class="lang-divider"><span>العربية</span><hr></div>
        <div dir="rtl" style="text-align:right; line-height:1.7; color: var(--text-secondary);">${arbFormatted}</div>
      </div>
      <div class="sugo-filter-empty">No matching content.</div>
    </div>
  `;
}


function createTicketMacroContent(engTitle, engAnswer, engMention, engTicket, arTitle, arAnswer, arMention, arTicket) {
  const engAnswerFormatted = formatTextWithLists(engAnswer);
  const engMentionFormatted = formatTextWithLists(engMention || '—');
  const engTicketFormatted = formatTextWithLists(engTicket);
  const arAnswerFormatted = formatTextWithLists(arAnswer);
  const arMentionFormatted = formatTextWithLists(arMention || '—');
  const arTicketFormatted = formatTextWithLists(arTicket);
  const hasEnMention = engMention && String(engMention).trim() && String(engMention).trim() !== '—';
  const hasArMention = arMention && String(arMention).trim() && String(arMention).trim() !== '—';
  const contentTypes = ['answer', 'ticket'];
  if (hasEnMention || hasArMention) contentTypes.push('mention');
  return `
    <div class="doc-card">
      ${sugoCreateViewControls(['en', 'ar'], contentTypes, 'ar', 'answer')}
      <div class="copy-buttons">
        <button class="copy-btn" data-copy-text="${escapeAttrText(engAnswer)}">📋 Copy EN Answer</button>
        <button class="copy-btn" data-copy-text="${escapeAttrText(engTicket)}">📋 Copy EN Ticket</button>
        <button class="copy-btn" data-copy-text="${escapeAttrText(arAnswer)}">Copy AR Answer</button>
        <button class="copy-btn" data-copy-text="${escapeAttrText(arTicket)}">Copy AR Ticket</button>
      </div>
      <div class="macro-grid">
        <section class="macro-col" dir="ltr">
          <h2 class="macro-title">${engTitle}</h2>
          <div class="macro-field sugo-section" data-lang="en" data-type="answer"><div class="macro-label">Answer</div><div class="macro-body">${engAnswerFormatted}</div></div>
          <div class="macro-field sugo-section" data-lang="en" data-type="ticket"><div class="macro-label">Ticket</div><div class="macro-body">${engTicketFormatted}</div></div>
          ${hasEnMention ? `<div class="sugo-internal-panel"><div class="sugo-internal-title"><span>Internal Notes</span><span>Not copied with ticket</span></div><div class="macro-field sugo-section sugo-internal-field" data-lang="en" data-type="mention"><div class="macro-label">Mention / Escalation</div><div class="macro-body">${engMentionFormatted}</div><button class="sugo-internal-copy-btn copy-btn" data-copy-text="${escapeAttrText(engMention)}">📋 Copy Internal Mention</button></div></div>` : ''}
        </section>
        <section class="macro-col" dir="rtl">
          <h2 class="macro-title">${arTitle}</h2>
          <div class="macro-field sugo-section" data-lang="ar" data-type="answer"><div class="macro-label">الإجابة</div><div class="macro-body">${arAnswerFormatted}</div></div>
          <div class="macro-field sugo-section" data-lang="ar" data-type="ticket"><div class="macro-label">التذكرة</div><div class="macro-body">${arTicketFormatted}</div></div>
          ${hasArMention ? `<div class="sugo-internal-panel"><div class="sugo-internal-title"><span>Internal Notes</span><span>Not copied with ticket</span></div><div class="macro-field sugo-section sugo-internal-field" data-lang="ar" data-type="mention"><div class="macro-label">المنشن / التصعيد</div><div class="macro-body">${arMentionFormatted}</div><button class="sugo-internal-copy-btn copy-btn" data-copy-text="${escapeAttrText(arMention)}">Copy Internal Mention</button></div></div>` : ''}
        </section>
      </div>
      <div class="sugo-filter-empty">No matching content.</div>
    </div>
  `;
}


function createSupportMacroContent(engTitle, engFields, arTitle, arFields) {
  function normalizeFields(fields) {
    return (fields || []).filter(f => f && f.text && String(f.text).trim() && String(f.text).trim() !== '—');
  }
  function fieldHtml(fields, lang, internal) {
    return normalizeFields(fields).map(f => {
      const type = sugoFieldTypeFromLabel(f.label, f.text);
      const label = sugoDisplayFieldLabel(f, type, lang);
      const internalClass = internal ? ' sugo-internal-field' : '';
      const copyButton = internal ? `<button class="sugo-internal-copy-btn copy-btn" data-copy-text="${escapeAttrText(f.text)}">${sugoInternalCopyLabelForField(f, lang)}</button>` : '';
      return `<div class="macro-field sugo-section${internalClass}" data-lang="${lang}" data-type="${type}" data-section-label="${escapeAttrText(label)}"><div class="macro-label">${label}</div><div class="macro-body">${formatTextWithLists(f.text)}</div>${copyButton}</div>`;
    }).join('');
  }
  function splitFields(fields) {
    const clean = normalizeFields(fields);
    return {
      customer: clean.filter(f => !sugoFieldIsInternal(f)),
      internal: clean.filter(f => sugoFieldIsInternal(f))
    };
  }
  function internalPanel(fields, lang) {
    const clean = normalizeFields(fields);
    if (!clean.length) return '';
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    return `<div class="sugo-internal-panel" dir="${dir}"><div class="sugo-internal-title"><span>Internal Notes / Mention / Form</span><span>Not copied with ticket</span></div>${fieldHtml(clean, lang, true)}</div>`;
  }

  const enSplit = splitFields(engFields);
  const arSplit = splitFields(arFields);
  const enFieldsAll = [...enSplit.customer, ...enSplit.internal];
  const arFieldsAll = [...arSplit.customer, ...arSplit.internal];
  const contentTypes = sugoUniqueValues([...enFieldsAll, ...arFieldsAll].map(f => sugoFieldTypeFromLabel(f.label, f.text)));
  const copyItems = [];
  enSplit.customer.forEach(f => {
    if (sugoCopyAllowedField(f)) copyItems.push({ label: sugoCopyLabelForField(f, 'en'), text: f.text });
  });
  arSplit.customer.forEach(f => {
    if (sugoCopyAllowedField(f)) copyItems.push({ label: sugoCopyLabelForField(f, 'ar'), text: f.text });
  });
  const copyButtons = copyItems.map(item => `<button class="copy-btn" data-copy-text="${escapeAttrText(item.text)}">${item.label}</button>`).join('');
  return `
    <div class="doc-card">
      ${sugoCreateViewControls(['en', 'ar'], contentTypes, 'ar', sugoBestDefaultType(contentTypes))}
      <div class="copy-buttons">${copyButtons}</div>
      <div class="macro-grid">
        <section class="macro-col" dir="ltr">
          <h2 class="macro-title">${engTitle}</h2>
          ${fieldHtml(enSplit.customer, 'en', false)}
          ${internalPanel(enSplit.internal, 'en')}
        </section>
        <section class="macro-col" dir="rtl">
          <h2 class="macro-title">${arTitle}</h2>
          ${fieldHtml(arSplit.customer, 'ar', false)}
          ${internalPanel(arSplit.internal, 'ar')}
        </section>
      </div>
      <div class="sugo-filter-empty">No matching content.</div>
    </div>
  `;
}

function sugoCleanCopyText(text) {
  return String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map(line => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trim();
}

function sugoHtmlToPlainText(element) {
  const parts = [];
  const stack = [];
  const blockTags = new Set(['p','div','section','article','h1','h2','h3','h4','h5','h6','table','tr']);
  const skipClasses = new Set(['macro-label','macro-title','lang-divider','sugo-min-filter-panel','sugo-view-controls','sugo-efficiency-panel','copy-buttons','close-pane-btn','sugo-filter-empty','sugo-internal-panel','sugo-internal-field']);
  const append = (value) => { if (value != null) parts.push(String(value)); };
  const br = (hard) => {
    const last = parts.length ? parts[parts.length - 1] : '';
    if (hard) { if (last !== '\n\n') parts.push('\n\n'); }
    else if (last !== '\n' && last !== '\n\n') parts.push('\n');
  };
  const walk = (node) => {
    if (!node) return;
    if (node.nodeType === 3) { append(node.nodeValue || ''); return; }
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();
    if (['script','style','noscript','button','select','option','label'].includes(tag)) return;
    if (node.classList && Array.from(skipClasses).some(cls => node.classList.contains(cls))) return;
    if (tag === 'br') { br(false); return; }
    if (tag === 'ol') {
      const start = parseInt(node.getAttribute('start') || '1', 10) || 1;
      stack.push({ type:'ol', next:start, indent:stack.length });
      br(false);
      Array.from(node.children).forEach(walk);
      stack.pop();
      br(true);
      return;
    }
    if (tag === 'ul') {
      stack.push({ type:'ul', indent:stack.length });
      br(false);
      Array.from(node.children).forEach(walk);
      stack.pop();
      br(true);
      return;
    }
    if (tag === 'li') {
      const ctx = stack[stack.length - 1] || {type:'ul', indent:0};
      br(false);
      append('  '.repeat(ctx.indent || 0));
      if (ctx.type === 'ol') { append((ctx.next++) + '. '); }
      else { append('• '); }
      Array.from(node.childNodes).forEach(walk);
      br(false);
      return;
    }
    if (node.classList && node.classList.contains('sugo-copy-spacer')) { br(true); return; }
    const isBlock = blockTags.has(tag);
    if (isBlock) br(false);
    Array.from(node.childNodes).forEach(walk);
    if (isBlock) br(true);
  };
  walk(element);
  return sugoCleanCopyText(parts.join(''));
}

function sugoPlainTextToClipboardHtml(text) {
  return '<div style="font-family: Arial, sans-serif; line-height: 1.55;">' + formatTextWithLists(text) + '</div>';
}

function sugoWriteClipboardRich(plainText, htmlText) {
  const cleanPlain = sugoCleanCopyText(plainText);
  const richHtml = htmlText || sugoPlainTextToClipboardHtml(cleanPlain);
  if (navigator.clipboard && window.ClipboardItem && window.isSecureContext) {
    const item = new ClipboardItem({
      'text/plain': new Blob([cleanPlain], { type: 'text/plain' }),
      'text/html': new Blob([richHtml], { type: 'text/html' })
    });
    return navigator.clipboard.write([item]).catch(() => navigator.clipboard.writeText(cleanPlain));
  }
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(cleanPlain);
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = cleanPlain;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      ok ? resolve() : reject(new Error('Copy command failed'));
    } catch (err) { reject(err); }
  });
}

function copyTextToClipboard(text, btn, success, orig, htmlText) {
  const cleanPlain = sugoCleanCopyText(text);
  sugoWriteClipboardRich(cleanPlain, htmlText || sugoPlainTextToClipboardHtml(cleanPlain))
    .then(() => { if (btn) { btn.innerText = success || '✓ Copied!'; setTimeout(() => btn.innerText = orig || 'Copy', 1200); } })
    .catch(() => { if (btn) { btn.innerText = '❌ Failed'; setTimeout(() => btn.innerText = orig || 'Copy', 1800); } });
}

const placeholder = '<div class="doc-card"><p>No content yet. Please add new content.</p><p dir="rtl">لا يوجد محتوى بعد. يرجى إضافة محتوى جديد.</p></div>';

// ========== INJECTED PANE CONTENT ==========

// ===== Account section content =====


// ========== SUGO SUPREME V5.1 SENIOR CS OPTIMIZED PANES ==========


// ========== GLOBAL SUPPORT OPTIMIZED PAGES v5.2 ==========

/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


// ========== SENIOR CS - SMALL & SUB AGENCY ==========

/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;
// ===== Payment section content - Redesigned in professional support style =====


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;
// ===== Function section content - Redesigned in professional support style =====
// ========== SOCIAL ==========


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;

// ========== MOMENTS ==========


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;

// ========== RELATIONSHIPS ==========


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;

// ========== FAMILY ==========


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;

// ========== ROOM ==========


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;

// ========== TASKS ==========


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;

// ========== HOST & AGENCY ==========


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;

// ========== GAMES & EVENTS ==========


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;

// ========== CLASH OF THRONES ==========


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;
// ===== Withdrawal & Exchange =====


/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */


// ===== Game Level Requirement Content =====


/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */



/* SUGO stage2: pane content moved to external lazy file. */


// ===== Sugo SV - tickets section content =====

// Binding

/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


// Reporting

/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


// ===== Sugo SV Clean Deduplicated Macros =====
// Added from user-provided ticket text; repeated variants were merged into unified professional macros.

/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


async function preparePaneElement(id) {
  id = String(id || '').trim();
  if (!id) return null;
  let existing = document.getElementById(`pane-${id}`);
  if (existing) return existing;

  const contentArea = document.getElementById('contentArea');
  if (!contentArea) return null;

  const paneDiv = document.createElement('div');
  paneDiv.className = 'content-pane';
  paneDiv.dataset.lazy = '1';
  paneDiv.id = `pane-${id}`;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-pane-btn';
  closeBtn.innerHTML = '✕';
  closeBtn.onclick = () => {
    clearAllContentAndWelcome();
    localStorage.removeItem('sugo_last_pane');
    if (window.SugoApp && SugoApp.navigation) SugoApp.navigation.clearBreadcrumb();
  };
  paneDiv.appendChild(closeBtn);

  const container = document.createElement('div');
  container.innerHTML = sugoPaneLoadingHtml(id);
  paneDiv.appendChild(container);
  contentArea.appendChild(paneDiv);
  renderedPanes.add(id);

  try {
    const html = await fetchSugoPaneHtml(id);
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    tmp.querySelectorAll('.copy-btn').forEach(btn => {
      const textToCopy = btn.getAttribute('data-copy-text');
      const originalText = btn.innerText;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyTextToClipboard(textToCopy, btn, '✓ Copied!', originalText);
      }, { passive: false });
    });
    if (typeof initContentVisibilityControls === 'function') initContentVisibilityControls(tmp);
    container.innerHTML = '';
    container.appendChild(tmp);
  } catch (err) {
    container.innerHTML = `<div class="doc-card"><p class="ai-answer-error">Could not load this SOP article.</p><p dir="rtl" class="ai-answer-error">تعذر تحميل هذا المحتوى.</p></div>`;
    console.warn('[SUGO] Pane load failed', id, err);
  }
  return paneDiv;
}

function buildPanes() {
  // Stage 2: pane content is stored as external files and loaded only when opened.
  renderedPanes.clear();
}

function clearAllContentAndWelcome() {
  document.querySelectorAll('.content-pane').forEach(p => p.classList.remove('active'));
  document.getElementById('welcomeMsg').style.display = 'flex';
  document.querySelectorAll('.nav-l000-btn').forEach(b => b.classList.remove('active'));
}

function showOnlyWelcome() {
  clearAllContentAndWelcome();
  localStorage.removeItem('sugo_last_pane');
}

async function showPane(paneId, save = true) {
  const pane = await preparePaneElement(paneId);
  if (!pane) return;
  window.SUGO_ACTIVE_PANE = paneId;
  window.SUGO_ACTIVE_PANE_TS = Date.now();
  clearAllContentAndWelcome();
  document.getElementById('welcomeMsg').style.display = 'none';
  pane.classList.add('active');
  const clicked = Array.from(document.querySelectorAll('.nav-l000-btn')).find(b => b.getAttribute('data-pane') === paneId);
  if (clicked) clicked.classList.add('active');
  if (save) localStorage.setItem('sugo_last_pane', paneId);
  if (window.SugoApp && SugoApp.navigation) SugoApp.navigation.syncToPane(paneId, { persist: save });
}

function handleL0Click(btn) {
  showOnlyWelcome();
  const children = btn.nextElementSibling;
  const chev = btn.querySelector('.nav-l0-chev');
  const isOpen = children.classList.contains('open');
  document.querySelectorAll('.nav-l0').forEach(l0 => {
    const ch = l0.querySelector('.nav-l0-children');
    const cv = l0.querySelector('.nav-l0-chev');
    if (ch && ch !== children) { ch.classList.remove('open'); if(cv) cv.classList.remove('open'); }
    const b = l0.querySelector('.nav-l0-btn');
    if(b && b!==btn) b.classList.remove('active');
  });
  if (isOpen) { children.classList.remove('open'); chev.classList.remove('open'); btn.classList.remove('active'); }
  else { children.classList.add('open'); chev.classList.add('open'); btn.classList.add('active'); }
}

function handleL00Click(btn) {
  showOnlyWelcome();
  const children = btn.nextElementSibling;
  const chev = btn.querySelector('.nav-l00-chev');
  const isOpen = children && children.classList.contains('open');
  const parentL0 = btn.closest('.nav-l0');
  if(parentL0) {
    parentL0.querySelectorAll('.nav-l00').forEach(l00 => {
      const ch = l00.querySelector('.nav-l00-children');
      const cv = l00.querySelector('.nav-l00-chev');
      const b = l00.querySelector('.nav-l00-btn');
      if(ch && ch !== children) { ch.classList.remove('open'); if(cv) cv.classList.remove('open'); if(b) b.classList.remove('active'); }
    });
  }
  if (isOpen && children) { children.classList.remove('open'); if(chev) chev.classList.remove('open'); btn.classList.remove('active'); }
  else if (children) { children.classList.add('open'); if(chev) chev.classList.add('open'); btn.classList.add('active'); }
  else {
    const paneId = btn.getAttribute('data-pane');
    if(paneId) showPane(paneId, true);
  }
}

function doSearch(val) {
  if (window.SugoApp && SugoApp.navigation && typeof SugoApp.navigation.search === 'function') {
    SugoApp.navigation.search(val);
    return;
  }
  const q = String(val || '').trim().toLowerCase();
  const nr = document.getElementById('noResults');
  if(!q) {
    document.querySelectorAll('.nav-l0,.nav-l00,.nav-l000-btn').forEach(el => el.classList.remove('hidden-search'));
    if(nr) nr.style.display='none';
    return;
  }
  const topics = typeof getAllTopics === 'function' ? getAllTopics() : [];
  const topicById = {};
  topics.forEach(t => topicById[t.id] = t);
  let any=false;
  document.querySelectorAll('.nav-l000-btn').forEach(btn => {
    const paneId = btn.getAttribute('data-pane');
    const record = paneId ? topicById[paneId] : null;
    const hay = ((btn.innerText || '') + '\n' + (record ? record.allText || '' : '')).toLowerCase();
    const match = hay.includes(q);
    btn.classList.toggle('hidden-search', !match);
    if(match) any=true;
  });
  document.querySelectorAll('.nav-l00').forEach(sec => {
    const vis = [...sec.querySelectorAll('.nav-l000-btn')].some(b => !b.classList.contains('hidden-search'));
    sec.classList.toggle('hidden-search', !vis);
  });
  document.querySelectorAll('.nav-l0').forEach(sec => {
    const vis = [...sec.querySelectorAll('.nav-l00')].some(s => !s.classList.contains('hidden-search'));
    sec.classList.toggle('hidden-search', !vis);
  });
  if(nr) nr.style.display = any ? 'none' : 'block';
}


// ===== SUGO Added Information — Internal Escalation & Clean Macros =====

/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */



// ===== New Text Coverage Gap Additions — merged into SUGO Knowledgebase =====

/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;


/* SUGO stage2: pane content moved to external lazy file. */
;

// ===== AI Smart Answer Configuration =====
// Cloudflare Worker URL. Keep this public URL only; API secrets must stay in Cloudflare env variables.
const AI_PROXY_URL = "https://sugo.dwairy101.workers.dev";

// Optional: only use this if you intentionally protect a PRIVATE frontend with CLIENT_ACCESS_TOKEN.
// Do not treat this as a real secret when the page is public on GitHub Pages.
const AI_CLIENT_TOKEN = "";

// Safety timeout for long AI requests.
const AI_REQUEST_TIMEOUT_MS = 90000;

// Auto-grow the search textarea as the user types longer questions
function autoResizeSearch(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

let sugoAiAttachedImage = null;
const SUGO_VISION_MAX_FILE_BYTES = 8 * 1024 * 1024;
const SUGO_VISION_MAX_BASE64_CHARS = 6500000;
const SUGO_VISION_MAX_EDGE = 1600;
const SUGO_VISION_JPEG_QUALITY = 0.84;
const SUGO_VISION_ALLOWED_TYPES = new Set(['image/jpeg','image/png','image/webp']);

function sugoTriggerVisionUpload() {
  const input = document.getElementById('sugoVisionInput');
  if (input) input.click();
}

function sugoFormatBytes(bytes) {
  const n = Number(bytes || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function sugoSetVisionStatus(message, isError) {
  const el = document.getElementById('sugoVisionStatus');
  if (!el) return;
  if (!message) {
    el.classList.remove('active','error');
    el.textContent = '';
    return;
  }
  el.textContent = message;
  el.classList.add('active');
  el.classList.toggle('error', !!isError);
}

function sugoReadFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
  });
}

function sugoLoadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('The selected file could not be opened as an image.'));
    img.src = dataUrl;
  });
}

function sugoEstimateBase64Bytes(base64) {
  const clean = String(base64 || '').replace(/\s+/g, '');
  return Math.max(0, Math.floor(clean.length * 0.75));
}

async function sugoPrepareImageForAI(file) {
  const rawType = String(file.type || '').toLowerCase() === 'image/jpg' ? 'image/jpeg' : String(file.type || '').toLowerCase();
  if (!SUGO_VISION_ALLOWED_TYPES.has(rawType)) {
    throw new Error('Supported image types: JPG, PNG, or WebP only.');
  }
  if (file.size > SUGO_VISION_MAX_FILE_BYTES) {
    throw new Error(`Image is too large. Max ${sugoFormatBytes(SUGO_VISION_MAX_FILE_BYTES)} before compression.`);
  }

  const originalDataUrl = await sugoReadFileAsDataURL(file);
  const image = await sugoLoadImage(originalDataUrl);
  const originalWidth = image.naturalWidth || image.width;
  const originalHeight = image.naturalHeight || image.height;
  if (!originalWidth || !originalHeight) throw new Error('Image dimensions could not be detected.');

  const scale = Math.min(1, SUGO_VISION_MAX_EDGE / Math.max(originalWidth, originalHeight));
  const width = Math.max(1, Math.round(originalWidth * scale));
  const height = Math.max(1, Math.round(originalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/jpeg', SUGO_VISION_JPEG_QUALITY);
  const base64 = dataUrl.split(',')[1] || '';
  if (!base64 || base64.length > SUGO_VISION_MAX_BASE64_CHARS) {
    throw new Error('Image is still too large after compression. Please choose a clearer/smaller screenshot.');
  }

  return {
    mimeType: 'image/jpeg',
    data: base64,
    name: file.name || 'attached-image.jpg',
    originalType: rawType,
    originalSize: file.size,
    size: sugoEstimateBase64Bytes(base64),
    width,
    height,
    originalWidth,
    originalHeight,
    previewDataUrl: dataUrl
  };
}

function renderSugoVisionPreview() {
  const preview = document.getElementById('sugoVisionPreview');
  if (!preview) return;
  if (!sugoAiAttachedImage) {
    preview.classList.remove('has-image');
    preview.innerHTML = '';
    return;
  }
  const img = sugoAiAttachedImage;
  preview.classList.add('has-image');
  preview.innerHTML = `
    <img class="sugo-vision-thumb" src="${img.previewDataUrl}" alt="Attached image preview">
    <div class="sugo-vision-meta">
      <div class="sugo-vision-name">${escapeHtml(img.name)}</div>
      <div class="sugo-vision-sub">${img.width}×${img.height} · ${sugoFormatBytes(img.size)} compressed</div>
    </div>
    <button class="sugo-vision-clear" type="button" onclick="clearSugoVisionImage()" title="Remove image">×</button>`;
}

async function handleSugoVisionImage(file) {
  if (!file) return;
  try {
    sugoSetVisionStatus('Preparing image for AI analysis…', false);
    sugoAiAttachedImage = await sugoPrepareImageForAI(file);
    renderSugoVisionPreview();
    sugoSetVisionStatus('', false);
  } catch (err) {
    sugoAiAttachedImage = null;
    renderSugoVisionPreview();
    sugoSetVisionStatus(err.message || String(err), true);
  }
}

function clearSugoVisionImage() {
  sugoAiAttachedImage = null;
  renderSugoVisionPreview();
  sugoSetVisionStatus('', false);
}

function buildSugoImagePayload(image) {
  if (!image) return undefined;
  return [{
    mimeType: image.mimeType,
    data: image.data,
    name: image.name,
    width: image.width,
    height: image.height
  }];
}

// Minimal markdown -> HTML renderer (headings, bold, italics, lists, paragraphs)
// Removes leading meta-commentary lines like "Based on the provided knowledge base, ..."
function stripPreamble(text) {
  const lines = text.split(/\r?\n/);
  const preamblePattern = /^(based on|according to|here is|here's|the following is|i found|i couldn't find|i was unable)\b/i;
  while (lines.length > 1) {
    const first = lines[0].trim();
    // Only strip plain-prose lines (not headings, lists, or empty lines)
    if (first && !/^(#{1,3}\s|[-*•]\s|\d+\.\s)/.test(first) && preamblePattern.test(first)) {
      lines.shift();
      // also drop a following blank line
      if (lines[0] && lines[0].trim() === '') lines.shift();
    } else {
      break;
    }
  }
  return lines.join('\n').trim();
}

// Converts common LaTeX-style math notation to plain Unicode symbols,
// in case the model slips and outputs $\ge$, \rightarrow, etc.
// Heuristic: does this answer look like it was cut off mid-thought?
// (no trailing punctuation, or ends with a dangling list marker/heading)
function isLikelyTruncated(text) {
  const trimmed = text.trimEnd();
  if (!trimmed) return false;
  const lastLine = trimmed.split(/\r?\n/).pop().trim();
  // Ends with a heading marker or list marker but no content = cut off
  if (/^(#{1,3}|[-*•]|\d+\.)\s*$/.test(lastLine)) return true;
  // Last character isn't sentence-ending punctuation (in English or Arabic)
  const lastChar = trimmed.slice(-1);
  if (!/[.!?:؛…)\]"'`]/.test(lastChar)) return true;
  return false;
}

// Trims an answer back to the last complete sentence/list item/paragraph,
// so it doesn't end abruptly mid-word or mid-thought.
function trimToLastComplete(text) {
  const trimmed = text.trimEnd();
  // Try cutting at the last sentence-ending punctuation followed by space/newline
  const sentenceEnds = [...trimmed.matchAll(/[.!?…]\s/g)];
  if (sentenceEnds.length > 0) {
    const last = sentenceEnds[sentenceEnds.length - 1];
    const cut = trimmed.slice(0, last.index + 1);
    if (cut.length > trimmed.length * 0.5) return cut.trim();
  }
  // Fallback: cut at the last complete line (paragraph/list item)
  const lines = trimmed.split(/\r?\n/);
  while (lines.length > 1) {
    const last = lines[lines.length - 1].trim();
    if (!last || /[.!?:؛…)\]"'`]$/.test(last)) {
      return lines.join('\n').trim();
    }
    lines.pop();
  }
  return trimmed;
}

function stripLatexNotation(text) {
  const replacements = [
    [/\$\\geq?\$/g, '≥'],
    [/\$\\leq?\$/g, '≤'],
    [/\$\\neq\$/g, '≠'],
    [/\$\\rightarrow\$/g, '→'],
    [/\$\\leftarrow\$/g, '←'],
    [/\$\\times\$/g, '×'],
    [/\$\\div\$/g, '÷'],
    [/\\geq?/g, '≥'],
    [/\\leq?/g, '≤'],
    [/\\neq/g, '≠'],
    [/\\rightarrow/g, '→'],
    [/\\leftarrow/g, '←'],
    [/\\times/g, '×'],
    [/\\div/g, '÷'],
    // Strip leftover $...$ wrappers around plain text/numbers
    [/\$([^$]+)\$/g, '$1'],
  ];
  let result = text;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function renderMarkdown(md) {
  const lines = String(md || '').replace(/\u00a0/g, ' ').split(/\r?\n/);
  let html = '';
  let inUl = false, inOl = false, inQuote = false, inCode = false;
  let expectedOl = 1;
  let codeBuffer = [];

  const closeLists = () => {
    if (inUl) { html += '</ul>'; inUl = false; }
    if (inOl) { html += '</ol>'; inOl = false; expectedOl = 1; }
    if (inQuote) { html += '</blockquote>'; inQuote = false; }
  };
  const inline = (t) => {
    t = escapeHtml(String(t || ''));
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
    return t;
  };
  const classify = (line) => {
    const trimmed = String(line || '').trim();
    let m;
    if ((m = trimmed.match(/^[-*•]\s+(.*)$/))) return {kind:'ul', content:m[1] || ''};
    if ((m = trimmed.match(/^(\d+)[.)]\s+(.*)$/))) return {kind:'ol', number:parseInt(m[1],10) || 1, content:m[2] || ''};
    return null;
  };
  const nextClassified = (fromIndex) => {
    for (let j = fromIndex; j < lines.length; j++) {
      if (String(lines[j]).trim() === '') continue;
      return classify(lines[j]);
    }
    return null;
  };
  const openUl = () => { if (!inUl) { closeLists(); html += '<ul>'; inUl = true; } };
  const openOl = (start) => {
    const safeStart = Math.max(1, Number(start) || 1);
    if (!inOl) { closeLists(); html += `<ol${safeStart > 1 ? ` start="${safeStart}"` : ''}>`; inOl = true; expectedOl = safeStart; }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = String(raw || '').trim();

    if (line.startsWith('```')) {
      if (inCode) {
        html += `<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`;
        codeBuffer = [];
        inCode = false;
      } else {
        closeLists();
        inCode = true;
      }
      continue;
    }
    if (inCode) { codeBuffer.push(raw); continue; }

    if (!line) {
      const next = nextClassified(i + 1);
      if ((inUl && next && next.kind === 'ul') || (inOl && next && next.kind === 'ol')) continue;
      closeLists();
      continue;
    }

    let m, item;
    if ((m = line.match(/^(#{1,3})\s+(.*)/))) {
      closeLists();
      const lvl = m[1].length;
      const isArabicHeading = /[\u0600-\u06FF]/.test(m[2]);
      html += `<h${lvl}${isArabicHeading ? ' data-ar-start="1"' : ''}>${inline(m[2])}</h${lvl}>`;
    } else if (/^(---|\*\*\*|___)$/.test(line)) {
      closeLists();
      html += '<hr>';
    } else if ((m = line.match(/^>\s*(.*)/))) {
      if (!inQuote) { closeLists(); html += '<blockquote>'; inQuote = true; }
      html += `<p>${inline(m[1])}</p>`;
    } else if ((item = classify(line)) && item.kind === 'ul') {
      openUl();
      html += `<li>${inline(item.content)}</li>`;
    } else if ((item = classify(line)) && item.kind === 'ol') {
      if (inOl) {
        const n = item.number || expectedOl;
        if (n > expectedOl + 1) { closeLists(); openOl(n); }
      } else {
        openOl(item.number || 1);
      }
      html += `<li>${inline(item.content)}</li>`;
      expectedOl += 1;
    } else {
      closeLists();
      html += `<p>${inline(line)}</p>`;
    }
  }
  if (inCode) html += `<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`;
  closeLists();
  return html;
}

// Wraps the Arabic portion of the rendered HTML in an RTL container
function wrapArabicSection(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const marker = tmp.querySelector('[data-ar-start]');
  if (!marker) return html;
  const wrapper = document.createElement('div');
  wrapper.className = 'ar-section';
  let node = marker;
  const toMove = [];
  while (node) { toMove.push(node); node = node.nextSibling; }
  toMove.forEach(n => wrapper.appendChild(n));
  tmp.appendChild(wrapper);
  return tmp.innerHTML;
}

// Collects all knowledge base text (English + Arabic) for the AI to search through
// Returns {id, enText, arText} for every topic
function getAllTopics() {
  if (sugoTopicsCache) return sugoTopicsCache;
  const source = sugoGetSearchTopicsSync();
  sugoTopicsCache = (source || []).map(t => ({
    id: t.id,
    title: t.title || t.label || String(t.id || '').replace(/-/g, ' '),
    label: t.label || t.title || String(t.id || '').replace(/-/g, ' '),
    category: t.category || '',
    section: t.section || '',
    library: t.library || '',
    path: t.path || '',
    enText: t.enText || '',
    arText: t.arText || '',
    allText: t.allText || t.bodyNorm || t.searchText || `${t.enText || ''}\n${t.arText || ''}`.toLowerCase(),
    titleNorm: t.titleNorm,
    pathNorm: t.pathNorm,
    bodyNorm: t.bodyNorm,
    tags: t.tags || []
  }));
  return sugoTopicsCache;
}

// Picks the most relevant topics for the query, to keep the prompt within
// the model's context window. Scores by keyword overlap (title + body).
function normalizeSugoText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ـ/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function expandSugoQuery(query) {
  const raw = normalizeSugoText(query);
  const synonyms = {
    'ban':['حظر','محظور','باند','blocked','block','restriction','suspend','suspended','unban','فك حظر'],
    'unban':['فك حظر','رفع الحظر','الغاء الحظر','appeal','restore'],
    'abuse':['اساءه','ابلاغ','report','insult','تحرش','تهديد','سب','شتم','مخالفه'],
    'report':['ابلاغ','شكوي','abuse','issue','مشكله'],
    'recharge':['شحن','رصيد','كوينز','coins','payment','دفع','شراء','charge'],
    'withdrawal':['سحب','withdraw','cashout','salary','payment','مستحقات'],
    'agency':['وكاله','agency','host','sub agency','main agency','انشاء وكاله'],
    'host':['مضيف','مضيفه','هوست','agency','hostess'],
    'password':['باسورد','كلمة السر','كلمه مرور','reset','recovery','استرجاع'],
    'phone':['رقم','هاتف','موبايل','mobile','change phone','linked phone'],
    'vip':['vip','في اي بي','charm','شارم'],
    'game':['لعبه','العاب','games','add game','remove game'],
    'location':['موقع','دوله','country','distance','مسافه'],
    'task':['task','tasks','مهمه','مهام','daily','family','عائله'],
    'match':['تطابق','matching','match','مطابقه'],
    'crash':['crash','تعطل','لا يعمل','app crash','bug','كراش']
  };
  const words = raw.split(/\s+/).filter(Boolean);
  const expanded = new Set(words);
  const joined = ' ' + raw + ' ';
  Object.entries(synonyms).forEach(([key, vals]) => {
    const all = [key, ...vals].map(normalizeSugoText);
    if (all.some(v => v && joined.includes(' ' + v + ' '))) {
      all.forEach(v => v.split(/\s+/).forEach(x => x && expanded.add(x)));
      expanded.add(normalizeSugoText(key));
    }
  });
  return Array.from(expanded).filter(w => w.length > 1);
}

function inferSugoTags(topic) {
  const text = normalizeSugoText((topic.id || '') + ' ' + (topic.enText || '') + ' ' + (topic.arText || ''));
  const tags = [];
  const add = (label, tests) => { if (tests.some(t => text.includes(normalizeSugoText(t)))) tags.push(label); };
  add('Abuse', ['abuse','اساءه','insult','ابلاغ']);
  add('Ban', ['ban','حظر','unban']);
  add('Payment', ['recharge','شحن','coins','withdrawal','سحب']);
  add('Agency', ['agency','وكاله','host']);
  add('VIP', ['vip','charm']);
  add('Account', ['account','login','password','phone','حساب']);
  add('Escalation', ['mention','reporting group','qa-cs','تصعيد']);
  add('Game', ['game','لعبه']);
  return [...new Set(tags)].slice(0, 5);
}

// Picks the most relevant topics for the query and returns source/confidence metadata.
function getRelevantKnowledgeBaseText(query, maxTopics = 8, maxCharsPerTopic = 1400, preferredPaneId = null) {
  const topics = getAllTopics();
  const selectedPaneId = String(preferredPaneId || '').trim();
  const selectedPaneExists = selectedPaneId && topics.some(t => t.id === selectedPaneId);
  const stopWords = new Set(['the','is','a','an','to','of','and','or','for','in','on','how','what','do','does','i','my','it','this','that','with','can','are','be','please','explain','whole','process','from','you','need','من','في','على','عن','هل','كيف','ما','ماذا','الى','إلى','او','أو','مع','هذا','هذه','لو','اذا','بدي','اريد','شو','ليش']);
  const rawQuery = normalizeSugoText(query);
  const queryWords = expandSugoQuery(query).filter(w => w.length > 1 && !stopWords.has(w));
  const phrase = rawQuery;

  const scored = topics.map(t => {
    const title = normalizeSugoText(t.id.replace(/-/g, ' '));
    const en = normalizeSugoText(t.enText);
    const ar = normalizeSugoText(t.arText);
    const haystack = `${title} ${en} ${ar}`;
    let score = 0;
    const hits = [];

    if (phrase && phrase.length >= 4 && haystack.includes(phrase)) {
      score += 8;
      hits.push(phrase);
    }
    for (const w of queryWords) {
      if (!w || w.length < 2) continue;
      if (title.includes(w)) { score += 3; hits.push(w); }
      if (haystack.includes(w)) { score += 1; hits.push(w); }
      if (w.length >= 5) {
        const stem = w.slice(0, -1);
        if (stem.length >= 4 && haystack.includes(stem)) score += 0.5;
      }
    }

    const uniqueHits = [...new Set(hits)].slice(0, 8);
    return {
      ...t,
      score,
      hits: uniqueHits,
      tags: inferSugoTags(t),
      label: t.id.replace(/^sc-/, '').replace(/-/g, ' ')
    };
  }).sort((a, b) => b.score - a.score);

  let top = scored.filter(t => t.score > 0).slice(0, maxTopics);

  if (selectedPaneExists) {
    const selectedTopic = scored.find(t => t.id === selectedPaneId);
    if (selectedTopic) {
      const selectedCopy = {
        ...selectedTopic,
        score: Math.max(selectedTopic.score || 0, 99),
        hits: [...new Set([...(selectedTopic.hits || []), 'selected-option'])],
        tags: [...new Set(['Selected SOP', ...(selectedTopic.tags || [])])],
        label: selectedTopic.label || selectedTopic.id.replace(/^sc-/, '').replace(/-/g, ' ')
      };
      top = [selectedCopy, ...top.filter(t => t.id !== selectedPaneId)].slice(0, maxTopics);
    }
  }

  const best = top[0] || null;
  const bestScore = best ? best.score : 0;
  const confidence = selectedPaneExists ? 'high' : bestScore >= 10 ? 'high' : bestScore >= 4 ? 'medium' : 'low';
  const confidenceLabel = confidence === 'high' ? 'High' : confidence === 'medium' ? 'Medium' : 'Low';

  return {
    text: top.map((t, index) => {
      const isSelected = selectedPaneExists && t.id === selectedPaneId && index === 0;
      const enLimit = isSelected ? Math.max(maxCharsPerTopic, 5200) : maxCharsPerTopic;
      const arLimit = isSelected ? Math.max(Math.floor(maxCharsPerTopic * 0.85), 4800) : Math.floor(maxCharsPerTopic * 0.85);
      const en = smartTruncate(t.enText || '', enLimit);
      const ar = smartTruncate(t.arText || '', arLimit);
      const tags = t.tags && t.tags.length ? `\nTags: ${t.tags.join(', ')}` : '';
      const selectedLine = isSelected ? `\nSelected by user: yes` : '';
      return `### Topic: ${t.id}\nMatch score: ${Math.round(t.score * 10) / 10}${selectedLine}${tags}\nEnglish SOP:\n${en}\n\nArabic SOP:\n${ar}`;
    }).join('\n\n'),
    topicIds: top.map(t => t.id),
    topics: top,
    bestTopic: best,
    confidence,
    confidenceLabel,
    confidenceScore: Math.round(bestScore * 10) / 10,
    hasMeaningfulMatch: top.length > 0 && bestScore >= 2
  };
}


/* ===== SUGO ACCURACY ROUTER v3.0 =====
   Applies to Search, Ask AI, and Create Ticket.
   It routes specific issues to exact SOP/ticket macros and demotes broad generic articles. */
const SUGO_ACC_SYNONYMS = {
  ban:['حظر','محظور','باند','موقوف','ايقاف','إيقاف','تقييد','ban','banned','blocked','restriction','restricted','suspend','suspended'],
  unban:['فك حظر','رفع الحظر','الغاء الحظر','إلغاء الحظر','استئناف','مراجعة','اعتذار','appeal','unban','review','restore','apology'],
  reason:['سبب','بسبب','ليش','لماذا','reason','because','due'],
  message:['رساله','رسالة','رسائل','محادثه','محادثة','دردشه','دردشة','شات','خاص','chat','message','messages','conversation','dm','inbox'],
  sexual:['جنسي','جنسية','كلام جنسي','رسائل جنسية','محتوى جنسي','الفاظ جنسية','إيحاء','ايحاء','إباحي','اباحي','عري','تعري','عضو','sexual','sex','explicit','sexually','porn','nudity','nude','private part'],
  picture:['صوره','صورة','صور','لقطه','لقطة','سكرين','photo','picture','image','screenshot'],
  video:['فيديو','مقطع','تسجيل','video','recording','clip'],
  moments:['لحظات','منشور','بوست','moment','moments','post','feed'],
  live:['لايف','بث','الغرفه','الغرفة','غرفه','غرفة','live','room','broadcast'],
  telegram:['تليجرام','تلجرام','تيليجرام','telegram','tg'],
  phone:['رقم هاتف','رقم الهاتف','هاتف','جوال','موبايل','phone','phone number','mobile'],
  underage:['قاصر','تحت السن','اقل من 18','أقل من 18','طفل','اطفال','أطفال','minor','underage','under age','child','children'],
  maleFemale:['ذكر بحساب انثى','ذكر بحساب أنثى','ولد بحساب بنت','شاب بحساب بنت','male using female','female account','wrong gender'],
  smoking:['تدخين','يدخن','سيجار','سيجاره','سيجارة','smoking','smoke','cigarette'],
  drug:['مخدر','مخدرات','حشيش','تعاطي','drug','drugs','narcotic','weed'],
  weapon:['سلاح','اسلحه','أسلحة','مسدس','سكين','weapon','gun','knife'],
  insult:['سب','شتم','اساءه','إساءة','اهانه','إهانة','insult','abuse','curse','swear'],
  management:['اداره','إدارة','الادارة','الإدارة','مشرف','مسؤول','admin','management','moderator','official'],
  coinSeller:['بائع كوينز','بائع كوين','بيع كوينز','coin seller','sell coins','seller'],
  promote:['ترويج','اعلان','إعلان','منصه اخرى','منصة أخرى','تطبيق اخر','تطبيق آخر','promote','promotion','advertise','other app','platform'],
  vpn:['vpn','في بي ان','فى بى ان','محاكي','محاكى','simulator','region','منطقه','منطقة'],
  refund:['استرداد','رد المبلغ','ترجيع','refund','chargeback'],
  rejected:['رفض','مرفوض','تم رفض','reject','rejected','declined'],
  abnormalDevice:['جهاز غير طبيعي','جهاز غير طبيعى','abnormal device','device abnormal'],
  country:['دوله','دولة','بلد','country'],
  religion:['دين','اديان','أديان','religion','religions'],
  childPorn:['استغلال اطفال','استغلال أطفال','اباحيه اطفال','إباحية أطفال','child porn','csam'],
  recharge:['شحن','رصيد','كوينز','كوين','ذهب','شراء','دفع','recharge','charge','coins','coin','gold','payment','purchase'],
  invoice:['فاتوره','فاتورة','ايصال','إيصال','وصل','رقم العمليه','رقم العملية','invoice','receipt','transaction'],
  visa:['فيزا','visa','card','بطاقه','بطاقة'],
  agency:['وكاله','وكالة','اجنسي','agency','agent'],
  host:['مضيف','مضيفه','مذيع','مذيعه','host','anchor'],
  withdrawal:['سحب','راتب','مستحقات','ماسات','تحويل','withdraw','withdrawal','salary','payout','diamonds'],
  cancel:['الغاء','إلغاء','cancel'],
  add:['اضافه','إضافة','اضف','add'],
  remove:['حذف','ازاله','إزالة','remove','delete'],
  game:['لعبه','لعبة','العاب','ألعاب','game','games'],
  info:['معلومات','تفاصيل','شرح','info','information','details'],
  crash:['تعطل','لا يعمل','كراش','مشكله تطبيق','مشكلة تطبيق','crash','bug','not working'],
  location:['موقع','مسافه','مسافة','اخفاء المسافة','إخفاء المسافة','location','distance'],
  disappear:['اختفي','اختفى','مختفي','اختفاء','disappear','missing'],
  task:['مهمه','مهمة','مهام','تاسك','task','tasks','daily','family'],
  match:['تطابق','مطابقه','مطابقة','match','matching'],
  password:['باسورد','كلمة السر','كلمة السر','كلمه مرور','كلمة مرور','password','reset password'],
  binding:['ربط','توثيق','تحقق','ملكيه','ملكية','binding','bind','verification','verify','ownership'],
  change:['تغيير','تعديل','نقل','change','transfer'],
  whatsapp:['واتساب','واتس','whatsapp','wa'],
  create:['انشاء','إنشاء','فتح','create','open'],
  notReceived:['ما وصل','ما وصلت','لم يصل','لم تصل','لم استلم','لم يستلم','not received','missing'],
  account:['حساب','اكونت','account','profile']
};
const SUGO_ACC_ROUTES = [
  ['ban-sexual-messages', [['ban'],['sexual'],['message']], [], ['sv-tickets-ban-sexual-messages'], ['sv-refined-ban-sexual-messages','sv-refined-ban-sexual-content-in-messages']],
  ['ban-sexual-picture', [['ban'],['sexual'],['picture']], [], ['sv-tickets-ban-sexual-picture'], ['sv-refined-ban-sexual-picture']],
  ['ban-sexual-video', [['ban'],['sexual'],['video']], [], ['sv-tickets-ban-sexual-video'], ['sv-refined-ban-sexual-video']],
  ['ban-sexual-moments', [['ban'],['sexual'],['moments']], [], ['sv-tickets-ban-sexual-moments'], ['sv-refined-ban-sexual-moments']],
  ['ban-sexual-commerce', [['ban'],['sexual']], [['coinSeller'],['recharge']], ['sv-tickets-ban-sexual-commerce'], ['sv-refined-ban-sexual-commerce']],
  ['ban-sexual-offer', [['ban'],['sexual']], [['عرض','طلب علاقه','طلب علاقة','offer']], ['sv-tickets-ban-sexual-offer'], ['sv-refined-ban-sexual-offer']],
  ['ban-private-part-lr', [['ban'],['sexual']], [['private part','عضو']], ['sv-tickets-ban-private-part-lr'], []],
  ['ban-telegram', [['ban'],['telegram']], [], ['sv-tickets-ban-telegram'], ['sv-refined-ban-external-contact-telegram']],
  ['ban-phone-number', [['ban'],['phone']], [], ['sv-tickets-ban-ph-num'], ['sv-refined-ban-external-contact-phone-number']],
  ['ban-underage', [['ban'],['underage']], [], ['sv-tickets-ban-underage-video','sv-tickets-ban-underage'], ['sv-refined-unban-review-underage-verification-video-sent','sv-refined-ban-underage-suspicion']],
  ['ban-male-female', [['ban'],['maleFemale']], [], ['sv-tickets-ban-male-female-unban-video','sv-tickets-ban-male-female-reason'], ['sv-refined-unban-review-male-using-female-account-video-sent','sv-refined-ban-male-using-female-account']],
  ['ban-smoking-live', [['ban'],['smoking'],['live']], [], ['sv-tickets-ban-smoking-live'], ['sv-refined-ban-smoking-during-live']],
  ['ban-smoking-image', [['ban'],['smoking'],['picture']], [], ['sv-tickets-ban-smoking-image'], ['sv-refined-ban-smoking-image']],
  ['ban-drug-live', [['ban'],['drug'],['live']], [], ['sv-tickets-ban-drug-live'], ['sv-refined-ban-drug-use-during-live']],
  ['ban-drug-image', [['ban'],['drug'],['picture']], [], ['sv-tickets-ban-drug-image'], ['sv-refined-ban-drug-use-image']],
  ['ban-weapon-live', [['ban'],['weapon'],['live']], [], ['sv-tickets-ban-weapon-live'], ['sv-refined-ban-weapon-during-live']],
  ['ban-weapon-image', [['ban'],['weapon'],['picture']], [], ['sv-tickets-ban-weapon-image'], ['sv-refined-ban-weapon-image']],
  ['ban-insulting', [['ban'],['insult']], [], ['sv-tickets-ban-insulting'], ['sv-refined-ban-insulting-another-user']],
  ['ban-pretend-management', [['ban'],['management']], [['انتحال','يدعي','يتظاهر','pretend']], ['sv-tickets-ban-pretend-management'], ['sv-refined-ban-pretending-to-be-management']],
  ['ban-pretend-coin-seller', [['ban'],['coinSeller']], [['انتحال','يدعي','يتظاهر','pretend']], ['sv-tickets-ban-pretend-coin-seller'], ['sv-refined-ban-pretending-to-be-a-coin-seller']],
  ['ban-promoting-app', [['ban'],['promote']], [], ['sv-tickets-ban-promoting-app'], ['sv-refined-ban-promoting-other-platforms']],
  ['ban-vpn-simulator', [['ban'],['vpn']], [], ['sv-tickets-ban-simulator-vpn'], ['sv-refined-ban-vpn-region-violation']],
  ['ban-refund', [['ban'],['refund']], [], ['sv-tickets-ban-refund'], []],
  ['ban-rejected-unban', [['ban'],['rejected'],['unban']], [], ['sv-tickets-ban-rejected-unban'], []],
  ['ban-abnormal-device', [['ban'],['abnormalDevice']], [], ['sv-tickets-ban-abnormal-device'], []],
  ['ban-insulted-country', [['ban'],['country'],['insult']], [], ['sv-tickets-ban-insulted-country'], []],
  ['ban-insulted-religions', [['ban'],['religion'],['insult']], [], ['sv-tickets-ban-insulted-religions'], []],
  ['ban-child-porn', [['ban'],['childPorn']], [], ['sv-tickets-ban-child-porn'], []],
  ['ban-request-unban', [['ban'],['unban']], [], ['sv-tickets-ban-request-unban'], ['sv-refined-request-unban-apology','account-ban-unban']],
  ['coins-not-received', [['recharge'],['notReceived']], [], ['sv-tickets-coins-not-received'], ['sv-refined-coins-not-received','payment-recharge-missing-coins']],
  ['recharge-invoice', [['recharge'],['invoice']], [], ['sv-tickets-recharge-ticket-1','sv-tickets-recharge-ticket-2'], ['sv-refined-request-recharge-invoice']],
  ['recharge-link', [['recharge'],['رابط','link']], [], ['sv-tickets-recharge-link'], ['sv-refined-recharge-link']],
  ['recharge-first-charge', [['recharge'],['اول','أول','first']], [], ['sv-tickets-recharge-first-charge'], ['sv-refined-first-recharge-requirement']],
  ['recharge-visa', [['recharge'],['visa']], [], ['sv-tickets-recharge-visa'], ['sv-refined-recharge-through-visa']],
  ['recharge-agency', [['recharge'],['agency']], [], ['sv-tickets-recharge-agency-eg','sv-tickets-recharge-agency-sa','sv-tickets-recharge-agency-sy','sv-tickets-recharge-agency-iq','sv-tickets-recharge-agency-ae'], ['sv-refined-recharge-through-agency-egypt','sv-refined-recharge-through-agency-saudi-arabia','sv-refined-recharge-through-agency-syria','sv-refined-recharge-through-agency-iraq','sv-refined-recharge-through-agency-uae']],
  ['withdrawal-success-not-received', [['withdrawal'],['notReceived']], [], ['sv-tickets-withdrawal-success-not-received'], ['sv-refined-withdrawal-successful-but-not-received']],
  ['withdrawal-cancel', [['withdrawal'],['cancel']], [], ['sv-tickets-withdrawal-cancel'], ['sv-refined-cancel-withdrawal-request']],
  ['withdrawal-add-remove', [['withdrawal']], [['add'],['remove']], ['sv-tickets-withdrawal-add-remove'], ['sv-refined-add-remove-withdrawal-option']],
  ['binding-verification', [['binding']], [['account'],['verification']], ['sv-tickets-binding-verification'], ['sv-refined-account-ownership-verification']],
  ['password-reset', [['password']], [], ['sv-tickets-binding-request-reset-password'], ['sv-refined-password-reset-request-submitted','account-security-reset']],
  ['phone-change', [['phone'],['change']], [], ['sv-tickets-binding-request-change-ph'], ['sv-refined-phone-binding-request-submitted','account-login-phone']],
  ['agency-create', [['agency'],['create']], [], ['sv-tickets-agency-create'], ['sv-refined-create-host-agency','sv-refined-apply-to-open-host-agency']],
  ['agency-change-anchor', [['agency'],['host'],['change']], [], ['sv-tickets-agency-change-anchor'], ['sv-refined-change-agency-for-anchor']],
  ['agency-sub-create', [['agency'],['sub','فرعيه','فرعية'],['create']], [], ['sv-tickets-agency-create-sub'], ['sv-refined-create-sub-agency']],
  ['agency-admin-whatsapp', [['agency'],['whatsapp']], [], ['sv-tickets-agency-admin-whatsapp-group'], ['sv-refined-agency-admin-whatsapp-group-requirements']],
  ['games-add', [['game'],['add']], [], ['sv-tickets-games-add'], ['sv-refined-add-game-request','sv-refined-add-games-request']],
  ['games-remove', [['game'],['remove']], [], ['sv-tickets-games-remove'], ['sv-refined-remove-game-request','sv-refined-remove-games-request']],
  ['games-info', [['game'],['info']], [], ['sv-tickets-games-info','sv-tickets-games-info-3'], ['sv-refined-game-access-information','sv-refined-games-access-conditions']],
  ['app-crash', [['crash']], [], ['sv-tickets-crash-1','sv-tickets-crash-2'], ['sv-refined-app-crash-refresh-steps','sv-refined-app-crash-upload-log','function-games-crashing']],
  ['country-change', [['country'],['change']], [], ['sv-tickets-country-1','sv-tickets-country-2'], ['sv-refined-change-country','sv-refined-change-country-follow-up']],
  ['location-disappear', [['location'],['disappear']], [], ['sv-tickets-location-disappear'], ['sv-refined-location-disappeared']],
  ['location-close-distance', [['location']], [['اخفاء','إخفاء','close'],['distance','مسافه','مسافة']], ['sv-tickets-location-close'], ['sv-refined-close-location-hide-distance']],
  ['tasks-daily-family', [['task']], [['daily','يومي'],['family','عائله','عائلة']], ['sv-tickets-tasks-daily-family'], ['sv-refined-daily-and-family-tasks']],
  ['tasks-match', [['match']], [], ['sv-tickets-tasks-match1','sv-tickets-tasks-match2','sv-tickets-tasks-match3'], ['sv-refined-matching-issue-1','sv-refined-matching-issue-2','sv-refined-matching-issue-3']]
].map(r => ({ name:r[0], all:r[1] || [], any:r[2] || [], ticketTopicIds:r[3] || [], topicIds:r[4] || [] }));
function sugoAccTerms(keysOrTerms){ const out=[]; (keysOrTerms||[]).forEach(item=>{ const key=String(item||'').trim(); if(!key) return; if(SUGO_ACC_SYNONYMS[key]) out.push(key,...SUGO_ACC_SYNONYMS[key]); else out.push(key); }); return [...new Set(out.map(normalizeSugoText).filter(Boolean))]; }
function sugoAccHasAny(text, keysOrTerms){ const hay=' '+normalizeSugoText(text)+' '; return sugoAccTerms(keysOrTerms).some(term => term && (term.length<=3 ? hay.includes(' '+term+' ') : hay.includes(term))); }
function sugoAccRuleMatches(rule, raw){ if(rule.all && !rule.all.every(g=>sugoAccHasAny(raw,g))) return false; if(rule.any && rule.any.length && !rule.any.some(g=>sugoAccHasAny(raw,g))) return false; return true; }
function detectSugoAccuracyRoutes(query){ const raw=normalizeSugoText(query); return SUGO_ACC_ROUTES.filter(r=>sugoAccRuleMatches(r,raw)).map(r=>({ ...r, topicIds:[...new Set([...(r.ticketTopicIds||[]),...(r.topicIds||[])])] })); }
function isSugoSpecificCase(query){ const groups=['sexual','message','picture','video','moments','live','telegram','phone','underage','maleFemale','smoking','drug','weapon','insult','management','coinSeller','promote','vpn','refund','rejected','abnormalDevice','country','religion','childPorn','invoice','visa','withdrawal','agency','game','crash','location','task','match','password','binding']; return groups.some(g=>sugoAccHasAny(query,[g])); }
function isSugoGenericTopicId(id,wantsUnban){ const v=String(id||'').toLowerCase(); if(v==='account-ban-unban' && !wantsUnban) return true; if(/overview|general|guide|process|reasons|placeholder|information-alternative/.test(v)) return true; if(!wantsUnban && /request-unban|unban|appeal|refund|rejected-unban/.test(v)) return true; return false; }
function expandSugoQuery(query){ const raw=normalizeSugoText(query); const words=raw.split(/\s+/).filter(Boolean); const expanded=new Set(words); const joined=' '+raw+' '; Object.entries(SUGO_ACC_SYNONYMS).forEach(([key,vals])=>{ const all=[key,...vals].map(normalizeSugoText).filter(Boolean); if(all.some(v=>v && (v.length<=3 ? joined.includes(' '+v+' ') : joined.includes(v)))){ all.forEach(v=>v.split(/\s+/).forEach(x=>x&&expanded.add(x))); expanded.add(normalizeSugoText(key)); }}); return Array.from(expanded).filter(w=>w.length>1); }
function getRelevantKnowledgeBaseText(query, maxTopics = 8, maxCharsPerTopic = 1400, preferredPaneId = null, options = {}) {
  options = (options && typeof options === 'object') ? options : {};
  const topics = getAllTopics();
  const selectedPaneId = String(preferredPaneId || '').trim();
  const selectedPaneExists = selectedPaneId && topics.some(t => t.id === selectedPaneId);
  const preferTicketTopics = options.preferTicketTopics === true || options.outputType === 'ticket' || options.smartTicket === true;
  const stopWords = new Set(['the','is','a','an','to','of','and','or','for','in','on','how','what','do','does','i','my','it','this','that','with','can','are','be','please','explain','whole','process','from','you','need','customer','client','issue','problem','case','من','في','على','عن','هل','كيف','ما','ماذا','الى','إلى','او','أو','مع','هذا','هذه','لو','اذا','إذا','بدي','اريد','أريد','شو','ليش','العميل','المستخدم','مشكله','مشكلة','موضوع','حاله','حالة','بسبب']);
  const rawQuery = normalizeSugoText(query);
  const queryWords = expandSugoQuery(query).filter(w => w.length > 1 && !stopWords.has(w));
  const originalWords = rawQuery.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
  const phrase = rawQuery;
  const accuracyRoutes = detectSugoAccuracyRoutes(query);
  const primaryRoute = accuracyRoutes[0] || null;
  const primaryTopicIds = primaryRoute ? [...new Set([...(primaryRoute.ticketTopicIds || []), ...(primaryRoute.topicIds || [])])] : [];
  const wantsUnban = sugoAccHasAny(rawQuery, ['unban']);
  const specific = isSugoSpecificCase(query);
  const scored = topics.map(t => {
    const id = String(t.id || '');
    const title = normalizeSugoText(id.replace(/-/g,' '));
    const en = normalizeSugoText(t.enText);
    const ar = normalizeSugoText(t.arText);
    const haystack = `${title} ${en} ${ar}`;
    let score = 0; const hits=[]; const routeHits=[];
    if(phrase && phrase.length >= 4 && haystack.includes(phrase)){ score += title.includes(phrase) ? 28 : 14; hits.push(phrase); }
    accuracyRoutes.forEach((route, idx)=>{ const ticketHit=(route.ticketTopicIds||[]).includes(id); const topicHit=(route.topicIds||[]).includes(id); if(ticketHit || topicHit){ const base=idx===0?120:70; score += ticketHit ? base + (preferTicketTopics ? 60 : 15) : base; routeHits.push(route.name); }});
    if(preferTicketTopics){ if(id.startsWith('sv-tickets-')) score += 9; else if(id.startsWith('sv-refined-')) score += 3; }
    for(const w of queryWords){ if(!w || w.length<2) continue; const exactTitle=(' '+title+' ').includes(' '+w+' '); if(exactTitle){score+=8; hits.push(w);} else if(title.includes(w)){score+=5; hits.push(w);} const exactHay=(' '+haystack+' ').includes(' '+w+' '); if(exactHay){score+=2.2; hits.push(w);} else if(haystack.includes(w)){score+=0.9; hits.push(w);} if(w.length>=5){const stem=w.slice(0,-1); if(stem.length>=4 && haystack.includes(stem)) score+=0.35;} }
    for(const w of originalWords){ if(title.includes(w)) score += 2.5; else if(haystack.includes(w)) score += 0.8; }
    if(specific && isSugoGenericTopicId(id,wantsUnban) && !primaryTopicIds.includes(id)) score -= preferTicketTopics ? 35 : 22;
    if(sugoAccHasAny(rawQuery,['ban']) && !wantsUnban && /unban|appeal|request-unban|rejected-unban|refund/.test(id) && !primaryTopicIds.includes(id)) score -= 28;
    score = Math.max(0, score);
    return { ...t, score, hits:[...new Set([...routeHits,...hits])].slice(0,10), routeHits, tags:inferSugoTags(t), label:id.replace(/^sc-/,'').replace(/-/g,' ') };
  }).sort((a,b)=>{ if(b.score!==a.score) return b.score-a.score; if(preferTicketTopics && a.id.startsWith('sv-tickets-')!==b.id.startsWith('sv-tickets-')) return a.id.startsWith('sv-tickets-')?-1:1; return String(a.id).localeCompare(String(b.id)); });
  let top = scored.filter(t=>t.score>0).slice(0,maxTopics);
  if(selectedPaneExists){ const selectedTopic=scored.find(t=>t.id===selectedPaneId); if(selectedTopic){ const selectedCopy={...selectedTopic, score:Math.max(selectedTopic.score||0,160), hits:[...new Set([...(selectedTopic.hits||[]),'selected-option'])], tags:[...new Set(['Selected SOP',...(selectedTopic.tags||[])])], label:selectedTopic.label || selectedTopic.id.replace(/^sc-/,'').replace(/-/g,' ')}; top=[selectedCopy,...top.filter(t=>t.id!==selectedPaneId)].slice(0,maxTopics); } }
  if(!selectedPaneExists && primaryTopicIds.length){ const forced=primaryTopicIds.map(id=>scored.find(t=>t.id===id)).filter(Boolean).map((t,idx)=>({...t, score:Math.max(t.score||0,180-idx), hits:[...new Set([...(t.hits||[]), primaryRoute.name, 'primary-route'])], tags:[...new Set(['Primary route',...(t.tags||[])])]})); if(forced.length) top=[...forced,...top.filter(t=>!forced.some(f=>f.id===t.id))].slice(0,maxTopics); }
  const best=top[0]||null; const bestScore=best?best.score:0; const confidence=selectedPaneExists||primaryRoute?'high':bestScore>=14?'high':bestScore>=5?'medium':'low'; const confidenceLabel=confidence==='high'?'High':confidence==='medium'?'Medium':'Low';
  const routeLine = primaryRoute ? `Primary route: ${primaryRoute.name}\nPrimary topic IDs: ${primaryTopicIds.join(', ')}\nRouting rule: Use the primary route first; ignore broad/general/unban articles unless the user explicitly asks for appeal or review.` : 'Primary route: none';
  return { text: routeLine+'\n\n'+top.map((t,index)=>{ const isSelected=selectedPaneExists && t.id===selectedPaneId && index===0; const isPrimary=primaryTopicIds.includes(t.id); const compactPrompt = options.compactPrompt === true; const enLimit=(isSelected||isPrimary)?(compactPrompt ? maxCharsPerTopic : Math.max(maxCharsPerTopic,6200)):maxCharsPerTopic; const arLimit=(isSelected||isPrimary)?(compactPrompt ? Math.floor(maxCharsPerTopic*0.85) : Math.max(Math.floor(maxCharsPerTopic*0.9),5600)):Math.floor(maxCharsPerTopic*0.85); const en=smartTruncate(t.enText||'',enLimit); const ar=smartTruncate(t.arText||'',arLimit); const tags=t.tags&&t.tags.length?`\nTags: ${t.tags.join(', ')}`:''; const selectedLine=isSelected?'\nSelected by user: yes':''; const primaryLine=isPrimary?'\nPrimary route match: yes':''; return `### Topic: ${t.id}\nMatch score: ${Math.round(t.score*10)/10}${selectedLine}${primaryLine}${tags}\nEnglish SOP:\n${en}\n\nArabic SOP:\n${ar}`; }).join('\n\n'), topicIds:top.map(t=>t.id), topics:top, bestTopic:best, primaryRoute, primaryTopicIds, confidence, confidenceLabel, confidenceScore:Math.round(bestScore*10)/10, hasMeaningfulMatch:top.length>0 && (bestScore>=2 || Boolean(primaryRoute)) };
}
/* ===== END SUGO ACCURACY ROUTER v3.0 ===== */

// Truncate text without cutting mid-word; prefer cutting at sentence end.
function smartTruncate(text, maxChars) {
  if (text.length <= maxChars) return text;
  let cut = text.slice(0, maxChars);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('\n'), cut.lastIndexOf('۔'));
  if (lastStop > maxChars * 0.6) {
    cut = cut.slice(0, lastStop + 1);
  } else {
    const lastSpace = cut.lastIndexOf(' ');
    if (lastSpace > 0) cut = cut.slice(0, lastSpace);
  }
  return cut + ' …';
}


let aiLoadingInterval = null;

const AI_LOADING_MESSAGES = [
  "Searching the knowledge base…",
  "Reading relevant SOP topics…",
  "Putting the answer together…",
  "Almost there, composing the response…",
  "Double-checking the details…",
];

const AI_LOADING_MESSAGES_WEB = [
  "🌐 Not in KB — searching the web for SUGO info…",
  "🔍 Looking up SUGO documentation online…",
  "🌐 Fetching latest SUGO information…",
  "📡 Web search in progress…",
  "🌐 Combining web results with SUGO context…",
];

function startLoadingMessages(body, useWeb) {
  stopLoadingMessages();
  let i = 0;
  const msgs = useWeb ? AI_LOADING_MESSAGES_WEB : AI_LOADING_MESSAGES;
  const render = () => {
    body.innerHTML = `<div class="ai-answer-loading"><div class="ai-spinner"></div> ${msgs[i % msgs.length]}</div>`;
    i++;
  };
  render();
  aiLoadingInterval = setInterval(render, 3000);
}

function stopLoadingMessages() {
  if (aiLoadingInterval) {
    clearInterval(aiLoadingInterval);
    aiLoadingInterval = null;
  }
}

let aiAbortController = null;

// --- Conversation memory: remember the last Q&A so follow-up questions work ---
let aiLastExchange = null; // { question, answer }

// --- Recent questions history (stored in browser localStorage) ---
const AI_RECENT_KEY = 'sugo_ai_recent_questions';
const AI_RECENT_MAX = 5;

function getRecentQuestions() {
  try {
    const raw = sessionStorage.getItem(AI_RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function addRecentQuestion(q) {
  try {
    let list = getRecentQuestions().filter(item => item !== q);
    list.unshift(q);
    list = list.slice(0, AI_RECENT_MAX);
    sessionStorage.setItem(AI_RECENT_KEY, JSON.stringify(list));
    renderRecentQuestions();
  } catch {}
}

function deleteRecentQuestion(q) {
  try {
    let list = getRecentQuestions().filter(item => item !== q);
    sessionStorage.setItem(AI_RECENT_KEY, JSON.stringify(list));
    renderRecentQuestions();
  } catch {}
}

function renderRecentQuestions() {
  const row = document.getElementById('aiRecentRow');
  if (!row) return;
  const list = getRecentQuestions();
  if (list.length === 0) {
    row.classList.remove('has-items');
    row.innerHTML = '';
    return;
  }
  row.classList.add('has-items');
  const chips = list.map((q, i) => {
    const safe = escapeHtml(q);
    const label = escapeHtml(q.length > 30 ? q.slice(0, 30) + '\u2026' : q);
    return `<span class="ai-recent-chip" title="${safe}" data-idx="${i}">
      <span class="ai-recent-chip-text" data-idx="${i}">${label}</span>
      <button class="ai-recent-delete" data-idx="${i}" title="Remove">\u2715</button>
    </span>`;
  }).join('');
  row.innerHTML = `<span class="ai-recent-label">Recent</span>${chips}`;

  row.querySelectorAll('.ai-recent-chip-text').forEach(el => {
    el.addEventListener('click', () => askAI(list[+el.dataset.idx]));
  });
  row.querySelectorAll('.ai-recent-delete').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      deleteRecentQuestion(list[+el.dataset.idx]);
    });
  });
}

// --- Simple client-side rate limiting / cooldown ---
const AI_COOLDOWN_MS = 1000;
let aiLastRequestTime = 0;
// Tracks the last call params for the retry button
let _aiRetryParams = { query: '', isFollowup: false, isContinuation: false };
function retryLastAI() { askAI(_aiRetryParams.query, _aiRetryParams.isFollowup, _aiRetryParams.isContinuation, _aiRetryParams.aiOptions || null); }

// ── Response Mode: 'brief' | 'detailed' ──
let currentResponseMode = 'brief';

function setResponseMode(mode) {
  if (!['brief','detailed','step'].includes(mode)) mode = 'brief';
  currentResponseMode = mode;
  try { localStorage.setItem('sugo_response_mode', mode); } catch {}
  const btnBrief    = document.getElementById('rmodeBrief');
  const btnDetailed = document.getElementById('rmodeDetailed');
  const btnStep     = document.getElementById('rmodeStep');
  if (btnBrief)    btnBrief.classList.toggle('active',    mode === 'brief');
  if (btnDetailed) btnDetailed.classList.toggle('active', mode === 'detailed');
  if (btnStep)     btnStep.classList.toggle('active',     mode === 'step');
  const lang  = document.getElementById('languageSelect')?.value || 'english';
  const label = document.getElementById('rmodeLabelText');
  if (label) {
    if (lang === 'arabic') {
      label.textContent = mode === 'brief' ? 'الجواب: مختصر ⚡' : mode === 'step' ? 'الجواب: خطوات 🧭' : 'الجواب: مفصل 📋';
    } else {
      label.textContent = mode === 'brief' ? 'Response: Brief ⚡' : mode === 'step' ? 'Response: Step-by-step 🧭' : 'Response: Detailed 📋';
    }
  }
  syncRmodePillLabels(lang);
}

function syncRmodePillLabels(lang) {
  const btnBrief    = document.getElementById('rmodeBrief');
  const btnDetailed = document.getElementById('rmodeDetailed');
  const btnStep     = document.getElementById('rmodeStep');
  if (!btnBrief || !btnDetailed) return;
  if (lang === 'arabic') {
    btnBrief.textContent    = '⚡ مختصر';
    btnDetailed.textContent = '📋 مفصل';
    if (btnStep) btnStep.textContent = '🧭 خطوات';
  } else {
    btnBrief.textContent    = '⚡ Brief';
    btnDetailed.textContent = '📋 Detailed';
    if (btnStep) btnStep.textContent = '🧭 Step';
  }
}

function getOutputType() {
  const value = document.getElementById('outputTypeSelect')?.value || 'answer';
  return ['answer','ticket'].includes(value) ? value : 'answer';
}

function getSopMode() {
  const value = document.getElementById('sopModeSelect')?.value || 'hybrid';
  return value === 'sop_only' ? 'sop_only' : 'hybrid';
}

function syncOutputTypeLabels(lang) {
  const sel = document.getElementById('outputTypeSelect');
  if (!sel) return;
  const current = getOutputType();
  const labels = lang === 'arabic'
    ? { answer:'إجابة', ticket:'تذكرة' }
    : { answer:'Answer', ticket:'Ticket' };
  Array.from(sel.options).forEach(opt => { opt.textContent = labels[opt.value] || opt.value; });
  sel.title = lang === 'arabic' ? 'نوع المخرجات' : 'Output type';
  sel.value = current;
}

// Copies the current AI answer with rich formatting and a plain-text fallback
function copyAIAnswer(btn) {
  const body = document.getElementById('aiAnswerBody');
  if (!body) return;
  const text = sugoHtmlToPlainText(body);
  if (!text) return;
  const html = `<div style="font-family: Arial, sans-serif; line-height: 1.55;">${body.innerHTML}</div>`;
  copyTextToClipboard(text, btn, '✓ Copied!', '📋 Copy', html);
}

// Closes the AI answer pane and resets conversation memory
function closeAIPane() {
  document.getElementById('aiAnswerPane').classList.remove('active');
  document.getElementById('welcomeMsg').style.display = 'flex';
  aiLastExchange = null;
}

// Renders the "Sources" chips for the topics used to build the answer
function renderAISources(kbInfo, usedWebSearch) {
  const el = document.getElementById('aiSources');
  if (!el) return;

  const kb = Array.isArray(kbInfo) ? { topicIds: kbInfo, topics: [], confidence: 'low', confidenceLabel: 'Low', confidenceScore: 0 } : (kbInfo || {});
  const topics = kb.topics || [];
  const topicIds = kb.topicIds || [];
  const confidence = kb.confidence || 'low';
  const confidenceLabel = kb.confidenceLabel || (confidence === 'high' ? 'High' : confidence === 'medium' ? 'Medium' : 'Low');
  const bestLabel = kb.bestTopic ? kb.bestTopic.label : 'No direct SOP match';
  const mode = getSopMode && getSopMode() === 'sop_only' ? 'SOP Only' : 'Hybrid';

  el.classList.add('has-items');

  const chips = topicIds.map(id => {
    const topic = topics.find(t => t.id === id) || { label: id.replace(/^sc-/, '').replace(/-/g, ' '), score: 0 };
    const label = topic.label || id.replace(/^sc-/, '').replace(/-/g, ' ');
    const cls = confidence === 'high' ? 'ai-source-high' : confidence === 'medium' ? 'ai-source-medium' : 'ai-source-low';
    return `<span class="ai-source-chip ${cls}" onclick="closeAIPane(); showPane('${id}')" title="Open source SOP">${escapeHtml(label)} · ${Math.round((topic.score || 0) * 10) / 10}</span>`;
  }).join('');

  const webBadge = usedWebSearch
    ? `<span class="ai-source-chip" style="background:#ecfeff!important;border-color:#a5f3fc!important;color:#155e75!important;cursor:default;" title="Answer may be supplemented outside local SOP">🌐 Web fallback allowed</span>`
    : '';

  const sourceText = topicIds.length ? topicIds.join('\n') : 'No direct SOP source';
  el.innerHTML = `
    <div class="ai-v5-meta">
      <div class="ai-v5-card ai-v5-confidence-${confidence}"><strong>Confidence</strong><div class="ai-v5-value">${confidenceLabel} · ${escapeHtml(String(kb.confidenceScore || 0))}</div></div>
      <div class="ai-v5-card"><strong>Best match</strong><div class="ai-v5-value">${escapeHtml(bestLabel)}</div></div>
      <div class="ai-v5-card"><strong>Mode</strong><div class="ai-v5-value">${escapeHtml(mode)}</div></div>
    </div>
    <div class="ai-sources-label">Sources</div>${chips || '<span class="ai-source-chip ai-source-low" style="cursor:default;">No direct SOP match</span>'}${webBadge}
    <div class="ai-v5-actions">
      <button class="ai-v5-action" onclick="copyTextToClipboard(${JSON.stringify(sourceText)}, this, '✓ Sources copied', 'Copy sources')">Copy sources</button>
      ${topicIds[0] ? `<button class="ai-v5-action" onclick="closeAIPane(); showPane('${topicIds[0]}')">Open best match</button>` : ''}
      <button class="ai-v5-action" onclick="document.getElementById('searchInput').focus()">New search</button>
    </div>`;
}

// Renders the follow-up question input below the answer
function renderFollowupRow() {
  const row = document.getElementById('aiFollowupRow');
  if (!row) return;
  row.classList.add('active');
  row.innerHTML = `
    <textarea id="aiFollowupInput" rows="1" placeholder="Ask a follow-up question…"
      oninput="this.style.height='auto'; this.style.height=Math.min(this.scrollHeight,120)+'px';"
      onkeydown="if(event.key==='Enter' && !event.shiftKey){event.preventDefault();submitFollowup();}"></textarea>
    <button id="aiFollowupBtn">Ask</button>
  `;
  document.getElementById('aiFollowupBtn').addEventListener('click', submitFollowup);
}

function submitFollowup() {
  const inp = document.getElementById('aiFollowupInput');
  if (!inp || !inp.value.trim()) return;
  const q = inp.value.trim();
  inp.value = '';
  inp.style.height = 'auto';
  askAI(q, true, false);
}

function createSmartTicket(query) {
  const input = document.getElementById('searchInput');
  const raw = (query || input?.value || '').trim();
  const hasImage = !!sugoAiAttachedImage;
  if (!raw && !hasImage) {
    if (input) {
      input.focus();
      input.placeholder = 'Paste the customer conversation or issue first...';
    }
    return;
  }
  const btn = document.getElementById('createTicketBtn');
  if (btn) {
    btn.classList.add('sugo-ticket-pulse');
    setTimeout(() => btn.classList.remove('sugo-ticket-pulse'), 1800);
  }
  return askAI(raw || 'Create a ready-to-send customer support ticket based on the attached image.', false, false, {
    forceOutputType: 'ticket',
    forceResponseMode: 'detailed',
    smartTicket: true
  });
}


// SUGO customer reply cleanup: the AI writes the opening and closing dynamically.
// The UI must NOT force a fixed greeting or closing; it only removes accidental duplication.
function sugoNormalizeTicketPiece(value) {
  return String(value || '')
    .replace(/^#+\s*/, '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[،,.!:؛؛]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function sugoLineLooksLikeOldOpening(line) {
  const s = sugoNormalizeTicketPiece(line);
  if (!s) return true;
  return /^(مرحبا|مرحبًا|مرحباً|اهلا|أهلا|أهلاً|اهلاً)( بك في سوجو| بك| عزيزي العميل| عزيزي| عميلنا)?$/.test(s) ||
         /^عزيزي العميل$/.test(s) ||
         /^(hello|hi|dear customer|dear user|welcome to sugo)$/.test(s);
}

function sugoLineLooksLikeOldClosing(line) {
  const s = sugoNormalizeTicketPiece(line);
  if (!s) return true;
  return /^(شكرا|شكرًا)( لك| لتواصلك معنا| على تواصلك معنا| لتفهمك| لصبرك)?$/.test(s) ||
         /^فريق خدمة عملاء سوجو$/.test(s) ||
         /^(thank you|thanks)( for contacting us| for your patience| for your understanding)?$/.test(s) ||
         /^(best regards|regards|sincerely)$/.test(s) ||
         /^(sugo support|sugo customer support|sugo customer support team|customer support team)$/.test(s);
}

function sugoRemoveDuplicateCustomerOpeningsAndClosings(text) {
  let out = String(text || '').replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ').trim();
  if (!out) return out;

  // Exact common duplicated opening blocks, without forcing that block when it is absent.
  out = out.replace(/^((?:مرحبا|مرحباً|مرحبًا)\s+بك\s+في\s+سوجو[،,.!:\s]*\n+\s*عزيزي\s+العميل[،,.!:\s]*\n*){2,}/i, 'مرحبا بك في سوجو\n\nعزيزي العميل\n\n');
  out = out.replace(/^((?:welcome\s+to\s+sugo)[,!.:\s]*\n+\s*dear\s+customer[,]?[\s]*\n*){2,}/i, 'Welcome to the SUGO family!\nWe are very happy and honored to have you with us.\nHow can we assist you today?\n\n');
  out = out.replace(/^((?:مرحب[اًًا]?|اهل[اًًا]?)\s+عزيزي\s+العميل[،,.!:\s]*\n*){2,}/i, 'مرحباً بك في عائلة سوجو!\nيسعدنا ويشرفنا جداً تواجدك معنا.\nكيف يمكننا مساعدتك اليوم؟\n\n');
  out = out.replace(/^((?:hello|hi)\s+dear\s+customer[,]?[\s]*\n*){2,}/i, 'Welcome to the SUGO family!\nWe are very happy and honored to have you with us.\nHow can we assist you today?\n\n');

  // Exact common duplicated closing blocks.
  out = out.replace(/(\n+\s*(?:شكرا|شكرًا|شكراً)\s+(?:على\s+)?تواصلك\s+معنا[،,.!:\s]*\n+\s*فريق\s+خدمة\s+عملاء\s+سوجو[،,.!:\s]*){2,}\s*$/i, '\n\nشكراً لتواصلك مع سوجو، يسعدنا دائماً خدمتك. نتمنى لك يوماً رائعاً!\n\nفريق خدمة عملاء سوجو');
  out = out.replace(/(\n+\s*thank\s+you\s+for\s+contacting\s+us\.?\s*\n+\s*sugo\s+customer\s+support\s+team\.?\s*){2,}\s*$/i, '\n\nThank you for contacting SUGO. We are always happy to serve you. We wish you a wonderful day!\n\nSUGO Customer Service Team');

  // Remove immediately repeated paragraphs or lines caused by model/template collisions.
  const paragraphs = out.split(/\n{2,}/);
  const kept = [];
  for (const p of paragraphs) {
    const current = sugoNormalizeTicketPiece(p);
    const previous = sugoNormalizeTicketPiece(kept[kept.length - 1] || '');
    if (current && current === previous) continue;
    kept.push(p.trim());
  }
  out = kept.join('\n\n');

  const lines = out.split('\n');
  const finalLines = [];
  const seenClosingKinds = new Set();
  for (const line of lines) {
    const current = sugoNormalizeTicketPiece(line);
    const previous = sugoNormalizeTicketPiece(finalLines[finalLines.length - 1] || '');
    if (current && current === previous) continue;

    let closingKind = '';
    if (/^(شكرا|شكرًا)( لك| لتواصلك معنا| على تواصلك معنا| لتفهمك| لصبرك)?$/.test(current) || /^(thank you|thanks)( for contacting us| for your patience| for your understanding)?$/.test(current)) {
      closingKind = 'thanks';
    } else if (/^فريق خدمة عملاء سوجو$/.test(current) || /^(sugo support|sugo customer support|sugo customer support team|customer support team)$/.test(current)) {
      closingKind = 'signature';
    }

    if (closingKind) {
      if (seenClosingKinds.has(closingKind)) continue;
      seenClosingKinds.add(closingKind);
    }

    finalLines.push(line);
  }
  return finalLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function sugoTicketOrdinalWord(index, language) {
  const arWords = ['أولاً','ثانياً','ثالثاً','رابعاً','خامساً','سادساً','سابعاً','ثامناً','تاسعاً','عاشراً','الحادي عشر','الثاني عشر','الثالث عشر','الرابع عشر','الخامس عشر'];
  const enWords = ['First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth','Eleventh','Twelfth','Thirteenth','Fourteenth','Fifteenth'];
  const list = language === 'arabic' ? arWords : enWords;
  return list[index - 1] || (language === 'arabic' ? `البند ${index}` : `Item ${index}`);
}

function sugoLineStartsWithOrdinalWord(line, language) {
  const s = String(line || '').trim();
  if (language === 'arabic') {
    return /^(أولاً|اولا|أولا|ثانياً|ثانيا|ثالثاً|ثالثا|رابعاً|رابعا|خامساً|خامسا|سادساً|سادسا|سابعاً|سابعا|ثامناً|ثامنا|تاسعاً|تاسعا|عاشراً|عاشرا|الحادي عشر|الثاني عشر|الثالث عشر|الرابع عشر|الخامس عشر)\b/.test(s);
  }
  return /^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth)\b/i.test(s);
}

function sugoFormatTicketListsWithOrdinals(text, language) {
  const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let counter = 0;

  for (const line of lines) {
    const m = line.match(/^(\s*)(?:[-*•]+|(?:\d+|[٠-٩]+|[۰-۹]+)(?:[\.)\-:]|\s+)|(?:[A-Za-z]|[اأإآ])\))\s*(.*)$/);
    if (m) {
      counter += 1;
      const indent = m[1] || '';
      const body = (m[2] || '').trim();
      const comma = language === 'arabic' ? '،' : ',';
      out.push(`${indent}${sugoTicketOrdinalWord(counter, language)}${comma} ${body}`);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      out.push(line);
      continue;
    }

    if (sugoLineStartsWithOrdinalWord(trimmed, language)) counter += 1;
    out.push(line);
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function sugoIsTicketOutputActive(explicitValue) {
  if (typeof explicitValue === 'boolean') return explicitValue;
  try {
    if (typeof getOutputType === 'function' && getOutputType() === 'ticket') return true;
  } catch {}
  try {
    const badge = document.getElementById('aiBadgeLabel');
    if (badge && /ticket|تذكرة|التذكرة/i.test(badge.textContent || '')) return true;
  } catch {}
  return false;
}

function sugoApplyCustomerReplyEnvelope(text, language, includeClosing, isTicketOutput) {
  // Kept for compatibility with the existing rendering flow.
  // It no longer adds any fixed opening or closing.
  let out = sugoRemoveDuplicateCustomerOpeningsAndClosings(text);
  if (sugoIsTicketOutputActive(isTicketOutput)) {
    out = sugoFormatTicketListsWithOrdinals(out, language);
  }
  return out;
}


function sugoRegexEscape(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SUGO_TICKET_ORDINAL_TERMS = [
  'الحادي عشر','الثاني عشر','الثالث عشر','الرابع عشر','الخامس عشر',
  'أولاً','اولا','أولا','ثانياً','ثانيا','ثالثاً','ثالثا','رابعاً','رابعا','خامساً','خامسا',
  'سادساً','سادسا','سابعاً','سابعا','ثامناً','ثامنا','تاسعاً','تاسعا','عاشراً','عاشرا',
  'First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth',
  'Eleventh','Twelfth','Thirteenth','Fourteenth','Fifteenth'
];

// Ticket emphasis is intentionally limited to ordinal words only.
// Sensitive support terms are not visually highlighted.
function sugoNormalizeHighlightWord(value) {
  return String(value || '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[،,.!:؛]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function sugoIsOrdinalHighlight(value) {
  const s = sugoNormalizeHighlightWord(value);
  return SUGO_TICKET_ORDINAL_TERMS.some(term => sugoNormalizeHighlightWord(term) === s);
}

function sugoTicketHighlightRegex() {
  const all = [...SUGO_TICKET_ORDINAL_TERMS]
    .filter(Boolean)
    .sort((a,b) => String(b).length - String(a).length)
    .map(term => {
      const raw = String(term);
      const escaped = sugoRegexEscape(raw).replace(/\s+/g, '\\s+');
      return /^[A-Za-z0-9 ]+$/.test(raw) ? `\\b${escaped}\\b` : escaped;
    });
  return new RegExp('(' + all.join('|') + ')', 'giu');
}

function sugoApplyInlineStyle(el, styleText) {
  const current = el.getAttribute('style') || '';
  el.setAttribute('style', current ? current + ';' + styleText : styleText);
}

function sugoLooksLikeClosingLine(text) {
  const s = sugoNormalizeHighlightWord(text);
  return /^(شكرا|شكراً|شكرًا|نقدر|يسعدنا|فريق خدمة عملاء سوجو|sugo customer support team|thank you|thanks|best regards|regards|we appreciate)/i.test(s)
    || /فريق خدمة عملاء سوجو|sugo customer support team|لتواصلك معنا|contacting us/i.test(s);
}

function sugoHighlightTicketTextNodes(root) {
  const re = sugoTicketHighlightRegex();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest('code, pre, .sugo-ticket-ordinal')) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue || !re.test(node.nodeValue)) { re.lastIndex = 0; return NodeFilter.FILTER_REJECT; }
      re.lastIndex = 0;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach(node => {
    const text = node.nodeValue || '';
    const frag = document.createDocumentFragment();
    const regex = sugoTicketHighlightRegex();
    let last = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > last) frag.appendChild(document.createTextNode(text.slice(last, match.index)));
      const value = match[0];
      const span = document.createElement('span');
      span.className = 'sugo-ticket-ordinal';
      span.setAttribute('style', 'font-size:1.07em;font-weight:800;color:#000;');
      span.textContent = value;
      frag.appendChild(span);
      last = regex.lastIndex;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });
}

function sugoRenderTicketMarkdown(text, isTicketOutput, language) {
  const html = renderMarkdown(text);
  if (!isTicketOutput) return html;

  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  const blocks = Array.from(tmp.querySelectorAll('p, li, h1, h2, h3, blockquote'))
    .filter(el => (el.textContent || '').trim().length > 0 && !el.closest('pre, code'));

  if (blocks.length) {
    const intro = blocks[0];
    intro.classList.add('sugo-ticket-emphasis-line');
    sugoApplyInlineStyle(intro, 'font-size:1.06em;font-weight:750;color:#000;line-height:1.9;');

    const last = blocks[blocks.length - 1];
    last.classList.add('sugo-ticket-emphasis-line');
    sugoApplyInlineStyle(last, 'font-size:1.06em;font-weight:750;color:#000;line-height:1.9;');

    if (blocks.length >= 2 && sugoLooksLikeClosingLine(blocks[blocks.length - 2].textContent || '')) {
      const beforeLast = blocks[blocks.length - 2];
      beforeLast.classList.add('sugo-ticket-emphasis-line');
      sugoApplyInlineStyle(beforeLast, 'font-size:1.06em;font-weight:750;color:#000;line-height:1.9;');
    }
  }

  sugoHighlightTicketTextNodes(tmp);
  return tmp.innerHTML;
}

function sugoCustomerEnvelopePrompt(language) {
  if (language === 'arabic') {
    return "## أسلوب رد خدمة العملاء في سوجو:\nأنت مسؤول عن كتابة مقدمة ونهاية طبيعية مناسبة للحالة. لا توجد صيغة افتتاح ثابتة مفروضة من الواجهة، لكن يجب أن يكون الرد جاهزًا للإرسال للعميل وبأسلوب فريق خدمة عملاء سوجو. لا تكرر التحية أو عبارة عزيزي العميل أو الخاتمة. في وضع التذكرة فقط: اتبع هذا الترتيب: مقدمة قصيرة مناسبة، ثم اعتذار في فقرة مستقلة فقط إذا كانت الحالة تستدعي الاعتذار، ثم شرح مفصل أو خطوات الموضوع، ثم خاتمة رسمية طبيعية، ثم آخر سطر: خدمة عملاء سوجو. لا تستخدم أرقامًا أو نقاطًا أو bullets في بداية الأسطر؛ إذا احتجت ترتيب خطوات أو متطلبات فاكتبها بكلمات عربية مثل: أولاً، ثانياً، ثالثاً، مع الحفاظ على كل بند في سطر منفصل. لا تطلب تمييز أو تكبير الكلمات الحساسة.\n\n";
  }
  return "## SUGO customer support reply style:\nYou are responsible for writing a natural opening and closing suitable for the case. The UI does not force any fixed opening template. The final reply must be ready to send and written in the voice of the SUGO Customer Support Team. Do not repeat greetings, 'Dear Customer', or closings. In Ticket mode only: use this structure: short natural opening, then a separate apology paragraph only if the case needs an apology, then the detailed explanation or steps, then a formal natural closing, then the final line: SUGO Customer Support Team. Do not use numeric lists, bullets, or markdown list markers at the start of lines; if you need ordered steps or requirements, use word-based order such as First, Second, Third, while keeping each item on a separate line. Do not visually emphasize sensitive terms.\n\n";
}



function resetAIAnswerAudit() {
  const panel = document.getElementById('aiAuditPanel');
  if (panel) {
    panel.hidden = true;
    panel.classList.remove('active');
    panel.innerHTML = '';
  }
  const ticketPanel = document.getElementById('aiTicketBuilderPanel');
  if (ticketPanel) {
    ticketPanel.hidden = true;
    ticketPanel.classList.remove('active');
    ticketPanel.innerHTML = '';
  }
  window.SUGO_SMART_TICKET_BUILDER_STATE = null;
}

function sugoNormalizeAuditValue(value, fallback) {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ') || (fallback || 'None');
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (value === null || value === undefined || value === '') return fallback || '—';
  return String(value);
}

function sugoAuditConfidenceLabel(value, score) {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('high')) return 'High';
  if (raw.includes('medium')) return 'Medium';
  if (raw.includes('low')) return 'Low';
  const n = Number(score);
  if (Number.isFinite(n)) {
    if (n >= 75) return 'High';
    if (n >= 45) return 'Medium';
    return 'Low';
  }
  return 'Unknown';
}

function sugoBuildAuditSummary(meta, kb, options) {
  meta = (meta && typeof meta === 'object') ? meta : {};
  kb = (kb && typeof kb === 'object') ? kb : {};
  options = (options && typeof options === 'object') ? options : {};

  const kbScore = meta.kbConfidenceScore ?? meta.kb_confidence_score ?? kb.confidenceScore;
  const confidence = sugoAuditConfidenceLabel(meta.kbConfidence || meta.sopConfidence || kb.confidence || kb.confidenceLabel, kbScore);
  const sensitive = Array.isArray(meta.sensitiveCategories) ? meta.sensitiveCategories.filter(Boolean) : [];
  const missing = Array.isArray(meta.missingInfo) ? meta.missingInfo.filter(Boolean) : [];
  const ambiguous = Boolean(meta.kbAmbiguous || kb.ambiguous);
  const sopMode = meta.sopMode || (options.strictSopForRequest ? 'sop_only' : 'hybrid');
  const bestMatch = (meta.kbMatches && meta.kbMatches[0]) || kb.bestTopic || null;
  const bestTitle = bestMatch ? (bestMatch.title || bestMatch.label || bestMatch.paneId || bestMatch.id || 'Matched SOP') : 'No direct match';
  const primaryRoute = meta.kbPrimaryRoute || (kb.primaryRoute && kb.primaryRoute.name) || meta.route || '—';
  const quality = (meta.quality && typeof meta.quality === 'object') ? meta.quality : {};
  const qualityFlags = Object.keys(quality).filter(key => quality[key] === true || quality[key] === 'true');

  let status = 'ready';
  let statusText = 'Ready for agent review';
  if (confidence === 'Low' || ambiguous || missing.length > 0) {
    status = 'review';
    statusText = 'Review required';
  }
  if ((confidence === 'Low' && sensitive.length > 0) || missing.length > 2) {
    status = 'escalate';
    statusText = 'Escalation check';
  }

  return {
    confidence,
    score: Number.isFinite(Number(kbScore)) ? String(Math.round(Number(kbScore) * 10) / 10) : '—',
    status,
    statusText,
    sensitive,
    missing,
    ambiguous,
    sopMode,
    outputType: meta.outputType || options.selectedOutputType || 'answer',
    responseMode: options.responseModeForRequest || 'brief',
    bestTitle,
    primaryRoute,
    provider: meta.provider || '—',
    model: meta.model || '—',
    latency: meta.latencyMs ? `${meta.latencyMs} ms` : '—',
    cached: meta.cached === true,
    webSearch: meta.webSearchEnabled === true,
    imageAnalysis: meta.imageAnalysis === true || options.hasImage === true,
    qualityFlags,
    requestId: meta.requestId || '—'
  };
}

function renderAIAnswerAudit(responseData, kb, options) {
  const panel = document.getElementById('aiAuditPanel');
  if (!panel) return;
  const meta = responseData && responseData._meta ? responseData._meta : {};
  const audit = sugoBuildAuditSummary(meta, kb, options);
  const missingCount = audit.missing.length;
  const sensitiveCount = audit.sensitive.length;
  const confidenceTone = audit.confidence === 'High' ? 'ok' : (audit.confidence === 'Low' ? 'danger' : 'warn');
  const riskTone = sensitiveCount ? 'danger' : 'ok';
  const missingTone = missingCount ? 'warn' : 'ok';
  const scoreText = audit.score !== '—' ? ` · ${audit.score}` : '';
  const missingText = missingCount
    ? `${missingCount} missing${audit.missing[0] ? ': ' + String(audit.missing[0]) : ''}${missingCount > 1 ? ' +' + (missingCount - 1) : ''}`
    : 'Complete';
  const riskText = sensitiveCount ? 'Sensitive case' : 'Normal';

  panel.innerHTML = `
    <div class="ai-audit-head">
      <div class="ai-audit-title">Review</div>
      <div class="ai-audit-status ${audit.status}">${escapeHtml(audit.statusText)}</div>
    </div>
    <div class="ai-audit-mini">
      <div class="ai-audit-row"><div class="ai-audit-label">SOP</div><div class="ai-audit-value">${escapeHtml(audit.bestTitle)}</div></div>
      <div class="ai-audit-row"><div class="ai-audit-label">Confidence</div><div class="ai-audit-value ${confidenceTone}">${escapeHtml(audit.confidence + scoreText)}</div></div>
      <div class="ai-audit-row"><div class="ai-audit-label">Missing</div><div class="ai-audit-value ${missingTone}">${escapeHtml(missingText)}</div></div>
      <div class="ai-audit-row"><div class="ai-audit-label">Risk</div><div class="ai-audit-value ${riskTone}">${escapeHtml(riskText)}</div></div>
    </div>`;
  panel.hidden = false;
  panel.classList.add('active');
}

function copyAIAnswerAudit(btn) {
  const panel = document.getElementById('aiAuditPanel');
  if (!panel) return;
  const text = panel.innerText.replace(/\n{3,}/g, '\n\n').trim();
  navigator.clipboard?.writeText(text).then(() => {
    if (btn) {
      const old = btn.textContent;
      btn.textContent = '✓ Copied';
      setTimeout(() => { btn.textContent = old; }, 1400);
    }
  }).catch(() => {});
}


function resetSmartTicketBuilder() {
  const panel = document.getElementById('aiTicketBuilderPanel');
  if (!panel) return;
  panel.hidden = true;
  panel.classList.remove('active');
  panel.innerHTML = '';
  window.SUGO_SMART_TICKET_BUILDER_STATE = null;
}

function sugoTicketPlainText(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/^[\s>]*[-*•]\s+/gm, '')
    .replace(/^[\s>]*\d+[.)]\s+/gm, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function sugoInferTicketType(query, answer, kb, meta) {
  const best = (meta && meta.kbMatches && meta.kbMatches[0]) || (kb && kb.bestTopic) || {};
  const text = [query, answer, best.title, best.label, best.category, best.section, best.path].map(x => String(x || '').toLowerCase()).join(' ');
  const rules = [
    ['Ban / Unban', ['ban','unban','blocked','حظر','محظور','رفع الحظر']],
    ['Recharge / Payment', ['recharge','payment','charge','coins','top up','transaction','شحن','دفع','رصيد','كوينز','معاملة']],
    ['Withdrawal / Salary', ['withdraw','withdrawal','cashout','salary','commission','سحب','راتب','عمولة','تحويل']],
    ['Agency / Host', ['agency','agm','host','anchor','sub-agency','وكالة','مذيعة','مضيف','مضيفة']],
    ['Account / Login', ['login','password','account','phone','email','device','حساب','دخول','كلمة السر','رقم الهاتف','ايميل']],
    ['VIP / SVIP / Charm', ['vip','svip','charm','vip/svip','جاذبية','كارزما']],
    ['Games / Activity', ['game','games','activity','rng','لعبة','العاب','نشاط']],
    ['Verification / Age', ['verification','verify','age','underage','face scan','تحقق','السن','العمر','قاصر']]
  ];
  for (const [label, keys] of rules) {
    if (keys.some(k => text.includes(k))) return label;
  }
  return 'General Support';
}

function sugoExtractTicketSignals(query, answer) {
  const text = String(query || '') + '\n' + String(answer || '');
  const ids = [];
  const idRegex = /(?:\bID\b|id|ايدي|آي\s*دي|اي\s*دي|حساب)[:#\s-]*([0-9]{5,})/gi;
  let m;
  while ((m = idRegex.exec(text)) && ids.length < 4) ids.push(m[1]);
  if (!ids.length) {
    const generic = text.match(/\b\d{7,}\b/g) || [];
    generic.slice(0, 3).forEach(x => ids.push(x));
  }
  const amountMatches = text.match(/\b\d+(?:[.,]\d+)?\s*(?:coins?|BCM|USD|JOD|دولار|دينار|كوينز?|عملة)\b/gi) || [];
  const hasScreenshot = /screenshot|screen shot|image|photo|صورة|لقطة|سكرين/i.test(text);
  const hasTransaction = /transaction|order|receipt|invoice|معاملة|طلب|إيصال|ايصال/i.test(text);
  return {
    ids: Array.from(new Set(ids)).slice(0, 4),
    amounts: Array.from(new Set(amountMatches)).slice(0, 4),
    hasScreenshot,
    hasTransaction
  };
}

function sugoDefaultMissingInfoForType(type, signals) {
  const base = [];
  if (!signals.ids.length) base.push('Customer SUGO ID / affected account ID');
  if (!signals.hasScreenshot) base.push('Screenshot or clear evidence of the issue');
  if (/Recharge|Payment|Withdrawal|Salary/i.test(type)) {
    if (!signals.hasTransaction) base.push('Transaction/order ID or receipt');
    if (!signals.amounts.length) base.push('Amount and payment/withdrawal date');
  }
  if (/Ban|Unban/i.test(type)) base.push('Screenshot of the ban reason and ban time');
  if (/Agency|Host/i.test(type)) base.push('Agency ID / Host ID and role');
  if (/Account|Login/i.test(type)) base.push('Registered phone/email and device details');
  if (/Verification|Age/i.test(type)) base.push('Verification status screenshot');
  return Array.from(new Set(base)).slice(0, 7);
}

function sugoTicketStatusFromMeta(confidence, missing, sensitive, ambiguous) {
  if ((confidence === 'Low' && sensitive.length) || missing.length > 3) return ['escalate', 'Escalation check'];
  if (confidence === 'Low' || missing.length || ambiguous) return ['review', 'Review before sending'];
  return ['ready', 'Ready to send'];
}

function renderSmartTicketBuilder(responseData, kb, options, answer, query, selectedLanguage, isTicketOutput) {
  const panel = document.getElementById('aiTicketBuilderPanel');
  if (!panel) return;
  const meta = responseData && responseData._meta ? responseData._meta : {};
  const audit = (typeof sugoBuildAuditSummary === 'function') ? sugoBuildAuditSummary(meta, kb, options) : { confidence: 'Unknown', missing: [], sensitive: [], ambiguous: false, bestTitle: '—', primaryRoute: '—' };
  const type = sugoInferTicketType(query, answer, kb, meta);
  const signals = sugoExtractTicketSignals(query, answer);
  const defaultMissing = sugoDefaultMissingInfoForType(type, signals);
  const metaMissing = Array.isArray(audit.missing) ? audit.missing.filter(Boolean) : [];
  const missing = Array.from(new Set(metaMissing.concat(defaultMissing))).slice(0, 8);
  const sensitive = Array.isArray(audit.sensitive) ? audit.sensitive : [];
  const [statusClass, statusText] = sugoTicketStatusFromMeta(audit.confidence || 'Unknown', missing, sensitive, !!audit.ambiguous);
  const bestTitle = audit.bestTitle || 'No direct match';
  const primaryRoute = audit.primaryRoute || '—';
  const idValue = signals.ids.length ? signals.ids.join(', ') : 'Not detected';
  const amountValue = signals.amounts.length ? signals.amounts.join(', ') : 'Not detected';
  const ticketText = isTicketOutput
    ? sugoTicketPlainText(answer)
    : (selectedLanguage === 'arabic'
        ? 'لم يتم إنشاء تذكرة جاهزة بعد. اضغط Build ticket from this case لإنشاء رد جاهز للعميل بناءً على هذه الحالة.'
        : 'A ready-to-send ticket has not been generated yet. Click Build ticket from this case to create a customer-facing reply based on this case.');
  const checklist = missing.length
    ? missing.map((x, i) => `<label><input type="checkbox" data-ticket-check="${i}"> <span>${escapeHtml(String(x))}</span></label>`).join('')
    : '<label><input type="checkbox"> <span>No required missing information detected automatically. Agent should still verify the case.</span></label>';
  const internalSummary = [
    `Issue type: ${type}`,
    `SOP confidence: ${audit.confidence || 'Unknown'}`,
    `Best SOP match: ${bestTitle}`,
    `Primary route: ${primaryRoute}`,
    `Detected ID(s): ${idValue}`,
    `Detected amount(s): ${amountValue}`,
    `Sensitive flags: ${sensitive.length ? sensitive.join(', ') : 'None'}`,
    `Missing info: ${missing.length ? missing.join('; ') : 'None'}`
  ].join('\n');

  window.SUGO_SMART_TICKET_BUILDER_STATE = {
    query: String(query || ''),
    answer: String(answer || ''),
    ticketText,
    type,
    confidence: audit.confidence || 'Unknown',
    bestTitle,
    primaryRoute,
    idValue,
    amountValue,
    missing,
    sensitive,
    internalSummary,
    selectedLanguage,
    isTicketOutput: !!isTicketOutput
  };

  panel.innerHTML = `
    <textarea id="sugoSmartTicketText" class="ai-ticket-builder-textarea" dir="${selectedLanguage === 'arabic' ? 'rtl' : 'ltr'}" hidden>${escapeHtml(ticketText)}</textarea>
    <div class="ai-ticket-builder-litebar">
      <span class="ai-ticket-builder-litehint">${escapeHtml(type)} · ${escapeHtml(statusText)}</span>
      <button class="ai-ticket-builder-btn" type="button" onclick="copySmartTicketBuilderTicket(this)">📋 Copy ticket</button>
      <button class="ai-ticket-builder-btn" type="button" onclick="sugoGenerateTicketFromBuilder(this)">✦ Build ticket</button>
    </div>`;
  panel.hidden = false;
  panel.classList.add('active');
}

function copySmartTicketBuilderTicket(btn) {
  const textarea = document.getElementById('sugoSmartTicketText');
  const text = textarea ? textarea.value.trim() : '';
  if (!text) return;
  copyTextToClipboard(text, btn, '✓ Ticket copied', '📋 Copy ticket');
}

function copySmartTicketInternalSummary(btn) {
  const state = window.SUGO_SMART_TICKET_BUILDER_STATE || {};
  const text = state.internalSummary || '';
  if (!text) return;
  copyTextToClipboard(text, btn, '✓ Summary copied', '🧾 Copy internal summary');
}

function copySmartTicketMissingInfo(btn) {
  const state = window.SUGO_SMART_TICKET_BUILDER_STATE || {};
  const missing = Array.isArray(state.missing) ? state.missing : [];
  const text = missing.length ? missing.map((x, i) => `${i + 1}. ${x}`).join('\n') : 'No missing information detected automatically. Please verify the case manually.';
  copyTextToClipboard(text, btn, '✓ Checklist copied', '✅ Copy missing info');
}

function sugoGenerateTicketFromBuilder(btn) {
  const state = window.SUGO_SMART_TICKET_BUILDER_STATE || {};
  const query = state.query || document.getElementById('searchInput')?.value || '';
  if (btn) {
    const old = btn.textContent;
    btn.textContent = 'Building…';
    setTimeout(() => { btn.textContent = old; }, 1800);
  }
  return createSmartTicket(query);
}

async function askAI(query, isFollowup, isContinuation, aiOptions) {
  aiOptions = (aiOptions && typeof aiOptions === 'object') ? aiOptions : {};
  const selectedLanguage = document.getElementById("languageSelect")?.value || "english";
  const forcedOutputType = ['answer','ticket'].includes(aiOptions.forceOutputType) ? aiOptions.forceOutputType : null;
  const selectedOutputType = forcedOutputType || getOutputType();
  const isTicketOutput = selectedOutputType === 'ticket';
  const responseModeForRequest = ['brief','detailed','step'].includes(aiOptions.forceResponseMode)
    ? aiOptions.forceResponseMode
    : currentResponseMode;
  const isDetailed = responseModeForRequest === 'detailed';
  const isStepMode = responseModeForRequest === 'step';
  const isSmartTicket = isTicketOutput && aiOptions.smartTicket === true;
  const sopOnly = typeof getSopMode === 'function' && getSopMode() === 'sop_only';
  const strictSopForRequest = sopOnly || isSmartTicket;
  const attachedImage = aiOptions._attachedImage || (!isContinuation ? sugoAiAttachedImage : null);

  let languageInstruction = "";
  if (selectedLanguage === "arabic") {
    languageInstruction = "You must answer only in formal Modern Standard Arabic. Do not use English, slang, or Egyptian/Jordanian colloquial expressions.";
  } else {
    languageInstruction = "You must answer only in professional English. Do not use Arabic.";
  }

  const outputTypeInstruction = isTicketOutput
    ? (
      "## OUTPUT TYPE — TICKET / CUSTOMER REPLY:\n" +
      "Return a ready-to-send customer support ticket/reply only. Use a respectful greeting, clear body, and polite closing. Do not explain internal reasoning. Do not mention that you used a knowledge base. Do not include internal fields such as Mention, Care, Reporter, VIP, Charm, or admin notes unless the user explicitly asks for an internal form. If the internal KB contains a Ticket field, prioritize it and rewrite it professionally in the selected language. If required information is missing, ask the customer for the missing items inside the ticket message. Do not use numbered or bulleted list markers in the final ticket; for Arabic tickets use: أولاً، ثانياً، ثالثاً، and so on.\n"
    )
    : (
      "## OUTPUT TYPE — ANSWER / AGENT GUIDANCE:\n" +
      "Answer the support agent directly. Explain the correct procedure, key conditions, and what to send to the customer. You may include internal notes, escalation guidance, or source chips when useful. Do not format it as a customer ticket unless the selected output type is Ticket.\n"
    );

  const smartTicketInstruction = isSmartTicket
    ? (
      "## SMART CREATE TICKET MODE — HIGH ACCURACY:\n" +
      "- Treat the user's text as raw customer conversation/problem details and extract the actual issue before writing.\n" +
      "- Use the strongest matching SOP Ticket text when available; rewrite it naturally and ignore irrelevant SOP lines.\n" +
      "- Do not invent IDs, names, dates, amounts, policy decisions, refunds, compensation, unban results, or approval guarantees.\n" +
      "- If required details are missing, ask for them politely inside the customer-facing ticket.\n" +
      "- Keep the final output customer-facing only: no analysis, no confidence labels, no source names, no admin notes, no internal routing, and no hidden-policy wording.\n" +
      "- For sensitive cases such as account ownership, ban, abuse, recharge, withdrawal, VIP, Charm, agency, or host issues, be conservative and request verification/escalation when the SOP is not conclusive.\n" +
      "- Final output must be one polished ready-to-send support ticket/reply in the selected language.\n" +
      "- Ticket formatting rule: no numeric list markers and no bullets. If ordering is needed in Arabic, use أولاً، ثانياً، ثالثاً، etc.; in English, use First, Second, Third, etc. Keep each item on its own line.\n\n"
    )
    : "";

  const customerEnvelopeInstruction = sugoCustomerEnvelopePrompt(selectedLanguage);

  query = (query || '').trim();
  if (!query && attachedImage) {
    query = selectedLanguage === 'arabic'
      ? 'حلل الصورة المرفقة واشرح ما المشكلة وما الإجراء المناسب حسب تعليمات SUGO.'
      : 'Analyze the attached image and explain the issue and the correct action according to SUGO support instructions.';
  }
  if (!query) return;

  const activePaneFresh = window.SUGO_ACTIVE_PANE && window.SUGO_ACTIVE_PANE_TS && (Date.now() - window.SUGO_ACTIVE_PANE_TS < 180000);
  const preferredPaneForAI = window.SUGO_EXACT_AI_PANE || (activePaneFresh ? window.SUGO_ACTIVE_PANE : null);

  if (!isContinuation) {
    const now = Date.now();
    if (now - aiLastRequestTime < AI_COOLDOWN_MS) {
      const waitSec = Math.ceil((AI_COOLDOWN_MS - (now - aiLastRequestTime)) / 1000);
      const _body = document.getElementById('aiAnswerBody');
      if (document.getElementById('aiAnswerPane').classList.contains('active')) {
        const notice = document.createElement('div');
        notice.className = 'ai-answer-error';
        notice.style.marginTop = '10px';
        notice.textContent = `⏳ Please wait ${waitSec}s before asking another question.`;
        _body.appendChild(notice);
        setTimeout(() => notice.remove(), 2500);
      }
      return;
    }
    aiLastRequestTime = Date.now();
  }
  const retryOptions = { ...aiOptions };
  if (attachedImage) retryOptions._attachedImage = attachedImage;
  _aiRetryParams = { query, isFollowup: !!isFollowup, isContinuation: !!isContinuation, aiOptions: retryOptions };

  if (!isFollowup) {
    aiLastExchange = null;
    addRecentQuestion(query);
  }

  const badge = document.getElementById('aiBadgeLabel');
  if (badge) {
    if (attachedImage && isSmartTicket) badge.textContent = '✦ Vision Ticket';
    else if (attachedImage) badge.textContent = isTicketOutput ? '✦ Vision Ticket' : '✦ Vision Answer';
    else if (isSmartTicket) badge.textContent = '✦ Smart Ticket';
    else badge.textContent = isTicketOutput ? '✦ AI Ticket' : '✦ AI Answer';
  }

  const bodyEl = document.getElementById('aiAnswerBody');
  if (selectedLanguage === "arabic") bodyEl.setAttribute('dir', 'rtl');
  else bodyEl.setAttribute('dir', 'ltr');
  if (bodyEl) bodyEl.classList.toggle('sugo-ticket-output', !!isTicketOutput);

  const pane = document.getElementById('aiAnswerPane');
  const body = bodyEl;
  const queryEl = document.getElementById('aiAnswerQuery');
  let targetDiv = body;

  if (isContinuation) {
    const existingNote = body.querySelector('.ai-truncated-note');
    if (existingNote) existingNote.remove();
    targetDiv = window._aiContinuationTarget || body;
    const loader = document.createElement('div');
    loader.id = 'aiContinuationLoader';
    loader.className = 'ai-answer-loading';
    loader.style.marginTop = '12px';
    loader.innerHTML = '<div class="ai-spinner"></div> Continuing the answer…';
    targetDiv.appendChild(loader);
  } else if (isFollowup) {
    document.getElementById('aiFollowupRow').classList.remove('active');
    const block = document.createElement('div');
    block.className = 'ai-followup-block';
    block.style.cssText = 'margin-top:28px;padding-top:22px;border-top:2px solid var(--border);';
    const qlabel = document.createElement('div');
    qlabel.style.cssText = 'font-size:0.78rem;font-weight:700;color:var(--text-muted);margin-bottom:10px;display:flex;align-items:center;gap:8px;';
    qlabel.innerHTML = `<span style="background:var(--accent-light);border:1px solid var(--border);border-radius:4px;padding:1px 8px;color:var(--accent);font-size:0.68rem;font-weight:800;">Follow-up</span>${escapeHtml(query)}`;
    block.appendChild(qlabel);
    const ansDiv = document.createElement('div');
    block.appendChild(ansDiv);
    body.appendChild(block);
    targetDiv = ansDiv;
    window._aiContinuationTarget = ansDiv;
    ansDiv.innerHTML = '<div class="ai-answer-loading"><div class="ai-spinner"></div> Searching the knowledge base…</div>';
    setTimeout(() => block.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  } else {
    window._aiContinuationTarget = null;
    clearAllContentAndWelcome();
    document.getElementById('welcomeMsg').style.display = 'none';
    pane.classList.add('active');
    queryEl.textContent = attachedImage ? `🖼️ ${query}` : query;
    document.getElementById('aiSources').classList.remove('has-items');
    document.getElementById('aiSources').innerHTML = '';
    document.getElementById('aiFollowupRow').classList.remove('active');
    resetAIAnswerAudit();
    if (typeof sugoEnsurePaneIndexReady === 'function') await sugoEnsurePaneIndexReady();
    const _quickKB = getRelevantKnowledgeBaseText(query, attachedImage ? 6 : 12, attachedImage ? 2200 : 3200, preferredPaneForAI, { outputType: selectedOutputType, preferTicketTopics: isTicketOutput, smartTicket: isSmartTicket, compactPrompt: false, completeAnswer: true });
    const _quickHasContent = _quickKB.hasMeaningfulMatch && _quickKB.text.trim().length > 150;
    startLoadingMessages(body, !_quickHasContent && !strictSopForRequest);
    window._aiContinuationTarget = body;
  }

  if (AI_PROXY_URL.includes('YOUR-WORKER-NAME')) {
    stopLoadingMessages();
    resetAIAnswerAudit();
    body.innerHTML = `<p class="ai-answer-error">⚠️ AI feature is not configured yet. Please set AI_PROXY_URL in the code.</p>`;
    return;
  }

  if (aiAbortController) aiAbortController.abort();
  aiAbortController = new AbortController();

  try {
    if (typeof sugoEnsurePaneIndexReady === 'function') await sugoEnsurePaneIndexReady();
    const kb = getRelevantKnowledgeBaseText(query, attachedImage ? 6 : 12, attachedImage ? 2200 : 3200, preferredPaneForAI, { outputType: selectedOutputType, preferTicketTopics: isTicketOutput, smartTicket: isSmartTicket, compactPrompt: false, completeAnswer: true });
    if (typeof sugoHydrateRelevantKb === 'function') await sugoHydrateRelevantKb(kb);
    if (window.SUGO_EXACT_AI_PANE && preferredPaneForAI === window.SUGO_EXACT_AI_PANE) { window.SUGO_EXACT_AI_PANE = null; }
    const kbHasContent = !!(kb.hasMeaningfulMatch && kb.text.trim().length > 150);

    if (strictSopForRequest && !kbHasContent && !isFollowup && !isContinuation && !attachedImage) {
      stopLoadingMessages();
      const langAr = selectedLanguage === 'arabic';
      body.innerHTML = langAr
        ? `<div class="ai-sop-only-warning"><h3>لا يوجد تطابق واضح داخل الـ SOP</h3><p>وضع <strong>SOP Only</strong> مفعّل، لذلك لن يتم إنشاء جواب تخميني من خارج قاعدة المعرفة.</p><p>جرّب كلمات أخرى مثل: حظر، إساءة، شحن، وكالة، رقم الهاتف، أو غيّر الوضع إلى <strong>Hybrid</strong> إذا أردت السماح بالبحث خارج الـ SOP.</p></div>`
        : `<div class="ai-sop-only-warning"><h3>No clear SOP match found</h3><p><strong>SOP Only</strong> mode is enabled, so the console will not generate a guessed answer outside the local knowledge base.</p><p>Try keywords such as: ban, abuse, recharge, agency, phone number, or switch to <strong>Hybrid</strong> to allow fallback support.</p></div>`;
      renderAISources(kb, false);
      renderFollowupRow();
      aiLastRequestTime = 0;
      return;
    }

    const modeInstruction = isStepMode
      ? "## RESPONSE MODE — STEP-BY-STEP:\nUse clear numbered steps. Separate agent action, customer message, required evidence, and escalation if applicable.\n\n"
      : isDetailed
        ? "## RESPONSE MODE — DETAILED:\nGive a complete answer with conditions, exceptions, and escalation details when relevant.\n\n"
        : "## RESPONSE MODE — BRIEF:\nGive a concise answer with only the essential action points.\n\n";

    const knowledgeModeInstruction = strictSopForRequest
      ? "## KNOWLEDGE MODE — STRICT SOP ONLY:\nUse ONLY the internal knowledge base supplied below. In Smart Ticket mode, never use outside policy or generic support text. If the supplied SOP does not clearly support the case, ask for the missing details or recommend internal escalation. Do not use web search and do not invent policy.\n\n"
      : "## KNOWLEDGE MODE — HYBRID:\nUse the internal knowledge base first. If it is incomplete or there is no strong match, you may use provider web/search capabilities for SUGO-specific public information, but clearly avoid unrelated products.\n\n";

    const imageInstruction = attachedImage
      ? "## ATTACHED IMAGE ANALYSIS:\nThe user attached an image/screenshot. Read the visible content carefully, identify any error message, account/profile/payment/room details, and connect it with the relevant SOP. Do not invent unreadable text or hidden details. If the image is unclear, say what cannot be confirmed. In Ticket mode, use the image as evidence but write only a clean customer-facing message.\n\n"
      : "";

    const systemPrompt =
      "You are an expert SUGO app support specialist for the MENA region. " +
      "SUGO (also known as Sugo Live or VoiceMaker) is a popular live voice and social app operating in MENA. " +
      "Your role: give accurate, complete answers about SUGO features, policies, and troubleshooting to customer support agents.\n\n" +
      knowledgeModeInstruction +
      modeInstruction +
      imageInstruction +
      "## SOURCE DISCIPLINE:\n" +
      "- Treat the provided SOP text as the source of truth when it contains a match.\n" +
      "- If INTERNAL MATCHES show a Primary route, use that route first and do not replace it with a broad overview, generic appeal, or unrelated unban article.\n" +
      "- In Ticket mode, if a matching sv-tickets topic exists, prioritize its Ticket field over general SOP text.\n" +
      "- If confidence is low, avoid definitive policy language.\n" +
      "- For sensitive topics such as ban, abuse, payment, withdrawal, VIP, or agency, prefer escalation when the SOP is incomplete.\n\n" +
      outputTypeInstruction + "\n" +
      smartTicketInstruction +
      customerEnvelopeInstruction +
      "## DEFAULT QUALITY RULES — ALWAYS ON:\n" +
      "- Clean and organize the answer before final output; remove duplicate points, repeated headings, repeated sentences, and filler.\n" +
      "- Numbered lists must be continuous and correct: 1, 2, 3, 4. Never restart at 1 unless a new section truly starts.\n" +
      "- Keep spacing tight: avoid extra blank lines, avoid large gaps, and use compact readable paragraphs.\n" +
      "- Keep English text left-to-right and Arabic text right-to-left in meaning and punctuation.\n" +
      "- When writing a ticket, make it ready to send: write a natural case-specific greeting, exact action, missing information request if needed, and a natural polite closing as SUGO Customer Support Team. Do not duplicate opening or closing lines.\n\n" +
      "## FORMATTING:\n" +
      "- ## for main headings, ### for sub-sections\n" +
      "- **bold** for key terms, numbers, important values\n" +
      "- Numbered lists for step-by-step processes; bullet lists for unordered items\n" +
      "- Short paragraphs (2-4 sentences)\n" +
      "- Start DIRECTLY with the answer — no preamble like 'Based on the knowledge base...'\n" +
      "- No LaTeX notation; use plain Unicode: ≥, ≤, →, ×, ÷, %\n" +
      (isDetailed || isStepMode ? "- Give a complete answer and finish every section fully; do not stop mid-list or mid-sentence\n" : "- Give a complete concise answer and finish every sentence fully\n") +
      (isTicketOutput ? "- Do not add source notes or internal labels in Ticket mode\n" : "- Mention uncertainty clearly when SOP confidence is medium or low\n") +
      "- Follow-up questions: use the prior conversation context to understand references\n\n" +
      (kbHasContent
        ? "=== INTERNAL KNOWLEDGE BASE MATCHES ===\nConfidence: " + kb.confidenceLabel + " (" + kb.confidenceScore + ")\nBest match: " + (kb.bestTopic ? kb.bestTopic.id : 'none') + "\n\n" + kb.text
        : strictSopForRequest
          ? "=== INTERNAL KNOWLEDGE BASE MATCHES ===\n[No directly relevant articles found. Strict SOP Only mode is active.]"
          : "=== INTERNAL KNOWLEDGE BASE MATCHES ===\n[No directly relevant articles found. Hybrid mode may use SUGO-specific fallback information if available.]");

    const messages = [{ role: "system", content: systemPrompt + "\n\nIMPORTANT LANGUAGE RULE:\n" + languageInstruction }];
    if (isFollowup && aiLastExchange) {
      messages.push({ role: "user", content: aiLastExchange.question });
      messages.push({ role: "assistant", content: aiLastExchange.answer });
    }
    const finalUserContent = attachedImage
      ? `${query}\n\n[Attached image: ${attachedImage.name || 'image'}; ${attachedImage.width || '?'}×${attachedImage.height || '?'}; compressed ${sugoFormatBytes(attachedImage.size || 0)}]`
      : query;
    messages.push({ role: "user", content: finalUserContent });

    const imagePayload = buildSugoImagePayload(attachedImage);
    const requestHeaders = { "Content-Type": "application/json" };
    const requestTimeout = setTimeout(() => aiAbortController.abort(), AI_REQUEST_TIMEOUT_MS);
    const response = await fetch(AI_PROXY_URL, {
      method: "POST",
      headers: requestHeaders,
      signal: aiAbortController.signal,
      body: JSON.stringify({
        max_completion_tokens: isTicketOutput ? (isDetailed || isStepMode ? 7000 : 4200) : (isDetailed || isStepMode ? 9000 : 5200),
        response_mode: responseModeForRequest,
        output_type: selectedOutputType,
        language: selectedLanguage,
        sop_mode: strictSopForRequest ? 'sop_only' : 'hybrid',
        kb_matches: (kb.topics || []).slice(0, 12).map(t => ({
          paneId: t.id,
          title: t.title || t.label || t.id,
          category: t.category || '',
          section: t.section || '',
          path: t.path || '',
          score: Math.round((t.score || 0) * 10) / 10,
          confidence: t.confidence || kb.confidence || 'low',
          hits: (t.hits || []).slice(0, 12),
          tags: (t.tags || []).slice(0, 8),
          primary: !!t.primary,
          selected: !!t.selected
        })),
        kb_confidence: kb.confidence || 'low',
        kb_confidence_score: Math.round((kb.confidenceScore || 0) * 10) / 10,
        kb_ambiguous: !!kb.ambiguous,
        kb_primary_route: kb.primaryRoute ? kb.primaryRoute.name : null,
        kb_query_intents: kb.queryIntents || [],
        has_image: !!attachedImage,
        images: imagePayload,
        cache: !attachedImage,
        stream: false,
        messages
      })
    });
    clearTimeout(requestTimeout);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Request failed (${response.status}): ${errText.slice(0, 300)}`);
    }

    let answer = '';
    let responseData = null;
    if (response.body && response.headers.get('content-type')?.includes('text/event-stream')) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let firstChunk = true;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.response ?? json.choices?.[0]?.delta?.content ?? '';
            if (delta) {
              if (firstChunk) {
                stopLoadingMessages();
                const loader = document.getElementById('aiContinuationLoader');
                if (loader) loader.remove();
                if (isFollowup) targetDiv.innerHTML = '';
                firstChunk = false;
              }
              answer += delta;
              const liveAnswer = sugoApplyCustomerReplyEnvelope(stripLatexNotation(answer), selectedLanguage, false, isTicketOutput);
              targetDiv.innerHTML = sugoRenderTicketMarkdown(liveAnswer, isTicketOutput, selectedLanguage) + '<span class="ai-cursor">▌</span>';
            }
          } catch { }
        }
      }
    } else {
      const data = await response.json();
      responseData = data;
      const choice = (data.choices || [])[0];
      answer = (choice && choice.message && choice.message.content || '').trim();
      if (!answer) {
        const raw = data._debug_raw ? JSON.stringify(data._debug_raw).slice(0, 300) : '';
        throw new Error('Empty response' + (raw ? ` (raw: ${raw})` : ''));
      }
    }

    answer = stripPreamble(answer);
    answer = stripLatexNotation(answer);
    answer = sugoApplyCustomerReplyEnvelope(answer, selectedLanguage, true, isTicketOutput);

    // Do not trim answers in the UI. Show the provider response with the required SUGO customer opening and closing.
    let wasTruncated = false;

    stopLoadingMessages();
    const loader = document.getElementById('aiContinuationLoader');
    if (loader) loader.remove();
    targetDiv.innerHTML = sugoRenderTicketMarkdown(answer, isTicketOutput, selectedLanguage);
    if (!isContinuation) {
      const sugoAnswerMetaOptions = {
        strictSopForRequest,
        selectedOutputType,
        responseModeForRequest,
        hasImage: !!attachedImage
      };
      renderAIAnswerAudit(responseData, kb, sugoAnswerMetaOptions);
      renderSmartTicketBuilder(responseData, kb, sugoAnswerMetaOptions, answer, query, selectedLanguage, isTicketOutput);
    }

    // Removed trimmed-answer notice and manual show-more UI by request.

    const prevAnswer = aiLastExchange ? aiLastExchange.answer : '';
    aiLastExchange = { question: query, answer: isContinuation ? prevAnswer + '\n\n' + answer : answer };
    renderAISources(kb, !kbHasContent && !sopOnly);
    renderFollowupRow();
  } catch (err) {
    if (err.name === 'AbortError') {
      stopLoadingMessages();
      const loader = document.getElementById('aiContinuationLoader');
      if (loader) loader.remove();
      aiLastRequestTime = 0;
      if (!isContinuation) resetAIAnswerAudit();
      targetDiv.innerHTML = '<div style="margin-top:4px;"><p class="ai-answer-error">⚠️ Request timed out. Please try again with a shorter question or check the Cloudflare Worker/provider keys.</p></div>';
      return;
    }
    stopLoadingMessages();
    const loader = document.getElementById('aiContinuationLoader');
    if (loader) loader.remove();
    aiLastRequestTime = 0;
    if (!isContinuation) resetAIAnswerAudit();
    const errorHtml = `
      <div style="margin-top:4px;">
        <p class="ai-answer-error">⚠️ The AI could not generate an answer. Please try again.</p>
        <p style="color:var(--text-muted);font-size:0.75rem;margin:6px 0 10px;">${escapeHtml(err.message || String(err))}</p>
        <button onclick="retryLastAI()" style="background:var(--accent-light);border:1px solid var(--accent);color:var(--accent);font-size:0.8rem;font-weight:700;padding:7px 16px;border-radius:var(--radius-sm);cursor:pointer;font-family:var(--display-font);transition:all .15s;" onmouseover="this.style.background='var(--accent)';this.style.color='#fff'" onmouseout="this.style.background='var(--accent-light)';this.style.color='var(--accent)'">↺ Try again</button>
      </div>`;
    targetDiv.innerHTML = errorHtml;
  }
}

// Initialize recent questions on load
renderRecentQuestions();

// Sync response-mode pill labels when UI language changes
(function () {
  const sel = document.getElementById('languageSelect');
  if (sel) {
    sel.addEventListener('change', function () {
      syncRmodePillLabels(this.value);
      syncOutputTypeLabels(this.value);
      setResponseMode(currentResponseMode); // refresh label text too
    });
  }
  // initial sync
  syncOutputTypeLabels(sel?.value || 'english');
  setResponseMode(currentResponseMode);
})();

// Mobile sidebar toggle
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
}
function toggleSidebar(e) {
  e.stopPropagation();
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}
hamburgerBtn.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', closeSidebar);

// Build panes after all setPane calls

// ===== legacy-runtime-script-2 =====

// After all setPane calls, build panes
buildPanes();

// Attach navigation events
document.querySelectorAll('.nav-lroot-btn').forEach(rootBtn => {
  const rootChildren = rootBtn.nextElementSibling;
  const rootChev = rootBtn.querySelector('.nav-lroot-chev');
  rootBtn.onclick = function(e) {
    e.stopPropagation();
    const isOpen = rootChildren.classList.contains('open');
    if (isOpen) { rootChildren.classList.remove('open'); rootChev.classList.remove('open'); }
    else { rootChildren.classList.add('open'); rootChev.classList.add('open'); }
  };
});
document.querySelectorAll('.nav-l0-btn').forEach(b => b.onclick = e => { e.stopPropagation(); handleL0Click(b); });
document.querySelectorAll('.nav-l00-btn').forEach(b => {
  if(b.getAttribute('data-pane') && !b.nextElementSibling) {
    b.onclick = e => { e.stopPropagation(); showPane(b.getAttribute('data-pane'), true); };
  } else {
    b.onclick = e => { e.stopPropagation(); handleL00Click(b); };
  }
});
document.querySelectorAll('.nav-l000-btn').forEach(b => { const paneId = b.getAttribute('data-pane'); if(paneId) b.onclick = e => { e.stopPropagation(); showPane(paneId, true); }; });

document.querySelectorAll('.nav-lroot-children').forEach(ch => ch.classList.remove('open'));
document.querySelectorAll('.nav-lroot-chev').forEach(cv => cv.classList.remove('open'));
showOnlyWelcome();

// ===== id="sugo-premium-v4-js" =====

(function(){
  const STORAGE_KEYS = { lang:'sugo_ui_language', out:'sugo_output_type' };

  function setSelectValue(selectId, value, persist){
    const sel = document.getElementById(selectId);
    if(!sel) return;
    sel.value = value;
    if(persist){
      if(selectId === 'languageSelect') localStorage.setItem(STORAGE_KEYS.lang, value);
      if(selectId === 'outputTypeSelect') localStorage.setItem(STORAGE_KEYS.out, value);
    }
    sel.dispatchEvent(new Event('change', { bubbles:true }));
    syncButtons();
    syncCaptions();
  }

  function syncButtons(){
    document.querySelectorAll('.seg-btn[data-target-select]').forEach(btn => {
      const sel = document.getElementById(btn.dataset.targetSelect);
      btn.classList.toggle('active', !!sel && sel.value === btn.dataset.value);
    });
  }

  function syncCaptions(){
    const lang = document.getElementById('languageSelect')?.value || 'english';
    const langCap = document.getElementById('languageControlCaption');
    const outCap = document.getElementById('outputControlCaption');
    if(langCap) langCap.textContent = lang === 'arabic' ? 'اللغة' : 'Language';
    if(outCap) outCap.textContent = lang === 'arabic' ? 'نوع الرد' : 'Output';

    const outBtns = document.querySelectorAll('.seg-btn[data-target-select="outputTypeSelect"]');
    outBtns.forEach(btn => {
      if(lang === 'arabic') {
        btn.textContent = btn.dataset.value === 'answer' ? 'إجابة' :
          (btn.dataset.value === 'ticket' ? 'تذكرة' : btn.textContent);
      } else {
        btn.textContent = btn.dataset.value === 'answer' ? 'Answer' :
          (btn.dataset.value === 'ticket' ? 'Ticket' : btn.textContent);
      }
    });
  }

  document.addEventListener('click', function(e){
    const btn = e.target.closest('.seg-btn[data-target-select]');
    if(!btn) return;
    setSelectValue(btn.dataset.targetSelect, btn.dataset.value, true);
  });

  window.addEventListener('DOMContentLoaded', function(){
    const savedLang = localStorage.getItem(STORAGE_KEYS.lang);
    const savedOut = localStorage.getItem(STORAGE_KEYS.out);
    if(savedLang && document.getElementById('languageSelect')) document.getElementById('languageSelect').value = savedLang;
    if(savedOut && document.getElementById('outputTypeSelect')) document.getElementById('outputTypeSelect').value = savedOut;
    syncButtons();
    syncCaptions();
    document.getElementById('languageSelect')?.addEventListener('change', function(){
      syncButtons(); syncCaptions();
    });
    document.getElementById('outputTypeSelect')?.addEventListener('change', function(){
      syncButtons(); syncCaptions();
    });
  });

  // In case the original script initializes after this script in some browsers.
  setTimeout(function(){ syncButtons(); syncCaptions(); }, 0);
  setTimeout(function(){ syncButtons(); syncCaptions(); }, 400);
})();

// ===== id="sugo-supreme-v5-js" =====

(function(){
  const STORAGE_KEYS = { lang:'sugo_ui_language', out:'sugo_output_type', sop:'sugo_sop_mode', mode:'sugo_response_mode' };

  function valueLabel(selectId, value, lang){
    const ar = lang === 'arabic';
    if(selectId === 'languageSelect') return value === 'arabic' ? 'عربي' : 'EN';
    if(selectId === 'outputTypeSelect') {
      if(value === 'answer') return ar ? 'إجابة' : 'Answer';
      if(value === 'ticket') return ar ? 'تذكرة' : 'Ticket';
    }
    if(selectId === 'sopModeSelect') return value === 'sop_only' ? (ar ? 'SOP فقط' : 'SOP Only') : (ar ? 'ذكي' : 'Hybrid');
    return value;
  }

  function syncV5Controls(){
    const lang = document.getElementById('languageSelect')?.value || 'english';
    document.querySelectorAll('.seg-btn[data-target-select]').forEach(btn => {
      const sel = document.getElementById(btn.dataset.targetSelect);
      if(!sel) return;
      btn.classList.toggle('active', sel.value === btn.dataset.value);
      btn.textContent = valueLabel(btn.dataset.targetSelect, btn.dataset.value, lang);
    });
    const langCap = document.getElementById('languageControlCaption');
    const outCap = document.getElementById('outputControlCaption');
    const sopCap = document.getElementById('sopModeControlCaption');
    if(langCap) langCap.textContent = lang === 'arabic' ? 'اللغة' : 'Language';
    if(outCap) outCap.textContent = lang === 'arabic' ? 'نوع الرد' : 'Output';
    if(sopCap) sopCap.textContent = lang === 'arabic' ? 'مصدر المعرفة' : 'Knowledge Mode';
    syncRmodePillLabels(lang);
    setResponseMode(currentResponseMode || localStorage.getItem(STORAGE_KEYS.mode) || 'brief');
  }

  function setSelectValue(selectId, value, persist){
    const sel = document.getElementById(selectId);
    if(!sel) return;
    sel.value = value;
    if(persist){
      if(selectId === 'languageSelect') localStorage.setItem(STORAGE_KEYS.lang, value);
      if(selectId === 'outputTypeSelect') localStorage.setItem(STORAGE_KEYS.out, value);
      if(selectId === 'sopModeSelect') localStorage.setItem(STORAGE_KEYS.sop, value);
    }
    sel.dispatchEvent(new Event('change', { bubbles:true }));
    syncV5Controls();
  }

  document.addEventListener('click', function(e){
    const btn = e.target.closest('.seg-btn[data-target-select]');
    if(!btn) return;
    setSelectValue(btn.dataset.targetSelect, btn.dataset.value, true);
  }, true);

  window.addEventListener('DOMContentLoaded', function(){
    const lang = localStorage.getItem(STORAGE_KEYS.lang);
    const out = localStorage.getItem(STORAGE_KEYS.out);
    const sop = localStorage.getItem(STORAGE_KEYS.sop);
    const mode = localStorage.getItem(STORAGE_KEYS.mode);
    if(lang && document.getElementById('languageSelect')) document.getElementById('languageSelect').value = lang;
    if(out && document.getElementById('outputTypeSelect')) document.getElementById('outputTypeSelect').value = out;
    if(sop && document.getElementById('sopModeSelect')) document.getElementById('sopModeSelect').value = sop;
    if(mode) currentResponseMode = mode;
    ['languageSelect','outputTypeSelect','sopModeSelect'].forEach(id => document.getElementById(id)?.addEventListener('change', syncV5Controls));
    syncV5Controls();
  });
  setTimeout(syncV5Controls, 0);
  setTimeout(syncV5Controls, 600);
})();

// ===== id="sugo-v5-compact-options-js" =====

(function(){
  function getSelectLabel(id){
    const lang = document.getElementById('languageSelect')?.value || 'english';
    const ar = lang === 'arabic';
    const value = document.getElementById(id)?.value || '';
    if(id === 'languageSelect') return value === 'arabic' ? 'AR' : 'EN';
    if(id === 'outputTypeSelect') return value === 'ticket' ? (ar ? 'تذكرة' : 'Ticket') : (ar ? 'إجابة' : 'Answer');
    if(id === 'sopModeSelect') return value === 'sop_only' ? 'SOP Only' : 'Hybrid';
    return value;
  }
  window.updateSugoOptionsSummary = function(){
    const summary = document.getElementById('optionsSummary');
    if(!summary) return;
    summary.textContent = `${getSelectLabel('languageSelect')} · ${getSelectLabel('outputTypeSelect')}`;
  };
  window.toggleSugoOptions = function(event){
    if(event) event.preventDefault();
    const sidebar = document.getElementById('sidebar');
    const btn = document.getElementById('optionsToggleBtn');
    if(!sidebar) return;
    const isOpen = sidebar.classList.toggle('options-open');
    if(btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    window.updateSugoOptionsSummary();
  };
  document.addEventListener('change', function(e){
    if(['languageSelect','outputTypeSelect','sopModeSelect'].includes(e.target?.id)){
      window.updateSugoOptionsSummary();
    }
  });
  document.addEventListener('click', function(e){
    if(e.target.closest('.seg-btn[data-target-select]')){
      setTimeout(window.updateSugoOptionsSummary, 30);
    }
  });
  window.addEventListener('DOMContentLoaded', function(){
    const savedCompact = localStorage.getItem('sugo_options_open');
    if(savedCompact === '1'){
      document.getElementById('sidebar')?.classList.add('options-open');
      document.getElementById('optionsToggleBtn')?.setAttribute('aria-expanded','true');
    }
    window.updateSugoOptionsSummary();
    const btn = document.getElementById('optionsToggleBtn');
    btn?.addEventListener('click', function(){
      setTimeout(function(){
        const open = document.getElementById('sidebar')?.classList.contains('options-open');
        localStorage.setItem('sugo_options_open', open ? '1' : '0');
      }, 0);
    });
  });
  setTimeout(window.updateSugoOptionsSummary, 100);
  setTimeout(window.updateSugoOptionsSummary, 700);
})();

// ===== id="sugo-v51-senior-optimized-js" =====

(function(){
  const SENIOR_CS_INDEX = [{"title": "Agency Activation Requirements", "section": "Agency Activation", "pane": "senior-cs-agency-activation", "keywords": "activate activation تفعيل وكالة agency verification unverified invite 5 hosts مذيعات تحقق"}, {"title": "Agency Verification Review Time", "section": "Agency Activation", "pane": "senior-cs-agency-activation", "keywords": "review time verification pending 2 days مراجعة التحقق يومين تأخر وكالة"}, {"title": "Agency Closure and Host Transfer", "section": "Agency Activation", "pane": "senior-cs-agency-activation", "keywords": "close closure remove agency transfer anchors BCM اغلاق حذف وكالة نقل المذيعات"}, {"title": "Eligible Anchors for Agency Joining", "section": "Agency Management", "pane": "senior-cs-agency-management", "keywords": "eligible anchor join agency شروط الانضمام مذيعة مؤهلة new device female 18"}, {"title": "Anchor Agency Joining Process", "section": "Agency Management", "pane": "senior-cs-agency-management", "keywords": "join agency become anchor apply application approval 48 24 انضمام وكالة طلب مذيعة"}, {"title": "Anchor Application Rejection Reasons", "section": "Agency Management", "pane": "senior-cs-agency-management", "keywords": "rejected rejection underage face scan gender multiple accounts رفض طلب مذيعة قاصر حسابات متعددة"}, {"title": "Not Qualified Status", "section": "Agency Management", "pane": "senior-cs-agency-management", "keywords": "not qualified غير مؤهلة face verification my anchors تحقق الوجه"}, {"title": "Agency Transfer Rules", "section": "Agency Management", "pane": "senior-cs-agency-management", "keywords": "transfer agency نقل وكالة 400000 BCM HQ old AGM approval"}, {"title": "Sub-Agency Invitation Process", "section": "Sub-Agency", "pane": "senior-cs-sub-agency", "keywords": "sub agency invite link دعوة وكالة فرعية رابط"}, {"title": "Sub-Agency Independence Requirements", "section": "Sub-Agency", "pane": "senior-cs-sub-agency", "keywords": "independent main agency 80 million 5 active hosts وكالة رئيسية مستقلة 80 مليون"}, {"title": "Commission Qualification Requirements", "section": "Commission & Targets", "pane": "senior-cs-commission-targets", "keywords": "commission salary qualification target عمولة تارجت 200000 active anchors 20k"}, {"title": "Commission Settlement and Calculation", "section": "Commission & Targets", "pane": "senior-cs-commission-targets", "keywords": "commission payout 00:00 calculation 30 days تسوية صرف العمولة حساب"}, {"title": "Sub-Agency Revenue Commission", "section": "Commission & Targets", "pane": "senior-cs-commission-targets", "keywords": "sub agency revenue commission no commission عمولة وكالة فرعية level"}, {"title": "New Agency Tasks", "section": "Agency Tasks", "pane": "senior-cs-agency-tasks", "keywords": "new agency tasks مهام وكالة جديدة 30 days rewards invite anchors income"}, {"title": "B/A/S Agency Growth Tasks", "section": "Agency Tasks", "pane": "senior-cs-agency-tasks", "keywords": "B A S growth tasks مهام النمو 6 million daily active"}, {"title": "Agency Rating Criteria", "section": "Agency Rating & Groups", "pane": "senior-cs-rating-groups", "keywords": "rating star criteria تصنيف نجوم new valid anchors 14 days 20k"}, {"title": "WhatsApp Group Requirements", "section": "Agency Rating & Groups", "pane": "senior-cs-rating-groups", "keywords": "whatsapp group sub agency مجموعة واتساب 2 star 10 active 40k"}, {"title": "Activity Reward Claim", "section": "Activities", "pane": "senior-cs-activities", "keywords": "activity reward Meca PK talent video pk مكافأة نشاط فيديو room ID anchor ID"}, {"title": "AGM Dashboard Access", "section": "Backend System", "pane": "senior-cs-backend-system", "keywords": "AGM dashboard login backend password transfer code لوحة تحكم باسورد رمز تحويل"}, {"title": "Escalation Directory", "section": "Command Center", "pane": "senior-cs-escalation-directory", "keywords": "escalation mention charlotte audit senior monitor ACM HQ تصعيد منشن"}, {"title": "Missing Info Checklists", "section": "Command Center", "pane": "senior-cs-missing-info-checklists", "keywords": "missing info checklist required details معلومات مطلوبة لقطة شاشة agency ID"}, {"title": "Backend Links Reference", "section": "Command Center", "pane": "senior-cs-backend-links-reference", "keywords": "links backend union sugo voicemaker روابط النظام الخلفي"}];
  function norm(str){ return String(str||'').toLowerCase().replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim(); }
  function tokens(str){ return norm(str).split(' ').filter(t=>t.length>1); }
  function scoreItem(qTokens,item){ const hay=norm(item.title+' '+item.section+' '+item.keywords); let score=0; qTokens.forEach(t=>{ if(hay.includes(t)) score += t.length>3?3:2; if(norm(item.title).includes(t)) score += 3; if(norm(item.section).includes(t)) score += 2; }); return score; }
  function findBest(query){ const q=tokens(query); if(!q.length) return null; const ranked=SENIOR_CS_INDEX.map(item=>Object.assign({},item,{score:scoreItem(q,item)})).sort((a,b)=>b.score-a.score); const best=ranked[0]; if(!best||best.score<3) return null; best.confidence=best.score>=12?'High':(best.score>=7?'Medium':'Low'); return best; }
  function renderBestMatch(query){ const panel=document.getElementById('v51BestMatchPanel'); if(!panel) return; const best=findBest(query); if(!best){panel.style.display='none';panel.innerHTML='';return;} panel.style.display='block'; panel.innerHTML=`<div class="v51-best-card"><div class="v51-best-top"><span class="v51-best-badge">Best Match</span><span class="v51-best-score">${best.confidence}</span></div><div class="v51-best-title">${best.title}</div><div class="v51-best-section">${best.section}</div><div class="v51-best-actions"><button type="button" class="v51-mini-btn" data-v51-open="${best.pane}">Open SOP</button><button type="button" class="v51-mini-btn" data-v51-search="${best.title}" data-v51-pane="${best.pane}">Ask AI</button></div></div>`; }
  const oldDoSearch=window.doSearch; if(typeof oldDoSearch==='function'){ window.doSearch=function(q){ renderBestMatch(q); return oldDoSearch.apply(this,arguments); }; }
  document.addEventListener('input',function(e){ if(e.target&&e.target.id==='searchInput') return; });
  document.addEventListener('click',function(e){ const open=e.target.closest('[data-v51-open]'); if(open){ e.preventDefault(); const paneId=open.getAttribute('data-v51-open'); window.SUGO_ACTIVE_PANE=paneId; window.SUGO_ACTIVE_PANE_TS=Date.now(); if(typeof showPane==='function') showPane(paneId,true); } const ask=e.target.closest('[data-v51-search]'); if(ask){ e.preventDefault(); const q=ask.getAttribute('data-v51-search'); const paneId=ask.getAttribute('data-v51-pane'); if(paneId){ window.SUGO_EXACT_AI_PANE=paneId; window.SUGO_ACTIVE_PANE=paneId; window.SUGO_ACTIVE_PANE_TS=Date.now(); } const input=document.getElementById('searchInput'); if(input) input.value=q; if(typeof askAI==='function') askAI(q); } });
  window.SUGO_V51_SENIOR_CS_INDEX=SENIOR_CS_INDEX;
})();

// ===== id="sugo-v52-global-optimized-js" =====

(function(){

  const SUGO_ADDED_INTERNAL_INDEX = [
    {"title":"Change Country Internal Form","section":"Internal Escalation Forms","pane":"sv-internal-change-country","keywords":"change country internal form دولة بلد تغيير تصعيد maha carole omar"},
    {"title":"Change Gender Internal Form","section":"Internal Escalation Forms","pane":"sv-internal-change-gender","keywords":"change gender جنس النوع تصعيد video identity"},
    {"title":"Report Internal Form","section":"Internal Escalation Forms","pane":"sv-internal-report","keywords":"report internal form بلاغ ابلاغ مخالف reporting group"},
    {"title":"Binding Supporter Internal Form","section":"Internal Escalation Forms","pane":"sv-internal-binding-supporter","keywords":"binding supporter change phone ربط داعم تغيير رقم"},
    {"title":"Binding Anchor Internal Form","section":"Internal Escalation Forms","pane":"sv-internal-binding-anchor","keywords":"binding anchor host change phone ربط مضيفة تغيير رقم"},
    {"title":"Recharge Issues Internal Form","section":"Internal Escalation Forms","pane":"sv-internal-recharge-issues","keywords":"recharge issue coins not received شحن كوينز لم تصل"},
    {"title":"Withdraw Lateness Internal Form","section":"Internal Escalation Forms","pane":"sv-internal-withdraw-lateness","keywords":"withdraw lateness salary not received سحب راتب لم يصل"},
    {"title":"Exchange Issues Internal Form","section":"Internal Escalation Forms","pane":"sv-internal-exchange-issues","keywords":"exchange issue unable find account تحويل استبدال لا يظهر"},
    {"title":"Create Agency Internal Form","section":"Internal Escalation Forms","pane":"sv-internal-create-agency","keywords":"create agency internal form انشاء وكالة تصعيد omar ashraf"},
    {"title":"Agency Administrative WhatsApp Group Requirements","section":"Agency Creation & Changes","pane":"sv-tickets-agency-admin-whatsapp-group","keywords":"whatsapp group management agency جروب اداري واتساب وكالة 40 مليون"}
  ];

  const GLOBAL_OPTIMIZED_INDEX = [{"title": "Account Support Optimized", "section": "Account", "pane": "account-support-optimized", "keywords": "account login register password phone bind unbind suspended hacked حساب تسجيل دخول رقم هاتف كلمة مرور ربط استرجاع Account Support Optimized"}, {"title": "Payment Support Optimized", "section": "Payment", "pane": "payment-support-optimized", "keywords": "payment recharge coins purchase failed refund order transaction دفع شحن عملات شراء فشل دفع استرداد طلب عملية Payment Support Optimized"}, {"title": "Function / Host Support Optimized", "section": "Function", "pane": "function-support-optimized", "keywords": "function host live anchor agency join video mode transfer multiple accounts rejected وظيفة مضيفة بث وكالة انضمام رفض نقل حسابات متعددة Function Support Optimized"}, {"title": "Withdrawal & Exchange Support Optimized", "section": "Withdrawal & Exchange", "pane": "withdrawal-exchange-support-optimized", "keywords": "withdrawal exchange cash out coins diamonds money level requirement سحب تحويل استبدال عملات ماس مستوى Withdrawal & Exchange Optimized"}, {"title": "Game Level Requirement Optimized", "section": "Game Level Requirement", "pane": "game-level-support-optimized", "keywords": "game level requirement unlock unable play لعبة مستوى متطلبات فتح لا يستطيع اللعب Game Level Optimized"}, {"title": "Binding Ticket Optimized", "section": "Binding", "pane": "binding-ticket-optimized", "keywords": "binding bind phone email account change unlink ربط تغيير رقم ايميل حساب Binding Ticket Optimized"}, {"title": "Reporting Ticket Optimized", "section": "Reporting", "pane": "reporting-ticket-optimized", "keywords": "report abuse insult issue complaint evidence video room id تبليغ اساءة شكوى دليل فيديو Reporting Ticket Optimized"}, {"title": "Banned / Unbanned Optimized", "section": "Banned / Unbanned", "pane": "banned-ticket-optimized", "keywords": "ban banned unban blocked violation حظر فك حظر مخالفة Banned / Unbanned Optimized"}, {"title": "Agency Ticket Optimized", "section": "Agency Tickets", "pane": "agency-ticket-optimized", "keywords": "agency create change recharge sub main وكالة انشاء تغيير شحن فرعية رئيسية Agency Ticket Optimized"}, {"title": "Games Ticket Optimized", "section": "Games", "pane": "games-ticket-optimized", "keywords": "game issue reward level room pk لعبة مشكلة مكافاة مستوى روم Games Ticket Optimized"}, {"title": "Online Recharge Optimized", "section": "Online Recharge", "pane": "online-recharge-ticket-optimized", "keywords": "online recharge payment coins failed شحن اونلاين دفع عملات فشل Online Recharge Optimized"}, {"title": "Withdrawal & Coin Issues Optimized", "section": "Withdrawal & Coin Issues", "pane": "withdrawal-coin-ticket-optimized", "keywords": "withdrawal coin diamonds missing exchange سحب عملات ماس مفقودة تحويل Withdrawal & Coin Issues Optimized"}, {"title": "App Crash Optimized", "section": "App Crash", "pane": "app-crash-ticket-optimized", "keywords": "app crash freeze bug not working تطبيق كراش يعلق مشكلة تقنية App Crash Optimized"}, {"title": "Change Country Optimized", "section": "Change Country", "pane": "change-country-ticket-optimized", "keywords": "change country region location دولة بلد منطقة تغيير Change Country Optimized"}, {"title": "Location Optimized", "section": "Location", "pane": "location-ticket-optimized", "keywords": "location gps country nearby region موقع GPS دولة منطقة Location Optimized"}, {"title": "Tasks Optimized", "section": "Tasks", "pane": "tasks-ticket-optimized", "keywords": "tasks daily family agency rewards مهام يومية عائلة وكالة مكافأة Tasks Optimized"}];

  function norm(str){
    return String(str||'')
      .toLowerCase()
      .replace(/[أإآ]/g,'ا')
      .replace(/ة/g,'ه')
      .replace(/ى/g,'ي')
      .replace(/ؤ/g,'و')
      .replace(/ئ/g,'ي')
      .replace(/گ/g,'ك')
      .replace(/[^؀-ۿ\p{L}\p{N}\s]/gu,' ')
      .replace(/\s+/g,' ')
      .trim();
  }
  function tokens(str){ return norm(str).split(' ').filter(t=>t.length>1); }
  function scoreItem(qTokens,item){
    const hay = norm(item.title+' '+item.section+' '+(item.keywords||''));
    const title = norm(item.title);
    const section = norm(item.section);
    let score = 0;
    qTokens.forEach(t=>{
      if(hay.includes(t)) score += t.length>3 ? 3 : 2;
      if(title.includes(t)) score += 4;
      if(section.includes(t)) score += 2;
    });
    return score;
  }
  function findBestGlobal(query){
    const q = tokens(query);
    if(!q.length) return null;
    const senior = Array.isArray(window.SUGO_V51_SENIOR_CS_INDEX) ? window.SUGO_V51_SENIOR_CS_INDEX : [];
    const added = Array.isArray(SUGO_ADDED_INTERNAL_INDEX) ? SUGO_ADDED_INTERNAL_INDEX : [];
    const all = GLOBAL_OPTIMIZED_INDEX.concat(senior, added);
    const ranked = all.map(item=>Object.assign({},item,{score:scoreItem(q,item)})).sort((a,b)=>b.score-a.score);
    const best = ranked[0];
    if(!best || best.score < 3) return null;
    best.confidence = best.score >= 13 ? 'High' : (best.score >= 7 ? 'Medium' : 'Low');
    return best;
  }
  function renderGlobalBestMatch(query){
    const panel = document.getElementById('v51BestMatchPanel');
    if(!panel) return;
    const best = findBestGlobal(query);
    if(!best){ panel.style.display='none'; panel.innerHTML=''; return; }
    panel.style.display='block';
    panel.innerHTML = `<div class="v51-best-card v52-global-match">
      <div class="v51-best-top"><span class="v51-best-badge">Best Match</span><span class="v51-best-score">${best.confidence}</span></div>
      <div class="v51-best-title">${best.title}</div>
      <div class="v51-best-section">${best.section}</div>
      <div class="v51-best-actions">
        <button type="button" class="v51-mini-btn" data-v52-open="${best.pane}">Open SOP</button>
        <button type="button" class="v51-mini-btn" data-v52-search="${best.title}" data-v52-pane="${best.pane}">Ask AI</button>
      </div>
    </div>`;
  }

  const prevDoSearch = window.doSearch;
  if(typeof prevDoSearch === 'function'){
    window.doSearch = function(q){
      const result = prevDoSearch.apply(this, arguments);
      setTimeout(function(){ renderGlobalBestMatch(q); }, 0);
      return result;
    };
  }

  document.addEventListener('input', function(e){
    if(e.target && e.target.id === 'searchInput') return;
  }, true);

  document.addEventListener('click', function(e){
    const open = e.target.closest('[data-v52-open]');
    if(open){
      e.preventDefault();
      const paneId = open.getAttribute('data-v52-open');
      window.SUGO_ACTIVE_PANE = paneId;
      window.SUGO_ACTIVE_PANE_TS = Date.now();
      if(typeof showPane === 'function') showPane(paneId, true);
    }
    const ask = e.target.closest('[data-v52-search]');
    if(ask){
      e.preventDefault();
      const q = ask.getAttribute('data-v52-search');
      const paneId = ask.getAttribute('data-v52-pane');
      if(paneId){
        window.SUGO_EXACT_AI_PANE = paneId;
        window.SUGO_ACTIVE_PANE = paneId;
        window.SUGO_ACTIVE_PANE_TS = Date.now();
      }
      const input = document.getElementById('searchInput');
      if(input) input.value = q;
      if(typeof askAI === 'function') askAI(q);
    }
  }, true);

  window.SUGO_V52_GLOBAL_OPTIMIZED_INDEX = GLOBAL_OPTIMIZED_INDEX;
})();

// ===== id="sugo-options-default-closed-final" =====

(function(){
  function forceClosedOnLoad(){
    try { localStorage.removeItem('sugo_options_open'); } catch(e) {}
    var sidebar = document.getElementById('sidebar');
    var btn = document.getElementById('optionsToggleBtn');
    if(sidebar) sidebar.classList.remove('options-open');
    if(btn) btn.setAttribute('aria-expanded','false');
    if(window.updateSugoOptionsSummary) window.updateSugoOptionsSummary();
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', forceClosedOnLoad);
  } else {
    forceClosedOnLoad();
  }
})();

// ===== id="sugo-smart-answer-direction-js" =====

(function(){
  function countMatches(text, re){
    var m = String(text || '').match(re);
    return m ? m.length : 0;
  }

  function detectTextDirection(text, fallback){
    text = String(text || '').trim();
    if(!text) return fallback || 'ltr';
    var arabic = countMatches(text, /[\u0600-\u06FF]/g);
    var latin = countMatches(text, /[A-Za-z]/g);
    var numbers = countMatches(text, /[0-9]/g);

    if(arabic >= 2 && arabic >= latin * 0.35) return 'rtl';
    if(latin >= 1) return 'ltr';
    if(arabic >= 1) return 'rtl';
    return fallback || (numbers ? 'ltr' : 'ltr');
  }

  function selectedUiDirection(){
    var select = document.getElementById('languageSelect');
    return select && select.value === 'arabic' ? 'rtl' : 'ltr';
  }

  function applyDirectionToElement(el, fallback){
    if(!el || !el.textContent) return;
    if(el.closest && el.closest('pre, code')) return;
    var dir = detectTextDirection(el.textContent, fallback || selectedUiDirection());
    el.setAttribute('dir', dir);
    el.classList.remove('sugo-ltr-block','sugo-rtl-block');
    el.classList.add(dir === 'rtl' ? 'sugo-rtl-block' : 'sugo-ltr-block');
  }

  function enhanceAnswerHtml(html){
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    var overall = detectTextDirection(tmp.textContent || '', selectedUiDirection());

    tmp.querySelectorAll('p, li, h1, h2, h3, blockquote, ul, ol, table, th, td').forEach(function(el){
      applyDirectionToElement(el, overall);
    });

    tmp.querySelectorAll('pre, code').forEach(function(el){
      el.setAttribute('dir','ltr');
      el.classList.remove('sugo-rtl-block');
      el.classList.add('sugo-ltr-block');
    });

    return tmp.innerHTML;
  }

  function refreshAnswerContainerDirection(){
    var body = document.getElementById('aiAnswerBody');
    if(!body) return;
    var fallback = selectedUiDirection();
    var dir = detectTextDirection(body.textContent || '', fallback);
    // If language select is English and the answer is mostly English, force the whole answer left.
    // Individual Arabic blocks still override this with their own class.
    if(fallback === 'ltr') dir = 'ltr';
    if(fallback === 'rtl') dir = 'rtl';
    body.setAttribute('dir', dir);
    body.classList.toggle('sugo-answer-ltr', dir === 'ltr');
    body.classList.toggle('sugo-answer-rtl', dir === 'rtl');
  }

  function refreshQueryDirection(){
    var q = document.getElementById('aiAnswerQuery');
    if(!q) return;
    var dir = detectTextDirection(q.textContent || '', selectedUiDirection());
    q.setAttribute('dir', dir);
  }

  function patchRenderMarkdown(){
    if(typeof renderMarkdown !== 'function' || renderMarkdown.__sugoSmartDirectionPatched) return;
    var originalRenderMarkdown = renderMarkdown;
    renderMarkdown = function(md){
      return enhanceAnswerHtml(originalRenderMarkdown.call(this, md));
    };
    renderMarkdown.__sugoSmartDirectionPatched = true;
  }

  function patchAskAI(){
    if(typeof askAI !== 'function' || askAI.__sugoSmartDirectionPatched) return;
    var originalAskAI = askAI;
    askAI = function(){
      var body = document.getElementById('aiAnswerBody');
      if(body){
        var dir = selectedUiDirection();
        body.setAttribute('dir', dir);
        body.classList.toggle('sugo-answer-ltr', dir === 'ltr');
        body.classList.toggle('sugo-answer-rtl', dir === 'rtl');
      }
      setTimeout(refreshQueryDirection, 0);
      var result = originalAskAI.apply(this, arguments);
      setTimeout(function(){ refreshAnswerContainerDirection(); refreshQueryDirection(); }, 50);
      return result;
    };
    askAI.__sugoSmartDirectionPatched = true;
  }

  function observeAnswer(){
    var body = document.getElementById('aiAnswerBody');
    if(body && !body.__sugoSmartDirectionObserver){
      var obs = new MutationObserver(function(){
        refreshAnswerContainerDirection();
        body.querySelectorAll('p, li, h1, h2, h3, blockquote, ul, ol').forEach(function(el){
          if(!el.classList.contains('sugo-ltr-block') && !el.classList.contains('sugo-rtl-block')) {
            applyDirectionToElement(el, selectedUiDirection());
          }
        });
      });
      obs.observe(body, { childList:true, subtree:true, characterData:true });
      body.__sugoSmartDirectionObserver = obs;
    }

    var query = document.getElementById('aiAnswerQuery');
    if(query && !query.__sugoSmartDirectionObserver){
      var qobs = new MutationObserver(refreshQueryDirection);
      qobs.observe(query, { childList:true, subtree:true, characterData:true });
      query.__sugoSmartDirectionObserver = qobs;
    }
  }

  function initSmartDirection(){
    patchRenderMarkdown();
    patchAskAI();
    observeAnswer();
    refreshAnswerContainerDirection();
    refreshQueryDirection();
    var lang = document.getElementById('languageSelect');
    if(lang && !lang.__sugoSmartDirectionListener){
      lang.addEventListener('change', function(){
        refreshAnswerContainerDirection();
        refreshQueryDirection();
      });
      lang.__sugoSmartDirectionListener = true;
    }
  }

  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSmartDirection);
  } else {
    initSmartDirection();
  }

  window.SUGO_smartDirection = {
    detectTextDirection: detectTextDirection,
    enhanceAnswerHtml: enhanceAnswerHtml,
    refresh: initSmartDirection
  };
})();

// ===== id="sugo-minimal-dropdown-filters-js" =====

(function(){
  'use strict';
  if(window.__SUGO_MINIMAL_DROPDOWN_FILTERS__) return;
  window.__SUGO_MINIMAL_DROPDOWN_FILTERS__ = true;

  var LANG_LABELS = { all:'All', en:'English', ar:'Arabic' };
  var TYPE_LABELS = {
    all:'All', overview:'Overview', usecase:'Use Case', checklist:'Required Info',
    flow:'Steps', answer:'Answer', ticket:'Ticket', mention:'Mention',
    form:'Form', escalation:'Escalation', text:'Text'
  };
  var TYPE_ORDER = ['all','answer','ticket','text','checklist','form','mention','overview','usecase','flow','escalation'];

  function qsa(root, selector){ return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function esc(value){ return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[c]; }); }
  function uniq(values){
    var out = [], seen = Object.create(null);
    (values || []).forEach(function(v){ v = String(v || '').trim(); if(v && !seen[v]){ seen[v]=true; out.push(v); } });
    return out;
  }
  function orderedTypes(values){
    values = uniq(values);
    return values.sort(function(a,b){
      var ia = TYPE_ORDER.indexOf(a); if(ia < 0) ia = 999;
      var ib = TYPE_ORDER.indexOf(b); if(ib < 0) ib = 999;
      return ia - ib || a.localeCompare(b);
    });
  }
  function values(card, group){
    var attr = group === 'lang' ? 'data-lang' : 'data-type';
    var list = qsa(card, '.sugo-section').map(function(section){ return section.getAttribute(attr) || (group === 'lang' ? 'all' : 'text'); });
    list = group === 'type' ? orderedTypes(list) : uniq(list);
    if(list.length > 1 && list.indexOf('all') === -1) list.unshift('all');
    return list.length ? list : ['all'];
  }
  function activeValue(card, group){
    var controls = card.querySelector('.sugo-view-controls');
    var active = controls ? controls.querySelector('.sugo-view-btn.active[data-filter-group="'+group+'"]') : null;
    if(active) return active.getAttribute('data-value') || 'all';
    return localStorage.getItem('sugo_content_filter_' + group) || 'all';
  }
  function label(group, value){
    return (group === 'lang' ? LANG_LABELS[value] : TYPE_LABELS[value]) || value;
  }
  function options(group, vals, selected){
    return vals.map(function(v){ return '<option value="'+esc(v)+'"'+(v === selected ? ' selected' : '')+'>'+esc(label(group, v))+'</option>'; }).join('');
  }
  function cleanCopyText(text){
    return String(text || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .split('\n')
      .map(function(line){ return line.replace(/[ \t]+$/g, ''); })
      .join('\n')
      .trim();
  }
  function previousLiCount(li){
    var count = 0, node = li;
    while((node = node.previousElementSibling)){
      if(node && node.tagName && node.tagName.toLowerCase() === 'li') count++;
    }
    return count;
  }
  function appendBreak(parts, hard){
    var last = parts.length ? parts[parts.length - 1] : '';
    if(hard){
      if(last !== '\n\n') parts.push('\n\n');
    }else{
      if(last !== '\n' && last !== '\n\n') parts.push('\n');
    }
  }
  function nodeToPlainText(node, parts){
    if(!node) return;
    if(node.nodeType === 3){
      parts.push(node.nodeValue || '');
      return;
    }
    if(node.nodeType !== 1) return;
    var tag = node.tagName.toLowerCase();
    if(['script','style','noscript','button','select','option','label'].indexOf(tag) >= 0) return;
    if(node.classList && (node.classList.contains('macro-label') || node.classList.contains('macro-title') || node.classList.contains('lang-divider') || node.classList.contains('sugo-min-filter-panel') || node.classList.contains('sugo-view-controls') || node.classList.contains('copy-buttons') || node.classList.contains('sugo-internal-panel') || node.classList.contains('sugo-internal-field'))){
      return;
    }
    if(tag === 'br'){
      appendBreak(parts, false);
      return;
    }
    if(tag === 'li'){
      appendBreak(parts, false);
      var parentTag = node.parentElement && node.parentElement.tagName ? node.parentElement.tagName.toLowerCase() : '';
      var prefix = parentTag === 'ol' ? String(previousLiCount(node) + 1) + '. ' : '• ';
      parts.push(prefix);
      Array.prototype.slice.call(node.childNodes).forEach(function(child){ nodeToPlainText(child, parts); });
      appendBreak(parts, false);
      return;
    }
    if(tag === 'ul' || tag === 'ol'){
      appendBreak(parts, false);
      Array.prototype.slice.call(node.children).forEach(function(child){ nodeToPlainText(child, parts); });
      appendBreak(parts, true);
      return;
    }
    if(node.classList && node.classList.contains('sugo-copy-spacer')){
      appendBreak(parts, true);
      return;
    }
    var blockTags = ['p','div','section','article','h1','h2','h3','h4','h5','h6','table','tr'];
    var isBlock = blockTags.indexOf(tag) >= 0;
    if(isBlock) appendBreak(parts, false);
    Array.prototype.slice.call(node.childNodes).forEach(function(child){ nodeToPlainText(child, parts); });
    if(isBlock) appendBreak(parts, true);
  }
  function elementToPlainText(element){
    var parts = [];
    nodeToPlainText(element, parts);
    return cleanCopyText(parts.join(''));
  }
  function getSectionCopyElement(section){
    if(!section) return null;
    return section.querySelector('.macro-body') || section.querySelector('[dir="rtl"]') || Array.prototype.slice.call(section.children).find(function(child){
      return !(child.classList && (child.classList.contains('macro-label') || child.classList.contains('lang-divider')));
    }) || section;
  }
  function getCopyText(card){
    if(!card) return '';
    var visibleSections = qsa(card, '.sugo-section').filter(function(section){
      return !section.classList.contains('content-filtered-hidden') && !section.classList.contains('sugo-search-hidden') && !section.classList.contains('sugo-internal-field') && section.offsetParent !== null;
    });
    if(!visibleSections.length){
      visibleSections = qsa(card, '.sugo-section').filter(function(section){
        return !section.classList.contains('content-filtered-hidden') && !section.classList.contains('sugo-search-hidden') && !section.classList.contains('sugo-internal-field');
      });
    }
    var chunks = visibleSections.map(function(section){
      var source = getSectionCopyElement(section);
      if(!source) return '';
      var clone = source.cloneNode(true);
      qsa(clone, '.macro-label, .macro-title, .lang-divider, .sugo-min-filter-panel, .sugo-view-controls, .sugo-efficiency-panel, .copy-buttons, .close-pane-btn, .sugo-filter-empty, .sugo-internal-panel, .sugo-internal-field, script, style, noscript').forEach(function(node){ node.remove(); });
      return elementToPlainText(clone);
    }).filter(function(text){ return text && text.trim(); });
    return cleanCopyText(chunks.join('\n\n'));
  }
  function writeClipboard(text){
    if(navigator.clipboard && window.isSecureContext){
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function(resolve, reject){
      try{
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.select();
        var ok = document.execCommand('copy');
        textarea.remove();
        ok ? resolve() : reject(new Error('Copy command failed'));
      }catch(err){ reject(err); }
    });
  }
  function setCopyStatus(control, message){
    if(!control) return;
    var original = control.getAttribute('data-original-label') || control.textContent || 'Copy';
    control.setAttribute('data-original-label', original);
    control.textContent = message;
    control.disabled = true;
    window.setTimeout(function(){ control.textContent = original; control.disabled = false; }, 950);
  }
  function copySelected(card, control){
    var text = getCopyText(card);
    if(!text){ setCopyStatus(control, 'Nothing to copy'); return; }
    writeClipboard(text).then(function(){ setCopyStatus(control, 'Copied'); }).catch(function(){ setCopyStatus(control, 'Copy failed'); });
  }
  function setFilter(card, group, value){
    var controls = card.querySelector('.sugo-view-controls');
    if(controls){
      var btn = controls.querySelector('.sugo-view-btn[data-filter-group="'+group+'"][data-value="'+value+'"]') ||
                controls.querySelector('.sugo-view-btn[data-filter-group="'+group+'"][data-value="all"]') ||
                controls.querySelector('.sugo-view-btn[data-filter-group="'+group+'"]');
      qsa(controls, '.sugo-view-btn[data-filter-group="'+group+'"]').forEach(function(item){ item.classList.remove('active'); });
      if(btn) btn.classList.add('active');
    }
    try{ localStorage.setItem('sugo_content_filter_' + group, value); }catch(e){}
    if(typeof window.sugoApplyContentVisibility === 'function') window.sugoApplyContentVisibility(card);
    else applyDirect(card);
  }
  function applyDirect(card){
    var lang = activeValue(card, 'lang');
    var type = activeValue(card, 'type');
    var visible = 0;
    qsa(card, '.sugo-section').forEach(function(section){
      var sl = section.getAttribute('data-lang') || 'all';
      var st = section.getAttribute('data-type') || 'text';
      var show = (lang === 'all' || sl === 'all' || sl === lang) && (type === 'all' || st === type);
      section.classList.toggle('content-filtered-hidden', !show);
      if(show) visible++;
    });
    qsa(card, '.macro-col').forEach(function(col){
      var sections = qsa(col, '.sugo-section');
      if(!sections.length) return;
      var hasVisible = sections.some(function(s){ return !s.classList.contains('content-filtered-hidden'); });
      col.classList.toggle('sugo-col-hidden', !hasVisible);
    });
    qsa(card, '.macro-grid').forEach(function(grid){
      var count = qsa(grid, '.macro-col').filter(function(col){ return !col.classList.contains('sugo-col-hidden'); }).length;
      grid.classList.toggle('sugo-single-col', count === 1);
    });
    var empty = card.querySelector('.sugo-filter-empty');
    if(empty) empty.style.display = visible ? 'none' : 'block';
  }
  function sync(card){
    if(!card) return;
    var panel = card.querySelector(':scope > .sugo-min-filter-panel') || card.querySelector('.sugo-min-filter-panel');
    if(!panel) return;
    var langVals = values(card, 'lang');
    var typeVals = values(card, 'type');
    var langSel = panel.querySelector('[data-sugo-min="lang"]');
    var typeSel = panel.querySelector('[data-sugo-min="type"]');
    var langActive = activeValue(card, 'lang');
    var typeActive = activeValue(card, 'type');
    if(langVals.indexOf(langActive) < 0) langActive = langVals.indexOf('all') >= 0 ? 'all' : langVals[0];
    if(typeVals.indexOf(typeActive) < 0) typeActive = typeVals.indexOf('all') >= 0 ? 'all' : typeVals[0];
    if(langSel){ langSel.innerHTML = options('lang', langVals, langActive); langSel.disabled = langVals.length <= 1; }
    if(typeSel){ typeSel.innerHTML = options('type', typeVals, typeActive); typeSel.disabled = typeVals.length <= 1; }
    var empty = card.querySelector('.sugo-filter-empty');
    if(empty) empty.textContent = 'No matching content.';
  }
  function wire(card){
    if(!card || !card.querySelector('.sugo-section')) return;
    var panel = card.querySelector(':scope > .sugo-min-filter-panel');
    if(!panel){
      panel = document.createElement('div');
      panel.className = 'sugo-min-filter-panel';
      panel.innerHTML = '<div class="sugo-min-filter-row">'+
        '<label class="sugo-min-field"><span class="sugo-min-label">Language</span><select class="sugo-min-select" data-sugo-min="lang"></select></label>'+
        '<label class="sugo-min-field"><span class="sugo-min-label">Content</span><select class="sugo-min-select" data-sugo-min="type"></select></label>'+
        '<label class="sugo-min-field"><span class="sugo-min-label">Copy</span><button type="button" class="sugo-min-copy-btn" data-sugo-min="copy">Copy</button></label>'+
      '</div>';
      var before = card.querySelector('.sugo-view-controls') || card.firstChild;
      card.insertBefore(panel, before);
      panel.addEventListener('change', function(event){
        var sel = event.target.closest('select[data-sugo-min]');
        if(!sel || !panel.contains(sel)) return;
        var group = sel.getAttribute('data-sugo-min');
        setFilter(card, group, sel.value);
        sync(card);
      });
      panel.addEventListener('click', function(event){
        var btn = event.target.closest('[data-sugo-min="copy"]');
        if(!btn || !panel.contains(btn)) return;
        copySelected(card, btn);
      });
    }
    sync(card);
    if(typeof window.sugoApplyContentVisibility === 'function') window.sugoApplyContentVisibility(card);
    else applyDirect(card);
  }
  function scan(scope){ qsa(scope || document, '.doc-card').forEach(wire); }
  function boot(){ scan(document); setTimeout(function(){ scan(document); }, 80); setTimeout(function(){ scan(document); }, 300); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  try{
    new MutationObserver(function(records){ records.forEach(function(record){ if(record.target) scan(record.target); }); }).observe(document.body, {childList:true, subtree:true});
  }catch(e){}
  window.SUGO_minimalDropdownFilters = { refresh:function(){ scan(document); } };
})();

// ===== id="sugo-final-dropdown-options-js" =====

(function(){
  const STORAGE_KEYS = {
    lang:'sugo_ui_language',
    out:'sugo_output_type',
    sop:'sugo_sop_mode',
    mode:'sugo_response_mode'
  };

  function byId(id){ return document.getElementById(id); }
  function lang(){ return byId('languageSelect')?.value || 'english'; }
  function isArabic(){ return lang() === 'arabic'; }

  function applyOptionLabels(){
    const ar = isArabic();
    const languageCaption = byId('languageControlCaption');
    const outputCaption = byId('outputControlCaption');
    const sopCaption = byId('sopModeControlCaption');
    const responseCaption = byId('rmodeLabelText');
    if(languageCaption) languageCaption.textContent = ar ? 'اللغة' : 'Language';
    if(outputCaption) outputCaption.textContent = ar ? 'نوع النص' : 'Output Type';
    if(sopCaption) sopCaption.textContent = ar ? 'مصدر المعرفة' : 'Knowledge Mode';
    if(responseCaption) responseCaption.textContent = ar ? 'نمط الرد' : 'Response Style';

    const output = byId('outputTypeSelect');
    if(output){
      const value = output.value || 'answer';
      Array.from(output.options).forEach(opt => {
        if(opt.value === 'answer') opt.textContent = ar ? 'إجابة' : 'Answer';
        if(opt.value === 'ticket') opt.textContent = ar ? 'تذكرة' : 'Ticket';
      });
      output.value = value;
      output.title = ar ? 'نوع النص' : 'Output type';
    }

    const sop = byId('sopModeSelect');
    if(sop){
      const value = sop.value || 'hybrid';
      Array.from(sop.options).forEach(opt => {
        if(opt.value === 'hybrid') opt.textContent = ar ? 'Hybrid / ذكي' : 'Hybrid';
        if(opt.value === 'sop_only') opt.textContent = ar ? 'SOP فقط' : 'SOP Only';
      });
      sop.value = value;
      sop.title = ar ? 'مصدر المعرفة' : 'Knowledge mode';
    }

    const response = byId('responseModeSelect');
    if(response){
      const value = response.value || (window.currentResponseMode || localStorage.getItem(STORAGE_KEYS.mode) || 'brief');
      Array.from(response.options).forEach(opt => {
        if(opt.value === 'brief') opt.textContent = ar ? '⚡ مختصر' : '⚡ Brief';
        if(opt.value === 'detailed') opt.textContent = ar ? '📋 مفصل' : '📋 Detailed';
        if(opt.value === 'step') opt.textContent = ar ? '🧭 خطوات' : '🧭 Step';
      });
      response.value = ['brief','detailed','step'].includes(value) ? value : 'brief';
      response.title = ar ? 'نمط الرد' : 'Response style';
    }
  }

  function labelFor(id){
    const ar = isArabic();
    const value = byId(id)?.value || '';
    if(id === 'languageSelect') return value === 'arabic' ? 'AR' : 'EN';
    if(id === 'outputTypeSelect') return value === 'ticket' ? (ar ? 'تذكرة' : 'Ticket') : (ar ? 'إجابة' : 'Answer');
    if(id === 'responseModeSelect') {
      if(value === 'detailed') return ar ? 'مفصل' : 'Detailed';
      if(value === 'step') return ar ? 'خطوات' : 'Step';
      return ar ? 'مختصر' : 'Brief';
    }
    return value;
  }

  window.updateSugoOptionsSummary = function(){
    const summary = byId('optionsSummary');
    if(!summary) return;
    summary.textContent = `${labelFor('languageSelect')} · ${labelFor('outputTypeSelect')} · ${labelFor('responseModeSelect')}`;
  };

  function persistSelect(id){
    const el = byId(id);
    if(!el) return;
    if(id === 'languageSelect') localStorage.setItem(STORAGE_KEYS.lang, el.value);
    if(id === 'outputTypeSelect') localStorage.setItem(STORAGE_KEYS.out, el.value);
    if(id === 'sopModeSelect') localStorage.setItem(STORAGE_KEYS.sop, el.value);
    if(id === 'responseModeSelect') localStorage.setItem(STORAGE_KEYS.mode, el.value);
  }

  function syncAll(){
    applyOptionLabels();
    window.updateSugoOptionsSummary();
  }

  function initializeDropdownOptions(){
    const saved = {
      languageSelect: localStorage.getItem(STORAGE_KEYS.lang),
      outputTypeSelect: localStorage.getItem(STORAGE_KEYS.out),
      sopModeSelect: localStorage.getItem(STORAGE_KEYS.sop),
      responseModeSelect: localStorage.getItem(STORAGE_KEYS.mode)
    };
    Object.entries(saved).forEach(([id,value]) => {
      const el = byId(id);
      if(el && value && Array.from(el.options).some(opt => opt.value === value)) el.value = value;
    });

    ['languageSelect','outputTypeSelect','sopModeSelect','responseModeSelect'].forEach(id => {
      const el = byId(id);
      if(!el || el.dataset.sugoDropdownBound === '1') return;
      el.dataset.sugoDropdownBound = '1';
      el.addEventListener('change', function(){
        persistSelect(id);
        if(id === 'responseModeSelect' && typeof window.setResponseMode === 'function') {
          window.setResponseMode(el.value);
        }
        if(id === 'languageSelect') {
          try { syncOutputTypeLabels(el.value); } catch(e) {}
          try { syncRmodePillLabels(el.value); } catch(e) {}
        }
        syncAll();
      });
    });

    if(typeof window.setResponseMode === 'function') {
      window.setResponseMode(byId('responseModeSelect')?.value || window.currentResponseMode || 'brief');
    }
    syncAll();
  }

  const originalSetResponseMode = window.setResponseMode;
  if(typeof originalSetResponseMode === 'function' && !originalSetResponseMode.__sugoDropdownWrapped){
    const wrapped = function(mode){
      const result = originalSetResponseMode.apply(this, arguments);
      const response = byId('responseModeSelect');
      if(response && ['brief','detailed','step'].includes(mode)) response.value = mode;
      localStorage.setItem(STORAGE_KEYS.mode, mode);
      applyOptionLabels();
      window.updateSugoOptionsSummary();
      return result;
    };
    wrapped.__sugoDropdownWrapped = true;
    window.setResponseMode = wrapped;
  }

  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDropdownOptions);
  } else {
    initializeDropdownOptions();
  }
  setTimeout(initializeDropdownOptions, 100);
  setTimeout(syncAll, 700);
})();

// ===== id="sugo-final-copy-numbering-bestmatch-fix-js" =====

(function(){
  'use strict';
  window.renderBestMatch = function(){
    var panel = document.getElementById('v51BestMatchPanel');
    if(panel){ panel.innerHTML = ''; panel.style.display = 'none'; }
  };
  window.renderGlobalBestMatch = window.renderBestMatch;

  function setStatus(btn, msg, original){
    if(!btn) return;
    var old = original || btn.getAttribute('data-original-label') || btn.textContent || 'Copy';
    btn.setAttribute('data-original-label', old);
    btn.textContent = msg;
    btn.disabled = true;
    setTimeout(function(){ btn.textContent = old; btn.disabled = false; }, 1100);
  }

  document.addEventListener('click', function(event){
    var aiCopy = event.target.closest && event.target.closest('#aiCopyBtn');
    if(aiCopy){
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      if(typeof window.copyAIAnswer === 'function') window.copyAIAnswer(aiCopy);
      return;
    }

    var copyBtn = event.target.closest && event.target.closest('.copy-btn');
    if(copyBtn){
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      var raw = copyBtn.getAttribute('data-copy-text') || '';
      var original = copyBtn.getAttribute('data-original-label') || copyBtn.textContent || 'Copy';
      copyBtn.setAttribute('data-original-label', original);
      window.copyTextToClipboard(raw, copyBtn, '✓ Copied!', original);
      return;
    }

    var minCopy = event.target.closest && event.target.closest('[data-sugo-min="copy"]');
    if(minCopy){
      var card = minCopy.closest('.doc-card');
      if(card){
        event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
        var visible = Array.prototype.slice.call(card.querySelectorAll('.sugo-section')).filter(function(section){
          return !section.classList.contains('content-filtered-hidden') && !section.classList.contains('sugo-search-hidden') && !section.classList.contains('sugo-internal-field') && section.offsetParent !== null;
        });
        if(!visible.length){
          visible = Array.prototype.slice.call(card.querySelectorAll('.sugo-section')).filter(function(section){
            return !section.classList.contains('content-filtered-hidden') && !section.classList.contains('sugo-search-hidden') && !section.classList.contains('sugo-internal-field');
          });
        }
        var wrapper = document.createElement('div');
        visible.forEach(function(section){
          var source = section.querySelector('.macro-body') || section;
          wrapper.appendChild(source.cloneNode(true));
        });
        var text = window.sugoHtmlToPlainText ? window.sugoHtmlToPlainText(wrapper) : wrapper.innerText;
        var html = '<div style="font-family: Arial, sans-serif; line-height:1.55;">' + wrapper.innerHTML + '</div>';
        window.sugoWriteClipboardRich(text, html).then(function(){ setStatus(minCopy, 'Copied', 'Copy'); }).catch(function(){ setStatus(minCopy, 'Copy failed', 'Copy'); });
      }
    }
  }, true);

  document.addEventListener('DOMContentLoaded', function(){
    var panel = document.getElementById('v51BestMatchPanel');
    if(panel){ panel.innerHTML = ''; panel.style.display = 'none'; }
  });
})();

// ===== id="sugo-final-direction-rich-copy-js" =====

(function(){
  'use strict';

  function count(text, re){
    var m = String(text || '').match(re);
    return m ? m.length : 0;
  }

  function detectDirection(text, fallback){
    text = String(text || '').replace(/https?:\/\/\S+/g, '').trim();
    if(!text) return fallback || 'ltr';
    var arabic = count(text, /[\u0600-\u06FF]/g);
    var latin = count(text, /[A-Za-z]/g);
    // Prefer the first meaningful strong character for short/mixed support replies.
    var firstStrong = text.match(/[A-Za-z\u0600-\u06FF]/);
    if(firstStrong){
      var ch = firstStrong[0];
      if(/[A-Za-z]/.test(ch) && latin >= arabic) return 'ltr';
      if(/[\u0600-\u06FF]/.test(ch) && arabic >= latin * 0.30) return 'rtl';
    }
    if(latin > arabic * 1.15) return 'ltr';
    if(arabic > latin * 0.45) return 'rtl';
    if(latin > 0) return 'ltr';
    if(arabic > 0) return 'rtl';
    return fallback || 'ltr';
  }

  function setBlockDirection(el, fallback){
    if(!el || !el.textContent) return;
    if(el.closest && el.closest('pre, code, script, style')) return;
    var dir = detectDirection(el.textContent, fallback || 'ltr');
    if(el.getAttribute('dir') !== dir) el.setAttribute('dir', dir);
    el.classList.remove('sugo-ltr-block', 'sugo-rtl-block');
    el.classList.add(dir === 'rtl' ? 'sugo-rtl-block' : 'sugo-ltr-block');
  }

  function enhanceHtmlDirections(html, fallback){
    var tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    var overall = detectDirection(tmp.textContent || '', fallback || 'ltr');
    tmp.setAttribute('dir', overall);
    tmp.querySelectorAll('p, li, h1, h2, h3, h4, blockquote, td, th').forEach(function(el){
      setBlockDirection(el, overall);
    });
    tmp.querySelectorAll('ol, ul').forEach(function(list){
      var first = list.querySelector('li');
      var dir = first ? (first.getAttribute('dir') || detectDirection(first.textContent, overall)) : overall;
      list.setAttribute('dir', dir);
      list.classList.remove('sugo-ltr-block', 'sugo-rtl-block');
      list.classList.add(dir === 'rtl' ? 'sugo-rtl-block' : 'sugo-ltr-block');
    });
    tmp.querySelectorAll('pre, code').forEach(function(el){
      el.setAttribute('dir', 'ltr');
      el.classList.remove('sugo-rtl-block');
      el.classList.add('sugo-ltr-block');
      el.style.direction = 'ltr';
      el.style.textAlign = 'left';
    });
    return tmp.innerHTML;
  }

  var applying = false;
  function refreshAnswerDirections(){
    if(applying) return;
    var body = document.getElementById('aiAnswerBody');
    if(!body) return;
    applying = true;
    try{
      var overall = detectDirection(body.textContent || '', 'ltr');
      body.setAttribute('dir', overall);
      body.classList.toggle('sugo-answer-ltr', overall === 'ltr');
      body.classList.toggle('sugo-answer-rtl', overall === 'rtl');
      body.querySelectorAll('p, li, h1, h2, h3, h4, blockquote, td, th').forEach(function(el){
        setBlockDirection(el, overall);
      });
      body.querySelectorAll('ol, ul').forEach(function(list){
        var first = list.querySelector('li');
        var dir = first ? (first.getAttribute('dir') || detectDirection(first.textContent, overall)) : overall;
        list.setAttribute('dir', dir);
        list.classList.remove('sugo-ltr-block', 'sugo-rtl-block');
        list.classList.add(dir === 'rtl' ? 'sugo-rtl-block' : 'sugo-ltr-block');
      });
      body.querySelectorAll('pre, code').forEach(function(el){
        el.setAttribute('dir', 'ltr');
        el.classList.remove('sugo-rtl-block');
        el.classList.add('sugo-ltr-block');
      });
    } finally {
      applying = false;
    }
  }

  function patchMarkdownDirection(){
    if(typeof window.renderMarkdown !== 'function' || window.renderMarkdown.__sugoFinalDirectionCopyPatch) return;
    var original = window.renderMarkdown;
    window.renderMarkdown = function(md){
      return enhanceHtmlDirections(original.call(this, md), 'ltr');
    };
    window.renderMarkdown.__sugoFinalDirectionCopyPatch = true;
  }

  function normalizeSpacesForCopy(text){
    return String(text || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/\n{4,}/g, '\n\n')
      .replace(/\n{3}/g, '\n\n')
      .split('\n')
      .map(function(line){ return line.replace(/[ \t]+$/g, ''); })
      .join('\n')
      .trim();
  }

  function inlineComputedStyles(root){
    if(!root) return root;
    var props = [
      'font-family','font-size','font-weight','font-style','line-height','color',
      'direction','text-align','unicode-bidi','list-style-type','white-space',
      'margin-top','margin-bottom','padding-left','padding-right'
    ];
    var all = [root].concat(Array.prototype.slice.call(root.querySelectorAll('*')));
    all.forEach(function(el){
      if(el.nodeType !== 1) return;
      var cs = window.getComputedStyle(el);
      props.forEach(function(prop){
        var value = cs.getPropertyValue(prop);
        if(value) el.style.setProperty(prop, value);
      });
      // Keep clipboard output clean, not card-like.
      el.style.removeProperty('background');
      el.style.removeProperty('background-color');
      el.style.removeProperty('box-shadow');
      el.style.removeProperty('border');
      if(el.tagName && /^H[1-6]$/.test(el.tagName)){
        el.style.fontWeight = cs.fontWeight || '700';
        el.style.marginTop = '0.75em';
        el.style.marginBottom = '0.35em';
      }
      if(el.tagName === 'P'){
        el.style.marginTop = '0';
        el.style.marginBottom = '0.55em';
      }
      if(el.tagName === 'OL' || el.tagName === 'UL'){
        var dir = el.getAttribute('dir') || cs.direction || 'ltr';
        el.style.marginTop = '0.25em';
        el.style.marginBottom = '0.65em';
        if(dir === 'rtl'){
          el.style.paddingRight = '1.45em';
          el.style.paddingLeft = '0';
        } else {
          el.style.paddingLeft = '1.45em';
          el.style.paddingRight = '0';
        }
      }
      if(el.tagName === 'LI'){
        el.style.marginTop = '0.15em';
        el.style.marginBottom = '0.15em';
      }
    });
    return root;
  }

  function stripClipboardOnlyNoise(clone){
    if(!clone) return clone;
    clone.querySelectorAll('.ai-cursor, .copy-buttons, button, select, option, script, style, .ai-sources, .ai-followup-row, .ai-v5-actions, .sugo-internal-panel, .sugo-internal-field').forEach(function(el){
      if(el && el.parentNode) el.parentNode.removeChild(el);
    });
    return clone;
  }

  function buildRichHtmlFromElement(element){
    if(!element) return '';
    refreshAnswerDirections();
    var clone = element.cloneNode(true);
    stripClipboardOnlyNoise(clone);
    clone.innerHTML = enhanceHtmlDirections(clone.innerHTML, detectDirection(clone.textContent || '', 'ltr'));
    inlineComputedStyles(clone);
    var dir = clone.getAttribute('dir') || detectDirection(clone.textContent || '', 'ltr');
    var align = dir === 'rtl' ? 'right' : 'left';
    clone.setAttribute('dir', dir);
    clone.style.direction = dir;
    clone.style.textAlign = align;
    clone.style.fontFamily = window.getComputedStyle(element).fontFamily || 'Arial, sans-serif';
    clone.style.fontSize = window.getComputedStyle(element).fontSize || '15px';
    clone.style.lineHeight = window.getComputedStyle(element).lineHeight || '1.55';
    return '<div dir="' + dir + '" style="direction:' + dir + ';text-align:' + align + ';font-family:' + clone.style.fontFamily.replace(/"/g, '&quot;') + ';font-size:' + clone.style.fontSize + ';line-height:' + clone.style.lineHeight + ';">' + clone.innerHTML + '</div>';
  }

  function plainTextToRichHtml(text){
    var clean = normalizeSpacesForCopy(text);
    var dir = detectDirection(clean, 'ltr');
    var html = (typeof window.formatTextWithLists === 'function') ? window.formatTextWithLists(clean) : clean.replace(/[&<>]/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]); }).replace(/\n/g, '<br>');
    html = enhanceHtmlDirections(html, dir);
    var align = dir === 'rtl' ? 'right' : 'left';
    var family = dir === 'rtl' ? "'Cairo', Arial, sans-serif" : "Arial, sans-serif";
    return '<div dir="' + dir + '" style="direction:' + dir + ';text-align:' + align + ';font-family:' + family + ';font-size:15px;line-height:1.55;">' + html + '</div>';
  }

  // Override the old helper so all copy buttons get richer HTML with stable font size.
  window.sugoPlainTextToClipboardHtml = plainTextToRichHtml;

  var originalWrite = window.sugoWriteClipboardRich;
  window.sugoWriteClipboardRich = function(plainText, htmlText){
    var clean = normalizeSpacesForCopy(plainText);
    var rich = htmlText || plainTextToRichHtml(clean);
    if(typeof originalWrite === 'function') return originalWrite(clean, rich);
    if(navigator.clipboard && window.ClipboardItem && window.isSecureContext){
      var item = new ClipboardItem({
        'text/plain': new Blob([clean], {type:'text/plain'}),
        'text/html': new Blob([rich], {type:'text/html'})
      });
      return navigator.clipboard.write([item]);
    }
    if(navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(clean);
    return Promise.reject(new Error('Clipboard API unavailable'));
  };

  window.copyTextToClipboard = function(text, btn, success, orig, htmlText){
    var clean = normalizeSpacesForCopy(text);
    var rich = htmlText || plainTextToRichHtml(clean);
    window.sugoWriteClipboardRich(clean, rich)
      .then(function(){
        if(btn){
          var old = orig || btn.getAttribute('data-original-label') || btn.textContent || 'Copy';
          btn.setAttribute('data-original-label', old);
          btn.innerText = success || '✓ Copied!';
          setTimeout(function(){ btn.innerText = old; }, 1200);
        }
      })
      .catch(function(){
        if(btn){
          var old = orig || btn.getAttribute('data-original-label') || btn.textContent || 'Copy';
          btn.innerText = '❌ Failed';
          setTimeout(function(){ btn.innerText = old; }, 1800);
        }
      });
  };

  window.copyAIAnswer = function(btn){
    var body = document.getElementById('aiAnswerBody');
    if(!body) return;
    refreshAnswerDirections();
    var text = window.sugoHtmlToPlainText ? window.sugoHtmlToPlainText(body) : body.innerText;
    text = normalizeSpacesForCopy(text);
    if(!text) return;
    var html = buildRichHtmlFromElement(body);
    window.copyTextToClipboard(text, btn, '✓ Copied!', '📋 Copy', html);
  };

  function init(){
    patchMarkdownDirection();
    refreshAnswerDirections();
    var body = document.getElementById('aiAnswerBody');
    if(body && !body.__sugoFinalDirectionCopyObserver){
      var obs = new MutationObserver(function(){
        clearTimeout(body.__sugoFinalDirectionCopyTimer);
        body.__sugoFinalDirectionCopyTimer = setTimeout(refreshAnswerDirections, 20);
      });
      obs.observe(body, {childList:true, subtree:true, characterData:true});
      body.__sugoFinalDirectionCopyObserver = obs;
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  setTimeout(init, 200);
  setTimeout(refreshAnswerDirections, 800);

  window.SUGO_finalDirectionCopyFix = {
    detectDirection: detectDirection,
    refresh: refreshAnswerDirections,
    richHtmlFromElement: buildRichHtmlFromElement
  };
})();

// ===== id="sugo-global-direction-all-content-js" =====

(function(){
  'use strict';

  var applying = false;
  var scheduled = false;
  var observer = null;

  function count(text, re){
    var m = String(text || '').match(re);
    return m ? m.length : 0;
  }

  function cleanDirectionText(text){
    return String(text || '')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/[\u200E\u200F\u202A-\u202E]/g, '')
      .replace(/[0-9٠-٩.,:;!?()\[\]{}<>"'`~@#$%^&*_+=|\\/\-–—•·،؛؟\s]+/g, ' ')
      .trim();
  }

  function detectDirection(text, fallback){
    var raw = String(text || '');
    var cleaned = cleanDirectionText(raw);
    if(!cleaned) return fallback || 'ltr';

    var firstStrong = cleaned.match(/[A-Za-z\u0590-\u08FF]/);
    if(firstStrong){
      return /[A-Za-z]/.test(firstStrong[0]) ? 'ltr' : 'rtl';
    }

    var arabic = count(cleaned, /[\u0600-\u06FF]/g);
    var hebrew = count(cleaned, /[\u0590-\u05FF]/g);
    var rtl = arabic + hebrew;
    var latin = count(cleaned, /[A-Za-z]/g);

    if(latin && latin >= rtl) return 'ltr';
    if(rtl) return 'rtl';
    return fallback || 'ltr';
  }

  function isHiddenOrUtility(el){
    if(!el || el.nodeType !== 1) return true;
    if(el.closest && el.closest('script, style, svg, canvas, pre, code, textarea, select, option, input')) return true;
    if(el.classList && (
      el.classList.contains('search-icon') ||
      el.classList.contains('ai-spinner') ||
      el.classList.contains('ai-cursor')
    )) return true;
    return false;
  }

  function setDirection(el, dir){
    if(isHiddenOrUtility(el)) return;
    dir = dir === 'rtl' ? 'rtl' : 'ltr';
    el.setAttribute('dir', dir);
    el.classList.remove('sugo-dir-ltr','sugo-dir-rtl','sugo-ltr-block','sugo-rtl-block');
    el.classList.add(dir === 'rtl' ? 'sugo-dir-rtl' : 'sugo-dir-ltr');
    // Inline styles intentionally override old Arabic-global rules in this file.
    el.style.setProperty('direction', dir, 'important');
    el.style.setProperty('text-align', dir === 'rtl' ? 'right' : 'left', 'important');
    el.style.setProperty('unicode-bidi', 'plaintext', 'important');
  }

  function setCodeDirection(root){
    if(!root || !root.querySelectorAll) return;
    root.querySelectorAll('pre, code').forEach(function(el){
      el.setAttribute('dir','ltr');
      el.classList.remove('sugo-dir-rtl','sugo-rtl-block');
      el.classList.add('sugo-dir-ltr');
      el.style.setProperty('direction','ltr','important');
      el.style.setProperty('text-align','left','important');
      el.style.setProperty('unicode-bidi','normal','important');
    });
  }

  function applyListDirection(list, fallback){
    if(isHiddenOrUtility(list)) return;
    var first = list.querySelector('li');
    var dir = first ? detectDirection(first.textContent || '', fallback) : detectDirection(list.textContent || '', fallback);
    setDirection(list, dir);
    if(dir === 'rtl'){
      list.style.setProperty('padding-right','1.35rem','important');
      list.style.setProperty('padding-left','0','important');
    }else{
      list.style.setProperty('padding-left','1.35rem','important');
      list.style.setProperty('padding-right','0','important');
    }
  }

  function applyRoot(root){
    if(!root || isHiddenOrUtility(root)) return;
    var text = root.textContent || '';
    var fallback = detectDirection(text, 'ltr');

    // Root containers with visible prose should also get the correct direction.
    if(root.matches && root.matches('#aiAnswerBody, .ai-answer-body, .ai-answer-card, .doc-card, .macro-col, .macro-body, .content-welcome, .ai-query, .ai-suggestion-btn, .nav-lroot-btn, .nav-l0-btn, .nav-l00-btn, .nav-l000-btn')){
      setDirection(root, fallback);
    }

    var selector = [
      'p','li','h1','h2','h3','h4','h5','h6','blockquote','figcaption',
      'td','th','caption','dt','dd','summary','label',
      '.macro-title','.macro-label','.macro-body','.macro-field',
      '.ai-query','.ai-answer-body','.ai-v5-value','.ai-v5-card',
      '.ai-suggestion-btn','.ai-source-chip','.ai-truncated-note',
      '.nav-lroot-btn > span','.nav-l0-btn span','.nav-l00-btn span','.nav-l000-btn',
      '.content-welcome h2','.content-welcome p'
    ].join(',');

    root.querySelectorAll(selector).forEach(function(el){
      if(isHiddenOrUtility(el)) return;
      var t = el.textContent || '';
      if(!t.trim()) return;
      setDirection(el, detectDirection(t, fallback));
    });

    root.querySelectorAll('ol, ul').forEach(function(list){ applyListDirection(list, fallback); });
    setCodeDirection(root);
  }

  function disconnectConflictingOldObservers(){
    var body = document.getElementById('aiAnswerBody');
    if(body && body.__sugoSmartDirectionObserver){
      try{ body.__sugoSmartDirectionObserver.disconnect(); }catch(e){}
      body.__sugoSmartDirectionObserver = null;
    }
    var query = document.getElementById('aiAnswerQuery');
    if(query && query.__sugoSmartDirectionObserver){
      try{ query.__sugoSmartDirectionObserver.disconnect(); }catch(e){}
      query.__sugoSmartDirectionObserver = null;
    }
  }

  function collectRoots(selectors){
    var roots = [];
    selectors.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        if(roots.indexOf(el) === -1) roots.push(el);
      });
    });
    return roots;
  }

  function applyDirectionsTo(selectors){
    if(applying) return;
    applying = true;
    try{
      disconnectConflictingOldObservers();
      collectRoots(selectors).forEach(applyRoot);
    } finally {
      applying = false;
    }
  }

  function applyAllDirections(){
    // Full pass is intentionally kept for initial load / manual refresh only.
    applyDirectionsTo(['#aiAnswerBody','#aiAnswerQuery','.content','.sidebar']);
  }

  function applyDynamicDirections(){
    // Fast pass used after AI/content changes. It avoids scanning the full sidebar,
    // so native dropdowns open instantly without triggering a full-page reflow.
    applyDirectionsTo(['#aiAnswerBody','#aiAnswerQuery','.ai-answer-card.active','.content-pane.active']);
  }

  function scheduleApply(){
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(function(){
      scheduled = false;
      applyDynamicDirections();
    });
  }

  function patchMarkdownAgain(){
    if(typeof window.renderMarkdown === 'function' && !window.renderMarkdown.__sugoGlobalDirectionAllPatch){
      var previous = window.renderMarkdown;
      window.renderMarkdown = function(md){
        var html = previous.call(this, md);
        setTimeout(scheduleApply, 0);
        return html;
      };
      window.renderMarkdown.__sugoGlobalDirectionAllPatch = true;
    }
  }

  function init(){
    disconnectConflictingOldObservers();
    patchMarkdownAgain();
    applyAllDirections();
    if(observer) return;

    // Performance fix: do not observe the entire document or attributes.
    // Watching class/style changes made every dropdown open trigger a full scan.
    observer = new MutationObserver(function(records){
      var shouldRefresh = records.some(function(record){
        var target = record.target;
        return target && !(target.closest && target.closest('#sidebar .search-row, select, option, input, textarea, button'));
      });
      if(shouldRefresh) scheduleApply();
    });

    ['#aiAnswerBody','#aiAnswerQuery','.content'].forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        observer.observe(el, {childList:true, subtree:true, characterData:true});
      });
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  setTimeout(init, 200);
  setTimeout(applyAllDirections, 700);
  setTimeout(applyAllDirections, 1500);

  window.SUGO_applyAllDirections = applyAllDirections;
  if(window.SUGO_finalDirectionCopyFix){
    window.SUGO_finalDirectionCopyFix.refresh = applyAllDirections;
    window.SUGO_finalDirectionCopyFix.detectDirection = detectDirection;
  }
})();

// ===== id="sugo-super-features-js" =====

(function(){
  'use strict';

  var STORAGE = {
    preset:'sugo_ready_preset',
    density:'sugo_answer_density'
  };

  var PRESETS = {
    custom: null,
    // lang:null means: keep the language currently selected by the user.
    // This prevents Preset from forcing English when Arabic is active.
    fast_support: { lang:null, output:'answer', sop:'hybrid', mode:'brief' },
    detailed_sop: { lang:null, output:'answer', sop:'sop_only', mode:'detailed' },
    step_troubleshoot: { lang:null, output:'answer', sop:'hybrid', mode:'step' },
    formal_ticket: { lang:null, output:'ticket', sop:'hybrid', mode:'detailed' },
    // These two are intentionally language-specific because their names say Arabic/English.
    arabic_ticket: { lang:'arabic', output:'ticket', sop:'hybrid', mode:'detailed' },
    english_agent: { lang:'english', output:'answer', sop:'hybrid', mode:'detailed' }
  };

  function byId(id){ return document.getElementById(id); }
  function currentLang(){ return byId('languageSelect') && byId('languageSelect').value === 'arabic' ? 'arabic' : 'english'; }
  function isArabicText(text){ return /[\u0600-\u06FF]/.test(String(text || '')); }
  function escapeHtml(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];
    });
  }

  function fireChange(el){
    if(!el) return;
    el.dispatchEvent(new Event('change', { bubbles:true }));
  }

  function setSelect(id, value){
    var el = byId(id);
    if(!el) return;
    var ok = Array.prototype.some.call(el.options || [], function(opt){ return opt.value === value; });
    if(!ok) return;
    el.value = value;
    fireChange(el);
  }

  function applyPreset(name, save){
    var preset = PRESETS[name];
    if(!preset) return;

    // IMPORTANT:
    // Do NOT reset language to English when applying a general preset.
    // If preset.lang is null/undefined, keep the user's current language.
    if(preset.lang) setSelect('languageSelect', preset.lang);

    setSelect('outputTypeSelect', preset.output);
    setSelect('sopModeSelect', preset.sop);
    setSelect('responseModeSelect', preset.mode);
    if(typeof window.setResponseMode === 'function') window.setResponseMode(preset.mode);
    if(save !== false){ try{ localStorage.setItem(STORAGE.preset, name); }catch(e){} }
    if(typeof window.updateSugoOptionsSummary === 'function') window.updateSugoOptionsSummary();
  }

  function markPresetCustom(){
    var preset = byId('presetSelect');
    if(!preset) return;
    if(preset.value !== 'custom'){
      preset.value = 'custom';
      try{ localStorage.setItem(STORAGE.preset, 'custom'); }catch(e){}
    }
  }

  function syncPresetLabels(){
    var ar = currentLang() === 'arabic';
    var cap = byId('presetControlCaption');
    var sel = byId('presetSelect');
    if(cap) cap.textContent = ar ? 'قالب جاهز' : 'Preset';
    if(!sel) return;
    var value = sel.value || 'custom';
    var labels = ar ? {
      custom:'تخصيص يدوي',
      fast_support:'رد دعم سريع',
      detailed_sop:'إجابة SOP مفصلة',
      step_troubleshoot:'حل مشكلة خطوة بخطوة',
      formal_ticket:'رد تذكرة رسمي',
      arabic_ticket:'تذكرة عميل عربية',
      english_agent:'إرشاد وكيل إنجليزي'
    } : {
      custom:'Custom',
      fast_support:'Fast Support Answer',
      detailed_sop:'Detailed SOP Answer',
      step_troubleshoot:'Step-by-step Troubleshooting',
      formal_ticket:'Formal Ticket Reply',
      arabic_ticket:'Arabic Customer Ticket',
      english_agent:'English Agent Reply'
    };
    Array.prototype.forEach.call(sel.options || [], function(opt){ opt.textContent = labels[opt.value] || opt.value; });
    sel.value = value;
  }

  function initPresets(){
    var sel = byId('presetSelect');
    if(!sel) return;
    if(!sel.__sugoPresetBound){
      sel.__sugoPresetBound = true;
      sel.addEventListener('change', function(){
        var value = sel.value || 'custom';
        try{ localStorage.setItem(STORAGE.preset, value); }catch(e){}
        if(value !== 'custom') applyPreset(value, true);
        syncPresetLabels();
      });
      ['languageSelect','outputTypeSelect','sopModeSelect','responseModeSelect'].forEach(function(id){
        var el = byId(id);
        if(!el || el.__sugoPresetCustomBound) return;
        el.__sugoPresetCustomBound = true;
        el.addEventListener('change', function(){
          // A direct user change means the preset is now custom. Delay prevents marking custom during preset application flicker.
          setTimeout(function(){
            var current = byId('presetSelect');
            if(!current) return;
            var saved = null;
            try{ saved = localStorage.getItem(STORAGE.preset); }catch(e){}
            if(saved && saved !== 'custom'){
              var p = PRESETS[saved];
              var matches = p &&
                (!p.lang || byId('languageSelect')?.value === p.lang) &&
                (byId('outputTypeSelect')?.value === p.output) &&
                (byId('sopModeSelect')?.value === p.sop) &&
                (byId('responseModeSelect')?.value === p.mode);
              if(!matches) markPresetCustom();
            }
          }, 40);
        });
      });
    }
    var saved = 'custom';
    try{ saved = localStorage.getItem(STORAGE.preset) || 'custom'; }catch(e){}
    if(PRESETS.hasOwnProperty(saved)) sel.value = saved;
    syncPresetLabels();
  }

  function normalizeAnswerText(text){
    text = String(text || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[\u200E\u200F\u202A-\u202E]/g, '')
      .replace(/\r/g, '')
      .split('\n')
      .map(function(line){ return line.replace(/[ \t]+$/g, '').replace(/^[ \t]+$/g, ''); })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if(typeof window.stripPreamble === 'function') text = window.stripPreamble(text);
    if(typeof window.stripLatexNotation === 'function') text = window.stripLatexNotation(text);

    var lines = text.split('\n');
    var out = [];
    var lastKey = '';
    var inOl = false;
    var nextNum = 1;

    function comparable(line){
      return String(line || '')
        .toLowerCase()
        .replace(/^#{1,6}\s*/, '')
        .replace(/^\s*\d+[.)-]\s*/, '')
        .replace(/^\s*[-*•–—]\s*/, '')
        .replace(/[\s،,.;:!?؟؛]+/g, ' ')
        .trim();
    }

    for(var i=0;i<lines.length;i++){
      var raw = lines[i];
      var line = raw.trim();
      if(!line){
        var nextLine = '';
        for(var j=i+1;j<lines.length;j++){ if(lines[j].trim()){ nextLine = lines[j].trim(); break; } }
        if(inOl && /^\d+[.)-]\s+/.test(nextLine)) continue;
        if(out.length && out[out.length-1] !== '') out.push('');
        inOl = false;
        nextNum = 1;
        continue;
      }

      var key = comparable(line);
      if(key && key === lastKey) continue;
      lastKey = key;

      var m = line.match(/^(\d+)[.)-]\s+(.*)$/);
      if(m){
        if(!inOl){ inOl = true; nextNum = Math.max(1, parseInt(m[1],10) || 1); }
        line = nextNum + '. ' + (m[2] || '').trim();
        nextNum += 1;
      } else if(!/^[-*•–—]\s+/.test(line)) {
        inOl = false;
        nextNum = 1;
      }
      out.push(line);
    }
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function plainFromAnswer(){
    var body = byId('aiAnswerBody');
    if(!body) return '';
    if(typeof window.sugoHtmlToPlainText === 'function') return window.sugoHtmlToPlainText(body).trim();
    return (body.innerText || body.textContent || '').trim();
  }

  function setAnswerFromText(text){
    var body = byId('aiAnswerBody');
    if(!body) return;
    text = normalizeAnswerText(text);
    if(typeof window.renderMarkdown === 'function') body.innerHTML = window.renderMarkdown(text);
    else body.innerHTML = '<p>' + escapeHtml(text).replace(/\n/g, '<br>') + '</p>';
    if(window.aiLastExchange) window.aiLastExchange.answer = text;
    if(typeof window.SUGO_applyAllDirections === 'function') setTimeout(window.SUGO_applyAllDirections, 0);
    applyDensity(getDensity());
  }

  function cleanCurrentAnswer(btn){
    var current = plainFromAnswer();
    if(!current) return;
    setAnswerFromText(current);
    showToolbarToast(btn, currentLang() === 'arabic' ? '✓ تم التنظيف' : '✓ Cleaned');
  }

  function buildTicketTemplate(btn){
    var current = normalizeAnswerText(plainFromAnswer());
    if(!current) return;
    var query = (byId('aiAnswerQuery')?.textContent || '').trim();
    var ar = currentLang() === 'arabic' || isArabicText(current);
    var template;
    if(ar){
      template = [
        '## ملخص المشكلة',
        query || 'اكتب ملخص المشكلة هنا.',
        '',
        '## الإجراء المطلوب',
        current,
        '',
        '## رد جاهز للعميل',
        'مرحبًا،',
        '',
        current,
        '',
        'شكرًا لتواصلك معنا.',
        '',
        '## ملاحظة داخلية',
        'يرجى مراجعة بيانات المستخدم والتصعيد إذا كانت المعلومات غير مكتملة أو الحالة تحتاج صلاحيات إضافية.'
      ].join('\n');
    } else {
      template = [
        '## Issue Summary',
        query || 'Add the customer issue summary here.',
        '',
        '## Required Action',
        current,
        '',
        '## Ready Customer Reply',
        'Welcome to the SUGO family!\nWe are very happy and honored to have you with us.\nHow can we assist you today?',
        '',
        current,
        '',
        'We once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team',
        '',
        '## Internal Note',
        'Review the user details and escalate if information is incomplete or the case requires additional permissions.'
      ].join('\n');
    }
    setAnswerFromText(template);
    showToolbarToast(btn, ar ? '✓ تم بناء التذكرة' : '✓ Ticket built');
  }

  function getDensity(){
    var d = 'normal';
    try{ d = localStorage.getItem(STORAGE.density) || 'normal'; }catch(e){}
    return ['compact','normal','expanded'].indexOf(d) >= 0 ? d : 'normal';
  }

  function applyDensity(mode){
    mode = ['compact','normal','expanded'].indexOf(mode) >= 0 ? mode : 'normal';
    var body = byId('aiAnswerBody');
    var card = document.querySelector('.ai-answer-card');
    [body, card].forEach(function(el){
      if(!el) return;
      el.classList.remove('sugo-answer-compact','sugo-answer-normal','sugo-answer-expanded');
      el.classList.add('sugo-answer-' + mode);
    });
    document.querySelectorAll('.sugo-density-btn').forEach(function(btn){ btn.classList.toggle('active', btn.dataset.density === mode); });
    try{ localStorage.setItem(STORAGE.density, mode); }catch(e){}
  }

  function showToolbarToast(anchor, msg){
    var toolbar = document.querySelector('.sugo-ai-toolbar');
    if(!toolbar) return;
    var old = toolbar.querySelector('.sugo-clean-toast');
    if(old) old.remove();
    var toast = document.createElement('span');
    toast.className = 'sugo-clean-toast';
    toast.textContent = msg;
    toolbar.appendChild(toast);
    setTimeout(function(){ try{ toast.remove(); }catch(e){} }, 2200);
  }

  function ensureToolbar(){
    document.querySelectorAll('.sugo-ai-toolbar').forEach(function(el){
      try { el.remove(); } catch(e) {}
    });
    applyDensity(getDensity());
  }

  function patchRenderMarkdown(){
    if(typeof window.renderMarkdown !== 'function' || window.renderMarkdown.__sugoSuperCleanPatch) return;
    var previous = window.renderMarkdown;
    window.renderMarkdown = function(md){
      // Normalize only AI-style markdown text. This is safe for content panes too because it preserves headings/lists while fixing repeated numbering.
      var clean = normalizeAnswerText(md);
      return previous.call(this, clean);
    };
    window.renderMarkdown.__sugoSuperCleanPatch = true;
  }

  function patchCopyButton(){
    if(typeof window.copyAIAnswer !== 'function' || window.copyAIAnswer.__sugoSuperCopyPatch) return;
    var prev = window.copyAIAnswer;
    window.copyAIAnswer = function(btn){
      var body = byId('aiAnswerBody');
      if(body){
        // Clean silently before copying, so numbering and spacing are correct in the clipboard too.
        var current = normalizeAnswerText(plainFromAnswer());
        if(current) setAnswerFromText(current);
      }
      return prev.apply(this, arguments);
    };
    window.copyAIAnswer.__sugoSuperCopyPatch = true;
  }

  function refresh(){
    initPresets();
    syncPresetLabels();
    ensureToolbar();
    patchRenderMarkdown();
    patchCopyButton();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh);
  else refresh();
  setTimeout(refresh, 150);
  setTimeout(refresh, 700);
  document.addEventListener('change', function(e){
    if(e.target && e.target.id === 'languageSelect') syncPresetLabels();
  }, true);

  window.SUGO_superFeatures = {
    cleanCurrentAnswer: cleanCurrentAnswer,
    buildTicketTemplate: buildTicketTemplate,
    applyDensity: applyDensity,
    applyPreset: applyPreset,
    normalizeAnswerText: normalizeAnswerText,
    refresh: refresh
  };
})();

// ===== Integrated SUGO UI and navigation behavior =====

(function(){
  var EN = {
    languageControlCaption:'Language', outputControlCaption:'Output', sopModeControlCaption:'Knowledge Mode', rmodeLabelText:'Response', presetControlCaption:'Preset'
  };
  var SELECT_TEXT = {
    languageSelect:{english:'English',arabic:'Arabic'},
    outputTypeSelect:{answer:'Answer',ticket:'Ticket'},
    sopModeSelect:{hybrid:'Hybrid',sop_only:'SOP Only'},
    responseModeSelect:{brief:'⚡ Brief',detailed:'📋 Detailed',step:'🧭 Step'},
    presetSelect:{custom:'Custom',fast_support:'Fast Support Answer',detailed_sop:'Detailed SOP Answer',step_troubleshoot:'Step-by-step Troubleshooting',formal_ticket:'Formal Ticket Reply',arabic_ticket:'Arabic Customer Ticket',english_agent:'English Agent Reply'}
  };
  function byId(id){ return document.getElementById(id); }
  function lockOptionsEnglish(){
    Object.keys(EN).forEach(function(id){ var el=byId(id); if(el && el.textContent!==EN[id]) el.textContent=EN[id]; });
    Object.keys(SELECT_TEXT).forEach(function(id){
      var sel=byId(id), map=SELECT_TEXT[id]; if(!sel) return;
      Array.prototype.forEach.call(sel.options,function(opt){ if(map[opt.value] && opt.textContent!==map[opt.value]) opt.textContent=map[opt.value]; });
    });
    var btn=byId('optionsToggleBtn'); if(btn){ var sp=btn.querySelector('span'); if(sp && sp.textContent!=='Options') sp.textContent='Options'; }
    if(typeof window.updateOptionsSummary === 'function'){
      /* allow original function to calculate values, then correct any Arabic words */
      setTimeout(function(){
        var sm=byId('optionsSummary'); if(!sm) return;
        var txt=sm.textContent || '';
        txt = txt.replace(/عربي|العربية/g,'AR').replace(/إنجليزي|الإنجليزية/g,'EN').replace(/إجابة/g,'Answer').replace(/تذكرة/g,'Ticket').replace(/مختصر/g,'Brief').replace(/مفصل/g,'Detailed').replace(/خطوات/g,'Step').replace(/مختلط/g,'Hybrid').replace(/المعرفة فقط/g,'SOP Only');
        if (sm.textContent !== txt) sm.textContent = txt;
      },0);
    }
  }
  function removeSavedOpenState(){
    try{ localStorage.removeItem('sugo_last_pane'); localStorage.removeItem('sugo_options_open'); localStorage.removeItem('sugo_nav_state_v2'); }catch(e){}
  }
  function closeAllMenus(){
    var nav=byId('sidebarNav'); if(nav) nav.classList.add('sugo-initial-closed');
    document.querySelectorAll('.nav-lroot-children,.nav-l0-children,.nav-l00-children').forEach(function(el){ el.classList.remove('open'); });
    document.querySelectorAll('.nav-lroot-chev,.nav-l0-chev,.nav-l00-chev').forEach(function(el){ el.classList.remove('open'); });
    document.querySelectorAll('.nav-lroot-btn,.nav-l0-btn,.nav-l00-btn,.nav-l000-btn').forEach(function(el){ el.classList.remove('active'); });
    var sidebar=byId('sidebar'); if(sidebar) sidebar.classList.remove('options-open');
    var opt=byId('optionsToggleBtn'); if(opt) opt.setAttribute('aria-expanded','false');
    document.querySelectorAll('.content-pane,.ai-answer-pane').forEach(function(p){ p.classList.remove('active'); });
    var welcome=byId('welcomeMsg'); if(welcome) welcome.style.display='flex';
  }
  function setupLibrarySwitch(){
    var librarySelect=byId('sugoLibrarySelect');
    var nav=byId('sidebarNav');
    var roots=[];
    function getRoots(){ return nav ? Array.prototype.slice.call(nav.querySelectorAll(':scope > .nav-lroot')) : []; }
    roots=getRoots();
    if(!librarySelect || !nav || !roots.length) return;

    function isSV(root){ return Boolean(root.querySelector('#rootSVTickets')) || /SUGO\s*SV|Tickets\s*&\s*Macros/i.test(root.textContent || ''); }
    function directChildren(parent, selector){ if(!parent) return []; return Array.prototype.filter.call(parent.children, function(child){ return child.matches && child.matches(selector); }); }
    function textOf(el){ var span=el ? el.querySelector('span') : null; return (span ? span.textContent : (el ? el.textContent : '')).replace(/\s+/g,' ').trim(); }
    function resetVisualState(){
      document.querySelectorAll('.nav-lroot-children,.nav-l0-children,.nav-l00-children').forEach(function(el){ el.classList.remove('open'); });
      document.querySelectorAll('.nav-lroot-chev,.nav-l0-chev,.nav-l00-chev').forEach(function(el){ el.classList.remove('open'); });
      document.querySelectorAll('.nav-lroot-btn,.nav-l0-btn,.nav-l00-btn,.nav-l000-btn').forEach(function(el){ el.classList.remove('active'); });
    }
    function clearSelect(select, placeholder){ select.innerHTML=''; var opt=document.createElement('option'); opt.value=''; opt.textContent=placeholder; select.appendChild(opt); select.value=''; select.disabled=true; }
    function fillSelect(select, items, placeholder, readLabel){ clearSelect(select, placeholder); items.forEach(function(item, index){ var opt=document.createElement('option'); opt.value=String(index); opt.textContent=readLabel(item); select.appendChild(opt); }); select.disabled=items.length===0; }
    function selectedItem(items, select){ var index=Number(select.value); return Number.isInteger(index) && index>=0 ? items[index] : null; }

    function ensureCascadeMenu(){
      var existing=byId('sugoCascadeMenu');
      if(existing) return existing;
      var wrapper=document.createElement('div');
      wrapper.id='sugoCascadeMenu';
      wrapper.className='sugo-cascade-menu';
      wrapper.innerHTML = [
        '<div class="sugo-cascade-field"><label class="sugo-cascade-label" for="sugoCascadeCategory">Category</label><div class="sugo-select-wrap"><select id="sugoCascadeCategory" class="sugo-dropdown-select sugo-cascade-select" title="Category"></select></div></div>',
        '<div class="sugo-cascade-field"><label class="sugo-cascade-label" for="sugoCascadeSection">Section</label><div class="sugo-select-wrap"><select id="sugoCascadeSection" class="sugo-dropdown-select sugo-cascade-select" title="Section"></select></div></div>',
        '<div class="sugo-cascade-field"><label class="sugo-cascade-label" for="sugoCascadeTopicSearch">Search in topics</label><input id="sugoCascadeTopicSearch" class="sugo-cascade-topic-filter" type="search" autocomplete="off" placeholder="Filter by Arabic / English keywords..."></div>',
        '<div class="sugo-cascade-field"><label class="sugo-cascade-label" for="sugoCascadeTopic">Topic</label><div class="sugo-select-wrap"><select id="sugoCascadeTopic" class="sugo-dropdown-select sugo-cascade-select" title="Topic"></select></div><div class="sugo-cascade-meta" id="sugoCascadeMeta"></div></div>'
      ].join('');
      var switcher=byId('sugoLibrarySwitch');
      if(switcher && switcher.parentNode){ switcher.parentNode.insertBefore(wrapper, switcher.nextSibling); }
      return wrapper;
    }

    var cascade=ensureCascadeMenu();
    var categorySelect=byId('sugoCascadeCategory');
    var sectionSelect=byId('sugoCascadeSection');
    var topicSelect=byId('sugoCascadeTopic');
    var topicFilter=byId('sugoCascadeTopicSearch');
    var meta=byId('sugoCascadeMeta');
    if(!categorySelect || !sectionSelect || !topicSelect || !topicFilter) return;

    var state={ root:null, categories:[], sections:[], topics:[], filteredTopics:[], restoring:false };
    window.SugoApp = window.SugoApp || {};
    window.SugoApp.navigation = window.SugoApp.navigation || {};

    function rootForValue(value){
      if(!roots.length) roots=getRoots();
      if(value==='sv') return roots.find(function(root){ return isSV(root); }) || null;
      if(value==='kb') return roots.find(function(root){ return !isSV(root) && !(root.dataset && root.dataset.sugoCustomRoot==='1'); }) || null;
      return roots.find(function(root){ return root && root.dataset && root.dataset.sugoRootKey === value; }) || null;
    }
    function rootValue(root){
      if(root && root.dataset && root.dataset.sugoCustomRoot==='1' && root.dataset.sugoRootKey) return root.dataset.sugoRootKey;
      return root && isSV(root) ? 'sv' : 'kb';
    }
    function showWelcomeOnly(){ if(typeof showOnlyWelcome === 'function') showOnlyWelcome(); else { document.querySelectorAll('.content-pane,.ai-answer-pane').forEach(function(p){ p.classList.remove('active'); }); var welcome=byId('welcomeMsg'); if(welcome) welcome.style.display='flex'; } }
    function updateBreadcrumb(labels){
      var bc=byId('sugoBreadcrumb'); if(!bc) return;
      labels = (labels || []).filter(Boolean);
      if(!labels.length){ bc.classList.remove('active'); bc.innerHTML=''; return; }
      bc.innerHTML = labels.map(function(label, i){ return '<span class="'+(i===labels.length-1?'sugo-breadcrumb-current':'')+'">'+escapeHtml(String(label))+'</span>'; }).join('');
      bc.classList.add('active');
    }
    function saveState(paneId){
      if(state.restoring) return;
      try{ localStorage.setItem('sugo_nav_state_v2', JSON.stringify({ library: librarySelect.value, category: categorySelect.value, section: sectionSelect.value, topic: topicSelect.value, filter: topicFilter.value || '', pane: paneId || '' })); }catch(e){}
    }
    function updateMeta(){ if(meta) meta.textContent = state.filteredTopics.length ? state.filteredTopics.length + ' topic(s)' : ''; }
    function topicLabel(btn){ return (btn ? btn.textContent : '').replace(/\s+/g,' ').trim(); }
    function fillTopics(){
      var filter=(topicFilter.value || '').toLowerCase().trim();
      state.filteredTopics = state.topics.filter(function(btn){ return !filter || topicLabel(btn).toLowerCase().includes(filter); });
      fillSelect(topicSelect, state.filteredTopics, state.topics.length ? 'Choose topic' : 'Choose section first', topicLabel);
      topicSelect.disabled = state.filteredTopics.length === 0;
      updateMeta();
    }

    function applyLibrary(opts){
      opts=opts||{};
      roots=getRoots();
      var root=rootForValue(librarySelect.value);
      state.root=root; state.categories=[]; state.sections=[]; state.topics=[]; state.filteredTopics=[];
      resetVisualState();
      nav.classList.toggle('sugo-cascade-mode', Boolean(root));
      cascade.classList.toggle('active', Boolean(root));
      roots.forEach(function(item){ item.classList.toggle('sugo-root-hidden', true); item.classList.toggle('sugo-cascade-active-root', item===root); });
      clearSelect(categorySelect, root ? 'Choose category' : 'Choose menu first');
      clearSelect(sectionSelect, 'Choose category first');
      clearSelect(topicSelect, 'Choose section first');
      topicFilter.value=''; topicFilter.disabled=!root; updateMeta();
      if(!root){ updateBreadcrumb([]); if(!opts.silent) showWelcomeOnly(); return; }
      var rootBtn=root.querySelector('.nav-lroot-btn'); if(rootBtn) rootBtn.classList.add('active');
      state.categories=directChildren(root.querySelector('.nav-lroot-children'), '.nav-l0');
      fillSelect(categorySelect, state.categories, 'Choose category', function(item){ return textOf(item.querySelector('.nav-l0-btn')); });
      updateBreadcrumb([librarySelect.options[librarySelect.selectedIndex]?.text || 'Menu']);
      if(!opts.silent) showWelcomeOnly();
      saveState();
    }
    function applyCategory(opts){
      opts=opts||{};
      resetVisualState(); state.sections=[]; state.topics=[]; state.filteredTopics=[];
      clearSelect(sectionSelect, 'Choose category first'); clearSelect(topicSelect, 'Choose section first'); topicFilter.value=''; topicFilter.disabled=true; updateMeta();
      var category=selectedItem(state.categories, categorySelect);
      if(!state.root){ return applyLibrary(opts); }
      var rootLabel=librarySelect.options[librarySelect.selectedIndex]?.text || 'Menu';
      var rootBtn=state.root.querySelector('.nav-lroot-btn'); if(rootBtn) rootBtn.classList.add('active');
      if(!category){ updateBreadcrumb([rootLabel]); if(!opts.silent) showWelcomeOnly(); saveState(); return; }
      var categoryBtn=category.querySelector('.nav-l0-btn'); if(categoryBtn) categoryBtn.classList.add('active');
      state.sections=directChildren(category.querySelector('.nav-l0-children'), '.nav-l00');
      fillSelect(sectionSelect, state.sections, 'Choose section', function(item){ return textOf(item.querySelector('.nav-l00-btn')); });
      updateBreadcrumb([rootLabel, textOf(categoryBtn)]);
      if(!opts.silent) showWelcomeOnly();
      saveState();
    }
    function applySection(opts){
      opts=opts||{};
      resetVisualState(); state.topics=[]; state.filteredTopics=[]; clearSelect(topicSelect, 'Choose section first'); topicFilter.value=''; topicFilter.disabled=true; updateMeta();
      var rootLabel=librarySelect.options[librarySelect.selectedIndex]?.text || 'Menu';
      var category=selectedItem(state.categories, categorySelect);
      var section=selectedItem(state.sections, sectionSelect);
      var rootBtn=state.root && state.root.querySelector('.nav-lroot-btn'); if(rootBtn) rootBtn.classList.add('active');
      var categoryBtn=category && category.querySelector('.nav-l0-btn'); if(categoryBtn) categoryBtn.classList.add('active');
      if(!section){ updateBreadcrumb([rootLabel, categoryBtn ? textOf(categoryBtn) : '']); if(!opts.silent) showWelcomeOnly(); saveState(); return; }
      var sectionBtn=section.querySelector('.nav-l00-btn'); if(sectionBtn) sectionBtn.classList.add('active');
      state.topics=directChildren(section.querySelector('.nav-l00-children'), '.nav-l000-btn');
      topicFilter.disabled=false;
      fillTopics();
      updateBreadcrumb([rootLabel, categoryBtn ? textOf(categoryBtn) : '', textOf(sectionBtn)]);
      if(!opts.silent) showWelcomeOnly();
      saveState();
    }
    function applyTopic(opts){
      opts=opts||{};
      var topic=selectedItem(state.filteredTopics, topicSelect);
      if(!topic){ if(!opts.silent) showWelcomeOnly(); saveState(); return; }
      resetVisualState();
      var rootLabel=librarySelect.options[librarySelect.selectedIndex]?.text || 'Menu';
      var category=selectedItem(state.categories, categorySelect);
      var section=selectedItem(state.sections, sectionSelect);
      var rootBtn=state.root && state.root.querySelector('.nav-lroot-btn'); if(rootBtn) rootBtn.classList.add('active');
      var categoryBtn=category && category.querySelector('.nav-l0-btn'); if(categoryBtn) categoryBtn.classList.add('active');
      var sectionBtn=section && section.querySelector('.nav-l00-btn'); if(sectionBtn) sectionBtn.classList.add('active');
      topic.classList.add('active');
      updateBreadcrumb([rootLabel, categoryBtn ? textOf(categoryBtn) : '', sectionBtn ? textOf(sectionBtn) : '', topicLabel(topic)]);
      var paneId=topic.getAttribute('data-pane');
      saveState(paneId);
      if(!opts.silent){ if(paneId && typeof showPane === 'function') showPane(paneId, true); else topic.click(); }
    }

    function findPathByPane(paneId){
      var safePaneId = String(paneId || '').replace(/\\/g,'\\\\').replace(/"/g,'\\"');
      var topic = nav.querySelector('.nav-l000-btn[data-pane="'+safePaneId+'"]');
      if(!topic) return null;
      var section=topic.closest('.nav-l00');
      var category=topic.closest('.nav-l0');
      var root=topic.closest('.nav-lroot');
      return { root:root, category:category, section:section, topic:topic };
    }
    function syncToPane(paneId, opts){
      opts=opts||{};
      var path=findPathByPane(paneId); if(!path) return;
      state.restoring=true;
      librarySelect.value=rootValue(path.root); applyLibrary({silent:true});
      categorySelect.value=String(state.categories.indexOf(path.category)); applyCategory({silent:true});
      sectionSelect.value=String(state.sections.indexOf(path.section)); applySection({silent:true});
      topicFilter.value=''; fillTopics();
      topicSelect.value=String(state.filteredTopics.indexOf(path.topic)); applyTopic({silent:true});
      state.restoring=false;
      if(opts.persist) saveState(paneId);
    }
    function clearBreadcrumb(){ updateBreadcrumb([]); }
    function resetMenu(opts){
      opts=opts||{};
      roots=getRoots();
      state.restoring = true;
      try{
        localStorage.removeItem('sugo_nav_state_v2');
        localStorage.removeItem('sugo_last_pane');
        localStorage.removeItem('sugo_options_open');
      }catch(e){}

      // Close every visual menu/group and clear any active topic.
      resetVisualState();
      if(nav){
        nav.classList.add('sugo-initial-closed');
        nav.classList.remove('sugo-cascade-mode');
      }
      roots.forEach(function(item){
        item.classList.add('sugo-root-hidden');
        item.classList.remove('sugo-cascade-active-root');
      });
      cascade.classList.remove('active');
      document.querySelectorAll('.nav-lroot-children,.nav-l0-children,.nav-l00-children').forEach(function(el){ el.classList.remove('open'); });
      document.querySelectorAll('.nav-lroot-chev,.nav-l0-chev,.nav-l00-chev').forEach(function(el){ el.classList.remove('open'); });
      document.querySelectorAll('.nav-lroot-btn,.nav-l0-btn,.nav-l00-btn,.nav-l000-btn').forEach(function(el){ el.classList.remove('active'); });

      // Return all dropdowns/filters to the initial closed state.
      librarySelect.value = '';
      state.root=null; state.categories=[]; state.sections=[]; state.topics=[]; state.filteredTopics=[];
      clearSelect(categorySelect, 'Choose menu first');
      clearSelect(sectionSelect, 'Choose category first');
      clearSelect(topicSelect, 'Choose section first');
      topicFilter.value='';
      topicFilter.disabled=true;
      updateMeta();

      document.querySelectorAll('.nav-l0,.nav-l00,.nav-l000-btn').forEach(function(el){ el.classList.remove('hidden-search'); });
      var nr=byId('noResults'); if(nr) nr.style.display='none';
      var searchInput=byId('searchInput'); if(searchInput) searchInput.value='';
      var bestMatch=byId('v51BestMatchPanel'); if(bestMatch){ bestMatch.innerHTML=''; bestMatch.style.display='none'; }
      var sidebar=byId('sidebar'); if(sidebar) sidebar.classList.remove('options-open');
      var opt=byId('optionsToggleBtn'); if(opt) opt.setAttribute('aria-expanded','false');
      try{ if(document.activeElement && document.activeElement.blur) document.activeElement.blur(); }catch(e){}

      updateBreadcrumb([]);
      showWelcomeOnly();
      state.restoring = false;

      if(!opts.silent){
        var resetBtn=byId('sugoCascadeReset');
        if(resetBtn){
          var old=resetBtn.textContent;
          resetBtn.textContent='✓ Reset';
          setTimeout(function(){ resetBtn.textContent=old || '↺ Reset'; }, 1000);
        }
      }
    }
    function restoreLast(){
      try{
        var raw=localStorage.getItem('sugo_nav_state_v2');
        var saved=raw ? JSON.parse(raw) : null;
        var pane=localStorage.getItem('sugo_last_pane') || (saved && saved.pane);
        if(pane && paneContent[pane]){ showPane(pane, false); return; }
        if(saved && saved.library){
          state.restoring=true;
          librarySelect.value=saved.library; applyLibrary({silent:true});
          if(saved.category){ categorySelect.value=saved.category; applyCategory({silent:true}); }
          if(saved.section){ sectionSelect.value=saved.section; applySection({silent:true}); }
          if(saved.filter){ topicFilter.value=saved.filter; fillTopics(); }
          if(saved.topic){ topicSelect.value=saved.topic; applyTopic({silent:true}); }
          state.restoring=false;
        }
      }catch(e){}
    }

    window.SugoApp.navigation.syncToPane=syncToPane;
    window.SugoApp.navigation.clearBreadcrumb=clearBreadcrumb;
    window.SugoApp.navigation.resetMenu=resetMenu;
    window.SugoApp.navigation.refreshMenuDom=function(opts){
      opts=opts||{};
      roots=getRoots();
      applyLibrary({silent:true});
      if(opts.paneId) syncToPane(opts.paneId, {persist:true});
    };
    window.resetSugoMenu=resetMenu;
    window.SugoApp.navigation.search=function(value){
      var q=String(value || '').trim().toLowerCase();
      var nr=byId('noResults');
      if(!q){ document.querySelectorAll('.nav-l0,.nav-l00,.nav-l000-btn').forEach(function(el){ el.classList.remove('hidden-search'); }); if(nr) nr.style.display='none'; return; }
      var topics=getAllTopics();
      var topicById={}; topics.forEach(function(t){ topicById[t.id]=t; });
      var any=false;
      document.querySelectorAll('.nav-l000-btn').forEach(function(btn){
        var paneId=btn.getAttribute('data-pane');
        var record=paneId ? topicById[paneId] : null;
        var hay=((btn.innerText || '')+'\n'+(record ? record.allText : '')).toLowerCase();
        var match=hay.indexOf(q)!==-1;
        btn.classList.toggle('hidden-search', !match);
        if(match) any=true;
      });
      document.querySelectorAll('.nav-l00').forEach(function(sec){ var vis=Array.prototype.some.call(sec.querySelectorAll('.nav-l000-btn'), function(b){ return !b.classList.contains('hidden-search'); }); sec.classList.toggle('hidden-search', !vis); });
      document.querySelectorAll('.nav-l0').forEach(function(sec){ var vis=Array.prototype.some.call(sec.querySelectorAll('.nav-l00'), function(s){ return !s.classList.contains('hidden-search'); }); sec.classList.toggle('hidden-search', !vis); });
      if(nr) nr.style.display = any ? 'none' : 'block';
    };

    if(librarySelect.dataset.cascadeBound!=='1'){
      librarySelect.addEventListener('change', function(){ applyLibrary(); });
      categorySelect.addEventListener('change', function(){ applyCategory(); });
      sectionSelect.addEventListener('change', function(){ applySection(); });
      topicSelect.addEventListener('change', function(){ applyTopic(); });
      var resetBtn=byId('sugoCascadeReset');
      if(resetBtn){ resetBtn.addEventListener('click', function(){ resetMenu(); }); }
      var sugoCascadeTopicFilterTimer = null;
      topicFilter.addEventListener('input', function(){
        clearTimeout(sugoCascadeTopicFilterTimer);
        sugoCascadeTopicFilterTimer = setTimeout(function(){ fillTopics(); saveState(); }, 140);
      });
      librarySelect.dataset.cascadeBound='1';
    }
    applyLibrary({silent:true});
    /* Startup must remain closed: do not restore saved left-menu path on fresh open. */
    try{ localStorage.removeItem('sugo_nav_state_v2'); localStorage.removeItem('sugo_last_pane'); }catch(e){}
  }

  function hideSplash(){
    var splash=byId('sugoOpeningSplash');
    if(!splash){ document.documentElement.classList.remove('sugo-booting'); return; }
    setTimeout(function(){
      splash.classList.add('sugo-hide');
      document.documentElement.classList.remove('sugo-booting');
    }, 700);
    setTimeout(function(){ try{splash.remove();}catch(e){} }, 1300);
  }
  var sugoInitialBootDone = false;
  function boot(){
    // Run the destructive startup reset only once. Re-running it after load was closing
    // options/dropdowns and clearing search while the user was already interacting.
    if(!sugoInitialBootDone){
      sugoInitialBootDone = true;
      removeSavedOpenState();
      closeAllMenus();
    }
    lockOptionsEnglish();
    setupLibrarySwitch();
    hideSplash();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('load', function(){ lockOptionsEnglish(); setupLibrarySwitch(); hideSplash(); });
  document.addEventListener('change', function(e){
    if(e.target && /^(languageSelect|outputTypeSelect|sopModeSelect|responseModeSelect|presetSelect)$/.test(e.target.id || '')){
      setTimeout(lockOptionsEnglish,0); setTimeout(lockOptionsEnglish,120);
    }
  }, true);
  document.addEventListener('click', function(e){ if(e.target.closest && e.target.closest('#optionsToggleBtn,.control-deck')) setTimeout(lockOptionsEnglish,0); }, true);
  try{
    var lockOptionsTimer = null;
    var obs = new MutationObserver(function(records){
      var relevant = records.some(function(record){
        var t = record.target;
        if(!t) return false;
        if(t.nodeType === 3) t = t.parentElement;
        if(!t || !t.closest) return false;
        return t.closest('#optionsSummary,#optionsToggleBtn,.control-deck,#languageSelect,#outputTypeSelect,#sopModeSelect,#responseModeSelect,#presetSelect');
      });
      if(!relevant) return;
      clearTimeout(lockOptionsTimer);
      lockOptionsTimer = setTimeout(lockOptionsEnglish, 80);
    });
    var root = document.getElementById('sidebar') || document.body;
    if(root) obs.observe(root,{subtree:true,childList:true,characterData:true});
  }catch(e){}
})();


// ===== SUGO v2 structured enhancement namespace =====
(function(){
  window.SugoApp = window.SugoApp || {};
  const App = window.SugoApp;

  App.state = App.state || { booted:false, aiBusy:false };
  App.performance = App.performance || {
    deferHeavyIdleWork: function(){
      const warmTopics = function(){ try{ getAllTopics(); }catch(e){} };
      if('requestIdleCallback' in window) requestIdleCallback(warmTopics, { timeout: 2500 });
      else setTimeout(warmTopics, 700);
    }
  };
  App.ai = App.ai || {
    setBusy: function(isBusy){
      App.state.aiBusy = !!isBusy;
      const stop = document.getElementById('aiStopBtn');
      if(stop) stop.hidden = !isBusy;
    },
    stop: function(){
      try{ if(typeof aiAbortController !== 'undefined' && aiAbortController) aiAbortController.abort(); }catch(e){}
      App.ai.setBusy(false);
      const target = window._aiContinuationTarget || document.getElementById('aiAnswerBody');
      if(target){
        target.querySelectorAll('.ai-cursor').forEach(el => el.remove());
        const note=document.createElement('div');
        note.className='sugo-ai-stopped-note';
        note.textContent='AI response stopped. You can edit the question or press Try again.';
        target.appendChild(note);
      }
    }
  };

  App.bindAI = function(){
    if(window.askAI && !window.askAI.__sugoWrapped){
      const originalAskAI = window.askAI;
      window.askAI = async function(){
        App.ai.setBusy(true);
        try { return await originalAskAI.apply(this, arguments); }
        finally { App.ai.setBusy(false); }
      };
      window.askAI.__sugoWrapped = true;
    }
  };

  App.init = function(){
    if(App.state.booted) return;
    App.state.booted = true;
    App.bindAI();
    App.performance.deferHeavyIdleWork();
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', App.init);
  else App.init();
})();


// ===== extracted from #sugo-startup-closed-menus-hotfix-js =====
(function(){
  var GROUPS = '.nav-lroot-children,.nav-l0-children,.nav-l00-children';
  var CHEVS = '.nav-lroot-chev,.nav-l0-chev,.nav-l00-chev';
  var BUTTONS = '.nav-lroot-btn,.nav-l0-btn,.nav-l00-btn,.nav-l000-btn';
  var manualUnlocked = true;
  // disabled: delayed startup collapse was closing options/search after user clicks.

  function byId(id){ return document.getElementById(id); }

  function removePersistedOpenState(){
    try{
      localStorage.removeItem('sugo_last_pane');
      localStorage.removeItem('sugo_nav_state_v2');
      localStorage.removeItem('sugo_options_open');
    }catch(e){}
  }

  function collapseLeftMenus(){
    if(manualUnlocked) return;
    removePersistedOpenState();

    var nav = byId('sidebarNav');
    if(nav){
      nav.classList.add('sugo-initial-closed');
      nav.classList.add('sugo-startup-closed');
      nav.classList.remove('sugo-cascade-mode');
    }

    document.querySelectorAll(GROUPS).forEach(function(el){
      el.classList.remove('open');
      el.style.display = 'none';
    });
    document.querySelectorAll(CHEVS).forEach(function(el){ el.classList.remove('open'); });
    document.querySelectorAll(BUTTONS).forEach(function(el){ el.classList.remove('active'); });

    var librarySelect = byId('sugoLibrarySelect');
    if(librarySelect) librarySelect.value = '';

    var cascade = byId('sugoCascadeMenu');
    if(cascade) cascade.classList.remove('active');

    ['sugoCascadeCategory','sugoCascadeSection','sugoCascadeTopic'].forEach(function(id){
      var sel = byId(id);
      if(sel){ sel.value = ''; sel.disabled = true; }
    });

    var topicFilter = byId('sugoCascadeTopicSearch');
    if(topicFilter){ topicFilter.value = ''; topicFilter.disabled = true; }

    document.querySelectorAll('.content-pane,.ai-answer-pane').forEach(function(pane){ pane.classList.remove('active'); });
    var welcome = byId('welcomeMsg');
    if(welcome) welcome.style.display = 'flex';

    var sidebar = byId('sidebar');
    if(sidebar) sidebar.classList.remove('options-open');
    var optionsBtn = byId('optionsToggleBtn');
    if(optionsBtn) optionsBtn.setAttribute('aria-expanded','false');
  }

  function unlockManualNavigation(event){
    if(!event.target || !event.target.closest || !event.target.closest('#sidebarNav')) return;
    manualUnlocked = true;
    var nav = byId('sidebarNav');
    if(nav) nav.classList.remove('sugo-startup-closed');
    document.querySelectorAll(GROUPS).forEach(function(el){ el.style.display = ''; });
    document.removeEventListener('pointerdown', unlockManualNavigation, true);
    document.removeEventListener('click', unlockManualNavigation, true);
    document.removeEventListener('keydown', unlockKeyboardNavigation, true);
  }

  function unlockKeyboardNavigation(event){
    if(event.key !== 'Enter' && event.key !== ' ') return;
    unlockManualNavigation(event);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', collapseLeftMenus);
  else collapseLeftMenus();

  window.addEventListener('load', function(){
    // Disabled delayed collapse: it was closing opened options and clearing search.
  });

  document.addEventListener('pointerdown', unlockManualNavigation, true);
  document.addEventListener('click', unlockManualNavigation, true);
  document.addEventListener('keydown', unlockKeyboardNavigation, true);
})();


// ===== SUGO SV — Clean refined macros from 1.txt and 2.txt =====
(function(){
  const svDeletePatterns = [/^sv-/, /^binding-ticket-optimized$/, /^reporting-ticket-optimized$/, /^banned-ticket-optimized$/, /^agency-ticket-optimized$/, /^games-ticket-optimized$/, /^tasks-ticket-optimized$/, /^withdrawal-coin-ticket-optimized$/, /^app-crash-ticket-optimized$/, /^change-country-ticket-optimized$/, /^location-ticket-optimized$/];
  Object.keys(paneContent).forEach(function(id){ if (svDeletePatterns.some(function(re){ return re.test(id); })) delete paneContent[id]; });
  sugoTopicsCache = null;
})();

/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */


/* SUGO stage2: pane content moved to external lazy file. */



// ===== SUGO SV — Quality 95+ polished macro overrides =====
(function(){
  sugoTopicsCache = null;
  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

})();

// ===== SUGO SV — Quality 96+ recharge and language polish overrides =====
(function(){
  sugoTopicsCache = null;
  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

})();

// ===== SUGO SV — Quality 97+ final country/link polish overrides =====
(function(){
  sugoTopicsCache = null;
  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

  
/* SUGO stage2: pane content moved to external lazy file. */

})();
// ===== SUGO Smart Keyword Search — Arabic / English Aliases =====
(function(){
  'use strict';

  var KEYWORD_GROUPS = [
    {name:'account', terms:['account','login','sign in','password','reset password','forgot password','binding','bind','unbind','phone','phone number','email','id','user id','ownership','verification','verify','security','recovery','حساب','الحساب','تسجيل','تسجيل دخول','دخول','كلمة السر','كلمة السر','كلمة مرور','باسورد','استرجاع','استعادة','ربط','فك الربط','رقم الهاتف','رقم','ايميل','البريد','الاي دي','الاى دى','ايدي','آي دي','ملكية','ملكيه','تحقق','توثيق','امان']},
    {name:'ban', terms:['ban','banned','unban','blocked','block','restriction','restricted','appeal','apology','violation','policy violation','حظر','الحظر','محظور','محظورة','فك الحظر','رفع الحظر','تقييد','مقيد','مقيدة','قيود','مخالفة','مخالفه','انتهاك','اعتذار','التماس']},
    {name:'sexual-ban', terms:['sexual','sex','nudity','nude','private part','adult','explicit','porn','sexual content','sexual offer','sexual commerce','جنسي','جنسية','محتوى جنسي','ايحاء','إيحاء','ايحاءات','إيحاءات','عضو جنسي','عروض جنسية','اتجار جنسي','كلام جنسي','صور جنسية','فيديو جنسي']},
    {name:'underage', terms:['underage','minor','below 18','under 18','age verification','national id','identity card','قاصر','تحت السن','تحت 18','السن القانوني','دون السن','هوية','بطاقة','بطاقه','اثبات السن']},
    {name:'smoking-weapon-drugs', terms:['smoking','smoke','weapon','gun','knife','drugs','narcotics','live violation','تدخين','سيجارة','سجائر','سلاح','اسلحة','أسلحة','مسدس','سكين','مخدرات','مواد مخدرة','لايف','بث مباشر']},
    {name:'vpn-device', terms:['vpn','simulator','emulator','abnormal device','device','phone type','model','same device','multiple accounts','outside region','في بي ان','vpn','محاكي','جهاز غير طبيعي','جهاز','نوع الهاتف','موديل','نفس الجهاز','حسابات كثيرة','خارج المنطقة','خارج الشرق الاوسط']},
    {name:'recharge', terms:['recharge','charge','top up','coins','coin','gold','payment','purchase','invoice','receipt','transaction','order','visa','card','itunes','google play','agent recharge','recharge agent','refund','failed recharge','did not receive coins','شحن','الشحن','اشحن','تشحن','إعادة الشحن','اعادة الشحن','كوين','كوينز','كوينات','ذهب','دفع','مدفوعات','شراء','فاتورة','ايصال','إيصال','رقم العملية','عملية','فيزا','كارت','بطاقة','ايتونز','جوجل','وكيل شحن','وكلاء الشحن','لم تصل الكوينات','ما وصلت الكوينات','فشل الشحن','استرداد']},
    {name:'withdrawal', terms:['withdraw','withdrawal','salary','cash out','cashout','diamonds','diamond','exchange','transfer','wallet','payoneer','vodafone cash','fawry','cancel withdrawal','fast withdrawal','سحب','السحب','راتب','الراتب','استلام الراتب','ما وصل الراتب','لم يصل الراتب','ماسات','ماسه','ماس','تحويل','استبدال','محفظة','محفظه','بايونير','فودافون كاش','فوري','الغاء السحب','إلغاء السحب','السحب السريع']},
    {name:'agency', terms:['agency','host','anchor','sub agency','main agency','agency transfer','agency change','create agency','recharge agency','agent','target','charm','moderator','وكالة','وكاله','وكالات','مضيفة','مضيفه','مذيعة','مذيعه','هوست','انكور','وكيل','وكيلة','وكيله','وكالة فرعية','وكاله فرعيه','وكالة رئيسية','وكاله رئيسيه','نقل وكالة','تغيير وكالة','إنشاء وكالة','انشاء وكالة','وكالة شحن','تارجت','جاذبية','جازبية']},
    {name:'reports', terms:['report','abuse','insult','harassment','complaint','evidence','screenshot','screen recording','video','chat','private chat','voice room','violator','reporter','بلاغ','ابلاغ','إبلاغ','اساءة','إساءة','إهانه','اهانة','شتيمة','شكوى','دليل','اثبات','سكرين','لقطة شاشة','لقطه شاشه','تسجيل شاشة','فيديو','محادثة','محادثه','غرفة صوتية','روم','المخالف','المبلغ']},
    {name:'games-tasks', terms:['game','games','cat game','add game','remove game','tasks','daily tasks','family tasks','matching','match','reward','لعبة','اللعبة','العاب','الألعاب','لعبه','لعب','لعبة القطة','لعبه القطه','اضافة لعبة','إضافة لعبة','إزالة لعبة','ازالة لعبة','مهام','المهام','مهام يومية','مهام عائلية','مطابقة','ماتش','مكافأة','مكافاه']},
    {name:'country-location', terms:['country','change country','location','gps','nearby','distance','region','hide distance','close location','بلد','الدولة','دولة','تغيير البلد','تغيير الدولة','موقع','لوكيشن','الموقع','gps','الاشخاص القريبين','الأشخاص القريبين','المسافة','المسافة','اخفاء المسافة','إخفاء المسافة','المنطقة','منطقة']},
    {name:'app-technical', terms:['app','crash','bug','freeze','not working','refresh','upload log','app log','technical issue','error message','screenshot','تطبيق','البرنامج','عطل','مشكلة تقنية','مشكله تقنيه','كراش','يعلق','تعليق','لا يعمل','مش شغال','تنشيط','رفع السجل','تحميل السجل','رسالة خطأ','رساله خطا']},
    {name:'vip', terms:['vip','svip','supporter','elite','elite club','vip4','vip 4','vip6','vip 6','داعمين','داعم','كبار الداعمين','نادي النخبة','نادى النخبه','النخبة','في اي بي','vip']},
    {name:'greeting', terms:['greeting','welcome','hello','hi','thanks','thank you','closing','follow up','مرحبا','مرحبًا','اهلا','أهلا','شكرا','شكرًا','تحية','ترحيب','خاتمة','متابعة','مساعدة أخرى']}
  ];

  var STOP_WORDS = new Set(['the','a','an','is','are','to','for','of','in','on','and','or','with','from','about','please','kindly','i','my','me','you','your','not','can','cant','cannot','لا','ما','مش','مو','في','من','على','علي','عن','الى','إلى','او','أو','و','يا','لو','اذا','إذ','هل','كيف','بدي','عايز','عاوز','اريد','ممكن','حضرتك','فندم','رجاء','برجاء','يرجى','ياريت','هذا','هذه','هو','هي']);

  function norm(value){
    return String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u064B-\u065F\u0670]/g,'')
      .replace(/[إأآا]/g,'ا')
      .replace(/ى/g,'ي')
      .replace(/ؤ/g,'و')
      .replace(/ئ/g,'ي')
      .replace(/ة/g,'ه')
      .replace(/گ/g,'ك')
      .replace(/ـ/g,'')
      .replace(/[^\u0600-\u06FF\p{L}\p{N}\s]/gu,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function splitTokens(value){
    return norm(value).split(' ').filter(function(t){ return t && t.length > 1 && !STOP_WORDS.has(t); });
  }

  function groupNormTerms(group){
    if(group._normTerms) return group._normTerms;
    group._normTerms = group.terms.map(norm).filter(Boolean);
    group._tokens = Array.from(new Set(group._normTerms.join(' ').split(' ').filter(Boolean)));
    return group._normTerms;
  }

  KEYWORD_GROUPS.forEach(groupNormTerms);

  function textMatchesGroup(normalizedText, group){
    var terms = groupNormTerms(group);
    return terms.some(function(term){ return term && normalizedText.indexOf(term) !== -1; });
  }

  function addGroupTerms(set, group){
    groupNormTerms(group).forEach(function(term){
      if(!term) return;
      set.add(term);
      term.split(' ').forEach(function(part){ if(part && part.length > 1) set.add(part); });
    });
  }

  function expandQueryTokens(query){
    var normalized = norm(query);
    var set = new Set(splitTokens(query));
    KEYWORD_GROUPS.forEach(function(group){
      var terms = groupNormTerms(group);
      var hit = terms.some(function(term){
        if(!term) return false;
        if(normalized.indexOf(term) !== -1) return true;
        return term.split(' ').some(function(part){ return part.length > 2 && normalized.split(' ').indexOf(part) !== -1; });
      });
      if(hit) addGroupTerms(set, group);
    });
    return Array.from(set).filter(function(t){ return t && t.length > 1 && !STOP_WORDS.has(t); });
  }

  var SUGO_EXPANDED_HAYSTACK_CACHE = new Map();
  function expandHaystack(text){
    var raw = String(text || '');
    var cacheKey = raw.length <= 16000 ? raw : raw.slice(0, 16000);
    if(SUGO_EXPANDED_HAYSTACK_CACHE.has(cacheKey)) return SUGO_EXPANDED_HAYSTACK_CACHE.get(cacheKey);
    var normalized = norm(cacheKey);
    var extras = new Set();
    KEYWORD_GROUPS.forEach(function(group){ if(textMatchesGroup(normalized, group)) addGroupTerms(extras, group); });
    var out = normalized + ' ' + Array.from(extras).join(' ');
    if(SUGO_EXPANDED_HAYSTACK_CACHE.size > 600) SUGO_EXPANDED_HAYSTACK_CACHE.clear();
    SUGO_EXPANDED_HAYSTACK_CACHE.set(cacheKey, out);
    return out;
  }

  function getPaneRecord(paneId){
    try{
      var topics = typeof getAllTopics === 'function' ? getAllTopics() : [];
      for(var i=0;i<topics.length;i++){ if(topics[i].id === paneId) return topics[i]; }
    }catch(e){}
    return null;
  }

  function ancestorText(btn){
    var parts = [];
    try{
      var root = btn.closest('.nav-lroot');
      var cat = btn.closest('.nav-l0');
      var sec = btn.closest('.nav-l00');
      [root, cat, sec].forEach(function(node){
        if(!node) return;
        var span = node.querySelector(':scope > button span');
        if(span) parts.push(span.textContent || '');
      });
    }catch(e){}
    return parts.join(' ');
  }

  function topicHaystack(btn){
    if(!btn) return '';
    if(btn.__sugoKeywordHaystack) return btn.__sugoKeywordHaystack;
    var paneId = btn.getAttribute('data-pane') || '';
    var record = getPaneRecord(paneId);
    var body = record && record.allText ? String(record.allText).slice(0, 4200) : '';
    btn.__sugoKeywordHaystack = [
      btn.textContent || '',
      paneId,
      ancestorText(btn),
      body
    ].join('\n');
    return btn.__sugoKeywordHaystack;
  }

  function smartScore(query, haystack){
    var nq = norm(query);
    if(!nq) return 0;
    var core = splitTokens(query);
    if(!core.length) return 0;
    var expandedHay = expandHaystack(haystack);
    var matchedCore = 0;
    core.forEach(function(t){ if(expandedHay.indexOf(t) !== -1) matchedCore++; });
    var needed = core.length <= 1 ? 1 : Math.ceil(core.length * 0.66);
    if(matchedCore < needed && expandedHay.indexOf(nq) === -1) return 0;
    var score = matchedCore * 6;
    if(expandedHay.indexOf(nq) !== -1) score += 16;
    expandQueryTokens(query).forEach(function(t){ if(expandedHay.indexOf(t) !== -1) score += 2; });
    return score;
  }

  function selectedLibraryRoot(){
    var select = document.getElementById('sugoLibrarySelect');
    var value = select ? select.value : '';
    if(value === 'sv') return document.getElementById('rootSVTickets') && document.getElementById('rootSVTickets').closest('.nav-lroot');
    if(value === 'kb') return document.getElementById('rootKB') && document.getElementById('rootKB').closest('.nav-lroot');
    return null;
  }

  function allTopicButtons(scope){
    var root = scope || selectedLibraryRoot() || document;
    return Array.prototype.slice.call(root.querySelectorAll('.nav-l000-btn[data-pane]'));
  }

  function smartSearchNavigation(value){
    var q = String(value || '').trim();
    var nr = document.getElementById('noResults');
    if(!q){
      document.querySelectorAll('.nav-l0,.nav-l00,.nav-l000-btn').forEach(function(el){ el.classList.remove('hidden-search'); });
      if(nr) nr.style.display='none';
      return;
    }
    var any = false;
    document.querySelectorAll('.nav-l000-btn[data-pane]').forEach(function(btn){
      var score = smartScore(q, topicHaystack(btn));
      var match = score > 0;
      btn.classList.toggle('hidden-search', !match);
      if(match) any = true;
    });
    document.querySelectorAll('.nav-l00').forEach(function(sec){
      var vis = Array.prototype.some.call(sec.querySelectorAll('.nav-l000-btn[data-pane]'), function(b){ return !b.classList.contains('hidden-search'); });
      sec.classList.toggle('hidden-search', !vis);
    });
    document.querySelectorAll('.nav-l0').forEach(function(cat){
      var vis = Array.prototype.some.call(cat.querySelectorAll('.nav-l00'), function(s){ return !s.classList.contains('hidden-search'); });
      cat.classList.toggle('hidden-search', !vis);
    });
    if(nr) nr.style.display = any ? 'none' : 'block';
  }

  function topicTitle(btn){ return (btn && (btn.textContent || '').trim()) || 'Untitled topic'; }
  function topicSection(btn){
    var parts = [];
    try{
      var cat = btn.closest('.nav-l0');
      var sec = btn.closest('.nav-l00');
      [cat, sec].forEach(function(node){
        var span = node && node.querySelector(':scope > button span');
        if(span) parts.push((span.textContent || '').trim());
      });
    }catch(e){}
    return parts.filter(Boolean).join(' › ');
  }

  function renderSmartBestMatch(query){
    var panel = document.getElementById('v51BestMatchPanel');
    if(!panel) return;
    var q = String(query || '').trim();
    if(!q){ panel.style.display='none'; panel.innerHTML=''; return; }
    var ranked = allTopicButtons(document).map(function(btn){ return {btn:btn, score:smartScore(q, topicHaystack(btn))}; })
      .filter(function(item){ return item.score > 0; })
      .sort(function(a,b){ return b.score - a.score; });
    if(!ranked.length){ panel.style.display='none'; panel.innerHTML=''; return; }
    var best = ranked[0];
    var confidence = best.score >= 28 ? 'High' : (best.score >= 14 ? 'Medium' : 'Low');
    var paneId = best.btn.getAttribute('data-pane') || '';
    panel.style.display = 'block';
    panel.innerHTML = '<div class="v51-best-card sugo-keyword-best-match">'
      + '<div class="v51-best-top"><span class="v51-best-badge">Keyword Match</span><span class="v51-best-score">' + confidence + '</span></div>'
      + '<div class="v51-best-title">' + escapeHtml(topicTitle(best.btn)) + '</div>'
      + '<div class="v51-best-section">' + escapeHtml(topicSection(best.btn)) + '</div>'
      + '<div class="v51-best-actions">'
      + '<button type="button" class="v51-mini-btn" data-sugo-keyword-open="' + escapeHtml(paneId) + '">Open SOP</button>'
      + '<button type="button" class="v51-mini-btn" data-sugo-keyword-ask="' + escapeHtml(topicTitle(best.btn)) + '" data-sugo-keyword-pane="' + escapeHtml(paneId) + '">Ask AI</button>'
      + '</div></div>';
  }

  function escapeHtml(value){
    return String(value || '').replace(/[&<>"']/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]; });
  }

  function directChildren(parent, selector){
    if(!parent) return [];
    return Array.prototype.filter.call(parent.children, function(child){ return child.matches && child.matches(selector); });
  }
  function selectedByIndex(items, select){
    var idx = Number(select && select.value);
    return Number.isFinite(idx) && idx >= 0 ? items[idx] : null;
  }

  function currentCascadeTopics(){
    var library = document.getElementById('sugoLibrarySelect');
    var category = document.getElementById('sugoCascadeCategory');
    var section = document.getElementById('sugoCascadeSection');
    if(!library || !category || !section) return [];
    var root = selectedLibraryRoot();
    if(!root) return [];
    var categories = directChildren(root.querySelector('.nav-lroot-children'), '.nav-l0');
    var cat = selectedByIndex(categories, category);
    var sections = directChildren(cat && cat.querySelector('.nav-l0-children'), '.nav-l00');
    var sec = selectedByIndex(sections, section);
    return directChildren(sec && sec.querySelector('.nav-l00-children'), '.nav-l000-btn');
  }

  function applySmartTopicFilter(){
    var input = document.getElementById('sugoCascadeTopicSearch');
    var select = document.getElementById('sugoCascadeTopic');
    var meta = document.getElementById('sugoCascadeMeta');
    if(!input || !select) return;
    var q = String(input.value || '').trim();
    if(!q) return;
    var topics = currentCascadeTopics();
    var ranked = topics.map(function(btn, index){ return {btn:btn, index:index, score:smartScore(q, topicHaystack(btn))}; })
      .filter(function(item){ return item.score > 0; })
      .sort(function(a,b){ return b.score - a.score; });
    select.innerHTML = '';
    if(!ranked.length){
      var empty = document.createElement('option');
      empty.value = '';
      empty.textContent = 'No matching topic';
      select.appendChild(empty);
      select.disabled = true;
      if(meta) meta.textContent = '0 topic(s)';
      return;
    }
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Choose topic';
    select.appendChild(placeholder);
    ranked.forEach(function(item, idx){
      var opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = topicTitle(item.btn);
      opt.setAttribute('data-smart-pane', item.btn.getAttribute('data-pane') || '');
      opt.setAttribute('data-smart-title', topicTitle(item.btn));
      select.appendChild(opt);
    });
    select.disabled = false;
    if(meta) meta.textContent = ranked.length + ' topic(s)';
  }

  function install(){
    try{
      var topInput = document.getElementById('searchInput');
      if(topInput) topInput.setAttribute('placeholder','Search Arabic / English keywords...');
      var topicInput = document.getElementById('sugoCascadeTopicSearch');
      if(topicInput) topicInput.setAttribute('placeholder','Filter by Arabic / English keywords...');
    }catch(e){}

    if(window.SugoApp && window.SugoApp.navigation){
      window.SugoApp.navigation.search = smartSearchNavigation;
    }

    var previousDoSearch = window.doSearch;
    if(typeof previousDoSearch === 'function' && !previousDoSearch._sugoKeywordWrapped){
      var wrapped = function(q){
        var result = previousDoSearch.apply(this, arguments);
        try{ smartSearchNavigation(q); }catch(e){}
        setTimeout(function(){ renderSmartBestMatch(q); }, 0);
        return result;
      };
      wrapped._sugoKeywordWrapped = true;
      window.doSearch = wrapped;
    }

    document.addEventListener('input', function(e){
      if(e.target && e.target.id === 'searchInput'){
        return;
      }
      if(e.target && e.target.id === 'sugoCascadeTopicSearch'){
        clearTimeout(window.__sugoTopicSmartFilterTimer); window.__sugoTopicSmartFilterTimer = setTimeout(applySmartTopicFilter, 140);
      }
    }, true);

    document.addEventListener('change', function(e){
      if(e.target && e.target.id === 'sugoCascadeTopic'){
        var opt = e.target.options[e.target.selectedIndex];
        var pane = opt && opt.getAttribute('data-smart-pane');
        if(pane){
          e.preventDefault();
          e.stopImmediatePropagation();
          if(typeof showPane === 'function') showPane(pane, true);
          if(window.SugoApp && SugoApp.navigation && typeof SugoApp.navigation.syncToPane === 'function'){
            try{ SugoApp.navigation.syncToPane(pane, {persist:true}); }catch(err){}
          }
        }
      }
    }, true);

    document.addEventListener('click', function(e){
      var open = e.target.closest && e.target.closest('[data-sugo-keyword-open]');
      if(open){
        e.preventDefault();
        var paneId = open.getAttribute('data-sugo-keyword-open');
        if(paneId && typeof showPane === 'function') showPane(paneId, true);
        return;
      }
      var ask = e.target.closest && e.target.closest('[data-sugo-keyword-ask]');
      if(ask){
        e.preventDefault();
        var q = ask.getAttribute('data-sugo-keyword-ask') || '';
        var pane = ask.getAttribute('data-sugo-keyword-pane') || '';
        if(pane){ window.SUGO_EXACT_AI_PANE = pane; window.SUGO_ACTIVE_PANE = pane; window.SUGO_ACTIVE_PANE_TS = Date.now(); }
        var input = document.getElementById('searchInput');
        if(input) input.value = q;
        if(typeof askAI === 'function') askAI(q);
      }
    }, true);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();

  window.SUGO_KEYWORD_SEARCH = {
    version: '1.0.0',
    groups: KEYWORD_GROUPS,
    norm: norm,
    smartScore: smartScore,
    expandQueryTokens: expandQueryTokens
  };
})();


// ===== extracted from #sugo-favorites-recent-js =====
(function(){
  'use strict';
  var FAV_KEY = 'sugo_favorite_panes_v1';
  var RECENT_KEY = 'sugo_recent_panes_v1';
  var MAX_RECENT = 10;
  var MAX_FAV_DISPLAY = 16;
  var originalShowPane = null;
  var wrapping = false;

  function safeParse(value, fallback){
    try { var parsed = JSON.parse(value || ''); return Array.isArray(parsed) ? parsed : fallback; }
    catch(e){ return fallback; }
  }
  function readList(key){ return safeParse(localStorage.getItem(key), []); }
  function writeList(key, list){ try { localStorage.setItem(key, JSON.stringify(list || [])); } catch(e){} }
  function uniquePaneList(list){
    var seen = Object.create(null);
    return (list || []).filter(function(id){
      id = String(id || '').trim();
      if(!id || seen[id] || !(typeof paneContent !== 'undefined' && paneContent[id])) return false;
      seen[id] = true;
      return true;
    });
  }
  function getNavButton(paneId){ return document.querySelector('.nav-l000-btn[data-pane="' + CSS.escape(paneId) + '"]'); }
  function getPaneTitle(paneId){
    var btn = getNavButton(paneId);
    if(btn && btn.textContent.trim()) return btn.textContent.trim();
    try {
      if(typeof getAllTopics === 'function'){
        var t = getAllTopics().find(function(item){ return item.id === paneId; });
        if(t && (t.title || t.label)) return String(t.title || t.label).trim();
      }
    } catch(e){}
    return paneId.replace(/^sv-refined-|^sv-clean-|^sv-/, '').replace(/-/g, ' ').replace(/\b\w/g, function(c){return c.toUpperCase();});
  }
  function getPanePath(paneId){
    var btn = getNavButton(paneId);
    if(!btn) return 'SUGO SOP';
    var parts = [];
    var l00 = btn.closest('.nav-l00');
    var l0 = btn.closest('.nav-l0');
    var root = btn.closest('.nav-lroot');
    var n0 = root && root.querySelector(':scope > .nav-lroot-btn > span');
    var n1 = l0 && l0.querySelector(':scope > .nav-l0-btn span');
    var n2 = l00 && l00.querySelector(':scope > .nav-l00-btn span');
    [n0,n1,n2].forEach(function(el){ if(el && el.textContent.trim()) parts.push(el.textContent.trim()); });
    return parts.filter(Boolean).join(' › ') || 'SUGO SOP';
  }
  function escapeHtml(value){ return String(value || '').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]; }); }
  function isFavorite(paneId){ return readList(FAV_KEY).indexOf(paneId) >= 0; }
  function setFavorite(paneId, enabled){
    var list = uniquePaneList(readList(FAV_KEY));
    var idx = list.indexOf(paneId);
    if(enabled && idx < 0) list.unshift(paneId);
    if(!enabled && idx >= 0) list.splice(idx, 1);
    writeList(FAV_KEY, list);
    refreshLists();
    updatePaneFavoriteBar(paneId);
  }
  function toggleFavorite(paneId){ setFavorite(paneId, !isFavorite(paneId)); }
  function recordRecent(paneId){
    if(!paneId || !(typeof paneContent !== 'undefined' && paneContent[paneId])) return;
    var list = uniquePaneList(readList(RECENT_KEY)).filter(function(id){ return id !== paneId; });
    list.unshift(paneId);
    writeList(RECENT_KEY, list.slice(0, MAX_RECENT));
    refreshLists();
  }
  function makeItem(paneId, kind){
    var title = getPaneTitle(paneId);
    var path = getPanePath(paneId);
    var removable = kind === 'favorite';
    return '<button type="button" class="sugo-fr-item" data-sugo-fr-open="' + escapeHtml(paneId) + '">' +
      '<span class="sugo-fr-icon sugo-fr-icon-' + escapeHtml(kind) + '">' + (kind === 'favorite' ? 'F' : 'R') + '</span>' +
      '<span class="sugo-fr-main"><span class="sugo-fr-name">' + escapeHtml(title) + '</span><span class="sugo-fr-path">' + escapeHtml(path) + '</span></span>' +
      (removable ? '<span class="sugo-fr-remove" role="button" tabindex="0" data-sugo-fr-remove="' + escapeHtml(paneId) + '" title="Remove favorite">×</span>' : '<span></span>') +
      '</button>';
  }
  function refreshLists(){
    var favBox = document.getElementById('sugoFavoritesList');
    var recentBox = document.getElementById('sugoRecentList');
    if(!favBox || !recentBox) return;
    var favs = uniquePaneList(readList(FAV_KEY)).slice(0, MAX_FAV_DISPLAY);
    var recents = uniquePaneList(readList(RECENT_KEY)).slice(0, MAX_RECENT);
    favBox.innerHTML = favs.length ? favs.map(function(id){ return makeItem(id, 'favorite'); }).join('') : '<div class="sugo-fr-empty">No favorites yet. Open any macro and press Add Favorite.</div>';
    recentBox.innerHTML = recents.length ? recents.map(function(id){ return makeItem(id, 'recent'); }).join('') : '<div class="sugo-fr-empty">Recently opened macros will appear here.</div>';
  }
  function updatePaneFavoriteBar(paneId){
    var pane = document.getElementById('pane-' + paneId);
    if(!pane) return;
    var card = pane.querySelector('.doc-card');
    if(!card) return;
    var bar = card.querySelector(':scope > .sugo-fr-cardbar');
    if(!bar){
      bar = document.createElement('div');
      bar.className = 'sugo-fr-cardbar';
      bar.setAttribute('data-pane-id', paneId);
      card.insertBefore(bar, card.firstChild);
    }
    var active = isFavorite(paneId);
    bar.innerHTML = '<div class="sugo-fr-cardmeta"><div class="sugo-fr-cardtitle">' + escapeHtml(getPaneTitle(paneId)) + '</div><div class="sugo-fr-cardpath">' + escapeHtml(getPanePath(paneId)) + '</div></div>' +
      '<button type="button" class="sugo-fr-favbtn' + (active ? ' active' : '') + '" data-sugo-fav-toggle="' + escapeHtml(paneId) + '"><span class="sugo-fr-badge">' + (active ? '★' : '☆') + '</span>' + (active ? 'Favorited' : 'Add Favorite') + '</button>';
  }
  function wrapShowPane(){
    if(wrapping) return;
    var fn = window.showPane;
    if(typeof fn !== 'function') return;
    if(fn.__sugoFavoritesWrapped) return;
    wrapping = true;
    originalShowPane = fn;
    window.showPane = function(paneId, save){
      var result = originalShowPane.apply(this, arguments);
      try { recordRecent(paneId); updatePaneFavoriteBar(paneId); } catch(e){}
      return result;
    };
    window.showPane.__sugoFavoritesWrapped = true;
    try { showPane = window.showPane; } catch(e){}
    wrapping = false;
  }
  function installClickHandlers(){
    document.addEventListener('click', function(event){
      var remove = event.target.closest && event.target.closest('[data-sugo-fr-remove]');
      if(remove){
        event.preventDefault(); event.stopPropagation();
        setFavorite(remove.getAttribute('data-sugo-fr-remove'), false);
        return;
      }
      var fav = event.target.closest && event.target.closest('[data-sugo-fav-toggle]');
      if(fav){
        event.preventDefault(); event.stopPropagation();
        toggleFavorite(fav.getAttribute('data-sugo-fav-toggle'));
        return;
      }
      var open = event.target.closest && event.target.closest('[data-sugo-fr-open]');
      if(open){
        event.preventDefault(); event.stopPropagation();
        var paneId = open.getAttribute('data-sugo-fr-open');
        if(paneId && typeof window.showPane === 'function') window.showPane(paneId, true);
        return;
      }
      var clear = event.target.closest && event.target.closest('#sugoClearRecentBtn');
      if(clear){
        event.preventDefault(); event.stopPropagation();
        writeList(RECENT_KEY, []);
        refreshLists();
      }
    }, true);
  }
  function refreshActiveBar(){
    var active = document.querySelector('.content-pane.active');
    if(active && active.id && active.id.indexOf('pane-') === 0) updatePaneFavoriteBar(active.id.replace(/^pane-/, ''));
  }
  function boot(){
    if(!document.getElementById('sugoFavRecentPanel')) return;
    wrapShowPane();
    installClickHandlers();
    refreshLists();
    refreshActiveBar();
    setTimeout(refreshLists, 250);
    setTimeout(refreshActiveBar, 300);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('load', function(){ wrapShowPane(); refreshLists(); refreshActiveBar(); });
  window.SUGOFavoritesRecent = { refresh: refreshLists, recordRecent: recordRecent, toggleFavorite: toggleFavorite };
})();


// ===== extracted from #sugo-ai-ticket-favorites-and-quick-access-js =====
(function(){
  'use strict';
  var AI_FAV_KEY = 'sugo_favorite_ai_tickets_v1';
  var MAX_AI_FAV = 12;
  var observerStarted = false;

  function byId(id){ return document.getElementById(id); }
  function esc(v){ return String(v || '').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]; }); }
  function parseList(){ try{ var v = JSON.parse(localStorage.getItem(AI_FAV_KEY) || '[]'); return Array.isArray(v) ? v : []; }catch(e){ return []; } }
  function saveList(list){ try{ localStorage.setItem(AI_FAV_KEY, JSON.stringify((list || []).slice(0, MAX_AI_FAV))); }catch(e){} }
  function plainFromHtml(html){ var d = document.createElement('div'); d.innerHTML = html || ''; return (d.innerText || d.textContent || '').trim(); }
  function hash(str){ var h = 2166136261; str = String(str || ''); for(var i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24); } return (h >>> 0).toString(36); }
  function compactTitle(q){ q = String(q || '').replace(/\s+/g,' ').trim(); return q ? (q.length > 58 ? q.slice(0,58) + '…' : q) : 'Generated Ticket'; }
  function isTicketView(){ var b = byId('aiBadgeLabel'); return !!(b && /ticket/i.test(b.textContent || '')); }
  function currentTicketPayload(){
    var body = byId('aiAnswerBody');
    if(!body || !isTicketView()) return null;
    if(body.querySelector('.ai-answer-loading,.ai-spinner,.ai-cursor')) return null;
    var text = (typeof window.sugoHtmlToPlainText === 'function') ? window.sugoHtmlToPlainText(body) : (body.innerText || '');
    text = String(text || '').trim();
    if(text.length < 20 || /AI could not generate|Searching the knowledge/i.test(text)) return null;
    var query = (byId('aiAnswerQuery') && byId('aiAnswerQuery').textContent || '').trim();
    var html = body.innerHTML;
    var id = 'ai-ticket-' + hash(query + '\n' + text.slice(0,900));
    return { id:id, title:compactTitle(query), query:query, html:html, text:text, ts:Date.now() };
  }
  function isAiFavorite(id){ return parseList().some(function(item){ return item && item.id === id; }); }
  function setAiFavorite(payload, enabled){
    if(!payload || !payload.id) return;
    var list = parseList().filter(function(item){ return item && item.id !== payload.id; });
    if(enabled) list.unshift(payload);
    saveList(list);
    ensureAiFavoriteBar();
    refreshAll();
  }
  function ensureAiFavoriteBar(){
    var card = document.querySelector('.ai-answer-card');
    var header = document.querySelector('.ai-answer-header');
    if(!card || !header) return;
    var old = card.querySelector(':scope > .sugo-ai-favbar');
    var payload = currentTicketPayload();
    if(!payload){ if(old) old.remove(); return; }
    var active = isAiFavorite(payload.id);
    if(!old){
      old = document.createElement('div');
      old.className = 'sugo-ai-favbar';
      header.insertAdjacentElement('afterend', old);
    }
    old.setAttribute('data-ai-ticket-id', payload.id);
    old.innerHTML = '<div class="sugo-ai-favmeta"><div class="sugo-ai-favtitle">Generated Ticket</div><div class="sugo-ai-favpath">' + esc(payload.title) + '</div></div>' +
      '<button type="button" class="sugo-ai-favbtn' + (active ? ' active' : '') + '" data-sugo-ai-fav-current="1"><span>' + (active ? '★' : '☆') + '</span>' + (active ? 'Favorited' : 'Add Favorite') + '</button>';
  }
  function makeAiItem(item){
    return '<button type="button" class="sugo-fr-item sugo-fr-ai-item" data-sugo-ai-fav-open="' + esc(item.id) + '">' +
      '<span class="sugo-fr-icon sugo-fr-icon-ai">AI</span>' +
      '<span class="sugo-fr-main"><span class="sugo-fr-name">' + esc(item.title || 'Generated Ticket') + '</span><span class="sugo-fr-path">AI Generated Ticket</span></span>' +
      '<span class="sugo-fr-remove" role="button" tabindex="0" data-sugo-ai-fav-remove="' + esc(item.id) + '" title="Remove favorite">×</span>' +
      '</button>';
  }
  function renderAiFavorites(){
    var box = byId('sugoFavoritesList');
    if(!box) return;
    box.querySelectorAll('.sugo-fr-ai-label,.sugo-fr-ai-item').forEach(function(el){ el.remove(); });
    var list = parseList();
    if(!list.length){ updateCounts(); return; }
    var empty = box.querySelector('.sugo-fr-empty');
    if(empty && /No favorites/i.test(empty.textContent || '')) empty.remove();
    var wrap = document.createElement('div');
    wrap.innerHTML = '<div class="sugo-fr-ai-label">Generated Tickets</div>' + list.map(makeAiItem).join('');
    Array.from(wrap.children).reverse().forEach(function(node){ box.insertBefore(node, box.firstChild); });
    updateCounts();
  }
  function openAiFavorite(id){
    var item = parseList().find(function(x){ return x && x.id === id; });
    if(!item) return;
    if(typeof window.clearAllContentAndWelcome === 'function') window.clearAllContentAndWelcome();
    var welcome = byId('welcomeMsg'); if(welcome) welcome.style.display = 'none';
    var pane = byId('aiAnswerPane'); if(pane) pane.classList.add('active');
    var badge = byId('aiBadgeLabel'); if(badge) badge.textContent = '✦ Saved Ticket';
    var query = byId('aiAnswerQuery'); if(query) query.textContent = item.query || item.title || 'Saved ticket';
    var body = byId('aiAnswerBody'); if(body){ body.innerHTML = item.html || esc(item.text || ''); body.setAttribute('dir', /[\u0600-\u06FF]/.test(item.text || '') ? 'rtl' : 'ltr'); }
    var sources = byId('aiSources'); if(sources){ sources.classList.remove('has-items'); sources.innerHTML = ''; }
    var follow = byId('aiFollowupRow'); if(follow) follow.classList.remove('active');
    setTimeout(ensureAiFavoriteBar, 30);
  }
  function removeAiFavorite(id){
    saveList(parseList().filter(function(x){ return x && x.id !== id; }));
    ensureAiFavoriteBar();
    refreshAll();
  }
  function setActiveTab(tab, shouldOpen){
    tab = tab === 'recent' ? 'recent' : 'favorites';
    var panel = byId('sugoFavRecentPanel');
    document.querySelectorAll('[data-sugo-fr-tab]').forEach(function(btn){
      var active = btn.getAttribute('data-sugo-fr-tab') === tab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      btn.setAttribute('aria-expanded', (panel && panel.classList.contains('is-open') && active) ? 'true' : 'false');
    });
    document.querySelectorAll('[data-sugo-fr-section]').forEach(function(sec){
      sec.classList.toggle('active', sec.getAttribute('data-sugo-fr-section') === tab);
    });
    if(panel){
      if(shouldOpen === true) panel.classList.add('is-open');
      if(shouldOpen === false) panel.classList.remove('is-open');
      document.querySelectorAll('[data-sugo-fr-tab]').forEach(function(btn){
        var active = btn.getAttribute('data-sugo-fr-tab') === tab;
        btn.setAttribute('aria-expanded', (panel.classList.contains('is-open') && active) ? 'true' : 'false');
      });
    }
    try{ localStorage.setItem('sugo_quick_access_tab_v1', tab); }catch(e){}
  }
  function closeQuickAccess(){
    var panel = byId('sugoFavRecentPanel');
    if(!panel) return;
    panel.classList.remove('is-open');
    document.querySelectorAll('[data-sugo-fr-tab]').forEach(function(btn){ btn.setAttribute('aria-expanded', 'false'); });
  }
  function updateCounts(){
    var favBox = byId('sugoFavoritesList'), recentBox = byId('sugoRecentList');
    var favCount = parseList().length;
    if(favBox) favCount += favBox.querySelectorAll('.sugo-fr-item:not(.sugo-fr-ai-item)').length;
    var recentCount = recentBox ? recentBox.querySelectorAll('.sugo-fr-item').length : 0;
    var f = byId('sugoFavCount'); if(f) f.textContent = favCount;
    var r = byId('sugoRecentCount'); if(r) r.textContent = recentCount;
  }
  function refreshAll(){
    if(window.SUGOFavoritesRecent && typeof window.SUGOFavoritesRecent.refresh === 'function' && !window.SUGOFavoritesRecent.__aiPatchRunning){
      window.SUGOFavoritesRecent.__aiPatchRunning = true;
      try{ window.SUGOFavoritesRecent.refresh(); }catch(e){}
      window.SUGOFavoritesRecent.__aiPatchRunning = false;
    }
    renderAiFavorites();
    updateCounts();
  }
  function patchFavoritesRefresh(){
    if(!window.SUGOFavoritesRecent || typeof window.SUGOFavoritesRecent.refresh !== 'function' || window.SUGOFavoritesRecent.__aiTicketPatch) return;
    var original = window.SUGOFavoritesRecent.refresh;
    window.SUGOFavoritesRecent.refresh = function(){
      var result = original.apply(this, arguments);
      setTimeout(function(){ renderAiFavorites(); updateCounts(); }, 0);
      return result;
    };
    window.SUGOFavoritesRecent.__aiTicketPatch = true;
  }
  function installEvents(){
    document.addEventListener('click', function(event){
      var tab = event.target.closest && event.target.closest('[data-sugo-fr-tab]');
      if(tab){
        event.preventDefault();
        var panel = byId('sugoFavRecentPanel');
        var isSame = tab.classList.contains('active');
        var isOpen = !!(panel && panel.classList.contains('is-open'));
        if(isSame && isOpen){ closeQuickAccess(); return; }
        setActiveTab(tab.getAttribute('data-sugo-fr-tab'), true);
        return;
      }
      var cur = event.target.closest && event.target.closest('[data-sugo-ai-fav-current]');
      if(cur){ var payload = currentTicketPayload(); if(payload) setAiFavorite(payload, !isAiFavorite(payload.id)); return; }
      var rem = event.target.closest && event.target.closest('[data-sugo-ai-fav-remove]');
      if(rem){ event.preventDefault(); event.stopPropagation(); removeAiFavorite(rem.getAttribute('data-sugo-ai-fav-remove')); return; }
      var open = event.target.closest && event.target.closest('[data-sugo-ai-fav-open]');
      if(open){ event.preventDefault(); event.stopPropagation(); openAiFavorite(open.getAttribute('data-sugo-ai-fav-open')); return; }
    }, true);
    document.addEventListener('click', function(event){
      var panel = byId('sugoFavRecentPanel');
      if(panel && panel.classList.contains('is-open') && !event.target.closest('#sugoFavRecentPanel')) closeQuickAccess();
    });
  }
  function observeAiAnswer(){
    if(observerStarted) return;
    var body = byId('aiAnswerBody');
    var pane = byId('aiAnswerPane');
    if(!body || !pane) return;
    var mo = new MutationObserver(function(){ setTimeout(ensureAiFavoriteBar, 70); });
    mo.observe(body, { childList:true, subtree:true, characterData:true });
    var mo2 = new MutationObserver(function(){ setTimeout(ensureAiFavoriteBar, 70); });
    mo2.observe(pane, { attributes:true, attributeFilter:['class'] });
    observerStarted = true;
  }
  function boot(){
    patchFavoritesRefresh();
    installEvents();
    observeAiAnswer();
    var savedTab = 'favorites'; try{ savedTab = localStorage.getItem('sugo_quick_access_tab_v1') || 'favorites'; }catch(e){}
    setActiveTab(savedTab, false);
    setTimeout(refreshAll, 100);
    setTimeout(function(){ patchFavoritesRefresh(); refreshAll(); ensureAiFavoriteBar(); }, 500);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('load', function(){ patchFavoritesRefresh(); refreshAll(); observeAiAnswer(); ensureAiFavoriteBar(); });
})();


// ===== extracted from #sugo-search-performance-hotfix =====
(function(){
  'use strict';
  var mainSearchTimer = null;
  var lastValue = '';
  var waitMs = 170;

  function runSearch(value){
    if(typeof window.doSearch === 'function'){
      window.doSearch(value);
    }
  }

  window.sugoFastSearchInput = function(el){
    if(!el) return;
    try{
      if(typeof window.autoResizeSearch === 'function') window.autoResizeSearch(el);
      else { el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,160)+'px'; }
    }catch(e){}
    var value = String(el.value || '');
    lastValue = value;
    clearTimeout(mainSearchTimer);
    var trimmed = value.trim();
    mainSearchTimer = setTimeout(function(){
      // Only run the latest requested search. This prevents the UI from freezing while typing quickly.
      runSearch(lastValue);
    }, trimmed ? waitMs : 20);
  };

  window.SUGO_SEARCH_PERFORMANCE = {
    version: '1.1.0',
    debounceMs: waitMs,
    note: 'Main search is debounced and redundant live listeners are disabled.'
  };
})();


// ===== extracted from #sugo-precision-search-v4 =====
(function(){
  'use strict';

  var PRECISION_VERSION = '4.0.0';
  var topicCache = null;

  function norm(value){
    return String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[إأآٱا]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/گ/g, 'ك')
      .replace(/پ/g, 'ب')
      .replace(/چ/g, 'ج')
      .replace(/ڤ/g, 'ف')
      .replace(/ـ/g, '')
      .replace(/\bpass\s*word\b/g, 'password')
      .replace(/\bsign\s*in\b/g, 'login')
      .replace(/\blog\s*in\b/g, 'login')
      .replace(/\bphone\s*number\b/g, 'phone')
      .replace(/\bmobile\s*number\b/g, 'phone')
      .replace(/\buser\s*id\b/g, 'id')
      .replace(/\baccount\s*id\b/g, 'id')
      .replace(/\bsub\s*agency\b/g, 'subagency')
      .replace(/\bmain\s*agency\b/g, 'mainagency')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function stripArabicArticle(token){
    token = String(token || '');
    if(token.length > 4 && token.indexOf('ال') === 0) return token.slice(2);
    return token;
  }

  var STOP = new Set(('the is a an to of and or for in on how what do does did i my it this that with can are be please explain whole process from you need customer client issue problem case help me' +
    ' من في على عن هل كيف ما ماذا الى إلى او أو مع هذا هذه لو اذا إذا بدي اريد أريد شو ليش العميل المستخدم مشكله مشكلة موضوع حاله حالة بسبب عند عندي انا انت هو هي').split(/\s+/).filter(Boolean));

  var GROUPS = {
    password: ['password','pass','باسورد','باسوورد','كلمة السر','كلمه مرور','كلمة السر','كلمة مرور','نسيت الباسورد','استرجاع كلمة السر','reset password','password reset','recovery','recover'],
    login: ['login','sign in','signin','تسجيل دخول','دخول','لا يدخل','ما بيفتح','account login','login issue'],
    phone: ['phone','mobile','number','رقم','هاتف','موبايل','رقم الهاتف','ربط رقم','تغيير رقم','linked phone','binding phone','bind phone','unbind phone'],
    sms: ['sms','otp','code','verification code','رساله تحقق','رسالة تحقق','كود','رمز','رمز التحقق','كود التحقق','ما وصلني الكود'],
    binding: ['binding','bind','linked','unlink','ربط','فك ربط','تغيير الربط','ربط الحساب','phone binding'],
    ban: ['ban','banned','blocked','restriction','restricted','suspended','حظر','محظور','باند','موقوف','ايقاف','إيقاف','تقييد'],
    unban: ['unban','appeal','review ban','restore account','فك حظر','رفع الحظر','الغاء الحظر','إلغاء الحظر','استئناف','مراجعه الحظر','مراجعة الحظر'],
    report: ['report','abuse','complaint','violator','evidence','بلاغ','ابلاغ','شكوى','اساءه','إساءة','مخالف','دليل','سكرين','لقطه','لقطة','فيديو'],
    sexual: ['sexual','sex','porn','nudity','nude','explicit','جنسي','جنسية','إباحي','اباحي','عري','تعري','ايحاء','إيحاء'],
    recharge: ['recharge','topup','charge','payment','pay','coins','coin','purchase','order','transaction','invoice','receipt','شحن','دفع','كوين','كوينز','عملات','فاتوره','فاتورة','ايصال','إيصال','شراء','عملية','عمليه'],
    refund: ['refund','استرداد','ارجاع مبلغ','رجع الفلوس','reversal','rejected payment'],
    withdrawal: ['withdraw','withdrawal','cashout','salary','payout','diamonds','exchange','سحب','راتب','تحويل','استبدال','ماسات','الماس','مستحقات'],
    agency: ['agency','agent','agm','bcm','subagency','mainagency','وكاله','وكالة','وكيل','وكيلة','وكاله فرعيه','وكالة فرعية','وكاله رئيسيه','وكالة رئيسية'],
    host: ['host','anchor','hostess','مضيف','مضيفه','مذيع','مذيعه','مذيعة','انضمام مضيفه','join agency'],
    vip: ['vip','svip','charm','level','في اي بي','الجاذبيه','الجاذبية','شارم','مستوى'],
    game: ['game','games','لعبه','لعبة','العاب','ألعاب','روم العاب','room game','pk'],
    location: ['location','gps','nearby','distance','country','region','موقع','دوله','دولة','بلد','منطقه','منطقة','مسافه','مسافة','قريب'],
    country: ['change country','country change','تغيير الدوله','تغيير الدولة','تغيير بلد','الدوله الحاليه','الدولة الحالية'],
    gender: ['gender','sex change','تغيير الجنس','جنس الحساب','ذكر','انثى','أنثى'],
    room: ['room','live','broadcast','لايف','بث','غرفه','غرفة','روم'],
    message: ['message','messages','chat','dm','inbox','رساله','رسالة','رسائل','شات','دردشه','دردشة','خاص'],
    moment: ['moment','moments','post','feed','لحظات','منشور','بوست'],
    task: ['task','tasks','daily task','family task','مهمه','مهمة','مهام','يوميه','يومية','عائله','عائلة'],
    crash: ['crash','bug','freeze','not working','technical','كراش','تعطل','يعلق','لا يعمل','مشكله تقنيه','مشكلة تقنية'],
    family: ['family','families','عائلة','عائله','فاميلي'],
    gift: ['gift','gifts','send gift','receive gift','هدية','هديه','هدايا']
  };

  var GROUP_WEIGHTS = {
    password: 26, login: 20, phone: 24, sms: 24, binding: 24,
    ban: 28, unban: 36, report: 28, sexual: 32,
    recharge: 30, refund: 26, withdrawal: 30,
    agency: 24, host: 22, vip: 18, game: 20,
    location: 18, country: 24, gender: 18, room: 15,
    message: 18, moment: 18, task: 18, crash: 20,
    family: 14, gift: 12
  };

  function phraseVariants(value){
    var n = norm(value);
    if(!n) return [];
    var out = new Set([n]);
    out.add(stripArabicArticle(n));
    n.split(/\s+/).forEach(function(t){ if(t) out.add(stripArabicArticle(t)); });
    return Array.from(out).filter(Boolean);
  }

  function groupTerms(group){
    return (GROUPS[group] || []).flatMap(phraseVariants);
  }

  function tokenList(value, keepStop){
    var n = norm(value);
    if(!n) return [];
    var arr = n.split(/\s+/).map(stripArabicArticle).filter(function(t){ return t && t.length > 1; });
    if(!keepStop) arr = arr.filter(function(t){ return !STOP.has(t); });
    return Array.from(new Set(arr));
  }

  function hasPhrase(hay, phrase){
    phrase = norm(phrase);
    if(!phrase) return false;
    if(phrase.length <= 3) return (' ' + hay + ' ').indexOf(' ' + phrase + ' ') >= 0;
    return hay.indexOf(phrase) >= 0;
  }

  function matchedGroups(query){
    var q = norm(query);
    var padded = ' ' + q + ' ';
    var groups = [];
    Object.keys(GROUPS).forEach(function(g){
      var ok = groupTerms(g).some(function(term){
        if(!term) return false;
        return term.length <= 3 ? padded.indexOf(' ' + term + ' ') >= 0 : q.indexOf(term) >= 0;
      });
      if(ok) groups.push(g);
    });
    return groups;
  }

  function expandQuery(query){
    var original = tokenList(query, false);
    var groups = matchedGroups(query);
    var expanded = new Set(original);
    groups.forEach(function(g){ groupTerms(g).forEach(function(term){ tokenList(term, true).forEach(function(t){ if(!STOP.has(t)) expanded.add(t); }); expanded.add(g); }); });
    return { raw: norm(query), original: original, expanded: Array.from(expanded), groups: groups };
  }

  function navTextFor(node, selector){
    try{
      var el = node && node.querySelector(':scope > ' + selector + ' span');
      return el ? (el.textContent || '').trim() : '';
    }catch(e){ return ''; }
  }

  function getButtonMeta(paneId){
    var btn = null;
    try{ btn = document.querySelector('.nav-l000-btn[data-pane="' + CSS.escape(paneId) + '"]'); }catch(e){
      btn = Array.prototype.find.call(document.querySelectorAll('.nav-l000-btn[data-pane]'), function(b){ return b.getAttribute('data-pane') === paneId; });
    }
    if(!btn) return { title: paneId.replace(/-/g, ' '), category: '', section: '', library: '', path: '' };
    var l00 = btn.closest('.nav-l00');
    var l0 = btn.closest('.nav-l0');
    var root = btn.closest('.nav-lroot');
    var library = navTextFor(root, '.nav-lroot-btn');
    var category = navTextFor(l0, '.nav-l0-btn');
    var section = navTextFor(l00, '.nav-l00-btn');
    var title = (btn.textContent || '').trim() || paneId.replace(/-/g, ' ');
    var path = [library, category, section].filter(Boolean).join(' › ');
    return { title: title, category: category, section: section, library: library, path: path };
  }

  function htmlToText(html){
    var tmp = document.createElement('div');
    tmp.innerHTML = String(html || '');
    return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
  }

  function extractLangText(contentMap){
    var html = contentMap && (contentMap.en || contentMap.html || '');
    var tmp = document.createElement('div');
    tmp.innerHTML = String(html || '');
    var dividers = tmp.querySelectorAll('.lang-divider');
    var enText = '', arText = '';
    if(dividers.length >= 1 && dividers[0].nextElementSibling) enText = (dividers[0].nextElementSibling.textContent || '').trim();
    if(dividers.length >= 2 && dividers[1].nextElementSibling) arText = (dividers[1].nextElementSibling.textContent || '').trim();
    if(!enText && !arText) enText = htmlToText(html);
    return { enText: enText, arText: arText };
  }

  function inferTagsFromText(meta, enText, arText){
    var text = norm([meta.title, meta.category, meta.section, meta.path, enText, arText].join(' '));
    var tags = [];
    Object.keys(GROUPS).forEach(function(g){
      if(groupTerms(g).some(function(term){ return hasPhrase(text, term); })) tags.push(g);
    });
    return tags.slice(0, 10);
  }

  function getAllTopicsPrecision(){
    if(topicCache) return topicCache;
    var source = (typeof sugoGetSearchTopicsSync === 'function') ? sugoGetSearchTopicsSync() : [];
    var topics = (source || []).map(function(t){
      var meta = {
        title: t.title || t.label || String(t.id || '').replace(/-/g, ' '),
        category: t.category || '',
        section: t.section || '',
        library: t.library || '',
        path: t.path || ''
      };
      var enText = t.enText || '';
      var arText = t.arText || '';
      var combined = [t.id, meta.title, meta.category, meta.section, meta.path, enText, arText].join('\n');
      return {
        id: t.id,
        title: meta.title,
        label: meta.title || String(t.id || '').replace(/-/g,' '),
        category: meta.category,
        section: meta.section,
        library: meta.library,
        path: meta.path,
        enText: enText,
        arText: arText,
        allText: t.allText || t.bodyNorm || t.searchText || norm(combined),
        titleNorm: t.titleNorm || norm([String(t.id || '').replace(/-/g,' '), meta.title].join(' ')),
        pathNorm: t.pathNorm || norm([meta.library, meta.category, meta.section].join(' ')),
        bodyNorm: t.bodyNorm || norm([enText, arText].join(' ')),
        tags: t.tags || inferTagsFromText(meta, enText, arText)
      };
    });
    topicCache = topics;
    return topicCache;
  }

  function coverage(queryOriginal, topic){
    if(!queryOriginal.length) return 0;
    var hay = [topic.titleNorm, topic.pathNorm, topic.bodyNorm].join(' ');
    var hit = 0;
    queryOriginal.forEach(function(t){ if(hasPhrase(hay, t)) hit++; });
    return hit / queryOriginal.length;
  }

  function categoryPenalty(qGroups, topic, primaryTopicIds, wantsUnban){
    var id = String(topic.id || '').toLowerCase();
    var text = topic.allText || '';
    var penalty = 0;
    function topicHasAny(groups){ return groups.some(function(g){ return (topic.tags || []).indexOf(g) >= 0 || groupTerms(g).some(function(term){ return hasPhrase(text, term); }); }); }
    if(qGroups.indexOf('password') >= 0 && !topicHasAny(['password','login','phone','sms','binding'])) penalty += 18;
    if(qGroups.indexOf('recharge') >= 0 && !topicHasAny(['recharge','refund'])) penalty += 16;
    if(qGroups.indexOf('withdrawal') >= 0 && !topicHasAny(['withdrawal'])) penalty += 16;
    if(qGroups.indexOf('agency') >= 0 && !topicHasAny(['agency','host'])) penalty += 10;
    if(qGroups.indexOf('ban') >= 0 && !wantsUnban && /unban|appeal|request-unban|rejected-unban|refund/.test(id) && primaryTopicIds.indexOf(id) < 0) penalty += 32;
    if(qGroups.indexOf('unban') < 0 && /unban|appeal|request-unban|rejected-unban/.test(id) && primaryTopicIds.indexOf(id) < 0 && qGroups.indexOf('ban') >= 0) penalty += 24;
    if(/overview|general|placeholder|alternative|optimized/.test(id) && primaryTopicIds.indexOf(id) < 0) penalty += 8;
    return penalty;
  }

  function existingRoutes(query){
    try{
      if(typeof detectSugoAccuracyRoutes === 'function') return detectSugoAccuracyRoutes(query) || [];
    }catch(e){}
    return [];
  }

  function scoreTopic(topic, queryInfo, options, routes, selectedPaneId){
    var score = 0;
    var hits = [];
    var reasons = [];
    var id = String(topic.id || '');
    var q = queryInfo.raw;
    var words = queryInfo.expanded;
    var original = queryInfo.original;
    var groups = queryInfo.groups;
    var title = topic.titleNorm || '';
    var path = topic.pathNorm || '';
    var body = topic.bodyNorm || '';
    var hay = [title, path, body].join(' ');
    var selected = selectedPaneId && id === selectedPaneId;
    var primary = false;
    var preferTicket = !!(options && (options.preferTicketTopics || options.outputType === 'ticket' || options.smartTicket));
    var primaryTopicIds = [];
    routes.forEach(function(route, idx){
      var ids = [].concat(route.ticketTopicIds || [], route.topicIds || [], route.topicIdsFromRule || []);
      ids.forEach(function(x){ if(primaryTopicIds.indexOf(x) < 0) primaryTopicIds.push(x); });
      var ticketHit = (route.ticketTopicIds || []).indexOf(id) >= 0;
      var topicHit = (route.topicIds || []).indexOf(id) >= 0;
      if(ticketHit || topicHit){
        primary = idx === 0 || primary;
        var base = idx === 0 ? 170 : 90;
        score += ticketHit ? base + (preferTicket ? 75 : 25) : base;
        hits.push(route.name || 'route');
        reasons.push('exact-route');
      }
    });

    if(selected){ score += 220; hits.push('selected-option'); reasons.push('selected'); }
    if(preferTicket){
      if(id.indexOf('sv-tickets-') === 0) score += 24;
      else if(id.indexOf('sv-clean-') === 0 || id.indexOf('sv-refined-') === 0) score += 8;
      else if(/optimized/.test(id)) score -= 10;
    }

    if(q && q.length >= 4){
      if(hasPhrase(title, q)){ score += 72; hits.push(q); reasons.push('title-phrase'); }
      else if(hasPhrase(path, q)){ score += 42; hits.push(q); reasons.push('path-phrase'); }
      else if(hasPhrase(body, q)){ score += 18; hits.push(q); reasons.push('body-phrase'); }
    }

    groups.forEach(function(g){
      var gHitTitle = groupTerms(g).some(function(term){ return hasPhrase(title, term); });
      var gHitPath = groupTerms(g).some(function(term){ return hasPhrase(path, term); });
      var gHitBody = groupTerms(g).some(function(term){ return hasPhrase(body, term); });
      if(gHitTitle || gHitPath || gHitBody){
        var add = GROUP_WEIGHTS[g] || 16;
        if(gHitTitle) add += 12;
        if(gHitPath) add += 7;
        if(gHitBody) add += 2;
        score += add;
        hits.push(g);
        reasons.push('intent-' + g);
      }
    });

    words.forEach(function(w){
      if(!w || w.length < 2 || STOP.has(w)) return;
      if(hasPhrase(title, w)){ score += 16; hits.push(w); }
      else if(title.indexOf(w) >= 0){ score += 10; hits.push(w); }
      if(hasPhrase(path, w)){ score += 8; hits.push(w); }
      else if(path.indexOf(w) >= 0){ score += 5; hits.push(w); }
      if(hasPhrase(body, w)){ score += 2.4; hits.push(w); }
      else if(w.length >= 4 && body.indexOf(w) >= 0){ score += 1.1; hits.push(w); }
      if(w.length >= 5){
        var stem = w.replace(/(ات|ين|ون|ه|ها|هم|ing|ed|s)$/,'');
        if(stem.length >= 4 && hay.indexOf(stem) >= 0) score += 0.8;
      }
    });

    original.forEach(function(w){
      if(hasPhrase(title, w)) score += 5;
      else if(hasPhrase(path, w)) score += 2.5;
    });

    var cov = coverage(original, topic);
    if(cov >= 0.8) score += 12;
    else if(cov >= 0.55) score += 7;
    else if(original.length >= 3 && cov < 0.34 && !primary && !selected) score -= 10;

    var wantsUnban = groups.indexOf('unban') >= 0;
    score -= categoryPenalty(groups, topic, primaryTopicIds, wantsUnban);
    score = Math.max(0, score);

    return Object.assign({}, topic, {
      score: score,
      hits: Array.from(new Set(hits)).slice(0, 14),
      reasons: Array.from(new Set(reasons)).slice(0, 10),
      coverage: Math.round(cov * 100) / 100,
      primary: primary,
      selected: !!selected
    });
  }

  function precisionRank(query, options){
    options = options || {};
    var topics = getAllTopicsPrecision();
    var info = expandQuery(query);
    var selectedPaneId = String(options.preferredPaneId || '').trim();
    var routes = existingRoutes(query);
    var ranked = topics.map(function(t){ return scoreTopic(t, info, options, routes, selectedPaneId); })
      .filter(function(t){ return t.score > 0; })
      .sort(function(a,b){
        if(b.score !== a.score) return b.score - a.score;
        if(a.primary !== b.primary) return a.primary ? -1 : 1;
        if(a.selected !== b.selected) return a.selected ? -1 : 1;
        if((a.title || '').length !== (b.title || '').length) return (a.title || '').length - (b.title || '').length;
        return String(a.id).localeCompare(String(b.id));
      });
    return { info: info, routes: routes, ranked: ranked };
  }

  function confidenceFor(ranked, info, selectedPaneId, primaryRoute){
    var best = ranked[0] || null;
    var second = ranked[1] || null;
    if(!best) return { confidence:'low', label:'Low', score:0, gap:0, ambiguous:false, reason:'no-match' };
    var score = best.score || 0;
    var gap = second ? score - (second.score || 0) : score;
    var ambiguous = !!(second && gap <= Math.max(8, score * 0.12) && score >= 28 && !selectedPaneId && !primaryRoute);
    var confidence = 'low';
    if(selectedPaneId || best.primary || primaryRoute) confidence = ambiguous ? 'medium' : 'high';
    else if(score >= 58 && best.coverage >= 0.45 && !ambiguous) confidence = 'high';
    else if(score >= 24 && best.coverage >= 0.25) confidence = ambiguous ? 'low' : 'medium';
    else if(score >= 15 && info.groups.length) confidence = 'medium';
    var label = confidence === 'high' ? 'High' : confidence === 'medium' ? 'Medium' : 'Low';
    return { confidence:confidence, label:label, score:Math.round(score*10)/10, gap:Math.round(gap*10)/10, ambiguous:ambiguous, reason:ambiguous?'close-results':'' };
  }

  function clip(text, limit){
    if(typeof smartTruncate === 'function') return smartTruncate(text || '', limit);
    text = String(text || '');
    return text.length > limit ? text.slice(0, limit).replace(/\s+\S*$/, '') + ' …' : text;
  }

  function getRelevantKnowledgeBaseTextPrecision(query, maxTopics, maxCharsPerTopic, preferredPaneId, options){
    maxTopics = maxTopics || 8;
    maxCharsPerTopic = maxCharsPerTopic || 1400;
    options = options || {};
    options.preferredPaneId = preferredPaneId || options.preferredPaneId || null;
    var rank = precisionRank(query, options);
    var routes = rank.routes || [];
    var primaryRoute = routes[0] || null;
    var primaryIds = [];
    if(primaryRoute){
      primaryIds = Array.from(new Set([].concat(primaryRoute.ticketTopicIds || [], primaryRoute.topicIds || [])));
    }
    var top = rank.ranked.slice(0, maxTopics);
    // Force exact route topics into the packet even if a broader article has a higher lexical score.
    if(primaryIds.length){
      var forced = primaryIds.map(function(id){ return rank.ranked.find(function(t){ return t.id === id; }); }).filter(Boolean);
      forced.forEach(function(t){ t.primary = true; if(t.hits.indexOf('primary-route') < 0) t.hits.unshift('primary-route'); });
      top = forced.concat(top.filter(function(t){ return !forced.some(function(f){ return f.id === t.id; }); })).slice(0, maxTopics);
    }
    var conf = confidenceFor(top, rank.info, options.preferredPaneId, primaryRoute);
    top = top.map(function(t){ return Object.assign({}, t, { confidence: conf.confidence }); });
    var auditRows = top.slice(0, 5).map(function(t, i){
      return (i+1) + '. ' + t.id + ' | title: ' + (t.title || t.label || '') + ' | score: ' + (Math.round((t.score||0)*10)/10) + ' | path: ' + (t.path || '') + ' | hits: ' + (t.hits || []).slice(0,8).join(', ');
    }).join('\n');
    var routeLine = primaryRoute ? ('Primary route: ' + primaryRoute.name + '\nPrimary topic IDs: ' + primaryIds.join(', ') + '\nRouting instruction: use Primary route topics first; do not replace them with broad overview/unban/generic articles unless the user explicitly asks for that broader topic.') : 'Primary route: none';
    var ambiguityLine = conf.ambiguous ? '\nAmbiguity warning: top results are close; answer cautiously and ask for clarification if the exact case is not explicit.' : '';
    var text = routeLine + ambiguityLine + '\nQuery intents: ' + (rank.info.groups.join(', ') || 'none') + '\nMatch audit:\n' + (auditRows || 'No local match') + '\n\n' + top.map(function(t, index){
      var isPriority = t.primary || t.selected || index === 0;
      var enLimit = isPriority ? Math.max(maxCharsPerTopic, 6600) : maxCharsPerTopic;
      var arLimit = isPriority ? Math.max(Math.floor(maxCharsPerTopic * 0.92), 5800) : Math.floor(maxCharsPerTopic * 0.85);
      var tags = t.tags && t.tags.length ? '\nTags: ' + t.tags.join(', ') : '';
      var meta = [
        '### Topic: ' + t.id,
        'Title: ' + (t.title || t.label || t.id),
        'Path: ' + (t.path || ''),
        'Match score: ' + (Math.round((t.score||0)*10)/10),
        'Coverage: ' + t.coverage,
        t.primary ? 'Primary route match: yes' : 'Primary route match: no',
        t.selected ? 'Selected by user: yes' : 'Selected by user: no',
        tags ? tags.trim() : ''
      ].filter(Boolean).join('\n');
      return meta + '\nEnglish SOP:\n' + clip(t.enText || '', enLimit) + '\n\nArabic SOP:\n' + clip(t.arText || '', arLimit);
    }).join('\n\n');
    return {
      text: text,
      topicIds: top.map(function(t){ return t.id; }),
      topics: top,
      bestTopic: top[0] || null,
      primaryRoute: primaryRoute,
      primaryTopicIds: primaryIds,
      confidence: conf.confidence,
      confidenceLabel: conf.label,
      confidenceScore: conf.score,
      confidenceGap: conf.gap,
      ambiguous: conf.ambiguous,
      queryIntents: rank.info.groups,
      hasMeaningfulMatch: top.length > 0 && (conf.score >= 12 || !!primaryRoute || !!options.preferredPaneId)
    };
  }

  function showPrecisionNavigation(query){
    var q = String(query || '').trim();
    var nr = document.getElementById('noResults');
    if(!q){
      document.querySelectorAll('.nav-l0,.nav-l00,.nav-l000-btn').forEach(function(el){ el.classList.remove('hidden-search'); });
      if(nr) nr.style.display = 'none';
      return;
    }
    var ranked = precisionRank(q, {}).ranked;
    var ids = new Set(ranked.filter(function(t){ return t.score >= 12; }).slice(0, 60).map(function(t){ return t.id; }));
    if(!ids.size){
      ids = new Set(ranked.slice(0, 20).map(function(t){ return t.id; }));
    }
    var any = false;
    document.querySelectorAll('.nav-l000-btn[data-pane]').forEach(function(btn){
      var id = btn.getAttribute('data-pane');
      var match = ids.has(id);
      btn.classList.toggle('hidden-search', !match);
      if(match) any = true;
    });
    document.querySelectorAll('.nav-l00').forEach(function(sec){
      var vis = Array.prototype.some.call(sec.querySelectorAll('.nav-l000-btn[data-pane]'), function(b){ return !b.classList.contains('hidden-search'); });
      sec.classList.toggle('hidden-search', !vis);
      var child = sec.querySelector(':scope > .nav-l00-children');
      var chev = sec.querySelector(':scope > .nav-l00-btn .nav-l00-chev');
      if(vis){ if(child) child.classList.add('open'); if(chev) chev.classList.add('open'); }
    });
    document.querySelectorAll('.nav-l0').forEach(function(cat){
      var vis = Array.prototype.some.call(cat.querySelectorAll('.nav-l00'), function(s){ return !s.classList.contains('hidden-search'); });
      cat.classList.toggle('hidden-search', !vis);
      var child = cat.querySelector(':scope > .nav-l0-children');
      var chev = cat.querySelector(':scope > .nav-l0-btn .nav-l0-chev');
      if(vis){ if(child) child.classList.add('open'); if(chev) chev.classList.add('open'); }
    });
    document.querySelectorAll('.nav-lroot').forEach(function(root){
      var vis = Array.prototype.some.call(root.querySelectorAll('.nav-l000-btn[data-pane]'), function(b){ return !b.classList.contains('hidden-search'); });
      var child = root.querySelector(':scope > .nav-lroot-children');
      var chev = root.querySelector(':scope > .nav-lroot-btn .nav-lroot-chev');
      if(vis){ if(child) child.classList.add('open'); if(chev) chev.classList.add('open'); }
    });
    if(nr) nr.style.display = any ? 'none' : 'block';
  }

  function esc(value){
    if(typeof escapeHtml === 'function') return escapeHtml(value);
    return String(value || '').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
  }

  function renderPrecisionBest(query){
    var panel = document.getElementById('v51BestMatchPanel');
    if(!panel) return;
    var q = String(query || '').trim();
    if(!q){ panel.style.display = 'none'; panel.innerHTML = ''; return; }
    var kb = getRelevantKnowledgeBaseTextPrecision(q, 4, 900, null, { outputType: (typeof getOutputType === 'function' ? getOutputType() : 'answer') });
    if(!kb.topicIds.length){ panel.style.display='none'; panel.innerHTML=''; return; }
    var cls = kb.confidence === 'high' ? 'ai-source-high' : kb.confidence === 'medium' ? 'ai-source-medium' : 'ai-source-low';
    var rows = (kb.topics || []).slice(0,3).map(function(t, i){
      return '<div style="padding:8px 0;border-top:' + (i ? '1px solid rgba(148,163,184,.18)' : '0') + '">' +
        '<div class="v51-best-title" style="margin-bottom:2px;">' + esc((i+1) + '. ' + (t.title || t.label || t.id)) + '</div>' +
        '<div class="v51-best-section">' + esc((t.path || t.section || '') + ' · score ' + (Math.round((t.score||0)*10)/10) + (t.hits && t.hits.length ? ' · ' + t.hits.slice(0,4).join(', ') : '')) + '</div>' +
        '<div class="v51-best-actions"><button type="button" class="v51-mini-btn" data-sugo-precision-open="' + esc(t.id) + '">Open SOP</button><button type="button" class="v51-mini-btn" data-sugo-precision-ask="' + esc(t.title || t.label || t.id) + '" data-sugo-precision-pane="' + esc(t.id) + '">Ask AI</button></div>' +
      '</div>';
    }).join('');
    panel.style.display = 'block';
    panel.innerHTML = '<div class="v51-best-card sugo-precision-best-match">' +
      '<div class="v51-best-top"><span class="v51-best-badge">Precision Match</span><span class="v51-best-score ' + cls + '">' + esc(kb.confidenceLabel + ' · ' + kb.confidenceScore) + '</span></div>' +
      (kb.ambiguous ? '<div class="v51-best-section" style="color:#92400e;font-weight:850;">⚠ Close matches — verify the case before sending.</div>' : '') +
      rows +
      '</div>';
  }

  function precisionDoSearch(query){
    showPrecisionNavigation(query);
    renderPrecisionBest(query);
  }

  function invalidate(){ topicCache = null; }

  function install(){
    try{
      window.getAllTopics = getAllTopicsPrecision;
      getAllTopics = getAllTopicsPrecision;
    }catch(e){}
    try{
      window.getRelevantKnowledgeBaseText = getRelevantKnowledgeBaseTextPrecision;
      getRelevantKnowledgeBaseText = getRelevantKnowledgeBaseTextPrecision;
    }catch(e){}
    try{
      window.doSearch = precisionDoSearch;
      doSearch = precisionDoSearch;
    }catch(e){}
    try{
      if(window.SugoApp && window.SugoApp.navigation) window.SugoApp.navigation.search = precisionDoSearch;
    }catch(e){}
    document.addEventListener('click', function(e){
      var open = e.target.closest && e.target.closest('[data-sugo-precision-open]');
      if(open){
        e.preventDefault();
        var paneId = open.getAttribute('data-sugo-precision-open');
        if(paneId && typeof showPane === 'function') showPane(paneId, true);
        return;
      }
      var ask = e.target.closest && e.target.closest('[data-sugo-precision-ask]');
      if(ask){
        e.preventDefault();
        var q = ask.getAttribute('data-sugo-precision-ask') || '';
        var pane = ask.getAttribute('data-sugo-precision-pane') || '';
        if(pane){ window.SUGO_EXACT_AI_PANE = pane; window.SUGO_ACTIVE_PANE = pane; window.SUGO_ACTIVE_PANE_TS = Date.now(); }
        var input = document.getElementById('searchInput');
        if(input) input.value = q;
        if(typeof askAI === 'function') askAI(q);
      }
    }, true);
    setTimeout(invalidate, 250);
    setTimeout(invalidate, 1200);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  window.addEventListener('load', function(){ invalidate(); install(); });

  window.SUGO_PRECISION_SEARCH = {
    version: PRECISION_VERSION,
    normalize: norm,
    groups: GROUPS,
    expandQuery: expandQuery,
    rank: precisionRank,
    invalidate: invalidate,
    getTopics: getAllTopicsPrecision
  };
})();


// ===== extracted from #sugo-typing-lag-hotfix-v5 =====
(function(){
  'use strict';

  var VERSION = '5.0.0-fast-live-search';
  var debounceTimer = null;
  var pendingFrame = null;
  var lastAppliedQuery = null;
  var navIndex = null;
  var liveWaitMs = 360;
  var isComposing = false;

  function byId(id){ return document.getElementById(id); }
  function esc(value){
    if(typeof escapeHtml === 'function') return escapeHtml(value);
    return String(value || '').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
  }
  function norm(value){
    return String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[إأآٱا]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/گ/g, 'ك')
      .replace(/پ/g, 'ب')
      .replace(/چ/g, 'ج')
      .replace(/ڤ/g, 'ف')
      .replace(/ـ/g, '')
      .replace(/\bpass\s*word\b/g, 'password')
      .replace(/\bsign\s*in\b/g, 'login')
      .replace(/\blog\s*in\b/g, 'login')
      .replace(/\bphone\s*number\b/g, 'phone')
      .replace(/\bmobile\s*number\b/g, 'phone')
      .replace(/\buser\s*id\b/g, 'id')
      .replace(/\baccount\s*id\b/g, 'id')
      .replace(/\bsub\s*agency\b/g, 'subagency')
      .replace(/\bmain\s*agency\b/g, 'mainagency')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function stripArabicArticle(token){
    token = String(token || '');
    return token.length > 4 && token.indexOf('ال') === 0 ? token.slice(2) : token;
  }
  var STOP = new Set(('the is a an to of and or for in on how what do does did i my it this that with can are be please explain whole process from you need customer client issue problem case help me' +
    ' من في على عن هل كيف ما ماذا الى إلى او أو مع هذا هذه لو اذا إذا بدي اريد أريد شو ليش العميل المستخدم مشكله مشكلة موضوع حاله حالة بسبب عند عندي انا انت هو هي').split(/\s+/).filter(Boolean));

  function getGroups(){
    return (window.SUGO_PRECISION_SEARCH && window.SUGO_PRECISION_SEARCH.groups) || {
      password:['password','باسورد','باسوورد','كلمة السر','كلمة السر','كلمة مرور','reset password'],
      phone:['phone','mobile','رقم الهاتف','هاتف','موبايل','ربط رقم','تغيير رقم'],
      sms:['sms','otp','code','كود','رمز التحقق'],
      ban:['ban','banned','blocked','حظر','محظور','باند','تقييد'],
      unban:['unban','appeal','فك حظر','رفع الحظر','استئناف'],
      recharge:['recharge','payment','coins','invoice','شحن','دفع','كوين','فاتورة'],
      withdrawal:['withdrawal','salary','diamonds','سحب','راتب','ماسات'],
      agency:['agency','agent','host','وكالة','وكاله','مضيف','مضيفه'],
      report:['report','abuse','complaint','بلاغ','ابلاغ','اساءة','إساءة'],
      location:['location','country','distance','موقع','دولة','دوله','مسافة'],
      game:['game','games','لعبة','لعبه','العاب'],
      crash:['crash','bug','freeze','كراش','تعطل','يعلق']
    };
  }
  function phraseVariants(value){
    var n = norm(value);
    if(!n) return [];
    var out = new Set([n]);
    n.split(/\s+/).forEach(function(t){ if(t) out.add(stripArabicArticle(t)); });
    return Array.from(out).filter(Boolean);
  }
  function tokens(value, keepStop){
    var n = norm(value);
    if(!n) return [];
    var arr = n.split(/\s+/).map(stripArabicArticle).filter(function(t){ return t && t.length > 1; });
    if(!keepStop) arr = arr.filter(function(t){ return !STOP.has(t); });
    return Array.from(new Set(arr));
  }
  function hasPhrase(hay, phrase){
    phrase = norm(phrase);
    if(!phrase) return false;
    return phrase.length <= 3 ? (' ' + hay + ' ').indexOf(' ' + phrase + ' ') >= 0 : hay.indexOf(phrase) >= 0;
  }
  function expandLiteQuery(query){
    var q = norm(query);
    var original = tokens(query, false);
    var expanded = new Set(original);
    var groups = [];
    var groupMap = getGroups();
    Object.keys(groupMap).forEach(function(g){
      var terms = [];
      (groupMap[g] || []).forEach(function(term){ phraseVariants(term).forEach(function(v){ terms.push(v); }); });
      var matched = terms.some(function(term){ return hasPhrase(q, term); });
      if(matched){
        groups.push(g);
        expanded.add(g);
        terms.forEach(function(term){ tokens(term, true).forEach(function(t){ if(!STOP.has(t)) expanded.add(t); }); });
      }
    });
    return { raw:q, original:original, expanded:Array.from(expanded), groups:groups };
  }
  function directLabel(node, selector){
    try{
      var span = node && node.querySelector(':scope > ' + selector + ' span');
      return span ? (span.textContent || '').replace(/\s+/g, ' ').trim() : '';
    }catch(e){ return ''; }
  }
  function buildNavIndex(){
    var buttons = Array.prototype.slice.call(document.querySelectorAll('.nav-l000-btn[data-pane]'));
    navIndex = buttons.map(function(btn){
      var id = btn.getAttribute('data-pane') || '';
      var l00 = btn.closest('.nav-l00');
      var l0 = btn.closest('.nav-l0');
      var root = btn.closest('.nav-lroot');
      var title = (btn.textContent || '').replace(/\s+/g, ' ').trim() || id.replace(/-/g, ' ');
      var section = directLabel(l00, '.nav-l00-btn');
      var category = directLabel(l0, '.nav-l0-btn');
      var library = directLabel(root, '.nav-lroot-btn');
      var path = [library, category, section].filter(Boolean).join(' › ');
      var titleNorm = norm([id.replace(/-/g, ' '), title].join(' '));
      var pathNorm = norm(path);
      var searchNorm = norm([id.replace(/-/g, ' '), title, section, category, library].join(' '));
      return { id:id, btn:btn, l00:l00, l0:l0, root:root, title:title, section:section, category:category, library:library, path:path, titleNorm:titleNorm, pathNorm:pathNorm, searchNorm:searchNorm };
    });
    return navIndex;
  }
  function getNavIndex(){ return navIndex || buildNavIndex(); }
  function scoreLite(item, info){
    var score = 0;
    var hits = [];
    var q = info.raw;
    if(q && q.length >= 3){
      if(hasPhrase(item.titleNorm, q)){ score += 90; hits.push(q); }
      else if(hasPhrase(item.pathNorm, q)){ score += 48; hits.push(q); }
      else if(hasPhrase(item.searchNorm, q)){ score += 24; hits.push(q); }
    }
    info.groups.forEach(function(g){
      var groupMap = getGroups();
      var terms = [];
      (groupMap[g] || []).forEach(function(term){ phraseVariants(term).forEach(function(v){ terms.push(v); }); });
      var titleHit = terms.some(function(term){ return hasPhrase(item.titleNorm, term); });
      var pathHit = terms.some(function(term){ return hasPhrase(item.pathNorm, term); });
      var anyHit = terms.some(function(term){ return hasPhrase(item.searchNorm, term); });
      if(titleHit){ score += 42; hits.push(g); }
      else if(pathHit){ score += 28; hits.push(g); }
      else if(anyHit){ score += 16; hits.push(g); }
    });
    info.expanded.forEach(function(w){
      if(!w || w.length < 2 || STOP.has(w)) return;
      if(hasPhrase(item.titleNorm, w)){ score += 18; hits.push(w); }
      else if(item.titleNorm.indexOf(w) >= 0){ score += 11; hits.push(w); }
      if(hasPhrase(item.pathNorm, w)){ score += 9; hits.push(w); }
      else if(item.pathNorm.indexOf(w) >= 0){ score += 5; hits.push(w); }
      if(hasPhrase(item.searchNorm, w)){ score += 4; hits.push(w); }
    });
    var coverage = info.original.length ? info.original.filter(function(t){ return hasPhrase(item.searchNorm, t); }).length / info.original.length : 0;
    if(coverage >= 0.8) score += 14;
    else if(coverage >= 0.5) score += 8;
    if(/optimized|overview|placeholder/.test(item.id)) score -= 4;
    return Object.assign({}, item, { score:Math.max(0, score), hits:Array.from(new Set(hits)).slice(0, 6), coverage:Math.round(coverage * 100) / 100 });
  }
  function rankLite(query){
    var info = expandLiteQuery(query);
    return getNavIndex().map(function(item){ return scoreLite(item, info); })
      .filter(function(item){ return item.score > 0; })
      .sort(function(a,b){
        if(b.score !== a.score) return b.score - a.score;
        return String(a.title || '').localeCompare(String(b.title || ''));
      });
  }
  function setHidden(el, hidden){
    if(!el) return;
    if(hidden && !el.classList.contains('hidden-search')) el.classList.add('hidden-search');
    else if(!hidden && el.classList.contains('hidden-search')) el.classList.remove('hidden-search');
  }
  function setOpen(el, open){
    if(!el) return;
    if(open && !el.classList.contains('open')) el.classList.add('open');
    else if(!open && el.classList.contains('open')) el.classList.remove('open');
  }
  function clearLiveSearch(){
    var index = getNavIndex();
    index.forEach(function(item){ setHidden(item.btn, false); });
    document.querySelectorAll('.nav-l00,.nav-l0,.nav-lroot').forEach(function(el){ setHidden(el, false); });
    var nr = byId('noResults');
    if(nr) nr.style.display = 'none';
    var panel = byId('v51BestMatchPanel');
    if(panel){ panel.style.display = 'none'; panel.innerHTML = ''; }
  }
  function confidenceFor(best, second){
    if(!best) return { label:'Low', className:'ai-source-low', score:0 };
    var gap = second ? best.score - second.score : best.score;
    var high = best.score >= 80 && gap >= Math.max(8, best.score * 0.12);
    var medium = best.score >= 34;
    var label = high ? 'High' : medium ? 'Medium' : 'Low';
    return { label:label, className: high ? 'ai-source-high' : medium ? 'ai-source-medium' : 'ai-source-low', score:Math.round(best.score * 10) / 10 };
  }
  function renderBest(results){
    var panel = byId('v51BestMatchPanel');
    if(!panel) return;
    if(!results.length){ panel.style.display = 'none'; panel.innerHTML = ''; return; }
    var conf = confidenceFor(results[0], results[1]);
    var rows = results.slice(0, 3).map(function(t, i){
      return '<div style="padding:8px 0;border-top:' + (i ? '1px solid rgba(148,163,184,.18)' : '0') + '">' +
        '<div class="v51-best-title" style="margin-bottom:2px;">' + esc((i + 1) + '. ' + (t.title || t.id)) + '</div>' +
        '<div class="v51-best-section">' + esc((t.path || t.section || '') + ' · score ' + (Math.round((t.score || 0) * 10) / 10) + (t.hits && t.hits.length ? ' · ' + t.hits.slice(0,4).join(', ') : '')) + '</div>' +
        '<div class="v51-best-actions"><button type="button" class="v51-mini-btn" data-sugo-precision-open="' + esc(t.id) + '">Open SOP</button><button type="button" class="v51-mini-btn" data-sugo-precision-ask="' + esc(t.title || t.id) + '" data-sugo-precision-pane="' + esc(t.id) + '">Ask AI</button></div>' +
      '</div>';
    }).join('');
    var ambiguous = results[1] && (results[0].score - results[1].score) <= Math.max(8, results[0].score * 0.12) && results[0].score >= 34;
    panel.style.display = 'block';
    panel.innerHTML = '<div class="v51-best-card sugo-precision-best-match sugo-fast-best-match">' +
      '<div class="v51-best-top"><span class="v51-best-badge">Fast Precision Match</span><span class="v51-best-score ' + conf.className + '">' + esc(conf.label + ' · ' + conf.score) + '</span></div>' +
      (ambiguous ? '<div class="v51-best-section" style="color:#92400e;font-weight:850;">⚠ Close matches — verify the case before sending.</div>' : '') + rows + '</div>';
  }
  function applyLiveResults(query, results){
    var q = String(query || '').trim();
    if(!q || q.length < 2){ clearLiveSearch(); return; }
    var useful = results.filter(function(t){ return t.score >= 18; }).slice(0, 60);
    if(!useful.length) useful = results.slice(0, 25);
    var ids = new Set(useful.map(function(t){ return t.id; }));
    var topIds = new Set(useful.slice(0, 5).map(function(t){ return t.id; }));
    var any = false;
    var index = getNavIndex();
    index.forEach(function(item){
      var visible = ids.has(item.id);
      setHidden(item.btn, !visible);
      if(visible) any = true;
    });
    document.querySelectorAll('.nav-l00').forEach(function(sec){
      var visible = Array.prototype.some.call(sec.querySelectorAll('.nav-l000-btn[data-pane]'), function(btn){ return ids.has(btn.getAttribute('data-pane')); });
      setHidden(sec, !visible);
    });
    document.querySelectorAll('.nav-l0').forEach(function(cat){
      var visible = Array.prototype.some.call(cat.querySelectorAll('.nav-l000-btn[data-pane]'), function(btn){ return ids.has(btn.getAttribute('data-pane')); });
      setHidden(cat, !visible);
    });
    document.querySelectorAll('.nav-lroot').forEach(function(root){
      var visible = Array.prototype.some.call(root.querySelectorAll('.nav-l000-btn[data-pane]'), function(btn){ return ids.has(btn.getAttribute('data-pane')); });
      setHidden(root, !visible);
    });
    // Open only the first few matching paths. Opening every result was the main UI-freeze cause.
    document.querySelectorAll('.nav-lroot-children.open,.nav-l0-children.open,.nav-l00-children.open').forEach(function(el){ setOpen(el, false); });
    document.querySelectorAll('.nav-lroot-chev.open,.nav-l0-chev.open,.nav-l00-chev.open').forEach(function(el){ setOpen(el, false); });
    index.forEach(function(item){
      if(!topIds.has(item.id)) return;
      var rootChild = item.root && item.root.querySelector(':scope > .nav-lroot-children');
      var rootChev = item.root && item.root.querySelector(':scope > .nav-lroot-btn .nav-lroot-chev');
      var l0Child = item.l0 && item.l0.querySelector(':scope > .nav-l0-children');
      var l0Chev = item.l0 && item.l0.querySelector(':scope > .nav-l0-btn .nav-l0-chev');
      var l00Child = item.l00 && item.l00.querySelector(':scope > .nav-l00-children');
      var l00Chev = item.l00 && item.l00.querySelector(':scope > .nav-l00-btn .nav-l00-chev');
      setOpen(rootChild, true); setOpen(rootChev, true);
      setOpen(l0Child, true); setOpen(l0Chev, true);
      setOpen(l00Child, true); setOpen(l00Chev, true);
    });
    var nr = byId('noResults');
    if(nr) nr.style.display = any ? 'none' : 'block';
    renderBest(useful);
  }
  function fastLiveSearch(query){
    var q = String(query || '').trim();
    if(lastAppliedQuery === q) return;
    lastAppliedQuery = q;
    if(pendingFrame) cancelAnimationFrame(pendingFrame);
    if(!q || q.length < 2){
      pendingFrame = requestAnimationFrame(function(){ pendingFrame = null; clearLiveSearch(); });
      return;
    }
    var results = rankLite(q);
    pendingFrame = requestAnimationFrame(function(){
      pendingFrame = null;
      applyLiveResults(q, results);
    });
  }
  function resizeInput(el){
    try{
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 96) + 'px';
    }catch(e){}
  }
  function install(){
    buildNavIndex();
    window.sugoFastSearchInput = function(el){
      if(!el) return;
      resizeInput(el);
      if(isComposing) return;
      var value = String(el.value || '');
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function(){ fastLiveSearch(value); }, value.trim() ? liveWaitMs : 25);
    };
    window.doSearch = fastLiveSearch;
    try{ doSearch = fastLiveSearch; }catch(e){}
    if(window.SugoApp && window.SugoApp.navigation){ window.SugoApp.navigation.search = fastLiveSearch; }
  }
  document.addEventListener('compositionstart', function(e){ if(e.target && e.target.id === 'searchInput') isComposing = true; }, true);
  document.addEventListener('compositionend', function(e){
    if(e.target && e.target.id === 'searchInput'){
      isComposing = false;
      window.sugoFastSearchInput(e.target);
    }
  }, true);
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  window.addEventListener('load', function(){ setTimeout(install, 0); });
  window.SUGO_TYPING_LAG_HOTFIX = { version: VERSION, debounceMs: liveWaitMs, rebuildIndex: function(){ navIndex = null; return buildNavIndex(); }, search: fastLiveSearch };
})();


// ===== extracted from #sugo-favorites-remove-guard-v21 =====
(function(){
  'use strict';
  if(window.__SUGO_FAVORITES_REMOVE_GUARD_V21__) return;
  window.__SUGO_FAVORITES_REMOVE_GUARD_V21__ = true;

  var FAV_KEY = 'sugo_favorite_panes_v1';
  var AI_FAV_KEY = 'sugo_favorite_ai_tickets_v1';
  var MAX_FAV_DISPLAY = 16;

  function byId(id){ return document.getElementById(id); }
  function esc(value){
    return String(value || '').replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];
    });
  }
  function readList(key){
    try{
      var list = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(list) ? list : [];
    }catch(e){ return []; }
  }
  function writeList(key, list){
    try{ localStorage.setItem(key, JSON.stringify(list || [])); }catch(e){}
  }
  function paneExists(paneId){
    try{ return !!(paneId && typeof paneContent !== 'undefined' && paneContent && paneContent[paneId]); }
    catch(e){ return false; }
  }
  function uniquePaneList(list){
    var seen = Object.create(null);
    var out = [];
    (list || []).forEach(function(raw){
      var id = String(raw || '').trim();
      if(!id || seen[id] || !paneExists(id)) return;
      seen[id] = true;
      out.push(id);
    });
    return out;
  }
  function cssEscape(value){
    if(window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value || '').replace(/[^a-zA-Z0-9_-]/g, function(ch){ return '\\' + ch; });
  }
  function getNavButton(paneId){
    try{ return document.querySelector('.nav-l000-btn[data-pane="' + cssEscape(paneId) + '"]'); }
    catch(e){ return null; }
  }
  function getPaneTitle(paneId){
    var btn = getNavButton(paneId);
    if(btn && btn.textContent.trim()) return btn.textContent.trim();
    try{
      if(typeof window.getAllTopics === 'function'){
        var topics = window.getAllTopics();
        var topic = topics && topics.find(function(item){ return item && item.id === paneId; });
        if(topic && (topic.title || topic.label)) return String(topic.title || topic.label).trim();
      }
    }catch(e){}
    return String(paneId || '').replace(/^sv-refined-|^sv-clean-|^sv-/, '').replace(/-/g, ' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); });
  }
  function getPanePath(paneId){
    var btn = getNavButton(paneId);
    if(!btn) return 'SUGO SOP';
    var parts = [];
    var l00 = btn.closest('.nav-l00');
    var l0 = btn.closest('.nav-l0');
    var root = btn.closest('.nav-lroot');
    var n0 = root && root.querySelector(':scope > .nav-lroot-btn > span');
    var n1 = l0 && l0.querySelector(':scope > .nav-l0-btn span');
    var n2 = l00 && l00.querySelector(':scope > .nav-l00-btn span');
    [n0,n1,n2].forEach(function(el){ if(el && el.textContent.trim()) parts.push(el.textContent.trim()); });
    return parts.filter(Boolean).join(' › ') || 'SUGO SOP';
  }
  function makePaneFavoriteItem(paneId){
    return '<button type="button" class="sugo-fr-item" data-sugo-fr-open="' + esc(paneId) + '">' +
      '<span class="sugo-fr-icon sugo-fr-icon-favorite">F</span>' +
      '<span class="sugo-fr-main"><span class="sugo-fr-name">' + esc(getPaneTitle(paneId)) + '</span><span class="sugo-fr-path">' + esc(getPanePath(paneId)) + '</span></span>' +
      '<span class="sugo-fr-remove" role="button" tabindex="0" data-sugo-fr-remove="' + esc(paneId) + '" title="Remove favorite" aria-label="Remove favorite">×</span>' +
      '</button>';
  }
  function makeAiFavoriteItem(item){
    item = item || {};
    return '<button type="button" class="sugo-fr-item sugo-fr-ai-item" data-sugo-ai-fav-open="' + esc(item.id) + '">' +
      '<span class="sugo-fr-icon sugo-fr-icon-ai">AI</span>' +
      '<span class="sugo-fr-main"><span class="sugo-fr-name">' + esc(item.title || 'Generated Ticket') + '</span><span class="sugo-fr-path">AI Generated Ticket</span></span>' +
      '<span class="sugo-fr-remove" role="button" tabindex="0" data-sugo-ai-fav-remove="' + esc(item.id) + '" title="Remove favorite" aria-label="Remove favorite">×</span>' +
      '</button>';
  }
  function updateCounts(){
    var favBox = byId('sugoFavoritesList');
    var recentBox = byId('sugoRecentList');
    var favCounter = byId('sugoFavCount');
    var recentCounter = byId('sugoRecentCount');
    if(favCounter) favCounter.textContent = favBox ? favBox.querySelectorAll('.sugo-fr-item').length : 0;
    if(recentCounter) recentCounter.textContent = recentBox ? recentBox.querySelectorAll('.sugo-fr-item').length : 0;
  }
  function renderFavorites(){
    var favBox = byId('sugoFavoritesList');
    if(!favBox) return;

    var aiFavorites = readList(AI_FAV_KEY).filter(function(item){ return item && item.id; });
    var paneFavorites = uniquePaneList(readList(FAV_KEY)).slice(0, MAX_FAV_DISPLAY);
    var html = '';

    if(aiFavorites.length){
      html += '<div class="sugo-fr-ai-label">Generated Tickets</div>' + aiFavorites.map(makeAiFavoriteItem).join('');
    }
    if(paneFavorites.length){
      html += paneFavorites.map(makePaneFavoriteItem).join('');
    }
    if(!html){
      html = '<div class="sugo-fr-empty">No favorites yet. Open any macro and press Add Favorite.</div>';
    }
    favBox.innerHTML = html;
    updateCounts();
  }
  function setPaneBarInactive(paneId){
    try{
      var pane = byId('pane-' + paneId);
      if(!pane) return;
      var btn = pane.querySelector('[data-sugo-fav-toggle="' + cssEscape(paneId) + '"]');
      if(btn){
        btn.classList.remove('active');
        btn.innerHTML = '<span class="sugo-fr-badge">☆</span>Add Favorite';
      }
    }catch(e){}
  }
  function syncAiBar(){
    try{
      var bar = document.querySelector('.sugo-ai-favbar');
      if(!bar) return;
      var id = bar.getAttribute('data-ai-ticket-id');
      if(!id) return;
      var active = readList(AI_FAV_KEY).some(function(item){ return item && item.id === id; });
      var btn = bar.querySelector('[data-sugo-ai-fav-current]');
      if(btn){
        btn.classList.toggle('active', active);
        btn.innerHTML = '<span>' + (active ? '★' : '☆') + '</span>' + (active ? 'Favorited' : 'Add Favorite');
      }
    }catch(e){}
  }
  function removePaneFavorite(paneId){
    paneId = String(paneId || '').trim();
    if(!paneId) return;
    writeList(FAV_KEY, readList(FAV_KEY).filter(function(id){ return String(id || '').trim() !== paneId; }));
    setPaneBarInactive(paneId);
    renderFavorites();
  }
  function removeAiFavorite(id){
    id = String(id || '').trim();
    if(!id) return;
    writeList(AI_FAV_KEY, readList(AI_FAV_KEY).filter(function(item){ return item && String(item.id || '').trim() !== id; }));
    syncAiBar();
    renderFavorites();
  }
  function handleRemove(event){
    if(!event || !event.target || !event.target.closest) return;
    var paneRemove = event.target.closest('[data-sugo-fr-remove]');
    var aiRemove = event.target.closest('[data-sugo-ai-fav-remove]');
    if(!paneRemove && !aiRemove) return;

    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();

    if(aiRemove) removeAiFavorite(aiRemove.getAttribute('data-sugo-ai-fav-remove'));
    if(paneRemove) removePaneFavorite(paneRemove.getAttribute('data-sugo-fr-remove'));
  }

  document.addEventListener('click', handleRemove, true);
  document.addEventListener('keydown', function(event){
    if(event.key !== 'Enter' && event.key !== ' ') return;
    handleRemove(event);
  }, true);

  window.SUGOFavoritesRemoveGuard = {
    version: '2.1.0',
    refresh: renderFavorites,
    removePaneFavorite: removePaneFavorite,
    removeAiFavorite: removeAiFavorite
  };
})();


// ===== extracted from #sugo-favorites-open-hotfix-v2 =====
(function(){
  'use strict';

  if(window.__SUGO_FAVORITES_OPEN_HOTFIX_V2__) return;
  window.__SUGO_FAVORITES_OPEN_HOTFIX_V2__ = true;

  if(!window.CSS) window.CSS = {};
  if(typeof window.CSS.escape !== 'function'){
    window.CSS.escape = function(value){
      return String(value || '').replace(/[^a-zA-Z0-9_-]/g, function(ch){
        return '\\' + ch;
      });
    };
  }

  function byId(id){ return document.getElementById(id); }
  function normalizePaneId(value){
    value = String(value || '').trim();
    value = value.replace(/^pane-/, '');
    return value;
  }
  function paneExists(paneId){
    return !!(paneId && typeof paneContent !== 'undefined' && paneContent && paneContent[paneId]);
  }
  function closeQuickAccessPanel(){
    var panel = byId('sugoFavRecentPanel');
    if(panel){
      panel.classList.remove('is-open');
      panel.querySelectorAll('[data-sugo-fr-tab]').forEach(function(btn){ btn.setAttribute('aria-expanded', 'false'); });
    }
  }
  function activateNav(paneId){
    document.querySelectorAll('.nav-l000-btn').forEach(function(btn){
      btn.classList.toggle('active', btn.getAttribute('data-pane') === paneId);
    });
    try{
      if(window.SugoApp && window.SugoApp.navigation && typeof window.SugoApp.navigation.syncToPane === 'function'){
        window.SugoApp.navigation.syncToPane(paneId, { persist:true });
      }
    }catch(e){}
  }
  function fallbackPreparePane(paneId){
    var existing = byId('pane-' + paneId);
    if(existing) return existing;
    if(typeof window.preparePaneElement === 'function'){
      try { return window.preparePaneElement(paneId); } catch(e){}
    }
    if(!paneExists(paneId)) return null;
    var contentArea = byId('contentArea');
    if(!contentArea) return null;
    var paneDiv = document.createElement('div');
    paneDiv.className = 'content-pane';
    paneDiv.dataset.lazy = '1';
    paneDiv.id = 'pane-' + paneId;
    var closeBtn = document.createElement('button');
    closeBtn.className = 'close-pane-btn';
    closeBtn.type = 'button';
    closeBtn.innerHTML = '✕';
    closeBtn.addEventListener('click', function(){
      document.querySelectorAll('.content-pane,.ai-answer-pane').forEach(function(p){ p.classList.remove('active'); });
      var welcome = byId('welcomeMsg');
      if(welcome) welcome.style.display = 'flex';
      try { localStorage.removeItem('sugo_last_pane'); } catch(e){}
    });
    var container = document.createElement('div');
    var tmp = document.createElement('div');
    tmp.innerHTML = (window.paneContent[paneId] && (window.paneContent[paneId].en || window.paneContent[paneId].html)) || '';
    container.appendChild(tmp);
    paneDiv.appendChild(closeBtn);
    paneDiv.appendChild(container);
    contentArea.appendChild(paneDiv);
    return paneDiv;
  }
  function forceOpenPane(paneId){
    if(!paneExists(paneId)) return false;
    var pane = fallbackPreparePane(paneId);
    if(!pane) return false;
    document.querySelectorAll('.content-pane,.ai-answer-pane').forEach(function(p){ p.classList.remove('active'); });
    var welcome = byId('welcomeMsg');
    if(welcome) welcome.style.display = 'none';
    pane.classList.add('active');
    window.SUGO_ACTIVE_PANE = paneId;
    window.SUGO_ACTIVE_PANE_TS = Date.now();
    try { localStorage.setItem('sugo_last_pane', paneId); } catch(e){}
    activateNav(paneId);
    try { pane.scrollIntoView({ block:'start', behavior:'auto' }); } catch(e){}
    return true;
  }
  function robustOpenPane(rawPaneId){
    var paneId = normalizePaneId(rawPaneId);
    if(!paneExists(paneId)) return false;

    var opened = false;
    try{
      if(typeof window.showPane === 'function'){
        window.showPane(paneId, true);
        opened = true;
      } else if(typeof showPane === 'function'){
        showPane(paneId, true);
        opened = true;
      }
    }catch(e){ opened = false; }

    setTimeout(function(){
      var pane = byId('pane-' + paneId);
      if(!pane || !pane.classList.contains('active')) forceOpenPane(paneId);
      closeQuickAccessPanel();
    }, 0);

    if(!opened) return forceOpenPane(paneId);
    return true;
  }
  function handleOpenClick(event){
    if(event.target.closest && event.target.closest('[data-sugo-fr-remove],[data-sugo-ai-fav-remove],[data-sugo-fav-toggle],[data-sugo-ai-fav-current]')) return;
    var open = event.target.closest && event.target.closest('[data-sugo-fr-open]');
    if(!open) return;
    var paneId = open.getAttribute('data-sugo-fr-open');
    if(!paneId) return;
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    robustOpenPane(paneId);
  }
  function handleKeyboard(event){
    if(event.key !== 'Enter' && event.key !== ' ') return;
    if(event.target.closest && event.target.closest('[data-sugo-fr-remove],[data-sugo-ai-fav-remove],[data-sugo-fav-toggle],[data-sugo-ai-fav-current]')) return;
    var open = event.target.closest && event.target.closest('[data-sugo-fr-open]');
    if(!open) return;
    event.preventDefault();
    robustOpenPane(open.getAttribute('data-sugo-fr-open'));
  }
  function refreshAndRepairItems(){
    document.querySelectorAll('[data-sugo-fr-open]').forEach(function(item){
      if(!item.getAttribute('tabindex')) item.setAttribute('tabindex', '0');
      if(item.tagName !== 'BUTTON') item.setAttribute('role', 'button');
      item.style.pointerEvents = 'auto';
    });
  }
  document.addEventListener('click', handleOpenClick, true);
  document.addEventListener('keydown', handleKeyboard, true);
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(refreshAndRepairItems, 0); setTimeout(refreshAndRepairItems, 500); });
  window.addEventListener('load', function(){ setTimeout(refreshAndRepairItems, 0); setTimeout(refreshAndRepairItems, 800); });
  var panel = byId('sugoFavRecentPanel');
  if(panel && window.MutationObserver){
    new MutationObserver(refreshAndRepairItems).observe(panel, { childList:true, subtree:true });
  }
  window.SUGOFavoritesOpenHotfix = { version:'2.0.0', open: robustOpenPane, repair: refreshAndRepairItems };
})();


// ===== extracted from #sugo-recent-clear-favorites-persistence-hotfix-v1 =====
(function(){
  'use strict';

  if(window.__SUGO_RECENT_CLEAR_FAVORITES_PERSISTENCE_FIX_V1__) return;
  window.__SUGO_RECENT_CLEAR_FAVORITES_PERSISTENCE_FIX_V1__ = true;

  var FAV_KEY = 'sugo_favorite_panes_v1';
  var AI_FAV_KEY = 'sugo_favorite_ai_tickets_v1';
  var MAX_FAV_DISPLAY = 16;

  if(!window.CSS) window.CSS = {};
  if(typeof window.CSS.escape !== 'function'){
    window.CSS.escape = function(value){
      return String(value || '').replace(/[^a-zA-Z0-9_-]/g, function(ch){ return '\\' + ch; });
    };
  }

  function byId(id){ return document.getElementById(id); }
  function esc(value){
    return String(value || '').replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];
    });
  }
  function readList(key){
    try{
      var list = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(list) ? list : [];
    }catch(e){ return []; }
  }
  function paneExists(paneId){
    return !!(paneId && typeof paneContent !== 'undefined' && paneContent && paneContent[paneId]);
  }
  function uniquePaneList(list){
    var seen = Object.create(null);
    return (list || []).filter(function(id){
      id = String(id || '').trim();
      if(!id || seen[id] || !paneExists(id)) return false;
      seen[id] = true;
      return true;
    });
  }
  function getNavButton(paneId){
    try{ return document.querySelector('.nav-l000-btn[data-pane="' + CSS.escape(paneId) + '"]'); }
    catch(e){ return null; }
  }
  function getPaneTitle(paneId){
    var btn = getNavButton(paneId);
    if(btn && btn.textContent.trim()) return btn.textContent.trim();
    try{
      if(typeof window.getAllTopics === 'function'){
        var topics = window.getAllTopics();
        var topic = topics && topics.find(function(item){ return item && item.id === paneId; });
        if(topic && (topic.title || topic.label)) return String(topic.title || topic.label).trim();
      }
    }catch(e){}
    return String(paneId || '').replace(/^sv-refined-|^sv-clean-|^sv-/, '').replace(/-/g, ' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); });
  }
  function getPanePath(paneId){
    var btn = getNavButton(paneId);
    if(!btn) return 'SUGO SOP';
    var parts = [];
    var l00 = btn.closest('.nav-l00');
    var l0 = btn.closest('.nav-l0');
    var root = btn.closest('.nav-lroot');
    var n0 = root && root.querySelector(':scope > .nav-lroot-btn > span');
    var n1 = l0 && l0.querySelector(':scope > .nav-l0-btn span');
    var n2 = l00 && l00.querySelector(':scope > .nav-l00-btn span');
    [n0,n1,n2].forEach(function(el){ if(el && el.textContent.trim()) parts.push(el.textContent.trim()); });
    return parts.filter(Boolean).join(' › ') || 'SUGO SOP';
  }
  function makePaneFavoriteItem(paneId){
    return '<button type="button" class="sugo-fr-item" data-sugo-fr-open="' + esc(paneId) + '">' +
      '<span class="sugo-fr-icon sugo-fr-icon-favorite">F</span>' +
      '<span class="sugo-fr-main"><span class="sugo-fr-name">' + esc(getPaneTitle(paneId)) + '</span><span class="sugo-fr-path">' + esc(getPanePath(paneId)) + '</span></span>' +
      '<span class="sugo-fr-remove" role="button" tabindex="0" data-sugo-fr-remove="' + esc(paneId) + '" title="Remove favorite">×</span>' +
      '</button>';
  }
  function makeAiFavoriteItem(item){
    item = item || {};
    return '<button type="button" class="sugo-fr-item sugo-fr-ai-item" data-sugo-ai-fav-open="' + esc(item.id) + '">' +
      '<span class="sugo-fr-icon sugo-fr-icon-ai">AI</span>' +
      '<span class="sugo-fr-main"><span class="sugo-fr-name">' + esc(item.title || 'Generated Ticket') + '</span><span class="sugo-fr-path">AI Generated Ticket</span></span>' +
      '<span class="sugo-fr-remove" role="button" tabindex="0" data-sugo-ai-fav-remove="' + esc(item.id) + '" title="Remove favorite">×</span>' +
      '</button>';
  }
  function renderFavoritesFromStorage(){
    var favBox = byId('sugoFavoritesList');
    if(!favBox) return;

    var paneFavorites = uniquePaneList(readList(FAV_KEY)).slice(0, MAX_FAV_DISPLAY);
    var aiFavorites = readList(AI_FAV_KEY).filter(function(item){ return item && item.id; });
    var html = '';

    if(aiFavorites.length){
      html += '<div class="sugo-fr-ai-label">Generated Tickets</div>' + aiFavorites.map(makeAiFavoriteItem).join('');
    }
    if(paneFavorites.length){
      html += paneFavorites.map(makePaneFavoriteItem).join('');
    }
    if(!html){
      html = '<div class="sugo-fr-empty">No favorites yet. Open any macro and press Add Favorite.</div>';
    }
    favBox.innerHTML = html;
  }
  function updateQuickAccessCounts(){
    var favBox = byId('sugoFavoritesList');
    var recentBox = byId('sugoRecentList');
    var favCount = favBox ? favBox.querySelectorAll('.sugo-fr-item').length : 0;
    var recentCount = recentBox ? recentBox.querySelectorAll('.sugo-fr-item').length : 0;
    var favCounter = byId('sugoFavCount');
    var recentCounter = byId('sugoRecentCount');
    if(favCounter) favCounter.textContent = favCount;
    if(recentCounter) recentCounter.textContent = recentCount;
  }
  function healFavoritesAfterRecentChange(){
    /*
      The original Recent Clear handler calls the base macro refresh directly.
      That refresh can temporarily replace the shared Favorites list with the
      "No favorites" empty state and skip generated-ticket favorites. Rebuild
      Favorites from localStorage immediately after that handler finishes.
    */
    renderFavoritesFromStorage();
    updateQuickAccessCounts();
  }
  function scheduleHeal(){
    setTimeout(healFavoritesAfterRecentChange, 0);
    setTimeout(healFavoritesAfterRecentChange, 80);
    setTimeout(healFavoritesAfterRecentChange, 250);
  }
  function install(){
    document.addEventListener('click', function(event){
      if(event.target.closest && event.target.closest('#sugoClearRecentBtn')){
        scheduleHeal();
        return;
      }
      if(event.target.closest && event.target.closest('[data-sugo-fr-tab="favorites"]')){
        scheduleHeal();
      }
    }, true);
    document.addEventListener('keydown', function(event){
      if(event.key !== 'Enter' && event.key !== ' ') return;
      if(event.target.closest && event.target.closest('[data-sugo-fr-tab="favorites"]')) scheduleHeal();
    }, true);
    setTimeout(healFavoritesAfterRecentChange, 400);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  window.addEventListener('load', function(){ setTimeout(healFavoritesAfterRecentChange, 700); });

  window.SUGORecentClearFavoritesFix = {
    version: '1.0.0',
    refreshFavorites: healFavoritesAfterRecentChange
  };
})();


// ===== extracted from #sugo-sv-video-merge-20260626 =====
(function(){
  var macros = [{"id": "sv-refined-ban-fake-evidence", "enTitle": "Ban: Fake Evidence / Fake Reports", "arTitle": "الحظر بسبب الأدلة أو البلاغات المزيفة", "enFields": [{"label": "Answer", "text": "The account was banned because fake accounts or false reports were created or submitted, which is a clear violation of SUGO policies. Immediate unban is not available. The customer may wait 7 days from the ban date and then submit a formal apology request for review by the relevant department."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to clarify that the account was banned because fake accounts or false reports were created or submitted on the platform.\n\nSecond, this action is considered a clear violation of SUGO policies, so immediate unban is not available.\n\nThird, you may wait 7 days from the ban date, then contact us again to submit a formal apology request for review by the relevant department.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب إنشاء حسابات وهمية أو إرسال بلاغات مزيفة، وهذا يُعد مخالفة صريحة لسياسات سوجو. لا يتوفر فك الحظر بشكل فوري، ويمكن للعميل الانتظار لمدة 7 أيام من تاريخ الحظر ثم تقديم طلب اعتذار رسمي لمراجعته من قبل الإدارة المختصة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود توضيح أن الحساب تم حظره بسبب إنشاء حسابات وهمية أو إرسال بلاغات مزيفة على المنصة.\n\nثانياً، هذا الإجراء يُعد مخالفة صريحة لسياسات سوجو، لذلك لا يتوفر فك الحظر بشكل فوري.\n\nثالثاً، يمكنكم الانتظار لمدة 7 أيام من تاريخ الحظر، ثم التواصل معنا مرة أخرى لتقديم طلب اعتذار رسمي ليتم مراجعته من قبل الإدارة المختصة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-fake-certification", "enTitle": "Ban: Fake Certification / Identity Verification", "arTitle": "الحظر بسبب تزييف التحقق أو الهوية", "enFields": [{"label": "Answer", "text": "The account was banned because identity or gender verification was attempted using unreal or misleading photos. To review the case, the customer must send a clear selfie video while holding their national ID, with the account ID clearly visible or stated in the video. The video will be reviewed by the relevant team."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to clarify that the account was banned because identity or gender verification was attempted using unreal or misleading photos.\n\nSecond, to review the possibility of lifting the ban, please send a clear selfie video while holding your national ID next to your face.\n\nThird, please make sure your account ID is clearly visible or stated in the video so the relevant team can review the case accurately.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب محاولة تزييف التحقق من الهوية أو الجنس باستخدام صور غير حقيقية أو مضللة. لمراجعة الحالة، يجب إرسال فيديو سيلفي واضح مع حمل الهوية الوطنية، مع إظهار أو ذكر آي دي الحساب بوضوح داخل الفيديو ليتم مراجعته من قبل الفريق المختص."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود توضيح أن الحساب تم حظره بسبب محاولة تزييف التحقق من الهوية أو الجنس باستخدام صور غير حقيقية أو مضللة.\n\nثانياً، لمراجعة إمكانية رفع الحظر، يرجى إرسال فيديو سيلفي واضح مع حمل الهوية الوطنية بجانب الوجه.\n\nثالثاً، يرجى التأكد من إظهار أو ذكر آي دي الحساب بوضوح داخل الفيديو حتى يتمكن الفريق المختص من مراجعة الحالة بدقة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-male-using-female-account", "enTitle": "Ban: Male Using Female Account", "arTitle": "الحظر بسبب استخدام ذكر لحساب أنثى", "enFields": [{"label": "Answer", "text": "The account was banned because a male user appears to be using an account registered as female. To request review, the customer must submit a clear video showing the national ID to confirm gender and age, and must clearly state the account ID in the video."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to clarify that the account was banned because a male user appears to be using an account registered as female, which violates SUGO rules and policies.\n\nSecond, to request a review, please send a clear video showing your national ID to confirm gender and age.\n\nThird, please clearly state your account ID in the video so the relevant department can verify the information and review the case.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب لأن هناك استخدامًا ظاهرًا من ذكر لحساب مُسجل كأنثى، وهذا يخالف قواعد وسياسات سوجو. لمراجعة الحالة، يجب إرسال فيديو واضح تظهر فيه الهوية الوطنية لتأكيد الجنس والسن، مع ذكر آي دي الحساب بوضوح داخل الفيديو."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود توضيح أن الحساب تم حظره بسبب ظهور استخدام ذكر لحساب مُسجل كأنثى، وهذا يُعد مخالفة لقواعد وسياسات سوجو.\n\nثانياً، لطلب مراجعة الحالة، يرجى إرسال فيديو واضح تظهر فيه الهوية الوطنية لتأكيد الجنس والسن.\n\nثالثاً، يرجى ذكر آي دي الحساب بوضوح داخل الفيديو حتى تتمكن الإدارة المختصة من التحقق من البيانات ومراجعة الحالة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-unban-review-male-using-female-account-video-sent", "enTitle": "Review Sent: Male Using Female Account", "arTitle": "إرسال فيديو مراجعة حظر استخدام ذكر لحساب أنثى", "enFields": [{"label": "Answer", "text": "The customer's video was received for review. Because the account was banned due to a male using a female account, the video will be forwarded to the relevant team. The expected response time is 24 to 48 hours."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we confirm that your video has been received.\n\nSecond, because the account was banned due to a male using a female account, the video will be forwarded to the relevant team for review.\n\nThird, you will receive a response within 24 to 48 hours after the review is completed.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم استلام الفيديو الخاص بالعميل للمراجعة. وبما أن الحظر مرتبط باستخدام ذكر لحساب أنثى، سيتم إرسال الفيديو إلى الفريق المختص، وسيتم الرد خلال 24 إلى 48 ساعة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نؤكد لكم أنه تم استلام الفيديو الخاص بكم.\n\nثانياً، بما أن الحظر مرتبط باستخدام ذكر لحساب أنثى، سيتم إرسال الفيديو إلى الفريق المختص للمراجعة.\n\nثالثاً، سيتم الرد عليكم خلال 24 إلى 48 ساعة بعد إتمام المراجعة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-underage-suspicion", "enTitle": "Ban: Underage Suspicion", "arTitle": "الحظر بسبب الاشتباه بأن المستخدم أقل من السن القانوني", "enFields": [{"label": "Answer", "text": "The account was banned because the user appears to be under the legal age of 18. To request unban review, the customer must record a selfie video with an ID card or official identity document next to the face while stating their name and account ID."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to clarify that the account was banned because the user appears to be under the legal age of 18.\n\nSecond, to request a review, please record a clear selfie video with your ID card or official identity document next to your face.\n\nThird, please state your name and account ID clearly in the video so the relevant team can verify the information.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب الاشتباه بأن المستخدم أقل من السن القانوني 18 سنة. لطلب مراجعة فك الحظر، يجب تصوير فيديو سيلفي واضح مع البطاقة أو الهوية بجانب الوجه، مع ذكر الاسم وآي دي الحساب بوضوح."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود توضيح أن الحساب تم حظره بسبب الاشتباه بأن المستخدم أقل من السن القانوني 18 سنة.\n\nثانياً، لطلب مراجعة الحالة، يرجى تصوير فيديو سيلفي واضح مع البطاقة أو الهوية الرسمية بجانب الوجه.\n\nثالثاً، يرجى ذكر الاسم وآي دي الحساب بوضوح داخل الفيديو حتى يتمكن الفريق المختص من التحقق من المعلومات.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-unban-review-underage-verification-video-sent", "enTitle": "Review Sent: Underage Verification", "arTitle": "إرسال فيديو مراجعة إثبات السن", "enFields": [{"label": "Answer", "text": "The customer's age-verification video was received. Because the ban is related to underage suspicion, the video will be forwarded to the relevant team and the customer will receive a response within 24 to 48 hours."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we confirm that your age-verification video has been received.\n\nSecond, because the account was banned due to underage suspicion, the video will be forwarded to the relevant team for review.\n\nThird, you will receive a response within 24 to 48 hours after the review is completed.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم استلام فيديو إثبات السن الخاص بالعميل. وبما أن الحظر مرتبط بالاشتباه بأن المستخدم أقل من السن القانوني، سيتم إرسال الفيديو إلى الفريق المختص وسيتم الرد خلال 24 إلى 48 ساعة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نؤكد لكم أنه تم استلام فيديو إثبات السن الخاص بكم.\n\nثانياً، بما أن الحظر مرتبط بالاشتباه بأن المستخدم أقل من السن القانوني، سيتم إرسال الفيديو إلى الفريق المختص للمراجعة.\n\nثالثاً، سيتم الرد عليكم خلال 24 إلى 48 ساعة بعد إتمام المراجعة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-rejected-unban-request", "enTitle": "Rejected Unban Request", "arTitle": "رفض طلب فك الحظر", "enFields": [{"label": "Answer", "text": "The apology or unban request was reviewed by the relevant department and rejected. The ban remains active, and currently there is no alternative recovery method according to the approved app rules and policies."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we regret to inform you that your apology or unban request has been reviewed by the relevant department and was rejected.\n\nSecond, based on this decision, the account ban will remain active.\n\nThird, according to the approved SUGO rules and policies, there is currently no alternative method to recover the account.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تمت مراجعة طلب الاعتذار أو فك الحظر من قبل الإدارة المختصة وتم رفض الطلب. لذلك سيبقى الحظر مفعلًا، ولا توجد حاليًا طريقة أخرى لاستعادة الحساب وفقًا لقواعد وسياسات التطبيق المعتمدة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نأسف لإبلاغكم بأنه تمت مراجعة طلب الاعتذار أو فك الحظر من قبل الإدارة المختصة وتم رفض الطلب.\n\nثانياً، بناءً على هذا القرار، سيبقى الحظر مفعلًا على الحساب.\n\nثالثاً، وفقًا لقواعد وسياسات سوجو المعتمدة، لا توجد حاليًا طريقة أخرى لاستعادة الحساب.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-sexual-picture", "enTitle": "Ban: Sexual Picture", "arTitle": "الحظر بسبب صورة ذات إيحاءات جنسية", "enFields": [{"label": "Answer", "text": "The account was banned because it contained images containing sexual innuendo. This violates SUGO rules and may require a review or apology request according to the ban process."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to clarify that the account was banned because it contained images containing sexual innuendo.\n\nSecond, this is considered a violation of SUGO rules and policies.\n\nThird, to request a review for this case, please follow the required apology or review process after the applicable waiting period.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب وجود صور تحتوي على إيحاءات جنسية. وهذا يُعد مخالفة لقواعد وسياسات سوجو وقد يتطلب تقديم طلب مراجعة أو اعتذار حسب إجراءات الحظر."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود توضيح أن الحساب تم حظره بسبب وجود صور تحتوي على إيحاءات جنسية.\n\nثانياً، هذا يُعد مخالفة لقواعد وسياسات سوجو.\n\nثالثاً، إذا كان الاستئناف متاحًا لهذه الحالة، يرجى اتباع إجراءات الاعتذار أو المراجعة بعد مدة الانتظار المحددة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-sexual-video", "enTitle": "Ban: Sexual Video", "arTitle": "الحظر بسبب فيديو ذات إيحاءات جنسية", "enFields": [{"label": "Answer", "text": "The account was banned because it contained videos containing sexual innuendo. This violates SUGO rules and may require a review or apology request according to the ban process."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to clarify that the account was banned because it contained videos containing sexual innuendo.\n\nSecond, this is considered a violation of SUGO rules and policies.\n\nThird, to request a review for this case, please follow the required apology or review process after the applicable waiting period.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب وجود فيديوهات تحتوي على إيحاءات جنسية. وهذا يُعد مخالفة لقواعد وسياسات سوجو وقد يتطلب تقديم طلب مراجعة أو اعتذار حسب إجراءات الحظر."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود توضيح أن الحساب تم حظره بسبب وجود فيديوهات تحتوي على إيحاءات جنسية.\n\nثانياً، هذا يُعد مخالفة لقواعد وسياسات سوجو.\n\nثالثاً، إذا كان الاستئناف متاحًا لهذه الحالة، يرجى اتباع إجراءات الاعتذار أو المراجعة بعد مدة الانتظار المحددة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-sexual-moments", "enTitle": "Ban: Sexual Moments", "arTitle": "الحظر بسبب لحظات ذات إيحاءات جنسية", "enFields": [{"label": "Answer", "text": "The account was banned because it contained moments containing sexual innuendo. This violates SUGO rules and may require a review or apology request according to the ban process."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to clarify that the account was banned because it contained moments containing sexual innuendo.\n\nSecond, this is considered a violation of SUGO rules and policies.\n\nThird, to request a review for this case, please follow the required apology or review process after the applicable waiting period.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب وجود لحظات تحتوي على إيحاءات جنسية. وهذا يُعد مخالفة لقواعد وسياسات سوجو وقد يتطلب تقديم طلب مراجعة أو اعتذار حسب إجراءات الحظر."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود توضيح أن الحساب تم حظره بسبب وجود لحظات تحتوي على إيحاءات جنسية.\n\nثانياً، هذا يُعد مخالفة لقواعد وسياسات سوجو.\n\nثالثاً، إذا كان الاستئناف متاحًا لهذه الحالة، يرجى اتباع إجراءات الاعتذار أو المراجعة بعد مدة الانتظار المحددة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-sexual-messages", "enTitle": "Ban: Sexual Messages", "arTitle": "الحظر بسبب رسائل ذات إيحاءات جنسية", "enFields": [{"label": "Answer", "text": "The account was banned because it contained messages containing sexual innuendo. This violates SUGO rules and may require a review or apology request according to the ban process."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to clarify that the account was banned because it contained messages containing sexual innuendo.\n\nSecond, this is considered a violation of SUGO rules and policies.\n\nThird, to request a review for this case, please follow the required apology or review process after the applicable waiting period.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب وجود رسائل تحتوي على إيحاءات جنسية. وهذا يُعد مخالفة لقواعد وسياسات سوجو وقد يتطلب تقديم طلب مراجعة أو اعتذار حسب إجراءات الحظر."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود توضيح أن الحساب تم حظره بسبب وجود رسائل تحتوي على إيحاءات جنسية.\n\nثانياً، هذا يُعد مخالفة لقواعد وسياسات سوجو.\n\nثالثاً، إذا كان الاستئناف متاحًا لهذه الحالة، يرجى اتباع إجراءات الاعتذار أو المراجعة بعد مدة الانتظار المحددة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-sexual-commerce", "enTitle": "Ban: Sexual Commerce", "arTitle": "الحظر بسبب التجارة أو الطلبات الجنسية", "enFields": [{"label": "Answer", "text": "The account was permanently banned due to sexually explicit language and soliciting sexual relationships on SUGO. The customer may submit an appeal by sending an apology at least 7 days after the ban, if the appeal option is available."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to clarify that the account was banned due to sexually explicit language and soliciting sexual relationships on SUGO.\n\nSecond, this is considered a serious violation of SUGO rules and policies.\n\nThird, if the appeal option is available for this case, you may submit an apology request at least 7 days after the ban date for review.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب استخدام عبارات جنسية صريحة أو طلب علاقات جنسية على سوجو. يمكن تقديم التماس من خلال الاعتذار بعد مرور 7 أيام على الأقل من وقت الحظر إذا كان خيار المراجعة متاحًا."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود توضيح أن الحساب تم حظره بسبب استخدام عبارات جنسية صريحة أو طلب علاقات جنسية على سوجو.\n\nثانياً، هذا يُعد مخالفة خطيرة لقواعد وسياسات سوجو.\n\nثالثاً، إذا كان خيار الاستئناف متاحًا لهذه الحالة، يمكنكم تقديم طلب اعتذار بعد مرور 7 أيام على الأقل من تاريخ الحظر ليتم مراجعته.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-sexual-content-in-messages", "enTitle": "Ban: Sexual Content in Messages", "arTitle": "الحظر بسبب محتوى جنسي في الرسائل", "enFields": [{"label": "Answer", "text": "The account was banned for displaying sexual content in messages, which is a clear violation of SUGO rules and policies. To request a review, the customer may wait 7 days from the ban date and then submit an apology request for review by the relevant department."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to inform you that the account was banned for displaying sexual content in messages.\n\nSecond, this is a clear violation of SUGO rules and policies.\n\nThird, to request a review, please wait 7 days from the ban date, then contact us again to submit an apology request to the relevant department.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب إظهار محتوى جنسي في الرسائل، وهذا يُعد مخالفة صريحة لقواعد وسياسات سوجو. لطلب المراجعة، يمكن الانتظار لمدة 7 أيام من تاريخ الحظر ثم تقديم طلب اعتذار للإدارة المختصة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود إفادتكم بأنه تم حظر الحساب بسبب إظهار محتوى جنسي في الرسائل.\n\nثانياً، هذا يُعد مخالفة صريحة لقواعد وسياسات سوجو.\n\nثالثاً، لطلب المراجعة، يرجى الانتظار لمدة 7 أيام من تاريخ الحظر، ثم التواصل معنا مرة أخرى لتقديم طلب اعتذار إلى الإدارة المختصة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-sexual-offer", "enTitle": "Ban: Sexual Offer", "arTitle": "الحظر بسبب العروض الجنسية", "enFields": [{"label": "Answer", "text": "The account was banned because sexual offers or sexual content were posted. The customer may submit an apology request to the administration between 7 and 10 days after the ban, to request a review."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to clarify that the account was banned because sexual offers or sexual content were posted.\n\nSecond, this violates SUGO rules and policies.\n\nThird, to request a review, you may submit an apology request to the administration between 7 and 10 days after the ban date.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب نشر عروض أو محتوى جنسي. يمكن تقديم طلب اعتذار للإدارة بعد مرور أسبوع إلى 10 أيام من وقت الحظر لطلب المراجعة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود توضيح أن الحساب تم حظره بسبب نشر عروض أو محتوى جنسي.\n\nثانياً، هذا يُعد مخالفة لقواعد وسياسات سوجو.\n\nثالثاً، لطلب المراجعة، يمكنكم تقديم طلب اعتذار للإدارة بعد مرور أسبوع إلى 10 أيام من وقت الحظر.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-external-contact-phone-number", "enTitle": "Ban: External Contact / Phone Number", "arTitle": "الحظر بسبب إرسال رقم هاتف", "enFields": [{"label": "Answer", "text": "The account was banned because it promoted or shared a phone number or external contact information, which violates SUGO rules and policies. To request unban review, the customer should wait 7 days from the ban date and then submit an apology request for review."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to clarify that the account was banned because it promoted or shared a phone number or external contact information.\n\nSecond, this is considered a violation of SUGO rules and policies.\n\nThird, to request a review, please wait 7 days from the ban date, then contact us again to submit an apology request to the relevant department.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب الترويج أو مشاركة رقم هاتف أو وسيلة تواصل خارجية، وهذا يُعد مخالفة لقواعد وسياسات سوجو. لطلب مراجعة فك الحظر، يجب الانتظار لمدة 7 أيام من تاريخ الحظر ثم تقديم طلب اعتذار للمراجعة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود توضيح أن الحساب تم حظره بسبب الترويج أو مشاركة رقم هاتف أو وسيلة تواصل خارجية.\n\nثانياً، هذا يُعد مخالفة لقواعد وسياسات سوجو.\n\nثالثاً، لطلب المراجعة، يرجى الانتظار لمدة 7 أيام من تاريخ الحظر، ثم التواصل معنا مرة أخرى لتقديم طلب اعتذار إلى الإدارة المختصة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-external-contact-telegram", "enTitle": "Ban: External Contact / Telegram", "arTitle": "الحظر بسبب إرسال تيليجرام", "enFields": [{"label": "Answer", "text": "The account was banned because it promoted or shared Telegram or another external social platform, which violates SUGO rules and policies. To request unban review, the customer should wait 7 days from the ban date and then submit an apology request for review."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to clarify that the account was banned because it promoted or shared Telegram or another external social platform.\n\nSecond, this is considered a violation of SUGO rules and policies.\n\nThird, to request a review, please wait 7 days from the ban date, then contact us again to submit an apology request to the relevant department.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب الترويج أو مشاركة تيليجرام أو منصة تواصل خارجية أخرى، وهذا يُعد مخالفة لقواعد وسياسات سوجو. لطلب مراجعة فك الحظر، يجب الانتظار لمدة 7 أيام من تاريخ الحظر ثم تقديم طلب اعتذار للمراجعة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود توضيح أن الحساب تم حظره بسبب الترويج أو مشاركة تيليجرام أو منصة تواصل خارجية أخرى.\n\nثانياً، هذا يُعد مخالفة لقواعد وسياسات سوجو.\n\nثالثاً، لطلب المراجعة، يرجى الانتظار لمدة 7 أيام من تاريخ الحظر، ثم التواصل معنا مرة أخرى لتقديم طلب اعتذار إلى الإدارة المختصة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-promoting-other-platforms", "enTitle": "Ban: Promoting Other Platforms", "arTitle": "الحظر بسبب الترويج لمنصات أخرى", "enFields": [{"label": "Answer", "text": "The account was banned because it promoted or shared other social media platforms, which violates SUGO rules and policies. To request unban review, the customer should wait 7 days from the ban date and then submit an apology request for review."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to clarify that the account was banned because it promoted or shared other social media platforms.\n\nSecond, this is considered a violation of SUGO rules and policies.\n\nThird, to request a review, please wait 7 days from the ban date, then contact us again to submit an apology request to the relevant department.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب الترويج أو مشاركة منصات تواصل اجتماعي أخرى، وهذا يُعد مخالفة لقواعد وسياسات سوجو. لطلب مراجعة فك الحظر، يجب الانتظار لمدة 7 أيام من تاريخ الحظر ثم تقديم طلب اعتذار للمراجعة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود توضيح أن الحساب تم حظره بسبب الترويج أو مشاركة منصات تواصل اجتماعي أخرى.\n\nثانياً، هذا يُعد مخالفة لقواعد وسياسات سوجو.\n\nثالثاً، لطلب المراجعة، يرجى الانتظار لمدة 7 أيام من تاريخ الحظر، ثم التواصل معنا مرة أخرى لتقديم طلب اعتذار إلى الإدارة المختصة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-smoking-during-live", "enTitle": "Ban: Smoking During Live", "arTitle": "الحظر بسبب التدخين أثناء البث", "enFields": [{"label": "Answer", "text": "The account was banned because of smoking during a live stream. This violates SUGO rules and policies. Depending on the case, the customer may need to wait 7 days and submit an apology request for review."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to clarify that the account was banned because of smoking during a live stream.\n\nSecond, this is considered a violation of SUGO rules and policies.\n\nThird, to request a review, please wait 7 days from the ban date, then contact us again to submit an apology request to the relevant department.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب التدخين أثناء البث المباشر. وهذا يُعد مخالفة لقواعد وسياسات سوجو. حسب الحالة، قد يحتاج العميل إلى الانتظار لمدة 7 أيام ثم تقديم طلب اعتذار للمراجعة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود توضيح أن الحساب تم حظره بسبب التدخين أثناء البث المباشر.\n\nثانياً، هذا يُعد مخالفة لقواعد وسياسات سوجو.\n\nثالثاً، لطلب المراجعة، يرجى الانتظار لمدة 7 أيام من تاريخ الحظر، ثم التواصل معنا مرة أخرى لتقديم طلب اعتذار إلى الإدارة المختصة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-smoking-image", "enTitle": "Ban: Smoking Image", "arTitle": "الحظر بسبب صورة تدخين", "enFields": [{"label": "Answer", "text": "The account was banned because of an image showing smoking. This violates SUGO rules and policies. Depending on the case, the customer may need to wait 7 days and submit an apology request for review."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to clarify that the account was banned because of an image showing smoking.\n\nSecond, this is considered a violation of SUGO rules and policies.\n\nThird, to request a review, please wait 7 days from the ban date, then contact us again to submit an apology request to the relevant department.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب صورة تحتوي على تدخين. وهذا يُعد مخالفة لقواعد وسياسات سوجو. حسب الحالة، قد يحتاج العميل إلى الانتظار لمدة 7 أيام ثم تقديم طلب اعتذار للمراجعة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود توضيح أن الحساب تم حظره بسبب صورة تحتوي على تدخين.\n\nثانياً، هذا يُعد مخالفة لقواعد وسياسات سوجو.\n\nثالثاً، لطلب المراجعة، يرجى الانتظار لمدة 7 أيام من تاريخ الحظر، ثم التواصل معنا مرة أخرى لتقديم طلب اعتذار إلى الإدارة المختصة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-drug-use-image", "enTitle": "Ban: Drug Use Image", "arTitle": "الحظر بسبب صورة مواد مخدرة", "enFields": [{"label": "Answer", "text": "The account was banned because of an image depicting drug use. This violates SUGO rules and policies. Depending on the case, the customer may need to wait 7 days and submit an apology request for review."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to clarify that the account was banned because of an image depicting drug use.\n\nSecond, this is considered a violation of SUGO rules and policies.\n\nThird, to request a review, please wait 7 days from the ban date, then contact us again to submit an apology request to the relevant department.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب صورة تحتوي على استخدام أو تعاطي مواد مخدرة. وهذا يُعد مخالفة لقواعد وسياسات سوجو. حسب الحالة، قد يحتاج العميل إلى الانتظار لمدة 7 أيام ثم تقديم طلب اعتذار للمراجعة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود توضيح أن الحساب تم حظره بسبب صورة تحتوي على استخدام أو تعاطي مواد مخدرة.\n\nثانياً، هذا يُعد مخالفة لقواعد وسياسات سوجو.\n\nثالثاً، لطلب المراجعة، يرجى الانتظار لمدة 7 أيام من تاريخ الحظر، ثم التواصل معنا مرة أخرى لتقديم طلب اعتذار إلى الإدارة المختصة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-weapon-image", "enTitle": "Ban: Weapon Image", "arTitle": "الحظر بسبب صورة سلاح", "enFields": [{"label": "Answer", "text": "The account was banned because of an image showing a weapon. This violates SUGO rules and policies. Depending on the case, the customer may need to wait 7 days and submit an apology request for review."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to clarify that the account was banned because of an image showing a weapon.\n\nSecond, this is considered a violation of SUGO rules and policies.\n\nThird, to request a review, please wait 7 days from the ban date, then contact us again to submit an apology request to the relevant department.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب صورة تحتوي على سلاح. وهذا يُعد مخالفة لقواعد وسياسات سوجو. حسب الحالة، قد يحتاج العميل إلى الانتظار لمدة 7 أيام ثم تقديم طلب اعتذار للمراجعة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود توضيح أن الحساب تم حظره بسبب صورة تحتوي على سلاح.\n\nثانياً، هذا يُعد مخالفة لقواعد وسياسات سوجو.\n\nثالثاً، لطلب المراجعة، يرجى الانتظار لمدة 7 أيام من تاريخ الحظر، ثم التواصل معنا مرة أخرى لتقديم طلب اعتذار إلى الإدارة المختصة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-insulting-another-user", "enTitle": "Ban: Insulting Another User", "arTitle": "الحظر بسبب الإساءة إلى مستخدم آخر", "enFields": [{"label": "Answer", "text": "The account was banned because of insulting another user. This violates SUGO rules and policies. Depending on the case, the customer may need to wait 7 days and submit an apology request for review."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to clarify that the account was banned because of insulting another user.\n\nSecond, this is considered a violation of SUGO rules and policies.\n\nThird, to request a review, please wait 7 days from the ban date, then contact us again to submit an apology request to the relevant department.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب الإساءة إلى مستخدم آخر. وهذا يُعد مخالفة لقواعد وسياسات سوجو. حسب الحالة، قد يحتاج العميل إلى الانتظار لمدة 7 أيام ثم تقديم طلب اعتذار للمراجعة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود توضيح أن الحساب تم حظره بسبب الإساءة إلى مستخدم آخر.\n\nثانياً، هذا يُعد مخالفة لقواعد وسياسات سوجو.\n\nثالثاً، لطلب المراجعة، يرجى الانتظار لمدة 7 أيام من تاريخ الحظر، ثم التواصل معنا مرة أخرى لتقديم طلب اعتذار إلى الإدارة المختصة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-drug-use-during-live", "enTitle": "Ban: Drug Use During Live", "arTitle": "الحظر بسبب تعاطي مواد مخدرة أثناء البث", "enFields": [{"label": "Answer", "text": "The account was banned because of using or consuming narcotics during a live stream, which is a clear violation of SUGO rules and policies. To request review, the customer should wait 7 days from the ban date and then submit a formal apology and pledge not to repeat the violation."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to inform you that the account was banned because of using or consuming narcotics during a live stream.\n\nSecond, this is a clear violation of SUGO rules and policies.\n\nThird, to request a review, please wait 7 days from the ban date, then contact us again to submit a formal apology and a pledge not to repeat the violation. The request will be forwarded to the relevant department for review.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب تعاطي أو شرب مواد مخدرة أثناء البث المباشر، وهذا يُعد مخالفة صريحة لقواعد وسياسات سوجو. لطلب المراجعة، يجب الانتظار لمدة 7 أيام من تاريخ الحظر ثم تقديم اعتذار رسمي وتعهد بعدم تكرار المخالفة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود إفادتكم بأنه تم حظر الحساب بسبب تعاطي أو شرب مواد مخدرة أثناء البث المباشر.\n\nثانياً، هذا يُعد مخالفة صريحة لقواعد وسياسات سوجو.\n\nثالثاً، لطلب المراجعة، يرجى الانتظار لمدة 7 أيام من تاريخ الحظر، ثم التواصل معنا مرة أخرى لتقديم اعتذار رسمي وتعهد بعدم تكرار المخالفة، وسيتم رفع الطلب إلى الإدارة المختصة للمراجعة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-weapon-during-live", "enTitle": "Ban: Weapon During Live", "arTitle": "الحظر بسبب إظهار سلاح أثناء البث", "enFields": [{"label": "Answer", "text": "The account was banned because of displaying a weapon during a live stream, which is a clear violation of SUGO rules and policies. To request review, the customer should wait 7 days from the ban date and then submit a formal apology and pledge not to repeat the violation."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to inform you that the account was banned because of displaying a weapon during a live stream.\n\nSecond, this is a clear violation of SUGO rules and policies.\n\nThird, to request a review, please wait 7 days from the ban date, then contact us again to submit a formal apology and a pledge not to repeat the violation. The request will be forwarded to the relevant department for review.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب إظهار سلاح أثناء البث المباشر، وهذا يُعد مخالفة صريحة لقواعد وسياسات سوجو. لطلب المراجعة، يجب الانتظار لمدة 7 أيام من تاريخ الحظر ثم تقديم اعتذار رسمي وتعهد بعدم تكرار المخالفة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود إفادتكم بأنه تم حظر الحساب بسبب إظهار سلاح أثناء البث المباشر.\n\nثانياً، هذا يُعد مخالفة صريحة لقواعد وسياسات سوجو.\n\nثالثاً، لطلب المراجعة، يرجى الانتظار لمدة 7 أيام من تاريخ الحظر، ثم التواصل معنا مرة أخرى لتقديم اعتذار رسمي وتعهد بعدم تكرار المخالفة، وسيتم رفع الطلب إلى الإدارة المختصة للمراجعة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-insulting-country", "enTitle": "Ban: Insulting a Country", "arTitle": "الحظر بسبب الإساءة إلى دولة", "enFields": [{"label": "Answer", "text": "The account was banned for insulting an entire country, which is a clear violation of SUGO rules and policies. To request review, the customer should wait 7 days from the ban date and then submit an apology request for review."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to inform you that the account was banned for insulting an entire country.\n\nSecond, this is considered a clear violation of SUGO rules and policies.\n\nThird, to request a review, please wait 7 days from the ban date, then contact us again to submit an apology request to the relevant department.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب توجيه إهانة إلى دولة كاملة، وهذا يُعد مخالفة صريحة لقواعد وسياسات سوجو. لطلب المراجعة، يجب الانتظار لمدة 7 أيام من تاريخ الحظر ثم تقديم طلب اعتذار للمراجعة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود إعلامكم بأن الحساب تم حظره بسبب توجيه إهانة إلى دولة كاملة.\n\nثانياً، هذا يُعد مخالفة صريحة لقواعد وسياسات سوجو.\n\nثالثاً، لطلب المراجعة، يرجى الانتظار لمدة 7 أيام من تاريخ الحظر، ثم التواصل معنا مرة أخرى لتقديم طلب اعتذار إلى الإدارة المختصة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-insulting-religion", "enTitle": "Ban: Insulting Religion", "arTitle": "الحظر بسبب الإساءة إلى ديانة", "enFields": [{"label": "Answer", "text": "The account was banned for insulting a religion, which is a clear violation of SUGO rules and policies. To request review, the customer should wait 7 days from the ban date and then submit an apology request for review."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to inform you that the account was banned for insulting a religion.\n\nSecond, this is considered a clear violation of SUGO rules and policies.\n\nThird, to request a review, please wait 7 days from the ban date, then contact us again to submit an apology request to the relevant department.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب توجيه إهانة إلى ديانة، وهذا يُعد مخالفة صريحة لقواعد وسياسات سوجو. لطلب المراجعة، يجب الانتظار لمدة 7 أيام من تاريخ الحظر ثم تقديم طلب اعتذار للمراجعة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود إعلامكم بأن الحساب تم حظره بسبب توجيه إهانة إلى ديانة.\n\nثانياً، هذا يُعد مخالفة صريحة لقواعد وسياسات سوجو.\n\nثالثاً، لطلب المراجعة، يرجى الانتظار لمدة 7 أيام من تاريخ الحظر، ثم التواصل معنا مرة أخرى لتقديم طلب اعتذار إلى الإدارة المختصة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-child-safety-violation", "enTitle": "Ban: Child Safety Violation", "arTitle": "الحظر بسبب مخالفة حماية الأطفال", "enFields": [{"label": "Answer", "text": "The account was banned because content involving a child was displayed in an inappropriate or unsafe manner, which violates SUGO child-safety rules. To request review, the customer should wait 7 days from the ban date and then submit an apology request for review."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to inform you that the account was banned because content involving a child was displayed in an inappropriate or unsafe manner.\n\nSecond, this is considered a serious violation of SUGO child-safety rules and policies.\n\nThird, to request a review, please wait 7 days from the ban date, then contact us again to submit an apology request to the relevant department.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب عرض محتوى يتعلق بطفل بطريقة غير مناسبة أو غير آمنة، وهذا يُعد مخالفة لقواعد سوجو الخاصة بحماية الأطفال. لطلب المراجعة، يجب الانتظار لمدة 7 أيام من تاريخ الحظر ثم تقديم طلب اعتذار للمراجعة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود إعلامكم بأن الحساب تم حظره بسبب عرض محتوى يتعلق بطفل بطريقة غير مناسبة أو غير آمنة.\n\nثانياً، هذا يُعد مخالفة خطيرة لقواعد وسياسات سوجو الخاصة بحماية الأطفال.\n\nثالثاً، لطلب المراجعة، يرجى الانتظار لمدة 7 أيام من تاريخ الحظر، ثم التواصل معنا مرة أخرى لتقديم طلب اعتذار إلى الإدارة المختصة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-pretending-to-be-management", "enTitle": "Ban: Pretending to Be Management", "arTitle": "الحظر بسبب ادعاء الانتماء لإدارة سوجو", "enFields": [{"label": "Answer", "text": "The account was banned for falsely claiming affiliation with SUGO management. To request review, the customer should wait 7 days from the ban date and then submit an apology request for review by the relevant department."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to inform you that the account was banned for falsely claiming affiliation with SUGO management.\n\nSecond, this is considered a violation of SUGO rules and policies.\n\nThird, to request a review, please wait 7 days from the ban date, then contact us again to submit an apology request to the relevant department.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب ادعاء الانتماء إلى إدارة سوجو، وهذا يُعد مخالفة لسياسات وقواعد التطبيق. لطلب المراجعة، يجب الانتظار لمدة 7 أيام من تاريخ الحظر ثم تقديم طلب اعتذار للإدارة المختصة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود إفادتكم بأن الحساب تم حظره بسبب ادعاء الانتماء إلى إدارة سوجو.\n\nثانياً، هذا يُعد مخالفة لسياسات وقواعد سوجو.\n\nثالثاً، لطلب المراجعة، يرجى الانتظار لمدة 7 أيام من تاريخ الحظر، ثم التواصل معنا مرة أخرى لتقديم طلب اعتذار إلى الإدارة المختصة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-pretending-to-be-a-coin-seller", "enTitle": "Ban: Pretending to Be a Coin Seller", "arTitle": "الحظر بسبب ادعاء العمل كوكيل شحن", "enFields": [{"label": "Answer", "text": "The account was banned for falsely claiming to operate as a coin recharge agency. To request review, the customer should wait 7 days from the ban date and then submit an apology request for review by the relevant department."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to inform you that the account was banned for falsely claiming to operate as a coin recharge agency.\n\nSecond, this is considered a violation of SUGO rules and policies.\n\nThird, to request a review, please wait 7 days from the ban date, then contact us again to submit an apology request to the relevant department.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب ادعاء العمل كوكالة شحن كوينز، وهذا يُعد مخالفة لسياسات وقواعد سوجو. لطلب المراجعة، يجب الانتظار لمدة 7 أيام من تاريخ الحظر ثم تقديم طلب اعتذار للإدارة المختصة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود إفادتكم بأنه تم حظر الحساب بسبب ادعاء العمل كوكالة شحن كوينز.\n\nثانياً، هذا يُعد مخالفة لسياسات وقواعد سوجو.\n\nثالثاً، لطلب المراجعة، يرجى الانتظار لمدة 7 أيام من تاريخ الحظر، ثم التواصل معنا مرة أخرى لتقديم طلب اعتذار إلى الإدارة المختصة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-refund-illegal-coin-redemption", "enTitle": "Ban: Refund / Illegal Coin Redemption", "arTitle": "الحظر بسبب استرداد أو استرجاع كوينز بطريقة غير شرعية", "enFields": [{"label": "Answer", "text": "The account was banned due to an illegal coin refund or redemption attempt. Coins are non-refundable according to SUGO policies. If the customer wants to request unban, they must provide a valid WhatsApp number so the responsible team can contact them and complete the required settlement procedures."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to clarify that the account was banned due to an illegal coin refund or redemption attempt.\n\nSecond, according to SUGO policies, coins are non-refundable.\n\nThird, if you wish to request unban review, please provide a valid WhatsApp number so the responsible team can contact you directly and complete the required settlement procedures.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم حظر الحساب بسبب محاولة استرداد أو استرجاع كوينز بطريقة غير شرعية. ووفقًا لسياسات سوجو، الكوينز غير قابلة للاسترجاع. إذا أراد العميل طلب فك الحظر، يجب تزويد الدعم برقم واتساب فعال حتى تتواصل الجهة المختصة وتستكمل إجراءات التسوية المطلوبة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود توضيح أن الحساب تم حظره بسبب محاولة استرداد أو استرجاع كوينز بطريقة غير شرعية.\n\nثانياً، وفقًا لسياسات سوجو، الكوينز غير قابلة للاسترجاع.\n\nثالثاً، إذا كنتم ترغبون في طلب مراجعة فك الحظر، يرجى تزويدنا برقم واتساب فعال حتى تتواصل معكم الجهة المختصة مباشرة وتستكمل إجراءات التسوية المطلوبة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-ban-vpn-region-violation", "enTitle": "Ban: Simulator / VPN / Region Violation", "arTitle": "الحظر بسبب المحاكي أو VPN أو مخالفة المنطقة", "enFields": [{"label": "Answer", "text": "The account was suspended due to suspected use of emulator or VPN tools, including possible registration inside the Middle East region while being located outside it, or creating multiple accounts from the same IP. According to policy, the account cannot be unbanned or reactivated in this case."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, we would like to clarify that the account was suspended due to suspected use of emulator or VPN tools, or registration behavior that violates the regional rules of the platform.\n\nSecond, this may include creating multiple accounts from the same IP address or registering within the Middle East region while being located outside it.\n\nThird, according to SUGO policies, we are unable to lift the ban or reactivate the account in this case.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "تم تعليق الحساب بسبب الاشتباه باستخدام برامج محاكاة أو أدوات VPN، أو وجود سلوك تسجيل يخالف قواعد المنطقة، مثل إنشاء عدة حسابات من نفس عنوان IP أو التسجيل داخل نطاق الشرق الأوسط مع التواجد خارجه. ووفقًا للسياسات، لا يمكن فك الحظر أو إعادة تفعيل الحساب في هذه الحالة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، نود توضيح أن الحساب تم تعليقه بسبب الاشتباه باستخدام برامج محاكاة أو أدوات VPN أو وجود سلوك تسجيل يخالف قواعد المنطقة الخاصة بالمنصة.\n\nثانياً، قد يشمل ذلك إنشاء عدة حسابات من نفس عنوان IP أو التسجيل داخل نطاق الشرق الأوسط مع التواجد خارجه.\n\nثالثاً، وفقًا لسياسات سوجو، لا يمكن فك الحظر أو إعادة تفعيل الحساب في هذه الحالة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-request-unban-apology", "enTitle": "Request Unban / Apology", "arTitle": "طلب فك الحظر أو الاعتذار", "enFields": [{"label": "Answer", "text": "To submit an unban request, the customer must send one message that includes an apology for the violation and a clear pledge not to repeat anything that violates SUGO rules. The apology and pledge should be sent together in one message for review."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, to submit an unban request, please send us one message that includes a clear apology for the violation that occurred.\n\nSecond, the same message must include a clear pledge that you will not repeat anything that violates SUGO rules.\n\nThird, please send the apology and pledge together in one message so the request can be submitted for review.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "لتقديم طلب فك الحظر، يجب أن يرسل العميل رسالة واحدة تتضمن اعتذارًا واضحًا عن المخالفة التي حدثت وتعهدًا بعدم تكرار أي شيء يخالف قواعد سوجو. يجب أن يكون الاعتذار والتعهد في رسالة واحدة للمراجعة."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، لتقديم طلب فك الحظر، يرجى إرسال رسالة واحدة تتضمن اعتذارًا واضحًا عن المخالفة التي حدثت.\n\nثانياً، يجب أن تتضمن نفس الرسالة تعهدًا واضحًا بعدم تكرار أي شيء يخالف قواعد سوجو.\n\nثالثاً، يرجى إرسال الاعتذار والتعهد معًا في رسالة واحدة حتى يتم تقديم الطلب للمراجعة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-medium-risk-requirements", "enTitle": "Medium Risk Requirements", "arTitle": "متطلبات فك حظر Medium Risk", "enFields": [{"label": "Answer", "text": "To lift a medium-risk restriction, the customer must complete all required steps: gender/type verification, profile verification, phone number verification, recharge 2400 coins or more, and join an agency for female accounts only. The restriction may be lifted within one hour after completing all required stages or the final remaining stage."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, please note that all required stages must be completed before the account can be reviewed for lifting the restriction.\n\nSecond, the required stages include gender or account-type verification, profile verification, phone number verification, and recharging 2400 coins or more.\n\nThird, for female accounts only, joining an agency may also be required. After all required stages, or the final remaining stage, are completed, the restriction may be lifted within approximately one hour.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "لفك تقييد Medium Risk يجب إكمال جميع المتطلبات: التحقق من النوع أو الجنس، تحقق البروفايل، التحقق من رقم الهاتف، شحن 2400 كوين أو أكثر، والانضمام إلى وكالة لحسابات البنات فقط. يمكن رفع الحظر خلال ساعة تقريبًا بعد إكمال جميع المراحل المطلوبة أو المرحلة الأخيرة المتبقية."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، يرجى العلم أنه يجب إكمال جميع المراحل المطلوبة حتى يمكن مراجعة الحساب لرفع التقييد.\n\nثانياً، تشمل المتطلبات التحقق من النوع أو الجنس، تحقق البروفايل، التحقق من رقم الهاتف، وشحن 2400 كوين أو أكثر.\n\nثالثاً، بالنسبة لحسابات البنات فقط، قد يكون الانضمام إلى وكالة مطلوبًا أيضًا. بعد إكمال جميع المراحل المطلوبة أو المرحلة الأخيرة المتبقية، قد يتم رفع التقييد خلال ساعة تقريبًا.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-add-remove-withdrawal-option", "enTitle": "Add / Remove Withdrawal Option", "arTitle": "إضافة أو إزالة خيار السحب", "enFields": [{"label": "Answer", "text": "To add or remove a withdrawal option, the customer must submit the request through the official form. The request will be reviewed and processed within 24 to 48 hours after submission."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, to add or remove a withdrawal option, please submit your request through the official form below.\n\nSecond, form link:\nhttps://micoworld.feishu.cn/share/base/form/shrcnm0SCrveAVtp0l5m25MBF8e\n\nThird, the request will be reviewed and processed within 24 to 48 hours after submission.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "لإضافة أو إزالة خيار السحب، يجب تقديم الطلب من خلال الرابط الرسمي. سيتم مراجعة الطلب وتنفيذه خلال 24 إلى 48 ساعة من وقت التقديم."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، لإضافة أو إزالة خيار السحب، يرجى تقديم الطلب من خلال الرابط الرسمي التالي.\n\nثانياً، رابط الطلب:\nhttps://micoworld.feishu.cn/share/base/form/shrcnm0SCrveAVtp0l5m25MBF8e\n\nثالثاً، سيتم مراجعة الطلب وتنفيذه خلال 24 إلى 48 ساعة من وقت التقديم.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-coins-not-received-from-agent", "enTitle": "Coins Not Received from Agent Recharge", "arTitle": "عدم وصول الكوينز بعد الشحن من الوكيل", "enFields": [{"label": "Answer", "text": "Coins recharged through agents may take up to 24 hours to arrive. If more than 24 hours have passed and the coins have not arrived, the customer must send a screen recording from the conversation showing the account ID and proof of the recharge request."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, please note that coin recharge through agents may take up to 24 hours to arrive.\n\nSecond, if more than 24 hours have passed and the coins have not arrived, please send a clear screen recording of the conversation with the agent.\n\nThird, the recording must clearly show your account ID and the recharge request details so we can check the case accurately.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "الشحن من خلال الوكلاء قد يستغرق حتى 24 ساعة للوصول. إذا مر أكثر من 24 ساعة ولم تصل الكوينز، يجب إرسال تسجيل شاشة من المحادثة يوضح آي دي الحساب وإثبات طلب الشحن."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، يرجى العلم أن الشحن من خلال الوكلاء قد يستغرق حتى 24 ساعة للوصول.\n\nثانياً، إذا مر أكثر من 24 ساعة ولم تصل الكوينز، يرجى إرسال تسجيل شاشة واضح من المحادثة مع الوكيل.\n\nثالثاً، يجب أن يظهر في التسجيل آي دي الحساب وتفاصيل طلب الشحن بوضوح حتى نتمكن من فحص الحالة بدقة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-coins-received-after-review", "enTitle": "Coins Received After Review", "arTitle": "تأكيد وصول الكوينز بعد المراجعة", "enFields": [{"label": "Answer", "text": "After reviewing the account, all coins were confirmed as received. The customer should check the coin history inside the app to confirm the transactions."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, after reviewing your account, we confirmed that all coins have already been received.\n\nSecond, please check your coin history inside the SUGO app to review the transaction details.\n\nThird, if you still believe there is a missing amount, please send a clear screenshot or screen recording showing the coin history and the related recharge details.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "بعد مراجعة الحساب، تم التأكد من وصول جميع الكوينز. يجب على العميل التحقق من سجل الكوينز داخل التطبيق لمراجعة تفاصيل العمليات."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، بعد مراجعة حسابكم، تم التأكد من وصول جميع الكوينز بالفعل.\n\nثانياً، يرجى التحقق من سجل الكوينز داخل تطبيق سوجو لمراجعة تفاصيل العمليات.\n\nثالثاً، إذا كنتم ما زلتم تعتقدون بوجود مبلغ ناقص، يرجى إرسال لقطة شاشة أو تسجيل شاشة واضح يوضح سجل الكوينز وتفاصيل عملية الشحن المرتبطة.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}, {"id": "sv-refined-report-defaming-case", "enTitle": "Report Defaming / Reputation Abuse", "arTitle": "بلاغ تشهير أو إساءة للسمعة", "enFields": [{"label": "Answer", "text": "Use this when a customer reports defaming or reputation abuse. Ask for the violator ID, clear screenshots or screen recording, the date and time, and a short description of what happened before escalation."}, {"label": "Ticket", "text": "Welcome to the SUGO family!\nWe sincerely apologize for the issue you are experiencing.\n\nFirst, to help us review the defaming or reputation-abuse report accurately, please provide the violator account ID.\n\nSecond, please send clear screenshots or a screen recording showing the abusive content, along with the date and time of the incident.\n\nThird, please include a short description of what happened so the relevant team can review the case properly.\n\nWe once again sincerely apologize for the inconvenience we have caused, and we truly thank you for your patience and understanding. We wish you a happy and successful day!\n\nSUGO Customer Service Team and cooperation.\n\nSUGO Customer Support Team"}], "arFields": [{"label": "الإجابة", "text": "يستخدم هذا النص عند بلاغ العميل عن تشهير أو إساءة للسمعة. يجب طلب آي دي المخالف، لقطات شاشة أو تسجيل شاشة واضح، تاريخ ووقت الحادثة، ووصف مختصر لما حدث قبل التصعيد."}, {"label": "التذكرة", "text": "مرحباً بك في عائلة سوجو!\nنعتذر جداً على المشكلة التي تواجهك\n\nأولاً، حتى نتمكن من مراجعة بلاغ التشهير أو الإساءة للسمعة بدقة، يرجى تزويدنا بآي دي الحساب المخالف.\n\nثانياً، يرجى إرسال لقطات شاشة أو تسجيل شاشة واضح يظهر المحتوى المسيء، مع توضيح تاريخ ووقت الحادثة.\n\nثالثاً، يرجى إضافة وصف مختصر لما حدث حتى يتمكن الفريق المختص من مراجعة الحالة بشكل صحيح.\n\nنشكركم على تفهمكم وتعاونكم.\n\nفريق خدمة عملاء سوجو"}]}];
  if (typeof window.setPane === 'function' && typeof window.createSupportMacroContent === 'function') {
    macros.forEach(function(m) {
      window.setPane(m.id, window.createSupportMacroContent(m.enTitle, m.enFields, m.arTitle, m.arFields));
    });
  }
  function attachButton(btn, paneId) {
    if (!btn) return;
    btn.onclick = function(e) {
      if (e && e.stopPropagation) e.stopPropagation();
      if (typeof window.showPane === 'function') window.showPane(paneId, true);
    };
  }
  function appendPaneButton(groupId, paneId, label) {
    if (document.querySelector('.nav-l000-btn[data-pane="' + paneId + '"]')) {
      attachButton(document.querySelector('.nav-l000-btn[data-pane="' + paneId + '"]'), paneId);
      return;
    }
    var groupBtn = document.querySelector('.nav-l00-btn[data-l00="' + groupId + '"]');
    if (!groupBtn) return;
    var parent = groupBtn.closest ? groupBtn.closest('.nav-l00') : null;
    var children = parent ? parent.querySelector('.nav-l00-children') : null;
    if (!children) return;
    var btn = document.createElement('button');
    btn.className = 'nav-l000-btn';
    btn.setAttribute('data-pane', paneId);
    btn.textContent = label;
    children.appendChild(btn);
    attachButton(btn, paneId);
  }
  var nav = [["sv-better-ban-restriction-management-general-ban-handling", "sv-refined-ban-fake-evidence", "Ban: Fake Evidence / False Reports"], ["sv-better-ban-restriction-management-general-ban-handling", "sv-refined-ban-fake-certification", "Ban: Fake Certification"], ["sv-better-ban-restriction-management-general-ban-handling", "sv-refined-rejected-unban-request", "Rejected Unban Request"], ["sv-better-ban-restriction-management-general-ban-handling", "sv-refined-ban-refund-illegal-coin-redemption", "Ban: Refund / Illegal Coin Redemption"], ["sv-better-ban-restriction-management-safety-prohibited-content", "sv-refined-ban-insulting-country", "Ban: Insulting Country"], ["sv-better-ban-restriction-management-safety-prohibited-content", "sv-refined-ban-insulting-religion", "Ban: Insulting Religion"], ["sv-better-ban-restriction-management-safety-prohibited-content", "sv-refined-ban-child-safety-violation", "Ban: Child Safety Violation"], ["sv-better-reports-abuse-evidence-abuse-reports", "sv-refined-report-defaming-case", "Report Defaming / Reputation Abuse"], ["sv-better-recharge-coins-vip-payment-problems-evidence", "sv-refined-coins-not-received-from-agent", "Coins Not Received from Agent"], ["sv-better-recharge-coins-vip-payment-problems-evidence", "sv-refined-coins-received-after-review", "Coins Received After Review"]];
  function installNav() {
    nav.forEach(function(item) { appendPaneButton(item[0], item[1], item[2]); });
    try { window.sugoTopicsCache = null; } catch(e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installNav);
  else installNav();
  window.SUGOSVVideoMerge20260626 = { version: '1.0.0', count: macros.length };
})();


// ===== extracted from #sugo-speed-complete-answer-upgrade-v6 =====
(function(){
  'use strict';
  if(window.__SUGO_SPEED_COMPLETE_ANSWER_V6__) return;
  window.__SUGO_SPEED_COMPLETE_ANSWER_V6__ = true;

  var VERSION = '6.0.0-speed-precision-complete';
  var debounceMs = 110;
  var bodyLimitPerTopic = 22000;
  var maxVisibleResults = 72;
  var maxOpenPaths = 4;
  var timer = null;
  var frame = null;
  var index = null;
  var composing = false;
  var oldGetRelevant = window.getRelevantKnowledgeBaseText;

  function esc(value){
    if(typeof window.escapeHtml === 'function') return window.escapeHtml(String(value || ''));
    return String(value || '').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
  }
  function norm(value){
    return String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[إأآٱا]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/گ/g, 'ك')
      .replace(/پ/g, 'ب')
      .replace(/چ/g, 'ج')
      .replace(/ڤ/g, 'ف')
      .replace(/ـ/g, '')
      .replace(/\bpass\s*word\b/g, 'password')
      .replace(/\bsign\s*in\b/g, 'login')
      .replace(/\blog\s*in\b/g, 'login')
      .replace(/\bphone\s*number\b/g, 'phone')
      .replace(/\bmobile\s*number\b/g, 'phone')
      .replace(/\buser\s*id\b/g, 'id')
      .replace(/\baccount\s*id\b/g, 'id')
      .replace(/\bsub\s*agency\b/g, 'subagency')
      .replace(/\bmain\s*agency\b/g, 'mainagency')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function stripAl(t){ t = String(t || ''); return t.length > 4 && t.indexOf('ال') === 0 ? t.slice(2) : t; }
  var STOP = new Set(('the is a an to of and or for in on how what do does did i my it this that with can are be please explain whole process from you need customer client issue problem case help me please dear' +
    ' من في على عن هل كيف ما ماذا الى إلى او أو مع هذا هذه لو اذا إذا بدي اريد أريد شو ليش العميل المستخدم مشكله مشكلة موضوع حاله حالة بسبب عند عندي انا انت هو هي رجاء').split(/\s+/).filter(Boolean));
  var GROUPS = (window.SUGO_PRECISION_SEARCH && window.SUGO_PRECISION_SEARCH.groups) || {};
  if(!Object.keys(GROUPS).length){
    GROUPS = {
      password:['password','باسورد','كلمة السر','كلمة السر','reset password'], phone:['phone','mobile','رقم الهاتف','هاتف','موبايل','ربط رقم','تغيير رقم'], sms:['sms','otp','code','كود','رمز التحقق'],
      ban:['ban','banned','blocked','حظر','محظور','باند','تقييد'], unban:['unban','appeal','فك حظر','رفع الحظر','استئناف'], report:['report','abuse','بلاغ','ابلاغ','اساءة','إساءة'],
      recharge:['recharge','payment','coins','invoice','شحن','دفع','كوين','فاتورة'], withdrawal:['withdrawal','salary','diamonds','سحب','راتب','ماسات'], agency:['agency','host','وكالة','وكاله','مضيف','مضيفه'],
      game:['game','games','لعبة','لعبه','العاب'], location:['location','country','distance','موقع','دولة','دوله','مسافة'], crash:['crash','bug','freeze','كراش','تعطل','يعلق']
    };
  }
  function tokens(value, keepStop){
    var n = norm(value);
    if(!n) return [];
    var arr = n.split(/\s+/).map(stripAl).filter(function(t){ return t && t.length > 1; });
    if(!keepStop) arr = arr.filter(function(t){ return !STOP.has(t); });
    return Array.from(new Set(arr));
  }
  function has(hay, phrase){
    phrase = norm(phrase);
    if(!phrase) return false;
    return phrase.length <= 3 ? (' ' + hay + ' ').indexOf(' ' + phrase + ' ') >= 0 : hay.indexOf(phrase) >= 0;
  }
  function phraseVariants(value){
    var n = norm(value); if(!n) return [];
    var out = new Set([n]);
    n.split(/\s+/).forEach(function(t){ if(t) out.add(stripAl(t)); });
    return Array.from(out).filter(Boolean);
  }
  function expand(query){
    var q = norm(query);
    var original = tokens(query, false);
    var expanded = new Set(original);
    var groups = [];
    Object.keys(GROUPS).forEach(function(g){
      var terms = [];
      (GROUPS[g] || []).forEach(function(term){ phraseVariants(term).forEach(function(v){ terms.push(v); }); });
      if(terms.some(function(term){ return has(q, term); })){
        groups.push(g); expanded.add(g);
        terms.forEach(function(term){ tokens(term, true).forEach(function(t){ if(!STOP.has(t)) expanded.add(t); }); });
      }
    });
    return { raw:q, original:original, expanded:Array.from(expanded), groups:groups };
  }
  function label(node, selector){
    try{ var span = node && node.querySelector(':scope > ' + selector + ' span'); return span ? (span.textContent || '').replace(/\s+/g,' ').trim() : ''; }catch(e){ return ''; }
  }
  function htmlToText(html){
    var tmp = document.createElement('div'); tmp.innerHTML = String(html || ''); return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
  }
  function paneText(id){
    try{
      var item = (typeof sugoGetPaneIndexEntry === 'function') ? sugoGetPaneIndexEntry(id) : null;
      if(item) return { en:item.enText || '', ar:item.arText || '', all:[item.enText || '', item.arText || '', item.bodyNorm || '', item.allText || '', item.searchText || ''].join('\n') };
      if(typeof paneContent !== 'undefined' && paneContent[id]){
        var html = paneContent[id].en || paneContent[id].html || '';
        var tmp = document.createElement('div'); tmp.innerHTML = html;
        var divs = tmp.querySelectorAll('.lang-divider');
        var en = '', ar = '';
        if(divs.length >= 1 && divs[0].nextElementSibling) en = (divs[0].nextElementSibling.textContent || '').trim();
        if(divs.length >= 2 && divs[1].nextElementSibling) ar = (divs[1].nextElementSibling.textContent || '').trim();
        if(!en && !ar) en = htmlToText(html);
        return { en:en, ar:ar, all:[en, ar].join('\n') };
      }
      return { en:'', ar:'', all:'' };
    }catch(e){ return { en:'', ar:'', all:'' }; }
  }
  function buildIndex(){
    var buttons = Array.prototype.slice.call(document.querySelectorAll('.nav-l000-btn[data-pane]'));
    index = buttons.map(function(btn){
      var id = btn.getAttribute('data-pane') || '';
      var l00 = btn.closest('.nav-l00'), l0 = btn.closest('.nav-l0'), root = btn.closest('.nav-lroot');
      var title = (btn.textContent || '').replace(/\s+/g, ' ').trim() || id.replace(/-/g, ' ');
      var section = label(l00, '.nav-l00-btn'), category = label(l0, '.nav-l0-btn'), library = label(root, '.nav-lroot-btn');
      var path = [library, category, section].filter(Boolean).join(' › ');
      var text = paneText(id);
      var titleNorm = norm([id.replace(/-/g,' '), title].join(' '));
      var pathNorm = norm(path);
      var bodyNorm = norm(text.all).slice(0, 42000);
      return { id:id, btn:btn, l00:l00, l0:l0, root:root, title:title, section:section, category:category, library:library, path:path, enText:text.en, arText:text.ar, titleNorm:titleNorm, pathNorm:pathNorm, bodyNorm:bodyNorm, allNorm:norm([id.replace(/-/g,' '), title, path, text.all].join(' ')).slice(0, 52000) };
    });
    return index;
  }
  function getIndex(){ return index || buildIndex(); }
  function score(item, info){
    var score = 0, hits = [];
    if(info.raw && info.raw.length >= 3){
      if(has(item.titleNorm, info.raw)){ score += 110; hits.push(info.raw); }
      else if(has(item.pathNorm, info.raw)){ score += 70; hits.push(info.raw); }
      else if(has(item.bodyNorm, info.raw)){ score += 38; hits.push(info.raw); }
      else if(has(item.allNorm, info.raw)){ score += 28; hits.push(info.raw); }
    }
    info.groups.forEach(function(g){
      var terms = [];
      (GROUPS[g] || []).forEach(function(term){ phraseVariants(term).forEach(function(v){ terms.push(v); }); });
      if(terms.some(function(t){ return has(item.titleNorm, t); })){ score += 54; hits.push(g); }
      else if(terms.some(function(t){ return has(item.pathNorm, t); })){ score += 36; hits.push(g); }
      else if(terms.some(function(t){ return has(item.bodyNorm, t); })){ score += 20; hits.push(g); }
    });
    info.expanded.forEach(function(w){
      if(!w || w.length < 2 || STOP.has(w)) return;
      if(has(item.titleNorm, w)){ score += 22; hits.push(w); }
      else if(item.titleNorm.indexOf(w) >= 0){ score += 14; hits.push(w); }
      if(has(item.pathNorm, w)){ score += 12; hits.push(w); }
      else if(item.pathNorm.indexOf(w) >= 0){ score += 7; hits.push(w); }
      if(has(item.bodyNorm, w)){ score += 4.8; hits.push(w); }
    });
    var coverage = info.original.length ? info.original.filter(function(t){ return has(item.allNorm, t); }).length / info.original.length : 0;
    if(coverage >= 0.8) score += 22;
    else if(coverage >= 0.55) score += 13;
    else if(info.original.length >= 3 && coverage < 0.34) score -= 10;
    if(/optimized|placeholder/.test(item.id)) score -= 4;
    return Object.assign({}, item, { score:Math.max(0, score), hits:Array.from(new Set(hits)).slice(0,8), coverage:Math.round(coverage*100)/100 });
  }
  function rank(query){
    var info = expand(query);
    return getIndex().map(function(item){ return score(item, info); }).filter(function(x){ return x.score > 0; }).sort(function(a,b){
      if(b.score !== a.score) return b.score - a.score;
      if(b.coverage !== a.coverage) return b.coverage - a.coverage;
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
  }
  function setHidden(el, hidden){ if(!el) return; el.classList.toggle('hidden-search', !!hidden); }
  function setOpen(el, open){ if(!el) return; el.classList.toggle('open', !!open); }
  function clearSearch(){
    getIndex().forEach(function(item){ setHidden(item.btn, false); });
    document.querySelectorAll('.nav-l00,.nav-l0,.nav-lroot').forEach(function(el){ setHidden(el, false); });
    var nr = document.getElementById('noResults'); if(nr) nr.style.display = 'none';
    var panel = document.getElementById('v51BestMatchPanel'); if(panel){ panel.style.display='none'; panel.innerHTML=''; }
  }
  function confidence(best, second){
    if(!best) return { label:'Low', className:'ai-source-low', score:0 };
    var gap = second ? best.score - second.score : best.score;
    var high = best.score >= 90 && gap >= Math.max(10, best.score * 0.1);
    var medium = best.score >= 38;
    return { label: high ? 'High' : (medium ? 'Medium' : 'Low'), className: high ? 'ai-source-high' : (medium ? 'ai-source-medium' : 'ai-source-low'), score:Math.round(best.score*10)/10 };
  }
  function renderBest(results){
    var panel = document.getElementById('v51BestMatchPanel'); if(!panel) return;
    if(!results.length){ panel.style.display = 'none'; panel.innerHTML = ''; return; }
    var conf = confidence(results[0], results[1]);
    var rows = results.slice(0, 4).map(function(t, i){
      return '<div style="padding:8px 0;border-top:' + (i ? '1px solid rgba(148,163,184,.18)' : '0') + '">' +
        '<div class="v51-best-title" style="margin-bottom:2px;">' + esc((i+1) + '. ' + (t.title || t.id)) + '</div>' +
        '<div class="v51-best-section">' + esc((t.path || t.section || '') + ' · score ' + Math.round((t.score || 0)*10)/10 + (t.hits && t.hits.length ? ' · ' + t.hits.slice(0,5).join(', ') : '')) + '</div>' +
        '<div class="v51-best-actions"><button type="button" class="v51-mini-btn" data-sugo-turbo-open="' + esc(t.id) + '">Open SOP</button><button type="button" class="v51-mini-btn" data-sugo-turbo-ask="' + esc(t.title || t.id) + '" data-sugo-turbo-pane="' + esc(t.id) + '">Ask AI</button></div>' +
      '</div>';
    }).join('');
    panel.style.display = 'block';
    panel.innerHTML = '<div class="v51-best-card sugo-turbo-best-match"><div class="v51-best-top"><span class="v51-best-badge">Turbo Precision Match</span><span class="v51-best-score ' + conf.className + '">' + esc(conf.label + ' · ' + conf.score) + '</span></div>' + rows + '</div>';
  }
  function apply(query, results){
    var q = String(query || '').trim();
    if(!q || q.length < 2){ clearSearch(); return; }
    var useful = results.filter(function(t){ return t.score >= 18; }).slice(0, maxVisibleResults);
    if(!useful.length) useful = results.slice(0, 28);
    var ids = new Set(useful.map(function(t){ return t.id; }));
    var topIds = new Set(useful.slice(0, maxOpenPaths).map(function(t){ return t.id; }));
    var any = false;
    getIndex().forEach(function(item){ var visible = ids.has(item.id); setHidden(item.btn, !visible); if(visible) any = true; });
    document.querySelectorAll('.nav-l00').forEach(function(sec){ setHidden(sec, !Array.prototype.some.call(sec.querySelectorAll('.nav-l000-btn[data-pane]'), function(btn){ return ids.has(btn.getAttribute('data-pane')); })); });
    document.querySelectorAll('.nav-l0').forEach(function(cat){ setHidden(cat, !Array.prototype.some.call(cat.querySelectorAll('.nav-l000-btn[data-pane]'), function(btn){ return ids.has(btn.getAttribute('data-pane')); })); });
    document.querySelectorAll('.nav-lroot').forEach(function(root){ setHidden(root, !Array.prototype.some.call(root.querySelectorAll('.nav-l000-btn[data-pane]'), function(btn){ return ids.has(btn.getAttribute('data-pane')); })); });
    document.querySelectorAll('.nav-lroot-children.open,.nav-l0-children.open,.nav-l00-children.open,.nav-lroot-chev.open,.nav-l0-chev.open,.nav-l00-chev.open').forEach(function(el){ setOpen(el, false); });
    getIndex().forEach(function(item){
      if(!topIds.has(item.id)) return;
      setOpen(item.root && item.root.querySelector(':scope > .nav-lroot-children'), true);
      setOpen(item.root && item.root.querySelector(':scope > .nav-lroot-btn .nav-lroot-chev'), true);
      setOpen(item.l0 && item.l0.querySelector(':scope > .nav-l0-children'), true);
      setOpen(item.l0 && item.l0.querySelector(':scope > .nav-l0-btn .nav-l0-chev'), true);
      setOpen(item.l00 && item.l00.querySelector(':scope > .nav-l00-children'), true);
      setOpen(item.l00 && item.l00.querySelector(':scope > .nav-l00-btn .nav-l00-chev'), true);
    });
    var nr = document.getElementById('noResults'); if(nr) nr.style.display = any ? 'none' : 'block';
    renderBest(useful);
  }
  function turboSearch(query){
    var q = String(query || '').trim();
    if(frame) cancelAnimationFrame(frame);
    if(!q || q.length < 2){ frame = requestAnimationFrame(function(){ frame=null; clearSearch(); }); return; }
    var results = rank(q);
    frame = requestAnimationFrame(function(){ frame=null; apply(q, results); });
  }
  function resize(el){ try{ el.style.height='auto'; el.style.height=Math.min(el.scrollHeight, 104)+'px'; }catch(e){} }

  window.sugoFastSearchInput = function(el){
    if(!el) return;
    resize(el);
    if(composing) return;
    clearTimeout(timer);
    var value = String(el.value || '');
    timer = setTimeout(function(){ turboSearch(value); }, value.trim() ? debounceMs : 20);
  };
  window.doSearch = turboSearch;
  try{ doSearch = turboSearch; }catch(e){}
  if(window.SugoApp && window.SugoApp.navigation) window.SugoApp.navigation.search = turboSearch;

  function noEllipsisClip(text, limit){
    text = String(text || '');
    if(text.length <= limit) return text;
    var cut = text.slice(0, limit);
    var lastStop = Math.max(cut.lastIndexOf('\n\n'), cut.lastIndexOf('. '), cut.lastIndexOf('۔'), cut.lastIndexOf('؟'));
    if(lastStop > limit * 0.72) cut = cut.slice(0, lastStop + 1);
    else cut = cut.replace(/\s+\S*$/, '');
    return cut + '\n[Content continues in the selected SOP article; answer must not stop mid-sentence. Ask a follow-up or open the SOP if the remaining article is needed.]';
  }
  window.getRelevantKnowledgeBaseText = function(query, maxTopics, maxCharsPerTopic, preferredPaneId, options){
    options = options && typeof options === 'object' ? options : {};
    maxTopics = Math.max(Number(maxTopics || 0), options.completeAnswer ? 12 : 8);
    maxCharsPerTopic = Math.max(Number(maxCharsPerTopic || 0), options.completeAnswer ? 3200 : 1800);
    var result = typeof oldGetRelevant === 'function'
      ? oldGetRelevant(query, maxTopics, maxCharsPerTopic, preferredPaneId, options)
      : { topics: rank(query).slice(0, maxTopics), confidence:'low', confidenceLabel:'Low', confidenceScore:0, hasMeaningfulMatch:false };
    var topics = Array.isArray(result.topics) ? result.topics.slice(0, maxTopics) : [];
    if(!topics.length) return result;
    var routeLine = result.primaryRoute ? ('Primary route: ' + result.primaryRoute.name + '\nPrimary topic IDs: ' + (result.primaryTopicIds || []).join(', ')) : 'Primary route: none';
    var audit = topics.slice(0, 8).map(function(t, i){ return (i+1) + '. ' + t.id + ' | title: ' + (t.title || t.label || '') + ' | score: ' + Math.round((t.score || 0)*10)/10 + ' | hits: ' + ((t.hits || []).slice(0,8).join(', ') || 'none'); }).join('\n');
    var packet = routeLine + '\nCompleteness rule: use every relevant condition, exception, required evidence, and escalation detail from the matched SOP. Finish all sections fully; never stop mid-list or mid-sentence.\nMatch audit:\n' + audit + '\n\n' + topics.map(function(t, i){
      var priority = t.primary || t.selected || i < 3;
      var enLimit = priority ? bodyLimitPerTopic : Math.max(7000, maxCharsPerTopic * 2);
      var arLimit = priority ? bodyLimitPerTopic : Math.max(6500, Math.floor(maxCharsPerTopic * 1.8));
      return [
        '### Topic: ' + t.id,
        'Title: ' + (t.title || t.label || t.id),
        'Path: ' + (t.path || ''),
        'Match score: ' + Math.round((t.score || 0)*10)/10,
        t.primary ? 'Primary route match: yes' : 'Primary route match: no',
        t.selected ? 'Selected by user: yes' : 'Selected by user: no',
        (t.tags && t.tags.length ? 'Tags: ' + t.tags.join(', ') : ''),
        'English SOP:', noEllipsisClip(t.enText || '', enLimit),
        '', 'Arabic SOP:', noEllipsisClip(t.arText || '', arLimit)
      ].filter(function(x){ return x !== null && x !== undefined; }).join('\n');
    }).join('\n\n');
    result.text = packet;
    result.topics = topics;
    result.topicIds = topics.map(function(t){ return t.id; });
    result.hasMeaningfulMatch = result.hasMeaningfulMatch || topics.length > 0;
    return result;
  };

  document.addEventListener('compositionstart', function(e){ if(e.target && e.target.id === 'searchInput') composing = true; }, true);
  document.addEventListener('compositionend', function(e){ if(e.target && e.target.id === 'searchInput'){ composing = false; window.sugoFastSearchInput(e.target); } }, true);
  document.addEventListener('click', function(e){
    var open = e.target.closest && e.target.closest('[data-sugo-turbo-open]');
    if(open){ e.preventDefault(); var paneId = open.getAttribute('data-sugo-turbo-open'); if(paneId && typeof window.showPane === 'function') window.showPane(paneId, true); return; }
    var ask = e.target.closest && e.target.closest('[data-sugo-turbo-ask]');
    if(ask){
      e.preventDefault();
      var q = ask.getAttribute('data-sugo-turbo-ask') || '';
      var pane = ask.getAttribute('data-sugo-turbo-pane') || '';
      if(pane){ window.SUGO_EXACT_AI_PANE = pane; window.SUGO_ACTIVE_PANE = pane; window.SUGO_ACTIVE_PANE_TS = Date.now(); }
      var input = document.getElementById('searchInput'); if(input) input.value = q;
      if(typeof window.askAI === 'function') window.askAI(q);
    }
  }, true);
  function boot(){
    buildIndex();
    setTimeout(function(){ index = null; buildIndex(); }, 800);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('load', function(){ setTimeout(function(){ index = null; buildIndex(); }, 50); });
  window.SUGO_SPEED_COMPLETE_ANSWER = { version:VERSION, debounceMs:debounceMs, rebuildIndex:function(){ index = null; return buildIndex(); }, rank:rank, search:turboSearch };
})();



/* ===== SUGO Stage 3 lazy SOP hydration =====
   The search index is now compact. Full SOP text is fetched only for the matched pane(s)
   before sending the AI request, reducing first-load RAM and CPU usage. */
(function(){
  'use strict';
  if(window.__SUGO_STAGE3_LAZY_HYDRATION__) return;
  window.__SUGO_STAGE3_LAZY_HYDRATION__ = true;

  function textFromHtmlNode(node){
    if(!node) return '';
    var txt = (node.textContent || node.innerText || '').replace(/\u00a0/g, ' ');
    return txt.replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*/g, '\n').trim();
  }

  function extractPaneText(html){
    var tmp = document.createElement('div');
    tmp.innerHTML = String(html || '');
    tmp.querySelectorAll('script,style,.sugo-view-controls,.copy-buttons,.sugo-filter-empty').forEach(function(el){ try{ el.remove(); }catch(e){} });
    var enNode = tmp.querySelector('.sugo-section[data-lang="en"]');
    var arNode = tmp.querySelector('.sugo-section[data-lang="ar"]');
    var en = textFromHtmlNode(enNode);
    var ar = textFromHtmlNode(arNode);
    if(!en || !ar){
      var copyBtns = tmp.querySelectorAll('.copy-btn[data-copy-text]');
      if(copyBtns[0] && !en) en = copyBtns[0].getAttribute('data-copy-text') || '';
      if(copyBtns[1] && !ar) ar = copyBtns[1].getAttribute('data-copy-text') || '';
    }
    if(!en && !ar) en = textFromHtmlNode(tmp);
    return { en: en.replace(/\s{3,}/g, ' ').trim(), ar: ar.replace(/\s{3,}/g, ' ').trim() };
  }

  function smartClip(text, limit){
    text = String(text || '');
    limit = Number(limit || 0) || 12000;
    if(text.length <= limit) return text;
    var cut = text.slice(0, limit);
    var last = Math.max(cut.lastIndexOf('\n\n'), cut.lastIndexOf('. '), cut.lastIndexOf('؟'), cut.lastIndexOf('۔'));
    if(last > limit * 0.70) cut = cut.slice(0, last + 1);
    else cut = cut.replace(/\s+\S*$/, '');
    return cut + '\n[Content continues in the selected SOP article.]';
  }

  function updateIndexEntry(topic){
    try{
      var map = window.SUGO_PANE_SEARCH_BY_ID || null;
      if(map && map[topic.id]){
        map[topic.id].enText = topic.enText || '';
        map[topic.id].arText = topic.arText || '';
      }
      if(Array.isArray(window.SUGO_PANE_SEARCH_INDEX)){
        var item = window.SUGO_PANE_SEARCH_INDEX.find(function(x){ return x && x.id === topic.id; });
        if(item){ item.enText = topic.enText || ''; item.arText = topic.arText || ''; }
      }
    }catch(e){}
  }

  function rebuildKbPacket(kb){
    if(!kb || !Array.isArray(kb.topics)) return kb;
    var topics = kb.topics;
    var routeLine = kb.primaryRoute ? ('Primary route: ' + kb.primaryRoute.name + '\nPrimary topic IDs: ' + (kb.primaryTopicIds || []).join(', ')) : 'Primary route: none';
    var audit = topics.slice(0, 8).map(function(t, i){
      return (i+1) + '. ' + t.id + ' | title: ' + (t.title || t.label || '') + ' | score: ' + Math.round((t.score || 0)*10)/10 + ' | hits: ' + ((t.hits || []).slice(0,8).join(', ') || 'none');
    }).join('\n');
    kb.text = routeLine + '\nCompleteness rule: use every relevant condition, exception, required evidence, and escalation detail from the matched SOP. Finish all sections fully; never stop mid-list or mid-sentence.\nMatch audit:\n' + audit + '\n\n' + topics.map(function(t, i){
      var priority = t.primary || t.selected || i < 3;
      var enLimit = priority ? 22000 : 9000;
      var arLimit = priority ? 22000 : 8500;
      return [
        '### Topic: ' + t.id,
        'Title: ' + (t.title || t.label || t.id),
        'Path: ' + (t.path || ''),
        'Match score: ' + Math.round((t.score || 0)*10)/10,
        t.primary ? 'Primary route match: yes' : 'Primary route match: no',
        t.selected ? 'Selected by user: yes' : 'Selected by user: no',
        (t.tags && t.tags.length ? 'Tags: ' + t.tags.join(', ') : ''),
        'English SOP:', smartClip(t.enText || '', enLimit),
        '', 'Arabic SOP:', smartClip(t.arText || '', arLimit)
      ].filter(function(x){ return x !== null && x !== undefined && x !== ''; }).join('\n');
    }).join('\n\n');
    kb.hasMeaningfulMatch = kb.hasMeaningfulMatch || kb.text.trim().length > 250;
    return kb;
  }

  window.sugoHydrateRelevantKb = async function(kb){
    if(!kb || !Array.isArray(kb.topics) || !kb.topics.length) return kb;
    var topics = kb.topics.slice(0, 12);
    await Promise.all(topics.map(async function(t){
      if(!t || !t.id || (t.enText && t.arText)) return;
      try{
        var html = (typeof window.fetchSugoPaneHtml === 'function') ? await window.fetchSugoPaneHtml(t.id) : '';
        var extracted = extractPaneText(html);
        t.enText = extracted.en || t.enText || '';
        t.arText = extracted.ar || t.arText || '';
        updateIndexEntry(t);
      }catch(e){
        console.warn('[SUGO Stage3] Lazy SOP load failed:', t && t.id, e);
      }
    }));
    return rebuildKbPacket(kb);
  };

  // Load the compact index only when the user actually searches, then rebuild the fast index.
  var requested = false;
  document.addEventListener('input', function(e){
    if(!e.target || e.target.id !== 'searchInput') return;
    var q = String(e.target.value || '').trim();
    if(q.length < 2 || requested || typeof window.sugoEnsurePaneIndexReady !== 'function') return;
    requested = true;
    window.sugoEnsurePaneIndexReady().then(function(){
      try{ if(window.SUGO_SPEED_COMPLETE_ANSWER && window.SUGO_SPEED_COMPLETE_ANSWER.rebuildIndex) window.SUGO_SPEED_COMPLETE_ANSWER.rebuildIndex(); }catch(err){}
      try{ if(typeof window.doSearch === 'function') window.doSearch(q); }catch(err){}
    }).catch(function(){ requested = false; });
  }, true);
})();

// ===== extracted from #sugo-stable-options-search-final-fix =====
(function(){
  'use strict';
  if(window.__SUGO_STABLE_OPTIONS_SEARCH_FINAL_FIX__) return;
  window.__SUGO_STABLE_OPTIONS_SEARCH_FINAL_FIX__ = true;

  function byId(id){ return document.getElementById(id); }
  function setOptionsOpen(open){
    var sidebar = byId('sidebar');
    var btn = byId('optionsToggleBtn');
    if(sidebar) sidebar.classList.toggle('options-open', !!open);
    if(btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    try{ localStorage.setItem('sugo_options_open', open ? '1' : '0'); }catch(e){}
  }

  window.toggleSugoOptions = function(event){
    if(event){ event.preventDefault(); event.stopPropagation(); }
    var sidebar = byId('sidebar');
    var next = !(sidebar && sidebar.classList.contains('options-open'));
    setOptionsOpen(next);
    if(typeof window.updateSugoOptionsSummary === 'function') window.updateSugoOptionsSummary();
    setTimeout(function(){ setOptionsOpen(next); }, 40);
    setTimeout(function(){ setOptionsOpen(next); }, 220);
    return false;
  };

  document.addEventListener('click', function(e){
    var btn = e.target && e.target.closest && e.target.closest('#optionsToggleBtn');
    if(btn){
      e.preventDefault();
      e.stopPropagation();
      window.toggleSugoOptions(e);
    }
  }, true);

  var lastSearch = '';
  function rememberSearch(){
    var input = byId('searchInput');
    if(input) lastSearch = input.value || '';
  }
  function restoreSearchIfNeeded(){
    var input = byId('searchInput');
    if(!input || !lastSearch) return;
    if(!input.value){
      input.value = lastSearch;
      if(typeof window.sugoFastSearchInput === 'function') window.sugoFastSearchInput(input);
      else if(typeof window.doSearch === 'function') window.doSearch(lastSearch);
    }
  }
  document.addEventListener('input', function(e){ if(e.target && e.target.id === 'searchInput') rememberSearch(); }, true);
  document.addEventListener('focusin', function(e){ if(e.target && e.target.id === 'searchInput') rememberSearch(); }, true);
  window.addEventListener('load', function(){
    setTimeout(restoreSearchIfNeeded, 250);
    setTimeout(restoreSearchIfNeeded, 900);
    setTimeout(restoreSearchIfNeeded, 1700);
  });
})();


// ===== extracted from #sugo-loading-failsafe =====
(function(){
  function hide(){
    try{
      var splash=document.getElementById('sugoOpeningSplash');
      if(splash){ splash.classList.add('sugo-hide'); setTimeout(function(){ try{splash.remove();}catch(e){} },500); }
      document.documentElement.classList.remove('sugo-booting');
      if(document.body) document.body.style.overflow='';
    }catch(e){}
  }
  setTimeout(hide, 3500);
  window.addEventListener('error', function(){ setTimeout(hide, 100); });
})();


// ===== extracted from #sugo-direct-section-edit-js =====
(function(){
  'use strict';
  if(window.__SUGO_DIRECT_SECTION_EDIT__) return;
  window.__SUGO_DIRECT_SECTION_EDIT__ = true;

  var WORKER_URL = window.SUGO_WORKER_URL || 'https://sugo.dwairy101.workers.dev';
  var paneOverrides = {};
  var originalPaneHtml = {};
  var editingPaneId = null;
  var editingOriginalHtml = '';

  function getAdminPassword(){
    if(window.__SUGO_ADMIN_PASSWORD) return window.__SUGO_ADMIN_PASSWORD;
    var password=prompt('Admin password');
    if(!password) return '';
    window.__SUGO_ADMIN_PASSWORD=password;
    return password;
  }
  function clearAdminPassword(password){
    if(window.__SUGO_ADMIN_PASSWORD && (!password || window.__SUGO_ADMIN_PASSWORD===password)) window.__SUGO_ADMIN_PASSWORD='';
  }

  function byId(id){ return document.getElementById(id); }
  function norm(v){ return String(v || '').replace(/\s+/g,' ').trim(); }
  function paneEl(id){ return byId('pane-' + id); }
  function activePane(){ return document.querySelector('.content-pane.active'); }
  function activePaneId(){ var p=activePane(); return p && p.id ? p.id.replace(/^pane-/,'') : (window.SUGO_ACTIVE_PANE || localStorage.getItem('sugo_last_pane') || ''); }
  function authHeader(password){ return 'Bearer ' + String(password || ''); }
  function toast(msg){
    var box=byId('sugoDirectToast');
    if(!box){ box=document.createElement('div'); box.id='sugoDirectToast'; box.className='sugo-direct-toast'; document.body.appendChild(box); }
    box.textContent=msg; box.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(function(){ box.classList.remove('show'); }, 3200);
  }

  function getPaneStore(){
    if(window.paneContent) return window.paneContent;
    try{ if(typeof paneContent !== 'undefined') return paneContent; }catch(e){}
    return null;
  }

  function contentTarget(pane){
    if(!pane) return null;
    var existing = pane.querySelector(':scope > .sugo-direct-edit-target');
    if(existing) return existing;
    var kids = Array.prototype.slice.call(pane.children || []);
    var target = kids.find(function(el){
      return el && el.classList && !el.classList.contains('close-pane-btn') && !el.classList.contains('sugo-direct-edit-toolbar') && !el.classList.contains('sugo-inline-edit-toolbar');
    });
    if(target) target.classList.add('sugo-direct-edit-target');
    return target || null;
  }

  function hasOverride(id){ return !!(paneOverrides && paneOverrides[id] && paneOverrides[id].html); }

  function clean(root){
    if(!root) return '';
    root.querySelectorAll('[contenteditable]').forEach(function(el){ el.removeAttribute('contenteditable'); });
    root.querySelectorAll('.sugo-direct-edit-toolbar,.sugo-inline-edit-toolbar,.sugo-direct-toast,.sugo-inline-edit-hint').forEach(function(el){ el.remove(); });
    return root.innerHTML;
  }

  function applyOverrides(){
    var store = getPaneStore();
    if(!store) return;
    Object.keys(paneOverrides || {}).forEach(function(id){
      var row=paneOverrides[id];
      if(row && row.html && store[id]){
        if(!(id in originalPaneHtml)){
          originalPaneHtml[id] = (typeof store[id] === 'object') ? (store[id].en || store[id].html || '') : String(store[id] || '');
        }
        if(typeof store[id] === 'object') store[id].en = row.html;
        else store[id] = row.html;
        var rendered = paneEl(id);
        if(rendered && !rendered.classList.contains('active')) rendered.remove();
      }
    });
  }

  async function loadOverrides(){
    try{
      var res=await fetch(WORKER_URL + '/content?ts=' + Date.now(), {cache:'no-store'});
      var data=await res.json();
      if(data && data.ok && data.content && data.content.paneOverrides){
        paneOverrides=data.content.paneOverrides || {};
        applyOverrides();
      }
    }catch(e){ console.warn('SUGO edit: cannot load overrides', e); }
  }

  function injectEdit(id){
    id = id || activePaneId();
    if(!id) return;
    var pane = paneEl(id);
    if(!pane || !pane.classList.contains('active')) return;
    pane.querySelectorAll(':scope > .sugo-inline-edit-toolbar').forEach(function(x){ x.remove(); });
    if(pane.querySelector(':scope > .sugo-direct-edit-toolbar')) return;

    var toolbar=document.createElement('div');
    toolbar.className='sugo-direct-edit-toolbar';
    toolbar.innerHTML='<button type="button" class="sugo-direct-edit-btn">Edit</button>' +
      (hasOverride(id) ? '<button type="button" class="sugo-direct-reset-btn">Reset</button>' : '');

    var closeBtn=pane.querySelector(':scope > .close-pane-btn');
    if(closeBtn && closeBtn.nextSibling) pane.insertBefore(toolbar, closeBtn.nextSibling);
    else pane.insertBefore(toolbar, pane.firstChild);

    toolbar.querySelector('.sugo-direct-edit-btn').addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); startEdit(id); });
    var resetBtn=toolbar.querySelector('.sugo-direct-reset-btn');
    if(resetBtn) resetBtn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); resetPane(id); });
  }

  function startEdit(id){
    if(typeof window.SUGO_TINY_PLUS_EDIT_TOPIC === 'function'){
      try{
        if(window.SUGO_TINY_PLUS_EDIT_TOPIC(id)){
          return;
        }
      }catch(err){
        console.warn('SUGO topic modal edit failed, falling back to inline edit', err);
      }
    }

    var pane=paneEl(id), target=contentTarget(pane);
    if(!pane || !target){ toast('افتح Topic أولًا ثم اضغط Edit.'); return; }
    if(editingPaneId && editingPaneId !== id){ toast('احفظ أو ألغِ التعديل الحالي أولًا.'); return; }
    editingPaneId=id;
    editingOriginalHtml=target.innerHTML;
    target.setAttribute('contenteditable','true');
    target.focus();
    var toolbar=pane.querySelector(':scope > .sugo-direct-edit-toolbar');
    if(toolbar){
      toolbar.innerHTML='<button type="button" class="sugo-direct-save-btn">Save</button>'+
        '<button type="button" class="sugo-direct-cancel-btn">Cancel</button>';
      toolbar.querySelector('.sugo-direct-save-btn').addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); savePane(id); });
      toolbar.querySelector('.sugo-direct-cancel-btn').addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); cancelEdit(id); });
    }
    toast('اكتب أو امسح مباشرة داخل المحتوى.');
  }

  function cancelEdit(id){
    var pane=paneEl(id), target=contentTarget(pane);
    if(target){ target.innerHTML=editingOriginalHtml; target.removeAttribute('contenteditable'); }
    editingPaneId=null; editingOriginalHtml='';
    var toolbar=pane && pane.querySelector(':scope > .sugo-direct-edit-toolbar');
    if(toolbar) toolbar.remove();
    injectEdit(id);
  }

  async function savePane(id){
    var pane=paneEl(id), target=contentTarget(pane);
    if(!target) return;
    var password=getAdminPassword();
    if(!password) return;
    var html=clean(target.cloneNode(true));
    var status=pane.querySelector('.sugo-direct-edit-status');
    if(status) status.textContent='Saving...';
    try{
      var res=await fetch(WORKER_URL + '/admin/pane', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':authHeader(password)},
        body:JSON.stringify({paneId:id, html:html})
      });
      var data=await res.json();
      if(!data.ok){ clearAdminPassword(password); alert('Save failed: ' + (data.error || 'Unknown error')); if(status) status.textContent='Save failed.'; return; }
      window.__SUGO_ADMIN_PASSWORD=password;
      paneOverrides[id]={html:html, updatedAt:data.updatedAt || new Date().toISOString()};
      var store=getPaneStore();
      if(store && store[id]){ if(typeof store[id] === 'object') store[id].en=html; else store[id]=html; }
      target.innerHTML=html; target.removeAttribute('contenteditable');
      editingPaneId=null; editingOriginalHtml='';
      var toolbar=pane.querySelector(':scope > .sugo-direct-edit-toolbar'); if(toolbar) toolbar.remove();
      injectEdit(id);
      toast('تم الحفظ بنجاح.');
    }catch(e){ console.error(e); alert('Connection failed.'); if(status) status.textContent='Connection failed.'; }
  }

  async function resetPane(id){
    var password=getAdminPassword();
    if(!password) return;
    if(!confirm('Reset this section to original content?')) return;
    try{
      var res=await fetch(WORKER_URL + '/admin/pane/reset', {method:'POST', headers:{'Content-Type':'application/json','Authorization':authHeader(password)}, body:JSON.stringify({paneId:id})});
      var data=await res.json();
      if(!data.ok){ clearAdminPassword(password); alert('Reset failed: ' + (data.error || 'Unknown error')); return; }
      window.__SUGO_ADMIN_PASSWORD=password;
      delete paneOverrides[id];
      var store=getPaneStore();
      var original=(id in originalPaneHtml) ? originalPaneHtml[id] : null;
      if(original !== null && store && store[id]){
        if(typeof store[id] === 'object') store[id].en=original; else store[id]=original;
      }
      var rendered=paneEl(id);
      if(rendered){
        var target=contentTarget(rendered);
        if(target && original !== null){ target.innerHTML=original; target.removeAttribute('contenteditable'); }
      }
      editingPaneId=null; editingOriginalHtml='';
      var toolbar=rendered && rendered.querySelector(':scope > .sugo-direct-edit-toolbar');
      if(toolbar) toolbar.remove();
      injectEdit(id);
      toast('تمت إعادة القسم للمحتوى الأصلي.');
    }catch(e){ alert('Connection failed.'); }
  }

  function findTopicByCurrentSelect(){
    var topicSelect=byId('sugoCascadeTopic');
    if(!topicSelect || !topicSelect.value) return null;
    var opt=topicSelect.options[topicSelect.selectedIndex];
    var label=norm(opt && opt.textContent);
    if(!label) return null;
    var sectionSelect=byId('sugoCascadeSection');
    var sectionLabel=norm(sectionSelect && sectionSelect.options[sectionSelect.selectedIndex] && sectionSelect.options[sectionSelect.selectedIndex].textContent);
    var candidates=Array.prototype.slice.call(document.querySelectorAll('.nav-l000-btn')).filter(function(btn){ return norm(btn.textContent) === label; });
    if(sectionLabel){
      var bySection=candidates.filter(function(btn){
        var sec=btn.closest('.nav-l00');
        var secBtn=sec && sec.querySelector('.nav-l00-btn span');
        return norm(secBtn && secBtn.textContent) === sectionLabel;
      });
      if(bySection.length) candidates=bySection;
    }
    return candidates[0] || null;
  }

  function forceOpenSelectedTopic(){
    var topicBtn=findTopicByCurrentSelect();
    if(!topicBtn) return;
    var id=topicBtn.getAttribute('data-pane');
    if(id && typeof window.showPane === 'function'){
      window.showPane(id, true);
      setTimeout(function(){ injectEdit(id); }, 80);
    }
  }

  function wrapShowPane(){
    var original=window.showPane;
    if(typeof original !== 'function' || original.__sugoDirectWrapped) return;
    window.showPane=function(paneId, save){
      var out=original.apply(this, arguments);
      setTimeout(function(){ injectEdit(paneId); }, 60);
      return out;
    };
    window.showPane.__sugoDirectWrapped=true;
  }

  function install(){
    wrapShowPane();
    loadOverrides().then(function(){
      wrapShowPane();
      // Do not auto-open a selected topic after /content finishes loading.
      // Sections should open only from a real user change/click.
      injectEdit(activePaneId());
    });

    document.addEventListener('change', function(e){
      if(e.target && e.target.id === 'sugoCascadeTopic') setTimeout(forceOpenSelectedTopic, 30);
    }, true);
    document.addEventListener('click', function(e){
      var t=e.target && e.target.closest && e.target.closest('.nav-l000-btn');
      if(t){ var id=t.getAttribute('data-pane'); setTimeout(function(){ injectEdit(id); }, 80); }
    }, true);
    var obs=new MutationObserver(function(){ var id=activePaneId(); if(id) setTimeout(function(){ injectEdit(id); }, 80); });
    obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    setInterval(function(){ wrapShowPane(); var id=activePaneId(); if(id) injectEdit(id); }, 1200);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();


// ===== extracted from #sugo-topic-dropdown-hard-open-fix-v3 =====
(function(){
  'use strict';
  if(window.__SUGO_TOPIC_DROPDOWN_HARD_OPEN_FIX_V3__) return;
  window.__SUGO_TOPIC_DROPDOWN_HARD_OPEN_FIX_V3__ = true;

  function byId(id){ return document.getElementById(id); }
  function cleanText(v){ return String(v || '').replace(/\s+/g,' ').trim(); }
  function visibleWelcome(){
    var w = byId('welcomeMsg');
    if(!w) return false;
    var cs = window.getComputedStyle ? getComputedStyle(w) : null;
    return w.style.display !== 'none' && (!cs || cs.display !== 'none');
  }
  function activePaneId(){
    var p = document.querySelector('.content-pane.active');
    return p && p.id ? p.id.replace(/^pane-/,'') : '';
  }
  function paneExists(paneId){
    try{ return !!(paneId && typeof paneContent !== 'undefined' && paneContent && paneContent[paneId]); }catch(e){ return false; }
  }
  function selectedOption(sel){ return sel && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex] : null; }
  window.__SUGO_SUPPRESS_OPEN_PANE = window.__SUGO_SUPPRESS_OPEN_PANE || '';

  function selectedTopicPaneId(){
    var select = byId('sugoCascadeTopic');
    if(!select || !select.value) return '';
    var opt = selectedOption(select);
    if(!opt) return '';

    var pane = opt.getAttribute('data-smart-pane') || opt.getAttribute('data-pane') || opt.getAttribute('data-sugo-pane') || '';
    if(pane) return pane;

    var topicLabel = cleanText(opt.textContent);
    if(!topicLabel) return '';

    var sectionSelect = byId('sugoCascadeSection');
    var sectionOpt = selectedOption(sectionSelect);
    var sectionLabel = cleanText(sectionOpt && sectionOpt.textContent);

    var categorySelect = byId('sugoCascadeCategory');
    var categoryOpt = selectedOption(categorySelect);
    var categoryLabel = cleanText(categoryOpt && categoryOpt.textContent);

    var librarySelect = byId('sugoLibrarySelect');
    var libraryOpt = selectedOption(librarySelect);
    var libraryLabel = cleanText(libraryOpt && libraryOpt.textContent);

    var candidates = Array.prototype.slice.call(document.querySelectorAll('.nav-l000-btn')).filter(function(btn){
      return cleanText(btn.textContent) === topicLabel;
    });

    if(sectionLabel){
      var sectionMatches = candidates.filter(function(btn){
        var sec = btn.closest('.nav-l00');
        var secBtn = sec && sec.querySelector('.nav-l00-btn span');
        return cleanText(secBtn && secBtn.textContent) === sectionLabel;
      });
      if(sectionMatches.length) candidates = sectionMatches;
    }

    if(categoryLabel){
      var catMatches = candidates.filter(function(btn){
        var cat = btn.closest('.nav-l0');
        var catBtn = cat && cat.querySelector('.nav-l0-btn span');
        return cleanText(catBtn && catBtn.textContent) === categoryLabel;
      });
      if(catMatches.length) candidates = catMatches;
    }

    if(libraryLabel){
      var libMatches = candidates.filter(function(btn){
        var root = btn.closest('.nav-lroot');
        var rootBtn = root && root.querySelector('.nav-lroot-btn span');
        return cleanText(rootBtn && rootBtn.textContent) === libraryLabel;
      });
      if(libMatches.length) candidates = libMatches;
    }

    return candidates[0] ? (candidates[0].getAttribute('data-pane') || '') : '';
  }

  function activatePaneManually(paneId){
    if(!paneId) return false;
    var pane = byId('pane-' + paneId);
    if(!pane && typeof preparePaneElement === 'function'){
      try{ pane = preparePaneElement(paneId); }catch(e){}
    }
    if(!pane && paneExists(paneId)){
      var contentArea = byId('contentArea');
      if(!contentArea) return false;
      var html = '';
      try{
        var row = paneContent[paneId];
        html = typeof row === 'object' ? (row.en || row.html || '') : String(row || '');
      }catch(e){}
      pane = document.createElement('div');
      pane.className = 'content-pane';
      pane.id = 'pane-' + paneId;
      pane.innerHTML = '<button class="close-pane-btn" type="button" onclick="showOnlyWelcome && showOnlyWelcome()">✕</button><div>' + html + '</div>';
      contentArea.appendChild(pane);
    }
    if(!pane) return false;
    document.querySelectorAll('.content-pane,.ai-answer-pane').forEach(function(p){ p.classList.remove('active'); });
    var welcome = byId('welcomeMsg');
    if(welcome) welcome.style.display = 'none';
    pane.classList.add('active');
    window.SUGO_ACTIVE_PANE = paneId;
    window.SUGO_ACTIVE_PANE_TS = Date.now();
    try{ localStorage.setItem('sugo_last_pane', paneId); }catch(e){}
    document.querySelectorAll('.nav-l000-btn').forEach(function(btn){ btn.classList.toggle('active', btn.getAttribute('data-pane') === paneId); });
    return true;
  }

  function openPaneHard(paneId){
    if(!paneId) return false;
    var ok = false;
    try{
      if(window.SUGOFavoritesOpenHotfix && typeof window.SUGOFavoritesOpenHotfix.open === 'function'){
        ok = !!window.SUGOFavoritesOpenHotfix.open(paneId);
      }
    }catch(e){}
    if(!ok){
      try{
        if(typeof window.showPane === 'function'){ window.showPane(paneId, true); ok = true; }
        else if(typeof showPane === 'function'){ showPane(paneId, true); ok = true; }
      }catch(e){ ok = false; }
    }
    setTimeout(function(){
      var active = activePaneId();
      if(active !== paneId || visibleWelcome()) activatePaneManually(paneId);
      if(window.__SUGO_DIRECT_SECTION_EDIT__ && typeof window.dispatchEvent === 'function'){
        try{ window.dispatchEvent(new CustomEvent('sugo:pane-opened', {detail:{paneId:paneId}})); }catch(e){}
      }
    }, 80);
    if(!ok) return activatePaneManually(paneId);
    return true;
  }

  function repairSelectedTopicOpen(){
    var paneId = selectedTopicPaneId();
    if(!paneId) return;
    if(window.__SUGO_SUPPRESS_OPEN_PANE === paneId) return;
    if(activePaneId() !== paneId || visibleWelcome()) openPaneHard(paneId);
  }

  document.addEventListener('change', function(e){
    if(e.target && e.target.id === 'sugoCascadeTopic'){
      window.__SUGO_SUPPRESS_OPEN_PANE = '';
      setTimeout(repairSelectedTopicOpen, 0);
      setTimeout(repairSelectedTopicOpen, 120);
      setTimeout(repairSelectedTopicOpen, 450);
    }
  }, true);

  document.addEventListener('click', function(e){
    var topicBtn = e.target && e.target.closest && e.target.closest('.nav-l000-btn[data-pane]');
    if(topicBtn){
      var paneId = topicBtn.getAttribute('data-pane');
      setTimeout(function(){ openPaneHard(paneId); }, 60);
    }
  }, true);

  document.addEventListener('click', function(e){
    var closeBtn = e.target && e.target.closest && e.target.closest('.close-pane-btn');
    if(closeBtn){
      window.__SUGO_SUPPRESS_OPEN_PANE = selectedTopicPaneId() || activePaneId() || '';
    }
  }, true);

  // Do not auto-open the currently selected topic on page load.
  // It was causing a topic to open by itself when the browser restored dropdown values.
  // لا نعيد فتح أي قسم تلقائياً عند تحميل الصفحة.

  window.SUGO_OPEN_SELECTED_TOPIC_NOW = repairSelectedTopicOpen;
  window.SUGO_HARD_OPEN_PANE = openPaneHard;
})();


// ===== extracted from #sugo-tiny-plus-existing-menus-js =====
(function(){
  'use strict';

  var WORKER_URL = window.SUGO_WORKER_URL || 'https://sugo.dwairy101.workers.dev';
  var CACHE_KEY = 'sugo_integrated_menu_v1_cache';
  var menuState = { version:1, updatedAt:null, items:[] };
  var CTRL_RENAME='__rename__';
  var CTRL_DELETE='__delete__';
  var adminMode=!!window.__SUGO_ADMIN_PASSWORD;
  var adminPassword=window.__SUGO_ADMIN_PASSWORD || '';

  function byId(id){ return document.getElementById(id); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];}); }
  function attr(v){ return esc(v).replace(/`/g,'&#096;'); }
  function directChildren(parent, selector){ return parent ? Array.prototype.filter.call(parent.children,function(c){ return c.matches && c.matches(selector); }) : []; }
  function cleanText(v, n){ return String(v == null ? '' : v).replace(/\u0000/g,'').trim().slice(0,n||30000); }
  function textOf(el){
    var sp=el?el.querySelector('span'):null;
    return (sp?sp.textContent:(el?el.textContent:'' )).replace(/\s+/g,' ').trim();
  }
  function setText(el, value){
    if(!el) return;
    var sp=el.querySelector && el.querySelector('span');
    if(sp) sp.textContent=value;
    else el.textContent=value;
  }
  function slug(v, prefix){
    var s=String(v||'').toLowerCase().trim().replace(/[^a-z0-9\u0600-\u06ff_-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
    return (prefix||'x')+'-'+(s||Date.now().toString(36))+'-'+Math.random().toString(36).slice(2,6);
  }
  function authHeader(password){ return 'Bearer ' + String(password || '').trim(); }
  function isControlItem(item){ return item && (item.rootKey===CTRL_RENAME || item.rootKey===CTRL_DELETE); }
  function cleanState(x){
    x=x&&typeof x==='object'?x:{};
    var seen={};
    var items=Array.isArray(x.items)?x.items.filter(function(item){
      if(!item || typeof item!=='object') return false;
      var id=String(item.id||item.paneId||'');
      if(!id || seen[id]) return false;
      seen[id]=true;
      return ['root','category','section','topic'].indexOf(String(item.type||''))!==-1;
    }):[];
    return { version:1, updatedAt:x.updatedAt||null, items:items };
  }
  function readCache(){ try{ return cleanState(JSON.parse(localStorage.getItem(CACHE_KEY)||'{}')); }catch(e){ return cleanState({}); } }
  function writeCache(state){ try{ localStorage.setItem(CACHE_KEY, JSON.stringify(cleanState(state))); }catch(e){} }
  function sameState(a,b){ try{ return JSON.stringify(cleanState(a))===JSON.stringify(cleanState(b)); }catch(e){ return false; } }

  function rootKey(root){
    if(!root) return '';
    if(root.dataset && root.dataset.sugoRootKey) return root.dataset.sugoRootKey;
    var txt=root.textContent||'';
    if(root.querySelector && (root.querySelector('#rootSVTickets') || /SUGO\s*SV|Tickets\s*&\s*Macros|Organized\s*Support\s*Macros/i.test(txt))){
      root.dataset.sugoRootKey='sv';
      return 'sv';
    }
    root.dataset.sugoRootKey='kb';
    return 'kb';
  }
  function catKey(cat){ var b=cat&&cat.querySelector('.nav-l0-btn'); return b ? (b.getAttribute('data-l0') || textOf(b)) : ''; }
  function secKey(sec){ var b=sec&&sec.querySelector('.nav-l00-btn'); return b ? (b.getAttribute('data-l00') || textOf(b)) : ''; }
  function topicKey(topic){ return topic ? (topic.getAttribute('data-pane') || textOf(topic)) : ''; }

  function cssEsc(v){
    v=String(v||'');
    if(window.CSS && CSS.escape) return CSS.escape(v);
    return v.replace(/\\/g,'\\\\').replace(/"/g,'\\"');
  }

  function makePaneHtml(title, body){
    var parts=String(body||'').split(/\r?\n/).map(function(line){
      line=line.trim();
      return line ? '<p>'+esc(line)+'</p>' : '<br>';
    }).join('');
    return '<div class="doc-card" data-sugo-custom-topic="1"><div class="macro-grid"><div class="macro-col" dir="rtl"><h2 class="macro-title">'+esc(title)+'</h2><div class="macro-body">'+(parts||'<p></p>')+'</div></div></div></div>';
  }

  function findRoot(key){
    var nav=byId('sidebarNav');
    var roots=directChildren(nav,'.nav-lroot');
    return roots.find(function(r){return rootKey(r)===key;}) || null;
  }
  function findCategory(root,key){ return directChildren(root&&root.querySelector('.nav-lroot-children'),'.nav-l0').find(function(c){return catKey(c)===key;}) || null; }
  function findSection(cat,key){ return directChildren(cat&&cat.querySelector('.nav-l0-children'),'.nav-l00').find(function(s){return secKey(s)===key;}) || null; }
  function findTopic(sec,key){ return directChildren(sec&&sec.querySelector('.nav-l00-children'),'.nav-l000-btn').find(function(t){return topicKey(t)===key;}) || null; }
  function findDomTarget(level, key){
    var nav=byId('sidebarNav');
    if(!nav || !key) return null;
    if(level==='root') return findRoot(key);
    if(level==='category'){
      var b=nav.querySelector('.nav-l0-btn[data-l0="'+cssEsc(key)+'"]');
      return b ? b.closest('.nav-l0') : null;
    }
    if(level==='section'){
      var s=nav.querySelector('.nav-l00-btn[data-l00="'+cssEsc(key)+'"]');
      return s ? s.closest('.nav-l00') : null;
    }
    if(level==='topic') return nav.querySelector('.nav-l000-btn[data-pane="'+cssEsc(key)+'"]');
    return null;
  }
  function targetButton(level, el){
    if(!el) return null;
    if(level==='root') return el.querySelector('.nav-lroot-btn');
    if(level==='category') return el.querySelector('.nav-l0-btn');
    if(level==='section') return el.querySelector('.nav-l00-btn');
    if(level==='topic') return el;
    return null;
  }

  function controlId(kind, level, key){ return 'ctl-'+kind+'-'+level+'-'+String(key||'').replace(/[^a-zA-Z0-9\u0600-\u06FF_-]+/g,'-').slice(0,120); }
  function findControl(kind, level, key){
    return (menuState.items||[]).find(function(item){ return item && item.rootKey===kind && item.categoryKey===level && item.sectionKey===key; }) || null;
  }
  function removeControl(kind, level, key){
    menuState.items=(menuState.items||[]).filter(function(item){ return !(item && item.rootKey===kind && item.categoryKey===level && item.sectionKey===key); });
  }
  function isDeleted(level,key){ return Boolean(findControl(CTRL_DELETE, level, key)); }
  function renameFor(level,key){ var item=findControl(CTRL_RENAME, level, key); return item ? item.label : null; }
  function setRename(level,key,label){
    removeControl(CTRL_RENAME, level, key);
    menuState.items.push({type:level,id:controlId('rename',level,key),label:label,rootKey:CTRL_RENAME,categoryKey:level,sectionKey:key,paneId:key,updatedAt:new Date().toISOString()});
  }
  function setDelete(level,key){
    removeControl(CTRL_DELETE, level, key);
    removeControl(CTRL_RENAME, level, key);
    menuState.items.push({type:level,id:controlId('delete',level,key),label:'',rootKey:CTRL_DELETE,categoryKey:level,sectionKey:key,paneId:key,updatedAt:new Date().toISOString()});
  }

  function ensureLibraryOption(rootId, label){
    var select=byId('sugoLibrarySelect');
    if(!select || !rootId) return;
    var opt=select.querySelector('option[value="'+cssEsc(rootId)+'"]');
    if(!opt){
      opt=document.createElement('option');
      opt.value=rootId;
      select.appendChild(opt);
    }
    opt.textContent=label || rootId;
  }

  function applyRenamesAndDeletes(){
    menuState=cleanState(menuState);
    (menuState.items||[]).forEach(function(item){
      if(!isControlItem(item)) return;
      var level=item.categoryKey;
      var key=item.sectionKey || item.paneId;
      var el=findDomTarget(level,key);
      if(!el) return;
      if(item.rootKey===CTRL_DELETE){
        if(level==='root'){
          var sel=byId('sugoLibrarySelect');
          if(sel){ var opt=sel.querySelector('option[value="'+cssEsc(key)+'"]'); if(opt) opt.remove(); }
        }
        el.remove();
        return;
      }
      if(item.rootKey===CTRL_RENAME){
        setText(targetButton(level,el), item.label || 'Untitled');
        if(level==='root') ensureLibraryOption(key, item.label || 'Untitled');
      }
    });
  }

  function createRoot(item){
    var nav=byId('sidebarNav');
    if(!nav || isControlItem(item) || isDeleted('root', item.id)) return null;
    var existing=findRoot(item.id);
    if(existing){ setText(existing.querySelector('.nav-lroot-btn'), item.label || 'New Menu'); ensureLibraryOption(item.id, item.label); return existing; }
    var root=document.createElement('div');
    root.className='nav-lroot';
    root.dataset.sugoRootKey=item.id;
    root.dataset.sugoCustom='1';
    root.dataset.sugoCustomRoot='1';
    root.innerHTML='<button class="nav-lroot-btn" type="button"><div class="nav-lroot-star">★</div><span>'+esc(item.label||'New Menu')+'</span><div class="nav-lroot-chev"><svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg></div></button><div class="nav-lroot-children"></div>';
    nav.appendChild(root);
    ensureLibraryOption(item.id, item.label||'New Menu');
    return root;
  }

  function createCategory(root,item){
    if(isControlItem(item) || isDeleted('category', item.id)) return null;
    var wrap=root&&root.querySelector('.nav-lroot-children');
    if(!wrap) return null;
    var existing=findCategory(root,item.id);
    if(existing){ setText(existing.querySelector('.nav-l0-btn'), item.label || 'New Category'); return existing; }
    var div=document.createElement('div');
    div.className='nav-l0';
    div.dataset.sugoCustom='1';
    div.innerHTML='<button class="nav-l0-btn" type="button" data-l0="'+attr(item.id)+'"><div class="nav-l0-dot"></div><span>'+esc(item.label||'New Category')+'</span><div class="nav-l0-chev"><svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg></div></button><div class="nav-l0-children"></div>';
    wrap.appendChild(div);
    return div;
  }

  function createSection(cat,item){
    if(isControlItem(item) || isDeleted('section', item.id)) return null;
    var wrap=cat&&cat.querySelector('.nav-l0-children');
    if(!wrap) return null;
    var existing=findSection(cat,item.id);
    if(existing){ setText(existing.querySelector('.nav-l00-btn'), item.label || 'New Section'); return existing; }
    var div=document.createElement('div');
    div.className='nav-l00';
    div.dataset.sugoCustom='1';
    div.innerHTML='<button class="nav-l00-btn" type="button" data-l00="'+attr(item.id)+'"><div class="nav-l00-indicator"></div><span>'+esc(item.label||'New Section')+'</span><div class="nav-l00-chev"><svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg></div></button><div class="nav-l00-children"></div>';
    wrap.appendChild(div);
    return div;
  }

  function createTopic(sec,item){
    if(isControlItem(item) || isDeleted('topic', item.paneId || item.id)) return null;
    var wrap=sec&&sec.querySelector('.nav-l00-children');
    if(!wrap) return null;
    var paneId=item.paneId||item.id;
    var existing=wrap.querySelector('.nav-l000-btn[data-pane="'+cssEsc(paneId)+'"]');
    if(existing){
      existing.textContent=item.label||'New Topic';
      if(typeof window.setPane==='function') window.setPane(paneId, item.html || makePaneHtml(item.label,item.body||''));
      return existing;
    }

    var btn=document.createElement('button');
    btn.type='button';
    btn.className='nav-l000-btn';
    btn.dataset.sugoCustom='1';
    btn.setAttribute('data-pane', paneId);
    btn.textContent=item.label||'New Topic';
    wrap.appendChild(btn);

    if(typeof window.setPane==='function'){
      window.setPane(paneId, item.html || makePaneHtml(item.label,item.body||''));
    }
    return btn;
  }

  function applyMenu(state){
    state=cleanState(state);
    menuState=state;
    applyRenamesAndDeletes();
    state.items.forEach(function(item){ if(item.type==='root' && !isControlItem(item)) createRoot(item); });
    state.items.forEach(function(item){ if(item.type==='category' && !isControlItem(item)){ var r=findRoot(item.rootKey); if(r) createCategory(r,item); }});
    state.items.forEach(function(item){ if(item.type==='section' && !isControlItem(item)){ var r=findRoot(item.rootKey), c=findCategory(r,item.categoryKey); if(c) createSection(c,item); }});
    state.items.forEach(function(item){ if(item.type==='topic' && !isControlItem(item)){ var r=findRoot(item.rootKey), c=findCategory(r,item.categoryKey), s=findSection(c,item.sectionKey); if(s) createTopic(s,item); }});
    applyRenamesAndDeletes();
  }

  function currentRootFromSelect(){
    var nav=byId('sidebarNav');
    var lib=byId('sugoLibrarySelect');
    if(!nav || !lib || !lib.value) return null;
    if(lib.value==='kb') return directChildren(nav,'.nav-lroot').find(function(r){return rootKey(r)==='kb';}) || null;
    if(lib.value==='sv') return directChildren(nav,'.nav-lroot').find(function(r){return rootKey(r)==='sv';}) || null;
    return findRoot(lib.value);
  }

  function currentFilteredTopics(section){
    var topicFilter=byId('sugoCascadeTopicSearch');
    var filter=(topicFilter && topicFilter.value || '').toLowerCase().trim();
    var topics=directChildren(section&&section.querySelector('.nav-l00-children'),'.nav-l000-btn');
    return topics.filter(function(btn){ return !filter || (btn.textContent||'').toLowerCase().indexOf(filter)!==-1; });
  }

  function getPath(){
    var root=currentRootFromSelect();
    var catSel=byId('sugoCascadeCategory');
    var secSel=byId('sugoCascadeSection');
    var cats=directChildren(root&&root.querySelector('.nav-lroot-children'),'.nav-l0');
    var category=cats[Number(catSel&&catSel.value)];
    var secs=directChildren(category&&category.querySelector('.nav-l0-children'),'.nav-l00');
    var section=secs[Number(secSel&&secSel.value)];
    return {root:root||null, category:category||null, section:section||null};
  }

  function getSelectedTarget(level){
    var path=getPath();
    if(level==='root'){
      if(!path.root) return null;
      return {level:'root', key:rootKey(path.root), el:path.root, label:textOf(path.root.querySelector('.nav-lroot-btn'))};
    }
    if(level==='category'){
      if(!path.category) return null;
      return {level:'category', key:catKey(path.category), el:path.category, label:textOf(path.category.querySelector('.nav-l0-btn'))};
    }
    if(level==='section'){
      if(!path.section) return null;
      return {level:'section', key:secKey(path.section), el:path.section, label:textOf(path.section.querySelector('.nav-l00-btn'))};
    }
    if(level==='topic'){
      if(!path.section) return null;
      var topicSel=byId('sugoCascadeTopic');
      var topics=currentFilteredTopics(path.section);
      var topic=topics[Number(topicSel&&topicSel.value)];
      if(!topic) return null;
      return {level:'topic', key:topicKey(topic), el:topic, label:textOf(topic)};
    }
    return null;
  }

  async function postMenuWithPassword(password){
    var res=await fetch(WORKER_URL+'/admin/menu',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':authHeader(password)},
      body:JSON.stringify({menu:menuState})
    });
    var data=await res.json().catch(function(){return {};});
    return { ok: !!(res.ok && data && data.ok), status: res.status, data: data };
  }

  async function unlockAdmin(){
    if(adminMode && adminPassword) return true;
    if(window.__SUGO_ADMIN_PASSWORD){
      adminPassword=window.__SUGO_ADMIN_PASSWORD;
      adminMode=true;
      document.body.classList.add('sugo-admin-menu-on');
      return true;
    }
    var password=prompt('Admin password');
    if(!password) return false;
    var test=await postMenuWithPassword(password);
    if(!test.ok){
      if(window.__SUGO_ADMIN_PASSWORD===password) window.__SUGO_ADMIN_PASSWORD='';
      alert('Wrong password or admin unlock failed: '+((test.data&&test.data.error)||test.status));
      return false;
    }
    adminPassword=password;
    window.__SUGO_ADMIN_PASSWORD=password;
    adminMode=true;
    document.body.classList.add('sugo-admin-menu-on');
    return true;
  }

  async function saveMenu(){
    if(!adminMode || !adminPassword){
      var unlocked=await unlockAdmin();
      if(!unlocked) return false;
    }
    var result=await postMenuWithPassword(adminPassword);
    if(!result.ok){
      alert('Save failed: '+((result.data&&result.data.error)||result.status));
      adminMode=false;
      adminPassword='';
      window.__SUGO_ADMIN_PASSWORD='';
      document.body.classList.remove('sugo-admin-menu-on');
      return false;
    }
    writeCache(menuState);
    return true;
  }

  function refreshMenuAfterChange(paneId){
    writeCache(menuState);
    applyMenu(menuState);
    installTinyButtons();
    if(window.SugoApp && window.SugoApp.navigation && typeof window.SugoApp.navigation.refreshMenuDom === 'function'){
      window.SugoApp.navigation.refreshMenuDom({paneId:paneId || ''});
    }
  }

  var TOPIC_META_PREFIX='__SUGO_TOPIC_META__:';

  function packTopicMeta(meta){
    try { return TOPIC_META_PREFIX + JSON.stringify(meta || {}); }
    catch(e){ return ''; }
  }

  function unpackTopicMeta(body){
    var raw=String(body||'');
    if(raw.indexOf(TOPIC_META_PREFIX)!==0) return null;
    try { return JSON.parse(raw.slice(TOPIC_META_PREFIX.length)) || null; }
    catch(e){ return null; }
  }

  function valIn(scope,id){
    var el=scope && scope.querySelector('#'+id);
    return cleanText(el ? el.value : '', 300000);
  }

  function labelText(text, fallback){
    var v=cleanText(text, 80);
    return v || fallback;
  }

  function makeTopicHtmlFromMeta(meta, fallbackTitle){
    meta = meta && typeof meta === 'object' ? meta : {};
    var mode = meta.mode === 'text' ? 'text' : 'macro';
    var enTitle = cleanText(meta.enTitle || meta.titleEn || fallbackTitle || 'New Topic', 180);
    var arTitle = cleanText(meta.arTitle || meta.titleAr || fallbackTitle || 'موضوع جديد', 180);

    if(mode === 'text'){
      var enText = cleanText(meta.enText || meta.enAnswer || '', 300000);
      var arText = cleanText(meta.arText || meta.arAnswer || '', 300000);
      if(typeof createDualContent === 'function') return createDualContent(enText || enTitle, arText || arTitle);
      return makePaneHtml(arTitle || enTitle, arText || enText || '');
    }

    var enFields = [];
    var arFields = [];
    var enAnswer = cleanText(meta.enAnswer || meta.enText || '', 300000);
    var arAnswer = cleanText(meta.arAnswer || meta.arText || '', 300000);
    var enTicket = cleanText(meta.enTicket || '', 300000);
    var arTicket = cleanText(meta.arTicket || '', 300000);
    var enMention = cleanText(meta.enMention || meta.enForm || '', 300000);
    var arMention = cleanText(meta.arMention || meta.arForm || '', 300000);

    if(enAnswer) enFields.push({label:'Answer', text:enAnswer});
    if(enTicket) enFields.push({label:'Ticket', text:enTicket});
    if(enMention) enFields.push({label: labelText(meta.enInternalLabel, 'Mention / Escalation'), text: enMention});

    if(arAnswer) arFields.push({label:'الإجابة', text:arAnswer});
    if(arTicket) arFields.push({label:'التذكرة', text:arTicket});
    if(arMention) arFields.push({label: labelText(meta.arInternalLabel, 'المنشن / التصعيد'), text: arMention});

    if(!enFields.length && !arFields.length){
      enFields.push({label:'Answer', text:enTitle});
      arFields.push({label:'الإجابة', text:arTitle});
    }

    if(typeof createSupportMacroContent === 'function'){
      return createSupportMacroContent(enTitle, enFields, arTitle, arFields);
    }
    return makePaneHtml(arTitle || enTitle, arAnswer || enAnswer || arTicket || enTicket || '');
  }

  function collectTopicMeta(scope, name){
    var modeEl=scope.querySelector('#sugoTinyMode');
    var mode=(modeEl && modeEl.value)==='text' ? 'text' : 'macro';
    return {
      mode: mode,
      enTitle: valIn(scope,'sugoTinyEnTitle') || name,
      arTitle: valIn(scope,'sugoTinyArTitle') || name,
      enText: valIn(scope,'sugoTinyEnText'),
      arText: valIn(scope,'sugoTinyArText'),
      enAnswer: valIn(scope,'sugoTinyEnAnswer'),
      arAnswer: valIn(scope,'sugoTinyArAnswer'),
      enTicket: valIn(scope,'sugoTinyEnTicket'),
      arTicket: valIn(scope,'sugoTinyArTicket'),
      enMention: valIn(scope,'sugoTinyEnMention'),
      arMention: valIn(scope,'sugoTinyArMention'),
      enInternalLabel: valIn(scope,'sugoTinyEnInternalLabel') || 'Mention / Escalation',
      arInternalLabel: valIn(scope,'sugoTinyArInternalLabel') || 'المنشن / التصعيد'
    };
  }

  function refreshTopicMode(scope){
    var modeEl=scope.querySelector('#sugoTinyMode');
    var mode=(modeEl && modeEl.value)==='text' ? 'text' : 'macro';
    var macro=scope.querySelectorAll('[data-topic-mode="macro"]');
    var textOnly=scope.querySelectorAll('[data-topic-mode="text"]');
    macro.forEach(function(el){ el.style.display = mode==='macro' ? '' : 'none'; });
    textOnly.forEach(function(el){ el.style.display = mode==='text' ? '' : 'none'; });
  }


  function getPaneStoreForTopicEdit(){
    if(window.paneContent) return window.paneContent;
    try{ if(typeof paneContent !== 'undefined') return paneContent; }catch(e){}
    return null;
  }

  function paneTargetForTopicEdit(pane){
    if(!pane) return null;
    var existing=pane.querySelector(':scope > .sugo-direct-edit-target');
    if(existing) return existing;
    var kids=Array.prototype.slice.call(pane.children || []);
    return kids.find(function(el){
      return el && el.classList &&
        !el.classList.contains('close-pane-btn') &&
        !el.classList.contains('sugo-direct-edit-toolbar') &&
        !el.classList.contains('sugo-inline-edit-toolbar');
    }) || null;
  }

  function paneHtmlForTopicEdit(paneId){
    var pane=byId('pane-'+paneId);
    var target=paneTargetForTopicEdit(pane);
    if(target) return target.innerHTML || '';
    var store=getPaneStoreForTopicEdit();
    var rec=store && store[paneId];
    if(!rec) return '';
    return typeof rec === 'object' ? String(rec.en || rec.html || '') : String(rec || '');
  }

  function cloneTextForTopicEdit(node){
    if(!node) return '';
    var clone=node.cloneNode(true);
    clone.querySelectorAll('button,.copy-buttons,.sugo-view-controls,.sugo-min-filter-panel,.sugo-efficiency-panel,.sugo-filter-empty,.lang-divider,.sugo-internal-title,.close-pane-btn,.sugo-direct-edit-toolbar,.sugo-inline-edit-toolbar').forEach(function(el){ el.remove(); });
    return cleanText(htmlToFormattedPlainTextForTopicEdit(clone), 300000);
  }

  function htmlToFormattedPlainTextForTopicEdit(root){
    if(!root) return '';
    var out = '';
    var listStack = [];
    var blockTags = {
      p:1, div:1, section:1, article:1, header:1, footer:1, aside:1,
      h1:1, h2:1, h3:1, h4:1, h5:1, h6:1, blockquote:1, table:1, tr:1
    };

    function add(text){
      text = String(text || '').replace(/\u00a0/g, ' ');
      if(!text) return;
      text = text.replace(/[ \t\f\v]+/g, ' ');
      text = text.replace(/\s*\n\s*/g, '\n');
      out += text;
    }
    function lineBreak(){
      out = out.replace(/[ \t]+$/g, '');
      if(out && !/\n$/.test(out)) out += '\n';
    }
    function ensureLineStart(){
      out = out.replace(/[ \t]+$/g, '');
      if(out && !/\n$/.test(out)) out += '\n';
    }
    function walk(node){
      if(!node) return;
      if(node.nodeType === 3){ add(node.nodeValue || ''); return; }
      if(node.nodeType !== 1) return;

      var tag = String(node.tagName || '').toLowerCase();
      if(tag === 'script' || tag === 'style' || tag === 'noscript') return;
      if(tag === 'br'){ lineBreak(); return; }
      if(tag === 'pre'){
        ensureLineStart();
        out += String(node.textContent || '').replace(/\u00a0/g, ' ');
        lineBreak();
        return;
      }
      if(tag === 'ul' || tag === 'ol'){
        ensureLineStart();
        listStack.push({ type: tag, index: Number(node.getAttribute('start')) || 1 });
        Array.prototype.forEach.call(node.childNodes || [], walk);
        listStack.pop();
        lineBreak();
        return;
      }
      if(tag === 'li'){
        ensureLineStart();
        var list = listStack[listStack.length - 1] || { type: 'ul', index: 1 };
        if(list.type === 'ol'){
          out += (list.index || 1) + '- ';
          list.index = (list.index || 1) + 1;
        } else {
          out += '• ';
        }
        Array.prototype.forEach.call(node.childNodes || [], walk);
        lineBreak();
        return;
      }
      if(tag === 'td' || tag === 'th'){
        Array.prototype.forEach.call(node.childNodes || [], walk);
        out = out.replace(/[ \t]+$/g, '') + '\t';
        return;
      }
      if(blockTags[tag]) ensureLineStart();
      Array.prototype.forEach.call(node.childNodes || [], walk);
      if(blockTags[tag]) lineBreak();
    }

    walk(root);
    return String(out || '')
      .replace(/\r/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/\t+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function findCustomTopicItem(paneId){
    paneId=String(paneId || '');
    return (menuState.items || []).find(function(item){
      return !isControlItem(item) && item.type === 'topic' && (String(item.paneId || '') === paneId || String(item.id || '') === paneId);
    }) || null;
  }

  function topicTargetByPaneId(paneId){
    var nav=byId('sidebarNav');
    if(!nav || !paneId) return null;
    var btn=nav.querySelector('.nav-l000-btn[data-pane="'+cssEsc(paneId)+'"]');
    if(!btn) return null;
    return {level:'topic', key:topicKey(btn), el:btn, label:textOf(btn)};
  }

  function topicMetaFromPane(paneId, fallbackName){
    var item=findCustomTopicItem(paneId);
    var meta=item ? unpackTopicMeta(item.body) : null;
    if(meta) return meta;

    var html=paneHtmlForTopicEdit(paneId);
    var wrap=document.createElement('div');
    wrap.innerHTML=html || '';
    var name=cleanText(fallbackName || '',180) || 'Topic';
    var parsed={
      mode:'macro',
      enTitle:name,
      arTitle:name,
      enText:'',
      arText:'',
      enAnswer:'',
      arAnswer:'',
      enTicket:'',
      arTicket:'',
      enMention:'',
      arMention:'',
      enInternalLabel:'Mention / Escalation',
      arInternalLabel:'المنشن / التصعيد'
    };

    function fieldKind(label, type){
      var raw=(String(type || '')+' '+String(label || '')).toLowerCase();
      if(/ticket|تذكرة|تذكره/.test(raw)) return 'ticket';
      if(/answer|الإجابة|الاجابة/.test(raw)) return 'answer';
      if(/mention|منشن|form|نموذج|internal|escalation|تصعيد|ملاحظة/.test(raw)) return 'mention';
      return type || 'text';
    }

    function readCol(col, lang){
      if(!col) return;
      var title=cloneTextForTopicEdit(col.querySelector('.macro-title'));
      if(title){ if(lang==='en') parsed.enTitle=title; else parsed.arTitle=title; }
      Array.prototype.forEach.call(col.querySelectorAll('.macro-field'), function(field){
        var label=cloneTextForTopicEdit(field.querySelector('.macro-label')) || field.getAttribute('data-section-label') || '';
        var text=cloneTextForTopicEdit(field.querySelector('.macro-body'));
        if(!text) return;
        var kind=fieldKind(label, field.getAttribute('data-type') || '');
        if(lang==='en'){
          if(kind==='ticket' && !parsed.enTicket) parsed.enTicket=text;
          else if(kind==='answer' && !parsed.enAnswer) parsed.enAnswer=text;
          else if(!parsed.enMention){ parsed.enMention=text; parsed.enInternalLabel=label || parsed.enInternalLabel; }
        } else {
          if(kind==='ticket' && !parsed.arTicket) parsed.arTicket=text;
          else if(kind==='answer' && !parsed.arAnswer) parsed.arAnswer=text;
          else if(!parsed.arMention){ parsed.arMention=text; parsed.arInternalLabel=label || parsed.arInternalLabel; }
        }
      });
    }

    readCol(wrap.querySelector('.macro-col[dir="ltr"]'), 'en');
    readCol(wrap.querySelector('.macro-col[dir="rtl"]'), 'ar');

    var enTextNode=wrap.querySelector('.sugo-section[data-lang="en"][data-type="text"]');
    var arTextNode=wrap.querySelector('.sugo-section[data-lang="ar"][data-type="text"]');
    if(enTextNode || arTextNode){
      parsed.mode='text';
      parsed.enText=cloneTextForTopicEdit(enTextNode);
      parsed.arText=cloneTextForTopicEdit(arTextNode);
      var enTitle=wrap.querySelector('.macro-col[dir="ltr"] .macro-title');
      var arTitle=wrap.querySelector('.macro-col[dir="rtl"] .macro-title');
      if(enTitle) parsed.enTitle=cloneTextForTopicEdit(enTitle) || parsed.enTitle;
      if(arTitle) parsed.arTitle=cloneTextForTopicEdit(arTitle) || parsed.arTitle;
    }

    if(!parsed.enAnswer && !parsed.arAnswer && !parsed.enTicket && !parsed.arTicket && !parsed.enText && !parsed.arText){
      parsed.mode='text';
      parsed.arText=cloneTextForTopicEdit(wrap) || name;
      parsed.enText='';
    }
    return parsed;
  }

  function fillTopicBuilderForm(scope, name, meta){
    meta=meta && typeof meta==='object' ? meta : {};
    var map={
      sugoTinyName:name || '',
      sugoTinyMode:meta.mode==='text' ? 'text' : 'macro',
      sugoTinyEnTitle:meta.enTitle || name || '',
      sugoTinyArTitle:meta.arTitle || name || '',
      sugoTinyEnText:meta.enText || '',
      sugoTinyArText:meta.arText || '',
      sugoTinyEnAnswer:meta.enAnswer || '',
      sugoTinyArAnswer:meta.arAnswer || '',
      sugoTinyEnTicket:meta.enTicket || '',
      sugoTinyArTicket:meta.arTicket || '',
      sugoTinyEnMention:meta.enMention || '',
      sugoTinyArMention:meta.arMention || '',
      sugoTinyEnInternalLabel:meta.enInternalLabel || 'Mention / Escalation',
      sugoTinyArInternalLabel:meta.arInternalLabel || 'المنشن / التصعيد'
    };
    Object.keys(map).forEach(function(id){
      var el=scope.querySelector('#'+id);
      if(el) el.value=map[id];
    });
    refreshTopicMode(scope);
  }

  async function savePaneOverrideFromTopicEditor(paneId, html){
    if(!adminMode || !adminPassword){
      var unlocked=await unlockAdmin();
      if(!unlocked) return false;
    }
    try{
      var res=await fetch(WORKER_URL + '/admin/pane', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':authHeader(adminPassword)},
        body:JSON.stringify({paneId:paneId, html:html})
      });
      var data=await res.json().catch(function(){return {};});
      if(!res.ok || !data || !data.ok){
        alert('Content save failed: '+((data && data.error) || res.status));
        return false;
      }
      window.__SUGO_ADMIN_PASSWORD=adminPassword;
      return true;
    }catch(e){
      alert('Connection failed while saving content.');
      return false;
    }
  }

  function rerenderPaneAfterTopicEdit(paneId, html){
    var store=getPaneStoreForTopicEdit();
    if(store){
      if(store[paneId] && typeof store[paneId] === 'object') store[paneId].en=html;
      else store[paneId]={en:html};
    }
    if(typeof window.setPane === 'function') window.setPane(paneId, html);
    var rendered=byId('pane-'+paneId);
    if(rendered && rendered.remove) rendered.remove();
    try{ if(typeof renderedPanes !== 'undefined' && renderedPanes && renderedPanes.delete) renderedPanes.delete(paneId); }catch(e){}
    if(typeof window.showPane === 'function'){
      window.showPane(paneId, true);
    }
  }

  function openEditTopicModal(target){
    target=target || getSelectedTarget('topic');
    if(!target){ alert('Choose topic first.'); return false; }
    var paneId=target.key;
    var currentName=target.label || 'Topic';
    var meta=topicMetaFromPane(paneId, currentName);
    var bd=document.createElement('div');
    bd.className='sugo-tiny-plus-backdrop active';
    bd.innerHTML='<div class="sugo-tiny-plus-card" style="width:min(96vw,920px)">'+
      '<h3>Edit topic</h3>'+
      '<p>تعديل نفس التوبك الموجود باستخدام نفس قائمة Add topic.</p>'+
      '<label>Name</label><input id="sugoTinyName" placeholder="Name">'+
      topicBuilderHtml()+
      '<div class="sugo-tiny-plus-actions"><button class="sugo-tiny-plus-cancel" type="button">Cancel</button><button class="sugo-tiny-plus-save" type="button">Save</button></div></div>';
    document.body.appendChild(bd);
    var modeEl=bd.querySelector('#sugoTinyMode');
    if(modeEl) modeEl.onchange=function(){ refreshTopicMode(bd); };
    fillTopicBuilderForm(bd, currentName, meta);
    bd.querySelector('.sugo-tiny-plus-cancel').onclick=function(){bd.remove();};
    bd.querySelector('.sugo-tiny-plus-save').onclick=async function(){
      var name=cleanText(bd.querySelector('#sugoTinyName').value,180);
      if(!name){ alert('Write a name.'); return; }
      var nextMeta=collectTopicMeta(bd,name);
      var hasAny=(nextMeta.mode==='text') ? (nextMeta.enText || nextMeta.arText) : (nextMeta.enAnswer || nextMeta.arAnswer || nextMeta.enTicket || nextMeta.arTicket || nextMeta.enMention || nextMeta.arMention);
      if(!hasAny){ alert('Add Arabic or English content first.'); return; }
      var html=makeTopicHtmlFromMeta(nextMeta,name);

      menuState=cleanState(menuState);
      var item=findCustomTopicItem(paneId);
      if(item){
        item.label=name;
        item.body=packTopicMeta(nextMeta);
        item.html=html;
        item.paneId=paneId;
        item.updatedAt=new Date().toISOString();
      } else {
        setRename('topic', paneId, name);
      }
      menuState.updatedAt=new Date().toISOString();

      if(!(await saveMenu())) return;
      if(!(await savePaneOverrideFromTopicEditor(paneId, html))) return;

      bd.remove();
      refreshMenuAfterChange(paneId);
      rerenderPaneAfterTopicEdit(paneId, html);
    };
    setTimeout(function(){var i=bd.querySelector('#sugoTinyName'); if(i){ i.focus(); i.select(); }},30);
    return true;
  }


  function topicBuilderHtml(){
    return ''+
      '<div class="sugo-topic-builder">'+
        '<div class="sugo-topic-builder-title">Topic content — نفس تصميم الملف الأصلي</div>'+
        '<label>Content style</label>'+
        '<select id="sugoTinyMode"><option value="macro">Answer + Ticket + Copy buttons</option><option value="text">Text only</option></select>'+
        '<div class="sugo-topic-hint">سيظهر داخل القسم خيارات Language / Content وأزرار Copy مثل المحتوى الأصلي.</div>'+
        '<div class="sugo-topic-grid">'+
          '<div><label>English title</label><input id="sugoTinyEnTitle" class="sugo-topic-en" placeholder="English title"></div>'+
          '<div><label>Arabic title</label><input id="sugoTinyArTitle" class="sugo-topic-ar" placeholder="العنوان العربي"></div>'+
          '<div data-topic-mode="text"><label>English text</label><textarea id="sugoTinyEnText" class="sugo-topic-en" placeholder="English text"></textarea></div>'+
          '<div data-topic-mode="text"><label>Arabic text</label><textarea id="sugoTinyArText" class="sugo-topic-ar" placeholder="النص العربي"></textarea></div>'+
          '<div data-topic-mode="macro"><label>English answer</label><textarea id="sugoTinyEnAnswer" class="sugo-topic-en" placeholder="English answer"></textarea></div>'+
          '<div data-topic-mode="macro"><label>Arabic answer</label><textarea id="sugoTinyArAnswer" class="sugo-topic-ar" placeholder="الإجابة العربية"></textarea></div>'+
          '<div data-topic-mode="macro"><label>English ticket</label><textarea id="sugoTinyEnTicket" class="sugo-topic-en" placeholder="English ticket / customer reply"></textarea></div>'+
          '<div data-topic-mode="macro"><label>Arabic ticket</label><textarea id="sugoTinyArTicket" class="sugo-topic-ar" placeholder="التذكرة / الرد العربي للعميل"></textarea></div>'+
          '<div data-topic-mode="macro"><label>Internal label EN</label><input id="sugoTinyEnInternalLabel" class="sugo-topic-en" placeholder="Mention / Form / Internal Note"></div>'+
          '<div data-topic-mode="macro"><label>Internal label AR</label><input id="sugoTinyArInternalLabel" class="sugo-topic-ar" placeholder="المنشن / النموذج / ملاحظة داخلية"></div>'+
          '<div data-topic-mode="macro"><label>Internal EN optional</label><textarea id="sugoTinyEnMention" class="sugo-topic-en" placeholder="Internal mention / form / note - optional"></textarea></div>'+
          '<div data-topic-mode="macro"><label>Internal AR optional</label><textarea id="sugoTinyArMention" class="sugo-topic-ar" placeholder="منشن / نموذج / ملاحظة داخلية - اختياري"></textarea></div>'+
        '</div>'+
      '</div>';
  }

  function openAdd(level){
    var path=getPath();
    if(level==='category' && !path.root){ alert('Choose a menu first.'); return; }
    if(level==='section' && (!path.root||!path.category)){ alert('Choose a menu and category first.'); return; }
    if(level==='topic' && (!path.root||!path.category||!path.section)){ alert('Choose menu, category and section first.'); return; }

    var isTopic=level==='topic';
    var title=level==='root'?'Add main menu':level==='category'?'Add category':level==='section'?'Add section':'Add topic';
    var bd=document.createElement('div');
    bd.className='sugo-tiny-plus-backdrop active';
    bd.innerHTML='<div class="sugo-tiny-plus-card" style="width:'+ (isTopic?'min(96vw,920px)':'min(94vw,480px)') +'">'+
      '<h3>'+esc(title)+'</h3>'+
      '<p>إضافة مباشرة داخل نفس القوائم الموجودة.</p>'+
      '<label>Name</label><input id="sugoTinyName" placeholder="Name">'+
      (isTopic ? topicBuilderHtml() : '')+
      '<div class="sugo-tiny-plus-actions"><button class="sugo-tiny-plus-cancel" type="button">Cancel</button><button class="sugo-tiny-plus-save" type="button">Save</button></div></div>';
    document.body.appendChild(bd);
    if(isTopic){
      var modeEl=bd.querySelector('#sugoTinyMode');
      if(modeEl){ modeEl.onchange=function(){ refreshTopicMode(bd); }; refreshTopicMode(bd); }
    }
    bd.querySelector('.sugo-tiny-plus-cancel').onclick=function(){bd.remove();};
    bd.querySelector('.sugo-tiny-plus-save').onclick=async function(){
      var name=cleanText(bd.querySelector('#sugoTinyName').value,180);
      if(!name){alert('Write a name.'); return;}
      var item={type:level,id:slug(name,level),label:name,updatedAt:new Date().toISOString()};

      if(level==='category') item.rootKey=rootKey(path.root);
      if(level==='section'){
        item.rootKey=rootKey(path.root);
        item.categoryKey=catKey(path.category);
      }
      if(level==='topic'){
        item.rootKey=rootKey(path.root);
        item.categoryKey=catKey(path.category);
        item.sectionKey=secKey(path.section);
        item.paneId=slug(name,'custom-topic');
        var meta=collectTopicMeta(bd,name);
        var hasAny = (meta.mode==='text') ? (meta.enText || meta.arText) : (meta.enAnswer || meta.arAnswer || meta.enTicket || meta.arTicket || meta.enMention || meta.arMention);
        if(!hasAny){ alert('Add Arabic or English content first.'); return; }
        item.body=packTopicMeta(meta);
        item.html=makeTopicHtmlFromMeta(meta,name);
      }

      menuState=cleanState(menuState);
      menuState.items.push(item);
      menuState.updatedAt=new Date().toISOString();

      if(await saveMenu()){
        bd.remove();
        refreshMenuAfterChange(item.paneId || item.id);
      } else {
        menuState.items.pop();
      }
    };
    setTimeout(function(){var i=bd.querySelector('#sugoTinyName'); if(i) i.focus();},30);
  }

  function updateCustomItem(target, newName){
    var changed=false;
    (menuState.items||[]).forEach(function(item){
      if(isControlItem(item)) return;
      if(item.id===target.key || item.paneId===target.key){
        item.label=newName;
        item.updatedAt=new Date().toISOString();
        if(item.type==='topic' && item.html && item.body){
          var meta=unpackTopicMeta(item.body);
          if(meta){
            if(!meta.enTitle || meta.enTitle===target.label) meta.enTitle=newName;
            if(!meta.arTitle || meta.arTitle===target.label) meta.arTitle=newName;
            item.body=packTopicMeta(meta);
            item.html=makeTopicHtmlFromMeta(meta,newName);
          } else {
            item.html=makePaneHtml(newName,item.body);
          }
        }
        changed=true;
      }
    });
    return changed;
  }

  function removeCustomItem(target){
    var before=(menuState.items||[]).length;
    var t=target;
    menuState.items=(menuState.items||[]).filter(function(item){
      if(isControlItem(item)) return true;
      if(item.id===t.key || item.paneId===t.key) return false;
      if(t.level==='root' && item.rootKey===t.key) return false;
      if(t.level==='category' && item.categoryKey===t.key) return false;
      if(t.level==='section' && item.sectionKey===t.key) return false;
      return true;
    });
    return menuState.items.length!==before;
  }

  function openRename(level){
    if(level === 'topic'){
      openEditTopicModal();
      return;
    }
    var target=getSelectedTarget(level);
    if(!target){ alert('Choose item first.'); return; }
    var bd=document.createElement('div');
    bd.className='sugo-tiny-plus-backdrop active';
    bd.innerHTML='<div class="sugo-tiny-plus-card"><h3>Edit name</h3><p>تعديل اسم العنصر المختار فقط.</p><label>Name</label><input id="sugoTinyName" placeholder="Name" value="'+attr(target.label)+'"><div class="sugo-tiny-plus-actions"><button class="sugo-tiny-plus-cancel" type="button">Cancel</button><button class="sugo-tiny-plus-save" type="button">Save</button></div></div>';
    document.body.appendChild(bd);
    bd.querySelector('.sugo-tiny-plus-cancel').onclick=function(){bd.remove();};
    bd.querySelector('.sugo-tiny-plus-save').onclick=async function(){
      var name=cleanText(bd.querySelector('#sugoTinyName').value,180);
      if(!name){ alert('Write a name.'); return; }
      menuState=cleanState(menuState);
      if(!updateCustomItem(target,name)) setRename(level,target.key,name);
      menuState.updatedAt=new Date().toISOString();
      if(await saveMenu()){
        bd.remove();
        refreshMenuAfterChange(target.level==='topic' ? target.key : '');
      }
    };
    setTimeout(function(){var i=bd.querySelector('#sugoTinyName'); if(i){ i.focus(); i.select(); }},30);
  }

  async function deleteSelected(level){
    var target=getSelectedTarget(level);
    if(!target){ alert('Choose item first.'); return; }
    if(!confirm('Delete "'+target.label+'"?')) return;
    menuState=cleanState(menuState);
    if(!removeCustomItem(target)) setDelete(level,target.key);
    menuState.updatedAt=new Date().toISOString();
    if(await saveMenu()){
      try{
        if(target.level==='root'){ var sel=byId('sugoLibrarySelect'); if(sel){ var opt=sel.querySelector('option[value="'+cssEsc(target.key)+'"]'); if(opt) opt.remove(); } }
        if(target.el && target.el.remove) target.el.remove();
      }catch(e){}
      refreshMenuAfterChange('');
    }
  }

  function openLevelPicker(action){
    var labels={add:'Add',rename:'Edit name',del:'Delete'};
    var bd=document.createElement('div');
    bd.className='sugo-tiny-plus-backdrop active';
    bd.innerHTML='<div class="sugo-tiny-plus-card" style="width:min(94vw,520px)">'+
      '<h3>'+esc(labels[action]||'Edit')+'</h3>'+
      '<p>اختر المستوى الذي تريد العمل عليه. القائمة المختارة حاليًا ستُستخدم كمرجع.</p>'+
      '<div class="sugo-admin-level-grid">'+
        '<button data-level="root" type="button">Menu</button>'+
        '<button data-level="category" type="button">Category</button>'+
        '<button data-level="section" type="button">Section</button>'+
        '<button data-level="topic" type="button">Topic</button>'+
      '</div>'+
      '<div class="sugo-tiny-plus-actions"><button class="sugo-tiny-plus-cancel" type="button">Cancel</button></div>'+
    '</div>';
    document.body.appendChild(bd);
    bd.querySelector('.sugo-tiny-plus-cancel').onclick=function(){bd.remove();};
    Array.prototype.forEach.call(bd.querySelectorAll('[data-level]'), function(btn){
      btn.onclick=function(){
        var level=btn.getAttribute('data-level');
        bd.remove();
        if(action==='add') openAdd(level);
        else if(action==='rename') openRename(level);
        else if(action==='del') deleteSelected(level);
      };
    });
  }

  async function openAdminEditTools(anchor){
    if(!adminMode || !adminPassword){
      var ok=await unlockAdmin();
      if(!ok) return;
    }
    var old=document.getElementById('sugoTinyAdminPopover');
    if(old){ old.remove(); return; }
    var pop=document.createElement('div');
    pop.id='sugoTinyAdminPopover';
    pop.className='sugo-tiny-admin-popover';
    pop.innerHTML='<button type="button" data-action="add" title="Add">+</button><button type="button" data-action="rename" title="Edit name">✎</button><button type="button" data-action="del" title="Delete">×</button>';
    document.body.appendChild(pop);
    var r=anchor.getBoundingClientRect();
    pop.style.left=Math.max(8, Math.min(window.innerWidth-120, r.right + 8))+'px';
    pop.style.top=Math.max(8, r.top - 2)+'px';
    pop.onclick=function(e){
      var b=e.target.closest && e.target.closest('button[data-action]');
      if(!b) return;
      e.preventDefault(); e.stopPropagation();
      var action=b.getAttribute('data-action');
      pop.remove();
      openLevelPicker(action);
    };
    setTimeout(function(){
      function closer(e){
        if(pop && !pop.contains(e.target) && e.target!==anchor){ pop.remove(); document.removeEventListener('click',closer,true); }
      }
      document.addEventListener('click',closer,true);
    },0);
  }

  function installTinyButtons(){
    var label=document.querySelector('label[for="sugoLibrarySelect"]');
    if(!label || label.dataset.sugoSingleAdminEdit==='1') return;
    var row=document.createElement('div');
    row.className='sugo-tiny-label-row sugo-single-edit-row';
    label.parentNode.insertBefore(row,label);
    row.appendChild(label);
    var btn=document.createElement('button');
    btn.className='sugo-single-edit-btn';
    btn.type='button';
    btn.textContent='Edit';
    btn.title='Admin edit menu';
    btn.onclick=function(e){e.preventDefault();e.stopPropagation();openAdminEditTools(btn);};
    row.appendChild(btn);
    label.dataset.sugoSingleAdminEdit='1';
  }

  window.SUGO_TINY_PLUS_EDIT_TOPIC = function(paneId){
    var target = topicTargetByPaneId(paneId) || getSelectedTarget('topic');
    if(!target) return false;
    return openEditTopicModal(target);
  };

  // Critical: apply cached custom menus, renames, and deletes immediately before the original cascade menu initializes.
  menuState=readCache();
  applyMenu(menuState);

  function fetchFreshMenu(){
    fetch(WORKER_URL+'/menu?ts='+Date.now()).then(function(r){return r.json();}).then(function(data){
      if(data && data.ok && data.menu){
        var fresh=cleanState(data.menu);
        if(!sameState(fresh, menuState)){
          menuState=fresh;
          writeCache(fresh);
          applyMenu(fresh);
          installTinyButtons();
          if(window.SugoApp && window.SugoApp.navigation && typeof window.SugoApp.navigation.refreshMenuDom === 'function'){
            window.SugoApp.navigation.refreshMenuDom({});
          }
        } else {
          sessionStorage.removeItem('sugo_menu_refresh_once');
        }
      }
    }).catch(function(){});
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', function(){
      installTinyButtons();
      setTimeout(installTinyButtons,500);
      fetchFreshMenu();
    });
  } else {
    installTinyButtons();
    setTimeout(installTinyButtons,500);
    fetchFreshMenu();
  }
})();


// ===== extracted from #sugo-robust-content-language-dropdown-fix-js =====
(function(){
  'use strict';
  if(window.__SUGO_ROBUST_CONTENT_LANGUAGE_DROPDOWN_FIX__) return;
  window.__SUGO_ROBUST_CONTENT_LANGUAGE_DROPDOWN_FIX__ = true;

  var LANG_LABELS = { all:'All', en:'English', ar:'Arabic' };
  var TYPE_LABELS = {
    all:'All', answer:'Answer', ticket:'Ticket', text:'Text', form:'Form', mention:'Mention',
    escalation:'Escalation', internal:'Internal', overview:'Overview', usecase:'Use Case', checklist:'Required Info', flow:'Steps'
  };
  var TYPE_ORDER = ['all','answer','ticket','text','form','mention','escalation','internal','checklist','overview','usecase','flow'];

  function qsa(root, selector){ return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function esc(value){ return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[c]; }); }
  function uniq(values){
    var out=[], seen=Object.create(null);
    (values || []).forEach(function(v){ v=String(v || '').trim(); if(v && !seen[v]){ seen[v]=true; out.push(v); } });
    return out;
  }
  function orderedTypes(values){
    return uniq(values).sort(function(a,b){
      var ia=TYPE_ORDER.indexOf(a); if(ia<0) ia=999;
      var ib=TYPE_ORDER.indexOf(b); if(ib<0) ib=999;
      return ia-ib || a.localeCompare(b);
    });
  }
  function optionLabel(group, value){ return (group === 'lang' ? LANG_LABELS[value] : TYPE_LABELS[value]) || value; }
  function optionHtml(group, values, selected){
    return values.map(function(v){ return '<option value="'+esc(v)+'"'+(v===selected?' selected':'')+'>'+esc(optionLabel(group,v))+'</option>'; }).join('');
  }
  function values(card, group){
    var attr = group === 'lang' ? 'data-lang' : 'data-type';
    var list = qsa(card, '.sugo-section').map(function(section){ return section.getAttribute(attr) || (group === 'lang' ? 'all' : 'text'); });
    list = group === 'type' ? orderedTypes(list) : uniq(list);
    if(list.length > 1 && list.indexOf('all') === -1) list.unshift('all');
    return list.length ? list : ['all'];
  }
  function setHiddenButton(card, group, value){
    var controls = card && card.querySelector('.sugo-view-controls');
    if(!controls) return;
    var btn = controls.querySelector('.sugo-view-btn[data-filter-group="'+group+'"][data-value="'+value+'"]') ||
      controls.querySelector('.sugo-view-btn[data-filter-group="'+group+'"][data-value="all"]') ||
      controls.querySelector('.sugo-view-btn[data-filter-group="'+group+'"]');
    qsa(controls, '.sugo-view-btn[data-filter-group="'+group+'"]').forEach(function(b){ b.classList.remove('active'); });
    if(btn) btn.classList.add('active');
  }
  function activeValue(card, group){
    var panel = card && (card.querySelector(':scope > .sugo-min-filter-panel') || card.querySelector('.sugo-min-filter-panel'));
    var sel = panel ? panel.querySelector('select[data-sugo-min="'+group+'"]') : null;
    if(sel && sel.value) return sel.value;
    var controls = card && card.querySelector('.sugo-view-controls');
    var active = controls ? controls.querySelector('.sugo-view-btn.active[data-filter-group="'+group+'"]') : null;
    if(active) return active.getAttribute('data-value') || 'all';
    try { return localStorage.getItem('sugo_content_filter_' + group) || 'all'; } catch(e) { return 'all'; }
  }
  function ensurePanel(card){
    if(!card || !card.querySelector('.sugo-section')) return null;
    var panel = card.querySelector(':scope > .sugo-min-filter-panel') || card.querySelector('.sugo-min-filter-panel');
    if(panel) return panel;
    panel = document.createElement('div');
    panel.className = 'sugo-min-filter-panel';
    panel.innerHTML = '<div class="sugo-min-filter-row">'+
      '<label class="sugo-min-field"><span class="sugo-min-label">Copy</span><button type="button" class="sugo-min-copy-btn" data-sugo-min="copy">Copy</button></label>'+
      '<label class="sugo-min-field"><span class="sugo-min-label">Content</span><select class="sugo-min-select" data-sugo-min="type"></select></label>'+
      '<label class="sugo-min-field"><span class="sugo-min-label">Language</span><select class="sugo-min-select" data-sugo-min="lang"></select></label>'+
      '</div>';
    var before = card.querySelector('.sugo-view-controls') || card.firstChild;
    card.insertBefore(panel, before);
    return panel;
  }
  function sync(card){
    var panel = ensurePanel(card);
    if(!panel) return;
    var langVals = values(card, 'lang');
    var typeVals = values(card, 'type');
    var langActive = activeValue(card, 'lang');
    var typeActive = activeValue(card, 'type');
    if(langVals.indexOf(langActive) < 0) langActive = langVals.indexOf('all') >= 0 ? 'all' : langVals[0];
    if(typeVals.indexOf(typeActive) < 0) typeActive = typeVals.indexOf('all') >= 0 ? 'all' : typeVals[0];
    var langSel = panel.querySelector('select[data-sugo-min="lang"]');
    var typeSel = panel.querySelector('select[data-sugo-min="type"]');
    if(langSel){ langSel.innerHTML = optionHtml('lang', langVals, langActive); langSel.value = langActive; langSel.disabled = langVals.length <= 1; }
    if(typeSel){ typeSel.innerHTML = optionHtml('type', typeVals, typeActive); typeSel.value = typeActive; typeSel.disabled = typeVals.length <= 1; }
    setHiddenButton(card, 'lang', langActive);
    setHiddenButton(card, 'type', typeActive);
  }
  function apply(card){
    if(!card) return;
    var lang = activeValue(card, 'lang');
    var type = activeValue(card, 'type');
    setHiddenButton(card, 'lang', lang);
    setHiddenButton(card, 'type', type);
    var visible = 0;
    qsa(card, '.sugo-section').forEach(function(section){
      var sl = section.getAttribute('data-lang') || 'all';
      var st = section.getAttribute('data-type') || 'text';
      var show = (lang === 'all' || sl === 'all' || sl === lang) && (type === 'all' || st === type);
      section.classList.toggle('content-filtered-hidden', !show);
      if(show) visible++;
    });
    qsa(card, '.macro-col').forEach(function(col){
      var sections = qsa(col, '.sugo-section');
      if(!sections.length) return;
      var hasVisible = sections.some(function(s){ return !s.classList.contains('content-filtered-hidden'); });
      col.classList.toggle('sugo-col-hidden', !hasVisible);
    });
    qsa(card, '.macro-grid').forEach(function(grid){
      var count = qsa(grid, '.macro-col').filter(function(col){ return !col.classList.contains('sugo-col-hidden'); }).length;
      grid.classList.toggle('sugo-single-col', count === 1);
    });
    qsa(card, '.sugo-internal-panel').forEach(function(panel){
      var hasVisible = qsa(panel, '.sugo-section').some(function(s){ return !s.classList.contains('content-filtered-hidden'); });
      panel.classList.toggle('sugo-panel-hidden', !hasVisible);
    });
    var empty = card.querySelector('.sugo-filter-empty');
    if(empty) empty.style.display = visible ? 'none' : 'block';
  }
  function initCard(card){
    if(!card || !card.querySelector('.sugo-section')) return;
    ensurePanel(card);
    sync(card);
    apply(card);
  }
  function refresh(scope){ qsa(scope || document, '.doc-card').forEach(initCard); }

  window.sugoApplyContentVisibility = apply;
  window.SUGO_FORCE_FILTER_REFRESH = function(){ refresh(document); };

  document.addEventListener('change', function(event){
    var sel = event.target && event.target.closest && event.target.closest('.sugo-min-filter-panel select[data-sugo-min]');
    if(!sel) return;
    var group = sel.getAttribute('data-sugo-min');
    if(group !== 'lang' && group !== 'type') return;
    var card = sel.closest('.doc-card');
    if(!card) return;
    try { localStorage.setItem('sugo_content_filter_' + group, sel.value); } catch(e) {}
    setHiddenButton(card, group, sel.value);
    apply(card);
    setTimeout(function(){ sync(card); apply(card); }, 0);
    setTimeout(function(){ sync(card); apply(card); }, 80);
  }, true);

  var oldShowPane = window.showPane;
  if(typeof oldShowPane === 'function' && !oldShowPane.__sugoFilterFixWrapped){
    var wrappedShowPane = function(){
      var result = oldShowPane.apply(this, arguments);
      setTimeout(function(){ refresh(document); }, 0);
      setTimeout(function(){ refresh(document); }, 120);
      return result;
    };
    wrappedShowPane.__sugoFilterFixWrapped = true;
    window.showPane = wrappedShowPane;
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ refresh(document); });
  else refresh(document);
  setTimeout(function(){ refresh(document); }, 150);
  setTimeout(function(){ refresh(document); }, 600);
  try{
    new MutationObserver(function(records){
      var needs = false;
      records.forEach(function(record){ if(record.addedNodes && record.addedNodes.length) needs = true; });
      if(needs) setTimeout(function(){ refresh(document); }, 30);
    }).observe(document.body, { childList:true, subtree:true });
  }catch(e){}
})();


// ===== extracted from #sugo-remove-redundant-ticket-meta-js =====
(function(){
  function clearRedundantTicketMeta(){
    var ids = ['aiTicketBuilderPanel','sugoTicketSide','aiAuditPanel','aiSources'];
    ids.forEach(function(id){
      var el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = '';
      el.setAttribute('hidden','hidden');
      el.classList.remove('active','has-items');
      el.style.display = 'none';
    });
  }
  function disabledRenderer(){
    clearRedundantTicketMeta();
  }
  try {
    window.renderAISources = disabledRenderer;
    window.renderAIAnswerAudit = disabledRenderer;
    window.renderSmartTicketBuilder = disabledRenderer;
  } catch (e) {}
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', clearRedundantTicketMeta);
  } else {
    clearRedundantTicketMeta();
  }
  try {
    new MutationObserver(clearRedundantTicketMeta).observe(document.documentElement, { childList:true, subtree:true });
  } catch (e) {}
})();


// ===== extracted from #sugo-visible-favorite-button-js =====
(function(){
  'use strict';
  if(window.__SUGO_VISIBLE_FAVORITE_BUTTON__) return;
  window.__SUGO_VISIBLE_FAVORITE_BUTTON__ = true;

  var FAV_KEY = 'sugo_favorite_panes_v1';
  var MAX_FAV_DISPLAY = 16;

  function byId(id){ return document.getElementById(id); }
  function safeParse(value){ try{ var parsed = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed : []; }catch(e){ return []; } }
  function readFavorites(){ return safeParse(localStorage.getItem(FAV_KEY)); }
  function writeFavorites(list){ try{ localStorage.setItem(FAV_KEY, JSON.stringify(list || [])); }catch(e){} }
  function paneStore(){ try{ return window.paneContent || paneContent || null; }catch(e){ return window.paneContent || null; } }
  function paneExists(paneId){ var store = paneStore(); return !!(paneId && store && store[paneId]); }
  function uniquePaneList(list){
    var seen = Object.create(null);
    return (list || []).map(function(id){ return String(id || '').trim(); }).filter(function(id){
      if(!id || seen[id] || !paneExists(id)) return false;
      seen[id] = true;
      return true;
    });
  }
  function isFavorite(paneId){ return uniquePaneList(readFavorites()).indexOf(String(paneId || '').trim()) >= 0; }
  function cssEscape(value){
    if(window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value || '').replace(/[^a-zA-Z0-9_-]/g, function(ch){ return '\\' + ch; });
  }
  function esc(value){ return String(value || '').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]; }); }
  function getNavButton(paneId){ return document.querySelector('.nav-l000-btn[data-pane="' + cssEscape(paneId) + '"]'); }
  function getPaneTitle(paneId){
    var btn = getNavButton(paneId);
    if(btn && btn.textContent.trim()) return btn.textContent.trim();
    return String(paneId || '').replace(/^sv-refined-|^sv-clean-|^sv-/, '').replace(/-/g, ' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); });
  }
  function getPanePath(paneId){
    var btn = getNavButton(paneId);
    if(!btn) return 'SUGO SOP';
    var parts = [];
    var l00 = btn.closest('.nav-l00');
    var l0 = btn.closest('.nav-l0');
    var root = btn.closest('.nav-lroot');
    [root && root.querySelector(':scope > .nav-lroot-btn > span'), l0 && l0.querySelector(':scope > .nav-l0-btn span'), l00 && l00.querySelector(':scope > .nav-l00-btn span')].forEach(function(el){
      if(el && el.textContent.trim()) parts.push(el.textContent.trim());
    });
    return parts.filter(Boolean).join(' › ') || 'SUGO SOP';
  }
  function activePane(){ return document.querySelector('.content-pane.active'); }
  function activePaneId(){
    var pane = activePane();
    if(pane && pane.id) return pane.id.replace(/^pane-/, '');
    try{ return window.SUGO_ACTIVE_PANE || localStorage.getItem('sugo_last_pane') || ''; }catch(e){ return window.SUGO_ACTIVE_PANE || ''; }
  }
  function makePaneFavoriteItem(paneId){
    return '<button type="button" class="sugo-fr-item" data-sugo-fr-open="' + esc(paneId) + '">' +
      '<span class="sugo-fr-icon sugo-fr-icon-favorite">F</span>' +
      '<span class="sugo-fr-main"><span class="sugo-fr-name">' + esc(getPaneTitle(paneId)) + '</span><span class="sugo-fr-path">' + esc(getPanePath(paneId)) + '</span></span>' +
      '<span class="sugo-fr-remove" role="button" tabindex="0" data-sugo-fr-remove="' + esc(paneId) + '" title="Remove favorite" aria-label="Remove favorite">×</span>' +
      '</button>';
  }
  function softRefreshQuickAccess(){
    try{ if(window.SUGOFavoritesRecent && typeof window.SUGOFavoritesRecent.refresh === 'function') window.SUGOFavoritesRecent.refresh(); }catch(e){}
    try{ if(window.SUGOFavoritesRemoveGuard && typeof window.SUGOFavoritesRemoveGuard.refresh === 'function') window.SUGOFavoritesRemoveGuard.refresh(); }catch(e){}

    var favBox = byId('sugoFavoritesList');
    if(favBox && !favBox.querySelector('.sugo-fr-item')){
      var paneFavorites = uniquePaneList(readFavorites()).slice(0, MAX_FAV_DISPLAY);
      if(paneFavorites.length){
        favBox.innerHTML = paneFavorites.map(makePaneFavoriteItem).join('');
      }else if(!favBox.querySelector('.sugo-fr-empty')){
        favBox.innerHTML = '<div class="sugo-fr-empty">No favorites yet. Open any macro and press Favorite.</div>';
      }
    }

    var favCount = byId('sugoFavCount');
    var recentCount = byId('sugoRecentCount');
    var recentBox = byId('sugoRecentList');
    if(favCount && favBox) favCount.textContent = String(favBox.querySelectorAll('.sugo-fr-item').length);
    if(recentCount && recentBox) recentCount.textContent = String(recentBox.querySelectorAll('.sugo-fr-item').length);
  }
  function setFavorite(paneId, enabled){
    paneId = String(paneId || '').trim();
    if(!paneExists(paneId)) return;
    var list = uniquePaneList(readFavorites());
    var idx = list.indexOf(paneId);
    if(enabled && idx < 0) list.unshift(paneId);
    if(!enabled && idx >= 0) list.splice(idx, 1);
    writeFavorites(list);
    softRefreshQuickAccess();
    paintAllFavoriteButtons();
  }
  function toggleFavorite(paneId){ setFavorite(paneId, !isFavorite(paneId)); }
  function paintButton(btn, paneId){
    var active = isFavorite(paneId);
    var state = active ? 'on' : 'off';
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.setAttribute('title', active ? 'Remove from Favorites' : 'Add to Favorites');
    if(btn.getAttribute('data-sugo-fav-state') !== state){
      btn.setAttribute('data-sugo-fav-state', state);
      btn.innerHTML = '<span class="sugo-visible-fav-star">' + (active ? '★' : '☆') + '</span>' + (active ? 'Favorited' : 'Favorite');
    }
  }
  function ensureToolbar(pane, paneId){
    var toolbar = pane.querySelector(':scope > .sugo-direct-edit-toolbar');
    if(!toolbar){
      toolbar = document.createElement('div');
      toolbar.className = 'sugo-direct-edit-toolbar sugo-visible-fav-toolbar';
      var closeBtn = pane.querySelector(':scope > .close-pane-btn');
      if(closeBtn && closeBtn.nextSibling) pane.insertBefore(toolbar, closeBtn.nextSibling);
      else pane.insertBefore(toolbar, pane.firstChild);
    }
    toolbar.querySelectorAll('[data-sugo-visible-fav]').forEach(function(old){
      if(old.getAttribute('data-sugo-visible-fav') !== paneId) old.remove();
    });
    var btn = toolbar.querySelector('[data-sugo-visible-fav="' + cssEscape(paneId) + '"]');
    if(!btn){
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sugo-direct-favorite-btn';
      btn.setAttribute('data-sugo-visible-fav', paneId);
      toolbar.appendChild(btn);
    }
    paintButton(btn, paneId);
  }
  function ensureCardBar(pane, paneId){
    var card = pane.querySelector('.doc-card');
    if(!card) return;
    var bar = card.querySelector(':scope > .sugo-fr-cardbar');
    if(!bar){
      bar = document.createElement('div');
      bar.className = 'sugo-fr-cardbar';
      bar.setAttribute('data-pane-id', paneId);
      card.insertBefore(bar, card.firstChild);
    }
    var active = isFavorite(paneId);
    var title = getPaneTitle(paneId);
    var path = getPanePath(paneId);
    var state = paneId + '|' + (active ? 'on' : 'off') + '|' + title + '|' + path;
    if(bar.getAttribute('data-sugo-card-state') === state) return;
    bar.setAttribute('data-sugo-card-state', state);
    bar.innerHTML = '<div class="sugo-fr-cardmeta"><div class="sugo-fr-cardtitle">' + esc(title) + '</div><div class="sugo-fr-cardpath">' + esc(path) + '</div></div>' +
      '<button type="button" class="sugo-fr-favbtn' + (active ? ' active' : '') + '" data-sugo-fav-toggle="' + esc(paneId) + '"><span class="sugo-fr-badge">' + (active ? '★' : '☆') + '</span>' + (active ? 'Favorited' : 'Add Favorite') + '</button>';
  }
  function syncActiveFavorite(){
    var pane = activePane();
    var paneId = activePaneId();
    if(!pane || !paneId || !paneExists(paneId)) return;
    ensureToolbar(pane, paneId);
    ensureCardBar(pane, paneId);
    softRefreshQuickAccess();
  }
  function paintAllFavoriteButtons(){
    document.querySelectorAll('[data-sugo-visible-fav]').forEach(function(btn){ paintButton(btn, btn.getAttribute('data-sugo-visible-fav')); });
    document.querySelectorAll('[data-sugo-fav-toggle]').forEach(function(btn){
      var paneId = btn.getAttribute('data-sugo-fav-toggle');
      var active = isFavorite(paneId);
      btn.classList.toggle('active', active);
      btn.innerHTML = '<span class="sugo-fr-badge">' + (active ? '★' : '☆') + '</span>' + (active ? 'Favorited' : 'Add Favorite');
    });
  }

  document.addEventListener('click', function(event){
    var btn = event.target && event.target.closest && event.target.closest('[data-sugo-visible-fav]');
    if(!btn) return;
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    toggleFavorite(btn.getAttribute('data-sugo-visible-fav'));
  }, true);

  var originalShowPane = window.showPane;
  if(typeof originalShowPane === 'function' && !originalShowPane.__sugoVisibleFavoriteWrapped){
    var wrapped = function(){
      var result = originalShowPane.apply(this, arguments);
      setTimeout(syncActiveFavorite, 0);
      setTimeout(syncActiveFavorite, 120);
      return result;
    };
    wrapped.__sugoVisibleFavoriteWrapped = true;
    window.showPane = wrapped;
    try{ showPane = window.showPane; }catch(e){}
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(syncActiveFavorite, 80); });
  else setTimeout(syncActiveFavorite, 80);
  window.addEventListener('load', function(){ setTimeout(syncActiveFavorite, 80); setTimeout(syncActiveFavorite, 600); });
  document.addEventListener('click', function(event){
    if(event.target && event.target.closest && event.target.closest('.nav-l000-btn,[data-sugo-fr-open]')){
      setTimeout(syncActiveFavorite, 80);
      setTimeout(syncActiveFavorite, 220);
    }
  }, true);
  try{ new MutationObserver(function(){ setTimeout(syncActiveFavorite, 60); }).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] }); }catch(e){}
  setInterval(syncActiveFavorite, 1200);

  window.SUGOVisibleFavoriteButton = { sync: syncActiveFavorite, toggle: toggleFavorite, set: setFavorite, isFavorite: isFavorite };
})();


// SUGO Stage 2 lazy pane split applied.
