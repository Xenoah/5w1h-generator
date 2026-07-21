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
  const FACET_GROUPS = [
    { id: "genres", label: "ジャンル" },
    { id: "moods", label: "雰囲気" },
    { id: "purposes", label: "目的" },
  ];
  const FACET_TIERS = [
    { id: "general", label: "身近" },
    { id: "varied", label: "多彩" },
    { id: "niche", label: "少数派" },
  ];
  const FACET_DATA_FILE = "./data/facets.json";
  const FACET_MIX_LIMIT = 2;
  const MAX_ELEMENT_LENGTH = 20;
  const RECENT_LIMIT = 24;

  const state = {
    words: new Map(),
    currentBase: new Map(),
    current: new Map(),
    recent: new Map(CATEGORIES.map(({ id }) => [id, []])),
    facets: new Map(),
    selectedFacets: new Map(FACET_GROUPS.map(({ id }) => [id, new Set()])),
    currentFacets: new Map(FACET_GROUPS.map(({ id }) => [id, []])),
    formatId: "5w1h",
    ready: false,
  };

  const elements = {
    generator: document.querySelector("#generator"),
    dataSummary: document.querySelector("#data-summary"),
    formatSelect: document.querySelector("#format-select"),
    formatTitle: document.querySelector("#format-title"),
    formatDescription: document.querySelector("#format-description"),
    facetGroups: document.querySelector(".facet-groups"),
    facetSelectionSummary: document.querySelector("#facet-selection-summary"),
    facetCurrentMix: document.querySelector("#facet-current-mix"),
    facetClearButton: document.querySelector("#facet-clear-button"),
    wordGrid: document.querySelector("#word-grid"),
    errorPanel: document.querySelector("#error-panel"),
    errorMessage: document.querySelector("#error-message"),
    retryButton: document.querySelector("#retry-button"),
    rerollAllButton: document.querySelector("#reroll-all-button"),
    resultOutput: document.querySelector("#result-output"),
    resultFormatLabel: document.querySelector("#result-format-label"),
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
    if (words.some((word) => [...word].length > MAX_ELEMENT_LENGTH)) {
      throw new Error(`${label}に${MAX_ELEMENT_LENGTH}文字を超えることばがあります。`);
    }
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

  function cleanFacetData(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new TypeError("テーマデータがオブジェクトではありません。");
    }

    const cleaned = new Map();
    FACET_GROUPS.forEach(({ id, label }) => {
      const source = data[id];
      if (!Array.isArray(source) || source.length === 0) {
        throw new TypeError(`${label}の選択肢がありません。`);
      }

      const ids = new Set();
      const labels = new Set();
      const options = source.map((item) => {
        if (!item || typeof item !== "object") throw new TypeError(`${label}の項目形式が不正です。`);
        const facetId = String(item.id || "").trim();
        const facetLabel = String(item.label || "").replace(/\s+/gu, " ").trim();
        const phrase = String(item.phrase || facetLabel).replace(/\s+/gu, " ").trim();
        const tier = FACET_TIERS.some(({ id: tierId }) => tierId === item.tier) ? item.tier : "varied";
        const labelKey = normalizeKey(facetLabel);
        if (!facetId || !facetLabel || !phrase || ids.has(facetId) || labels.has(labelKey)) {
          throw new Error(`${label}に空欄または重複があります。`);
        }
        ids.add(facetId);
        labels.add(labelKey);
        return { id: facetId, label: facetLabel, phrase, tier, default: item.default === true };
      });
      cleaned.set(id, options);
    });
    return cleaned;
  }

  async function fetchFacets() {
    const response = await fetch(FACET_DATA_FILE);
    if (!response.ok) throw new Error(`${FACET_DATA_FILE}（HTTP ${response.status}）`);
    try {
      return cleanFacetData(await response.json());
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error(`${FACET_DATA_FILE} のJSON形式を確認してください。`);
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

  function sampleWithoutReplacement(values, limit) {
    const candidates = [...values];
    const selected = [];
    while (candidates.length > 0 && selected.length < limit) {
      selected.push(candidates.splice(randomInteger(candidates.length), 1)[0]);
    }
    return selected;
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
    const baseWord = pickWord(categoryId);
    const nextWord = applyFacetConditions(categoryId, baseWord);
    state.currentBase.set(categoryId, baseWord);
    state.current.set(categoryId, nextWord);
    remember(categoryId, baseWord);
    return nextWord;
  }

  function currentFacetOptions(groupId) {
    return state.currentFacets.get(groupId) || [];
  }

  function keepWithinElementLimit(candidate, fallback) {
    return [...candidate].length <= MAX_ELEMENT_LENGTH ? candidate : fallback;
  }

  function stableVariant(seed, options) {
    let hash = 2166136261;
    for (const character of seed) {
      hash ^= character.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return options[(hash >>> 0) % options.length];
  }

  function applyFacetConditions(categoryId, baseWord) {
    const value = cleanFragment(baseWord);
    const genres = currentFacetOptions("genres");
    const moods = currentFacetOptions("moods");
    const purposes = currentFacetOptions("purposes");
    const formatUsesWhy = activeCategories().some(({ id }) => id === "why");
    const primaryGenre = genres[0]?.label || "";
    const secondaryGenre = genres[1]?.label || primaryGenre;
    const primaryMood = moods[0]?.phrase || "";
    const primaryPurpose = purposes[0]?.label || "";

    if (categoryId === "what") {
      if (!formatUsesWhy && primaryPurpose) {
        const action = stableVariant(value, [
          "を試すこと", "を考えること", "を楽しむこと", "を探ること", "を記すこと",
          "を比べること", "を選ぶこと", "を学ぶこと", "を話すこと", "を描くこと",
        ]);
        const conditioned = `${primaryGenre ? `${primaryGenre}で` : ""}${primaryPurpose}${action}`;
        return keepWithinElementLimit(conditioned, value);
      }
      if (primaryGenre) {
        const topic = stableVariant(value, [
          "の話題", "の出来事", "の発見", "の工夫", "の場面",
          "の疑問", "の楽しみ", "の課題", "の選択", "の記録",
        ]);
        return keepWithinElementLimit(`${primaryGenre}${topic}`, value);
      }
      return value;
    }

    if (categoryId === "why" && primaryPurpose) {
      const reason = stableVariant(value, [
        "に役立つから", "につながるから", "に合うから", "を深めたいから", "に必要だから",
        "を試したいから", "を楽しめるから", "を広げられるから", "の一歩だから", "向きだから",
      ]);
      return keepWithinElementLimit(`${primaryPurpose}${reason}`, value);
    }

    if (categoryId === "how") {
      if (!secondaryGenre && !primaryMood) return value;
      const manner = stableVariant(value, [
        "調子で", "雰囲気で", "視点で", "気分で", "流れで",
        "姿勢で", "感覚で", "手順で", "考え方で", "工夫で",
      ]);
      const conditioned = `${secondaryGenre ? `${secondaryGenre}らしく` : ""}${primaryMood}${manner}`;
      return keepWithinElementLimit(conditioned, value);
    }

    return value;
  }

  function applyCurrentFacetConditions() {
    activeCategories().forEach(({ id }) => {
      const baseWord = state.currentBase.get(id);
      if (baseWord) state.current.set(id, applyFacetConditions(id, baseWord));
    });
  }

  function selectFacetMix() {
    FACET_GROUPS.forEach(({ id }) => {
      const selectedIds = state.selectedFacets.get(id) || new Set();
      const selectedOptions = (state.facets.get(id) || []).filter((option) => selectedIds.has(option.id));
      state.currentFacets.set(id, sampleWithoutReplacement(selectedOptions, FACET_MIX_LIMIT));
    });
    renderFacetSelectionSummary();
  }

  function resetFacetSelections() {
    state.selectedFacets = new Map(FACET_GROUPS.map(({ id }) => [
      id,
      new Set((state.facets.get(id) || []).filter((option) => option.default).map((option) => option.id)),
    ]));
    selectFacetMix();
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

  function createFacetChip(groupId, option) {
    const label = document.createElement("label");
    label.className = `facet-chip facet-chip-${option.tier}`;

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = `facet-${groupId}`;
    input.value = option.id;
    input.checked = state.selectedFacets.get(groupId)?.has(option.id) || false;
    input.disabled = !state.ready;

    const text = document.createElement("span");
    text.textContent = option.label;
    label.append(input, text);
    return label;
  }

  function renderFacetOptions() {
    FACET_GROUPS.forEach(({ id }) => {
      const container = document.querySelector(`[data-facet-options="${id}"]`);
      if (!container) return;
      const options = state.facets.get(id) || [];
      const tiers = FACET_TIERS.map((tier) => {
        const fieldset = document.createElement("fieldset");
        fieldset.className = `facet-tier facet-tier-${tier.id}`;
        const legend = document.createElement("legend");
        legend.textContent = `${tier.label} ${options.filter((option) => option.tier === tier.id).length}`;
        const chips = document.createElement("div");
        chips.className = "facet-chip-list";
        options.filter((option) => option.tier === tier.id).forEach((option) => {
          chips.append(createFacetChip(id, option));
        });
        fieldset.append(legend, chips);
        return fieldset;
      });
      container.replaceChildren(...tiers);
    });
    renderFacetSelectionSummary();
  }

  function renderFacetSelectionSummary() {
    const counts = FACET_GROUPS.map(({ id, label }) => {
      const count = state.selectedFacets.get(id)?.size || 0;
      const counter = document.querySelector(`[data-facet-count="${id}"]`);
      if (counter) counter.textContent = `${count}選択`;
      return { label, count };
    });
    const total = counts.reduce((sum, { count }) => sum + count, 0);
    elements.facetSelectionSummary.textContent = total > 0
      ? `選択中：${counts.map(({ label, count }) => `${label}${count}`).join("・")}（各項目から最大${FACET_MIX_LIMIT}つを採用）`
      : "テーマ指定なし：5W1Hのことばだけで生成します。";

    const currentMix = FACET_GROUPS.map(({ id, label }) => {
      const names = (state.currentFacets.get(id) || []).map((facet) => facet.label);
      return names.length > 0 ? `${label} ${names.join("＋")}` : "";
    }).filter(Boolean);
    elements.facetCurrentMix.textContent = currentMix.length > 0
      ? `今回の生成条件：${currentMix.join("、")}`
      : "今回の生成条件：指定なし";
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
    elements.resultFormatLabel.textContent = `${format.name}・${format.categories.length}要素`;
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
    selectFacetMix();
    activeCategories().forEach(({ id }) => selectValue(id));
    activeCategories().forEach(({ id }) => renderCategory(id));
    renderResult();
    if (announce) setStatus(`テーマのミックスと${activeFormat().name}の${activeCategories().length}要素を引き直しました。`);
  }

  function setControlsEnabled(enabled) {
    elements.wordGrid.querySelectorAll("[data-redraw]").forEach((button) => {
      button.disabled = !enabled;
    });
    elements.facetGroups.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.disabled = !enabled;
    });
    elements.facetClearButton.disabled = !enabled;
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
    const facetTotal = FACET_GROUPS.reduce((sum, { id }) => sum + (state.facets.get(id)?.length || 0), 0);
    const counts = CATEGORIES.map(({ id }) => state.words.get(id)?.length || 0);
    const allSameCount = counts.every((count) => count === counts[0]);

    elements.dataSummary.textContent = allSameCount
      ? `収録${CATEGORIES.length}分類×各${counts[0].toLocaleString("ja-JP")}件・各20字以内＋テーマ${facetTotal.toLocaleString("ja-JP")}件`
      : `各20字以内・全${total.toLocaleString("ja-JP")}件＋テーマ${facetTotal.toLocaleString("ja-JP")}件から選出`;
    elements.generator.setAttribute("aria-busy", "false");
    elements.errorPanel.hidden = true;
    setControlsEnabled(true);
  }

  function renderError(error) {
    state.ready = false;
    state.words.clear();
    state.currentBase.clear();
    state.current.clear();
    state.facets.clear();
    state.selectedFacets = new Map(FACET_GROUPS.map(({ id }) => [id, new Set()]));
    state.currentFacets = new Map(FACET_GROUPS.map(({ id }) => [id, []]));
    elements.generator.setAttribute("aria-busy", "false");
    elements.dataSummary.textContent = "データを読み込めませんでした";
    elements.errorMessage.textContent = error instanceof Error
      ? `読み込みエラー: ${error.message}`
      : "通信状態を確認して、もう一度お試しください。";
    elements.errorPanel.hidden = false;
    elements.resultOutput.textContent = "ことばの読み込み後に組み合わせが表示されます。";
    renderFacetOptions();
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
    applyCurrentFacetConditions();
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
      const [entries, facets] = await Promise.all([
        Promise.all(CATEGORIES.map(fetchCategory)),
        fetchFacets(),
      ]);
      state.words = new Map(entries);
      state.facets = facets;
      state.currentBase.clear();
      state.current.clear();
      state.recent = new Map(CATEGORIES.map(({ id }) => [id, []]));
      state.ready = true;
      resetFacetSelections();
      activeCategories().forEach(({ id }) => selectValue(id));
      renderFacetOptions();
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
  renderFacetOptions();
  renderCards();

  elements.formatSelect.addEventListener("change", (event) => changeFormat(event.target.value));
  elements.facetGroups.addEventListener("change", (event) => {
    const input = event.target.closest('input[type="checkbox"]');
    if (!input || !state.ready) return;
    const groupId = input.name.replace(/^facet-/, "");
    if (!state.selectedFacets.has(groupId)) return;
    const selected = state.selectedFacets.get(groupId);
    if (input.checked) selected.add(input.value);
    else selected.delete(input.value);
    selectFacetMix();
    applyCurrentFacetConditions();
    activeCategories().forEach(({ id }) => renderCategory(id, false));
    renderResult();
    const group = FACET_GROUPS.find(({ id }) => id === groupId);
    setStatus(`${group?.label || "テーマ"}の選択を組み合わせへ反映しました。`);
  });
  elements.facetClearButton.addEventListener("click", () => {
    if (!state.ready) return;
    FACET_GROUPS.forEach(({ id }) => state.selectedFacets.set(id, new Set()));
    selectFacetMix();
    applyCurrentFacetConditions();
    renderFacetOptions();
    activeCategories().forEach(({ id }) => renderCategory(id, false));
    renderResult();
    setStatus("ジャンル・雰囲気・目的の選択をクリアしました。");
  });
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
