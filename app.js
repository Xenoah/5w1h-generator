(function () {
  "use strict";

  const CATEGORIES = [
    { id: "when", label: "いつ", file: "./data/when.json" },
    { id: "where", label: "どこで", file: "./data/where.json" },
    { id: "who", label: "だれが", file: "./data/who.json" },
    { id: "what", label: "なにを", file: "./data/what.json" },
    { id: "how", label: "どのように", file: "./data/how.json" },
    { id: "action", label: "どうしたか", file: "./data/action.json" },
  ];

  const RECENT_LIMIT = 24;
  const state = {
    words: new Map(),
    current: new Map(),
    recent: new Map(CATEGORIES.map(({ id }) => [id, []])),
    ready: false,
  };

  const elements = {
    generator: document.querySelector("#generator"),
    dataSummary: document.querySelector("#data-summary"),
    wordGrid: document.querySelector("#word-grid"),
    errorPanel: document.querySelector("#error-panel"),
    errorMessage: document.querySelector("#error-message"),
    retryButton: document.querySelector("#retry-button"),
    rerollAllButton: document.querySelector("#reroll-all-button"),
    sentenceOutput: document.querySelector("#sentence-output"),
    copyButton: document.querySelector("#copy-button"),
    copyLabel: document.querySelector("#copy-label"),
    status: document.querySelector("#status"),
  };

  function normalizeKey(value) {
    return value.normalize("NFKC").replace(/\s+/gu, " ").trim().toLocaleLowerCase("ja");
  }

  function cleanWords(data, label) {
    if (!Array.isArray(data)) {
      throw new TypeError(`${label}のデータが配列ではありません。`);
    }

    const unique = new Map();
    data.forEach((item) => {
      if (typeof item !== "string") return;
      const word = item.replace(/\s+/gu, " ").trim();
      const key = normalizeKey(word);
      if (word && !unique.has(key)) unique.set(key, word);
    });

    const words = Array.from(unique.values());
    if (words.length === 0) {
      throw new Error(`${label}のことばが空です。`);
    }
    return words;
  }

  async function fetchCategory(category) {
    const response = await fetch(category.file);
    if (!response.ok) {
      throw new Error(`${category.file}（HTTP ${response.status}）`);
    }

    let data;
    try {
      data = await response.json();
    } catch (_error) {
      throw new Error(`${category.file} のJSON形式を確認してください。`);
    }
    return [category.id, cleanWords(data, category.label)];
  }

  function randomInteger(max) {
    if (!Number.isSafeInteger(max) || max <= 0) return 0;

    if (globalThis.crypto?.getRandomValues) {
      const range = 0x100000000;
      const limit = range - (range % max);
      const random = new Uint32Array(1);
      do {
        globalThis.crypto.getRandomValues(random);
      } while (random[0] >= limit);
      return random[0] % max;
    }

    return Math.floor(Math.random() * max);
  }

  function pickWord(categoryId) {
    const pool = state.words.get(categoryId) || [];
    if (pool.length === 0) return "";

    const blocked = new Set(
      (state.recent.get(categoryId) || []).map(normalizeKey)
    );
    state.current.forEach((word, currentId) => {
      if (currentId !== categoryId) blocked.add(normalizeKey(word));
    });

    for (let attempt = 0; attempt < 80; attempt += 1) {
      const candidate = pool[randomInteger(pool.length)];
      if (!blocked.has(normalizeKey(candidate))) return candidate;
    }

    const start = randomInteger(pool.length);
    for (let offset = 0; offset < pool.length; offset += 1) {
      const candidate = pool[(start + offset) % pool.length];
      if (!blocked.has(normalizeKey(candidate))) return candidate;
    }

    // 極端に小さいデータでも操作不能にしないため、最後は直前以外を優先する。
    const current = state.current.get(categoryId);
    return pool.find((word) => word !== current) || pool[0];
  }

  function remember(categoryId, word) {
    const recent = state.recent.get(categoryId) || [];
    recent.unshift(word);
    if (recent.length > Math.min(RECENT_LIMIT, Math.max(1, (state.words.get(categoryId)?.length || 1) - 1))) {
      recent.pop();
    }
    state.recent.set(categoryId, recent);
  }

  function cleanFragment(value) {
    return String(value || "")
      .trim()
      .replace(/^[、，,。．.\s]+/u, "")
      .replace(/[、，,。．.\s]+$/u, "");
  }

  function combineHowAndAction(how, action) {
    const adverb = cleanFragment(how);
    const verb = cleanFragment(action);
    const needsSpace = /[A-Za-z0-9]$/u.test(adverb) && /^[A-Za-z0-9]/u.test(verb);
    return `${adverb}${needsSpace ? " " : ""}${verb}`;
  }

  function makeSentence() {
    if (!state.ready) return "ことばを読み込んでいます。";

    const when = cleanFragment(state.current.get("when"));
    const where = cleanFragment(state.current.get("where"));
    const who = cleanFragment(state.current.get("who"));
    const what = cleanFragment(state.current.get("what"));
    const howAction = combineHowAndAction(
      state.current.get("how"),
      state.current.get("action")
    );

    return `${when}、${where}で、${who}が${what}を${howAction}。`;
  }

  function animateElement(element) {
    if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    element.animate(
      [
        { opacity: 0.15, transform: "translateY(5px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 340, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
  }

  function renderCategory(categoryId, animate = true) {
    const output = document.querySelector(`[data-output="${categoryId}"]`);
    if (!output) return;
    output.classList.remove("is-loading");
    output.textContent = state.current.get(categoryId) || "—";
    if (animate) animateElement(output);
  }

  function renderSentence(animate = true) {
    elements.sentenceOutput.textContent = makeSentence();
    if (animate) animateElement(elements.sentenceOutput);
  }

  function selectCategory(categoryId, announce = true) {
    const nextWord = pickWord(categoryId);
    state.current.set(categoryId, nextWord);
    remember(categoryId, nextWord);
    renderCategory(categoryId);
    renderSentence();

    if (announce) {
      const category = CATEGORIES.find(({ id }) => id === categoryId);
      setStatus(`${category?.label || "ことば"}を「${nextWord}」に引き直しました。`);
    }
  }

  function selectAll(announce = true) {
    CATEGORIES.forEach(({ id }) => {
      const nextWord = pickWord(id);
      state.current.set(id, nextWord);
      remember(id, nextWord);
      renderCategory(id);
    });
    renderSentence();
    if (announce) setStatus("6つのことばをすべて引き直しました。");
  }

  function setControlsEnabled(enabled) {
    document.querySelectorAll("[data-redraw]").forEach((button) => {
      button.disabled = !enabled;
    });
    elements.rerollAllButton.disabled = !enabled;
    elements.copyButton.disabled = !enabled;
  }

  function setStatus(message) {
    elements.status.textContent = "";
    // 同じ案内が連続してもスクリーンリーダーへ通知されるよう、次の描画で設定する。
    requestAnimationFrame(() => {
      elements.status.textContent = message;
    });
  }

  function renderLoadedState() {
    const total = CATEGORIES.reduce(
      (sum, { id }) => sum + (state.words.get(id)?.length || 0),
      0
    );
    const counts = CATEGORIES.map(({ id }) => state.words.get(id)?.length || 0);
    const allSameCount = counts.every((count) => count === counts[0]);

    CATEGORIES.forEach(({ id }) => {
      const count = state.words.get(id)?.length || 0;
      const countElement = document.querySelector(`[data-count="${id}"]`);
      if (countElement) countElement.textContent = `${count.toLocaleString("ja-JP")} 語`;
    });

    elements.dataSummary.textContent = allSameCount
      ? `各${counts[0].toLocaleString("ja-JP")}語・全${total.toLocaleString("ja-JP")}語から選出`
      : `全${total.toLocaleString("ja-JP")}語から選出`;
    elements.generator.setAttribute("aria-busy", "false");
    elements.errorPanel.hidden = true;
    setControlsEnabled(true);
  }

  function renderError(error) {
    state.ready = false;
    state.words.clear();
    state.current.clear();
    elements.generator.setAttribute("aria-busy", "false");
    elements.dataSummary.textContent = "データを読み込めませんでした";
    elements.errorMessage.textContent = error instanceof Error
      ? `読み込みエラー: ${error.message}`
      : "通信状態を確認して、もう一度お試しください。";
    elements.errorPanel.hidden = false;
    elements.sentenceOutput.textContent = "ことばの読み込み後に一文が表示されます。";
    setControlsEnabled(false);
    setStatus("ことばの読み込みに失敗しました。");
  }

  async function loadData() {
    state.ready = false;
    elements.generator.setAttribute("aria-busy", "true");
    elements.errorPanel.hidden = true;
    elements.dataSummary.textContent = "ことばを準備しています…";
    setControlsEnabled(false);

    try {
      const entries = await Promise.all(CATEGORIES.map(fetchCategory));
      state.words = new Map(entries);
      state.current.clear();
      state.recent = new Map(CATEGORIES.map(({ id }) => [id, []]));
      state.ready = true;
      renderLoadedState();
      selectAll(false);
      setStatus("ことばの準備ができました。最初の一文を生成しました。");
    } catch (error) {
      console.error("5W1H data loading failed:", error);
      renderError(error);
    }
  }

  async function copySentence() {
    const sentence = makeSentence();
    try {
      if (navigator.clipboard?.writeText && globalThis.isSecureContext) {
        await navigator.clipboard.writeText(sentence);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = sentence;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.append(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        if (!copied) throw new Error("copy command failed");
      }

      elements.copyLabel.textContent = "コピーしました";
      setStatus("できあがった一文をクリップボードにコピーしました。");
      window.setTimeout(() => {
        elements.copyLabel.textContent = "一文をコピー";
      }, 1800);
    } catch (error) {
      console.error("Copy failed:", error);
      setStatus("コピーできませんでした。一文を選択してコピーしてください。");
    }
  }

  elements.wordGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-redraw]");
    if (!button || !state.ready) return;
    selectCategory(button.dataset.redraw);
  });

  elements.rerollAllButton.addEventListener("click", () => {
    if (state.ready) selectAll();
  });
  elements.copyButton.addEventListener("click", copySentence);
  elements.retryButton.addEventListener("click", loadData);

  loadData();
})();
