import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const categories = [
  'who', 'whom', 'what', 'which', 'when', 'where', 'why', 'how',
  'how_many', 'how_much', 'how_long', 'what_if', 'so_what', 'now_what',
  'action',
];
const expectedCount = 3000;
const maxElementLength = 20;

const normalize = (value) => value
  .normalize('NFKC')
  .replace(/[\s\u3000、。・，．,.!！?？「」『』（）()［］\[\]]/g, '')
  .toLocaleLowerCase('ja');

const grams = (value, size = 3) => {
  const chars = [...normalize(value)];
  if (chars.length <= size) return new Set([chars.join('')]);
  return new Set(Array.from({ length: chars.length - size + 1 }, (_, index) => chars.slice(index, index + size).join('')));
};

function jaccard(left, right) {
  let intersection = 0;
  const smaller = left.size <= right.size ? left : right;
  const larger = smaller === left ? right : left;
  for (const item of smaller) if (larger.has(item)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
}

function similarityReport(values) {
  const signatures = values.map((value) => grams(value));
  const postings = new Map();
  signatures.forEach((signature, index) => {
    for (const gram of signature) {
      const list = postings.get(gram) ?? [];
      list.push(index);
      postings.set(gram, list);
    }
  });

  // Very common trigrams mostly represent Japanese grammar. Excluding them keeps
  // candidate generation bounded while retaining distinctive shared stems.
  const candidates = new Set();
  for (const indexes of postings.values()) {
    if (indexes.length < 2 || indexes.length > 80) continue;
    for (let a = 0; a < indexes.length - 1; a += 1) {
      for (let b = a + 1; b < indexes.length; b += 1) {
        candidates.add(`${indexes[a]}:${indexes[b]}`);
      }
    }
  }

  const similar = [];
  let highCount = 0;
  for (const key of candidates) {
    const [a, b] = key.split(':').map(Number);
    const score = jaccard(signatures[a], signatures[b]);
    if (score >= 0.8) highCount += 1;
    if (score >= 0.68) similar.push({ score, a: values[a], b: values[b] });
  }
  similar.sort((x, y) => y.score - x.score || x.a.localeCompare(y.a, 'ja'));
  return { candidatePairs: candidates.size, highCount, closest: similar.slice(0, 5) };
}

function concentrationReport(values) {
  const counts = new Map();
  for (const value of values) {
    const seen = grams(value, 4);
    for (const gram of seen) counts.set(gram, (counts.get(gram) ?? 0) + 1);
  }
  return [...counts]
    .filter(([, count]) => count >= 5)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja'))
    .slice(0, 8);
}

function deterministicSamples(values, count = 8) {
  const result = [];
  let state = 0x5f1a2026;
  for (let index = 0; index < count; index += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    result.push(values[state % values.length]);
  }
  return result;
}

let failed = false;

for (const category of categories) {
  const file = path.join(root, 'data', `${category}.json`);
  const values = JSON.parse(await readFile(file, 'utf8'));
  const errors = [];
  if (!Array.isArray(values)) errors.push('root is not an array');
  if (values.length !== expectedCount) errors.push(`count ${values.length} != ${expectedCount}`);
  const nonStrings = values.filter((value) => typeof value !== 'string').length;
  const empty = values.filter((value) => typeof value === 'string' && normalize(value).length === 0).length;
  const exactDuplicates = values.length - new Set(values).size;
  const normalizedDuplicates = values.length - new Set(values.map(normalize)).size;
  const overLength = values.filter((value) => typeof value === 'string' && [...value].length > maxElementLength).length;
  const longest = values.reduce((max, value) => typeof value === 'string' ? Math.max(max, [...value].length) : max, 0);
  if (nonStrings) errors.push(`${nonStrings} non-string values`);
  if (empty) errors.push(`${empty} empty values`);
  if (exactDuplicates) errors.push(`${exactDuplicates} exact duplicates`);
  if (normalizedDuplicates) errors.push(`${normalizedDuplicates} normalized duplicates`);
  if (overLength) errors.push(`${overLength} values exceed ${maxElementLength} characters`);
  if (category === 'where' && values.some((value) => /で$/.test(value))) errors.push('where value with trailing で');
  if (category === 'who' && values.some((value) => /が$/.test(value))) errors.push('who value with trailing が');
  if (category === 'whom' && values.some((value) => /に$/.test(value))) errors.push('whom value with trailing に');
  if (category === 'what' && values.some((value) => /を$/.test(value))) errors.push('what value with trailing を');
  if (category === 'why' && values.some((value) => !/から$/.test(value))) errors.push('why value not ending in から');
  if (category === 'what_if' && values.some((value) => !/^もし/.test(value))) errors.push('what-if value not starting with もし');
  if (category === 'so_what' && values.some((value) => !/と言える$/.test(value))) errors.push('so-what value not ending in と言える');
  if (category === 'now_what' && values.some((value) => !/[うくぐすつぬぶむる]$/.test(value))) errors.push('now-what value not ending in a dictionary-form action');
  if (category === 'action' && values.some((value) => !/[ただ]$/.test(value))) errors.push('action value not ending in Japanese past tense');

  const similarity = similarityReport(values);
  const concentrations = concentrationReport(values);
  console.log(`\n[${category}] count=${values.length}, maxLength=${longest}, exactDup=${exactDuplicates}, normalizedDup=${normalizedDuplicates}`);
  console.log(`similarity: candidates=${similarity.candidatePairs}, jaccard>=0.80=${similarity.highCount}`);
  if (similarity.closest.length) {
    for (const pair of similarity.closest) console.log(`  ${(pair.score).toFixed(3)}  ${pair.a}  <>  ${pair.b}`);
  }
  console.log(`top 4-char concentrations: ${concentrations.map(([gram, count]) => `${gram}:${count}`).join(', ')}`);
  console.log(`samples: ${deterministicSamples(values).join(' / ')}`);
  if (errors.length) {
    failed = true;
    console.error(`ERROR: ${errors.join('; ')}`);
  }
}

const facetExpectedCounts = { genres: 68, moods: 40, purposes: 40 };
const facetTiers = new Set(['general', 'varied', 'niche']);
const facetData = JSON.parse(await readFile(path.join(root, 'data', 'facets.json'), 'utf8'));

for (const [group, expected] of Object.entries(facetExpectedCounts)) {
  const values = facetData[group];
  const errors = [];
  if (!Array.isArray(values)) {
    errors.push('group is not an array');
  } else {
    if (values.length !== expected) errors.push(`count ${values.length} != ${expected}`);
    const ids = values.map((value) => String(value?.id ?? '').trim());
    const labels = values.map((value) => String(value?.label ?? '').trim());
    if (ids.some((value) => !value)) errors.push('empty id');
    if (labels.some((value) => !normalize(value))) errors.push('empty label');
    if (new Set(ids).size !== ids.length) errors.push('duplicate id');
    if (new Set(labels.map(normalize)).size !== labels.length) errors.push('normalized duplicate label');
    if (values.some((value) => !facetTiers.has(value?.tier))) errors.push('unknown tier');
    if (values.filter((value) => value?.default === true).length > 1) errors.push('default count must be 0 or 1');
    if (group === 'moods' && values.some((value) => !normalize(String(value?.phrase ?? '')))) errors.push('empty mood phrase');
  }

  console.log(`\n[facets:${group}] count=${Array.isArray(values) ? values.length : 0}`);
  if (errors.length) {
    failed = true;
    console.error(`ERROR: ${errors.join('; ')}`);
  }
}

const storyCategoryIds = [
  'protagonist', 'setting', 'era', 'desire', 'lack', 'inciting', 'goal',
  'antagonist', 'obstacle', 'relationship', 'secret', 'motif', 'theme', 'ending',
];
const storyGenreTiers = new Set(['general', 'varied', 'niche']);
const storyGenres = JSON.parse(await readFile(path.join(root, 'data', 'story-genres.json'), 'utf8'));
const storyGenreErrors = [];

if (!Array.isArray(storyGenres)) {
  storyGenreErrors.push('root is not an array');
} else {
  if (storyGenres.length !== 30) storyGenreErrors.push(`count ${storyGenres.length} != 30`);
  const ids = storyGenres.map((value) => String(value?.id ?? '').trim());
  const labels = storyGenres.map((value) => String(value?.label ?? '').trim());
  if (ids.some((value) => !value)) storyGenreErrors.push('empty id');
  if (labels.some((value) => !normalize(value))) storyGenreErrors.push('empty label');
  if (new Set(ids).size !== ids.length) storyGenreErrors.push('duplicate id');
  if (new Set(labels.map(normalize)).size !== labels.length) storyGenreErrors.push('normalized duplicate label');
  if (storyGenres.some((value) => !storyGenreTiers.has(value?.tier))) storyGenreErrors.push('unknown tier');
}

console.log(`\n[story:genres] count=${Array.isArray(storyGenres) ? storyGenres.length : 0}`);
if (storyGenreErrors.length) {
  failed = true;
  console.error(`ERROR: ${storyGenreErrors.join('; ')}`);
}

const storyGenreIds = new Set(Array.isArray(storyGenres) ? storyGenres.map(({ id }) => id) : []);
for (const category of storyCategoryIds) {
  const values = JSON.parse(await readFile(path.join(root, 'data', 'story', `${category}.json`), 'utf8'));
  const errors = [];
  if (!Array.isArray(values)) {
    errors.push('root is not an array');
  } else {
    if (values.length !== expectedCount) errors.push(`count ${values.length} != ${expectedCount}`);
    const texts = values.map((value) => typeof value?.text === 'string' ? value.text.trim() : '');
    const genres = values.map((value) => String(value?.genre ?? '').trim());
    const exactDuplicates = texts.length - new Set(texts).size;
    const normalizedDuplicates = texts.length - new Set(texts.map(normalize)).size;
    const longest = texts.reduce((max, value) => Math.max(max, [...value].length), 0);
    if (texts.some((value) => !normalize(value))) errors.push('empty text');
    if (genres.some((value) => !storyGenreIds.has(value))) errors.push('unknown genre');
    if (exactDuplicates) errors.push(`${exactDuplicates} exact duplicates`);
    if (normalizedDuplicates) errors.push(`${normalizedDuplicates} normalized duplicates`);
    if (texts.some((value) => [...value].length > maxElementLength)) errors.push(`value exceeds ${maxElementLength} characters`);
    for (const genreId of storyGenreIds) {
      const count = genres.filter((value) => value === genreId).length;
      if (count !== 100) errors.push(`${genreId} count ${count} != 100`);
    }
    const similarity = similarityReport(texts);
    if (similarity.highCount > 0) errors.push(`${similarity.highCount} highly similar candidate pairs`);
    console.log(`[story:${category}] count=${values.length}, maxLength=${longest}, exactDup=${exactDuplicates}, normalizedDup=${normalizedDuplicates}, jaccard>=0.80=${similarity.highCount}`);
    if (similarity.highCount > 0) {
      for (const pair of similarity.closest) console.log(`  ${(pair.score).toFixed(3)}  ${pair.a}  <>  ${pair.b}`);
    }
  }
  if (errors.length) {
    failed = true;
    console.error(`ERROR: ${errors.join('; ')}`);
  }
}

const creativeMakers = JSON.parse(await readFile(path.join(root, 'data', 'makers.json'), 'utf8'));
const creativeMakerErrors = [];
if (!Array.isArray(creativeMakers)) {
  creativeMakerErrors.push('root is not an array');
} else {
  if (creativeMakers.length !== 8) creativeMakerErrors.push(`count ${creativeMakers.length} != 8`);
  const makerIds = creativeMakers.map((maker) => String(maker?.id ?? '').trim());
  if (makerIds.some((id) => !id)) creativeMakerErrors.push('empty maker id');
  if (new Set(makerIds).size !== makerIds.length) creativeMakerErrors.push('duplicate maker id');
}
console.log(`\n[makers] count=${Array.isArray(creativeMakers) ? creativeMakers.length : 0}`);
if (creativeMakerErrors.length) {
  failed = true;
  console.error(`ERROR: ${creativeMakerErrors.join('; ')}`);
}

for (const maker of Array.isArray(creativeMakers) ? creativeMakers : []) {
  const makerErrors = [];
  const categoryIds = Array.isArray(maker.categories) ? maker.categories.map(({ id }) => id) : [];
  if (categoryIds.length !== 14) makerErrors.push(`category count ${categoryIds.length} != 14`);
  if (new Set(categoryIds).size !== categoryIds.length) makerErrors.push('duplicate category id');
  if (!Array.isArray(maker.formats) || maker.formats.length !== 4) {
    makerErrors.push('format count must be 4');
  } else {
    const expectedFormatSizes = [6, 8, 10, 14];
    maker.formats.forEach((format, index) => {
      if (!Array.isArray(format.categories) || format.categories.length !== expectedFormatSizes[index]) {
        makerErrors.push(`${format.id || index} size must be ${expectedFormatSizes[index]}`);
      }
      if ((format.categories || []).some((id) => !categoryIds.includes(id))) makerErrors.push(`${format.id || index} has unknown category`);
    });
  }
  if (makerErrors.length) {
    failed = true;
    console.error(`[maker:${maker.id}] ERROR: ${makerErrors.join('; ')}`);
  }

  for (const category of Array.isArray(maker.categories) ? maker.categories : []) {
    const values = JSON.parse(await readFile(path.join(root, 'data', 'makers', maker.id, `${category.id}.json`), 'utf8'));
    const errors = [];
    if (!Array.isArray(values)) {
      errors.push('root is not an array');
    } else {
      if (values.length !== expectedCount) errors.push(`count ${values.length} != ${expectedCount}`);
      const texts = values.map((value) => typeof value?.text === 'string' ? value.text.trim() : '');
      const genres = values.map((value) => String(value?.genre ?? '').trim());
      const exactDuplicates = texts.length - new Set(texts).size;
      const normalizedDuplicates = texts.length - new Set(texts.map(normalize)).size;
      const longest = texts.reduce((max, value) => Math.max(max, [...value].length), 0);
      if (texts.some((value) => !normalize(value))) errors.push('empty text');
      if (genres.some((value) => !storyGenreIds.has(value))) errors.push('unknown genre');
      if (exactDuplicates) errors.push(`${exactDuplicates} exact duplicates`);
      if (normalizedDuplicates) errors.push(`${normalizedDuplicates} normalized duplicates`);
      if (texts.some((value) => [...value].length > maxElementLength)) errors.push(`value exceeds ${maxElementLength} characters`);
      for (const genreId of storyGenreIds) {
        const count = genres.filter((value) => value === genreId).length;
        if (count !== 100) errors.push(`${genreId} count ${count} != 100`);
      }
      if (maker.resultMode === 'titles' && values.some((value) => !normalize(String(value?.base ?? '')))) errors.push('empty title base');
      const similarity = similarityReport(texts);
      if (similarity.highCount > 0) errors.push(`${similarity.highCount} highly similar candidate pairs`);
      console.log(`[maker:${maker.id}/${category.id}] count=${values.length}, maxLength=${longest}, exactDup=${exactDuplicates}, normalizedDup=${normalizedDuplicates}, jaccard>=0.80=${similarity.highCount}`);
    }
    if (errors.length) {
      failed = true;
      console.error(`ERROR: ${errors.join('; ')}`);
    }
  }
}

const storyHtml = await readFile(path.join(root, 'story.html'), 'utf8');
const storyJs = await readFile(path.join(root, 'story.js'), 'utf8');
const indexHtml = await readFile(path.join(root, 'index.html'), 'utf8');
const storyUiErrors = [];
const storyHtmlIds = [...storyHtml.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const storyJsIds = [...storyJs.matchAll(/document\.querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
if (new Set(storyHtmlIds).size !== storyHtmlIds.length) storyUiErrors.push('duplicate HTML id');
for (const id of storyJsIds) {
  if (!storyHtmlIds.includes(id)) storyUiErrors.push(`missing HTML id #${id}`);
}
if (!storyHtml.includes('src="./story.js"')) storyUiErrors.push('story.js is not linked');
if (!storyHtml.includes('href="./styles.css"')) storyUiErrors.push('styles.css is not linked');
if (!indexHtml.includes('href="./story.html"')) storyUiErrors.push('story link is missing from index.html');
console.log(`\n[story:ui] htmlIds=${storyHtmlIds.length}, scriptIds=${storyJsIds.length}`);
if (storyUiErrors.length) {
  failed = true;
  console.error(`ERROR: ${storyUiErrors.join('; ')}`);
}

const makerHtml = await readFile(path.join(root, 'maker.html'), 'utf8');
const makerJs = await readFile(path.join(root, 'maker.js'), 'utf8');
const makersHtml = await readFile(path.join(root, 'makers.html'), 'utf8');
const stylesCss = await readFile(path.join(root, 'styles.css'), 'utf8');
const makerUiErrors = [];
const makerHtmlIds = [...makerHtml.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const makerJsIds = [...makerJs.matchAll(/document\.querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
if (new Set(makerHtmlIds).size !== makerHtmlIds.length) makerUiErrors.push('duplicate maker HTML id');
for (const id of makerJsIds) if (!makerHtmlIds.includes(id)) makerUiErrors.push(`missing maker HTML id #${id}`);
if (!makerHtml.includes('src="./maker.js"')) makerUiErrors.push('maker.js is not linked');
if (!makerHtml.includes('href="./styles.css"')) makerUiErrors.push('styles.css is not linked from maker.html');
for (const maker of Array.isArray(creativeMakers) ? creativeMakers : []) {
  if (!makersHtml.includes(`type=${maker.id}`)) makerUiErrors.push(`hub link missing for ${maker.id}`);
}
if (!indexHtml.includes('href="./makers.html"')) makerUiErrors.push('makers link is missing from index.html');
if (!storyHtml.includes('href="./makers.html"')) makerUiErrors.push('makers link is missing from story.html');
if (!stylesCss.includes('.maker-card-grid')) makerUiErrors.push('maker card grid styles are missing');
if (!stylesCss.includes('.maker-element-list')) makerUiErrors.push('maker element list styles are missing');
if (!stylesCss.includes('@media (max-width: 540px)')) makerUiErrors.push('mobile breakpoint is missing');
console.log(`\n[maker:ui] htmlIds=${makerHtmlIds.length}, scriptIds=${makerJsIds.length}, hubLinks=${Array.isArray(creativeMakers) ? creativeMakers.length : 0}`);
if (makerUiErrors.length) {
  failed = true;
  console.error(`ERROR: ${makerUiErrors.join('; ')}`);
}

if (failed) process.exitCode = 1;
else console.log('\nAll word, facet, story, and creative-maker validation checks passed.');
