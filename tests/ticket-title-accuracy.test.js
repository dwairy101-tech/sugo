"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "..");

global.window = globalThis;
global.CustomEvent = class CustomEvent {};
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

const api = SUGO.WorkerAPI;
const ticketPanes = SUGO.TicketMacros.listPanes();
let officialAssertions = 0;
let wrappedAssertions = 0;

for (const pane of ticketPanes) {
  for (const [language, title] of [
    ["arabic", pane.arabic?.title],
    ["english", pane.english?.title]
  ]) {
    if (!title) continue;
    const request = api.buildRequest({
      caseDetails: title,
      language,
      outputType: "ticket",
      sopMode: "sop_only"
    });
    assert.equal(request.body.primary_ticket_macro_id, pane.id, `Official ${language} ticket title mapped incorrectly: ${title}`);
    assert.equal(request.kbReliable, true, `Official ${language} ticket title was not reliable: ${title}`);
    assert.equal(request.useExactMacroDirectly, true, `Official ${language} ticket title did not use its exact local macro: ${title}`);
    officialAssertions += 1;

    const wrappedTitle = language === "arabic"
      ? `بدي تذكرة عن ${title}`
      : `create ticket about ${title}`;
    const wrapped = api.buildRequest({
      caseDetails: wrappedTitle,
      language,
      outputType: "ticket",
      sopMode: "sop_only"
    });
    assert.equal(wrapped.body.primary_ticket_macro_id, pane.id, `Wrapped ${language} ticket title mapped incorrectly: ${wrappedTitle}`);
    assert.equal(wrapped.kbReliable, true, `Wrapped ${language} ticket title was not reliable: ${wrappedTitle}`);
    wrappedAssertions += 1;
  }
}

const genericDrug = api.buildRequest({
  caseDetails: "حظر بسبب المخدرات",
  language: "arabic",
  outputType: "ticket",
  sopMode: "sop_only"
});
assert.equal(genericDrug.kb.ticketTitleMatch?.titleAmbiguous, true);
assert.deepEqual(
  genericDrug.kb.ticketTitleMatch?.ticketTopicIds,
  ["sv-tickets-ban-drug-image", "sv-tickets-ban-drug-live"]
);
assert.equal(genericDrug.forceClarificationFallback, true);

const drugImage = api.buildRequest({
  caseDetails: "حظر بسبب صورة مخدرات",
  language: "arabic",
  outputType: "ticket",
  sopMode: "sop_only"
});
assert.equal(drugImage.body.primary_ticket_macro_id, "sv-tickets-ban-drug-image");
assert.equal(drugImage.kbReliable, true);

const drugLive = api.buildRequest({
  caseDetails: "حظر بسبب مخدرات أثناء البث",
  language: "arabic",
  outputType: "ticket",
  sopMode: "sop_only"
});
assert.equal(drugLive.body.primary_ticket_macro_id, "sv-tickets-ban-drug-live");
assert.equal(drugLive.kbReliable, true);

(async () => {
  const originalFetch = global.fetch;
  let fetchCalls = 0;
  global.fetch = async () => {
    fetchCalls += 1;
    throw new Error("Focused title clarification must not call an AI provider.");
  };
  try {
    const clarification = await api.requestCompletion(genericDrug);
    assert.equal(fetchCalls, 0);
    assert.equal(clarification.responseBranch, "local-clarification");
    assert.match(clarification.answer, /صورة متعلقة بمواد محظورة/);
    assert.match(clarification.answer, /تعاطي مواد محظورة أثناء البث/);
    assert.doesNotMatch(clarification.answer, /وصف كامل لما حدث|أي رقم عملية أو غرفة/);
  } finally {
    global.fetch = originalFetch;
  }

  console.log(`PASS — ${officialAssertions} official Arabic/English ticket titles map to their exact macros`);
  console.log(`PASS — ${wrappedAssertions} natural wrapped ticket titles map to their exact macros`);
  console.log("PASS — short ambiguous titles receive focused choices, not a generic failure");
  console.log("PASS — precise drug-image and drug-live titles return the correct templates");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
