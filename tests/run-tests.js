"use strict";

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const tests = [
  "project-integrity.test.js",
  "apology-guard.test.js",
  "accuracy-dedup.test.js",
  "matcher-mode-accuracy.test.js",
  "worker-smoke.test.js"
];

for (const test of tests) {
  const file = path.join(__dirname, test);
  console.log(`\n=== ${test} ===`);
  const result = spawnSync(process.execPath, [file], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log("\nAll SUGO validation suites passed.");
