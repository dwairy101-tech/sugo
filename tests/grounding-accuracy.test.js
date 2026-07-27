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

(async () => {
  let fetchCalls = 0;
  const originalFetch = global.fetch;
  global.fetch = async () => {
    fetchCalls += 1;
    throw new Error("The provider must not be called for an ambiguous SOP-only request.");
  };

  const ambiguousRequest = api.buildRequest({
    query: "انحظر حسابي",
    kbQuery: "انحظر حسابي",
    language: "arabic",
    outputType: "answer",
    sopMode: "sop_only"
  });
  assert.equal(ambiguousRequest.body.kb_reliable, false);
  assert.equal(ambiguousRequest.forceAnswerClarificationFallback, true);
  const ambiguousResult = await api.requestCompletion(ambiguousRequest);
  assert.equal(fetchCalls, 0);
  assert.equal(ambiguousResult.responseBranch, "local-sop-clarification");
  assert.match(ambiguousResult.answer, /لن أعطيك إجراءً تخمينيًا|لا يمكنني تقديم إجراء مؤكد|لن أفترض إجراءً غير مؤكد/);

  const resetGuideTicket = api.buildRequest({
    query: "نسيت كلمة السر",
    kbQuery: "نسيت كلمة السر",
    language: "arabic",
    outputType: "ticket",
    type: "customer_reply",
    sopMode: "sop_only"
  });
  assert.notEqual(
    resetGuideTicket.body.primary_ticket_macro_id,
    "sv-refined-password-reset-request-submitted",
    "A reset question must not claim that a reset request was already submitted."
  );

  const submittedTicket = api.buildRequest({
    query: "تم تقديم طلب استرجاع كلمة السر بدي اتابع",
    kbQuery: "تم تقديم طلب استرجاع كلمة السر بدي اتابع",
    language: "arabic",
    outputType: "ticket",
    type: "customer_reply",
    sopMode: "sop_only"
  });
  assert.equal(submittedTicket.body.primary_ticket_macro_id, "sv-tickets-binding-request-reset-password");

  const rechargeAnswer = api.buildRequest({
    query: "ما وصلني الشحن",
    kbQuery: "ما وصلني الشحن",
    language: "arabic",
    outputType: "answer",
    sopMode: "sop_only"
  });
  assert.equal(rechargeAnswer.kb.bestTopic.id, "payment-recharge-missing-coins");
  assert.doesNotMatch(
    rechargeAnswer.groundingReference,
    /بعد مراجعة حسابك.*وصلت/i,
    "Generic recharge guidance must not claim that an account review already occurred."
  );

  global.fetch = async () => {
    fetchCalls += 1;
    return new Response(JSON.stringify({
      choices: [{
        message: {
          content: "يمكنك إعادة تعيين كلمة المرور، ثم الانتظار لمدة 999999 ساعة قبل المحاولة مرة أخرى وفق الإجراء المعتمد."
        }
      }]
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  const inventedNumberRequest = api.buildRequest({
    query: "نسيت كلمة السر",
    kbQuery: "نسيت كلمة السر",
    language: "arabic",
    outputType: "answer",
    sopMode: "sop_only"
  });
  const inventedNumberResult = await api.requestCompletion(inventedNumberRequest);
  assert.doesNotMatch(inventedNumberResult.answer, /999999/);
  assert.equal(inventedNumberResult.answer, inventedNumberRequest.groundingReference);

  const imageRequest = api.buildRequest({
    query: "حلل الصورة وحدد الإجراء الصحيح",
    kbQuery: "نسيت كلمة السر",
    language: "arabic",
    outputType: "answer",
    sopMode: "sop_only",
    images: [{
      mimeType: "image/jpeg",
      data: "AA==",
      name: "screen.jpg",
      width: 100,
      height: 100,
      size: 2
    }]
  });
  assert.equal(imageRequest.body.task_type, "image_analysis");
  assert.equal(imageRequest.body.has_image, true);
  assert.equal(imageRequest.body.sop_mode, "sop_only");
  assert.ok(imageRequest.body.kb_matches.length <= 4);
  assert.match(imageRequest.body.messages[0].content, /visible evidence|الأدلة الظاهرة/i);

  global.fetch = originalFetch;
  console.log("PASS — ambiguous SOP-only Ask AI refuses to guess without calling a provider");
  console.log("PASS — reset guide and submitted-request ticket states remain distinct");
  console.log("PASS — recharge guidance does not invent an account review");
  console.log("PASS — invented provider numbers are rejected in SOP-only mode");
  console.log("PASS — image requests use the grounded image-analysis contract");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
