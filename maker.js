(function () {
  "use strict";

  const MAKERS_FILE = "./data/makers.json";
  const GENRES_FILE = "./data/story-genres.json";
  const EXPECTED_ITEMS = 3000;
  const MAX_ELEMENT_LENGTH = 20;
  const RECENT_LIMIT = 24;
  const GENRE_TIERS = [
    { id: "general", label: "王道" },
    { id: "varied", label: "多彩" },
    { id: "niche", label: "少数派" },
  ];
  const CARD_COLORS = [
    "#c3983e", "#317e78", "#d66a4c", "#c26b54", "#8b6aa5", "#4e719b", "#427a68",
    "#995d67", "#9a7332", "#9a648a", "#7a5c91", "#6872a1", "#4f7d5f", "#9b5d50",
  ];

  const requestedMakerId = new URLSearchParams(globalThis.location.search).get("type") || "character";
  const state = {
    maker: null,
    categories: [],
    categoryById: new Map(),
    formatById: new Map(),
    formatId: "core",
    items: new Map(),
    genres: [],
    selectedGenres: new Set(),
    current: new Map(),
    recent: new Map(),
    ready: false,
  };

  const elements = {
    body: document.body,
    pageTitle: document.querySelector("#page-title"),
    eyebrow: document.querySelector("#maker-eyebrow"),
    lead: document.querySelector("#maker-lead"),
    generator: document.querySelector("#maker-generator"),
    generatorTitle: document.querySelector("#maker-generator-title"),
    dataSummary: document.querySelector("#maker-data-summary"),
    formatSelect: document.querySelector("#maker-format-select"),
    formatTitle: document.querySelector("#maker-format-title"),
    formatDescription: document.querySelector("#maker-format-description"),
    genreOptions: document.querySelector("#maker-genre-options"),
    genreCount: document.querySelector("#maker-genre-count"),
    genreSummary: document.querySelector("#maker-genre-summary"),
    genreClearButton: document.querySelector("#maker-genre-clear"),
    wordGrid: document.querySelector("#maker-grid"),
    errorPanel: document.querySelector("#maker-error-panel"),
    errorMessage: document.querySelector("#maker-error-message"),
    retryButton: document.querySelector("#maker-retry-button"),
    rerollAllButton: document.querySelector("#maker-reroll-all"),
    resultTitle: document.querySelector("#maker-result-title"),
    resultOutput: document.querySelector("#maker-result-output"),
    resultFormatLabel: document.querySelector("#maker-result-format"),
    copyButton: document.querySelector("#maker-copy-button"),
    copyLabel: document.querySelector("#maker-copy-label"),
    status: document.querySelector("#maker-status"),
    elementList: document.querySelector("#maker-element-list"),
    aboutTitle: document.querySelector("#maker-about-title"),
    aboutCopy: document.querySelector("#maker-about-copy"),
    footer: document.querySelector("#maker-footer"),
  };

  function normalizeKey(value) {
    return value.normalize("NFKC").replace(/\s+/gu, " ").trim().toLocaleLowerCase("ja");
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

  function cleanGenres(data) {
    if (!Array.isArray(data) || data.length === 0) throw new TypeError("ジャンルデータが空です。");
    const ids = new Set();
    return data.map((item) => {
      const id = String(item?.id || "").trim();
      const label = String(item?.label || "").trim();
      const tier = GENRE_TIERS.some(({ id: tierId }) => tierId === item?.tier) ? item.tier : "varied";
      if (!id || !label || ids.has(id)) throw new Error("ジャンルに空欄または重複があります。");
      ids.add(id);
      return { id, label, tier };
    });
  }

  function cleanItems(data, category, validGenres) {
    if (!Array.isArray(data)) throw new TypeError(`${category.label}のデータが配列ではありません。`);
    const unique = new Set();
    const items = data.map((item) => {
      const text = String(item?.text || "").replace(/\s+/gu, " ").trim();
      const genre = String(item?.genre || "").trim();
      const base = String(item?.base || text).replace(/\s+/gu, " ").trim();
      const key = normalizeKey(text);
      if (!text || !base || !validGenres.has(genre) || unique.has(key)) {
        throw new Error(`${category.label}に空欄・不明なジャンル・重複があります。`);
      }
      if ([...text].length > MAX_ELEMENT_LENGTH) throw new Error(`${category.label}に20文字を超える候補があります。`);
      unique.add(key);
      return { text, genre, base };
    });
    if (items.length !== EXPECTED_ITEMS) throw new Error(`${category.label}は3,000件必要です。`);
    return items;
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

  function activeFormat() {
    return state.formatById.get(state.formatId) || state.maker.formats[0];
  }

  function activeCategories() {
    return activeFormat().categories.map((id) => state.categoryById.get(id)).filter(Boolean);
  }

  function candidatePool(categoryId) {
    const all = state.items.get(categoryId) || [];
    return state.selectedGenres.size === 0 ? all : all.filter(({ genre }) => state.selectedGenres.has(genre));
  }

  function pickItem(categoryId) {
    const pool = candidatePool(categoryId);
    if (pool.length === 0) return { text: "候補なし", genre: "", base: "候補なし" };
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

  function configureMaker() {
    const maker = state.maker;
    document.title = `${maker.label} | IDEA MAKERS`;
    elements.body.style.setProperty("--maker-accent", maker.accent);
    elements.eyebrow.textContent = maker.en;
    elements.pageTitle.replaceChildren(
      document.createTextNode(`${maker.shortLabel}を`),
      document.createElement("br"),
      Object.assign(document.createElement("span"), { textContent: "組み立てよう。" }),
    );
    elements.lead.textContent = maker.description;
    elements.generatorTitle.textContent = `今回の${maker.shortLabel}`;
    elements.resultTitle.textContent = maker.resultMode === "titles" ? "できあがったタイトル候補" : `できあがった${maker.shortLabel}`;
    elements.copyLabel.textContent = maker.resultMode === "titles" ? "タイトル候補をコピー" : "組み合わせをコピー";
    elements.aboutTitle.textContent = `${maker.shortLabel}を、同じ密度で`;
    elements.aboutCopy.textContent = `14要素を各3,000件、合計42,000件収録。30ジャンルを複数選択してミックスできます。`;
    elements.footer.textContent = `${maker.en} · RANDOMNESS OPENS A DOOR`;

    elements.formatSelect.replaceChildren(...maker.formats.map((format) => {
      const option = document.createElement("option");
      option.value = format.id;
      option.textContent = `${format.name}（${format.categories.length}要素）`;
      option.selected = format.id === state.formatId;
      return option;
    }));

    elements.elementList.replaceChildren(...state.categories.map((category, index) => {
      const item = document.createElement("span");
      item.className = "maker-element-chip";
      item.innerHTML = `<small>${String(index + 1).padStart(2, "0")}</small><strong></strong><span></span>`;
      item.querySelector("strong").textContent = category.en;
      item.querySelector("span").textContent = category.label;
      return item;
    }));
  }

  function createCard(category, index) {
    const card = document.createElement("article");
    card.className = "word-card maker-card";
    card.dataset.card = category.id;
    card.style.setProperty("--card-color", category.color);
    const value = state.current.get(category.id)?.text || "読み込み中…";
    card.innerHTML = `
      <div class="card-topline"><h3><span aria-hidden="true">${String(index + 1).padStart(2, "0")}</span> ${category.en} <small>${category.label}</small></h3><span class="word-count">${state.ready ? "3,000" : "—"} 語</span></div>
      <p class="word-output${state.ready ? "" : " is-loading"}" data-maker-output="${category.id}"></p>
      <button class="redraw-button" data-maker-redraw="${category.id}" type="button"${state.ready ? "" : " disabled"}><span class="redraw-icon" aria-hidden="true">↻</span><span>「${category.label}」を引き直す</span></button>
    `;
    card.querySelector(`[data-maker-output="${category.id}"]`).textContent = value;
    return card;
  }

  function renderCards() {
    elements.wordGrid.replaceChildren(...activeCategories().map(createCard));
  }

  function renderCategory(categoryId, animate = true) {
    const output = elements.wordGrid.querySelector(`[data-maker-output="${categoryId}"]`);
    if (!output) return;
    output.classList.remove("is-loading");
    output.textContent = state.current.get(categoryId)?.text || "—";
    if (animate) animateElement(output);
  }

  function titleCandidates() {
    const activeIds = new Set(activeCategories().map(({ id }) => id));
    const base = (id, fallback) => state.current.get(activeIds.has(id) ? id : fallback)?.base || "";
    return [
      `${base("color", "subject")}の${base("subject", "person")}`,
      `${base("place", "subject")}の${base("person", "subject")}`,
      `${base("time", "place")}、${base("action", "weather")}`,
      `${base("object", "subject")}と${base("emotion", "weather")}`,
      `${base("symbol", "place")}の${base("ending_word", "subject")}`,
    ];
  }

  function resultParts() {
    if (!state.ready) return [{ type: "connector", text: "候補を読み込んでいます。" }];
    if (state.maker.resultMode === "titles") {
      return titleCandidates().flatMap((title, index) => [
        { type: "connector", text: `${index + 1}. ` },
        { type: "word", text: title },
        { type: "connector", text: "\n" },
      ]);
    }
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
    input.name = "maker-genre";
    input.value = genre.id;
    input.checked = state.selectedGenres.has(genre.id);
    input.disabled = !state.ready;
    const text = document.createElement("span");
    text.textContent = genre.label;
    label.append(input, text);
    return label;
  }

  function renderGenres() {
    elements.genreOptions.replaceChildren(...GENRE_TIERS.map((tier) => {
      const fieldset = document.createElement("fieldset");
      fieldset.className = `facet-tier facet-tier-${tier.id}`;
      const genres = state.genres.filter((genre) => genre.tier === tier.id);
      const legend = document.createElement("legend");
      legend.textContent = `${tier.label} ${genres.length}`;
      const chips = document.createElement("div");
      chips.className = "facet-chip-list";
      genres.forEach((genre) => chips.append(createGenreChip(genre)));
      fieldset.append(legend, chips);
      return fieldset;
    }));
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
    state.categories.forEach(({ id }) => selectValue(id));
    activeCategories().forEach(({ id }) => renderCategory(id));
    renderResult();
    if (announce) setStatus(`${activeFormat().name}の${activeCategories().length}要素を引き直しました。`);
  }

  function setControlsEnabled(enabled) {
    elements.wordGrid.querySelectorAll("[data-maker-redraw]").forEach((button) => { button.disabled = !enabled; });
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

  function changeFormat(formatId) {
    if (!state.formatById.has(formatId)) return;
    state.formatId = formatId;
    renderFormatDetails();
    renderCards();
    renderResult(false);
    setControlsEnabled(state.ready);
    setStatus(`${activeFormat().name}へ切り替えました。`);
  }

  function renderLoadedState() {
    elements.dataSummary.textContent = `14要素×各3,000件・全42,000件＋${state.genres.length}ジャンル`;
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
    setControlsEnabled(false);
    setStatus("候補の読み込みに失敗しました。");
  }

  async function loadData() {
    state.ready = false;
    elements.generator.setAttribute("aria-busy", "true");
    elements.errorPanel.hidden = true;
    setControlsEnabled(false);
    try {
      const [makers, genres] = await Promise.all([fetchJson(MAKERS_FILE), fetchJson(GENRES_FILE)]);
      if (!Array.isArray(makers) || makers.length === 0) throw new Error("メーカー設定が空です。");
      state.maker = makers.find(({ id }) => id === requestedMakerId) || makers[0];
      state.categories = state.maker.categories.map((category, index) => ({
        ...category,
        color: CARD_COLORS[index % CARD_COLORS.length],
        file: `./data/makers/${state.maker.id}/${category.id}.json`,
      }));
      state.categoryById = new Map(state.categories.map((category) => [category.id, category]));
      state.formatById = new Map(state.maker.formats.map((format) => [format.id, format]));
      state.formatId = "core";
      state.genres = cleanGenres(genres);
      state.selectedGenres.clear();
      state.current.clear();
      state.recent = new Map(state.categories.map(({ id }) => [id, []]));
      configureMaker();
      renderFormatDetails();
      renderGenres();
      renderCards();

      const validGenres = new Set(state.genres.map(({ id }) => id));
      const entries = await Promise.all(state.categories.map(async (category) => [
        category.id,
        cleanItems(await fetchJson(category.file), category, validGenres),
      ]));
      state.items = new Map(entries);
      state.ready = true;
      state.categories.forEach(({ id }) => selectValue(id));
      renderGenres();
      renderCards();
      renderResult(false);
      renderLoadedState();
      setStatus(`${state.maker.label}の準備ができました。`);
    } catch (error) {
      console.error("Creative maker loading failed:", error);
      renderError(error);
    }
  }

  async function copyResult() {
    const result = state.maker.resultMode === "titles"
      ? titleCandidates().map((title, index) => `${index + 1}. ${title}`).join("\n")
      : activeCategories().map((category) => `${category.label}：${state.current.get(category.id)?.text || "—"}`).join("\n");
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
      setStatus("組み合わせをコピーしました。");
      window.setTimeout(() => {
        elements.copyLabel.textContent = state.maker.resultMode === "titles" ? "タイトル候補をコピー" : "組み合わせをコピー";
      }, 1800);
    } catch (error) {
      console.error("Copy failed:", error);
      setStatus("コピーできませんでした。表示内容を選択してコピーしてください。");
    }
  }

  elements.formatSelect.addEventListener("change", (event) => changeFormat(event.target.value));
  elements.genreOptions.addEventListener("change", (event) => {
    const input = event.target.closest('input[name="maker-genre"]');
    if (!input || !state.ready) return;
    if (input.checked) state.selectedGenres.add(input.value);
    else state.selectedGenres.delete(input.value);
    state.recent = new Map(state.categories.map(({ id }) => [id, []]));
    renderGenreSummary();
    selectAll(false);
    setStatus("選択したジャンルを組み合わせへ反映しました。");
  });
  elements.genreClearButton.addEventListener("click", () => {
    if (!state.ready) return;
    state.selectedGenres.clear();
    state.recent = new Map(state.categories.map(({ id }) => [id, []]));
    renderGenres();
    selectAll(false);
    setStatus("ジャンル指定を解除しました。");
  });
  elements.wordGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-maker-redraw]");
    if (!button || !state.ready) return;
    const categoryId = button.dataset.makerRedraw;
    const item = selectValue(categoryId);
    renderCategory(categoryId);
    renderResult();
    setStatus(`${state.categoryById.get(categoryId)?.label || "要素"}を「${item.text}」に引き直しました。`);
  });
  elements.rerollAllButton.addEventListener("click", () => { if (state.ready) selectAll(); });
  elements.copyButton.addEventListener("click", copyResult);
  elements.retryButton.addEventListener("click", loadData);

  loadData();
})();
