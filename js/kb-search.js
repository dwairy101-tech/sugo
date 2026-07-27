(() => {
  "use strict";

  window.SUGO = window.SUGO || {};

  const VERSION = "1.0-high-precision-bm25";
  const STOP_WORDS = new Set([
    "a", "an", "and", "are", "can", "do", "for", "from", "how", "i", "in", "is", "it",
    "hello", "hi", "me", "my", "of", "on", "or", "please", "support", "the", "this", "to", "what", "with", "you",
    "انا", "انت", "او", "إلى", "الى", "بدي", "شو", "عن", "على", "في", "كيف", "ما", "من",
    "اهلا", "دعم", "مرحبا", "مساعده", "مساعدة", "مشكله", "مشكلة", "موضوع", "هذا", "هذه", "هو", "هي"
  ].map(normalize));

  const QUERY_ALIASES = Object.freeze([
    [/\bما وصل(?:ني|ت)?\b/g, "لم يصل"],
    [/\bمش قادر (?:افوت|ادخل)\b/g, "لا استطيع الدخول"],
    [/\bما بقدر (?:افوت|ادخل)\b/g, "لا استطيع الدخول"],
    [/\bانحظر(?:ت|لي)?\b/g, "حظر"],
    [/\bافتحلي\b/g, "فتح"],
    [/\bباسورد\b/g, "كلمه مرور"],
    [/\bكوينات\b/g, "كوينز"],
    [/\bsign\s*in\b/g, "login"],
    [/\blog\s*in\b/g, "login"],
    [/\btop\s*up\b/g, "recharge"],
    [/\bsub\s*agency\b/g, "subagency"],
    [/\bmain\s*agency\b/g, "mainagency"]
  ]);

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/[إأآٱا]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/ـ/g, "")
      .replace(/\bphone\s*number\b/g, "phone")
      .replace(/\baccount\s*id\b/g, "id")
      .replace(/\buser\s*id\b/g, "id")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeQuery(value) {
    let output = normalize(value);
    for (const [pattern, replacement] of QUERY_ALIASES) {
      output = normalize(output.replace(pattern, replacement));
    }
    return output;
  }

  function stripArabicArticle(token) {
    const value = String(token || "");
    return value.length > 4 && value.startsWith("ال") ? value.slice(2) : value;
  }

  function tokenize(value, { keepStop = false } = {}) {
    return [...new Set(normalize(value)
      .split(/\s+/)
      .map(stripArabicArticle)
      .filter((token) => token.length > 1 && (keepStop || !STOP_WORDS.has(token))))];
  }

  function tokenSet(value) {
    return new Set(tokenize(value, { keepStop: true }));
  }

  function hasAllPhrase(haystack, phrase) {
    const hay = ` ${normalize(haystack)} `;
    const wanted = normalize(phrase);
    return Boolean(wanted && hay.includes(` ${wanted} `));
  }

  function prepareDocument(document) {
    const englishTitle = String(document.title || "");
    const arabicTitle = String(document.arabicTitle || "");
    const path = [
      document.rootTitle,
      document.category,
      document.section,
      ...(Array.isArray(document.pathParts) ? document.pathParts : [])
    ].filter(Boolean).join(" ");
    const englishText = String(document.englishText || "");
    const arabicText = String(document.arabicText || "");
    return {
      ...document,
      fields: {
        english: {
          title: normalize(englishTitle),
          titleTokens: tokenSet(englishTitle),
          path: normalize(path),
          pathTokens: tokenSet(path),
          body: normalize(englishText),
          bodyTokens: tokenSet(englishText),
          bodyLength: Math.max(1, tokenize(englishText, { keepStop: true }).length)
        },
        arabic: {
          title: normalize(arabicTitle || englishTitle),
          titleTokens: tokenSet(`${arabicTitle} ${englishTitle}`),
          path: normalize(path),
          pathTokens: tokenSet(path),
          body: normalize(arabicText),
          bodyTokens: tokenSet(arabicText),
          bodyLength: Math.max(1, tokenize(arabicText, { keepStop: true }).length)
        }
      }
    };
  }

  function buildIndex(documents) {
    const entries = (Array.isArray(documents) ? documents : [])
      .filter((document) => document?.id)
      .map(prepareDocument);
    const frequencies = { english: new Map(), arabic: new Map() };
    const averageBodyLength = { english: 1, arabic: 1 };

    for (const language of ["english", "arabic"]) {
      let totalLength = 0;
      for (const entry of entries) {
        const field = entry.fields[language];
        totalLength += field.bodyLength;
        const combined = new Set([
          ...field.titleTokens,
          ...field.pathTokens,
          ...field.bodyTokens
        ]);
        for (const token of combined) {
          frequencies[language].set(token, (frequencies[language].get(token) || 0) + 1);
        }
      }
      averageBodyLength[language] = entries.length ? totalLength / entries.length : 1;
    }
    return { version: VERSION, entries, frequencies, averageBodyLength };
  }

  function idf(index, language, token) {
    const total = Math.max(1, index.entries.length);
    const count = index.frequencies[language].get(token) || 0;
    return Math.log(1 + ((total - count + 0.5) / (count + 0.5)));
  }

  function scoreLanguage(index, entry, query, language) {
    const field = entry.fields[language];
    const terms = tokenize(query);
    if (!terms.length) return null;
    let score = 0;
    let matchedTerms = 0;
    let titleHits = 0;
    let pathHits = 0;
    let bodyHits = 0;

    if (field.title === query) score += 1200;
    else if (hasAllPhrase(field.title, query)) score += 460;
    if (hasAllPhrase(field.path, query)) score += 180;
    if (hasAllPhrase(field.body, query)) score += 120;

    for (const term of terms) {
      const weight = Math.min(7, Math.max(1, idf(index, language, term)));
      let matched = false;
      if (field.titleTokens.has(term)) {
        score += 42 * weight;
        titleHits += 1;
        matched = true;
      }
      if (field.pathTokens.has(term)) {
        score += 15 * weight;
        pathHits += 1;
        matched = true;
      }
      if (field.bodyTokens.has(term)) {
        const lengthNorm = 1.2 / (0.25 + 0.75 * (field.bodyLength / index.averageBodyLength[language]));
        score += 5.5 * weight * lengthNorm;
        bodyHits += 1;
        matched = true;
      }
      if (matched) matchedTerms += 1;
    }

    const coverage = matchedTerms / terms.length;
    const titleCoverage = titleHits / terms.length;
    const minimumHits = terms.length <= 2 ? terms.length : Math.ceil(terms.length * 0.6);
    if (matchedTerms < minimumHits) return null;
    if (!titleHits && !pathHits && coverage < 0.8) return null;
    if (!titleHits && !pathHits && terms.length === 1 && idf(index, language, terms[0]) < 1.25) return null;

    score += coverage * 150;
    score += titleCoverage * 130;
    if (titleHits === terms.length) score += 180;
    if (pathHits === terms.length) score += 70;
    if (!titleHits && !pathHits) score *= 0.62;

    return {
      score: Math.round(score * 10) / 10,
      hits: matchedTerms,
      coverage: Math.round(coverage * 100) / 100,
      titleHits,
      pathHits,
      bodyHits
    };
  }

  function rank(indexOrDocuments, queryValue, options = {}) {
    const index = Array.isArray(indexOrDocuments) ? buildIndex(indexOrDocuments) : indexOrDocuments;
    if (!index?.entries?.length) return [];
    const query = normalizeQuery(queryValue);
    const languages = options.language === "english" || options.language === "arabic"
      ? [options.language]
      : (/[\u0600-\u06FF]/.test(String(queryValue || "")) ? ["arabic", "english"] : ["english", "arabic"]);
    const routeBoosts = options.routeBoosts && typeof options.routeBoosts === "object" ? options.routeBoosts : {};
    const results = [];

    for (const entry of index.entries) {
      let best = null;
      const routeBoost = Number(routeBoosts[entry.id] || 0);
      for (const language of languages) {
        const scored = scoreLanguage(index, entry, query, language);
        if (!scored) continue;
        if (!best || scored.score > best.score) best = { ...scored, language };
      }
      if (!best && routeBoost > 0) {
        best = {
          score: 0,
          hits: tokenize(query).length,
          coverage: 1,
          titleHits: 0,
          pathHits: 0,
          bodyHits: 0,
          language: languages[0]
        };
      }
      if (!best) continue;
      results.push({
        ...entry,
        score: Math.round((best.score + routeBoost) * 10) / 10,
        hits: best.hits,
        coverage: best.coverage,
        titleHits: best.titleHits,
        pathHits: best.pathHits,
        bodyHits: best.bodyHits,
        matchedLanguage: best.language,
        routeBoost
      });
    }

    return results
      .sort((a, b) =>
        b.score - a.score
        || b.coverage - a.coverage
        || b.titleHits - a.titleHits
        || String(a.title || a.id).localeCompare(String(b.title || b.id))
      )
      .slice(0, Math.max(1, Math.min(100, Number(options.limit || 60))));
  }

  window.SUGO.KnowledgeSearch = Object.freeze({
    version: VERSION,
    normalize,
    normalizeQuery,
    tokenize,
    buildIndex,
    rank
  });
})();
