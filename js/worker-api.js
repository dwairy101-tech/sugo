(() => {
  "use strict";

  window.SUGO = window.SUGO || {};

  const DEFAULT_BASE_URL = "https://sugo.dwairy101.workers.dev";
  const REQUEST_TIMEOUT_MS = 90000;
  const VALID_RESPONSE_MODES = new Set(["brief", "detailed", "step"]);
  const VALID_OUTPUT_TYPES = new Set(["answer", "ticket"]);
  const VALID_TICKET_TYPES = new Set(["customer_reply", "missing_info", "internal_escalation", "policy_sensitive"]);
  const VALID_TICKET_TONES = new Set(["professional", "empathetic", "firm"]);
  const state = {
    controller: null,
    pending: false,
    lastRequestBody: null,
    lastResponseMeta: null
  };

  class WorkerRequestError extends Error {
    constructor(message, options = {}) {
      super(message);
      this.name = options.name || "WorkerRequestError";
      this.status = options.status || 0;
      this.code = options.code || "WORKER_REQUEST_FAILED";
      this.cause = options.cause;
    }
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function formatBytes(bytes) {
    const value = Number(bytes || 0);
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(2)} MB`;
  }

  function stripPreamble(text) {
    const lines = String(text || "").split(/\r?\n/);
    const preamblePattern = /^(based on|according to|here is|here's|the following is|i found|i couldn't find|i was unable)\b/i;
    while (lines.length > 1) {
      const first = lines[0].trim();
      if (first && !/^(#{1,3}\s|[-*•]\s|\d+\.\s)/.test(first) && preamblePattern.test(first)) {
        lines.shift();
        if (lines[0] && lines[0].trim() === "") lines.shift();
      } else {
        break;
      }
    }
    return lines.join("\n").trim();
  }

  function stripLatexNotation(text) {
    const replacements = [
      [/\$\\geq?\$/g, "≥"], [/\$\\leq?\$/g, "≤"], [/\$\\neq\$/g, "≠"],
      [/\$\\rightarrow\$/g, "→"], [/\$\\leftarrow\$/g, "←"], [/\$\\times\$/g, "×"], [/\$\\div\$/g, "÷"],
      [/\\geq?/g, "≥"], [/\\leq?/g, "≤"], [/\\neq/g, "≠"], [/\\rightarrow/g, "→"], [/\\leftarrow/g, "←"], [/\\times/g, "×"], [/\\div/g, "÷"],
      [/\$([^$]+)\$/g, "$1"]
    ];
    return replacements.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), String(text || ""));
  }

  function normalizeTicketPiece(value) {
    return String(value || "")
      .replace(/^#+\s*/, "")
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/[،,.!:؛؛]+/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function removeDuplicateCustomerOpeningsAndClosings(text) {
    let output = String(text || "").replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ").trim();
    if (!output) return output;

    output = output.replace(/^((?:مرحبا|مرحباً|مرحبًا)\s+بك\s+في\s+سوجو[،,.!:\s]*\n+\s*عزيزي\s+العميل[،,.!:\s]*\n*){2,}/i, "مرحبا بك في سوجو\n\nعزيزي العميل\n\n");
    output = output.replace(/^((?:welcome\s+to\s+sugo)[,!.:\s]*\n+\s*dear\s+customer[,]?[\s]*\n*){2,}/i, "Welcome to the SUGO family!\nWe are very happy and honored to have you with us.\nHow can we assist you today?\n\n");
    output = output.replace(/^((?:مرحب[اًًا]?|اهل[اًًا]?)\s+عزيزي\s+العميل[،,.!:\s]*\n*){2,}/i, "مرحباً بك في عائلة سوجو!\nيسعدنا ويشرفنا جداً تواجدك معنا.\nكيف يمكننا مساعدتك اليوم؟\n\n");
    output = output.replace(/^((?:hello|hi)\s+dear\s+customer[,]?[\s]*\n*){2,}/i, "Welcome to the SUGO family!\nWe are very happy and honored to have you with us.\nHow can we assist you today?\n\n");
    output = output.replace(/(\n+\s*(?:شكرا|شكرًا|شكراً)\s+(?:على\s+)?تواصلك\s+معنا[،,.!:\s]*\n+\s*فريق\s+خدمة\s+عملاء\s+سوجو[،,.!:\s]*){2,}\s*$/i, "\n\nشكراً لتواصلك مع سوجو، يسعدنا دائماً خدمتك. نتمنى لك يوماً رائعاً!\n\nفريق خدمة عملاء سوجو");
    output = output.replace(/(\n+\s*thank\s+you\s+for\s+contacting\s+us\.?\s*\n+\s*sugo\s+customer\s+support\s+team\.?\s*){2,}\s*$/i, "\n\nThank you for contacting SUGO. We are always happy to serve you. We wish you a wonderful day!\n\nSUGO Customer Service Team");

    const paragraphs = output.split(/\n{2,}/);
    const kept = [];
    paragraphs.forEach((paragraph) => {
      const current = normalizeTicketPiece(paragraph);
      const previous = normalizeTicketPiece(kept[kept.length - 1] || "");
      if (current && current === previous) return;
      kept.push(paragraph.trim());
    });
    output = kept.join("\n\n");

    const finalLines = [];
    const seenClosingKinds = new Set();
    output.split("\n").forEach((line) => {
      const current = normalizeTicketPiece(line);
      const previous = normalizeTicketPiece(finalLines[finalLines.length - 1] || "");
      if (current && current === previous) return;
      let closingKind = "";
      if (/^(شكرا|شكرًا)( لك| لتواصلك معنا| على تواصلك معنا| لتفهمك| لصبرك)?$/.test(current) || /^(thank you|thanks)( for contacting us| for your patience| for your understanding)?$/.test(current)) closingKind = "thanks";
      else if (/^فريق خدمة عملاء سوجو$/.test(current) || /^(sugo support|sugo customer support|sugo customer support team|customer support team)$/.test(current)) closingKind = "signature";
      if (closingKind && seenClosingKinds.has(closingKind)) return;
      if (closingKind) seenClosingKinds.add(closingKind);
      finalLines.push(line);
    });
    return finalLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  function ticketOrdinalWord(index, language) {
    const arabic = ["أولاً","ثانياً","ثالثاً","رابعاً","خامساً","سادساً","سابعاً","ثامناً","تاسعاً","عاشراً","الحادي عشر","الثاني عشر","الثالث عشر","الرابع عشر","الخامس عشر"];
    const english = ["First","Second","Third","Fourth","Fifth","Sixth","Seventh","Eighth","Ninth","Tenth","Eleventh","Twelfth","Thirteenth","Fourteenth","Fifteenth"];
    const list = language === "arabic" ? arabic : english;
    return list[index - 1] || (language === "arabic" ? `البند ${index}` : `Item ${index}`);
  }

  function lineStartsWithOrdinalWord(line, language) {
    const value = String(line || "").trim();
    return language === "arabic"
      ? /^(أولاً|اولا|أولا|ثانياً|ثانيا|ثالثاً|ثالثا|رابعاً|رابعا|خامساً|خامسا|سادساً|سادسا|سابعاً|سابعا|ثامناً|ثامنا|تاسعاً|تاسعا|عاشراً|عاشرا|الحادي عشر|الثاني عشر|الثالث عشر|الرابع عشر|الخامس عشر)\b/.test(value)
      : /^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth)\b/i.test(value);
  }

  function formatTicketListsWithOrdinals(text, language) {
    const output = [];
    let counter = 0;
    String(text || "").replace(/\r\n?/g, "\n").split("\n").forEach((line) => {
      const match = line.match(/^(\s*)(?:[-*•]+|(?:\d+|[٠-٩]+|[۰-۹]+)(?:[\.)\-:]|\s+)|(?:[A-Za-z]|[اأإآ])\))\s*(.*)$/);
      if (match) {
        counter += 1;
        const comma = language === "arabic" ? "،" : ",";
        output.push(`${match[1] || ""}${ticketOrdinalWord(counter, language)}${comma} ${(match[2] || "").trim()}`);
        return;
      }
      const trimmed = line.trim();
      if (trimmed && lineStartsWithOrdinalWord(trimmed, language)) counter += 1;
      output.push(line);
    });
    return output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  function applyCustomerReplyEnvelope(text, language, includeClosing, isTicketOutput) {
    let output = removeDuplicateCustomerOpeningsAndClosings(text);
    if (isTicketOutput) output = formatTicketListsWithOrdinals(output, language);
    return output;
  }

  function renderMarkdown(markdown) {
    const lines = String(markdown || "").replace(/\u00a0/g, " ").split(/\r?\n/);
    let html = "";
    let inUl = false, inOl = false, inQuote = false, inCode = false;
    let expectedOl = 1;
    let codeBuffer = [];

    const closeLists = () => {
      if (inUl) { html += "</ul>"; inUl = false; }
      if (inOl) { html += "</ol>"; inOl = false; expectedOl = 1; }
      if (inQuote) { html += "</blockquote>"; inQuote = false; }
    };
    const inline = (text) => escapeHtml(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
    const classify = (line) => {
      const trimmed = String(line || "").trim();
      let match = trimmed.match(/^[-*•]\s+(.*)$/);
      if (match) return { kind: "ul", content: match[1] || "" };
      match = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
      return match ? { kind: "ol", number: parseInt(match[1], 10) || 1, content: match[2] || "" } : null;
    };
    const nextClassified = (fromIndex) => {
      for (let index = fromIndex; index < lines.length; index += 1) {
        if (String(lines[index]).trim() === "") continue;
        return classify(lines[index]);
      }
      return null;
    };
    const openUl = () => { if (!inUl) { closeLists(); html += "<ul>"; inUl = true; } };
    const openOl = (start) => {
      const safeStart = Math.max(1, Number(start) || 1);
      if (!inOl) { closeLists(); html += `<ol${safeStart > 1 ? ` start="${safeStart}"` : ""}>`; inOl = true; expectedOl = safeStart; }
    };

    lines.forEach((raw, index) => {
      const line = String(raw || "").trim();
      if (line.startsWith("```")) {
        if (inCode) { html += `<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`; codeBuffer = []; inCode = false; }
        else { closeLists(); inCode = true; }
        return;
      }
      if (inCode) { codeBuffer.push(raw); return; }
      if (!line) {
        const next = nextClassified(index + 1);
        if ((inUl && next?.kind === "ul") || (inOl && next?.kind === "ol")) return;
        closeLists();
        return;
      }
      let match;
      const item = classify(line);
      if ((match = line.match(/^(#{1,3})\s+(.*)/))) {
        closeLists();
        html += `<h${match[1].length}>${inline(match[2])}</h${match[1].length}>`;
      } else if (/^(---|\*\*\*|___)$/.test(line)) {
        closeLists(); html += "<hr>";
      } else if ((match = line.match(/^>\s*(.*)/))) {
        if (!inQuote) { closeLists(); html += "<blockquote>"; inQuote = true; }
        html += `<p>${inline(match[1])}</p>`;
      } else if (item?.kind === "ul") {
        openUl(); html += `<li>${inline(item.content)}</li>`;
      } else if (item?.kind === "ol") {
        if (inOl && item.number > expectedOl + 1) { closeLists(); openOl(item.number); }
        else if (!inOl) openOl(item.number);
        html += `<li>${inline(item.content)}</li>`;
        expectedOl += 1;
      } else {
        closeLists(); html += `<p>${inline(line)}</p>`;
      }
    });
    if (inCode) html += `<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`;
    closeLists();
    return html;
  }

  function customerEnvelopePrompt(language) {
    if (language === "arabic") {
      return "## أسلوب رد خدمة العملاء في سوجو:\nأنت مسؤول عن كتابة مقدمة ونهاية طبيعية مناسبة للحالة. لا توجد صيغة افتتاح ثابتة مفروضة من الواجهة، لكن يجب أن يكون الرد جاهزًا للإرسال للعميل وبأسلوب فريق خدمة عملاء سوجو. لا تكرر التحية أو عبارة عزيزي العميل أو الخاتمة. في وضع التذكرة فقط: اتبع هذا الترتيب: مقدمة قصيرة مناسبة، ثم اعتذار في فقرة مستقلة فقط إذا كانت الحالة تستدعي الاعتذار، ثم شرح مفصل أو خطوات الموضوع، ثم خاتمة رسمية طبيعية، ثم آخر سطر: خدمة عملاء سوجو. لا تستخدم أرقامًا أو نقاطًا أو bullets في بداية الأسطر؛ إذا احتجت ترتيب خطوات أو متطلبات فاكتبها بكلمات عربية مثل: أولاً، ثانياً، ثالثاً، مع الحفاظ على كل بند في سطر منفصل. لا تطلب تمييز أو تكبير الكلمات الحساسة.\n\n";
    }
    return "## SUGO customer support reply style:\nYou are responsible for writing a natural opening and closing suitable for the case. The UI does not force any fixed opening template. The final reply must be ready to send and written in the voice of the SUGO Customer Support Team. Do not repeat greetings, 'Dear Customer', or closings. In Ticket mode only: use this structure: short natural opening, then a separate apology paragraph only if the case needs an apology, then the detailed explanation or steps, then a formal natural closing, then the final line: SUGO Customer Support Team. Do not use numeric lists, bullets, or markdown list markers at the start of lines; if you need ordered steps or requirements, use word-based order such as First, Second, Third, while keeping each item on a separate line. Do not visually emphasize sensitive terms.\n\n";
  }

  const TICKET_CONTROL_LINES = [
    "write a ready-to-send customer support reply based on this case.",
    "write a polite missing-information request and list exactly what the user must provide.",
    "create an internal escalation summary with evidence required and recommended next team/action.",
    "rewrite the customer reply to be shorter, safer, and more professional.",
    "ready reply", "missing info", "escalation note", "polish reply",
    "create ticket workspace request.", "selected ticket type:", "selected tone:", "customer/case details:"
  ];

  function normalizeTicketLine(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function cleanTicketCaseText(value) {
    return String(value || "").replace(/\r/g, "").split("\n").map((line) => line.trim()).filter((line) => {
      if (!line) return false;
      const normalized = normalizeTicketLine(line);
      return !TICKET_CONTROL_LINES.some((control) => normalized === normalizeTicketLine(control) || normalized.startsWith(normalizeTicketLine(control)));
    }).join("\n").trim();
  }

  function buildTicketLookupQuery(input) {
    const parts = [];
    const cleanRaw = cleanTicketCaseText(input.caseDetails);
    const evidence = cleanTicketCaseText(input.evidence);
    if (cleanRaw) parts.push(cleanRaw);
    if (evidence) parts.push(evidence);
    return parts.join("\n").trim();
  }

  function buildTicketQuery(input, lookupQuery) {
    const parts = [];
    const cleanRaw = cleanTicketCaseText(input.caseDetails || lookupQuery);
    const evidence = cleanTicketCaseText(input.evidence);
    const draftToPolish = String(input.draftToPolish || "").trim();
    const quickPrompt = String(input.quickPrompt || "").trim();
    if (cleanRaw) parts.push(`Customer/case details:\n${cleanRaw}`);
    if (String(input.userId || "").trim()) parts.push(`User ID / UID: ${String(input.userId).trim()}`);
    if (String(input.orderId || "").trim()) parts.push(`Related ID / Order / Room / Agency ID: ${String(input.orderId).trim()}`);
    if (evidence) parts.push(`Evidence / internal notes:\n${evidence}`);
    if (draftToPolish) parts.push(`Existing draft to rewrite:\n${draftToPolish}`);
    if (quickPrompt) parts.push(`Selected quick action:\n${quickPrompt}`);
    parts.push(`Ticket request profile: ${input.type || "customer_reply"} · ${input.tone || "professional"} tone.`);
    return parts.filter(Boolean).join("\n\n").trim();
  }

  function normalizeTicketType(value) {
    return VALID_TICKET_TYPES.has(value) ? value : "customer_reply";
  }

  function normalizeTicketTone(value) {
    return VALID_TICKET_TONES.has(value) ? value : "professional";
  }

  function ticketInstruction(input) {
    const ticketType = normalizeTicketType(input.type);
    const ticketTone = normalizeTicketTone(input.tone);
    const typeRules = {
      customer_reply: "Create one ready-to-send customer-facing support reply. Include only verified case-specific information, the correct action or result, any exact missing information, and a natural closing.",
      missing_info: "Create one ready-to-send customer-facing request for missing information. Ask only for the exact details or evidence required by the matched SOP, and do not promise a resolution before review.",
      internal_escalation: "Create an internal escalation note for the support team, not a customer reply. Include a concise case summary, matched category, identifiers, evidence available, missing evidence, risk or policy sensitivity, and the recommended next team/action.",
      policy_sensitive: "Create one safe ready-to-send customer reply for a policy-sensitive case. Avoid blame, guarantees, unsupported policy claims, or disclosure of internal rules; request verification or escalation when the SOP requires it."
    };
    const toneRules = {
      professional: "Use a professional, clear, concise support tone.",
      empathetic: "Use a warm and empathetic tone while remaining concise, accurate, and policy-safe.",
      firm: "Use a firm but polite tone. State requirements clearly without sounding aggressive."
    };
    const quickPrompt = String(input.quickPrompt || "").trim();
    const draftToPolish = String(input.draftToPolish || "").trim();
    return [
      "This request comes from the dedicated Create Ticket workspace.",
      typeRules[ticketType],
      toneRules[ticketTone],
      quickPrompt ? `Execute this selected quick action exactly: ${quickPrompt}` : "",
      draftToPolish ? "Rewrite the supplied existing draft instead of ignoring it, while correcting it against the matched SOP." : "",
      "Do not add fake ticket IDs, dates, agent names, amounts, outcomes, SLA promises, refunds, compensation, approvals, or policy claims.",
      "If required facts are missing, ask for them clearly instead of inventing them.",
      ticketType === "internal_escalation" ? "Do not add a customer greeting or customer-service signature." : "Do not duplicate greetings, apologies, or closings."
    ].filter(Boolean).join(" ");
  }

  function getPrimaryTicketMacro(kb, language) {
    const macros = window.SUGO?.TicketMacros;
    if (!macros?.getTicketText) return null;
    const bestTopic = kb?.bestTopic || null;
    const bestIsMacro = Boolean(bestTopic && (bestTopic.ticketMacro || String(bestTopic.id || "").startsWith("sv-tickets-")));
    const topic = bestIsMacro
      ? bestTopic
      : (Array.isArray(kb?.topics)
          ? kb.topics.find((item) => Boolean(item?.primary) && (item.ticketMacro || String(item.id || "").startsWith("sv-tickets-")))
          : null);
    if (!topic?.id) return null;
    const text = String(macros.getTicketText(topic.id, language) || "").trim();
    return text ? { id: topic.id, text } : null;
  }

  function isRequestedLanguage(text, language) {
    const clean = String(text || "")
      .replace(/https?:\/\/\S+/gi, " ")
      .replace(/\b[A-Z0-9][A-Z0-9_.\/-]{2,}\b/g, " ");
    const arabicCount = (clean.match(/[\u0600-\u06FF]/g) || []).length;
    const latinCount = (clean.match(/[A-Za-z]/g) || []).length;
    if (language === "arabic") return arabicCount >= 12 && arabicCount >= latinCount * 0.75;
    return latinCount >= 12 && arabicCount <= Math.max(4, latinCount * 0.08);
  }

  function groundingOverlapScore(answer, reference) {
    const boilerplate = new Set([
      "مرحبا", "مرحباً", "عزيزي", "العميل", "يرجى", "شكرا", "شكراً", "لتواصلك", "معنا", "فريق", "خدمة", "عملاء", "سوجو",
      "نعتذر", "المشكلة", "تواجهك", "عائلة", "اعتذارنا", "الإزعاج", "الازعاج", "ونشكركم", "الشكر", "صبركم", "نتمنى", "يوماً", "يوما", "سعيداً", "سعيدا",
      "welcome", "dear", "customer", "please", "thank", "thanks", "contacting", "support", "service", "team", "sugo", "sorry", "issue"
    ]);
    const tokenize = (value) => [...new Set(String(value || "")
      .toLowerCase()
      .replace(/https?:\/\/\S+/gi, " ")
      .replace(/[^a-z0-9\u0600-\u06ff]+/gi, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 3 && !boilerplate.has(token)))];
    const referenceTokens = tokenize(reference);
    if (!referenceTokens.length) return 1;
    const answerTokens = new Set(tokenize(answer));
    const hits = referenceTokens.filter((token) => answerTokens.has(token)).length;
    return hits / referenceTokens.length;
  }

  function isTicketTypeCompliant(answer, request) {
    const text = String(answer || "").trim();
    if (!text) return false;
    if (request.ticketType === "internal_escalation") {
      const internalMarker = request.body.language === "arabic"
        ? /(تصعيد|ملخص الحالة|ملخص التصعيد|الأدلة|الادلة|الإجراء المقترح|الاجراء المقترح|الفريق المقترح)/
        : /(internal escalation|case summary|available evidence|missing evidence|recommended action|next team)/i;
      const customerMarker = /(مرحب|عزيزي العميل|فريق خدمة عملاء|شكرا لتواصلك|شكرًا لتواصلك|hello dear customer|welcome to the sugo|customer support team)/i;
      return internalMarker.test(text) && !customerMarker.test(text);
    }
    if (["customer_reply", "policy_sensitive"].includes(request.ticketType) && request.localTicketMacro?.text) {
      return groundingOverlapScore(text, request.localTicketMacro.text) >= 0.08;
    }
    return true;
  }

  function buildLanguageSafeFallback(request) {
    const language = request.body.language;
    const ticketType = request.ticketType;
    const input = request.originalInput || {};
    const caseDetails = cleanTicketCaseText(input.caseDetails || request.lookupQuery || request.query);
    const evidence = cleanTicketCaseText(input.evidence);
    const userId = String(input.userId || "").trim();
    const orderId = String(input.orderId || "").trim();

    if (ticketType !== "internal_escalation" && request.localTicketMacro?.text) {
      return request.localTicketMacro.text;
    }

    if (ticketType === "internal_escalation") {
      if (language === "arabic") {
        return [
          "ملخص التصعيد الداخلي",
          caseDetails ? `الحالة: ${caseDetails}` : "الحالة: لم يتم تقديم وصف كافٍ للمشكلة.",
          request.localTicketMacro?.id ? `التصنيف المطابق: ${request.localTicketMacro.id}` : "التصنيف المطابق: يحتاج إلى مراجعة يدوية.",
          userId ? `معرّف المستخدم: ${userId}` : "معرّف المستخدم: غير مرفق.",
          orderId ? `المعرّف المرتبط: ${orderId}` : "المعرّف المرتبط: غير مرفق.",
          evidence ? `الأدلة المتوفرة: ${evidence}` : "الأدلة المتوفرة: لا توجد أدلة مرفقة.",
          "الإجراء المقترح: مراجعة الحالة وفق الإجراء التشغيلي المطابق، والتحقق من المعرّفات والأدلة قبل اتخاذ أي قرار أو إرسال نتيجة للعميل."
        ].join("\n\n");
      }
      return [
        "Internal escalation summary",
        caseDetails ? `Case: ${caseDetails}` : "Case: Insufficient issue description was provided.",
        request.localTicketMacro?.id ? `Matched category: ${request.localTicketMacro.id}` : "Matched category: Manual review required.",
        userId ? `User ID: ${userId}` : "User ID: Not provided.",
        orderId ? `Related ID: ${orderId}` : "Related ID: Not provided.",
        evidence ? `Available evidence: ${evidence}` : "Available evidence: No evidence attached.",
        "Recommended action: Review the case against the matched SOP and verify all identifiers and evidence before making a decision or communicating an outcome to the customer."
      ].join("\n\n");
    }

    if (language === "arabic") {
      return [
        "مرحباً بك في عائلة سوجو!",
        "حتى نتمكن من مراجعة حالتك بدقة ومساعدتك بالشكل الصحيح، يرجى تزويدنا بوصف واضح للمشكلة، ومعرّف الحساب، وأي معرّف مرتبط بالعملية، بالإضافة إلى صورة أو فيديو شاشة يوضح المشكلة إن أمكن.",
        "بعد استلام المعلومات المطلوبة، سيتم التحقق من الحالة وفق الإجراءات المعتمدة.",
        "شكراً لتواصلك مع سوجو، يسعدنا دائماً خدمتك.",
        "فريق خدمة عملاء سوجو"
      ].join("\n\n");
    }
    return [
      "Welcome to the SUGO family!",
      "To review your case accurately and assist you correctly, please provide a clear description of the issue, your account ID, any related transaction or room ID, and a screenshot or screen recording showing the issue when possible.",
      "Once the required information is received, the case will be reviewed according to the approved procedures.",
      "Thank you for contacting SUGO. We are always happy to assist you.",
      "SUGO Customer Support Team"
    ].join("\n\n");
  }

  function buildSystemPrompt({ kb, responseMode, outputType, language, strictSop, hasImage, askToolInstruction, ticketType, ticketTone, localTicketMacro }) {
    const isTicket = outputType === "ticket";
    const isInternalEscalation = isTicket && ticketType === "internal_escalation";
    const isDetailed = responseMode === "detailed";
    const isStep = responseMode === "step";
    const modeInstruction = isStep
      ? "## RESPONSE MODE — STEP-BY-STEP:\nUse clear ordered steps and finish every step fully.\n\n"
      : isDetailed
        ? "## RESPONSE MODE — DETAILED:\nGive a complete result with all verified conditions and required evidence.\n\n"
        : "## RESPONSE MODE — BRIEF:\nGive a concise result with only essential verified information.\n\n";
    const knowledgeModeInstruction = strictSop
      ? "## KNOWLEDGE MODE — STRICT SOP ONLY:\nUse only the internal knowledge base supplied below. Never invent policy or use outside information. If the SOP is incomplete, request the exact missing details or recommend internal escalation.\n\n"
      : "## KNOWLEDGE MODE — HYBRID:\nUse the internal knowledge base first. Only use SUGO-specific public fallback information when the local SOP is genuinely incomplete.\n\n";
    const imageInstruction = hasImage
      ? "## ATTACHED IMAGE:\nRead only clearly visible information. Do not invent unreadable or hidden details. Use the image as evidence and state what still needs verification.\n\n"
      : "";
    const ticketTypeInstructions = {
      customer_reply: "Return exactly one polished customer-facing reply ready to send. No analysis, source notes, confidence labels, or internal routing.",
      missing_info: "Return exactly one customer-facing message requesting only the precise missing information or evidence needed for the matched procedure.",
      internal_escalation: "Return exactly one internal escalation note. Do not address the customer, do not add a greeting or closing, and do not hide the internal case summary, evidence, missing evidence, risk, or next action.",
      policy_sensitive: "Return exactly one safe customer-facing reply ready to send. Do not disclose internal policy, blame anyone, or guarantee an outcome; request verification or escalation when required."
    };
    const toneInstructions = {
      professional: "Use a professional, clear, concise tone.",
      empathetic: "Use a warm empathetic tone without adding unsupported apologies or promises.",
      firm: "Use a firm but polite tone and state requirements unambiguously."
    };
    const sourceBlock = kb?.hasMeaningfulMatch && String(kb?.text || "").trim()
      ? `=== INTERNAL KNOWLEDGE BASE MATCHES ===\nConfidence: ${kb.confidenceLabel} (${kb.confidenceScore})\nBest match: ${kb.bestTopic ? kb.bestTopic.id : "none"}\n\n${kb.text}`
      : "=== INTERNAL KNOWLEDGE BASE MATCHES ===\n[No directly relevant article was found.]";
    const exactMacroBlock = localTicketMacro?.text
      ? `\n\n=== EXACT MATCHED TICKET MACRO (${localTicketMacro.id}) ===\n${localTicketMacro.text}\n=== END EXACT MACRO ===`
      : "";
    const languageInstruction = language === "arabic"
      ? "Write the entire result in formal Modern Standard Arabic. English is allowed only inside unavoidable product names, IDs, codes, or URLs. Never return an English customer message."
      : "Write the entire result in professional English. Do not include Arabic except inside an exact quoted identifier when unavoidable.";

    return [
      "You are an expert SUGO MENA support specialist.",
      knowledgeModeInstruction,
      modeInstruction,
      imageInstruction,
      "## CREATE TICKET PROFILE",
      isTicket ? ticketTypeInstructions[ticketType] : "Answer the support agent directly with accurate SOP guidance.",
      isTicket ? toneInstructions[ticketTone] : "",
      askToolInstruction ? `Selected workspace instruction: ${String(askToolInstruction).trim().slice(0, 1600)}` : "",
      "## ACCURACY RULES",
      "Use the strongest primary route first. If an sv-tickets macro matches, treat its Ticket field as the authoritative reply template.",
      "Never invent IDs, amounts, dates, actions already completed, approvals, refunds, compensation, bans, unbans, or resolution guarantees.",
      "Remove irrelevant SOP content and preserve all case-specific requirements, links, time limits, and evidence requests.",
      isInternalEscalation ? "Keep internal escalation fields visible and useful." : "Do not mention the knowledge base, internal routing, confidence, or admin fields to the customer.",
      isTicket && !isInternalEscalation ? customerEnvelopePrompt(language) : "",
      "## LANGUAGE — NON-NEGOTIABLE",
      languageInstruction,
      sourceBlock + exactMacroBlock
    ].filter(Boolean).join("\n\n");
  }

  function normalizeImagePayload(images) {
    if (!Array.isArray(images) || !images.length) return undefined;
    const image = images[0];
    if (!image || typeof image !== "object" || !image.data) return undefined;
    return [{
      mimeType: image.mimeType,
      data: image.data,
      name: image.name,
      width: image.width,
      height: image.height
    }];
  }

  function buildRequest(input = {}) {
    const outputType = VALID_OUTPUT_TYPES.has(input.outputType) ? input.outputType : "ticket";
    const responseMode = VALID_RESPONSE_MODES.has(input.responseMode) ? input.responseMode : "detailed";
    const language = input.language === "arabic" ? "arabic" : "english";
    const ticketType = outputType === "ticket" ? normalizeTicketType(input.type) : "customer_reply";
    const ticketTone = outputType === "ticket" ? normalizeTicketTone(input.tone) : "professional";
    const normalizedInput = { ...input, type: ticketType, tone: ticketTone };
    const strictSop = input.sopMode !== "hybrid";
    const images = normalizeImagePayload(input.images);
    const hasImage = Boolean(images?.length);
    const lookupQuery = String(input.kbQuery || buildTicketLookupQuery(normalizedInput)).trim();
    const fallbackQuery = outputType === "ticket"
      ? (lookupQuery ? buildTicketQuery(normalizedInput, lookupQuery) : "Create a ready-to-send customer support ticket based on the attached image.")
      : lookupQuery;
    const finalQuery = String(input.query || fallbackQuery).trim();
    if (!finalQuery && !hasImage) {
      throw new WorkerRequestError(
        outputType === "ticket" ? "Customer conversation / Case details or an image is required." : "Question / Case details is required.",
        { code: outputType === "ticket" ? "EMPTY_TICKET_REQUEST" : "EMPTY_ASK_REQUEST" }
      );
    }

    const matcher = window.SUGO?.KnowledgeBaseMatcher;
    if (!matcher?.match || !matcher?.toRequestMatches) throw new WorkerRequestError("The knowledge-base matcher is not available.", { code: "MATCHER_UNAVAILABLE" });
    const kb = matcher.match(lookupQuery || finalQuery, hasImage ? 8 : 14, hasImage ? 2600 : 4200, input.exactPaneId || null, {
      outputType,
      preferTicketTopics: outputType === "ticket",
      smartTicket: outputType === "ticket",
      compactPrompt: false,
      completeAnswer: true
    });
    const localTicketMacro = outputType === "ticket" ? getPrimaryTicketMacro(kb, language) : null;
    const kbHasContent = Boolean(kb.hasMeaningfulMatch && String(kb.text || "").trim().length > 100);
    if (strictSop && !kbHasContent && !hasImage) {
      throw new WorkerRequestError(
        outputType === "ticket"
          ? "No clear SOP match found. SOP Only mode will not generate a guessed ticket."
          : "No clear SOP match found. SOP Only mode will not generate a guessed answer outside the local knowledge base.",
        { name: "SopMatchError", code: "NO_SOP_MATCH" }
      );
    }

    const askInstruction = String(input.askToolInstruction || ticketInstruction(normalizedInput)).trim();
    const systemPrompt = buildSystemPrompt({
      kb, responseMode, outputType, language, strictSop, hasImage,
      askToolInstruction: askInstruction,
      ticketType, ticketTone, localTicketMacro
    });
    const imageMeta = input.imageMeta || images?.[0] || null;
    const finalUserContent = hasImage
      ? `${finalQuery}\n\n[Attached image: ${imageMeta?.name || "image"}; ${imageMeta?.width || "?"}×${imageMeta?.height || "?"}; compressed ${formatBytes(imageMeta?.size || 0)}]`
      : finalQuery;
    const messages = [{ role: "system", content: systemPrompt }];
    const priorMessages = Array.isArray(input.priorMessages)
      ? input.priorMessages
          .filter((message) => message && ["user", "assistant"].includes(message.role) && String(message.content || "").trim())
          .slice(-2)
          .map((message) => ({ role: message.role, content: String(message.content).trim() }))
      : [];
    messages.push(...priorMessages, { role: "user", content: finalUserContent });

    const body = {
      task_type: hasImage ? "image_analysis" : (outputType === "ticket" ? "create_ticket" : "ask_ai"),
      workspace: hasImage ? "upload_image" : (outputType === "ticket" ? "create_ticket" : "ask_ai"),
      max_completion_tokens: outputType === "ticket" ? (responseMode === "brief" ? 4200 : 7000) : (responseMode === "brief" ? 5200 : 9000),
      response_mode: responseMode,
      output_type: outputType,
      ticket_type: ticketType,
      ticket_tone: ticketTone,
      requested_language: language,
      primary_ticket_macro_id: localTicketMacro?.id || null,
      language,
      sop_mode: strictSop ? "sop_only" : "hybrid",
      kb_matches: matcher.toRequestMatches(kb),
      kb_confidence: kb.confidence || "low",
      kb_confidence_score: Math.round((kb.confidenceScore || 0) * 10) / 10,
      kb_ambiguous: Boolean(kb.ambiguous),
      kb_primary_route: kb.primaryRoute ? kb.primaryRoute.name : null,
      kb_query_intents: kb.queryIntents || [],
      has_image: hasImage,
      images,
      image: images?.[0],
      cache: !hasImage,
      stream: false,
      messages
    };
    return {
      body, kb, query: finalQuery, lookupQuery, kbHasContent,
      localTicketMacro, ticketType, ticketTone,
      originalInput: normalizedInput
    };
  }

  async function parseEventStream(response, onProgress, { language = "english", isTicketOutput = false, ticketType = "customer_reply" } = {}) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let answer = "";
    const customerFacing = isTicketOutput && ticketType !== "internal_escalation";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          const delta = json.response ?? json.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            answer += delta;
            let liveAnswer = stripLatexNotation(answer);
            if (customerFacing) liveAnswer = applyCustomerReplyEnvelope(liveAnswer, language, false, true);
            if (typeof onProgress === "function") onProgress({ text: liveAnswer, html: renderMarkdown(liveAnswer) });
          }
        } catch (_error) {
          /* Malformed SSE lines are ignored while valid content continues streaming. */
        }
      }
    }
    return { answer, responseData: null, branch: "sse" };
  }

  async function parseJsonResponse(response) {
    const data = await response.json();
    const answer = String(data?.choices?.[0]?.message?.content || "").trim();
    if (!answer) {
      const raw = data?._debug_raw ? JSON.stringify(data._debug_raw).slice(0, 300) : "";
      throw new WorkerRequestError(`Empty response${raw ? ` (raw: ${raw})` : ""}`, { code: "EMPTY_RESPONSE" });
    }
    return { answer, responseData: data, branch: "json" };
  }

  async function requestCompletion(request, options = {}) {
    abort();
    const controller = new AbortController();
    state.controller = controller;
    state.pending = true;
    state.lastRequestBody = request.body;
    const timeout = window.setTimeout(() => controller.abort(), Number(options.timeoutMs || REQUEST_TIMEOUT_MS));
    try {
      const response = await fetch(DEFAULT_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(request.body)
      });
      window.clearTimeout(timeout);
      if (!response.ok) {
        const errorText = await response.text();
        throw new WorkerRequestError(`Request failed (${response.status}): ${errorText.slice(0, 300)}`, { status: response.status, code: "HTTP_ERROR" });
      }
      const parsed = response.body && response.headers.get("content-type")?.includes("text/event-stream")
        ? await parseEventStream(response, options.onProgress, {
            language: request.body.language,
            isTicketOutput: request.body.output_type === "ticket",
            ticketType: request.ticketType
          })
        : await parseJsonResponse(response);
      let answer = stripLatexNotation(stripPreamble(parsed.answer));
      const isTicket = request.body.output_type === "ticket";
      const isInternalEscalation = isTicket && request.ticketType === "internal_escalation";
      if (!isRequestedLanguage(answer, request.body.language) || !isTicketTypeCompliant(answer, request)) {
        answer = buildLanguageSafeFallback(request);
      }
      if (isTicket && !isInternalEscalation) {
        answer = applyCustomerReplyEnvelope(answer, request.body.language, true, true);
      }
      const result = {
        answer,
        html: renderMarkdown(answer),
        raw: parsed.responseData,
        responseBranch: parsed.branch,
        kb: request.kb,
        requestBody: request.body,
        query: request.query,
        lookupQuery: request.lookupQuery,
        usedLocalTicketMacro: Boolean(request.localTicketMacro),
        ticketType: request.ticketType,
        ticketTone: request.ticketTone
      };
      state.lastResponseMeta = {
        branch: parsed.branch,
        at: Date.now(),
        kbConfidence: request.kb?.confidence || "low",
        macroId: request.localTicketMacro?.id || null,
        ticketType: request.ticketType
      };
      return result;
    } catch (error) {
      window.clearTimeout(timeout);
      if (error?.name === "AbortError") {
        throw new WorkerRequestError("Request timed out. Please try again with a shorter question or check the Cloudflare Worker/provider keys.", { name: "AbortError", code: "REQUEST_TIMEOUT", cause: error });
      }
      if (error instanceof WorkerRequestError) throw error;
      throw new WorkerRequestError(error?.message || String(error), { cause: error });
    } finally {
      if (state.controller === controller) state.controller = null;
      state.pending = false;
    }
  }

  async function generateTicket(input = {}, options = {}) {
    const request = buildRequest({
      ...input,
      outputType: "ticket",
      responseMode: input.responseMode || "detailed",
      language: input.language === "arabic" ? "arabic" : "english",
      sopMode: input.sopMode || "sop_only"
    });
    return requestCompletion(request, options);
  }

  async function generateAnswer(input = {}, options = {}) {
    const request = buildRequest({
      ...input,
      outputType: "answer",
      responseMode: input.responseMode || "brief",
      language: input.language === "arabic" ? "arabic" : "english",
      sopMode: input.sopMode || "hybrid"
    });
    return requestCompletion(request, options);
  }

  function abort() {
    if (state.controller) state.controller.abort();
    state.controller = null;
    state.pending = false;
  }

  window.SUGO.WorkerAPI = Object.freeze({
    baseUrl: DEFAULT_BASE_URL,
    timeoutMs: REQUEST_TIMEOUT_MS,
    buildRequest,
    generateTicket,
    generateAnswer,
    requestCompletion,
    abort,
    renderMarkdown,
    stripPreamble,
    stripLatexNotation,
    applyCustomerReplyEnvelope,
    WorkerRequestError,
    get pending() { return state.pending; },
    get lastRequestBody() { return state.lastRequestBody ? structuredClone(state.lastRequestBody) : null; },
    get lastResponseMeta() { return state.lastResponseMeta ? { ...state.lastResponseMeta } : null; }
  });
})();
