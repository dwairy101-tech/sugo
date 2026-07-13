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

function ask(query) {
  return matcher.match(query, 12, 3600, null, {
    outputType: "answer",
    completeAnswer: true
  });
}

function ticket(query) {
  return matcher.match(query, 12, 3600, null, {
    outputType: "ticket",
    preferTicketTopics: true,
    smartTicket: true,
    completeAnswer: true
  });
}

const askCases = [
  ["بدي افتح وكالة", "sv-refined-create-host-agency"],
  ["كيف افتح وكالة", "sv-refined-create-host-agency"],
  ["صورة جنسية في الرسائل", "sv-refined-ban-sexual-content-in-messages"],
  ["ما بقدر افوت حسابي", "account-login-issues"],
  ["انحظر حسابي", "account-ban-reasons"],
  ["ما وصلني الشحن", "sv-refined-coins-not-received"],
  ["نسيت كلمة السر", "sv-refined-password-reset-request-submitted"]
];

for (const [query, expected] of askCases) {
  const result = ask(query);
  assert.equal(result.topics[0]?.id, expected, `Ask AI routed incorrectly: ${query}`);
  assert.equal(result.ambiguous, false, `Ask AI unexpectedly marked a direct route ambiguous: ${query}`);
  assert.equal(result.confidence, "high", `Ask AI route should be high confidence: ${query}`);
  assert.ok(result.topics.every((topic) => !String(topic.id).startsWith("sv-tickets-")),
    `Ask AI leaked a hidden ticket macro for: ${query}`);
}

const ticketCases = [
  ["بدي افتح وكالة", "sv-tickets-agency-create"],
  ["كيف افتح وكالة", "sv-tickets-agency-create"],
  ["صورة جنسية في الرسائل", "sv-tickets-ban-sexual-picture"],
  ["ما وصلني الشحن", "sv-tickets-coins-not-received"],
  ["نسيت كلمة السر", "sv-tickets-binding-request-reset-password"]
];

for (const [query, expected] of ticketCases) {
  const result = ticket(query);
  assert.equal(result.topics[0]?.id, expected, `Create Ticket routed incorrectly: ${query}`);
  assert.equal(result.ambiguous, false, `Create Ticket unexpectedly marked a direct route ambiguous: ${query}`);
  assert.equal(result.confidence, "high", `Create Ticket route should be high confidence: ${query}`);
}

const askRequest = api.buildRequest({
  query: "بدي افتح وكالة",
  language: "arabic",
  outputType: "answer",
  sopMode: "hybrid"
});
assert.equal(askRequest.body.primary_ticket_macro_id, null);
assert.equal(askRequest.kb.topics[0]?.id, "sv-refined-create-host-agency");
assert.ok(askRequest.kb.topics.every((topic) => !String(topic.id).startsWith("sv-tickets-")));

const ticketRequest = api.buildRequest({
  caseDetails: "بدي افتح وكالة",
  language: "arabic",
  outputType: "ticket",
  sopMode: "sop_only"
});
assert.equal(ticketRequest.body.primary_ticket_macro_id, "sv-tickets-agency-create");
assert.equal(ticketRequest.kb.topics[0]?.id, "sv-tickets-agency-create");

const sexualTicketRequest = api.buildRequest({
  caseDetails: "صورة جنسية في الرسائل",
  language: "arabic",
  outputType: "ticket",
  sopMode: "sop_only"
});
assert.equal(sexualTicketRequest.body.primary_ticket_macro_id, "sv-tickets-ban-sexual-picture");
assert.equal(sexualTicketRequest.kb.topics[0]?.id, "sv-tickets-ban-sexual-picture");

const generic = ask("مرحبا دعم");
assert.notEqual(generic.confidence === "high" && generic.ambiguous, true,
  "A result must never be both High confidence and ambiguous.");

console.log("PASS — Ask AI excludes hidden ticket macros");
console.log("PASS — Create Ticket promotes only reliable primary macros");
console.log("PASS — colloquial Arabic agency/login/ban/recharge routes");
console.log("PASS — confidence and ambiguity are logically consistent");
