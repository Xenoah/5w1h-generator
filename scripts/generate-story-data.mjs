import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultDataDir = path.join(root, 'data');

const list = (text) => text.trim().split(/\r?\n/).map((value) => value.trim()).filter(Boolean);

export const storyGenres = [
  { id: 'everyday', label: '日常', tier: 'general', prefix: '暮らしの' },
  { id: 'romance', label: '恋愛', tier: 'general', prefix: '恋模様の' },
  { id: 'youth', label: '青春', tier: 'general', prefix: '青春期の' },
  { id: 'family', label: '家族', tier: 'general', prefix: '家族劇の' },
  { id: 'friendship', label: '友情', tier: 'general', prefix: '友情譚の' },
  { id: 'adventure', label: '冒険', tier: 'general', prefix: '冒険譚の' },
  { id: 'mystery', label: '謎解き', tier: 'general', prefix: '謎解きの' },
  { id: 'fantasy', label: '幻想', tier: 'general', prefix: '幻想界の' },
  { id: 'future', label: '科学未来', tier: 'general', prefix: '未来の' },
  { id: 'comedy', label: '喜劇', tier: 'general', prefix: '喜劇調の' },
  { id: 'suspense', label: '緊迫劇', tier: 'general', prefix: '緊迫劇の' },
  { id: 'historical', label: '時代劇', tier: 'general', prefix: '時代劇の' },
  { id: 'travel', label: '旅', tier: 'varied', prefix: '旅路の' },
  { id: 'growth', label: '成長', tier: 'varied', prefix: '成長譚の' },
  { id: 'school', label: '学園', tier: 'varied', prefix: '学園の' },
  { id: 'music', label: '音楽', tier: 'varied', prefix: '音楽譚の' },
  { id: 'cooking', label: '料理', tier: 'varied', prefix: '食卓の' },
  { id: 'animals', label: '動物', tier: 'varied', prefix: '動物譚の' },
  { id: 'sports', label: '競技', tier: 'varied', prefix: '競技場の' },
  { id: 'ocean', label: '海洋', tier: 'varied', prefix: '海洋譚の' },
  { id: 'disaster', label: '災害', tier: 'varied', prefix: '災害下の' },
  { id: 'japanese', label: '和風奇譚', tier: 'varied', prefix: '和風奇譚の' },
  { id: 'folklore', label: '民俗', tier: 'niche', prefix: '民俗譚の' },
  { id: 'psychology', label: '心理', tier: 'niche', prefix: '心理劇の' },
  { id: 'courtroom', label: '法廷', tier: 'niche', prefix: '法廷劇の' },
  { id: 'medical', label: '医療', tier: 'niche', prefix: '医療劇の' },
  { id: 'archaeology', label: '考古', tier: 'niche', prefix: '考古譚の' },
  { id: 'local-history', label: '郷土', tier: 'niche', prefix: '郷土譚の' },
  { id: 'deep-sea', label: '深海', tier: 'niche', prefix: '深海譚の' },
  { id: 'polar', label: '極地', tier: 'niche', prefix: '極地譚の' },
];

function cross(left, right, render) {
  if (left.length !== 10 || right.length !== 10) {
    throw new Error(`story parts must be 10 x 10, got ${left.length} x ${right.length}`);
  }
  return left.flatMap((a) => right.map((b) => render(a, b)));
}

const definitions = {
  protagonist: [
    list(`
好奇心旺盛な
慎重な
負けず嫌いな
心優しい
無口な
おしゃべりな
夢見がちな
頑固な
機転の利く
不器用な
`),
    list(`
子ども
学生
旅人
店員
料理人
教師
配達人
研究者
職人
年配者
`),
    (a, b) => `${a}${b}`,
  ],
  setting: [
    list(`
古い
静かな
霧深い
にぎやかな
閉ざされた
光る
荒れた
小さな
眠らない
名もない
`),
    list(`
港町
商店街
山村
学校
図書館
列車
島
研究所
劇場
市場
`),
    (a, b) => `${a}${b}`,
  ],
  era: [
    list(`
変化前の
再建中の
繁栄する
衰退する
記録のない
祭り前の
長雨続きの
旅立ち前の
発見直後の
別れ間近の
`),
    list(`
春
夏
秋
冬
夜明け
夕暮れ
数日間
一世代
転換期
遠い未来
`),
    (a, b) => `${a}${b}`,
  ],
  desire: [
    list(`
居場所を
家族を
約束を
名誉を
自由を
思い出を
故郷を
真実を
日常を
友情を
`),
    list(`
守る
取り戻す
見つける
確かめる
忘れる
受け入れる
伝える
変える
手放す
築き直す
`),
    (a, b) => `${a}${b}`,
  ],
  lack: [
    list(`
深い
隠れた
幼い頃の
消えない
小さな
思いがけない
根強い
言えない
ひそかな
古くからの
`),
    list(`
自信不足
孤独感
罪悪感
記憶の穴
他者不信
焦り
恐怖心
嫉妬心
思い込み
未練
`),
    (a, b) => `${a}${b}`,
  ],
  inciting: [
    list(`
突然の
夜明けの
祭りでの
雨の日の
偶然の
久しぶりの
匿名の
駅前での
秘密裏の
真夜中の
`),
    list(`
手紙の到着
失踪事件
再会
停電
発見
依頼
うわさ
事故
告白
訪問者
`),
    (a, b) => `${a}${b}`,
  ],
  goal: [
    list(`
最初の
危険な
密かな
皆で挑む
期限付きの
譲れない
遠回りな
一度限りの
失敗できない
最後の
`),
    list(`
真相究明
故郷帰還
仲間救出
約束実現
汚名返上
失物発見
関係修復
記録完成
危機回避
自己証明
`),
    (a, b) => `${a}${b}`,
  ],
  antagonist: [
    list(`
冷静な
執念深い
親切そうな
無表情な
気まぐれな
誇り高い
謎めいた
短気な
古風な
計算高い
`),
    list(`
競争相手
保護者
責任者
同級生
旅人
研究者
隣人
指導者
親族
旧友
`),
    (a, b) => `${a}${b}`,
  ],
  obstacle: [
    list(`
深まる
突然の
繰り返す
避けられない
見えない
広がる
解けない
迫り来る
思わぬ
長引く
`),
    list(`
誤解
時間切れ
悪天候
資源不足
仲間割れ
記憶違い
通行止め
沈黙
秘密漏れ
迷い
`),
    (a, b) => `${a}${b}`,
  ],
  relationship: [
    list(`
旧友との
家族との
宿敵との
師弟の
隣人との
旅人との
同級生との
兄弟の
姉妹の
仲間との
`),
    list(`
再会
別離
和解
共闘
誤解
約束
裏切り
取引
秘密共有
立場逆転
`),
    (a, b) => `${a}${b}`,
  ],
  secret: [
    list(`
隠された
忘れられた
言えない
受け継いだ
書き換えられた
失われた
封じられた
誰も知らない
偶然知った
長年守った
`),
    list(`
出生
約束
失敗
借り
正体
地図
記録
手紙
計画
目撃談
`),
    (a, b) => `${a}${b}`,
  ],
  motif: [
    list(`
古びた
割れた
色あせた
鍵のない
名入りの
手作りの
片方だけの
濡れた
光を帯びた
小さな
`),
    list(`
鍵
写真
時計
傘
手帳
指輪
地図
切符
楽器
種
`),
    (a, b) => `${a}${b}`,
  ],
  theme: [
    list(`
自由
責任
記憶
家族
正義
孤独
信頼
変化
伝統
希望
`),
    list(`
選択
赦し
真実
友情
幸福
喪失
勇気
居場所
未来
愛情
`),
    (a, b) => `${a}と${b}`,
  ],
  ending: [
    list(`
静かな
晴れやかな
ほろ苦い
意外な
穏やかな
胸騒ぎの
希望ある
笑いの残る
余白のある
忘れがたい
`),
    list(`
別れ
再出発
帰還
和解
発見
継承
再会
選択
旅立ち
日常回帰
`),
    (a, b) => `${a}${b}`,
  ],
};

export const storyCategoryIds = Object.keys(definitions);

function buildCategory(parts) {
  const [left, right, render] = parts;
  const combinations = cross(left, right, render);
  return storyGenres.flatMap((genre) => combinations.map((value) => ({
    text: `${genre.prefix}${value}`,
    genre: genre.id,
  })));
}

export function createStoryCategories() {
  return Object.fromEntries(Object.entries(definitions).map(([id, parts]) => [id, buildCategory(parts)]));
}

export async function writeStoryData(dataDir = defaultDataDir) {
  const storyDir = path.join(dataDir, 'story');
  await mkdir(storyDir, { recursive: true });
  const publicGenres = storyGenres.map(({ id, label, tier }) => ({ id, label, tier }));
  await writeFile(path.join(dataDir, 'story-genres.json'), `${JSON.stringify(publicGenres, null, 2)}\n`, 'utf8');

  const categories = createStoryCategories();
  for (const [category, items] of Object.entries(categories)) {
    if (items.length !== 3000) throw new Error(`${category}: expected 3000 values, got ${items.length}`);
    if (new Set(items.map(({ text }) => text)).size !== items.length) {
      throw new Error(`${category}: duplicate values detected`);
    }
    const tooLong = items.find(({ text }) => [...text].length > 20);
    if (tooLong) throw new Error(`${category}: value exceeds 20 characters (${[...tooLong.text].length}): ${tooLong.text}`);
    await writeFile(path.join(storyDir, `${category}.json`), `${JSON.stringify(items, null, 2)}\n`, 'utf8');
    console.log(`story/${category}: ${items.length} (${storyGenres.length} genres)`);
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === path.resolve(fileURLToPath(import.meta.url))) await writeStoryData();
