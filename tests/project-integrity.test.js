"use strict";

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

global.window = globalThis;
global.CustomEvent = class CustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
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
  "js/worker-api.js",
  "js/kb-media.js"
]) {
  require(path.join(ROOT, relative));
}

const SUGO = window.SUGO;
const coverage = SUGO.KnowledgeBaseContent.verifyNavigationCoverage();
assert.equal(coverage.valid, true, "Navigation must have content for every visible topic.");
assert.deepEqual(coverage.missingContentIds, [], "No visible topic may be missing content.");
assert.equal(SUGO.KnowledgeBaseData.stats.topicCount, 284);
assert.equal(SUGO.KnowledgeBaseContent.stats.visiblePaneCount, 284);
assert.equal(SUGO.TicketMacros.count, 73);

const mediaRefs = [];
for (const guide of SUGO.KnowledgeBaseMedia.guides) {
  for (const image of guide.images || []) {
    const filePath = path.resolve(ROOT, String(image.src || "").replace(/^\.\//, ""));
    mediaRefs.push(filePath);
    assert.equal(fs.existsSync(filePath), true, `Missing visual guide: ${image.src}`);
  }
}
assert.equal(mediaRefs.length, 142, "The bundled visual guide count changed unexpectedly.");
assert.equal(new Set(mediaRefs).size, mediaRefs.length, "Visual guide file paths must not be duplicated.");

const matcher = SUGO.KnowledgeBaseMatcher;
const routingCases = [
  {
    query: "اريد تغيير البلد",
    route: "country-change",
    acceptedTop: ["sv-tickets-country-1", "sv-tickets-country-2"]
  },
  {
    query: "نسيت كلمة المرور",
    route: "password-reset",
    acceptedTop: ["sv-tickets-binding-request-reset-password", "account-security-reset"]
  },
  {
    query: "الحساب مقيد وما بقدر اسجل دخول",
    route: "account-restriction-general",
    acceptedTop: ["account-ban-reasons"]
  },
  {
    query: "لم استلم الكوينز بعد الشحن",
    route: "coins-not-received",
    acceptedTop: ["sv-tickets-coins-not-received", "payment-recharge-missing-coins"]
  },
  {
    query: "الميكروفون لا يعمل في الغرفة",
    route: "microphone-not-heard",
    acceptedTop: ["function-room-mic-on-not-heard"]
  }
];

for (const test of routingCases) {
  const result = matcher.match(test.query, 8, 1800, null, { outputType: "ticket" });
  assert.equal(result.primaryRoute?.name, test.route, `Wrong route for: ${test.query}`);
  assert.equal(result.hasMeaningfulMatch, true, `No meaningful match for: ${test.query}`);
  assert.equal(test.acceptedTop.includes(result.topics[0]?.id), true, `Wrong top topic for: ${test.query}`);
}

const arabicRequest = SUGO.WorkerAPI.buildRequest({
  query: "اريد تغيير البلد",
  kbQuery: "اريد تغيير البلد",
  language: "arabic",
  outputType: "ticket",
  type: "customer_reply",
  tone: "professional",
  apologyStyle: "without_apology",
  responseMode: "detailed",
  sopMode: "sop_only"
});
assert.equal(arabicRequest.body.language, "arabic");
assert.equal(arabicRequest.body.requested_language, "arabic");
assert.match(arabicRequest.body.messages[0].content, /Write the entire result in formal Modern Standard Arabic/);
assert.equal(arabicRequest.body.kb_primary_route, "country-change");

const htmlFiles = ["index.html", "404.html"];
for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(path.join(ROOT, htmlFile), "utf8");
  for (const match of html.matchAll(/(?:src|href)="(\.\/?[^"?#]+)(?:\?[^\"]*)?"/g)) {
    const target = path.resolve(ROOT, match[1]);
    assert.equal(fs.existsSync(target), true, `${htmlFile} references missing file ${match[1]}`);
  }
}

const syntaxFiles = [
  ...fs.readdirSync(path.join(ROOT, "js")).filter(name => name.endsWith(".js")).map(name => path.join(ROOT, "js", name)),
  path.join(ROOT, "worker", "worker.js"),
  ...fs.readdirSync(path.join(ROOT, "tests")).filter(name => name.endsWith(".js")).map(name => path.join(ROOT, "tests", name))
];
for (const file of syntaxFiles) {
  execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
}

console.log("PASS — content/navigation coverage");
console.log("PASS — all 142 visual guides exist with no duplicate paths");
console.log("PASS — Arabic/English precision routes");
console.log("PASS — Arabic Create Ticket request contract");
console.log("PASS — HTML asset references");
console.log("PASS — JavaScript syntax");
