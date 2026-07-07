// ===== legacy-runtime-script-1 =====

// Global variables and helper functions
const paneContent = {};
const renderedPanes = new Set();
let sugoTopicsCache = null;

function setPane(id, html) {
  paneContent[id] = { en: html };
}

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

/* lazy-loaded pane removed from startup bundle: account-support-optimized */

/* lazy-loaded pane removed from startup bundle: payment-support-optimized */

/* lazy-loaded pane removed from startup bundle: function-support-optimized */

/* lazy-loaded pane removed from startup bundle: withdrawal-exchange-support-optimized */

/* lazy-loaded pane removed from startup bundle: game-level-support-optimized */

/* lazy-loaded pane removed from startup bundle: binding-ticket-optimized */

/* lazy-loaded pane removed from startup bundle: reporting-ticket-optimized */

/* lazy-loaded pane removed from startup bundle: banned-ticket-optimized */

/* lazy-loaded pane removed from startup bundle: agency-ticket-optimized */

/* lazy-loaded pane removed from startup bundle: games-ticket-optimized */

/* lazy-loaded pane removed from startup bundle: online-recharge-ticket-optimized */

/* lazy-loaded pane removed from startup bundle: withdrawal-coin-ticket-optimized */

/* lazy-loaded pane removed from startup bundle: app-crash-ticket-optimized */

/* lazy-loaded pane removed from startup bundle: change-country-ticket-optimized */

/* lazy-loaded pane removed from startup bundle: location-ticket-optimized */

/* lazy-loaded pane removed from startup bundle: tasks-ticket-optimized */

/* lazy-loaded pane removed from startup bundle: senior-cs-v51-command-center */

/* lazy-loaded pane removed from startup bundle: senior-cs-escalation-directory */

/* lazy-loaded pane removed from startup bundle: senior-cs-missing-info-checklists */

/* lazy-loaded pane removed from startup bundle: senior-cs-backend-links-reference */
// ========== SENIOR CS - SMALL & SUB AGENCY ==========

/* lazy-loaded pane removed from startup bundle: senior-cs-agency-activation */

/* lazy-loaded pane removed from startup bundle: senior-cs-agency-management */

/* lazy-loaded pane removed from startup bundle: senior-cs-sub-agency */

/* lazy-loaded pane removed from startup bundle: senior-cs-commission-targets */

/* lazy-loaded pane removed from startup bundle: senior-cs-agency-tasks */

/* lazy-loaded pane removed from startup bundle: senior-cs-rating-groups */

/* lazy-loaded pane removed from startup bundle: senior-cs-activities */

/* lazy-loaded pane removed from startup bundle: senior-cs-backend-system */

/* lazy-loaded pane removed from startup bundle: account-register-signup */

/* lazy-loaded pane removed from startup bundle: account-register-limits */

/* lazy-loaded pane removed from startup bundle: account-login-login */

/* lazy-loaded pane removed from startup bundle: account-login-issues */

/* lazy-loaded pane removed from startup bundle: account-login-recovery */

/* lazy-loaded pane removed from startup bundle: account-login-phone */

/* lazy-loaded pane removed from startup bundle: account-login-multidevice */

/* lazy-loaded pane removed from startup bundle: account-login-methods */

/* lazy-loaded pane removed from startup bundle: account-security-sms */

/* lazy-loaded pane removed from startup bundle: account-security-reset */

/* lazy-loaded pane removed from startup bundle: account-security-link */

/* lazy-loaded pane removed from startup bundle: account-security-recovery */

/* lazy-loaded pane removed from startup bundle: account-profile-picture */

/* lazy-loaded pane removed from startup bundle: account-profile-nickname */

/* lazy-loaded pane removed from startup bundle: account-profile-gender */

/* lazy-loaded pane removed from startup bundle: account-profile-location */

/* lazy-loaded pane removed from startup bundle: account-profile-distance */

/* lazy-loaded pane removed from startup bundle: account-ban-reasons */

/* lazy-loaded pane removed from startup bundle: account-ban-unban */

/* lazy-loaded pane removed from startup bundle: account-ban-deletion */
// ===== Payment section content - Redesigned in professional support style =====


/* lazy-loaded pane removed from startup bundle: payment-recharge-process */

/* lazy-loaded pane removed from startup bundle: payment-recharge-coin-sellers */

/* lazy-loaded pane removed from startup bundle: payment-recharge-link-availability */

/* lazy-loaded pane removed from startup bundle: payment-recharge-remove-payment */

/* lazy-loaded pane removed from startup bundle: recharge-failure-menu */

/* lazy-loaded pane removed from startup bundle: payment-recharge-missing-coins */

/* lazy-loaded pane removed from startup bundle: payment-recharge-coin-history */

/* lazy-loaded pane removed from startup bundle: payment-recharge-currency-adjustment */

/* lazy-loaded pane removed from startup bundle: payment-recharge-dobi-balance */

/* lazy-loaded pane removed from startup bundle: payment-diamonds-acquisition */

/* lazy-loaded pane removed from startup bundle: payment-diamonds-exchanging */

/* lazy-loaded pane removed from startup bundle: payment-diamonds-missing-exchange */

/* lazy-loaded pane removed from startup bundle: payment-diamonds-withdrawal */

/* lazy-loaded pane removed from startup bundle: payment-diamonds-withdraw-button */

/* lazy-loaded pane removed from startup bundle: payment-diamonds-missing-quick */

/* lazy-loaded pane removed from startup bundle: payment-diamonds-remove-options */

/* lazy-loaded pane removed from startup bundle: payment-vip-overview */

/* lazy-loaded pane removed from startup bundle: payment-vip-experience-card */

/* lazy-loaded pane removed from startup bundle: payment-vip-card-effect-svip */

/* lazy-loaded pane removed from startup bundle: payment-vip-unexpected-deduction */

/* lazy-loaded pane removed from startup bundle: payment-svip-privileges */

/* lazy-loaded pane removed from startup bundle: payment-svip-becoming */

/* lazy-loaded pane removed from startup bundle: payment-svip-degradation */

/* lazy-loaded pane removed from startup bundle: payment-svip-points */

/* lazy-loaded pane removed from startup bundle: payment-svip-level-requirements */

/* lazy-loaded pane removed from startup bundle: payment-svip-unexpected-deduction */

/* lazy-loaded pane removed from startup bundle: payment-svip-dynamic-nickname */

/* lazy-loaded pane removed from startup bundle: payment-svip-unique-id */

/* lazy-loaded pane removed from startup bundle: payment-svip-elite-club */

/* lazy-loaded pane removed from startup bundle: payment-svip-offline-recharge */

/* lazy-loaded pane removed from startup bundle: payment-aristocracy-overview */

/* lazy-loaded pane removed from startup bundle: payment-aristocracy-invisibility */

/* lazy-loaded pane removed from startup bundle: payment-decoration-acquiring */

/* lazy-loaded pane removed from startup bundle: payment-decoration-equipping */

/* lazy-loaded pane removed from startup bundle: payment-decoration-entry-effect */
// ===== Function section content - Redesigned in professional support style =====
// ========== SOCIAL ==========


/* lazy-loaded pane removed from startup bundle: function-social-searching-friends */

/* lazy-loaded pane removed from startup bundle: function-social-user-not-found */

/* lazy-loaded pane removed from startup bundle: function-social-finding-account-id */

/* lazy-loaded pane removed from startup bundle: function-social-coins-deducted-messages */

/* lazy-loaded pane removed from startup bundle: function-social-varying-coin-costs */

/* lazy-loaded pane removed from startup bundle: function-social-chatting-free */

/* lazy-loaded pane removed from startup bundle: function-social-following-users */

/* lazy-loaded pane removed from startup bundle: function-social-cannot-follow-more */

/* lazy-loaded pane removed from startup bundle: function-social-unfollowing-users */

/* lazy-loaded pane removed from startup bundle: function-social-unable-send-messages */

/* lazy-loaded pane removed from startup bundle: function-social-blocking-users */

/* lazy-loaded pane removed from startup bundle: function-social-blacklist-unblock */

/* lazy-loaded pane removed from startup bundle: function-social-reporting */

/* lazy-loaded pane removed from startup bundle: function-social-chat-background */

/* lazy-loaded pane removed from startup bundle: function-social-delete-chat-history */

/* lazy-loaded pane removed from startup bundle: function-social-chat-points-overview */

/* lazy-loaded pane removed from startup bundle: function-social-chat-points-importance */

/* lazy-loaded pane removed from startup bundle: function-social-chat-points-decrease */

/* lazy-loaded pane removed from startup bundle: function-social-no-diamonds-replying */

/* lazy-loaded pane removed from startup bundle: function-social-transfer-gifts */

/* lazy-loaded pane removed from startup bundle: function-social-translation-not-available */
// ========== MOMENTS ==========


/* lazy-loaded pane removed from startup bundle: function-moments-posting-failure */

/* lazy-loaded pane removed from startup bundle: function-moments-unable-comment */

/* lazy-loaded pane removed from startup bundle: function-moments-profile-shows-zero */
// ========== RELATIONSHIPS ==========


/* lazy-loaded pane removed from startup bundle: function-relationships-missing-call-voice */

/* lazy-loaded pane removed from startup bundle: function-relationships-creating */

/* lazy-loaded pane removed from startup bundle: function-relationships-not-showing */

/* lazy-loaded pane removed from startup bundle: function-relationships-ending */

/* lazy-loaded pane removed from startup bundle: function-relationships-guarding-others */

/* lazy-loaded pane removed from startup bundle: function-relationships-guardian-points */

/* lazy-loaded pane removed from startup bundle: function-relationships-hiding-guardianship */

/* lazy-loaded pane removed from startup bundle: function-relationships-ending-guardianship */
// ========== FAMILY ==========


/* lazy-loaded pane removed from startup bundle: function-family-actions-after-joining */

/* lazy-loaded pane removed from startup bundle: function-family-joining */

/* lazy-loaded pane removed from startup bundle: function-family-leaving */

/* lazy-loaded pane removed from startup bundle: function-family-hiding-info */

/* lazy-loaded pane removed from startup bundle: function-family-creating */

/* lazy-loaded pane removed from startup bundle: function-family-missing-tasks */
// ========== ROOM ==========


/* lazy-loaded pane removed from startup bundle: function-room-creating-personal */

/* lazy-loaded pane removed from startup bundle: function-room-live-requirements */

/* lazy-loaded pane removed from startup bundle: function-room-incorrect-password */

/* lazy-loaded pane removed from startup bundle: function-room-settings-adjustment */

/* lazy-loaded pane removed from startup bundle: function-room-gif-cover */

/* lazy-loaded pane removed from startup bundle: function-room-adjust-mode */

/* lazy-loaded pane removed from startup bundle: function-room-gift-effects-not-visible */

/* lazy-loaded pane removed from startup bundle: function-room-unable-follow-live */

/* lazy-loaded pane removed from startup bundle: function-room-mic-on-not-heard */

/* lazy-loaded pane removed from startup bundle: function-room-no-sound */

/* lazy-loaded pane removed from startup bundle: function-room-obtaining-tags */
// ========== TASKS ==========


/* lazy-loaded pane removed from startup bundle: function-tasks-getting-free-coins */

/* lazy-loaded pane removed from startup bundle: function-tasks-daily-no-rewards */

/* lazy-loaded pane removed from startup bundle: function-tasks-monthly-diamond-target */
// ========== HOST & AGENCY ==========


/* lazy-loaded pane removed from startup bundle: function-host-quick-greetings */

/* lazy-loaded pane removed from startup bundle: function-host-greeting-issues */

/* lazy-loaded pane removed from startup bundle: function-host-message-price */

/* lazy-loaded pane removed from startup bundle: function-host-gender-verification-failure */

/* lazy-loaded pane removed from startup bundle: function-host-repeated-verification */

/* lazy-loaded pane removed from startup bundle: function-host-becoming-host-agency */

/* lazy-loaded pane removed from startup bundle: function-host-agency-conditions-error */

/* lazy-loaded pane removed from startup bundle: function-host-creating-agency */

/* lazy-loaded pane removed from startup bundle: function-host-withdrawal-success-no-payment */

/* lazy-loaded pane removed from startup bundle: function-host-missing-withdrawal-option */

/* lazy-loaded pane removed from startup bundle: function-host-missing-quick-withdrawal */

/* lazy-loaded pane removed from startup bundle: function-host-single-video-mode */

/* lazy-loaded pane removed from startup bundle: function-host-transfer-new-agency */

/* lazy-loaded pane removed from startup bundle: function-host-blocked-multiple-accounts */

/* lazy-loaded pane removed from startup bundle: function-host-anchor-application-rejected */
// ========== GAMES & EVENTS ==========


/* lazy-loaded pane removed from startup bundle: function-games-no-reward */

/* lazy-loaded pane removed from startup bundle: function-games-crashing */

/* lazy-loaded pane removed from startup bundle: function-games-car-tycoon */

/* lazy-loaded pane removed from startup bundle: function-games-win-no-reward */

/* lazy-loaded pane removed from startup bundle: function-games-manipulation-concerns */

/* lazy-loaded pane removed from startup bundle: function-games-compensation-policy */
// ========== CLASH OF THRONES ==========


/* lazy-loaded pane removed from startup bundle: function-cot-overview */

/* lazy-loaded pane removed from startup bundle: function-cot-improving-combat-power */

/* lazy-loaded pane removed from startup bundle: function-cot-treasure-keys */

/* lazy-loaded pane removed from startup bundle: function-cot-ladder-ranking */

/* lazy-loaded pane removed from startup bundle: function-cot-upgrading-castle */

/* lazy-loaded pane removed from startup bundle: function-cot-automatic-chest */

/* lazy-loaded pane removed from startup bundle: function-cot-alliances-overview */

/* lazy-loaded pane removed from startup bundle: function-cot-unable-join-alliance */

/* lazy-loaded pane removed from startup bundle: function-cot-joining-alliance-group */

/* lazy-loaded pane removed from startup bundle: function-cot-leaving-alliance */

/* lazy-loaded pane removed from startup bundle: function-cot-guardian-beast */

/* lazy-loaded pane removed from startup bundle: function-cot-guardian-tickets */

/* lazy-loaded pane removed from startup bundle: function-cot-upgrading-city-defense */

/* lazy-loaded pane removed from startup bundle: function-cot-in-game-chat */

/* lazy-loaded pane removed from startup bundle: function-cot-starlight */
// ===== Withdrawal & Exchange =====


/* lazy-loaded pane removed from startup bundle: level-withdrawal-threshold-option */

/* lazy-loaded pane removed from startup bundle: level-withdrawal-no-option */

/* lazy-loaded pane removed from startup bundle: level-withdrawal-threshold-management */

/* lazy-loaded pane removed from startup bundle: level-withdrawal-entrance-no-quick */

/* lazy-loaded pane removed from startup bundle: level-withdrawal-quick-channel-not-support */

/* lazy-loaded pane removed from startup bundle: level-withdrawal-remove-option */

/* lazy-loaded pane removed from startup bundle: level-withdrawal-add-option */

/* lazy-loaded pane removed from startup bundle: level-withdrawal-cancel-pending */

/* lazy-loaded pane removed from startup bundle: level-transfer-threshold-option */

/* lazy-loaded pane removed from startup bundle: level-exchange-threshold-option */

/* lazy-loaded pane removed from startup bundle: level-exchange-cannot-search-id */
// ===== Game Level Requirement Content =====


/* lazy-loaded pane removed from startup bundle: game-greedy-cat */

/* lazy-loaded pane removed from startup bundle: game-rocket-crash */

/* lazy-loaded pane removed from startup bundle: game-multi-fishing */

/* lazy-loaded pane removed from startup bundle: game-texas-cowboy */

/* lazy-loaded pane removed from startup bundle: game-center */

/* lazy-loaded pane removed from startup bundle: game-lion-tiger */

/* lazy-loaded pane removed from startup bundle: game-yummy */

/* lazy-loaded pane removed from startup bundle: game-greedy-dice */

/* lazy-loaded pane removed from startup bundle: game-roulette */

/* lazy-loaded pane removed from startup bundle: game-slot-game */

/* lazy-loaded pane removed from startup bundle: game-lucky-match */

/* lazy-loaded pane removed from startup bundle: game-ludo */

/* lazy-loaded pane removed from startup bundle: game-android-restrictions */

/* lazy-loaded pane removed from startup bundle: game-permanent-restriction */

/* lazy-loaded pane removed from startup bundle: game-blacklist */
// ===== Sugo SV - tickets section content =====

// Binding

/* lazy-loaded pane removed from startup bundle: sv-tickets-binding-verification */

/* lazy-loaded pane removed from startup bundle: sv-tickets-binding-request-change-ph */

/* lazy-loaded pane removed from startup bundle: sv-tickets-binding-request-reset-password */
// Reporting

/* lazy-loaded pane removed from startup bundle: sv-tickets-reporting-abuse */

/* lazy-loaded pane removed from startup bundle: sv-tickets-reporting-issue */

/* lazy-loaded pane removed from startup bundle: sv-tickets-reporting-insulting-management */

/* lazy-loaded pane removed from startup bundle: sv-tickets-agency-create */

/* lazy-loaded pane removed from startup bundle: sv-tickets-agency-change-anchor */

/* lazy-loaded pane removed from startup bundle: sv-tickets-agency-create-sub */

/* lazy-loaded pane removed from startup bundle: sv-tickets-agency-create-recharge */

/* lazy-loaded pane removed from startup bundle: sv-tickets-agency-change-sub-to-main */

/* lazy-loaded pane removed from startup bundle: sv-tickets-games-add */

/* lazy-loaded pane removed from startup bundle: sv-tickets-games-remove */

/* lazy-loaded pane removed from startup bundle: sv-tickets-games-info */

/* lazy-loaded pane removed from startup bundle: sv-tickets-games-info-3 */

/* lazy-loaded pane removed from startup bundle: sv-tickets-crash-1 */

/* lazy-loaded pane removed from startup bundle: sv-tickets-crash-2 */

/* lazy-loaded pane removed from startup bundle: sv-tickets-country-1 */

/* lazy-loaded pane removed from startup bundle: sv-tickets-country-2 */

/* lazy-loaded pane removed from startup bundle: sv-tickets-location-disappear */

/* lazy-loaded pane removed from startup bundle: sv-tickets-location-close */

/* lazy-loaded pane removed from startup bundle: sv-tickets-tasks-match1 */

/* lazy-loaded pane removed from startup bundle: sv-tickets-tasks-match2 */

/* lazy-loaded pane removed from startup bundle: sv-tickets-tasks-match3 */

/* lazy-loaded pane removed from startup bundle: sv-tickets-tasks-daily-family */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-male-female-reason */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-male-female-unban-video */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-sexual-messages */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-sexual-picture */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-sexual-video */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-sexual-moments */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-telegram */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-underage */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-underage-video */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-ph-num */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-smoking-live */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-drug-live */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-smoking-image */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-drug-image */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-weapon-live */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-weapon-image */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-insulting */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-pretend-management */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-pretend-coin-seller */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-request-unban */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-medium-risk */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-promoting-app */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-sexual-commerce */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-private-part-lr */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-sexual-offer */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-simulator-vpn */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-refund */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-rejected-unban */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-abnormal-device */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-change-agency-failed */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-insulted-country */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-insulted-religions */

/* lazy-loaded pane removed from startup bundle: sv-tickets-ban-child-porn */

/* lazy-loaded pane removed from startup bundle: sv-tickets-withdrawal-success-not-received */

/* lazy-loaded pane removed from startup bundle: sv-tickets-withdrawal-cancel */

/* lazy-loaded pane removed from startup bundle: sv-tickets-coins-not-received */

/* lazy-loaded pane removed from startup bundle: sv-tickets-withdrawal-add-remove */

/* lazy-loaded pane removed from startup bundle: sv-tickets-recharge-ticket-1 */

/* lazy-loaded pane removed from startup bundle: sv-tickets-recharge-ticket-2 */

/* lazy-loaded pane removed from startup bundle: sv-tickets-recharge-link */

/* lazy-loaded pane removed from startup bundle: sv-tickets-recharge-first-charge */

/* lazy-loaded pane removed from startup bundle: sv-tickets-recharge-visa */

/* lazy-loaded pane removed from startup bundle: sv-tickets-recharge-agency-eg */

/* lazy-loaded pane removed from startup bundle: sv-tickets-recharge-agency-sa */

/* lazy-loaded pane removed from startup bundle: sv-tickets-recharge-agency-sy */

/* lazy-loaded pane removed from startup bundle: sv-tickets-recharge-agency-iq */

/* lazy-loaded pane removed from startup bundle: sv-tickets-recharge-agency-ae */
// ===== Sugo SV Clean Deduplicated Macros =====
// Added from user-provided ticket text; repeated variants were merged into unified professional macros.

/* lazy-loaded pane removed from startup bundle: sv-clean-welcome-help */

/* lazy-loaded pane removed from startup bundle: sv-clean-request-id */

/* lazy-loaded pane removed from startup bundle: sv-clean-request-details-evidence */

/* lazy-loaded pane removed from startup bundle: sv-clean-same-account */

/* lazy-loaded pane removed from startup bundle: sv-clean-request-submitted */

/* lazy-loaded pane removed from startup bundle: sv-clean-duplicate */

/* lazy-loaded pane removed from startup bundle: sv-clean-ownership-questions */

/* lazy-loaded pane removed from startup bundle: sv-clean-unban-video */

/* lazy-loaded pane removed from startup bundle: sv-clean-verification-rejected */

/* lazy-loaded pane removed from startup bundle: sv-clean-high-risk */

/* lazy-loaded pane removed from startup bundle: sv-clean-report-abuse */

/* lazy-loaded pane removed from startup bundle: sv-clean-ban-reason */

/* lazy-loaded pane removed from startup bundle: sv-clean-moments-watermark */

/* lazy-loaded pane removed from startup bundle: sv-clean-recharge-methods */

/* lazy-loaded pane removed from startup bundle: sv-clean-invoice */

/* lazy-loaded pane removed from startup bundle: sv-clean-recharge-failed */

/* lazy-loaded pane removed from startup bundle: sv-clean-insufficient-coins */

/* lazy-loaded pane removed from startup bundle: sv-clean-elite-club */

/* lazy-loaded pane removed from startup bundle: sv-clean-apply-agency */

/* lazy-loaded pane removed from startup bundle: sv-clean-change-agency */

/* lazy-loaded pane removed from startup bundle: sv-clean-games-conditions */

/* lazy-loaded pane removed from startup bundle: sv-clean-games-add-remove */

/* lazy-loaded pane removed from startup bundle: sv-clean-daily-family-tasks */

/* lazy-loaded pane removed from startup bundle: sv-clean-waiting-salary */

/* lazy-loaded pane removed from startup bundle: sv-clean-fast-withdrawal */

/* lazy-loaded pane removed from startup bundle: sv-clean-management-withdrawal */

/* lazy-loaded pane removed from startup bundle: sv-clean-withdrawal-screenshot */
function preparePaneElement(id) {
  if (!paneContent[id]) return null;
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
  const tmp = document.createElement('div');
  tmp.innerHTML = paneContent[id].en;
  tmp.querySelectorAll('.copy-btn').forEach(btn => {
    const textToCopy = btn.getAttribute('data-copy-text');
    const originalText = btn.innerText;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyTextToClipboard(textToCopy, btn, '✓ Copied!', originalText);
    }, { passive: false });
  });
  if (typeof initContentVisibilityControls === 'function') initContentVisibilityControls(tmp);
  container.appendChild(tmp);
  paneDiv.appendChild(container);
  contentArea.appendChild(paneDiv);
  renderedPanes.add(id);
  return paneDiv;
}

function buildPanes() {
  // v2: keep all knowledge-base data in paneContent, but do not render
  // hundreds of heavy DOM panes on startup. Panes are created on first open.
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

function showPane(paneId, save = true) {
  const pane = preparePaneElement(paneId);
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

/* lazy-loaded pane removed from startup bundle: sv-internal-change-country */

/* lazy-loaded pane removed from startup bundle: sv-internal-change-gender */

/* lazy-loaded pane removed from startup bundle: sv-internal-report */

/* lazy-loaded pane removed from startup bundle: sv-internal-binding-supporter */

/* lazy-loaded pane removed from startup bundle: sv-internal-binding-anchor */

/* lazy-loaded pane removed from startup bundle: sv-internal-recharge-issues */

/* lazy-loaded pane removed from startup bundle: sv-internal-withdraw-lateness */

/* lazy-loaded pane removed from startup bundle: sv-internal-exchange-issues */

/* lazy-loaded pane removed from startup bundle: sv-internal-create-agency */

/* lazy-loaded pane removed from startup bundle: sv-tickets-agency-admin-whatsapp-group */
// ===== New Text Coverage Gap Additions — merged into SUGO Knowledgebase =====

/* lazy-loaded pane removed from startup bundle: account-security-stolen */

/* lazy-loaded pane removed from startup bundle: account-ban-self-request */

/* lazy-loaded pane removed from startup bundle: function-tasks-room-details */

/* lazy-loaded pane removed from startup bundle: function-tasks-weekly-room-availability */

/* lazy-loaded pane removed from startup bundle: function-games-whitelist-blacklist-request */

/* lazy-loaded pane removed from startup bundle: function-cot-season-reset */
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
  let topics = [];
  for (let [id, contentMap] of Object.entries(paneContent)) {
    const tmp = document.createElement('div');
    tmp.innerHTML = contentMap.en;
    const dividers = tmp.querySelectorAll('.lang-divider');
    let enText = '', arText = '';
    if (dividers.length >= 1 && dividers[0].nextElementSibling) {
      enText = dividers[0].nextElementSibling.textContent.trim();
    }
    if (dividers.length >= 2 && dividers[1].nextElementSibling) {
      arText = dividers[1].nextElementSibling.textContent.trim();
    }
    if (!enText && !arText) enText = tmp.textContent.trim();
    topics.push({ id, enText, arText, allText: `${enText}\n${arText}`.toLowerCase() });
  }
  sugoTopicsCache = topics;
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
    const kb = getRelevantKnowledgeBaseText(query, attachedImage ? 6 : 12, attachedImage ? 2200 : 3200, preferredPaneForAI, { outputType: selectedOutputType, preferTicketTopics: isTicketOutput, smartTicket: isSmartTicket, compactPrompt: false, completeAnswer: true });
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
