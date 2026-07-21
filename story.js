(function () {
  "use strict";

  const STORY_CATEGORIES = [
    { id: "protagonist", en: "Protagonist", label: "主人公", file: "./data/story/protagonist.json", color: "#c3983e" },
    { id: "setting", en: "Setting", label: "舞台", file: "./data/story/setting.json", color: "#317e78" },
    { id: "era", en: "Era", label: "時代", file: "./data/story/era.json", color: "#d66a4c" },
    { id: "desire", en: "Desire", label: "願い", file: "./data/story/desire.json", color: "#c26b54" },
    { id: "lack", en: "Lack", label: "欠落", file: "./data/story/lack.json", color: "#8b6aa5" },
    { id: "inciting", en: "Inciting", label: "きっかけ", file: "./data/story/inciting.json", color: "#4e719b" },
    { id: "goal", en: "Goal", label: "目的", file: "./data/story/goal.json", color: "#427a68" },
    { id: "antagonist", en: "Opponent", label: "対立者", file: "./data/story/antagonist.json", color: "#995d67" },
    { id: "obstacle", en: "Obstacle", label: "障害", file: "./data/story/obstacle.json", color: "#9a7332" },
    { id: "relationship", en: "Relation", label: "関係", file: "./data/story/relationship.json", color: "#9a648a" },
    { id: "secret", en: "Secret", label: "秘密", file: "./data/story/secret.json", color: "#7a5c91" },
    { id: "motif", en: "Motif", label: "モチーフ", file: "./data/story/motif.json", color: "#6872a1" },
    { id: "theme", en: "Theme", label: "主題", file: "./data/story/theme.json", color: "#4f7d5f" },
    { id: "ending", en: "Ending", label: "結末", file: "./data/story/ending.json", color: "#9b5d50" },
  ];

  const CORE = ["protagonist", "setting", "desire", "obstacle", "theme", "ending"];
  const STORY_FORMATS = [
    {
      id: "core",
      name: "基本テーマ",
      description: "主人公・舞台・願い・障害・主題・結末の6要素で、物語の芯を決めます。",
      categories: CORE,
    },
    {
      id: "character",
      name: "人物中心",
      description: "欠落・対立者・関係・秘密を加え、人物の感情と変化を組み立てます。",
      categories: ["protagonist", "desire", "lack", "antagonist", "relationship", "secret", "theme", "ending"],
    },
    {
      id: "plot",
      name: "展開中心",
      description: "時代・きっかけ・目的・対立を加え、物語の流れを具体化します。",
      categories: ["protagonist", "setting", "era", "inciting", "goal", "antagonist", "obstacle", "secret", "theme", "ending"],
    },
    {
      id: "full",
      name: "フル構想",
      description: "収録した14要素をすべて使い、物語のテーマと骨格を一度に作ります。",
      categories: STORY_CATEGORIES.map(({ id }) => id),
    },
  ];

  const GENRE_TIERS = [
    { id: "general", label: "王道" },
    { id: "varied", label: "多彩" },
    { id: "niche", label: "少数派" },
  ];
  const CATEGORY_BY_ID = new Map(STORY_CATEGORIES.map((category) => [category.id, category]));
  const FORMAT_BY_ID = new Map(STORY_FORMATS.map((format) => [format.id, format]));
  const GENRE_FILE = "./data/story-genres.json";
  const EXPECTED_ITEMS = 3000;
  const MAX_ELEMENT_LENGTH = 20;
  const RECENT_LIMIT = 24;

  const state = {
    items: new Map(),
    genres: [],
    selectedGenres: new Set(),
    current: new Map(),
    recent: new Map(STORY_CATEGORIES.map(({ id }) => [id, []])),
    formatId: "core",
    ready: false,
  };

  const elements = {
    generator: document.querySelector("#story-generator"),
    dataSummary: document.querySelector("#story-data-summary"),
    formatSelect: document.querySelector("#story-format-select"),
    formatTitle: document.querySelector("#story-format-title"),
    formatDescription: document.querySelector("#story-format-description"),
    genreOptions: document.querySelector("#story-genre-options"),
    genreCount: document.querySelector("#story-genre-count"),
    genreSummary: document.querySelector("#story-genre-summary"),
    genreClearButton: document.querySelector("#story-genre-clear"),
    wordGrid: document.querySelector("#story-grid"),
    errorPanel: document.querySelector("#story-error-panel"),
    errorMessage: document.querySelector("#story-error-message"),
    retryButton: document.querySelector("#story-retry-button"),
    rerollAllButton: document.querySelector("#story-reroll-all"),
    resultOutput: document.querySelector("#story-result-output"),
    resultFormatLabel: document.querySelector("#story-result-format"),
    copyButton: document.querySelector("#story-copy-button"),
    copyLabel: document.querySelector("#story-copy-label"),
    status: document.querySelector("#story-status"),
  };

  function activeFormat() {
    return FORMAT_BY_ID.get(state.formatId) || STORY_FORMATS[0];
  }

  function activeCategories() {
    return activeFormat().categories.map((id) => CATEGORY_BY_ID.get(id)).filter(Boolean);
  }

  function normalizeKey(value) {
    return value.normalize("NFKC").replace(/\s+/gu, " ").trim().toLocaleLowerCase("ja");
  }

  function cleanGenres(data) {
    if (!Array.isArray(data) || data.length === 0) throw new TypeError("ジャンルデータが空です。");
    const ids = new Set();
    const labels = new Set();
    return data.map((item) => {
      const id = String(item?.id || "").trim();
      const label = String(item?.label || "").trim();
      const tier = GENRE_TIERS.some(({ id: tierId }) => tierId === item?.tier) ? item.tier : "varied";
      const labelKey = normalizeKey(label);
      if (!id || !label || ids.has(id) || labels.has(labelKey)) throw new Error("ジャンルに空欄または重複があります。");
      ids.add(id);
      labels.add(labelKey);
      return { id, label, tier };
    });
  }

  function cleanItems(data, category, validGenres) {
    if (!Array.isArray(data)) throw new TypeError(`${category.label}のデータが配列ではありません。`);
    const unique = new Set();
    const items = data.map((item) => {
      const text = String(item?.text || "").replace(/\s+/gu, " ").trim();
      const genre = String(item?.genre || "").trim();
      const key = normalizeKey(text);
      if (!text || !validGenres.has(genre) || unique.has(key)) {
        throw new Error(`${category.label}に空欄・不明なジャンル・重複があります。`);
      }
      if ([...text].length > MAX_ELEMENT_LENGTH) {
        throw new Error(`${category.label}に${MAX_ELEMENT_LENGTH}文字を超える候補があります。`);
      }
      unique.add(key);
      return { text, genre };
    });
    if (items.length !== EXPECTED_ITEMS) {
      throw new Error(`${category.label}は${EXPECTED_ITEMS.toLocaleString("ja-JP")}件必要です。`);
    }
    return items;
  }

  async function fetchJson(file) {
    const response = await fetch(file);
    if (!response.ok) throw new Error(`${file}（HTTP ${response.status}）`);
    try {
      return await response.json();
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error(`${file} のJSON形式を確認してください。`);
      throw error;
    }
  }

  function randomInteger(max) {
    if (!Number.isSafeInteger(max) || max <= 0) return 0;
    if (globalThis.crypto?.getRandomValues) {
      const range = 0x100000000;
      const limit = range - (range % max);
      const random = new Uint32Array(1);
      do globalThis.crypto.getRandomValues(random); while (random[0] >= limit);
      return random[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function candidatePool(categoryId) {
    const all = state.items.get(categoryId) || [];
    if (state.selectedGenres.size === 0) return all;
    return all.filter(({ genre }) => state.selectedGenres.has(genre));
  }

  function pickItem(categoryId) {
    const pool = candidatePool(categoryId);
    if (pool.length === 0) return { text: "候補なし", genre: "" };
    const blocked = new Set((state.recent.get(categoryId) || []).map(normalizeKey));
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const candidate = pool[randomInteger(pool.length)];
      if (!blocked.has(normalizeKey(candidate.text))) return candidate;
    }
    const start = randomInteger(pool.length);
    for (let offset = 0; offset < pool.length; offset += 1) {
      const candidate = pool[(start + offset) % pool.length];
      if (!blocked.has(normalizeKey(candidate.text))) return candidate;
    }
    return pool[0];
  }

  function selectValue(categoryId) {
    const item = pickItem(categoryId);
    state.current.set(categoryId, item);
    const recent = state.recent.get(categoryId) || [];
    recent.unshift(item.text);
    if (recent.length > RECENT_LIMIT) recent.pop();
    state.recent.set(categoryId, recent);
    return item;
  }

  function animateElement(element) {
    if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    element.animate(
      [{ opacity: 0.15, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 300, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
  }

  function createCard(category, index) {
    const card = document.createElement("article");
    card.className = "word-card story-card";
    card.dataset.card = category.id;
    card.style.setProperty("--card-color", category.color);
    const value = state.current.get(category.id)?.text || "読み込み中…";
    card.innerHTML = `
      <div class="card-topline">
        <h3><span aria-hidden="true">${String(index + 1).padStart(2, "0")}</span> ${category.en} <small>${category.label}</small></h3>
        <span class="word-count">${state.ready ? EXPECTED_ITEMS.toLocaleString("ja-JP") : "—"} 語</span>
      </div>
      <p class="word-output${state.ready ? "" : " is-loading"}" data-story-output="${category.id}"></p>
      <button class="redraw-button" data-story-redraw="${category.id}" type="button"${state.ready ? "" : " disabled"}>
        <span class="redraw-icon" aria-hidden="true">↻</span>
        <span>「${category.label}」を引き直す</span>
      </button>
    `;
    card.querySelector(`[data-story-output="${category.id}"]`).textContent = value;
    return card;
  }

  function renderCards() {
    elements.wordGrid.replaceChildren(...activeCategories().map(createCard));
  }

  function renderCategory(categoryId, animate = true) {
    const output = elements.wordGrid.querySelector(`[data-story-output="${categoryId}"]`);
    if (!output) return;
    output.classList.remove("is-loading");
    output.textContent = state.current.get(categoryId)?.text || "—";
    if (animate) animateElement(output);
  }

  function resultParts() {
    if (!state.ready) return [{ type: "connector", text: "テーマ候補を読み込んでいます。" }];
    const parts = [];
    activeCategories().forEach((category, index) => {
      parts.push({ type: "connector", text: `${category.label}は` });
      parts.push({ type: "word", text: state.current.get(category.id)?.text || "—" });
      parts.push({ type: "connector", text: index % 2 === 1 || index === activeCategories().length - 1 ? "。\n" : "、" });
    });
    return parts;
  }

  function renderResult(animate = true) {
    const nodes = resultParts().map(({ type, text }) => {
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
    elements.resultFormatLabel.textContent = `${format.name}・${format.categories.length}要素`;
  }

  function createGenreChip(genre) {
    const label = document.createElement("label");
    label.className = `facet-chip facet-chip-${genre.tier}`;
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "story-genre";
    input.value = genre.id;
    input.checked = state.selectedGenres.has(genre.id);
    input.disabled = !state.ready;
    const text = document.createElement("span");
    text.textContent = genre.label;
    label.append(input, text);
    return label;
  }

  function renderGenres() {
    const groups = GENRE_TIERS.map((tier) => {
      const fieldset = document.createElement("fieldset");
      fieldset.className = `facet-tier facet-tier-${tier.id}`;
      const tierGenres = state.genres.filter((genre) => genre.tier === tier.id);
      const legend = document.createElement("legend");
      legend.textContent = `${tier.label} ${tierGenres.length}`;
      const chips = document.createElement("div");
      chips.className = "facet-chip-list";
      tierGenres.forEach((genre) => chips.append(createGenreChip(genre)));
      fieldset.append(legend, chips);
      return fieldset;
    });
    elements.genreOptions.replaceChildren(...groups);
    renderGenreSummary();
  }

  function renderGenreSummary() {
    const selected = state.genres.filter(({ id }) => state.selectedGenres.has(id));
    elements.genreCount.textContent = `${selected.length}選択`;
    elements.genreSummary.textContent = selected.length > 0
      ? `選択中：${selected.map(({ label }) => label).join("＋")}（選択内でミックス）`
      : `指定なし：全${state.genres.length || 30}ジャンルから自由にミックスします。`;
    elements.genreClearButton.disabled = !state.ready || selected.length === 0;
  }

  function selectAll(announce = true) {
    activeCategories().forEach(({ id }) => selectValue(id));
    activeCategories().forEach(({ id }) => renderCategory(id));
    renderResult();
    if (announce) setStatus(`${activeFormat().name}の${activeCategories().length}要素を引き直しました。`);
  }

  function setControlsEnabled(enabled) {
    elements.wordGrid.querySelectorAll("[data-story-redraw]").forEach((button) => { button.disabled = !enabled; });
    elements.genreOptions.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.disabled = !enabled; });
    elements.formatSelect.disabled = !enabled;
    elements.rerollAllButton.disabled = !enabled;
    elements.copyButton.disabled = !enabled;
    elements.genreClearButton.disabled = !enabled || state.selectedGenres.size === 0;
  }

  function setStatus(message) {
    elements.status.textContent = "";
    requestAnimationFrame(() => { elements.status.textContent = message; });
  }

  function renderLoadedState() {
    const total = STORY_CATEGORIES.length * EXPECTED_ITEMS;
    elements.dataSummary.textContent = `${STORY_CATEGORIES.length}要素×各${EXPECTED_ITEMS.toLocaleString("ja-JP")}件・全${total.toLocaleString("ja-JP")}件＋${state.genres.length}ジャンル`;
    elements.generator.setAttribute("aria-busy", "false");
    elements.errorPanel.hidden = true;
    setControlsEnabled(true);
  }

  function renderError(error) {
    state.ready = false;
    elements.generator.setAttribute("aria-busy", "false");
    elements.dataSummary.textContent = "データを読み込めませんでした";
    elements.errorMessage.textContent = error instanceof Error ? `読み込みエラー: ${error.message}` : "通信状態を確認してください。";
    elements.errorPanel.hidden = false;
    renderCards();
    setControlsEnabled(false);
    setStatus("物語テーマの読み込みに失敗しました。");
  }

  function changeFormat(formatId) {
    if (!FORMAT_BY_ID.has(formatId)) return;
    state.formatId = formatId;
    activeCategories().forEach(({ id }) => {
      const current = state.current.get(id);
      if (!current || (state.selectedGenres.size > 0 && !state.selectedGenres.has(current.genre))) selectValue(id);
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
    elements.dataSummary.textContent = "テーマ候補を準備しています…";
    setControlsEnabled(false);
    try {
      state.genres = cleanGenres(await fetchJson(GENRE_FILE));
      const validGenres = new Set(state.genres.map(({ id }) => id));
      const entries = await Promise.all(STORY_CATEGORIES.map(async (category) => [
        category.id,
        cleanItems(await fetchJson(category.file), category, validGenres),
      ]));
      state.items = new Map(entries);
      state.selectedGenres.clear();
      state.current.clear();
      state.recent = new Map(STORY_CATEGORIES.map(({ id }) => [id, []]));
      state.ready = true;
      activeCategories().forEach(({ id }) => selectValue(id));
      renderGenres();
      renderCards();
      renderResult(false);
      renderLoadedState();
      setStatus("物語テーマの準備ができました。基本テーマを生成しました。");
    } catch (error) {
      console.error("Story-theme data loading failed:", error);
      renderError(error);
    }
  }

  async function copyResult() {
    const result = activeCategories().map((category) => `${category.label}：${state.current.get(category.id)?.text || "—"}`).join("\n");
    try {
      if (navigator.clipboard?.writeText && globalThis.isSecureContext) await navigator.clipboard.writeText(result);
      else {
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
      setStatus("物語テーマの組み合わせをコピーしました。");
      window.setTimeout(() => { elements.copyLabel.textContent = "テーマメモをコピー"; }, 1800);
    } catch (error) {
      console.error("Copy failed:", error);
      setStatus("コピーできませんでした。テーマメモを選択してコピーしてください。");
    }
  }

  STORY_FORMATS.forEach((format) => {
    const option = document.createElement("option");
    option.value = format.id;
    option.textContent = `${format.name}（${format.categories.length}要素）`;
    option.selected = format.id === state.formatId;
    elements.formatSelect.append(option);
  });
  renderFormatDetails();
  renderGenres();
  renderCards();

  elements.formatSelect.addEventListener("change", (event) => changeFormat(event.target.value));
  elements.genreOptions.addEventListener("change", (event) => {
    const input = event.target.closest('input[name="story-genre"]');
    if (!input || !state.ready) return;
    if (input.checked) state.selectedGenres.add(input.value);
    else state.selectedGenres.delete(input.value);
    state.recent = new Map(STORY_CATEGORIES.map(({ id }) => [id, []]));
    renderGenreSummary();
    selectAll(false);
    setStatus("選択したジャンルをテーマ候補へ反映しました。");
  });
  elements.genreClearButton.addEventListener("click", () => {
    if (!state.ready) return;
    state.selectedGenres.clear();
    state.recent = new Map(STORY_CATEGORIES.map(({ id }) => [id, []]));
    renderGenres();
    selectAll(false);
    setStatus("ジャンル指定を解除しました。全ジャンルから生成します。");
  });
  elements.wordGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-story-redraw]");
    if (!button || !state.ready) return;
    const categoryId = button.dataset.storyRedraw;
    const item = selectValue(categoryId);
    renderCategory(categoryId);
    renderResult();
    setStatus(`${CATEGORY_BY_ID.get(categoryId)?.label || "要素"}を「${item.text}」に引き直しました。`);
  });
  elements.rerollAllButton.addEventListener("click", () => { if (state.ready) selectAll(); });
  elements.copyButton.addEventListener("click", copyResult);
  elements.retryButton.addEventListener("click", loadData);

  loadData();
})();
