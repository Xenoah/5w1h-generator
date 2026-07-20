(function () {
  "use strict";

  const CATEGORIES = [
    { id: "who", en: "Who", label: "だれが", file: "./data/who.json", color: "#c3983e" },
    { id: "whom", en: "Whom", label: "だれに", file: "./data/whom.json", color: "#c26b54" },
    { id: "what", en: "What", label: "なにを・なにが", file: "./data/what.json", color: "#6872a1" },
    { id: "which", en: "Which", label: "どれを", file: "./data/which.json", color: "#8b6aa5" },
    { id: "when", en: "When", label: "いつ", file: "./data/when.json", color: "#d66a4c" },
    { id: "where", en: "Where", label: "どこで", file: "./data/where.json", color: "#317e78" },
    { id: "why", en: "Why", label: "なぜ", file: "./data/why.json", color: "#9b5d50" },
    { id: "how", en: "How", label: "どのように", file: "./data/how.json", color: "#9a648a" },
    { id: "how_many", en: "How many", label: "いくつ・何人", file: "./data/how_many.json", color: "#427a68" },
    { id: "how_much", en: "How much", label: "いくら・どの程度", file: "./data/how_much.json", color: "#9a7332" },
    { id: "how_long", en: "How long", label: "どのくらい", file: "./data/how_long.json", color: "#4e719b" },
    { id: "what_if", en: "What if", label: "もし〜なら", file: "./data/what_if.json", color: "#7a5c91" },
    { id: "so_what", en: "So what", label: "それで何が言える", file: "./data/so_what.json", color: "#4f7d5f" },
    { id: "now_what", en: "Now what", label: "次に何をする", file: "./data/now_what.json", color: "#995d67" },
  ];

  const BASE_5W1H = ["who", "what", "when", "where", "why", "how"];
  const FORMATS = [
    {
      id: "5w1h",
      name: "5W1H",
      description: "情報整理・報道・説明に使う基本形です。",
      categories: BASE_5W1H,
    },
    {
      id: "5w2h",
      name: "5W2H",
      description: "費用や程度を加え、業務計画・改善・品質管理を具体化します。",
      categories: [...BASE_5W1H, "how_much"],
    },
    {
      id: "5w3h",
      name: "5W3H",
      description: "数量と期間を加え、計画の規模や時間軸まで整理します。",
      categories: [...BASE_5W1H, "how_many", "how_long"],
    },
    {
      id: "6w1h-whom",
      name: "6W1H（Whom）",
      description: "対象となる相手を加え、顧客・支援先・関係者を明確にします。",
      categories: ["who", "whom", "what", "when", "where", "why", "how"],
    },
    {
      id: "6w1h-which",
      name: "6W1H（Which）",
      description: "選択肢を加え、候補や優先案を明確にします。",
      categories: ["who", "what", "which", "when", "where", "why", "how"],
    },
    {
      id: "6w2h-whom",
      name: "6W2H（Whom）",
      description: "相手と費用・程度を含め、詳細な企画や要件を整理します。",
      categories: ["who", "whom", "what", "when", "where", "why", "how", "how_much"],
    },
    {
      id: "6w2h-which",
      name: "6W2H（Which）",
      description: "選択肢と費用・程度を含め、比較可能な要件を整理します。",
      categories: ["who", "what", "which", "when", "where", "why", "how", "how_much"],
    },
    {
      id: "4w1h",
      name: "4W1H",
      description: "Whyを省き、速報や事実確認に必要な要素へ絞ります。",
      categories: ["who", "what", "when", "where", "how"],
    },
    {
      id: "5w1h-so-what",
      name: "5W1H ＋ So What",
      description: "基本情報から何が言えるかを加え、分析や考察につなげます。",
      categories: [...BASE_5W1H, "so_what"],
    },
    {
      id: "5w1h-now-what",
      name: "5W1H ＋ Now What",
      description: "次の行動を加え、意思決定や行動計画につなげます。",
      categories: [...BASE_5W1H, "now_what"],
    },
    {
      id: "5w1h-what-if",
      name: "5W1H ＋ What if",
      description: "仮定を加え、リスク分析や未来予測へ視点を広げます。",
      categories: [...BASE_5W1H, "what_if"],
    },
  ];

  const CATEGORY_BY_ID = new Map(CATEGORIES.map((category) => [category.id, category]));
  const FORMAT_BY_ID = new Map(FORMATS.map((format) => [format.id, format]));
  const RECENT_LIMIT = 24;

  const state = {
    words: new Map(),
    current: new Map(),
    recent: new Map(CATEGORIES.map(({ id }) => [id, []])),
    formatId: "5w1h",
    ready: false,
  };

  const elements = {
    generator: document.querySelector("#generator"),
    dataSummary: document.querySelector("#data-summary"),
    formatSelect: document.querySelector("#format-select"),
    formatTitle: document.querySelector("#format-title"),
    formatDescription: document.querySelector("#format-description"),
    wordGrid: document.querySelector("#word-grid"),
    errorPanel: document.querySelector("#error-panel"),
    errorMessage: document.querySelector("#error-message"),
    retryButton: document.querySelector("#retry-button"),
    rerollAllButton: document.querySelector("#reroll-all-button"),
    resultOutput: document.querySelector("#result-output"),
    copyButton: document.querySelector("#copy-button"),
    copyLabel: document.querySelector("#copy-label"),
    status: document.querySelector("#status"),
  };

  function activeFormat() {
    return FORMAT_BY_ID.get(state.formatId) || FORMATS[0];
  }

  function activeCategories() {
    return activeFormat().categories.map((id) => CATEGORY_BY_ID.get(id)).filter(Boolean);
  }

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
    if (words.length === 0) throw new Error(`${label}のことばが空です。`);
    return words;
  }

  async function fetchCategory(category) {
    const response = await fetch(category.file);
    if (!response.ok) throw new Error(`${category.file}（HTTP ${response.status}）`);

    try {
      return [category.id, cleanWords(await response.json(), category.label)];
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`${category.file} のJSON形式を確認してください。`);
      }
      throw error;
    }
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

    const blocked = new Set((state.recent.get(categoryId) || []).map(normalizeKey));
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

    const current = state.current.get(categoryId);
    return pool.find((word) => word !== current) || pool[0];
  }

  function remember(categoryId, word) {
    const recent = state.recent.get(categoryId) || [];
    recent.unshift(word);
    const poolSize = state.words.get(categoryId)?.length || 1;
    if (recent.length > Math.min(RECENT_LIMIT, Math.max(1, poolSize - 1))) recent.pop();
    state.recent.set(categoryId, recent);
  }

  function selectValue(categoryId) {
    const nextWord = pickWord(categoryId);
    state.current.set(categoryId, nextWord);
    remember(categoryId, nextWord);
    return nextWord;
  }

  function cleanFragment(value) {
    return String(value || "")
      .trim()
      .replace(/^[、，,。．.\s]+/u, "")
      .replace(/[、，,。．.\s]+$/u, "");
  }

  function makeResultParts() {
    if (!state.ready) return [{ type: "connector", text: "ことばを読み込んでいます。" }];

    const activeIds = new Set(activeCategories().map(({ id }) => id));
    const parts = [];
    const connector = (text) => parts.push({ type: "connector", text });
    const word = (id) => {
      if (activeIds.has(id)) parts.push({ type: "word", text: cleanFragment(state.current.get(id)) });
    };

    if (activeIds.has("what_if")) {
      word("what_if");
      connector("、");
    }
    if (activeIds.has("when")) {
      word("when");
      connector("に、");
    }
    if (activeIds.has("where")) {
      word("where");
      connector("で、");
    }
    if (activeIds.has("who")) {
      word("who");
      connector("が、");
    }
    if (activeIds.has("whom")) {
      word("whom");
      connector("に、");
    }
    if (activeIds.has("which")) {
      word("which");
      connector("を選び、");
    }
    if (activeIds.has("how_many")) {
      word("how_many");
      connector("の規模で、");
    }
    if (activeIds.has("how_much")) {
      word("how_much");
      connector("とし、");
    }
    if (activeIds.has("how_long")) {
      word("how_long");
      connector("かけて、");
    }
    if (activeIds.has("what")) {
      word("what");
      connector("を、");
    }
    if (activeIds.has("why")) {
      word("why");
      connector("という理由で、");
    }
    if (activeIds.has("how")) {
      word("how");
      connector("実行する");
    }
    if (activeIds.has("so_what")) {
      connector("。");
      word("so_what");
    }
    if (activeIds.has("now_what")) {
      connector("。そして、");
      word("now_what");
    }
    connector("。");
    return parts;
  }

  function makeResult() {
    return makeResultParts().map(({ text }) => text).join("");
  }

  function animateElement(element) {
    if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    element.animate(
      [
        { opacity: 0.15, transform: "translateY(5px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 340, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
  }

  function createCard(category, index) {
    const card = document.createElement("article");
    card.className = "word-card";
    card.dataset.card = category.id;
    card.style.setProperty("--card-color", category.color);

    const count = state.words.get(category.id)?.length || 0;
    const value = state.current.get(category.id) || "読み込み中…";
    card.innerHTML = `
      <div class="card-topline">
        <h3><span aria-hidden="true">${String(index + 1).padStart(2, "0")}</span> ${category.en} <small>${category.label}</small></h3>
        <span class="word-count" data-count="${category.id}">${count ? count.toLocaleString("ja-JP") : "—"} 語</span>
      </div>
      <p class="word-output${state.ready ? "" : " is-loading"}" data-output="${category.id}"></p>
      <button class="redraw-button" data-redraw="${category.id}" type="button"${state.ready ? "" : " disabled"}>
        <span class="redraw-icon" aria-hidden="true">↻</span>
        <span>「${category.label}」を引き直す</span>
      </button>
    `;
    card.querySelector(`[data-output="${category.id}"]`).textContent = value;
    return card;
  }

  function renderCards() {
    elements.wordGrid.replaceChildren(...activeCategories().map(createCard));
  }

  function renderCategory(categoryId, animate = true) {
    const output = elements.wordGrid.querySelector(`[data-output="${categoryId}"]`);
    if (!output) return;
    output.classList.remove("is-loading");
    output.textContent = state.current.get(categoryId) || "—";
    if (animate) animateElement(output);
  }

  function renderResult(animate = true) {
    const nodes = makeResultParts().map(({ type, text }) => {
      if (type === "word") {
        const strong = document.createElement("strong");
        strong.className = "result-word";
        strong.textContent = text;
        return strong;
      }
      return document.createTextNode(text);
    });
    elements.resultOutput.replaceChildren(...nodes);
    if (animate) animateElement(elements.resultOutput);
  }

  function renderFormatDetails() {
    const format = activeFormat();
    elements.formatTitle.textContent = format.name;
    elements.formatDescription.textContent = format.description;
  }

  function selectCategory(categoryId, announce = true) {
    const nextWord = selectValue(categoryId);
    renderCategory(categoryId);
    renderResult();

    if (announce) {
      const category = CATEGORY_BY_ID.get(categoryId);
      setStatus(`${category?.label || "ことば"}を「${nextWord}」に引き直しました。`);
    }
  }

  function selectAll(announce = true) {
    activeCategories().forEach(({ id }) => selectValue(id));
    activeCategories().forEach(({ id }) => renderCategory(id));
    renderResult();
    if (announce) setStatus(`${activeFormat().name}の${activeCategories().length}要素をすべて引き直しました。`);
  }

  function setControlsEnabled(enabled) {
    elements.wordGrid.querySelectorAll("[data-redraw]").forEach((button) => {
      button.disabled = !enabled;
    });
    elements.formatSelect.disabled = !enabled;
    elements.rerollAllButton.disabled = !enabled;
    elements.copyButton.disabled = !enabled;
  }

  function setStatus(message) {
    elements.status.textContent = "";
    requestAnimationFrame(() => {
      elements.status.textContent = message;
    });
  }

  function renderLoadedState() {
    const total = CATEGORIES.reduce((sum, { id }) => sum + (state.words.get(id)?.length || 0), 0);
    const counts = CATEGORIES.map(({ id }) => state.words.get(id)?.length || 0);
    const allSameCount = counts.every((count) => count === counts[0]);

    elements.dataSummary.textContent = allSameCount
      ? `${CATEGORIES.length}要素×各${counts[0].toLocaleString("ja-JP")}件・全${total.toLocaleString("ja-JP")}件`
      : `全${total.toLocaleString("ja-JP")}件から選出`;
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
    elements.resultOutput.textContent = "ことばの読み込み後に組み合わせが表示されます。";
    renderCards();
    setControlsEnabled(false);
    setStatus("ことばの読み込みに失敗しました。");
  }

  function changeFormat(formatId) {
    if (!FORMAT_BY_ID.has(formatId)) return;
    state.formatId = formatId;
    activeCategories().forEach(({ id }) => {
      if (!state.current.has(id)) selectValue(id);
    });
    renderFormatDetails();
    renderCards();
    renderResult(false);
    setControlsEnabled(state.ready);
    setStatus(`${activeFormat().name}へ切り替えました。`);
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
      activeCategories().forEach(({ id }) => selectValue(id));
      renderCards();
      renderResult(false);
      renderLoadedState();
      setStatus(`ことばの準備ができました。デフォルトの${activeFormat().name}を生成しました。`);
    } catch (error) {
      console.error("Thinking-frame data loading failed:", error);
      renderError(error);
    }
  }

  async function copyResult() {
    const result = makeResult();
    try {
      if (navigator.clipboard?.writeText && globalThis.isSecureContext) {
        await navigator.clipboard.writeText(result);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = result;
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
      setStatus("単語の組み合わせをクリップボードにコピーしました。");
      window.setTimeout(() => {
        elements.copyLabel.textContent = "組み合わせをコピー";
      }, 1800);
    } catch (error) {
      console.error("Copy failed:", error);
      setStatus("コピーできませんでした。組み合わせを選択してコピーしてください。");
    }
  }

  FORMATS.forEach((format) => {
    const option = document.createElement("option");
    option.value = format.id;
    option.textContent = format.name;
    option.selected = format.id === state.formatId;
    elements.formatSelect.append(option);
  });
  renderFormatDetails();
  renderCards();

  elements.formatSelect.addEventListener("change", (event) => changeFormat(event.target.value));
  elements.wordGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-redraw]");
    if (!button || !state.ready) return;
    selectCategory(button.dataset.redraw);
  });
  elements.rerollAllButton.addEventListener("click", () => {
    if (state.ready) selectAll();
  });
  elements.copyButton.addEventListener("click", copyResult);
  elements.retryButton.addEventListener("click", loadData);

  loadData();
})();
