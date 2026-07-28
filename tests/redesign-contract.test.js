"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

const html = read("index.html");
const redesign = read("css/redesign-v5.css");
const app = read("js/app.js");

assert.match(html, /redesign-v5\.css\?v=20260728-global-redesign-v500/);
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

assert.match(redesign, /html\s*\{[\s\S]*?min-inline-size:\s*0/);
assert.match(redesign, /@media\s*\(max-width:\s*900px\)/);
assert.match(redesign, /@media\s*\(max-width:\s*640px\)/);
assert.match(redesign, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
assert.match(redesign, /\.mobile-sidebar-scrim/);
assert.match(redesign, /outline:\s*2px solid #c04459/);
assert.match(redesign, /font-family:\s*var\(--font-arabic\)/);

assert.match(app, /createHeaderCommand/);
assert.match(app, /sugoMenuToggle/);
assert.match(app, /command\.prepend\(globalSearch\)/);
assert.match(app, /className = "mobile-sidebar-scrim"/);
assert.match(app, /Find answers faster\. Solve issues smarter\./);

console.log("PASS — Editorial Command Center assets and cache key");
console.log("PASS — responsive desktop/tablet/mobile contract");
console.log("PASS — keyboard focus, reduced motion, Inter and Amiri");
console.log("PASS — command search and mobile navigation wiring");
