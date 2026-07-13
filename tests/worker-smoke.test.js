"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

class MemoryKV {
  constructor() { this.values = new Map(); }
  async get(key, type) {
    if (!this.values.has(key)) return null;
    const value = this.values.get(key);
    if (type === "json") return JSON.parse(String(value));
    return value;
  }
  async put(key, value) { this.values.set(key, value); }
  async delete(key) { this.values.delete(key); }
  async getWithMetadata() { return null; }
}

(async () => {
  const workerUrl = `${pathToFileURL(path.resolve(__dirname, "../worker/worker.js")).href}?smoke=${Date.now()}`;
  const worker = (await import(workerUrl)).default;
  const ctx = { waitUntil() {} };

  let response = await worker.fetch(
    new Request("https://worker.example/health", { headers: { Origin: "https://owner.github.io" } }),
    { CORS_ORIGIN: "https://owner.github.io" },
    ctx
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://owner.github.io");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal((await response.json()).version, "3.1.0-mode-aware-accuracy");

  response = await worker.fetch(
    new Request("https://worker.example/diagnostics"),
    { ADMIN_PASSWORD: "correct-password" },
    ctx
  );
  assert.equal(response.status, 401, "Diagnostics must not be public.");

  response = await worker.fetch(
    new Request("https://worker.example/diagnostics", { headers: { Authorization: "Bearer correct-password" } }),
    { ADMIN_PASSWORD: "correct-password" },
    ctx
  );
  assert.equal(response.status, 200);

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    response = await worker.fetch(
      new Request("https://worker.example/diagnostics", {
        headers: {
          Authorization: "Bearer wrong-password",
          "CF-Connecting-IP": "203.0.113.250",
          "X-SUGO-Client": "diagnostics-rate-test"
        }
      }),
      {
        ADMIN_PASSWORD: "correct-password",
        ADMIN_RATE_LIMIT_PER_MINUTE: "3",
        ADMIN_RATE_LIMIT_WINDOW_SECONDS: "30"
      },
      ctx
    );
    assert.equal(response.status, attempt <= 3 ? 401 : 429, "Diagnostics authentication attempts must be rate-limited.");
  }

  const kv = new MemoryKV();
  const maliciousHtml = '<article><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">x</a><script>alert(1)</script><form>bad</form><p>Safe text</p></article>';
  response = await worker.fetch(
    new Request("https://worker.example/admin/pane", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer correct-password", "CF-Connecting-IP": "203.0.113.10" },
      body: JSON.stringify({ paneId: "security-test", html: maliciousHtml })
    }),
    { ADMIN_PASSWORD: "correct-password", SUGO_KV: kv },
    ctx
  );
  assert.equal(response.status, 200);
  const saved = JSON.parse(String(kv.values.get("sugo_pane_overrides_v1")));
  const sanitized = saved["security-test"].html;
  assert.doesNotMatch(sanitized, /<script|<form|onerror|javascript:/i);
  assert.match(sanitized, /Safe text/);

  response = await worker.fetch(
    new Request("https://worker.example/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": "203.0.113.11" },
      body: JSON.stringify({
        strict_accuracy_gate: false,
        messages: [{ role: "user", content: "Hello" }],
        output_type: "answer",
        sop_mode: "hybrid"
      })
    }),
    {},
    ctx
  );
  assert.equal(response.status, 503);
  const failureBody = await response.json();
  assert.equal(Object.hasOwn(failureBody, "debug"), false, "Provider details must be hidden by default.");

  console.log("PASS — Worker health/CORS security headers");
  console.log("PASS — diagnostics authentication and rate limiting");
  console.log("PASS — admin HTML sanitization");
  console.log("PASS — provider debug details hidden by default");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
