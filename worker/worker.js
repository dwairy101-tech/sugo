/**
 * SUGO SOP AI Proxy — Super Worker v2.9.0 GitHub Ready
 *
 * What changed from the uploaded Worker:
 * - More tolerant environment variable names.
 * - Safer model fallback lists.
 * - Retries Gemini with and without Google Search tools.
 * - Adds xAI Chat Completions fallback in addition to xAI Responses API.
 * - Hides provider failure details unless DEBUG_ERRORS is explicitly "true".
 * - Keeps the same OpenAI-like response shape expected by the existing UI.
 *
 * Supported secrets / vars:
 *   GEMINI_KEY_1, GEMINI_KEY_2 ... or GEMINI_API_KEY or GEMINI_KEY
 *   CEREBRAS_KEY_1, CEREBRAS_KEY_2 ... or CEREBRAS_API_KEY or CEREBRAS_KEY
 *   GROK_API_KEY or XAI_API_KEY
 *
 * Optional model vars:
 *   GEMINI_MODEL, CEREBRAS_MODEL, GROK_MODEL
 */

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = buildCorsHeaders(env, request);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const isAdministratorAttempt =
      (request.method === "POST" && url.pathname.startsWith("/admin/")) ||
      (request.method === "GET" && url.pathname === "/diagnostics");

    if (isAdministratorAttempt) {
      const adminRateLimit = checkRateLimit(request, env, "admin");
      if (!adminRateLimit.ok) {
        return jsonResponse({
          error: "Too many administrator attempts. Please wait and try again.",
          retryAfterSeconds: adminRateLimit.retryAfterSeconds
        }, { ...corsHeaders, "Retry-After": String(adminRateLimit.retryAfterSeconds || 60) }, 429);
      }
    }

    if (request.method === "GET" && url.pathname === "/menu") {
      if (!env.SUGO_KV) return errorResponse("SUGO_KV binding is missing.", 500, corsHeaders);
      const menu = await getSugoIntegratedMenu(env);
      return jsonResponse({ ok: true, menu }, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/admin/menu") {
      if (!env.SUGO_KV) return errorResponse("SUGO_KV binding is missing.", 500, corsHeaders);
      const adminPassword = getAdminPasswordFromRequest(request);
      if (!env.ADMIN_PASSWORD || !safeSecretEqual(adminPassword, env.ADMIN_PASSWORD)) return errorResponse("Unauthorized.", 401, corsHeaders);
      let body;
      try { body = await request.json(); } catch { return errorResponse("Invalid JSON body.", 400, corsHeaders); }
      const menu = normalizeSugoIntegratedMenu(body.menu || body);
      await env.SUGO_KV.put(SUGO_INTEGRATED_MENU_KEY, JSON.stringify(menu));
      return jsonResponse({ ok: true, saved: true, updatedAt: menu.updatedAt, itemsCount: menu.items.length }, corsHeaders);
    }

    // ===== SUGO Editable Content API =====
    if (request.method === "GET" && url.pathname === "/content") {
      if (!env.SUGO_KV) {
        return errorResponse("SUGO_KV binding is missing.", 500, corsHeaders);
      }

      const content = await getSugoEditableContent(env);
      return jsonResponse({
        ok: true,
        content
      }, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/admin/content") {
      if (!env.SUGO_KV) {
        return errorResponse("SUGO_KV binding is missing.", 500, corsHeaders);
      }

      const adminPassword = getAdminPasswordFromRequest(request);

      if (!env.ADMIN_PASSWORD || !safeSecretEqual(adminPassword, env.ADMIN_PASSWORD)) {
        return errorResponse("Unauthorized.", 401, corsHeaders);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return errorResponse("Invalid JSON body.", 400, corsHeaders);
      }

      const content = normalizeSugoEditableContent(body.content);

      await env.SUGO_KV.put("sugo_editable_content_v1", JSON.stringify(content));

      return jsonResponse({
        ok: true,
        saved: true,
        updatedAt: content.updatedAt,
        sectionsCount: content.sections.length
      }, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/admin/pane") {
      if (!env.SUGO_KV) {
        return errorResponse("SUGO_KV binding is missing.", 500, corsHeaders);
      }
      const adminPassword = getAdminPasswordFromRequest(request);
      if (!env.ADMIN_PASSWORD || !safeSecretEqual(adminPassword, env.ADMIN_PASSWORD)) {
        return errorResponse("Unauthorized.", 401, corsHeaders);
      }
      let body;
      try { body = await request.json(); }
      catch { return errorResponse("Invalid JSON body.", 400, corsHeaders); }
      const paneId = safePaneId(body.paneId);
      const html = cleanEditableHtml(body.html || "", 900000);
      if (!paneId || !html) return errorResponse("paneId and html are required.", 400, corsHeaders);
      const overrides = await getSugoPaneOverrides(env);
      overrides[paneId] = { html, updatedAt: new Date().toISOString() };
      await env.SUGO_KV.put(SUGO_PANE_OVERRIDES_KEY, JSON.stringify(overrides));
      return jsonResponse({ ok: true, saved: true, paneId, updatedAt: overrides[paneId].updatedAt }, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/admin/pane/reset") {
      if (!env.SUGO_KV) {
        return errorResponse("SUGO_KV binding is missing.", 500, corsHeaders);
      }
      const adminPassword = getAdminPasswordFromRequest(request);
      if (!env.ADMIN_PASSWORD || !safeSecretEqual(adminPassword, env.ADMIN_PASSWORD)) {
        return errorResponse("Unauthorized.", 401, corsHeaders);
      }
      let body;
      try { body = await request.json(); }
      catch { return errorResponse("Invalid JSON body.", 400, corsHeaders); }
      const paneId = safePaneId(body.paneId);
      if (!paneId) return errorResponse("paneId is required.", 400, corsHeaders);
      const overrides = await getSugoPaneOverrides(env);
      delete overrides[paneId];
      await env.SUGO_KV.put(SUGO_PANE_OVERRIDES_KEY, JSON.stringify(overrides));
      return jsonResponse({ ok: true, reset: true, paneId }, corsHeaders);
    }

    // ===== SUGO Visual Guide Media API =====
    if (request.method === "GET" && url.pathname === "/media") {
      if (!env.SUGO_KV) return errorResponse("SUGO_KV binding is missing.", 500, corsHeaders);
      const media = await getSugoMediaManifest(env);
      return jsonResponse({ ok: true, media: hydrateSugoMediaManifest(media, url.origin) }, corsHeaders);
    }

    if (request.method === "GET" && url.pathname.startsWith("/media/file/")) {
      if (!env.SUGO_KV) return errorResponse("SUGO_KV binding is missing.", 500, corsHeaders);
      const rawKey = url.pathname.slice("/media/file/".length).split("/").map(part => decodeURIComponent(part)).join("/");
      const key = safeMediaStorageKey(rawKey);
      if (!key) return errorResponse("Invalid media key.", 400, corsHeaders);
      const stored = await env.SUGO_KV.getWithMetadata(mediaKvBlobKey(key), "arrayBuffer");
      if (!stored || !stored.value) return errorResponse("Image not found.", 404, corsHeaders);
      const metadata = stored.metadata && typeof stored.metadata === "object" ? stored.metadata : {};
      const headers = new Headers(corsHeaders);
      headers.set("Content-Type", String(metadata.contentType || "application/octet-stream"));
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("Content-Disposition", "inline");
      headers.set("X-Content-Type-Options", "nosniff");
      return new Response(stored.value, { headers });
    }

    if (request.method === "POST" && url.pathname === "/admin/media/upload") {
      if (!env.SUGO_KV) return errorResponse("SUGO_KV binding is missing.", 500, corsHeaders);
      const adminPassword = getAdminPasswordFromRequest(request);
      if (!env.ADMIN_PASSWORD || !safeSecretEqual(adminPassword, env.ADMIN_PASSWORD)) return errorResponse("Unauthorized.", 401, corsHeaders);
      let form;
      try { form = await request.formData(); }
      catch { return errorResponse("Invalid multipart form data.", 400, corsHeaders); }
      const topicId = safePaneId(form.get("topicId"));
      const file = form.get("file");
      if (!topicId) return errorResponse("topicId is required.", 400, corsHeaders);
      if (!(file instanceof File)) return errorResponse("Image file is required.", 400, corsHeaders);
      const mimeType = String(file.type || "").toLowerCase();
      if (!SUGO_MEDIA_ALLOWED_MIME_TYPES.has(mimeType)) return errorResponse("Only PNG, JPG, and WebP images are allowed.", 415, corsHeaders);
      const maxBytes = clampNumber(env.MEDIA_MAX_BYTES, 256 * 1024, 8 * 1024 * 1024, 5 * 1024 * 1024);
      if (!file.size || file.size > maxBytes) return errorResponse(`Image must be smaller than ${Math.round(maxBytes / 1024 / 1024)} MB.`, 413, corsHeaders);
      const extension = mediaExtensionForMime(mimeType);
      const key = `visual-guides/${topicId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const bytes = await file.arrayBuffer();
      await env.SUGO_KV.put(mediaKvBlobKey(key), bytes, {
        metadata: {
          contentType: mimeType,
          topicId,
          originalName: cleanEditableText(file.name || `image.${extension}`, 300),
          uploadedAt: new Date().toISOString()
        }
      });
      const image = {
        id: `image-${crypto.randomUUID()}`,
        storageKey: key,
        src: mediaObjectUrl(url.origin, key),
        mimeType,
        fileName: cleanEditableText(file.name || `image.${extension}`, 300),
        alt: "",
        captionEn: "",
        captionAr: ""
      };
      return jsonResponse({ ok: true, uploaded: true, image, storage: "kv" }, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/admin/media/topic") {
      if (!env.SUGO_KV) return errorResponse("SUGO_KV binding is missing.", 500, corsHeaders);
      const adminPassword = getAdminPasswordFromRequest(request);
      if (!env.ADMIN_PASSWORD || !safeSecretEqual(adminPassword, env.ADMIN_PASSWORD)) return errorResponse("Unauthorized.", 401, corsHeaders);
      let body;
      try { body = await request.json(); }
      catch { return errorResponse("Invalid JSON body.", 400, corsHeaders); }
      const topicId = safePaneId(body.topicId);
      if (!topicId) return errorResponse("topicId is required.", 400, corsHeaders);
      const manifest = await getSugoMediaManifest(env);
      const previousKeys = collectMediaKeysFromTopic(manifest.topics[topicId]);
      const topic = normalizeSugoMediaTopic(topicId, { guides: body.guides, updatedAt: new Date().toISOString() });
      manifest.topics[topicId] = topic;
      manifest.updatedAt = new Date().toISOString();
      await env.SUGO_KV.put(SUGO_MEDIA_MANIFEST_KEY, JSON.stringify(manifest));
      const currentKeys = collectMediaKeysFromTopic(topic);
      const removedKeys = [...previousKeys].filter(key => !currentKeys.has(key));
      await deleteUnreferencedMediaKeys(env, removedKeys, manifest);
      return jsonResponse({
        ok: true,
        saved: true,
        topicId,
        updatedAt: topic.updatedAt,
        topic: hydrateSugoMediaTopic(topic, url.origin)
      }, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/admin/media/topic/reset") {
      if (!env.SUGO_KV) return errorResponse("SUGO_KV binding is missing.", 500, corsHeaders);
      const adminPassword = getAdminPasswordFromRequest(request);
      if (!env.ADMIN_PASSWORD || !safeSecretEqual(adminPassword, env.ADMIN_PASSWORD)) return errorResponse("Unauthorized.", 401, corsHeaders);
      let body;
      try { body = await request.json(); }
      catch { return errorResponse("Invalid JSON body.", 400, corsHeaders); }
      const topicId = safePaneId(body.topicId);
      if (!topicId) return errorResponse("topicId is required.", 400, corsHeaders);
      const manifest = await getSugoMediaManifest(env);
      const removedKeys = collectMediaKeysFromTopic(manifest.topics[topicId]);
      delete manifest.topics[topicId];
      manifest.updatedAt = new Date().toISOString();
      await env.SUGO_KV.put(SUGO_MEDIA_MANIFEST_KEY, JSON.stringify(manifest));
      await deleteUnreferencedMediaKeys(env, [...removedKeys], manifest);
      return jsonResponse({ ok: true, reset: true, topicId, updatedAt: manifest.updatedAt }, corsHeaders);
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return jsonResponse(buildWorkerHealthReport(env, false), corsHeaders);
    }

    if (request.method === "GET" && url.pathname === "/diagnostics") {
      const adminPassword = getAdminPasswordFromRequest(request);
      if (!env.ADMIN_PASSWORD || !safeSecretEqual(adminPassword, env.ADMIN_PASSWORD)) {
        return errorResponse("Unauthorized.", 401, corsHeaders);
      }
      return jsonResponse(buildWorkerHealthReport(env, true), corsHeaders);
    }

    if (request.method === "GET") {
      return jsonResponse({
        ok: true,
        service: "SUGO SOP AI Proxy",
        version: "2.9.0-github-ready",
        providers: providerStatus(env),
        health: "/health",
        diagnostics: "/diagnostics",
        hint: "Send POST with { messages: [...] } to generate an answer."
      }, corsHeaders);
    }

    if (request.method !== "POST") {
      return errorResponse("Method not allowed.", 405, corsHeaders);
    }

    const rateLimit = checkRateLimit(request, env, "api");
    if (!rateLimit.ok) {
      return jsonResponse({
        error: "Too many requests. Please wait a few seconds and try again.",
        retryAfterSeconds: rateLimit.retryAfterSeconds
      }, { ...corsHeaders, "Retry-After": String(rateLimit.retryAfterSeconds || 30) }, 429);
    }

    const requestId = createRequestId();
    let incoming;
    try {
      incoming = await request.json();
    } catch {
      return errorResponse("Invalid JSON body.", 400, corsHeaders);
    }

    const validation = validateIncoming(incoming, env);
    if (!validation.ok) {
      return errorResponse(validation.error, validation.status || 400, corsHeaders);
    }

    const startedAt = Date.now();
    const isStream = incoming.stream === true;
    const messages = sanitizeMessages(incoming.messages);
    const images = sanitizeImageInputs(incoming);
    const hasImages = images.length > 0;
    if (messages.length === 0) {
      return errorResponse("messages array has no usable content.", 400, corsHeaders);
    }

    const systemMsg = messages.find(msg => msg.role === "system") || null;
    let conversationMsgs = messages.filter(msg => msg.role !== "system");
    if (conversationMsgs.length === 0) {
      conversationMsgs = [{ role: "user", content: "Please answer using the available instructions." }];
    }

    const maxTokens = clampNumber(incoming.max_completion_tokens ?? incoming.max_tokens, 100, 12000, 3000);
    const responseMode = ["brief", "detailed", "step"].includes(incoming.response_mode) ? incoming.response_mode : "brief";
    const outputType = ["answer", "ticket"].includes(incoming.output_type) ? incoming.output_type : "answer";
    const sopMode = ["hybrid", "sop_only"].includes(incoming.sop_mode) ? incoming.sop_mode : "hybrid";
    const taskType = normalizeTaskType(incoming, { outputType, hasImages });
    const needsWebSearch = detectNeedsWebSearch(systemMsg, incoming);
    const requestAnalysis = analyzeSupportRequest(messages, systemMsg, { outputType, sopMode, needsWebSearch, taskType, hasImages });
    const kbMatchAudit = sanitizeKbMatchAudit(incoming);
    if (kbMatchAudit.confidence && kbMatchAudit.confidence !== "unknown") {
      requestAnalysis.sopConfidence = kbMatchAudit.confidence;
    }
    const routeProfile = buildRouteProfile({ incoming, messages, responseMode, outputType, sopMode, taskType, needsWebSearch, requestAnalysis, kbMatchAudit, hasImages });
    const strictGateResponse = buildStrictAccuracyGateResponse({ incoming, messages, responseMode, outputType, sopMode, taskType, needsWebSearch, routeProfile, requestAnalysis, kbMatchAudit, hasImages, requestId, startedAt, rateLimit, env });
    if (strictGateResponse) {
      return jsonResponse(strictGateResponse, corsHeaders);
    }
    const workerAddendum = buildWorkerSystemAddendum({ responseMode, outputType, sopMode, taskType, needsWebSearch, routeProfile, requestAnalysis, kbMatchAudit, hasImages });
    const effectiveMessages = addSystemInstruction(messages, workerAddendum);
    const effectiveSystemMsg = effectiveMessages.find(msg => msg.role === "system") || null;
    let effectiveConversationMsgs = effectiveMessages.filter(msg => msg.role !== "system");
    if (effectiveConversationMsgs.length === 0) {
      effectiveConversationMsgs = [{ role: "user", content: "Please answer using the available instructions." }];
    }

    const models = {
      gemini: modelCandidates(env.GEMINI_MODEL, [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash",
        "gemini-1.5-flash"
      ]),
      cerebras: modelCandidates(env.CEREBRAS_MODEL, [
        "gpt-oss-120b",
        "llama-4-scout-17b-16e-instruct",
        "llama-3.3-70b",
        "qwen-3-32b"
      ]),
      grok: modelCandidates(env.GROK_MODEL, [
        "grok-4.20",
        "grok-4",
        "grok-3-mini",
        "grok-3"
      ])
    };

    const attempts = [];
    const cache = globalThis.caches?.default || null;
    const cacheTtl = selectCacheTtl(env, { incoming, needsWebSearch, outputType, sopMode, taskType, routeProfile, requestAnalysis, kbMatchAudit, hasImages });
    const cacheEnabled = Boolean(cache) && !isStream && !hasImages && cacheTtl > 0 && incoming.cache !== false;
    const cacheKey = cacheEnabled
      ? await buildCacheKey(buildSmartCachePayload({ messages: effectiveMessages, maxTokens, responseMode, outputType, sopMode, taskType, needsWebSearch, routeProfile, requestAnalysis, kbMatchAudit }))
      : null;

    if (cacheEnabled) {
      const cached = await cache.match(cacheKey);
      if (cached) {
        const body = await cached.json();
        return jsonResponse({ ...body, _meta: { ...(body._meta || {}), cached: true } }, corsHeaders);
      }
    }

    try {
      const sharedArgs = {
        env,
        messages: effectiveMessages,
        systemMsg: effectiveSystemMsg,
        conversationMsgs: effectiveConversationMsgs,
        maxTokens,
        responseMode,
        outputType,
        sopMode,
        taskType,
        needsWebSearch,
        routeProfile,
        requestAnalysis,
        images,
        hasImages,
        models,
        attempts
      };

      if (isStream) {
        const providerResp = await getStreamingProviderResponse(sharedArgs);
        if (!providerResp) {
          return allProvidersFailedResponse(corsHeaders, attempts, true, env);
        }
        return streamProviderAsOpenAI(providerResp.provider, providerResp.response, corsHeaders);
      }

      const result = await getTextCompletion(sharedArgs);
      if (!result?.text) {
        return allProvidersFailedResponse(corsHeaders, attempts, false, env);
      }

      const finalText = applyWorkerQualityPipeline(result.text, { outputType, responseMode, sopMode, taskType, needsWebSearch, requestAnalysis, kbMatchAudit, routeProfile, hasImages });
      const qualityFlags = inspectFinalAnswer(finalText, { outputType, taskType, requestAnalysis, kbMatchAudit, routeProfile, hasImages });
      const responseBody = {
        choices: [{ message: { role: "assistant", content: finalText } }],
        _meta: {
          provider: result.provider,
          model: result.model,
          cached: false,
          latencyMs: Date.now() - startedAt,
          webSearchEnabled: needsWebSearch,
          outputType,
          sopMode,
          taskType,
          route: routeProfile.name,
          requestId,
          strictAccuracy: true,
          imageAnalysis: hasImages,
          imageCount: images.length,
          sopConfidence: requestAnalysis.sopConfidence,
          kbConfidence: kbMatchAudit.confidence,
          kbConfidenceScore: kbMatchAudit.score,
          kbAmbiguous: kbMatchAudit.ambiguous,
          kbPrimaryRoute: kbMatchAudit.primaryRoute,
          kbMatches: kbMatchAudit.matches.slice(0, 5),
          sensitiveCategories: requestAnalysis.sensitiveCategories,
          missingInfo: requestAnalysis.missingInfo,
          quality: qualityFlags,
          rateLimitRemaining: rateLimit.remaining
        }
      };

      logWorkerEvent(env, "response", {
        requestId,
        provider: result.provider,
        model: result.model,
        outputType,
        sopMode,
        taskType,
        imageAnalysis: hasImages,
        route: routeProfile.name,
        latencyMs: Date.now() - startedAt,
        sopConfidence: requestAnalysis.sopConfidence,
        sensitiveCategories: requestAnalysis.sensitiveCategories,
        missingInfoCount: requestAnalysis.missingInfo.length,
        attempts: attempts.length
      });

      if (cacheEnabled) {
        ctx.waitUntil(cache.put(cacheKey, new Response(JSON.stringify(responseBody), {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": `public, max-age=${cacheTtl}`
          }
        })));
      }

      return jsonResponse(responseBody, corsHeaders);
    } catch (err) {
      logWorkerEvent(env, "error", { requestId, error: safeErrorMessage(err), attempts: attempts.length });
      return errorResponse(debugEnabled(env) ? `Worker error: ${safeErrorMessage(err)}` : "The AI service could not complete the request.", 500, corsHeaders, debugPayload(env, attempts));
    }
  }
};

// ─────────────────────────────────────────────────────────────
// Request / security helpers
// ─────────────────────────────────────────────────────────────

function buildCorsHeaders(env, request) {
  const configured = String(env.CORS_ORIGIN || "*")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  const requestOrigin = request?.headers?.get("Origin") || "";
  const allowAny = !configured.length || configured.includes("*");
  const origin = allowAny
    ? "*"
    : (requestOrigin && configured.includes(requestOrigin) ? requestOrigin : configured[0]);
  const headers = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-SUGO-Client",
    "Access-Control-Max-Age": "86400",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
  };
  if (!allowAny) headers["Vary"] = "Origin";
  return headers;
}

function validateIncoming(incoming, env) {
  if (!incoming || typeof incoming !== "object") {
    return { ok: false, status: 400, error: "Request body must be a JSON object." };
  }
  if (!Array.isArray(incoming.messages)) {
    return { ok: false, status: 400, error: "messages array is required." };
  }
  if (incoming.output_type && !["answer", "ticket"].includes(incoming.output_type)) {
    return { ok: false, status: 400, error: "Invalid output_type. Use answer or ticket." };
  }
  if (incoming.sop_mode && !["hybrid", "sop_only"].includes(incoming.sop_mode)) {
    return { ok: false, status: 400, error: "Invalid sop_mode. Use hybrid or sop_only." };
  }
  if (incoming.task_type || incoming.taskType || incoming.workspace || incoming.sugo_task) {
    const taskCheck = normalizeTaskType(incoming, { outputType: incoming.output_type, hasImages: Boolean(normalizeIncomingImageList(incoming).length) });
    if (!SUGO_ALLOWED_TASK_TYPES.has(taskCheck)) {
      return { ok: false, status: 400, error: "Invalid task_type. Use ask_ai, create_ticket, or image_analysis." };
    }
  }

  const maxMessages = clampNumber(env.MAX_MESSAGES, 1, 60, 24);
  if (incoming.messages.length < 1 || incoming.messages.length > maxMessages) {
    return { ok: false, status: 400, error: `messages must contain 1-${maxMessages} items.` };
  }

  const allowedRoles = new Set(["system", "user", "assistant"]);
  let totalChars = 0;
  for (const msg of incoming.messages) {
    if (!msg || typeof msg !== "object") {
      return { ok: false, status: 400, error: "Each message must be an object." };
    }
    if (!allowedRoles.has(msg.role)) {
      return { ok: false, status: 400, error: "Invalid message role." };
    }
    if (typeof msg.content !== "string") {
      return { ok: false, status: 400, error: "Each message content must be a string." };
    }
    totalChars += msg.content.length;
  }

  // The UI sends a carefully selected SOP context with every AI request.
  // 30k characters is too small once the system instructions + matched SOP + ticket rules are included,
  // especially after adding image-analysis prompts. Keep images validated separately below.
  const configuredMaxInputChars = clampNumber(env.MAX_INPUT_CHARS, 30000, 350000, 180000);
  const maxInputChars = Math.max(configuredMaxInputChars, 120000);
  if (totalChars > maxInputChars) {
    return {
      ok: false,
      status: 413,
      error: `Request is too large. Max ${maxInputChars} characters. The app will reduce SOP context automatically; if this persists, set MAX_INPUT_CHARS to 180000 or higher.`
    };
  }

  const imageValidation = validateIncomingImages(incoming, env);
  if (!imageValidation.ok) return imageValidation;

  return { ok: true };
}

const SUGO_ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function normalizeIncomingImageList(incoming) {
  const raw = [];
  if (Array.isArray(incoming?.images)) raw.push(...incoming.images);
  else if (incoming?.image) raw.push(incoming.image);
  return raw.filter(Boolean);
}

function stripDataUrlPrefix(data) {
  return String(data || "").replace(/^data:[^;]+;base64,/i, "").replace(/\s+/g, "");
}

function normalizeMimeType(value) {
  const mime = String(value || "").trim().toLowerCase();
  if (mime === "image/jpg") return "image/jpeg";
  return mime;
}

function validateIncomingImages(incoming, env) {
  const images = normalizeIncomingImageList(incoming);
  const maxImages = clampNumber(env.MAX_IMAGES_PER_REQUEST, 1, 4, 2);
  if (images.length > maxImages) {
    return { ok: false, status: 413, error: `Too many images. Max ${maxImages} image(s) per request.` };
  }

  const maxBase64Chars = clampNumber(env.MAX_IMAGE_BASE64_CHARS, 500000, 12000000, 6500000);
  for (const img of images) {
    if (!img || typeof img !== "object") {
      return { ok: false, status: 400, error: "Each image must be an object." };
    }
    const mimeType = normalizeMimeType(img.mimeType || img.mime_type || img.type);
    const data = stripDataUrlPrefix(img.data || img.base64 || img.content);
    if (!SUGO_ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
      return { ok: false, status: 415, error: "Unsupported image type. Use JPG, PNG, or WebP." };
    }
    if (!data || !/^[A-Za-z0-9+/=]+$/.test(data)) {
      return { ok: false, status: 400, error: "Image data must be valid base64." };
    }
    if (data.length > maxBase64Chars) {
      return { ok: false, status: 413, error: `Image is too large after compression. Max ${maxBase64Chars} base64 characters.` };
    }
  }
  return { ok: true };
}

function sanitizeImageInputs(incoming) {
  return normalizeIncomingImageList(incoming).map((img, index) => {
    const mimeType = normalizeMimeType(img.mimeType || img.mime_type || img.type);
    return {
      mimeType,
      data: stripDataUrlPrefix(img.data || img.base64 || img.content),
      name: String(img.name || `image-${index + 1}`).replace(/[\u0000-\u001f]/g, "").slice(0, 120),
      width: Number.isFinite(Number(img.width)) ? Number(img.width) : null,
      height: Number.isFinite(Number(img.height)) ? Number(img.height) : null
    };
  }).filter(img => SUGO_ALLOWED_IMAGE_MIME_TYPES.has(img.mimeType) && img.data);
}

function sanitizeMessages(messages) {
  return messages.map(msg => ({
    role: msg.role,
    content: String(msg.content || "").replace(/\u0000/g, "").trim()
  })).filter(msg => msg.content.length > 0);
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function safeErrorMessage(err) {
  const msg = err?.message || String(err || "Unknown error");
  return msg.slice(0, 900);
}

function debugEnabled(env) {
  return String(env.DEBUG_ERRORS || "false").toLowerCase() === "true";
}

function debugPayload(env, attempts) {
  if (!debugEnabled(env)) return undefined;
  return {
    debug: {
      providers: providerStatus(env),
      attempts: attempts.slice(-24)
    }
  };
}

function allProvidersFailedResponse(corsHeaders, attempts, stream, env) {
  return jsonResponse({
    error: "All AI providers failed.",
    stream,
    ...(debugEnabled(env) ? { debug: { attempts: attempts.slice(-24) } } : {}),
    note: "Check API keys, model names, billing/quota, and provider status. No secret values are included here."
  }, corsHeaders, 503);
}

// ─────────────────────────────────────────────────────────────
// Provider configuration
// ─────────────────────────────────────────────────────────────

function providerStatus(env) {
  return {
    geminiKeys: collectKeys(env, "gemini").length,
    cerebrasKeys: collectKeys(env, "cerebras").length,
    grok: Boolean(getGrokKey(env)),
    grokKeys: collectKeys(env, "grok").length,
    modelVars: {
      gemini: env.GEMINI_MODEL || null,
      cerebras: env.CEREBRAS_MODEL || null,
      grok: env.GROK_MODEL || null
    }
  };
}

const SUGO_API_KEY_HEALTH = globalThis.__SUGO_API_KEY_HEALTH || (globalThis.__SUGO_API_KEY_HEALTH = {});
const SUGO_API_KEY_ROTATION = globalThis.__SUGO_API_KEY_ROTATION || (globalThis.__SUGO_API_KEY_ROTATION = {});

function keyFingerprint(key) {
  const value = String(key || "");
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function keyStateId(provider, key) {
  return `${provider}:${keyFingerprint(key)}`;
}

function noteApiKeySuccess(provider, key) {
  const id = keyStateId(provider, key);
  const state = SUGO_API_KEY_HEALTH[id] || (SUGO_API_KEY_HEALTH[id] = { failures: 0, openUntil: 0, lastUsed: 0, successes: 0 });
  state.failures = 0;
  state.openUntil = 0;
  state.lastUsed = Date.now();
  state.successes += 1;
}

function noteApiKeyFailure(provider, key, status) {
  const retryable = status === "network" || status === "timeout" || isRetryableStatus(Number(status));
  const id = keyStateId(provider, key);
  const state = SUGO_API_KEY_HEALTH[id] || (SUGO_API_KEY_HEALTH[id] = { failures: 0, openUntil: 0, lastUsed: 0, successes: 0 });
  state.lastUsed = Date.now();
  if (!retryable) return;
  state.failures += 1;
  if (state.failures >= 2) {
    state.openUntil = Date.now() + Math.min(180000, 15000 * state.failures);
  }
}

function orderKeysByHealth(provider, keys) {
  const now = Date.now();
  const active = [];
  const cooling = [];
  for (const key of keys) {
    const state = SUGO_API_KEY_HEALTH[keyStateId(provider, key)] || {};
    if (state.openUntil && now < state.openUntil) cooling.push(key);
    else active.push(key);
  }
  const ordered = active.sort((a, b) => {
    const sa = SUGO_API_KEY_HEALTH[keyStateId(provider, a)] || {};
    const sb = SUGO_API_KEY_HEALTH[keyStateId(provider, b)] || {};
    if ((sa.failures || 0) !== (sb.failures || 0)) return (sa.failures || 0) - (sb.failures || 0);
    return (sa.lastUsed || 0) - (sb.lastUsed || 0);
  }).concat(cooling);
  if (ordered.length <= 1) return ordered;
  const cursor = SUGO_API_KEY_ROTATION[provider] || 0;
  SUGO_API_KEY_ROTATION[provider] = (cursor + 1) % ordered.length;
  return ordered.slice(cursor).concat(ordered.slice(0, cursor));
}

function collectKeys(env, provider) {
  const names = [];
  if (provider === "gemini") {
    names.push("GEMINI_API_KEY", "GEMINI_KEY");
    for (let i = 1; i <= 50; i++) names.push(`GEMINI_KEY_${i}`, `GEMINI_API_KEY_${i}`);
  }
  if (provider === "cerebras") {
    names.push("CEREBRAS_API_KEY", "CEREBRAS_KEY");
    for (let i = 1; i <= 50; i++) names.push(`CEREBRAS_KEY_${i}`, `CEREBRAS_API_KEY_${i}`);
  }
  if (provider === "grok") {
    names.push("GROK_API_KEY", "XAI_API_KEY", "GROK_KEY", "XAI_KEY");
    for (let i = 1; i <= 50; i++) names.push(`GROK_API_KEY_${i}`, `XAI_API_KEY_${i}`, `GROK_KEY_${i}`, `XAI_KEY_${i}`);
  }

  const prefixes = provider === "gemini"
    ? ["GEMINI_KEY_", "GEMINI_API_KEY_"]
    : provider === "cerebras"
      ? ["CEREBRAS_KEY_", "CEREBRAS_API_KEY_"]
      : ["GROK_KEY_", "GROK_API_KEY_", "XAI_KEY_", "XAI_API_KEY_"];
  try {
    for (const name of Object.keys(env || {})) {
      if (prefixes.some(prefix => name.startsWith(prefix))) names.push(name);
    }
  } catch {
    // Some environments may not enumerate bindings; exact names above still work.
  }

  const keys = [];
  const seen = new Set();
  for (const name of names) {
    const value = env?.[name];
    if (!value) continue;
    const key = String(value).trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    keys.push(key);
  }

  return orderKeysByHealth(provider, keys);
}

function getGrokKey(env) {
  return collectKeys(env, "grok")[0] || "";
}

function modelCandidates(primary, fallbacks) {
  const out = [];
  for (const item of [primary, ...fallbacks]) {
    const value = String(item || "").trim();
    if (value && !out.includes(value)) out.push(value);
  }
  return out;
}

function isRetryableStatus(status) {
  return [408, 409, 425, 429, 500, 502, 503, 504].includes(status);
}

function detectNeedsWebSearch(systemMsg, incoming) {
  if (incoming?.sop_mode === "sop_only") return false;
  const sys = systemMsg?.content || "";
  const explicit = incoming.web_search === true;
  const noKb = sys.includes("[No directly relevant articles found");
  const mustSearch = sys.includes("You MUST use your web search tool");
  const sugoSearch = sys.includes("Use web search to find SUGO");
  return Boolean(explicit || noKb || mustSearch || sugoSearch);
}

const SUGO_ALLOWED_TASK_TYPES = new Set(["ask_ai", "create_ticket", "image_analysis"]);

function normalizeTaskType(incoming = {}, { outputType = "answer", hasImages = false } = {}) {
  const raw = String(incoming.task_type || incoming.taskType || incoming.workspace || incoming.sugo_task || "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .trim();
  const aliases = {
    ask: "ask_ai",
    ai: "ask_ai",
    askai: "ask_ai",
    ask_ai: "ask_ai",
    answer: "ask_ai",
    create_ticket: "create_ticket",
    ticket: "create_ticket",
    smart_ticket: "create_ticket",
    customer_ticket: "create_ticket",
    image: "image_analysis",
    image_analysis: "image_analysis",
    upload_image: "image_analysis",
    vision: "image_analysis",
    vision_answer: "image_analysis",
    vision_ticket: "image_analysis"
  };
  if (aliases[raw]) return aliases[raw];
  if (hasImages) return "image_analysis";
  if (outputType === "ticket" || incoming.smartTicket === true || incoming.forceOutputType === "ticket") return "create_ticket";
  return "ask_ai";
}

function buildWorkerHealthReport(env, diagnostics = false) {
  const report = {
    ok: true,
    service: "SUGO SOP AI Proxy",
    version: "2.9.0-github-ready",
    timestamp: new Date().toISOString(),
    bindings: {
      kv: Boolean(env.SUGO_KV),
      mediaKv: Boolean(env.SUGO_KV),
      mediaStorage: env.SUGO_KV ? "kv" : "missing",
      adminPassword: Boolean(env.ADMIN_PASSWORD),
      corsOrigin: env.CORS_ORIGIN || "*"
    },
    providers: providerStatus(env),
    guards: {
      strictAccuracyGate: String(env.STRICT_ACCURACY_GATE || "true").toLowerCase() !== "false",
      ticketValidation: true,
      imageValidation: true,
      sensitiveCacheDisabled: true
    }
  };
  if (diagnostics) {
    report.limits = {
      maxMessages: clampNumber(env.MAX_MESSAGES, 1, 60, 24),
      maxInputChars: Math.max(clampNumber(env.MAX_INPUT_CHARS, 30000, 350000, 180000), 120000),
      maxImagesPerRequest: clampNumber(env.MAX_IMAGES_PER_REQUEST, 1, 4, 2),
      rateLimitPerMinute: clampNumber(env.RATE_LIMIT_PER_MINUTE, 5, 600, 90),
      providerTimeoutMs: env.PROVIDER_TIMEOUT_MS || null
    };
    report.circuits = Object.fromEntries(Object.entries(SUGO_PROVIDER_CIRCUITS || {}).map(([name, state]) => [name, {
      failures: state.failures || 0,
      open: Boolean(state.openUntil && Date.now() < state.openUntil),
      openUntil: state.openUntil ? new Date(state.openUntil).toISOString() : null
    }]));
    report.note = "No secret values are exposed here.";
  }
  return report;
}

function buildStrictAccuracyGateResponse({ incoming, outputType, sopMode, taskType, needsWebSearch, routeProfile, requestAnalysis, kbMatchAudit, hasImages, requestId, startedAt, rateLimit, env }) {
  if (String(env?.STRICT_ACCURACY_GATE || "true").toLowerCase() === "false") return null;
  if (String(incoming?.strict_accuracy_gate || "").toLowerCase() === "false") return null;
  if (hasImages) return null;
  const sensitive = Boolean(requestAnalysis?.sensitiveCategories?.length);
  const missing = Array.isArray(requestAnalysis?.missingInfo) ? requestAnalysis.missingInfo : [];
  const lowKb = ["low", "unknown"].includes(effectiveKnowledgeConfidence(requestAnalysis, kbMatchAudit));
  const ambiguous = Boolean(kbMatchAudit?.ambiguous);

  // FIX 2026-07-07:
  // Do not block every Create Ticket request just because KB confidence is low/unknown.
  // The previous gate was too aggressive and returned a generic missing-info ticket
  // for normal informational topics such as "إنشاء وكالة".
  // Gate only when the user's actual case is sensitive AND specific required fields are missing.
  const shouldGateTicket = outputType === "ticket" && sensitive && missing.length > 0;
  if (!shouldGateTicket) return null;

  const finalText = buildSafeTicketFallback({ missing, lowKb, ambiguous, requestAnalysis, kbMatchAudit });
  return {
    choices: [{ message: { role: "assistant", content: finalText } }],
    _meta: {
      provider: "worker-accuracy-gate",
      model: "deterministic",
      cached: false,
      latencyMs: Date.now() - startedAt,
      webSearchEnabled: needsWebSearch,
      outputType,
      sopMode,
      taskType,
      route: routeProfile?.name || "strict-gate",
      requestId,
      strictAccuracy: true,
      strictGate: true,
      imageAnalysis: false,
      imageCount: 0,
      sopConfidence: requestAnalysis?.sopConfidence || "unknown",
      kbConfidence: kbMatchAudit?.confidence || "unknown",
      kbConfidenceScore: kbMatchAudit?.score || 0,
      kbAmbiguous: Boolean(kbMatchAudit?.ambiguous),
      kbPrimaryRoute: kbMatchAudit?.primaryRoute || null,
      kbMatches: (kbMatchAudit?.matches || []).slice(0, 5),
      sensitiveCategories: requestAnalysis?.sensitiveCategories || [],
      missingInfo: missing,
      quality: {
        strictGateApplied: true,
        reason: "missing_required_information",
        length: finalText.length
      },
      rateLimitRemaining: rateLimit?.remaining ?? null
    }
  };
}

function buildSafeTicketFallback({ missing, lowKb, ambiguous, requestAnalysis }) {
  const lang = requestAnalysis?.likelyLanguage === "ar" ? "ar" : "en";
  const missingClean = (missing || []).map(item => String(item || "").trim()).filter(Boolean);
  if (lang === "ar") {
    const list = missingClean.length
      ? missingClean.map(item => `- ${translateMissingInfoLabel(item)}`).join("\n")
      : "- تفاصيل الحساب أو الدليل المطلوب للمراجعة";
    const reviewReason = ambiguous
      ? "حتى نتمكن من تحديد الإجراء الصحيح، نحتاج إلى تأكيد بعض التفاصيل قبل إعطاء قرار نهائي."
      : lowKb
        ? "المعلومات المتوفرة لا تكفي لإعطاء قرار نهائي بشكل دقيق."
        : "نحتاج إلى معلومات إضافية لإكمال المراجعة.";
    return normalizeAssistantWhitespace(`مرحبًا عزيزي العميل،\n\n${reviewReason}\n\nيرجى تزويدنا بالمعلومات التالية:\n${list}\n\nبعد استلام التفاصيل، سيتم مراجعة الطلب حسب الإجراءات المتبعة.\n\nشكرًا على تواصلك معنا.`);
  }
  const list = missingClean.length
    ? missingClean.map(item => `- ${humanizeMissingInfoLabel(item)}`).join("\n")
    : "- The required account details or supporting evidence";
  const reviewReason = ambiguous
    ? "To make sure we guide you correctly, we need to confirm a few details before giving a final answer."
    : lowKb
      ? "The available information is not enough to provide a fully accurate final decision."
      : "We need additional information to complete the review.";
  return normalizeAssistantWhitespace(`Hello dear customer,\n\n${reviewReason}\n\nPlease provide the following information:\n${list}\n\nOnce we receive the details, the request will be reviewed according to the applicable procedures.\n\nThank you for contacting us.`);
}

function humanizeMissingInfoLabel(item) {
  return String(item || "")
    .replace(/_/g, " ")
    .replace(/\buid\b/gi, "UID")
    .replace(/\bid\b/gi, "ID")
    .trim();
}

function translateMissingInfoLabel(item) {
  const key = normalizeForDetection(item);
  if (key.includes("account id")) return "رقم الحساب / User ID";
  if (key.includes("invoice") || key.includes("transaction")) return "إيصال الدفع أو رقم العملية";
  if (key.includes("payment date")) return "تاريخ ووقت عملية الدفع";
  if (key.includes("withdrawal")) return "صورة أو دليل السحب";
  if (key.includes("evidence") || key.includes("video") || key.includes("screenshot")) return "الدليل المطلوب مثل صورة أو تسجيل شاشة واضح";
  if (key.includes("phone") || key.includes("email")) return "رقم الهاتف أو البريد المرتبط بالحساب عند الحاجة";
  if (key.includes("identity")) return "فيديو أو إثبات التحقق المطلوب للمراجعة";
  return humanizeMissingInfoLabel(item);
}

function effectiveKnowledgeConfidence(requestAnalysis = {}, kbMatchAudit = {}) {
  const kb = String(kbMatchAudit?.confidence || "unknown").toLowerCase();
  if (kb && kb !== "unknown") return kb;
  return String(requestAnalysis?.sopConfidence || "unknown").toLowerCase();
}

function buildRouteProfile({ incoming, messages, responseMode, outputType, sopMode, taskType, needsWebSearch, requestAnalysis, hasImages }) {
  const text = messages.map(m => m.content || "").join("\n");
  const lower = text.toLowerCase();
  const longInput = text.length > 6500;
  const analytical = responseMode === "detailed" || responseMode === "step" || /analy[sz]e|compare|explain|why|root cause|تحليل|اشرح|قارن|سبب/.test(lower);
  const ticket = outputType === "ticket";
  const sensitive = Boolean(requestAnalysis?.sensitiveCategories?.length);
  const missing = Boolean(requestAnalysis?.missingInfo?.length);
  const visual = Boolean(hasImages);
  const task = SUGO_ALLOWED_TASK_TYPES.has(taskType) ? taskType : normalizeTaskType(incoming, { outputType, hasImages });

  if (visual) return { name: ticket ? "vision-ticket" : sensitive ? "vision-sensitive-answer" : "vision-answer", taskType: task, longInput, analytical: true, ticket, sensitive, missing, visual };
  if (task === "create_ticket" && sensitive) return { name: "ticket-sensitive", taskType: task, longInput, analytical, ticket: true, sensitive, missing, visual };
  if (task === "create_ticket") return { name: "ticket-fast", taskType: task, longInput, analytical, ticket: true, sensitive, missing, visual };
  if (task === "ask_ai" && sensitive) return { name: "ask-ai-sensitive", taskType: task, longInput, analytical: true, ticket, sensitive, missing, visual };
  if (task === "ask_ai") return { name: analytical || longInput ? "ask-ai-deep" : "ask-ai-fast", taskType: task, longInput, analytical, ticket, sensitive, missing, visual };
  if (sopMode === "sop_only") return { name: sensitive ? "sop-only-sensitive" : "sop-only", taskType: task, longInput, analytical, ticket, sensitive, missing, visual };
  if (needsWebSearch) return { name: sensitive ? "web-grounded-sensitive" : "web-grounded", taskType: task, longInput, analytical, ticket, sensitive, missing, visual };
  if (ticket && sensitive) return { name: "ticket-sensitive", taskType: task, longInput, analytical, ticket, sensitive, missing, visual };
  if (ticket) return { name: "ticket-fast", taskType: task, longInput, analytical, ticket, sensitive, missing, visual };
  if (sensitive) return { name: "sensitive-answer", taskType: task, longInput, analytical, ticket, sensitive, missing, visual };
  if (longInput || analytical) return { name: "deep-answer", taskType: task, longInput, analytical, ticket, sensitive, missing, visual };
  return { name: "fast-answer", taskType: task, longInput, analytical, ticket, sensitive, missing, visual };
}

function addSystemInstruction(messages, addendum) {
  const clean = String(addendum || "").trim();
  if (!clean) return messages;
  const out = messages.map(m => ({ ...m }));
  const idx = out.findIndex(m => m.role === "system");
  if (idx >= 0) {
    out[idx].content = `${out[idx].content}\n\n${clean}`;
  } else {
    out.unshift({ role: "system", content: clean });
  }
  return out;
}

function buildWorkerSystemAddendum({ responseMode, outputType, sopMode, taskType, needsWebSearch, routeProfile, requestAnalysis, kbMatchAudit, hasImages }) {
  const modeLine = responseMode === "brief"
    ? "Keep the reply concise, direct, complete, and ready to use. Do not omit important conditions, limits, IDs, dates, waiting periods, or required evidence when they are present in the context."
    : responseMode === "step"
      ? "Use ordered steps only when steps are useful. Make every step actionable, sequential, and complete. Do not add steps that are not supported by the context."
      : "Provide useful detail with clear structure. Cover requirements, exceptions, limits, and next steps when supported. Avoid padding, repetition, and unsupported assumptions.";

  const sopLine = sopMode === "sop_only"
    ? [
        "SOP ONLY MODE:",
        "Use ONLY the supplied internal SOP/context and the user's message.",
        "Do not use outside knowledge, web knowledge, assumptions, or general policy guesses.",
        "If the supplied context does not clearly answer the question, say the procedure is not documented in the available SOP and ask for the exact missing details or recommend escalation to QA-CS / management.",
        "For sensitive topics such as bans, violations, payments, withdrawals, refunds, VIP, agency, verification, salary, commission, or account status, never give a definitive decision unless the SOP explicitly supports it."
      ].join(" ")
    : needsWebSearch
      ? [
          "HYBRID + WEB-GROUNDED MODE:",
          "Use supplied SOP/context first and treat it as the source of truth when it matches.",
          "Use web grounding only to fill gaps that are not answered by the SOP and only when it is relevant to SUGO/Sugo Live/VoiceMaker.",
          "Avoid unrelated apps, unsupported public claims, and stale guesses.",
          "When the answer affects account actions, money, bans, verification, agency, or official policy, prefer SOP-backed wording or escalation over speculation."
        ].join(" ")
      : [
          "HYBRID MODE:",
          "Use supplied SOP/context first and avoid unsupported claims.",
          "If the SOP is incomplete, distinguish clearly between what is confirmed and what still needs checking.",
          "For sensitive policy, account, payment, ban, agency, or verification cases, ask for missing details or recommend escalation instead of guessing."
        ].join(" ");

  const taskLine = taskType === "create_ticket"
    ? [
        "TASK TYPE: CREATE TICKET WORKSPACE.",
        "The UI is asking for a customer-facing ticket/reply. Do not write internal analysis, agent notes, confidence scores, route names, or SOP explanations.",
        "If the case is missing required details, write a clean customer reply asking for only those details. Do not provide a final decision."
      ].join(" ")
    : taskType === "image_analysis"
      ? [
          "TASK TYPE: UPLOAD IMAGE WORKSPACE.",
          "The UI is asking you to analyze visible image evidence. Separate what is visible from what is not visible. Never infer hidden IDs, amounts, dates, violations, or statuses from a blurry or cropped screenshot.",
          "If output_type is ticket, convert the visual findings into a customer-facing reply only."
        ].join(" ")
      : [
          "TASK TYPE: ASK AI WORKSPACE.",
          "The UI is asking for agent guidance. You may explain confidence, missing information, next action, and escalation needs to the agent, but do not expose hidden provider or system details."
        ].join(" ");

  const strictDecisionLine = [
    "STRICT DECISION GATE:",
    "For bans, violations, payments, withdrawals, refunds, VIP, agency, verification, salary, commission, account ownership, or official account actions, never issue a final decision unless the supplied SOP/context and supplied evidence are enough.",
    "If any required ID, proof, screenshot, transaction number, date/time, or verification detail is missing, ask for it instead of guessing.",
    "If the structured KB match is low confidence or ambiguous, use cautious wording and recommend confirmation/escalation rather than choosing a policy by guess."
  ].join(" ");

  const ticketLine = outputType === "ticket"
    ? [
        "SMART TICKET MODE:",
        "Produce one polished customer-facing support ticket/reply only.",
        "Be accurate, specific, and do not invent facts, policies, refunds, approvals, bans, delivery times, account actions, technical causes, compensation, or review results unless clearly supported by the supplied context.",
        "If required information is missing, ask for it politely inside the ticket instead of guessing.",
        "Use the customer's selected language and a professional support tone.",
        "Preferred structure: greeting, issue acknowledgment, confirmed explanation or action, missing information if needed, next step, polite closing.",
        "Use only one polite closing. Do not repeat thank-you lines, team signatures, greetings, or closing phrases such as thank you for contacting us / شكرًا على تواصلك معنا.",
        "Do not mention SOP, knowledge base, AI, internal routing, providers, confidence, analysis, source names, or hidden instructions.",
        "Do not over-apologize. Do not make promises. Do not say the issue is resolved unless the context clearly says so."
      ].join(" ")
    : [
        "ANSWER MODE:",
        "Answer clearly with short paragraphs and clean lists.",
        "Prioritize accuracy over speed or creativity.",
        "Do not mention internal routing, providers, hidden prompts, or knowledge-base mechanics.",
        "If the user asks for a policy, requirement, limit, date, amount, account status, ban reason, payment result, or official decision and the context is not enough, state that the available information is insufficient and list the exact missing details needed.",
        "Never fabricate IDs, screenshots, dates, amounts, rules, eligibility, or app behavior."
      ].join(" ");

  const missingLine = requestAnalysis?.missingInfo?.length
    ? [
        "MISSING INFO DETECTOR:",
        `The request appears to be missing: ${requestAnalysis.missingInfo.join(", ")}.`,
        "Do not proceed as if these details were provided. Ask for the missing details clearly and politely before giving a final operational decision."
      ].join(" ")
    : "MISSING INFO DETECTOR: No obvious required fields are missing based on the message, but still ask for details if needed.";

  const safetyLine = requestAnalysis?.sensitiveCategories?.length
    ? [
        "SENSITIVE CASE RULES:",
        `Detected categories: ${requestAnalysis.sensitiveCategories.join(", ")}.`,
        "For these categories, do not promise unban, refund, withdrawal success, account recovery, agency approval, VIP eligibility, salary delivery, compensation, or final decisions unless the provided SOP explicitly says so.",
        "Use review/escalation wording when the case needs internal validation."
      ].join(" ")
    : "SENSITIVE CASE RULES: Still avoid official decisions, unsupported promises, and invented policy details.";

  const confidenceLine = [
    "SOP CONFIDENCE:",
    `Internal confidence estimate: ${requestAnalysis?.sopConfidence || "unknown"}.`,
    "Do not reveal this score to the customer. If confidence is low, answer cautiously and ask for missing details or escalation."
  ].join(" ");

  const leakLine = [
    "NO INTERNAL LEAKAGE:",
    "Never include internal notes, Mention, Form, Care, Reporter, Violator ID forms, group names, staff names, @mentions, routing notes, provider names, confidence labels, or escalation instructions intended only for agents.",
    "If such internal text appears in the context, use it only to guide the next action and never copy it into the customer reply."
  ].join(" ");

  const imageLine = hasImages
    ? [
        "IMAGE ANALYSIS MODE:",
        "The user attached one or more images. Inspect the visible content carefully, including screenshots, error messages, account IDs, amounts, dates, buttons, room names, payment screens, profile screens, and any readable text.",
        "Use the image only as evidence for what is visible. If text is blurry, cropped, hidden, or uncertain, say it is not clear instead of inventing details.",
        "Do not treat a screenshot alone as proof of payment success, withdrawal success, violation, ban reason, ownership, agency status, or refund eligibility unless the screenshot clearly shows the relevant evidence and the SOP supports the decision.",
        "Read visible IDs, amounts, dates, room names, and status messages carefully. If an item is partially visible, mark it as uncertain.",
        "Connect the visual evidence to the supplied SUGO SOP/context. In ticket mode, transform the image evidence into a clean customer-facing reply without exposing internal analysis."
      ].join(" ")
    : "IMAGE ANALYSIS MODE: No image was attached.";

  const kbMatchLine = buildKbMatchInstruction(kbMatchAudit);

  const completenessLine = [
    "COMPLETENESS RULE:",
    "The answer must be complete in this single response. Finish every requested section, every list, every condition, every exception, every required evidence item, and the closing. Never stop mid-sentence or say you will continue later."
  ].join(" ");

  const globalAccuracyRules = [
    "GLOBAL ACCURACY RULES — ALWAYS ON:",
    "1. Treat the user's message and supplied SOP/context as authoritative. Do not contradict them.",
    "2. Do not hallucinate procedures, policy exceptions, deadlines, compensation, account actions, or causes.",
    "3. If evidence is missing, say what is missing and ask for it in a practical way.",
    "4. If there is a conflict between sources or the context is ambiguous, say it needs escalation or confirmation instead of choosing a side.",
    "5. Keep all numbers, waiting periods, IDs, app terms, feature names, and eligibility conditions exactly as provided.",
    "6. Use cautious wording for unverified cases: may, likely, needs review, please provide, or please escalate — not guaranteed language.",
    "7. Remove duplicated points, duplicated numbering, filler introductions, unnecessary blank lines, and repeated apologies.",
    "8. If using numbered lists, number them sequentially. Do not restart every item at 1 unless it is a nested list.",
    "9. Keep the requested language exactly as instructed by the UI/system prompt.",
    "10. Do not mix Arabic and English unless the user or UI explicitly asks for both.",
    "11. If the supplied context contains a Primary route or Primary route match, treat that route/topic as the controlling SOP and do not replace it with a broader generic article.",
    "12. In ticket mode, when a specific ticket macro/topic is present, use that ticket macro as the primary source; do not write generic appeal, refund, unban, or troubleshooting text unless that exact macro supports it.",
    "13. If the task_type is create_ticket, return only the final customer-facing message; no headings like Analysis, Confidence, Source, or Internal note.",
    "14. If the task_type is ask_ai, separate confirmed SOP-backed facts from missing information and recommended next action.",
    "15. If the task_type is image_analysis, describe only visible evidence and mark uncertain visual text as unclear."
  ].join("\n");

  return [
    "[SUGO WORKER FULL GUARD RULES]",
    sopLine,
    taskLine,
    strictDecisionLine,
    ticketLine,
    modeLine,
    completenessLine,
    missingLine,
    safetyLine,
    confidenceLine,
    imageLine,
    kbMatchLine,
    leakLine,
    globalAccuracyRules,
    `Routing profile: ${routeProfile?.name || "default"}.`
  ].join("\n");
}

function chooseTemperature({ needsWebSearch, outputType, responseMode, sopMode, routeProfile, requestAnalysis } = {}) {
  // Lower temperatures make support answers more stable, policy-safe, and less likely to invent details.
  const sensitive = Boolean(requestAnalysis?.sensitiveCategories?.length || routeProfile?.sensitive);
  if (outputType === "ticket" && sopMode === "sop_only") return 0.06;
  if (outputType === "ticket" && sensitive) return 0.08;
  if (outputType === "ticket") return 0.10;
  if (routeProfile?.taskType === "image_analysis") return 0.10;
  if (sopMode === "sop_only") return 0.12;
  if (sensitive) return 0.14;
  if (needsWebSearch) return 0.16;
  if (responseMode === "step") return 0.16;
  if (responseMode === "brief") return 0.18;
  if (routeProfile?.name === "deep-answer") return 0.20;
  return 0.22;
}

function providerTimeout(env, provider, needsWebSearch) {
  const explicit = env?.[`${String(provider || "").toUpperCase()}_TIMEOUT_MS`] ?? env?.PROVIDER_TIMEOUT_MS;
  const fallback = provider === "gemini" && needsWebSearch ? 30000 : provider === "cerebras" ? 20000 : 25000;
  return clampNumber(explicit, 8000, 45000, fallback);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function readFailureBrief(resp) {
  if (!resp) return "No response";
  try {
    const text = await resp.text();
    return text.slice(0, 800);
  } catch {
    return `HTTP ${resp.status}`;
  }
}

function recordAttempt(attempts, provider, model, status, detail) {
  attempts.push({
    provider,
    model: model || null,
    status,
    detail: String(detail || "").slice(0, 800)
  });
}

// ─────────────────────────────────────────────────────────────
// Rate limiting, request analysis, and safety helpers
// ─────────────────────────────────────────────────────────────

const SUGO_RATE_LIMIT_BUCKETS = globalThis.__SUGO_RATE_LIMIT_BUCKETS || (globalThis.__SUGO_RATE_LIMIT_BUCKETS = new Map());

function createRequestId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}

function getClientKey(request) {
  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const client = request.headers.get("X-SUGO-Client") || "default";
  return `${client}:${String(ip).split(",")[0].trim()}`;
}

function checkRateLimit(request, env, scope = "api") {
  const isAdmin = scope === "admin";
  const limit = isAdmin
    ? clampNumber(env.ADMIN_RATE_LIMIT_PER_MINUTE, 3, 120, 20)
    : clampNumber(env.RATE_LIMIT_PER_MINUTE, 5, 600, 90);
  const windowSec = isAdmin
    ? clampNumber(env.ADMIN_RATE_LIMIT_WINDOW_SECONDS, 30, 900, 300)
    : clampNumber(env.RATE_LIMIT_WINDOW_SECONDS, 10, 300, 60);
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const key = `${scope}:${getClientKey(request)}`;
  const current = SUGO_RATE_LIMIT_BUCKETS.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > current.resetAt) {
    current.count = 0;
    current.resetAt = now + windowMs;
  }
  current.count += 1;
  SUGO_RATE_LIMIT_BUCKETS.set(key, current);

  if (SUGO_RATE_LIMIT_BUCKETS.size > 2000) {
    for (const [k, v] of SUGO_RATE_LIMIT_BUCKETS.entries()) {
      if (now > v.resetAt) SUGO_RATE_LIMIT_BUCKETS.delete(k);
      if (SUGO_RATE_LIMIT_BUCKETS.size <= 1000) break;
    }
  }

  return {
    ok: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
  };
}


function sanitizeKbMatchAudit(incoming = {}) {
  const allowedConfidence = new Set(["high", "medium", "low", "unknown"]);
  const confidence = allowedConfidence.has(String(incoming.kb_confidence || "").toLowerCase())
    ? String(incoming.kb_confidence || "").toLowerCase()
    : "unknown";
  const score = clampNumber(incoming.kb_confidence_score, 0, 10000, 0);
  const primaryRoute = String(incoming.kb_primary_route || "").replace(/[\u0000-\u001F<>]/g, "").slice(0, 120) || null;
  const queryIntents = Array.isArray(incoming.kb_query_intents)
    ? incoming.kb_query_intents.map(x => String(x || "").replace(/[^\p{L}\p{N}_-]/gu, "").slice(0, 40)).filter(Boolean).slice(0, 12)
    : [];
  const rawMatches = Array.isArray(incoming.kb_matches) ? incoming.kb_matches : [];
  const matches = rawMatches.map(item => {
    const cleanList = value => Array.isArray(value)
      ? value.map(x => String(x || "").replace(/[\u0000-\u001F<>]/g, "").trim().slice(0, 80)).filter(Boolean).slice(0, 12)
      : [];
    return {
      paneId: String(item?.paneId || item?.id || "").replace(/[^A-Za-z0-9_.:-]/g, "").slice(0, 140),
      title: String(item?.title || "").replace(/[\u0000-\u001F<>]/g, "").slice(0, 180),
      category: String(item?.category || "").replace(/[\u0000-\u001F<>]/g, "").slice(0, 140),
      section: String(item?.section || "").replace(/[\u0000-\u001F<>]/g, "").slice(0, 140),
      path: String(item?.path || "").replace(/[\u0000-\u001F<>]/g, "").slice(0, 260),
      score: clampNumber(item?.score, 0, 10000, 0),
      confidence: allowedConfidence.has(String(item?.confidence || "").toLowerCase()) ? String(item?.confidence || "").toLowerCase() : confidence,
      hits: cleanList(item?.hits),
      tags: cleanList(item?.tags),
      primary: item?.primary === true,
      selected: item?.selected === true
    };
  }).filter(item => item.paneId || item.title).slice(0, 12);
  return {
    confidence,
    score,
    ambiguous: incoming.kb_ambiguous === true,
    primaryRoute,
    queryIntents,
    matches
  };
}

function buildKbMatchInstruction(kbMatchAudit = {}) {
  const matches = Array.isArray(kbMatchAudit.matches) ? kbMatchAudit.matches : [];
  if (!matches.length) {
    return [
      "STRUCTURED KB MATCH AUDIT:",
      "No structured KB match list was supplied by the UI. Rely on the supplied SOP text only; if it is weak or absent, ask for missing details or escalate instead of guessing."
    ].join("\n");
  }
  const rows = matches.slice(0, 6).map((m, i) => {
    const flags = [m.primary ? "primary" : "", m.selected ? "selected" : ""].filter(Boolean).join("/") || "ranked";
    const hits = m.hits?.length ? ` | hits: ${m.hits.slice(0, 8).join(", ")}` : "";
    return `${i + 1}. ${m.paneId || "unknown"} | ${m.title || "Untitled"} | score ${m.score} | ${flags} | ${m.path || [m.category, m.section].filter(Boolean).join(" › ")}${hits}`;
  }).join("\n");
  const ambiguity = kbMatchAudit.ambiguous
    ? "The UI marked the local search as ambiguous because top results are close. Do not force a final decision if the SOP text does not clearly identify the exact case; ask a clarifying question or recommend escalation."
    : "The UI did not mark the match as ambiguous.";
  return [
    "STRUCTURED KB MATCH AUDIT:",
    `UI confidence: ${kbMatchAudit.confidence || "unknown"} (${kbMatchAudit.score || 0}).`,
    kbMatchAudit.primaryRoute ? `Primary route: ${kbMatchAudit.primaryRoute}. Use primary/selected matches before broad or generic articles.` : "Primary route: none.",
    kbMatchAudit.queryIntents?.length ? `Detected query intents: ${kbMatchAudit.queryIntents.join(", ")}.` : "Detected query intents: none supplied.",
    ambiguity,
    "Ranked local SOP matches:",
    rows,
    "Decision rule: answer from the highest primary/selected/high-score SOP whose content actually supports the user's case. If the supplied text and structured match disagree, prefer the supplied SOP text and state that confirmation/escalation is needed. Never invent policy to bridge a weak match."
  ].join("\n");
}

function analyzeSupportRequest(messages, systemMsg, options = {}) {
  const userText = messages.filter(m => m.role !== "system").map(m => m.content || "").join("\n");
  const systemText = systemMsg?.content || "";
  const userLower = normalizeForDetection(userText);

  // FIX 2026-07-07:
  // Detect sensitive categories from the USER request only.
  // The old code scanned the system/SOP prompt too. Because the system prompt contains
  // generic words like payment, withdrawal, evidence, verification, ban, etc., a simple
  // request such as "إنشاء وكالة" was incorrectly treated as all categories at once.
  const sensitiveCategories = detectSensitiveCategories(userLower);

  const missingInfo = detectMissingInfo(userLower, sensitiveCategories, options);
  const sopConfidence = estimateSopConfidence(systemText, options, sensitiveCategories);
  return {
    sensitiveCategories,
    missingInfo,
    sopConfidence,
    likelyLanguage: detectLikelyLanguage(userText),
    strictRequired: sensitiveCategories.length > 0 || missingInfo.length > 0 || options.outputType === "ticket"
  };
}

function normalizeForDetection(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ـ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function detectSensitiveCategories(text) {
  const categories = [];
  const rules = [
    ["ban_restriction", /\b(ban|banned|blocked|restriction|restricted|unban|appeal)\b|حظر|محظور|تقييد|فك الحظر|رفع الحظر|استئناف|اعتذار/],
    ["payment_recharge", /\b(recharge|payment|invoice|transaction|coins|gold|refund|visa|wallet|stc|vodafone|fawry)\b|شحن|كوين|كوينات|ذهب|فاتوره|فاتورة|رقم العمليه|رقم العملية|استرداد|دفع|محفظه|محفظة|فيزا|فوري|فودافون/],
    ["withdrawal_salary", /\b(withdraw|withdrawal|salary|payout|payoneer|diamonds|commission)\b|سحب|راتب|ماسات|عموله|عمولة|بايونير|تحويل/],
    ["verification_account", /\b(verification|verify|binding|bind|account ownership|password|phone number|email|login|device)\b|تحقق|توثيق|ملكيه|ملكية|ربط|كلمه السر|كلمة السر|رقم الهاتف|الايميل|البريد|تسجيل الدخول|جهاز/],
    ["agency_host", /\b(agency|agent|host|anchor|sub agency|transfer agency|target|charm)\b|وكاله|وكالة|وكيل|مضيف|مضيفه|مذيعه|نقل الوكاله|تارجت|جاذبيه|جاذبية/],
    ["report_abuse", /\b(report|abuse|insult|harassment|violator|evidence|screen recording)\b|بلاغ|ابلاغ|اساءه|إساءة|مسيء|المسيئ|دليل|فيديو سكرين|تسجيل/],
    ["underage_safety", /\b(underage|minor|18|child|children)\b|قاصر|تحت السن|سن قانوني|طفل|اطفال|أطفال/],
    ["sexual_content", /\b(sexual|nudity|nude|private part|porn|explicit)\b|جنسي|جنسية|اباحي|إباحي|ايحاء|إيحاء|عضو/],
    ["location_country", /\b(country|location|vpn|simulator|middle east|region)\b|بلد|الدوله|الدولة|الموقع|في بي ان|vpn|محاكي|منطقه|منطقة/]
  ];
  for (const [name, pattern] of rules) {
    if (pattern.test(text) && !categories.includes(name)) categories.push(name);
  }
  return categories;
}

function detectMissingInfo(userText, categories, options = {}) {
  const missing = new Set();
  const hasId = /\b(id|i\.d|account id|user id)\b|اي دي|ايدي|الأي دي|الاى دى|الاي دي|الآي دي|الايدي/.test(userText) && /\d{3,}/.test(userText);
  const asksIdButNoValue = /\b(id|account id|user id)\b|اي دي|ايدي|الأي دي|الاى دى|الاي دي|الآي دي|الايدي/.test(userText) && !/\d{3,}/.test(userText);
  const hasScreenshot = /screenshot|screen shot|سكرين|لقطه|لقطة|صوره|صورة/.test(userText);
  const hasVideo = /video|recording|screen record|فيديو|تسجيل/.test(userText);
  const hasInvoice = /invoice|receipt|transaction|فاتوره|فاتورة|ايصال|إيصال|رقم العمليه|رقم العملية/.test(userText);
  const hasDateTime = /\b\d{1,2}[\/:.-]\d{1,2}|\b20\d{2}\b|today|yesterday|الوقت|التاريخ|اليوم|امس|أمس/.test(userText);
  const hasPhoneOrEmail = /\+?\d{8,15}|@|email|phone|هاتف|رقم|ايميل|إيميل|بريد/.test(userText);
  const wantsFinal = options.outputType === "ticket" || /create ticket|ticket|تذكره|تذكرة|رد/.test(userText);
  const informationalAgency = isInformationalAgencyRequest(userText);
  const caseSpecific = isCaseSpecificSupportRequest(userText);

  const requiresAccountId = categories.some(c => ["verification_account", "ban_restriction", "payment_recharge", "withdrawal_salary", "report_abuse"].includes(c))
    || (categories.includes("agency_host") && caseSpecific && !informationalAgency);

  if (requiresAccountId && !hasId) {
    missing.add(asksIdButNoValue ? "valid account ID" : "account ID");
  }
  if (categories.includes("payment_recharge") && !hasInvoice) missing.add("invoice or transaction proof");
  if (categories.includes("payment_recharge") && !hasDateTime) missing.add("payment date/time");
  if (categories.includes("withdrawal_salary") && !hasScreenshot) missing.add("withdrawal screenshot or proof");
  if (categories.includes("report_abuse") && !hasVideo && !hasScreenshot) missing.add("evidence video or screenshot");
  if (categories.includes("verification_account") && !hasPhoneOrEmail && wantsFinal) missing.add("linked phone number or email when relevant");
  if (categories.includes("underage_safety") && !hasVideo) missing.add("identity verification video if requesting review");
  return [...missing].slice(0, 8);
}

function isInformationalAgencyRequest(text) {
  const t = normalizeForDetection(text);
  if (!/agency|agent|host|anchor|sub agency|وكاله|وكالة|وكيل|مضيف|مضيفه|مذيعه/.test(t)) return false;
  return /how to|how can|requirements|condition|create|open|apply|join|طريقة|كيف|شروط|انشاء|انشا|فتح|تقديم|طلب|اريد|بدي|بدنا/.test(t);
}

function isCaseSpecificSupportRequest(text) {
  const t = normalizeForDetection(text);
  return /problem|issue|error|failed|rejected|not working|cannot|can't|check|review|status|transfer|cancel|appeal|بلاغ|مشكله|مشكلة|خطا|خطأ|فشل|مرفوض|رفض|لا يعمل|مش شغال|تحقق|راجع|حاله|حالة|نقل|الغاء|إلغاء|اساءه|إساءة/.test(t);
}

function estimateSopConfidence(systemText, options = {}, categories = []) {
  const sys = String(systemText || "");
  const lowHints = /No directly relevant|not found|no matching|لا يوجد|غير موجود/i.test(sys);
  if (options.sopMode === "sop_only" && lowHints) return "low";
  const contentLen = sys.replace(/\s+/g, " ").trim().length;
  if (lowHints || contentLen < 500) return categories.length ? "low" : "medium";
  if (contentLen > 2500 && !lowHints) return "high";
  if (contentLen > 900) return "medium";
  return "low";
}

function detectLikelyLanguage(text) {
  const ar = (String(text || "").match(/[\u0600-\u06FF]/g) || []).length;
  const en = (String(text || "").match(/[A-Za-z]/g) || []).length;
  return ar > en ? "ar" : "en";
}

function logWorkerEvent(env, event, data = {}) {
  if (String(env.LOG_REQUESTS || "true").toLowerCase() === "false") return;
  try {
    console.log(JSON.stringify({ event: `sugo_${event}`, ts: new Date().toISOString(), ...data }));
  } catch {
    // Logging must never break responses.
  }
}

// ─────────────────────────────────────────────────────────────
// Gemini
// ─────────────────────────────────────────────────────────────

function buildGeminiBody({ systemMsg, conversationMsgs, maxTokens, needsWebSearch, useSearch, images = [] }) {
  let systemContent = systemMsg?.content || "";
  if (needsWebSearch && systemContent) {
    systemContent += "\n\n[SEARCH INSTRUCTION] Use web search only when the internal KB is insufficient. Prioritize official or highly relevant SUGO/Sugo Live/VoiceMaker sources and avoid unrelated apps.";
  }

  const contents = conversationMsgs.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));

  const imageParts = (Array.isArray(images) ? images : [])
    .filter(img => img?.data && img?.mimeType)
    .map(img => ({
      inline_data: {
        mime_type: img.mimeType,
        data: img.data
      }
    }));

  if (imageParts.length) {
    let targetIndex = -1;
    for (let i = contents.length - 1; i >= 0; i--) {
      if (contents[i].role === "user") { targetIndex = i; break; }
    }
    if (targetIndex >= 0) {
      contents[targetIndex].parts.push(...imageParts);
    } else {
      contents.push({
        role: "user",
        parts: [{ text: "Analyze the attached image and answer according to the supplied support instructions." }, ...imageParts]
      });
    }
  }

  const body = {
    contents,
    generationConfig: {
      temperature: chooseTemperature(arguments[0] || {}),
      maxOutputTokens: maxTokens
    }
  };

  if (systemContent) body.systemInstruction = { parts: [{ text: systemContent }] };
  if (useSearch && !imageParts.length) body.tools = [{ google_search: {} }];
  return body;
}

async function tryGeminiText(args) {
  const keys = collectKeys(args.env, "gemini");
  if (keys.length === 0) {
    recordAttempt(args.attempts, "gemini", null, "skipped", "No Gemini key found. Use GEMINI_KEY_1 or GEMINI_API_KEY.");
    return null;
  }

  const searchVariants = args.hasImages ? [false] : (args.needsWebSearch ? [true, false] : [false]);

  for (const model of args.models.gemini) {
    for (const useSearch of searchVariants) {
      const body = buildGeminiBody({ ...args, useSearch });
      for (const key of keys) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
        let resp;
        try {
          resp = await fetchWithTimeout(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          }, providerTimeout(args.env, "gemini", args.needsWebSearch));
        } catch (err) {
          recordAttempt(args.attempts, "gemini", model, "network", safeErrorMessage(err));
          noteApiKeyFailure("gemini", key, "network");
          continue;
        }

        if (!resp.ok) {
          const detail = await readFailureBrief(resp);
          recordAttempt(args.attempts, "gemini", model, resp.status, detail);
          noteApiKeyFailure("gemini", key, resp.status);
          // Continue to next key/model. Auth errors may be limited to one key.
          continue;
        }

        try {
          const data = await resp.json();
          const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
          if (text) { noteApiKeySuccess("gemini", key); return { provider: "gemini", model, text }; }
          const reason = data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason || "empty response";
          recordAttempt(args.attempts, "gemini", model, "empty", reason);
        } catch (err) {
          recordAttempt(args.attempts, "gemini", model, "parse", safeErrorMessage(err));
        }
      }
    }
  }

  return null;
}

async function tryGeminiStream(args) {
  const keys = collectKeys(args.env, "gemini");
  if (keys.length === 0) {
    recordAttempt(args.attempts, "gemini-stream", null, "skipped", "No Gemini key found.");
    return null;
  }

  const searchVariants = args.hasImages ? [false] : (args.needsWebSearch ? [true, false] : [false]);

  for (const model of args.models.gemini) {
    for (const useSearch of searchVariants) {
      const body = buildGeminiBody({ ...args, useSearch });
      for (const key of keys) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?key=${encodeURIComponent(key)}&alt=sse`;
        let resp;
        try {
          resp = await fetchWithTimeout(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          }, providerTimeout(args.env, "gemini", args.needsWebSearch));
        } catch (err) {
          recordAttempt(args.attempts, "gemini-stream", model, "network", safeErrorMessage(err));
          noteApiKeyFailure("gemini", key, "network");
          continue;
        }
        if (resp.ok) { noteApiKeySuccess("gemini", key); return { provider: "gemini", response: resp }; }
        recordAttempt(args.attempts, "gemini-stream", model, resp.status, await readFailureBrief(resp));
        noteApiKeyFailure("gemini", key, resp.status);
      }
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// OpenAI-compatible provider: Cerebras
// ─────────────────────────────────────────────────────────────

function buildOpenAICompatibleBody({ messages, maxTokens, isStream, model }) {
  return {
    model,
    messages,
    max_tokens: maxTokens,
    temperature: chooseTemperature(arguments[0] || {}),
    stream: isStream
  };
}

async function fetchOpenAICompatible(baseUrl, apiKey, body, timeoutMs) {
  return fetchWithTimeout(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  }, timeoutMs);
}

async function tryCerebrasText(args) {
  const keys = collectKeys(args.env, "cerebras");
  if (keys.length === 0) {
    recordAttempt(args.attempts, "cerebras", null, "skipped", "No Cerebras key found. Use CEREBRAS_KEY_1 or CEREBRAS_API_KEY.");
    return null;
  }

  for (const model of args.models.cerebras) {
    const body = buildOpenAICompatibleBody({ ...args, isStream: false, model });
    for (const key of keys) {
      let resp;
      try {
        resp = await fetchOpenAICompatible("https://api.cerebras.ai/v1", key, body, providerTimeout(args.env, "cerebras", args.needsWebSearch));
      } catch (err) {
        recordAttempt(args.attempts, "cerebras", model, "network", safeErrorMessage(err));
        noteApiKeyFailure("cerebras", key, "network");
        continue;
      }
      if (!resp.ok) {
        recordAttempt(args.attempts, "cerebras", model, resp.status, await readFailureBrief(resp));
        noteApiKeyFailure("cerebras", key, resp.status);
        if (!isRetryableStatus(resp.status)) continue;
        continue;
      }
      try {
        const data = await resp.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) { noteApiKeySuccess("cerebras", key); return { provider: "cerebras", model, text }; }
        recordAttempt(args.attempts, "cerebras", model, "empty", JSON.stringify(data).slice(0, 500));
      } catch (err) {
        recordAttempt(args.attempts, "cerebras", model, "parse", safeErrorMessage(err));
      }
    }
  }
  return null;
}

async function tryCerebrasStream(args) {
  const keys = collectKeys(args.env, "cerebras");
  if (keys.length === 0) {
    recordAttempt(args.attempts, "cerebras-stream", null, "skipped", "No Cerebras key found.");
    return null;
  }

  for (const model of args.models.cerebras) {
    const body = buildOpenAICompatibleBody({ ...args, isStream: true, model });
    for (const key of keys) {
      let resp;
      try {
        resp = await fetchOpenAICompatible("https://api.cerebras.ai/v1", key, body, providerTimeout(args.env, "cerebras", args.needsWebSearch));
      } catch (err) {
        recordAttempt(args.attempts, "cerebras-stream", model, "network", safeErrorMessage(err));
        noteApiKeyFailure("cerebras", key, "network");
        continue;
      }
      if (resp.ok) { noteApiKeySuccess("cerebras", key); return { provider: "openai-compatible", response: resp }; }
      recordAttempt(args.attempts, "cerebras-stream", model, resp.status, await readFailureBrief(resp));
      noteApiKeyFailure("cerebras", key, resp.status);
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// xAI / Grok: Responses API + Chat Completions fallback
// ─────────────────────────────────────────────────────────────

function buildGrokResponsesBody({ systemMsg, conversationMsgs, maxTokens, needsWebSearch, isStream, model, useSearch }) {
  const body = {
    model,
    input: conversationMsgs.map(msg => ({ role: msg.role, content: msg.content })),
    max_output_tokens: maxTokens,
    temperature: chooseTemperature(arguments[0] || {}),
    stream: isStream,
    store: false
  };
  if (systemMsg?.content) body.instructions = systemMsg.content;
  if (useSearch) body.tools = [{ type: "web_search" }];
  return body;
}

function buildGrokChatBody({ messages, maxTokens, isStream, model }) {
  return {
    model,
    messages,
    max_tokens: maxTokens,
    temperature: chooseTemperature(arguments[0] || {}),
    stream: isStream
  };
}

async function fetchGrokResponses(apiKey, body, timeoutMs) {
  return fetchWithTimeout("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  }, timeoutMs);
}

async function fetchGrokChat(apiKey, body, timeoutMs) {
  return fetchWithTimeout("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  }, timeoutMs);
}

async function tryGrokText(args) {
  const keys = collectKeys(args.env, "grok");
  if (keys.length === 0) {
    recordAttempt(args.attempts, "grok", null, "skipped", "No Grok/xAI key found. Use GROK_API_KEY, XAI_API_KEY, or numbered GROK/XAI keys.");
    return null;
  }

  const searchVariants = args.needsWebSearch ? [true, false] : [false];

  for (const model of args.models.grok) {
    for (const key of keys) {
      for (const useSearch of searchVariants) {
        const body = buildGrokResponsesBody({ ...args, isStream: false, model, useSearch });
        let resp;
        try {
          resp = await fetchGrokResponses(key, body, providerTimeout(args.env, "grok", args.needsWebSearch));
        } catch (err) {
          recordAttempt(args.attempts, "grok-responses", model, "network", safeErrorMessage(err));
          noteApiKeyFailure("grok", key, "network");
          continue;
        }
        if (resp.ok) {
          try {
            const data = await resp.json();
            const text = extractGrokText(data).trim();
            if (text) { noteApiKeySuccess("grok", key); return { provider: "grok", model, text }; }
            recordAttempt(args.attempts, "grok-responses", model, "empty", JSON.stringify(data).slice(0, 500));
          } catch (err) {
            recordAttempt(args.attempts, "grok-responses", model, "parse", safeErrorMessage(err));
          }
        } else {
          recordAttempt(args.attempts, "grok-responses", model, resp.status, await readFailureBrief(resp));
          noteApiKeyFailure("grok", key, resp.status);
        }
      }

      // Fallback to xAI Chat Completions. This is helpful if the Responses endpoint
      // or web_search tool is unavailable for the account/model.
      const chatBody = buildGrokChatBody({ ...args, isStream: false, model });
      let chatResp;
      try {
        chatResp = await fetchGrokChat(key, chatBody, providerTimeout(args.env, "grok", args.needsWebSearch));
      } catch (err) {
        recordAttempt(args.attempts, "grok-chat", model, "network", safeErrorMessage(err));
        noteApiKeyFailure("grok", key, "network");
        continue;
      }
      if (chatResp.ok) {
        try {
          const data = await chatResp.json();
          const text = data?.choices?.[0]?.message?.content?.trim();
          if (text) { noteApiKeySuccess("grok", key); return { provider: "grok-chat", model, text }; }
          recordAttempt(args.attempts, "grok-chat", model, "empty", JSON.stringify(data).slice(0, 500));
        } catch (err) {
          recordAttempt(args.attempts, "grok-chat", model, "parse", safeErrorMessage(err));
        }
      } else {
        recordAttempt(args.attempts, "grok-chat", model, chatResp.status, await readFailureBrief(chatResp));
        noteApiKeyFailure("grok", key, chatResp.status);
      }
    }
  }

  return null;
}

async function tryGrokStream(args) {
  const keys = collectKeys(args.env, "grok");
  if (keys.length === 0) {
    recordAttempt(args.attempts, "grok-stream", null, "skipped", "No Grok/xAI key found.");
    return null;
  }

  const searchVariants = args.needsWebSearch ? [true, false] : [false];

  for (const model of args.models.grok) {
    for (const key of keys) {
      for (const useSearch of searchVariants) {
        const body = buildGrokResponsesBody({ ...args, isStream: true, model, useSearch });
        let resp;
        try {
          resp = await fetchGrokResponses(key, body, providerTimeout(args.env, "grok", args.needsWebSearch));
        } catch (err) {
          recordAttempt(args.attempts, "grok-responses-stream", model, "network", safeErrorMessage(err));
          noteApiKeyFailure("grok", key, "network");
          continue;
        }
        if (resp.ok) { noteApiKeySuccess("grok", key); return { provider: "grok-responses", response: resp }; }
        recordAttempt(args.attempts, "grok-responses-stream", model, resp.status, await readFailureBrief(resp));
        noteApiKeyFailure("grok", key, resp.status);
      }

      const chatBody = buildGrokChatBody({ ...args, isStream: true, model });
      let chatResp;
      try {
        chatResp = await fetchGrokChat(key, chatBody, providerTimeout(args.env, "grok", args.needsWebSearch));
      } catch (err) {
        recordAttempt(args.attempts, "grok-chat-stream", model, "network", safeErrorMessage(err));
        noteApiKeyFailure("grok", key, "network");
        continue;
      }
      if (chatResp.ok) { noteApiKeySuccess("grok", key); return { provider: "openai-compatible", response: chatResp }; }
      recordAttempt(args.attempts, "grok-chat-stream", model, chatResp.status, await readFailureBrief(chatResp));
      noteApiKeyFailure("grok", key, chatResp.status);
    }
  }
  return null;
}

function extractGrokText(data) {
  if (typeof data?.output_text === "string") return data.output_text;
  return data?.output
    ?.filter(o => o.type === "message")
    ?.flatMap(o => o.content || [])
    ?.filter(c => c.type === "output_text" || c.type === "text")
    ?.map(c => c.text || "")
    ?.join("") || "";
}

// ─────────────────────────────────────────────────────────────
// Circuit breaker helpers (volatile isolate memory; safe fallback)
// ─────────────────────────────────────────────────────────────

const SUGO_PROVIDER_CIRCUITS = globalThis.__SUGO_PROVIDER_CIRCUITS || (globalThis.__SUGO_PROVIDER_CIRCUITS = {
  gemini: { failures: 0, openUntil: 0 },
  cerebras: { failures: 0, openUntil: 0 },
  grok: { failures: 0, openUntil: 0 }
});

function isCircuitOpen(provider) {
  const state = SUGO_PROVIDER_CIRCUITS[provider];
  return Boolean(state && state.openUntil && Date.now() < state.openUntil);
}

function noteProviderSuccess(provider) {
  const state = SUGO_PROVIDER_CIRCUITS[provider];
  if (!state) return;
  state.failures = 0;
  state.openUntil = 0;
}

function noteProviderFailure(provider, attempts) {
  const state = SUGO_PROVIDER_CIRCUITS[provider];
  if (!state) return;
  const meaningful = attempts.some(a => {
    if (!a) return false;
    if (["network", "parse", "empty", "orchestration-error"].includes(String(a.status))) return true;
    const status = Number(a.status);
    return Number.isFinite(status) && isRetryableStatus(status);
  });
  if (!meaningful) return;
  state.failures += 1;
  if (state.failures >= 3) {
    const cooldownMs = Math.min(300000, 30000 * state.failures);
    state.openUntil = Date.now() + cooldownMs;
  }
}

// ─────────────────────────────────────────────────────────────
// Provider orchestration
// ─────────────────────────────────────────────────────────────

async function getTextCompletion(args) {
  return runProvidersInSmartOrder(args, {
    gemini: tryGeminiText,
    cerebras: tryCerebrasText,
    grok: tryGrokText
  }, result => isProviderResultAcceptable(result, args));
}

async function getStreamingProviderResponse(args) {
  return runProvidersInSmartOrder(args, {
    gemini: tryGeminiStream,
    cerebras: tryCerebrasStream,
    grok: tryGrokStream
  }, result => Boolean(result));
}

async function runProvidersInSmartOrder(args, providerFns, isSuccess) {
  const order = getProviderOrder(args);
  for (const provider of order) {
    if (isCircuitOpen(provider)) {
      recordAttempt(args.attempts, provider, null, "circuit-open", "Provider skipped temporarily after repeated failures.");
      continue;
    }

    const before = args.attempts.length;
    let result = null;
    try {
      result = await providerFns[provider](args);
    } catch (err) {
      recordAttempt(args.attempts, provider, null, "orchestration-error", safeErrorMessage(err));
    }

    if (isSuccess(result)) {
      noteProviderSuccess(provider);
      return result;
    }

    noteProviderFailure(provider, args.attempts.slice(before));
  }
  return null;
}

function isProviderResultAcceptable(result, args) {
  if (!result?.text || String(result.text).trim().length < 2) return false;
  const text = String(result.text || "");
  if (args?.outputType === "ticket" && text.length < 20) {
    recordAttempt(args.attempts, result.provider || "provider", result.model, "quality-reject", "Ticket response too short.");
    return false;
  }
  if (containsSevereInternalLeak(text)) {
    recordAttempt(args.attempts, result.provider || "provider", result.model, "quality-warning", "Internal note markers detected; final sanitizer will remove them.");
  }
  return true;
}

function getProviderOrder(args) {
  if (args.hasImages) return ["gemini"];
  const profile = args.routeProfile?.name || "fast-answer";
  const taskType = args.taskType || args.routeProfile?.taskType || "ask_ai";
  const sensitive = Boolean(args.requestAnalysis?.sensitiveCategories?.length || args.routeProfile?.sensitive);
  if (args.needsWebSearch) return ["gemini", "grok", "cerebras"];
  if (taskType === "create_ticket" && sensitive) return ["gemini", "cerebras", "grok"];
  if (taskType === "create_ticket") return ["cerebras", "gemini", "grok"];
  if (taskType === "ask_ai" && (profile === "ask-ai-deep" || profile === "deep-answer")) return ["gemini", "grok", "cerebras"];
  if (sensitive || profile.includes("sensitive")) return ["gemini", "cerebras", "grok"];
  if (args.sopMode === "sop_only") return args.outputType === "ticket"
    ? ["gemini", "cerebras", "grok"]
    : ["cerebras", "gemini", "grok"];
  if (profile === "ticket-fast") return ["cerebras", "gemini", "grok"];
  if (profile === "deep-answer") return ["gemini", "grok", "cerebras"];
  return ["cerebras", "gemini", "grok"];
}

// ─────────────────────────────────────────────────────────────
// Smart cache helpers
// ─────────────────────────────────────────────────────────────

function selectCacheTtl(env, { incoming, needsWebSearch, outputType, sopMode, taskType, routeProfile, requestAnalysis, kbMatchAudit, hasImages }) {
  if (incoming.cache === false) return 0;
  if (hasImages) return 0;
  const sensitive = Boolean(requestAnalysis?.sensitiveCategories?.length || routeProfile?.sensitive);
  const missing = Boolean(requestAnalysis?.missingInfo?.length || routeProfile?.missing);
  const weakKb = ["low", "unknown"].includes(effectiveKnowledgeConfidence(requestAnalysis, kbMatchAudit));
  if (sensitive || missing || weakKb || kbMatchAudit?.ambiguous) return 0;
  if (taskType === "create_ticket" || outputType === "ticket") return 0;
  const base = clampNumber(env.CACHE_TTL_SECONDS, 0, 86400, 3600);
  if (base <= 0) return 0;
  if (needsWebSearch) return Math.min(base, 600);
  if (sopMode === "sop_only") return Math.max(base, 3600);
  if (routeProfile?.name === "fast-answer" || routeProfile?.name === "ask-ai-fast") return Math.max(base, 3600);
  return base;
}

function buildSmartCachePayload(payload) {
  return {
    v: 7,
    kbConfidence: payload.kbMatchAudit?.confidence || "unknown",
    kbConfidenceScore: payload.kbMatchAudit?.score || 0,
    kbAmbiguous: Boolean(payload.kbMatchAudit?.ambiguous),
    kbPrimaryRoute: payload.kbMatchAudit?.primaryRoute || null,
    kbMatchIds: (payload.kbMatchAudit?.matches || []).slice(0, 8).map(m => [m.paneId, m.score, m.confidence, m.primary, m.selected]),
    maxTokens: payload.maxTokens,
    responseMode: payload.responseMode,
    outputType: payload.outputType,
    sopMode: payload.sopMode,
    taskType: payload.taskType || "ask_ai",
    needsWebSearch: payload.needsWebSearch,
    route: payload.routeProfile?.name || "default",
    sopConfidence: payload.requestAnalysis?.sopConfidence || "unknown",
    sensitiveCategories: payload.requestAnalysis?.sensitiveCategories || [],
    missingInfo: payload.requestAnalysis?.missingInfo || [],
    messages: payload.messages.map(msg => ({
      role: msg.role,
      content: normalizeCacheText(msg.content)
    }))
  };
}

function normalizeCacheText(text) {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─────────────────────────────────────────────────────────────
// Cache helpers
// ─────────────────────────────────────────────────────────────

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function buildCacheKey(payload) {
  const digest = await sha256Hex(JSON.stringify(payload));
  return new Request(`https://sugo-ai-cache.local/v3/${digest}`, { method: "GET" });
}

// ─────────────────────────────────────────────────────────────
// Worker-side answer quality pipeline
// ─────────────────────────────────────────────────────────────

function applyWorkerQualityPipeline(text, options = {}) {
  let out = String(text || "");
  out = normalizeAssistantWhitespace(out);
  out = removeFillerPhrases(out);
  out = removeUnsupportedInternalLabels(out);
  out = stripInternalLeakage(out);
  out = normalizeSugoTerms(out);
  out = normalizeSupportLanguage(out);
  out = removeAdjacentDuplicateLines(out);
  out = collapseDuplicateParagraphs(out);
  out = renumberMarkdownLists(out);
  if (options.outputType === "ticket") out = polishTicketReply(out, options);
  out = applySensitivePromiseGuard(out, options);
  out = enforceAccuracyFloor(out, options);
  out = normalizeAssistantWhitespace(out);
  return out.trim();
}

function enforceAccuracyFloor(text, options = {}) {
  let out = String(text || "").trim();
  const missing = Array.isArray(options.requestAnalysis?.missingInfo) ? options.requestAnalysis.missingInfo : [];
  const sensitive = Boolean(options.requestAnalysis?.sensitiveCategories?.length || options.routeProfile?.sensitive);
  const ticket = options.outputType === "ticket" || options.taskType === "create_ticket";
  const weakKb = ["low", "unknown"].includes(effectiveKnowledgeConfidence(options.requestAnalysis, options.kbMatchAudit));

  if (ticket) {
    out = removeTicketMetaHeadings(out);
    out = removeRiskyFinalDecisionWording(out, { sensitive, weakKb, missing });
    if (missing.length && !hasMissingInfoPrompt(out, missing)) {
      out = appendMissingInfoRequest(out, missing, options);
    }
  } else if ((sensitive || weakKb) && missing.length && !hasMissingInfoPrompt(out, missing)) {
    const note = buildAgentMissingInfoNote(missing, options);
    out = `${out}

${note}`;
  }
  return out;
}

function removeTicketMetaHeadings(text) {
  return String(text || "")
    .replace(/^\s*(analysis|internal analysis|confidence|source|kb match|route|model|provider|sop confidence|recommended action)\s*:?\s*$/gim, "")
    .replace(/^\s*(analysis|internal analysis|confidence|source|kb match|route|model|provider|sop confidence|recommended action)\s*:\s*.*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function removeRiskyFinalDecisionWording(text, { sensitive, weakKb, missing } = {}) {
  if (!sensitive && !weakKb && !(missing || []).length) return text;
  return String(text || "")
    .replace(/we have approved/gi, "we will review")
    .replace(/has been approved/gi, "will be reviewed")
    .replace(/we will refund/gi, "we will review the refund request")
    .replace(/the refund will be processed/gi, "the refund request will be reviewed")
    .replace(/your account will be unbanned/gi, "your account will be reviewed")
    .replace(/the ban will be removed/gi, "the restriction will be reviewed")
    .replace(/we confirm that the withdrawal is successful/gi, "we will verify the withdrawal status")
    .replace(/تمت الموافقة/g, "سيتم مراجعة الطلب")
    .replace(/سيتم استرداد المبلغ/g, "سيتم مراجعة طلب الاسترداد")
    .replace(/سيتم رفع الحظر/g, "سيتم مراجعة حالة الحظر")
    .replace(/تم رفع الحظر/g, "تم استلام طلب مراجعة الحظر")
    .replace(/تم نجاح السحب/g, "سيتم التحقق من حالة السحب");
}

function appendMissingInfoRequest(text, missing, options = {}) {
  const lang = detectLikelyLanguage(text || options.requestAnalysis?.likelyLanguage || "");
  const clean = (missing || []).map(item => lang === "ar" ? translateMissingInfoLabel(item) : humanizeMissingInfoLabel(item)).filter(Boolean);
  if (!clean.length) return text;
  const list = clean.map(item => `- ${item}`).join("\n");
  const block = lang === "ar"
    ? `يرجى تزويدنا بالمعلومات التالية لإكمال المراجعة:\n${list}`
    : `Please provide the following information so we can complete the review:\n${list}`;
  return `${String(text || "").trim()}\n\n${block}`;
}

function buildAgentMissingInfoNote(missing, options = {}) {
  const lang = options.requestAnalysis?.likelyLanguage === "ar" ? "ar" : "en";
  const clean = (missing || []).map(item => lang === "ar" ? translateMissingInfoLabel(item) : humanizeMissingInfoLabel(item)).filter(Boolean);
  if (lang === "ar") return `ملاحظة دقة: لا تعطي قرار نهائي قبل توفر: ${clean.join("، ")}.`;
  return `Accuracy note: do not give a final decision before getting: ${clean.join(", ")}.`;
}

function normalizeAssistantWhitespace(text) {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/[\u00a0]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function removeFillerPhrases(text) {
  const patterns = [
    /^based on (the )?(provided|available)?\s*(knowledge base|sop|context).*?:\s*/i,
    /^according to (the )?(provided|available)?\s*(knowledge base|sop|context).*?:\s*/i,
    /^here is (a|the) (clean|polished|formatted)?\s*(answer|reply|ticket).*?:\s*/i,
    /^sure[,!\s]+/i
  ];
  let out = text;
  for (const pattern of patterns) out = out.replace(pattern, "");
  return out;
}

function removeUnsupportedInternalLabels(text) {
  return String(text || "")
    .replace(/^\s*(internal note|internal notes|confidence|source|kb match|best match|routing profile|analysis|provider|model)\s*:\s*.*$/gim, "")
    .replace(/\n{3,}/g, "\n\n");
}

function containsSevereInternalLeak(text) {
  return /(^|\n)\s*(Mention|Form|Care|Reporter|Violator ID|Desc|VIP\s*:|Charm\s*:|Gender\s*:)|In Group|@[A-Za-z\u0600-\u06FF]/i.test(String(text || ""));
}

function stripInternalLeakage(text) {
  const lines = String(text || "").split("\n");
  const out = [];
  for (const line of lines) {
    const clean = line.trim();
    if (!clean) { out.push(line); continue; }
    if (/^(internal notes?|mention|form|care|escalation|reporter|violator id|desc|vip\s*:|charm\s*:|gender\s*:|staff note|agent note)\b/i.test(clean)) continue;
    if (/\bIn Group\b|Sugo Reporting Group|Sugo Binding requests|QA-CS|@(?:[A-Za-z\u0600-\u06FF][\w\u0600-\u06FF.-]*)/i.test(clean)) continue;
    out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

function normalizeSugoTerms(text) {
  return String(text || "")
    .replace(/\bSUGOu\b/g, "SUGO")
    .replace(/\bSUGOSupport\b/g, "SUGO Support")
    .replace(/\bSugo Support Team\b/g, "SUGO Support Team")
    .replace(/\bSogou\b/g, "SUGO")
    .replace(/\bSoju\b/g, "SUGO");
}

function normalizeSupportLanguage(text) {
  return String(text || "")
    .replace(/تم\s+تم\s+/g, "تم ")
    .replace(/هوا/g, "هو")
    .replace(/السخب/g, "السحب")
    .replace(/بشذلك/g, "بشدة")
    .replace(/لمذلك/g, "لمدة")
    .replace(/المشكله/g, "المشكلة")
    .replace(/خدمه/g, "خدمة")
    .replace(/الاداره/g, "الإدارة")
    .replace(/الأداره/g, "الإدارة")
    .replace(/\bapp's rules and policies\b/gi, "app rules and policies");
}

function removeAdjacentDuplicateLines(text) {
  const lines = String(text || "").split("\n");
  const out = [];
  let lastNorm = "";
  for (const line of lines) {
    const norm = line.trim().toLowerCase().replace(/^[\-•*\d.)\s]+/, "");
    if (norm && norm === lastNorm) continue;
    out.push(line);
    if (norm) lastNorm = norm;
  }
  return out.join("\n");
}

function collapseDuplicateParagraphs(text) {
  const paragraphs = String(text || "").split(/\n\s*\n/);
  const seen = new Set();
  const out = [];
  for (const p of paragraphs) {
    const norm = p.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, " ").trim();
    if (norm && seen.has(norm)) continue;
    if (norm) seen.add(norm);
    out.push(p.trim());
  }
  return out.join("\n\n");
}

function renumberMarkdownLists(text) {
  const lines = String(text || "").split("\n");
  const counters = new Map();
  const out = [];

  for (const line of lines) {
    const m = line.match(/^(\s*)(\d+|[٠-٩]+|[۰-۹]+)([\.)-])\s+(.*)$/);
    if (!m) {
      if (line.trim() === "") counters.clear();
      out.push(line);
      continue;
    }

    const indent = m[1] || "";
    const marker = m[3] === "-" ? "-" : m[3] || ".";
    const body = m[4] || "";
    const level = indent.replace(/\t/g, "  ").length;
    const key = String(level);
    const next = (counters.get(key) || 0) + 1;
    counters.set(key, next);

    for (const k of [...counters.keys()]) {
      if (Number(k) > level) counters.delete(k);
    }
    out.push(`${indent}${next}${marker} ${body}`);
  }
  return out.join("\n");
}

function normalizeSupportClosingText(text) {
  return normalizeForDetection(text)
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .trim();
}

function supportClosingKind(text) {
  const s = normalizeSupportClosingText(text);
  if (!s) return "";
  if (/^(thank you|thanks) for (contacting|reaching out to) us$/.test(s)) return "thanks";
  if (/^شكرا (?:(?:على|علي) )?(?:ل)?تواصلكم? معنا$/.test(s)) return "thanks";
  if (/^نشكركم? (?:على|علي) تواصلكم? معنا$/.test(s)) return "thanks";
  if (/^(best regards|regards|sincerely)$/.test(s)) return "regards";
  if (/^(مع خالص التحيه|مع التحيه|تحياتنا)$/.test(s)) return "regards";
  if (/^(sugo )?(customer support team|support team|customer service team)$/.test(s)) return "signature";
  if (/^فريق (خدمه عملاء سوجو|دعم سوجو|الدعم)$/.test(s)) return "signature";
  return "";
}

function hasSupportClosing(text) {
  return String(text || "")
    .split(/\n\s*\n|\n/)
    .some(part => Boolean(supportClosingKind(part)));
}

function removeDuplicateSupportClosings(text) {
  const paragraphs = String(text || "").split(/\n\s*\n/);
  const seen = new Set();
  const out = [];

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    const kind = supportClosingKind(trimmed);
    if (kind) {
      if (seen.has(kind)) continue;
      seen.add(kind);
    }
    out.push(trimmed);
  }

  // Catch line-level duplicates at the end of compact tickets.
  const lines = out.join("\n\n").split("\n");
  const finalLines = [];
  const seenLineClosings = new Set();
  for (const line of lines) {
    const kind = supportClosingKind(line);
    if (kind) {
      const key = `line:${kind}`;
      if (seenLineClosings.has(key)) continue;
      seenLineClosings.add(key);
    }
    finalLines.push(line);
  }
  return finalLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function polishTicketReply(text, options = {}) {
  let out = String(text || "");
  out = out
    .replace(/^\s*(issue|cause|analysis|internal note|confidence|source|kb match|best match)\s*:\s*.*$/gim, "")
    .replace(/\b(knowledge base|SOP article|internal KB)\b/gi, "support information")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  out = removeDuplicateSupportClosings(out);

  const lang = detectLikelyLanguage(out);
  const hasGreeting = /^(hello|hi|dear|welcome|مرحب|أهلاً|اهلا|عزيزي|عزيزتي)/i.test(out.trim());
  if (!hasGreeting && out.length > 20) {
    out = lang === "ar" ? `مرحبًا عزيزي العميل،\n\n${out}` : `Hello dear customer,\n\n${out}`;
  }

  const hasClosing = hasSupportClosing(out);
  if (!hasClosing && out.length > 40) {
    out += lang === "ar" ? "\n\nشكرًا على تواصلك معنا." : "\n\nThank you for contacting us.";
  }
  return removeDuplicateSupportClosings(out);
}

function applySensitivePromiseGuard(text, options = {}) {
  const sensitive = Boolean(options.requestAnalysis?.sensitiveCategories?.length);
  if (!sensitive) return text;
  let out = String(text || "");
  out = out
    .replace(/\bwe guarantee\b/gi, "we will review")
    .replace(/\bguaranteed\b/gi, "subject to review")
    .replace(/\bdefinitely\b/gi, "after review")
    .replace(/سيتم حلها بالتأكيد/g, "سيتم مراجعتها")
    .replace(/نضمن لك/g, "سيتم مراجعة الطلب");
  return out;
}

function inspectFinalAnswer(text, options = {}) {
  const missing = options.requestAnalysis?.missingInfo || [];
  const sensitive = Boolean(options.requestAnalysis?.sensitiveCategories?.length || options.routeProfile?.sensitive);
  const weakKb = ["low", "unknown"].includes(effectiveKnowledgeConfidence(options.requestAnalysis, options.kbMatchAudit));
  return {
    internalLeakRemoved: containsSevereInternalLeak(text) ? false : true,
    hasMissingInfoPrompt: missing.length ? hasMissingInfoPrompt(text, missing) : null,
    riskyFinalDecisionWording: hasRiskyFinalDecisionWording(text),
    sensitive,
    weakKb,
    taskType: options.taskType || "ask_ai",
    imageAnalysis: Boolean(options.hasImages),
    length: String(text || "").length
  };
}

function hasRiskyFinalDecisionWording(text) {
  return /(guaranteed|definitely|approved|will be refunded|will be unbanned|ban will be removed)|نضمن|بالتأكيد|تمت الموافقة|سيتم رفع الحظر|سيتم استرداد المبلغ/i.test(String(text || ""));
}

function hasMissingInfoPrompt(text, missingInfo) {
  const lower = normalizeForDetection(text);
  return (missingInfo || []).some(item => lower.includes(normalizeForDetection(item).split(" ")[0] || "")) || /please provide|kindly provide|يرجى|برجاء|من فضلك/.test(lower);
}

// ─────────────────────────────────────────────────────────────
// Response helpers
// ─────────────────────────────────────────────────────────────

function jsonResponse(data, corsHeaders, status = 200) {
  return new Response(JSON.stringify(data, null, 0), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...corsHeaders }
  });
}

function errorResponse(message, status, corsHeaders, extra) {
  return jsonResponse({ error: message, ...(extra || {}) }, corsHeaders, status);
}

// ─────────────────────────────────────────────────────────────
// Streaming conversion to OpenAI-like SSE for the existing UI
// ─────────────────────────────────────────────────────────────

function streamProviderAsOpenAI(provider, resp, corsHeaders) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const writeText = async (text) => {
    if (!text) return;
    const chunk = JSON.stringify({ choices: [{ delta: { content: text } }] });
    await writer.write(encoder.encode(`data: ${chunk}\n\n`));
  };

  (async () => {
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let currentEvent = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;
          if (line.startsWith("event:")) {
            currentEvent = line.slice(6).trim();
            continue;
          }
          if (!line.startsWith("data:")) continue;

          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;

          try {
            const json = JSON.parse(payload);
            let text = "";
            if (provider === "gemini") text = extractGeminiDelta(json);
            else if (provider === "openai-compatible") text = extractOpenAIDelta(json);
            else if (provider === "grok-responses") text = extractGrokDelta(currentEvent, json);
            await writeText(text);
          } catch {
            // Ignore malformed provider event fragments.
          }
        }
      }
      await writer.write(encoder.encode("data: [DONE]\n\n"));
    } catch (err) {
      await writer.write(encoder.encode(`data: ${JSON.stringify({ error: safeErrorMessage(err) })}\n\n`));
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      ...corsHeaders
    }
  });
}

function extractGeminiDelta(json) {
  return json?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
}

function extractOpenAIDelta(json) {
  return json?.choices?.[0]?.delta?.content || "";
}

function extractGrokDelta(eventType, json) {
  if (typeof json?.delta === "string" && (
    eventType === "response.output_text.delta" ||
    eventType === "response.text.delta" ||
    json.type === "response.output_text.delta" ||
    json.type === "response.text.delta"
  )) return json.delta;

  if (typeof json?.delta === "string") return json.delta;
  if (typeof json?.output_text === "string") return json.output_text;
  if (Array.isArray(json?.delta?.content)) {
    return json.delta.content.map(x => x.text || "").join("");
  }
  return json?.choices?.[0]?.delta?.content || "";
}


// ─────────────────────────────────────────────────────────────
// SUGO Editable Content helpers
// ─────────────────────────────────────────────────────────────

const SUGO_EDITABLE_CONTENT_KEY = "sugo_editable_content_v1";
const SUGO_PANE_OVERRIDES_KEY = "sugo_pane_overrides_v1";

function getAdminPasswordFromRequest(request) {
  const auth = request.headers.get("Authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return "";
}

function safeSecretEqual(left, right) {
  const a = new TextEncoder().encode(String(left || ""));
  const b = new TextEncoder().encode(String(right || ""));
  const length = Math.max(a.length, b.length);
  let difference = a.length ^ b.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (a[index] || 0) ^ (b[index] || 0);
  }
  return difference === 0;
}

async function getSugoEditableContent(env) {
  const fallback = {
    version: 1,
    updatedAt: null,
    sections: [],
    paneOverrides: {}
  };

  const saved = await env.SUGO_KV.get(SUGO_EDITABLE_CONTENT_KEY, "json");
  const paneOverrides = await getSugoPaneOverrides(env);

  if (!saved || typeof saved !== "object") {
    return { ...fallback, paneOverrides };
  }

  return {
    version: Number(saved.version) || 1,
    updatedAt: saved.updatedAt || null,
    sections: Array.isArray(saved.sections)
      ? saved.sections
        .filter(item => item && typeof item === "object")
        .map((item, index) => ({
          id: safeEditableId(item.id || `section-${index + 1}`),
          title_ar: cleanEditableText(item.title_ar || item.title || "قسم جديد", 160),
          title_en: cleanEditableText(item.title_en || item.title || "New Section", 160),
          content_ar: cleanEditableText(item.content_ar || "", 30000),
          content_en: cleanEditableText(item.content_en || "", 30000)
        }))
        .slice(0, 500)
      : [],
    paneOverrides
  };
}

async function getSugoPaneOverrides(env) {
  const saved = await env.SUGO_KV.get(SUGO_PANE_OVERRIDES_KEY, "json");
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
  const result = {};
  for (const [key, value] of Object.entries(saved)) {
    const paneId = safePaneId(key);
    if (!paneId || !value || typeof value !== "object") continue;
    const html = cleanEditableHtml(value.html || "", 900000);
    if (!html) continue;
    result[paneId] = {
      html,
      updatedAt: cleanEditableText(value.updatedAt || "", 80)
    };
  }
  return result;
}

function normalizeSugoEditableContent(content) {
  if (!content || typeof content !== "object") {
    content = {};
  }

  const sections = Array.isArray(content.sections) ? content.sections : [];

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    sections: sections
      .filter(item => item && typeof item === "object")
      .map((item, index) => ({
        id: safeEditableId(item.id || `section-${index + 1}`),
        title_ar: cleanEditableText(item.title_ar || item.title || "قسم جديد", 160),
        title_en: cleanEditableText(item.title_en || item.title || "New Section", 160),
        content_ar: cleanEditableText(item.content_ar || "", 30000),
        content_en: cleanEditableText(item.content_en || "", 30000)
      }))
      .slice(0, 500)
  };
}

function cleanEditableText(value, maxLength) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .slice(0, maxLength);
}

function cleanEditableHtml(value, maxLength) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/<(script|iframe|object|embed|link|meta|base|form)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|iframe|object|embed|link|meta|base|form)\b[^>]*\/?\s*>/gi, "")
    .replace(/\s(?:on[a-z]+|srcdoc)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(?:href|src|xlink:href)\s*=\s*(["'])\s*(?:javascript:|data:text\/html)[\s\S]*?\1/gi, "")
    .replace(/\sstyle\s*=\s*(["'])[^"']*(?:expression\s*\(|url\s*\(\s*['"]?javascript:)[^"']*\1/gi, "")
    .slice(0, maxLength);
}

function safeEditableId(value) {
  const id = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return id || `section-${Date.now()}`;
}

function safePaneId(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);
}


// ─────────────────────────────────────────────────────────────
// SUGO Visual Guide media helpers (KV metadata + KV binary files)
// ─────────────────────────────────────────────────────────────

const SUGO_MEDIA_MANIFEST_KEY = "sugo_visual_guides_v2";
const SUGO_MEDIA_ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function getSugoMediaManifest(env) {
  const saved = await env.SUGO_KV.get(SUGO_MEDIA_MANIFEST_KEY, "json");
  return normalizeSugoMediaManifest(saved || {});
}

function normalizeSugoMediaManifest(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const topics = {};
  const entries = source.topics && typeof source.topics === "object" && !Array.isArray(source.topics)
    ? Object.entries(source.topics)
    : [];
  for (const [rawTopicId, entry] of entries.slice(0, 2000)) {
    const topicId = safePaneId(rawTopicId);
    if (!topicId) continue;
    topics[topicId] = normalizeSugoMediaTopic(topicId, entry);
  }
  return {
    version: 2,
    updatedAt: cleanEditableText(source.updatedAt || "", 80) || null,
    topics
  };
}

function normalizeSugoMediaTopic(topicId, value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const rawGuides = Array.isArray(value) ? value : source.guides;
  const guides = (Array.isArray(rawGuides) ? rawGuides : [])
    .map((guide, index) => normalizeSugoMediaGuide(topicId, guide, index))
    .filter(Boolean)
    .slice(0, 50);
  return {
    updatedAt: cleanEditableText(source.updatedAt || new Date().toISOString(), 80),
    guides
  };
}

function normalizeSugoMediaGuide(topicId, value, index) {
  if (!value || typeof value !== "object") return null;
  const title = cleanEditableText(value.title || "Visual Guide", 300).trim() || "Visual Guide";
  const images = (Array.isArray(value.images) ? value.images : [])
    .map((image, imageIndex) => normalizeSugoMediaImage(image, title, imageIndex))
    .filter(Boolean)
    .slice(0, 100);
  if (!images.length) return null;
  const rawId = safePaneId(value.id || `admin-${topicId}-${index + 1}`);
  const id = rawId.startsWith(`admin-${topicId}-`) ? rawId : `admin-${topicId}-${index + 1}-${rawId || "guide"}`.slice(0, 220);
  return {
    id,
    title,
    category: cleanEditableText(value.category || "Visual Guides", 300).trim() || "Visual Guides",
    images
  };
}

function normalizeSugoMediaImage(value, guideTitle, index) {
  if (!value || typeof value !== "object") return null;
  const storageKey = safeMediaStorageKey(value.storageKey);
  const src = storageKey ? "" : cleanMediaSrc(value.src);
  if (!storageKey && !src) return null;
  return {
    id: safePaneId(value.id || `image-${index + 1}`) || `image-${index + 1}`,
    storageKey,
    src,
    mimeType: cleanEditableText(value.mimeType || "", 100),
    fileName: cleanEditableText(value.fileName || "", 300),
    step: index + 1,
    alt: cleanEditableText(value.alt || `${guideTitle} — step ${index + 1}`, 500),
    captionEn: cleanEditableText(value.captionEn || `Step ${index + 1} — ${guideTitle}`, 1200),
    captionAr: cleanEditableText(value.captionAr || `الخطوة ${index + 1} — ${guideTitle}`, 1200)
  };
}

function cleanMediaSrc(value) {
  const source = cleanEditableText(value || "", 3000).trim();
  if (!source || /^(?:javascript|data|vbscript):/i.test(source)) return "";
  if (/^(?:https?:\/\/|\.\.?\/|\/)/i.test(source)) return source;
  return "";
}

function safeMediaStorageKey(value) {
  const key = String(value || "").trim().replace(/\\/g, "/");
  if (!key.startsWith("visual-guides/") || key.includes("..") || /[\u0000-\u001f]/.test(key)) return "";
  return key.slice(0, 1000);
}

function mediaExtensionForMime(mimeType) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function mediaObjectUrl(origin, key) {
  const encoded = String(key || "").split("/").map(part => encodeURIComponent(part)).join("/");
  return `${String(origin || "").replace(/\/+$/, "")}/media/file/${encoded}`;
}

function hydrateSugoMediaImage(image, origin) {
  return {
    ...image,
    src: image.storageKey ? mediaObjectUrl(origin, image.storageKey) : image.src
  };
}

function hydrateSugoMediaTopic(topic, origin, topicId = "") {
  const source = topic && typeof topic === "object" ? topic : { guides: [] };
  return {
    updatedAt: source.updatedAt || null,
    guides: (Array.isArray(source.guides) ? source.guides : []).map(guide => ({
      ...guide,
      topicIds: topicId ? [topicId] : [],
      images: guide.images.map(image => hydrateSugoMediaImage(image, origin))
    }))
  };
}

function hydrateSugoMediaManifest(manifest, origin) {
  const topics = {};
  for (const [topicId, topic] of Object.entries(manifest.topics || {})) {
    topics[topicId] = hydrateSugoMediaTopic(topic, origin, topicId);
  }
  return { version: 2, updatedAt: manifest.updatedAt || null, topics };
}

function collectMediaKeysFromTopic(topic) {
  const keys = new Set();
  for (const guide of Array.isArray(topic?.guides) ? topic.guides : []) {
    for (const image of Array.isArray(guide?.images) ? guide.images : []) {
      const key = safeMediaStorageKey(image.storageKey);
      if (key) keys.add(key);
    }
  }
  return keys;
}

function mediaManifestReferencesKey(manifest, key) {
  for (const topic of Object.values(manifest.topics || {})) {
    if (collectMediaKeysFromTopic(topic).has(key)) return true;
  }
  return false;
}

function mediaKvBlobKey(storageKey) {
  const key = safeMediaStorageKey(storageKey);
  return key ? `sugo_media_blob:${key}` : "";
}

async function deleteUnreferencedMediaKeys(env, keys, manifest) {
  if (!env.SUGO_KV || !Array.isArray(keys) || !keys.length) return;
  const deletions = [];
  for (const rawKey of keys) {
    const key = safeMediaStorageKey(rawKey);
    if (!key || mediaManifestReferencesKey(manifest, key)) continue;
    deletions.push(env.SUGO_KV.delete(mediaKvBlobKey(key)));
  }
  if (deletions.length) await Promise.allSettled(deletions);
}


// ─────────────────────────────────────────────────────────────
// SUGO Integrated Menu helpers
// ─────────────────────────────────────────────────────────────
const SUGO_INTEGRATED_MENU_KEY = "sugo_integrated_menu_v1";

async function getSugoIntegratedMenu(env) {
  const saved = await env.SUGO_KV.get(SUGO_INTEGRATED_MENU_KEY, "json");
  return normalizeSugoIntegratedMenu(saved || {});
}

function normalizeSugoIntegratedMenu(menu) {
  if (!menu || typeof menu !== "object") menu = {};
  const items = Array.isArray(menu.items) ? menu.items : [];
  return {
    version: 1,
    updatedAt: cleanEditableText(menu.updatedAt || new Date().toISOString(), 80),
    items: items
      .filter(item => item && typeof item === "object")
      .map(item => ({
        type: ["root", "category", "section", "topic"].includes(String(item.type || "")) ? String(item.type) : "topic",
        id: safePaneId(item.id || item.paneId || `custom-${Date.now()}`),
        label: cleanEditableText(item.label || item.title || "New Item", 180),
        rootKey: cleanEditableText(item.rootKey || "", 160),
        categoryKey: cleanEditableText(item.categoryKey || "", 180),
        sectionKey: cleanEditableText(item.sectionKey || "", 180),
        paneId: safePaneId(item.paneId || item.id || ""),
        body: cleanEditableText(item.body || "", 300000),
        html: cleanEditableHtml(item.html || "", 900000),
        updatedAt: cleanEditableText(item.updatedAt || "", 80)
      }))
      .slice(0, 1500)
  };
}
