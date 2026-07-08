import worker from "../worker.js";

export const config = { runtime: "edge" };

export default async function handler(request) {
  const url = new URL(request.url);
  url.pathname = "/";
  const routedRequest = new Request(url.toString(), request);
  return worker.fetch(routedRequest, process.env, {
    waitUntil(promise) {
      promise?.catch?.(() => {});
    }
  });
}
