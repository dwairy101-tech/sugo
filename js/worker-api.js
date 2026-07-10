(() => {
  "use strict";

  window.SUGO = window.SUGO || {};

  const DEFAULT_BASE_URL = "https://sugo.dwairy101.workers.dev";
  const REQUEST_TIMEOUT_MS = 90000;
  const VALID_RESPONSE_MODES = new Set(["brief", "detailed", "step"]);
  const VALID_OUTPUT_TYPES = new Set(["answer", "ticket"]);
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
    if (cleanRaw) parts.push(`Customer/case details:\n${cleanRaw}`);
    if (String(input.userId || "").trim()) parts.push(`User ID / UID: ${String(input.userId).trim()}`);
    if (String(input.orderId || "").trim()) parts.push(`Related ID / Order / Room / Agency ID: ${String(input.orderId).trim()}`);
    if (evidence) parts.push(`Evidence / internal notes:\n${evidence}`);
    parts.push(`Ticket request profile: ${input.type || "customer_reply"} · ${input.tone || "professional"} tone.`);
    return parts.filter(Boolean).join("\n\n").trim();
  }

  function ticketInstruction(input) {
    const typeRules = {
      customer_reply: "Create a ready-to-send customer-facing support ticket/reply. Include a natural greeting, clear action/result, any required missing information, and a natural polite closing from SUGO Customer Support Team.",
      missing_info: "Create a polite missing-information request only. Ask for the exact required details/evidence and do not promise resolution before those details are provided.",
      internal_escalation: "Create an internal escalation note, not a customer reply. Include case summary, suspected category, evidence attached, missing evidence, risk level, and recommended next team/action.",
      policy_sensitive: "Create a safe policy-sensitive reply. Avoid blame, avoid guarantees, avoid unsupported policy claims, and request verification/escalation when required."
    };
    const toneRules = {
      professional: "Use a professional, concise support tone.",
      empathetic: "Use a warmer empathetic tone while staying concise and policy-safe.",
      firm: "Use a firm but polite tone. Do not sound aggressive."
    };
    return [
      "This request came from the dedicated Create Ticket workspace, not the Ask AI guidance workspace.",
      "Output type is locked to Ticket. Do not provide analysis before the ticket unless the selected ticket type is internal escalation.",
      typeRules[input.type] || typeRules.customer_reply,
      toneRules[input.tone] || toneRules.professional,
      "Do not duplicate greetings or closings. Do not add fake ticket IDs, fake dates, fake agent names, or unsupported SLA promises.",
      "If facts are missing, ask for them clearly instead of inventing them."
    ].join(" ");
  }

  function buildSystemPrompt({ kb, responseMode, outputType, language, strictSop, hasImage, askToolInstruction }) {
    const isTicket = outputType === "ticket";
    const isDetailed = responseMode === "detailed";
    const isStep = responseMode === "step";
    const modeInstruction = isStep
      ? "## RESPONSE MODE — STEP-BY-STEP:\nUse clear numbered steps. Separate agent action, customer message, required evidence, and escalation if applicable.\n\n"
      : isDetailed
        ? "## RESPONSE MODE — DETAILED:\nGive a complete answer with conditions, exceptions, and escalation details when relevant.\n\n"
        : "## RESPONSE MODE — BRIEF:\nGive a concise answer with only the essential action points.\n\n";
    const knowledgeModeInstruction = strictSop
      ? "## KNOWLEDGE MODE — STRICT SOP ONLY:\nUse ONLY the internal knowledge base supplied below. In Smart Ticket mode, never use outside policy or generic support text. If the supplied SOP does not clearly support the case, ask for the missing details or recommend internal escalation. Do not use web search and do not invent policy.\n\n"
      : "## KNOWLEDGE MODE — HYBRID:\nUse the internal knowledge base first. If it is incomplete or there is no strong match, you may use provider web/search capabilities for SUGO-specific public information, but clearly avoid unrelated products.\n\n";
    const imageInstruction = hasImage
      ? "## ATTACHED IMAGE ANALYSIS:\nThe user attached an image/screenshot. Read the visible content carefully, identify any error message, account/profile/payment/room details, and connect it with the relevant SOP. Do not invent unreadable text or hidden details. If the image is unclear, say what cannot be confirmed. In Ticket mode, use the image as evidence but write only a clean customer-facing message.\n\n"
      : "";
    const outputTypeInstruction = isTicket
      ? "## OUTPUT TYPE — TICKET / CUSTOMER REPLY:\nReturn a ready-to-send customer support ticket/reply only. Use a respectful greeting, clear body, and polite closing. Do not explain internal reasoning. Do not mention that you used a knowledge base. Do not include internal fields such as Mention, Care, Reporter, VIP, Charm, or admin notes unless the user explicitly asks for an internal form. If the internal KB contains a Ticket field, prioritize it and rewrite it professionally in the selected language. If required information is missing, ask the customer for the missing items inside the ticket message. Do not use numbered or bulleted list markers in the final ticket; for Arabic tickets use: أولاً، ثانياً، ثالثاً، and so on.\n"
      : "## OUTPUT TYPE — ANSWER / AGENT GUIDANCE:\nAnswer the support agent directly. Explain the correct procedure, key conditions, and what to send to the customer. You may include internal notes, escalation guidance, or source chips when useful. Do not format it as a customer ticket unless the selected output type is Ticket.\n";
    const smartTicketInstruction = isTicket
      ? "## SMART CREATE TICKET MODE — HIGH ACCURACY:\n- Treat the user's text as raw customer conversation/problem details and extract the actual issue before writing.\n- Use the strongest matching SOP Ticket text when available; rewrite it naturally and ignore irrelevant SOP lines.\n- Do not invent IDs, names, dates, amounts, policy decisions, refunds, compensation, unban results, or approval guarantees.\n- If required details are missing, ask for them politely inside the customer-facing ticket.\n- Keep the final output customer-facing only: no analysis, no confidence labels, no source names, no admin notes, no internal routing, and no hidden-policy wording.\n- For sensitive cases such as account ownership, ban, abuse, recharge, withdrawal, VIP, Charm, agency, or host issues, be conservative and request verification/escalation when the SOP is not conclusive.\n- Final output must be one polished ready-to-send support ticket/reply in the selected language.\n- Ticket formatting rule: no numeric list markers and no bullets. If ordering is needed in Arabic, use أولاً، ثانياً، ثالثاً، etc.; in English, use First, Second, Third, etc. Keep each item on its own line.\n\n"
      : "";
    const kbHasContent = Boolean(kb?.hasMeaningfulMatch && String(kb?.text || "").trim().length > 150);
    const sourceBlock = kbHasContent
      ? `=== INTERNAL KNOWLEDGE BASE MATCHES ===\nConfidence: ${kb.confidenceLabel} (${kb.confidenceScore})\nBest match: ${kb.bestTopic ? kb.bestTopic.id : "none"}\n\n${kb.text}`
      : strictSop
        ? "=== INTERNAL KNOWLEDGE BASE MATCHES ===\n[No directly relevant articles found. Strict SOP Only mode is active.]"
        : "=== INTERNAL KNOWLEDGE BASE MATCHES ===\n[No directly relevant articles found. Hybrid mode may use SUGO-specific fallback information if available.]";
    const languageInstruction = language === "arabic"
      ? "You must answer only in formal Modern Standard Arabic. Do not use English, slang, or Egyptian/Jordanian colloquial expressions."
      : "You must answer only in professional English. Do not use Arabic.";

    return "You are an expert SUGO app support specialist for the MENA region. " +
      "SUGO (also known as Sugo Live or VoiceMaker) is a popular live voice and social app operating in MENA. " +
      "Your role: give accurate, complete answers about SUGO features, policies, and troubleshooting to customer support agents.\n\n" +
      knowledgeModeInstruction + modeInstruction + imageInstruction +
      (askToolInstruction ? `## ASK AI DEDICATED WORKSPACE PROFILE:\n${String(askToolInstruction).trim().slice(0, 1200)}\n\n` : "") +
      "## SOURCE DISCIPLINE:\n" +
      "- Treat the provided SOP text as the source of truth when it contains a match.\n" +
      "- If INTERNAL MATCHES show a Primary route, use that route first and do not replace it with a broad overview, generic appeal, or unrelated unban article.\n" +
      "- In Ticket mode, if a matching sv-tickets topic exists, prioritize its Ticket field over general SOP text.\n" +
      "- If confidence is low, avoid definitive policy language.\n" +
      "- For sensitive topics such as ban, abuse, payment, withdrawal, VIP, or agency, prefer escalation when the SOP is incomplete.\n\n" +
      outputTypeInstruction + "\n" + smartTicketInstruction + customerEnvelopePrompt(language) +
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
      (isDetailed || isStep ? "- Give a complete answer and finish every section fully; do not stop mid-list or mid-sentence\n" : "- Give a complete concise answer and finish every sentence fully\n") +
      (isTicket ? "- Do not add source notes or internal labels in Ticket mode\n" : "- Mention uncertainty clearly when SOP confidence is medium or low\n") +
      "- Follow-up questions: use the prior conversation context to understand references\n\n" + sourceBlock +
      `\n\nIMPORTANT LANGUAGE RULE:\n${languageInstruction}`;
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
    const strictSop = input.sopMode !== "hybrid";
    const images = normalizeImagePayload(input.images);
    const hasImage = Boolean(images?.length);
    const lookupQuery = String(input.kbQuery || buildTicketLookupQuery(input)).trim();
    const fallbackQuery = outputType === "ticket"
      ? (lookupQuery ? buildTicketQuery(input, lookupQuery) : "Create a ready-to-send customer support ticket based on the attached image.")
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
    const kb = matcher.match(lookupQuery || finalQuery, hasImage ? 6 : 12, hasImage ? 2200 : 3200, input.exactPaneId || null, {
      outputType,
      preferTicketTopics: outputType === "ticket",
      smartTicket: outputType === "ticket",
      compactPrompt: false,
      completeAnswer: true
    });
    const kbHasContent = Boolean(kb.hasMeaningfulMatch && String(kb.text || "").trim().length > 150);
    if (strictSop && !kbHasContent && !hasImage) {
      throw new WorkerRequestError(
        outputType === "ticket"
          ? "No clear SOP match found. SOP Only mode will not generate a guessed ticket."
          : "No clear SOP match found. SOP Only mode will not generate a guessed answer outside the local knowledge base.",
        { name: "SopMatchError", code: "NO_SOP_MATCH" }
      );
    }

    const askInstruction = String(input.askToolInstruction || ticketInstruction(input)).trim();
    const systemPrompt = buildSystemPrompt({ kb, responseMode, outputType, language, strictSop, hasImage, askToolInstruction: askInstruction });
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
      max_completion_tokens: outputType === "ticket" ? (["detailed", "step"].includes(responseMode) ? 7000 : 4200) : (["detailed", "step"].includes(responseMode) ? 9000 : 5200),
      response_mode: responseMode,
      output_type: outputType,
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
    return { body, kb, query: finalQuery, lookupQuery, kbHasContent };
  }

  async function parseEventStream(response, onProgress, { language = "english", isTicketOutput = false } = {}) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let answer = "";
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
            const liveAnswer = applyCustomerReplyEnvelope(stripLatexNotation(answer), language, false, isTicketOutput);
            if (typeof onProgress === "function") onProgress({ text: liveAnswer, html: renderMarkdown(liveAnswer) });
          }
        } catch (_error) {
          /* Preserve the legacy behavior: malformed SSE lines are ignored. */
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
        ? await parseEventStream(response, options.onProgress, { language: request.body.language, isTicketOutput: request.body.output_type === "ticket" })
        : await parseJsonResponse(response);
      let answer = stripPreamble(parsed.answer);
      answer = stripLatexNotation(answer);
      answer = applyCustomerReplyEnvelope(answer, request.body.language, true, request.body.output_type === "ticket");
      const result = {
        answer,
        html: renderMarkdown(answer),
        raw: parsed.responseData,
        responseBranch: parsed.branch,
        kb: request.kb,
        requestBody: request.body,
        query: request.query,
        lookupQuery: request.lookupQuery
      };
      state.lastResponseMeta = { branch: parsed.branch, at: Date.now(), kbConfidence: request.kb?.confidence || "low" };
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
