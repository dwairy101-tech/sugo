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

const content = SUGO.KnowledgeBaseContent;
const matcher = SUGO.KnowledgeBaseMatcher;
const search = SUGO.KnowledgeSearch;
const panes = content.listPanes().filter((pane) => pane?.id && pane?.title && pane.visible !== false);

const normalizedTitleOwners = new Map();
for (const pane of panes) {
  const normalized = matcher.normalize(pane.title);
  if (!normalizedTitleOwners.has(normalized)) normalizedTitleOwners.set(normalized, []);
  normalizedTitleOwners.get(normalized).push(pane.id);
}

const uniquePanes = panes.filter((pane) => normalizedTitleOwners.get(matcher.normalize(pane.title)).length === 1);
for (const pane of uniquePanes) {
  const exact = matcher.findExactTitleTopic(pane.title, { outputType: "answer" });
  assert.equal(exact?.id, pane.id, `Ask AI exact title mapped incorrectly: ${pane.title}`);
}

const documents = panes.map((pane) => {
  const searchDocument = content.getSearchDocument(pane.id);
  if (!searchDocument) return null;
  return {
    id: pane.id,
    title: pane.title,
    arabicTitle: pane.arabic?.title || "",
    rootTitle: pane.rootTitle,
    category: pane.category,
    section: pane.section,
    pathParts: pane.path,
    englishText: searchDocument.englishText,
    arabicText: searchDocument.arabicText
  };
}).filter(Boolean);
const index = search.buildIndex(documents);

for (const pane of uniquePanes) {
  const exact = matcher.match(pane.title, 5, 1800, null, { outputType: "answer" });
  const routeBoosts = exact.exactTitleTopicId ? { [exact.exactTitleTopicId]: 1200 } : {};
  const ranked = search.rank(index, pane.title, { limit: 3, routeBoosts });
  assert.equal(ranked[0]?.id, pane.id, `Search exact title mapped incorrectly: ${pane.title}`);
}

console.log(`PASS — ${uniquePanes.length} unique visible SOP titles map correctly in Ask AI`);
console.log(`PASS — ${uniquePanes.length} unique visible SOP titles rank first in Search`);
