"use strict";

const path = require("node:path");
global.window = globalThis;
window.SUGO = {};
require(path.join(__dirname, "..", "js", "worker-api.js"));

const api = window.SUGO.WorkerAPI;
const cases = [
  ["EN duplicated paragraphs", "english", "with_apology", "customer_reply", "Hello dear customer.\n\nWe are very sorry for the inconvenience.\n\nPlease accept our sincere apologies for this issue.\n\nYour case has been escalated."],
  ["EN mixed clause", "english", "with_apology", "customer_reply", "Hello.\n\nWe apologize for the inconvenience, and your case has been escalated to the relevant team."],
  ["EN regret to inform", "english", "without_apology", "customer_reply", "We regret to inform you that your request was not approved.\n\nYou may submit a new request after 7 days."],
  ["AR duplicated paragraphs", "arabic", "with_apology", "customer_reply", "مرحباً عزيزي العميل.\n\nنأسف جداً للإزعاج.\n\nنقدم لك خالص اعتذارنا عن المشكلة.\n\nتم تصعيد طلبك إلى الفريق المختص."],
  ["AR mixed clause", "arabic", "with_apology", "customer_reply", "مرحباً بك.\n\nنعتذر عن الإزعاج، وتم تصعيد طلبك إلى الفريق المختص."],
  ["AR regret to inform", "arabic", "without_apology", "customer_reply", "يؤسفنا إبلاغك بأن طلبك لم تتم الموافقة عليه.\n\nيمكنك تقديم طلب جديد بعد 7 أيام."],
  ["No-apology English", "english", "without_apology", "customer_reply", "We're sorry. We apologize for the delay. Your request is under review."],
  ["Internal escalation", "english", "with_apology", "internal_escalation", "We apologize for the inconvenience. Escalate UID 12345 to Payments QA."],
  ["EN plural apologies", "english", "with_apology", "customer_reply", "Please accept our deepest apologies for the inconvenience.\n\nThe issue has been fixed."],
  ["AR spelling variants", "arabic", "with_apology", "customer_reply", "ناسف على الازعاج.\n\nآسفين جداً.\n\nتم حل المشكلة."],
  ["EN broad variants", "english", "with_apology", "customer_reply", "Our sincere apologies. I deeply apologize. Sorry about that. Please pardon us.\n\nYour request is under review."],
  ["AR broad variants", "arabic", "without_apology", "customer_reply", "نرجو المعذرة. سامحنا على التأخير. أعذرنا.\n\nطلبك قيد المراجعة."]
];

let failed = 0;
for (const [name, language, style, type, input] of cases) {
  const output = api.applyTicketApologyStyle(input, language, style, type);
  const canonical = language === "arabic"
    ? "نعتذر لك عن الإزعاج الذي واجهته."
    : "We apologize for the inconvenience you experienced.";
  const count = output.split(canonical).length - 1;
  const expected = type === "internal_escalation" || style === "without_apology" ? 0 : 1;
  const residual = api.removeApologyContent(output, language);
  const passed = count === expected && !api.containsApologyWording(residual);
  console.log(`${passed ? "PASS" : "FAIL"} — ${name}`);
  if (!passed) {
    failed += 1;
    console.error({ output, count, expected, residual });
  }
}

if (failed) {
  console.error(`\n${failed} apology guard test(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${cases.length} apology guard tests passed.`);
