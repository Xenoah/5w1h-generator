const state = {
  words: null,
  selections: {},
};

async function init() {
  const response = await fetch('./data/words.json');
  state.words = await response.json();
  bindEvents();
  renderAll();
}

function bindEvents() {
  document.getElementById('generate-all').addEventListener('click', renderAll);
  document.getElementById('copy-output').addEventListener('click', copyResult);

  document.querySelectorAll('.chip').forEach((button) => {
    button.addEventListener('click', () => {
      const role = button.dataset.role;
      renderSingle(role);
    });
  });
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getSelection(role) {
  if (!state.words) return '読み込み中…';
  if (!state.selections[role]) {
    state.selections[role] = pickRandom(state.words[role]);
  }
  return state.selections[role];
}

function renderSingle(role) {
  state.selections[role] = pickRandom(state.words[role]);
  document.getElementById(`${role}-value`).textContent = state.selections[role];
  renderSentence();
}

function renderAll() {
  Object.keys(state.words).forEach((role) => {
    state.selections[role] = pickRandom(state.words[role]);
    document.getElementById(`${role}-value`).textContent = state.selections[role];
  });
  renderSentence();
}

function renderSentence() {
  const sentence = `${getSelection('when')}、${getSelection('where')}で、${getSelection('who')}が${getSelection('what')}を${getSelection('how')}、${getSelection('action')}。`;
  document.getElementById('result-text').textContent = sentence;
}

async function copyResult() {
  const text = document.getElementById('result-text').textContent;
  if (!text || text === '読み込み中…') return;

  try {
    await navigator.clipboard.writeText(text);
    const button = document.getElementById('copy-output');
    const original = button.textContent;
    button.textContent = 'コピーしました';
    window.setTimeout(() => {
      button.textContent = original;
    }, 1200);
  } catch (error) {
    console.error('コピーに失敗しました', error);
  }
}

init().catch((error) => {
  console.error(error);
  document.getElementById('result-text').textContent = '語彙データの読み込みに失敗しました。';
});
