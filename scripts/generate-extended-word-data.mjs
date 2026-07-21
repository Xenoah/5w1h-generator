import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultDataDir = path.join(root, 'data');

const list = (text, expected, label) => {
  const values = text.trim().split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
  if (values.length !== expected) throw new Error(`${label}: expected ${expected} parts, got ${values.length}`);
  return values;
};

const cross3 = (first, second, third, render) => first.flatMap((a) => (
  second.flatMap((b) => third.map((c) => render(a, b, c)))
));

const who = cross3(
  list(`
近所に住む
朝の散歩をする
買い物帰りの
学校帰りの
休日を楽しむ
料理が好きな
読書好きな
音楽好きな
動物好きな
写真好きな
庭仕事を楽しむ
自転車好きな
よく笑う
聞き上手な
手先が器用な
季節に敏感な
新しいことを試す
のんびり過ごす
朝早く起きる
夕方によく会う
`, 20, 'who contexts'),
  list(`
明るい
親切な
好奇心旺盛な
穏やかな
元気な
おしゃべりな
静かな
几帳面な
おおらかな
思いやりのある
少し慌てた
楽しそうな
眠そうな
笑顔の
マイペースな
`, 15, 'who descriptors'),
  list(`
友人
家族
隣人
知り合い
学生
子ども
大人
年配者
店員
旅人
`, 10, 'who people'),
  (context, descriptor, person) => `${context}${descriptor}${person}`,
);

const whom = cross3(
  list(`
家族の中の
近所で会う
学校で会う
よく行く店の
散歩中に会う
趣味が同じ
昔なじみの
親せきの中の
同じ町に住む
旅先で会った
料理が好きな
本が好きな
音楽が好きな
動物が好きな
子育て中の
一人暮らしの
朝が早い
休日に会う
よく話を聞く
頼りにする
`, 20, 'whom contexts'),
  list(`
気さくな
やさしい
話しやすい
面倒見のよい
落ち着いた
元気な
笑顔の
まじめな
のんびりした
好奇心の強い
聞き上手な
少し照れ屋な
頼りになる
親しい
気配り上手な
`, 15, 'whom descriptors'),
  list(`
友だち
きょうだい
親
祖父母
近所の人
同級生
店の人
先生
旅先の人
困り中の人
`, 10, 'whom people'),
  (context, descriptor, person) => `${context}${descriptor}${person}`,
);

const what = cross3(
  list(`
今日の
明日の
定番の
小さな
身近な
毎日の
家での
予定の
保留中の
気になる
`, 10, 'what contexts'),
  list(`
朝食の準備
夕食づくり
部屋の掃除
本棚の整理
庭の手入れ
買い物
散歩
洗濯
写真の整理
手紙書き
読書
料理
おやつ作り
植物の水やり
持ち物の確認
予定の整理
衣替え
机の片づけ
靴の手入れ
自転車の点検
家族との会話
友人への連絡
近所の散策
音楽鑑賞
日記
昼寝
飲み物の準備
ごみの分別
換気
明日の支度
`, 30, 'what activities'),
  list(`
を始めること
を終えること
を手伝うこと
を楽しむこと
を工夫すること
を続けること
をやり直すこと
を進めること
を丁寧にすること
を試すこと
`, 10, 'what actions'),
  (context, activity, action) => `${context}${activity}${action}`,
);

const which = cross3(
  list(`
気分向きの
家族向きの
新しめの
試したい
気になる
手軽な
季節向きの
天気向きの
一人向きの
皆で選ぶ
友人推薦の
自分流の
気軽な
定番の
身近な
予定向きの
即決した
発見的な
迷った
思い出用の
`, 20, 'which criteria'),
  list(`
朝食
夕食
服装
帰り道
散歩道
休日案
買物先
読む本
飲み物
おやつ
贈り物
集合場所
部屋飾り
収納法
撮影法
`, 15, 'which choices'),
  list(`
候補
別案
選択
注目案
定番案
新案
第一案
第二案
試案
保存案
`, 10, 'which endings'),
  (criterion, choice, ending) => `${criterion}${choice}の${ending}`,
);

const when = cross3(
  list(`
今日の朝
今日の昼
今日の夕方
今夜
明日の朝
週末の朝
休日の午後
雨上がり
晴れた昼
曇りの夕方
春の朝
夏の夜
秋の夕暮れ
冬の朝
食事どき
おやつの時間
家族の時間
静かな夜
日が昇るころ
日が沈むころ
`, 20, 'when times'),
  list(`
起床
朝食
昼食
夕食
外出
帰宅
散歩
買い物
料理
洗濯
掃除
入浴
読書
休憩
就寝
`, 15, 'when events'),
  list(`
の前
のあと
の時間
の直前
の直後
の少し前
の少しあと
の予定時
に合う時
のころ
`, 10, 'when relations'),
  (time, event, relation) => `${time}、${event}${relation}`,
);

const where = cross3(
  list(`
いつもの
近所の
少し離れた
静かな
にぎやかな
明るい
こぢんまりした
広々した
木の多い
人の集まる
朝に寄る
夕方に寄る
雨でも行ける
歩いて行ける
自転車向きの
家族で訪れる
友人と立ち寄る
休日に行く
季節を感じる
くつろげる
`, 20, 'where modifiers'),
  list(`
公園
図書館
喫茶店
スーパー
パン屋
食堂
駅
広場
書店
花屋
レストラン
銭湯
雑貨店
公民館
映画館
`, 15, 'where places'),
  list(`
の入口
の近く
の前
の一角
の集合場所
の静かな所
の明るい所
の憩いの場
の定位置
のすぐそば
`, 10, 'where spots'),
  (modifier, place, spot) => `${modifier}${place}${spot}`,
);

const why = cross3(
  list(`
朝支度
家事
食事
散歩
買い物
片づけ
睡眠
節約
団らん
連絡
約束
休憩
運動
学び
趣味
外出
手入れ
記録
防災
明日
`, 20, 'why goals'),
  list(`
早めの準備
持ち物確認
少しの整理
余裕ある予定
食事の工夫
短い散歩
家族相談
途中休憩
友人連絡
家の道具
予定の余白
小さな一歩
天気確認
無理ない量
元の場所
`, 15, 'why actions'),
  list(`
合う
役立つ
安心
必要
気軽
楽しい
続く
十分
自然
近道
`, 10, 'why reasons'),
  (goal, action, reason) => `${goal}には${action}が${reason}だから`,
);

const how = cross3(
  list(`
家族と話し
音楽を聴き
窓を開け
お茶を用意し
メモを見て
時計を忘れ
天気に合わせ
季節を感じ
家の道具で
友人と相談し
子どもと共に
一人で楽しみ
散歩ついでに
買物ついでに
休憩を挟み
写真を撮り
香りを楽しみ
景色を眺め
深呼吸して
笑顔を忘れず
`, 20, 'how settings'),
  list(`
少しずつ
ゆっくり
一つずつ
自分流で
短時間で
休みつつ
朝のうちに
夕方までに
順番に
気分次第で
無理なく
身近な所から
簡単に
いつも通り
思うままに
`, 15, 'how pace'),
  list(`
丁寧に
気軽に
楽しく
落ち着いて
のんびりと
手早く
やさしく
慎重に
自然体で
笑いながら
`, 10, 'how attitudes'),
  (setting, pace, attitude) => `${setting}${pace}${attitude}`,
);

const howMany = cross3(
  list(`
ちょうど
約
およそ
最大
少なくとも
合計
追加で
平均
一日あたり
ひとまとまりで
`, 10, 'how-many qualifiers'),
  list(`
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
`, 20, 'how-many numbers'),
  list(`
個
人
組
枚
本
箱
皿
杯
袋
束
冊
種類
回
鉢
着
`, 15, 'how-many counters'),
  (qualifier, number, counter) => `${qualifier}${number}${counter}`,
);

const amountQualifiers = list(`
約
およそ
最大
最低でも
合計
平均
目安として
現時点で
多くても
少なくとも
`, 10, 'how-much qualifiers');

const howMuchMoney = cross3(
  list(`
今日の買い物予算は
一食分の費用は
交通費は
おやつ代は
贈り物の予算は
休日に使う金額は
一人分の費用は
家族全員分の費用は
追加で使える金額は
今月の楽しみの予算は
`, 10, 'how-much money scopes'),
  amountQualifiers,
  list(`
百円
三百円
五百円
八百円
千円
千五百円
二千円
三千円
五千円
八千円
一万円
一万五千円
二万円
三万円
五万円
`, 15, 'how-much money values'),
  (scope, qualifier, amount) => `${scope}${qualifier}${amount}`,
);

const howMuchDegree = cross3(
  list(`
満足度は
混み具合は
甘さは
辛さは
疲れ具合は
明るさは
静かさは
片づき具合は
できあがり具合は
時間の余裕は
`, 10, 'how-much degree scopes'),
  amountQualifiers,
  list(`
1％
3％
5％
10％
15％
20％
25％
30％
40％
50％
60％
75％
80％
90％
100％
`, 15, 'how-much degree values'),
  (scope, qualifier, amount) => `${scope}${qualifier}${amount}`,
);

const howLong = cross3(
  list(`
約
およそ
最大
最低
合計
連続
通算
目安として
休憩を含めて
余裕を見て
`, 10, 'how-long qualifiers'),
  list(`
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
`, 20, 'how-long numbers'),
  list(`
秒間
分間
時間
日間
週間
か月
年
晩
泊
往復分
曲分
話分
駅分
季節分
回分
`, 15, 'how-long units'),
  (qualifier, number, unit) => `${qualifier}${number}${unit}`,
);

const whatIf = cross3(
  list(`
朝に
夜に
外出中
買い物中
料理中
散歩中
通勤中
旅行中
雨の日
晴れの日
暑い日
寒い日
食事前
食事後
就寝前
起床時
休日に
帰宅時
待ち時間
集まりで
`, 20, 'what-if contexts'),
  list(`
天気
予定
電車
食材
体調
気分
時刻
店
道
洗濯物
料理
室温
人数
財布
荷物
`, 15, 'what-if subjects'),
  list(`
急変する
足りない
増える
減る
遅れる
早まる
不明になる
使えない
入れ替わる
予想外になる
`, 10, 'what-if changes'),
  (context, subject, change) => `もし${context}${subject}が${change}なら`,
);

const soWhat = cross3(
  list(`
今日の記録
今週の記録
朝の記録
夜の記録
晴天記録
雨天記録
家族の声
友人の声
写真記録
買物メモ
食事記録
散歩記録
部屋の変化
時間記録
気分記録
休日記録
季節記録
失敗記録
成功記録
習慣記録
`, 20, 'so-what evidence'),
  list(`
朝時間
食事
買い物
散歩
片づけ
家族会話
休日
友人関係
お金
時間
睡眠
季節
持ち物
気分転換
習慣
`, 15, 'so-what topics'),
  list(`
違いあり
工夫あり
余地あり
効果あり
価値あり
変化あり
発見あり
傾向あり
改善可能
継続可能
`, 10, 'so-what conclusions'),
  (evidence, topic, conclusion) => `${evidence}から${topic}に${conclusion}と言える`,
);

const nowWhat = cross3(
  list(`
まず
今日中に
明朝に
食事前に
外出前に
帰宅後に
夕食後に
就寝前に
週末に
次の休日に
家族集合時に
友人と会い
買物前に
散歩中に
晴天時に
雨上がりに
空き時間に
落ち着いて
思い出して
無理なく
`, 20, 'now-what timings'),
  list(`
予定を
メモを
部屋を
夕食を
持ち物を
散歩道を
家族連絡を
友人約束を
読む本を
服装を
冷蔵庫を
休日案を
植物を
写真を
楽しみを
`, 15, 'now-what objects'),
  list(`
見直す
決める
記録する
相談する
一つ選ぶ
整える
始める
残す
変える
試す
`, 10, 'now-what actions'),
  (timing, object, action) => `${timing}${object}${action}`,
);

export const extendedCategories = {
  who,
  whom,
  what,
  which,
  when,
  where,
  why,
  how,
  how_many: howMany,
  how_much: [...howMuchMoney, ...howMuchDegree],
  how_long: howLong,
  what_if: whatIf,
  so_what: soWhat,
  now_what: nowWhat,
};

export async function writeExtendedWordData(dataDir = defaultDataDir) {
  await mkdir(dataDir, { recursive: true });
  for (const [category, values] of Object.entries(extendedCategories)) {
    if (values.length !== 3000) throw new Error(`${category}: expected 3000 values, got ${values.length}`);
    if (new Set(values).size !== values.length) throw new Error(`${category}: duplicate values detected`);
    const tooLong = values.find((value) => [...value].length > 20);
    if (tooLong) throw new Error(`${category}: value exceeds 20 characters (${[...tooLong].length}): ${tooLong}`);
    await writeFile(path.join(dataDir, `${category}.json`), `${JSON.stringify(values, null, 2)}\n`, 'utf8');
    console.log(`${category}: ${values.length} daily expressions`);
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === path.resolve(fileURLToPath(import.meta.url))) await writeExtendedWordData();
