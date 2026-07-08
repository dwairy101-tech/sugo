import worker from "../worker.js";

const WORKER_GET_PATHS = new Set(["/health", "/diagnostics", "/menu", "/content"]);

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const isWorkerGet = request.method === "GET" && WORKER_GET_PATHS.has(url.pathname);
  const isWorkerPost = request.method !== "GET";
  const isAdmin = url.pathname.startsWith("/admin/");

  if (isWorkerGet || isWorkerPost || isAdmin) {
    return worker.fetch(request, env, {
      waitUntil(promise) {
        try { context.waitUntil?.(promise); } catch (_) {}
      }
    });
  }

  return context.next();
}
