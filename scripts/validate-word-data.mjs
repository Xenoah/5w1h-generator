import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const categories = ['when', 'where', 'who', 'what', 'how', 'action'];
const expectedCount = 3000;

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
  if (nonStrings) errors.push(`${nonStrings} non-string values`);
  if (empty) errors.push(`${empty} empty values`);
  if (exactDuplicates) errors.push(`${exactDuplicates} exact duplicates`);
  if (normalizedDuplicates) errors.push(`${normalizedDuplicates} normalized duplicates`);
  if (category === 'where' && values.some((value) => /で$/.test(value))) errors.push('where value with trailing で');
  if (category === 'who' && values.some((value) => /が$/.test(value))) errors.push('who value with trailing が');
  if (category === 'what' && values.some((value) => /を$/.test(value))) errors.push('what value with trailing を');
  if (category === 'action' && values.some((value) => !/[ただ]$/.test(value))) errors.push('action value not ending in Japanese past tense');

  const similarity = similarityReport(values);
  const concentrations = concentrationReport(values);
  console.log(`\n[${category}] count=${values.length}, exactDup=${exactDuplicates}, normalizedDup=${normalizedDuplicates}`);
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

if (failed) process.exitCode = 1;
else console.log('\nAll word-data validation checks passed.');
