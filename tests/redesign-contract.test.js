"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

const html = read("index.html");
const redesign = read("css/redesign-v6.css");
const app = read("js/app.js");

assert.match(html, /redesign-v6\.css\?v=20260728-swiss-editorial-v600/);
assert.match(html, /data-theme="editorial"/);
assert.match(html, /inter-latin-variable\.woff2/);
assert.match(html, /amiri-arabic-400\.woff2/);

for (const file of [
  "assets/fonts/inter-latin-variable.woff2",
  "assets/fonts/amiri-arabic-400.woff2",
  "assets/fonts/amiri-arabic-700.woff2",
  "assets/fonts/INTER-LICENSE.txt",
  "assets/fonts/AMIRI-LICENSE.txt"
]) {
  assert.equal(fs.existsSync(path.join(ROOT, file)), true, `Missing redesign asset: ${file}`);
}

assert.match(redesign, /--swiss-paper:\s*#f2f0ea/);
assert.match(redesign, /--swiss-ink:\s*#111112/);
assert.match(redesign, /--swiss-red:\s*#941b31/);
assert.match(redesign, /grid-template-columns:\s*18rem minmax\(0,\s*1fr\)/);
assert.match(redesign, /@media\s*\(max-width:\s*980px\)/);
assert.match(redesign, /@media\s*\(max-width:\s*700px\)/);
assert.match(redesign, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
assert.match(redesign, /\.mobile-sidebar-scrim/);
assert.match(redesign, /outline:\s*3px solid var\(--swiss-red\)/);
assert.match(redesign, /font-family:\s*var\(--font-arabic\)/);
assert.match(redesign, /\.admin-dialog/);
assert.match(redesign, /\.ticket-workspace/);
assert.match(redesign, /\.ask-ai-workspace/);
assert.match(redesign, /\.vision-workspace/);
assert.match(redesign, /\.search-view/);
assert.match(redesign, /\.article-view/);

assert.match(app, /createHeaderCommand/);
assert.match(app, /sugoMenuToggle/);
assert.match(app, /command\.prepend\(globalSearch\)/);
assert.match(app, /className = "mobile-sidebar-scrim"/);
assert.match(app, /SUPPORT \/<br>OPERATIONS<br>INDEX/);
assert.match(app, /id="askAIBtn"/);
assert.match(app, /id="createTicketBtn"/);
assert.match(app, /id="sugoVisionUploadBtn"/);
assert.match(app, /id="searchInput"/);
assert.match(app, /renderAskAIWorkspace/);
assert.match(app, /renderCreateTicketWorkspace/);
assert.match(app, /renderVisionWorkspace/);
assert.match(app, /renderSearchView/);
assert.match(app, /renderArticleDetail/);
assert.match(app, /Knowledge Index/);
assert.match(app, />Ask AI</);
assert.match(app, />Create Ticket</);
assert.match(app, />Upload image</);

console.log("PASS — Swiss Editorial Index assets, palette, and cache key");
console.log("PASS — every customer-support workspace has the new design contract");
console.log("PASS — responsive desktop/tablet/mobile and reduced-motion contract");
console.log("PASS — English controls, Arabic content typography, and keyboard focus");
console.log("PASS — search, AI, ticket, image, article, navigation, and admin wiring");
