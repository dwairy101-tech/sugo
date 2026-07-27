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
  "js/kb-search.js"
]) require(path.join(ROOT, relative));

const data = SUGO.KnowledgeBaseData;
const content = SUGO.KnowledgeBaseContent;
const matcher = SUGO.KnowledgeBaseMatcher;
const search = SUGO.KnowledgeSearch;

const documents = Object.values(data.topicsById).map((topic) => {
  const searchDocument = content.getSearchDocument(topic.id);
  const pane = content.getPane(topic.id);
  if (!searchDocument || !pane) return null;
  return {
    id: topic.id,
    title: topic.title,
    arabicTitle: pane.arabic?.title || "",
    rootTitle: topic.rootTitle,
    category: topic.category,
    section: topic.section,
    pathParts: topic.path,
    englishText: searchDocument.englishText,
    arabicText: searchDocument.arabicText
  };
}).filter(Boolean);
const index = search.buildIndex(documents);

function routeBoosts(query) {
  const match = matcher.match(query, 16, 1800, null, { outputType: "answer" });
  if (match.ambiguous || match.routeConflict) return {};
  const boosts = Object.create(null);
  if (match.exactTitleMatch && match.exactTitleTopicId) {
    boosts[match.exactTitleTopicId] = 1200;
    return boosts;
  }
  if (match.primaryRoute) {
    match.topics.forEach((topic, topicIndex) => {
      if (topic.primary) boosts[topic.id] = Math.max(260, 700 - (topicIndex * 70));
    });
  }
  return boosts;
}

function rank(query) {
  return search.rank(index, query, {
    limit: 10,
    routeBoosts: routeBoosts(query)
  });
}

const cases = [
  ["نسيت كلمة السر", "account-security-reset"],
  ["تم تقديم طلب استرجاع كلمة السر بدي اتابع", "sv-refined-password-reset-request-submitted"],
  ["ما وصلني الشحن", "payment-recharge-missing-coins"],
  ["الميكروفون لا يعمل في الغرفة", "function-room-mic-on-not-heard"],
  ["كيف افتح وكالة", "sv-refined-create-host-agency"],
  ["اريد تغيير البلد", "sv-refined-change-country"],
  ["قدمت طلب تغيير البلد وبدي متابعة", "sv-refined-change-country-follow-up"],
  ["game crash", "function-games-crashing"],
  ["withdrawal not received", "sv-refined-withdrawal-successful-but-not-received"],
  ["اخفاء المسافة", "sv-refined-close-location-hide-distance"]
];

for (const [query, expectedId] of cases) {
  const results = rank(query);
  assert.equal(results[0]?.id, expectedId, `Search returned the wrong best match for: ${query}`);
  assert.ok(results[0].coverage >= 0.6 || results[0].routeBoost > 0, `Search accepted weak token coverage for: ${query}`);
}

const genericBan = matcher.match("انحظر حسابي", 6, 1800, null, { outputType: "answer" });
assert.equal(genericBan.ambiguous, true);
assert.deepEqual(routeBoosts("انحظر حسابي"), {}, "Ambiguous routes must never receive deterministic search boosts.");

const unrelated = rank("مرحبا دعم");
assert.ok(unrelated.length <= 2, "Generic support words must not flood search with unrelated SOPs.");

console.log("PASS — high-precision bilingual search ranking");
console.log("PASS — safe password reset vs submitted-request distinction");
console.log("PASS — ambiguous ban searches receive no forced route");
