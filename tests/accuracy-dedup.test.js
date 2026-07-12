"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "..");

global.window = globalThis;
global.CustomEvent = class CustomEvent {
  constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
};
global.document = {
  readyState: "loading",
  addEventListener() {},
  dispatchEvent() {},
  querySelector() { return null; },
  querySelectorAll() { return []; }
};
window.SUGO = {};

for (const relative of [
  "js/kb-data.js",
  "js/kb-content.js",
  "js/kb-ticket-macros.js",
  "js/kb-matcher.js",
  "js/worker-api.js"
]) require(path.join(ROOT, relative));

const matcher = SUGO.KnowledgeBaseMatcher;
const api = SUGO.WorkerAPI;

const exactCases = [
  ["Customer Service Greeting", "sv-refined-customer-service-greeting"],
  ["ترحيب خدمة العملاء", "sv-refined-customer-service-greeting"],
  ["تحية خدمة العملاء", "sv-refined-customer-service-greeting"],
  ["مرحبًا بك في عائلة سوجو", "sv-refined-customer-service-greeting"],
  ["Welcome / How Can We Help", "sv-refined-welcome-how-can-we-help"],
  ["كيف يمكننا مساعدتك اليوم", "sv-refined-welcome-how-can-we-help"]
];

for (const [query, expectedId] of exactCases) {
  const result = matcher.match(query, 10, 3000, null, { outputType: "ticket", preferTicketTopics: true });
  assert.equal(result.exactTitleMatch, true, `Expected exact-title handling for: ${query}`);
  assert.equal(result.topics[0]?.id, expectedId, `Wrong exact topic for: ${query}`);
}

for (const pane of SUGO.KnowledgeBaseContent.listPanes().filter((item) => item.format === "support_macro")) {
  for (const title of [pane.title, pane.english?.title, pane.arabic?.title].filter(Boolean)) {
    const result = matcher.match(title, 5, 1800, null, { outputType: "ticket", preferTicketTopics: true });
    assert.equal(result.exactTitleMatch, true, `Visible support title was not exact-matched: ${title}`);
    assert.equal(result.topics[0]?.id, pane.id, `Visible support title routed to the wrong topic: ${title}`);
  }
}

function semanticCounts(text) {
  const counts = Object.create(null);
  String(text || "").split(/\r?\n/).forEach((line) => {
    const kind = api.ticketSemanticKind(line);
    if (kind) counts[kind] = (counts[kind] || 0) + 1;
  });
  return counts;
}

for (const pane of [...SUGO.KnowledgeBaseContent.listPanes(), ...SUGO.TicketMacros.listPanes()]) {
  if (pane.format !== "support_macro") continue;
  for (const language of ["english", "arabic"]) {
    for (const field of pane[language]?.fields || []) {
      if (!/^(answer|ticket|الإجابة|التذكرة)$/i.test(String(field.label || "").trim())) continue;
      const counts = semanticCounts(field.text);
      for (const [kind, count] of Object.entries(counts)) {
        assert.ok(count <= 1, `${pane.id}/${language}/${field.label} repeats semantic ${kind} text.`);
      }
      if (/^(ticket|التذكرة)$/i.test(String(field.label || "").trim())) {
        assert.doesNotMatch(String(field.text || ""), /(^|\s)@[A-Za-z]|منشن|internal note|cs notes|ACM group|Senior Monitor|Audition Team|\bHQ\b|فريق VIP/i,
          `${pane.id}/${language} leaks internal routing or staff mentions into a customer ticket.`);
      }
    }
  }
}


const correctedSubAgency = SUGO.KnowledgeBaseContent.getPane("sv-refined-change-sub-agency-to-main-agency")
  ?.arabic?.fields?.find((field) => /التذكرة/.test(field.label))?.text || "";
assert.match(correctedSubAgency, /80 مليون/);
assert.match(correctedSubAgency, /5 مضيفات/);
assert.doesNotMatch(correctedSubAgency, /تفتح وكالة فرعيه تحت وكيل/);

const correctedSmoking = SUGO.KnowledgeBaseContent.getPane("sv-refined-ban-smoking-during-live")
  ?.english?.fields?.find((field) => /^Ticket$/i.test(field.label))?.text || "";
assert.doesNotMatch(correctedSmoking, /TThank/);
assert.equal((correctedSmoking.match(/Thank you for contacting SUGO\./g) || []).length, 1);

const duplicated = [
  "Welcome to the SUGO family!",
  "How can we assist you today?",
  "How can we help you today?",
  "We apologize for the inconvenience.",
  "We are sorry for the inconvenience.",
  "Policy detail: the account requires review.",
  "Thank you for contacting SUGO.",
  "Thanks for contacting SUGO.",
  "SUGO Customer Service Team",
  "Customer Support Team"
].join("\n\n");
const deduped = api.removeSemanticTicketDuplicates(duplicated);
const dedupedCounts = semanticCounts(deduped);
assert.equal(dedupedCounts.greeting, 1);
assert.equal(dedupedCounts.help, 1);
assert.equal(dedupedCounts.apology, 1);
assert.equal(dedupedCounts.closing, 1);
assert.equal(dedupedCounts.signature, 1);
assert.match(deduped, /Policy detail: the account requires review\./);

const policyLine = "للأسف، ووفقًا للسياسات المعتمدة، لا يمكننا رفع الحظر أو إعادة تفعيل الحساب في هذه الحالة.";
const policyResult = api.removeSemanticTicketDuplicates(`نعتذر لك عن الإزعاج.\n\n${policyLine}`);
assert.match(policyResult, /لا يمكننا رفع الحظر/,
  "A substantive policy line must never be deleted as a duplicate apology.");

const repeatedAgentNames = api.removeSemanticTicketDuplicates([
  "- MANDO", "ID: 49037499", "- MANDO", "ID: 84209461"
].join("\n"));
assert.equal((repeatedAgentNames.match(/- MANDO/g) || []).length, 2,
  "Same display name with different IDs must be preserved.");

(async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => { throw new Error("Exact/local safety paths must not call the network."); };
  try {
    const exactArabic = await api.generateTicket({
      caseDetails: "Customer Service Greeting",
      language: "arabic",
      type: "customer_reply",
      apologyStyle: "without_apology",
      sopMode: "sop_only"
    });
    assert.equal(exactArabic.responseBranch, "local-exact-macro");
    assert.equal(exactArabic.kb.topics[0]?.id, "sv-refined-customer-service-greeting");
    assert.match(exactArabic.answer, /كيف يمكننا مساعدتك اليوم/);
    assert.doesNotMatch(exactArabic.answer, /Medium Risk|2400|رفع الحظر/);
    const counts = semanticCounts(exactArabic.answer);
    assert.equal(counts.greeting, 1);
    assert.equal(counts.help, 1);
    assert.equal(counts.closing, 1);
    assert.equal(counts.signature, 1);

    const ambiguous = await api.generateTicket({
      caseDetails: "hello support",
      language: "english",
      type: "customer_reply",
      apologyStyle: "without_apology",
      sopMode: "sop_only"
    });
    assert.equal(ambiguous.responseBranch, "local-clarification");
    assert.match(ambiguous.answer, /complete description/i);
    assert.doesNotMatch(ambiguous.answer, /unban|2400|Medium Risk/i);
  } finally {
    global.fetch = originalFetch;
  }

  console.log("PASS — exact Arabic/English title routing and greeting aliases");
  console.log("PASS — duplicate text audit across support Answer/Ticket fields");
  console.log("PASS — semantic cleanup preserves policy details and repeated IDs");
  console.log("PASS — exact-title local ticket output and safe clarification fallback");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
