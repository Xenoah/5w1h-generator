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
本を読むのが好きな
音楽を聴くのが好きな
動物が好きな
写真を撮るのが好きな
庭仕事を楽しむ
自転車で出かける
よく笑う
話を聞くのが上手な
手先が器用な
季節の変化に気づく
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
昔から知っている
親せきの中の
同じ町に住む
旅先で出会った
料理が好きな
本が好きな
音楽が好きな
動物が好きな
子育て中の
ひとり暮らしの
朝が早い
休日に会う
よく話を聞く
困ったときに頼れる
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
親しみやすい
気配りのできる
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
困っている人
`, 10, 'whom people'),
  (context, descriptor, person) => `${context}${descriptor}${person}`,
);

const what = cross3(
  list(`
今日の
明日の
いつもの
ちょっとした
身近な
毎日の
暮らしの中の
予定していた
後回しにしていた
気になっていた
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
を少し進めること
を丁寧に行うこと
を気軽に試すこと
`, 10, 'what actions'),
  (context, activity, action) => `${context}${activity}${action}`,
);

const which = cross3(
  list(`
今の気分に合う
家族と相談して決めた
いつもより少し新しい
今日試してみたい
前から気になっていた
無理なく選べる
季節に合った
天気に合わせた
一人でも選びやすい
家族にも提案しやすい
友人に教わった
自分で工夫した
気軽に試せる
いつもの安心感がある
身近で見つかる
その日の予定に合う
その場で決めやすい
新しい発見がありそうな
少し迷った
思い出に残りそうな
`, 20, 'which criteria'),
  list(`
朝食のメニュー
夕食のおかず
今日の服装
帰り道
散歩コース
休日の過ごし方
買い物先
読書する本
飲み物
おやつ
贈り物
待ち合わせ場所
部屋の飾り方
収納方法
写真の撮り方
`, 15, 'which choices'),
  list(`
の候補
の別案
として選んだもの
として気になるもの
のいつもの案
の新しい案
の第一候補
のもう一つの候補
として試したいもの
として覚えておきたいもの
`, 10, 'which endings'),
  (criterion, choice, ending) => `${criterion}${choice}${ending}`,
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
晴れた日の昼
曇り空の夕方
春の朝
夏の夜
秋の夕暮れ
冬の朝
食事どき
おやつの時間
家族が集まるころ
町が静かになるころ
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
の時間帯
の直前
の直後
の少し前
の少しあと
を予定しているころ
に合わせた時間
が近づくころ
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
朝早く立ち寄る
夕方に立ち寄る
雨の日も行ける
歩いて行ける
自転車で行ける
家族で訪れる
友人と立ち寄る
休日に行く
季節を感じる
落ち着いて過ごせる
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
の待ち合わせ場所
の人が少ない場所
の明るい場所
の落ち着く場所
のいつもの場所
のすぐそば
`, 10, 'where spots'),
  (modifier, place, spot) => `${modifier}${place}${spot}`,
);

const why = cross3(
  list(`
気持ちよく一日を始めるために
家族と楽しく過ごすために
毎日の負担を減らすために
忘れ物を防ぐために
食事を楽しむために
部屋を心地よくするために
よく眠れるようにするために
体を少し動かすために
気分転換をするために
出かける準備を整えるために
時間に余裕を持つために
家にあるものを大切に使うために
友人との約束を守るために
季節を楽しむために
無理なく習慣を続けるために
家族の話をゆっくり聞くために
買い物を手早く済ませるために
休日をのんびり過ごすために
小さな楽しみを増やすために
明日の朝を楽にするために
`, 20, 'why goals'),
  list(`
早めに準備する
持ち物を確認する
部屋を少し片づける
予定に余裕を持たせる
食事のバランスを考える
短い散歩をする
家族に相談する
途中で休憩する
友人へ連絡する
家にあるものを活用する
予定を詰めすぎない
少しずつ進める
天気を確認する
無理のない範囲で続ける
使ったものを元の場所へ戻す
`, 15, 'why actions'),
  list(`
のがちょうどよいから
のが気軽だから
のが安心だから
のが続けやすいから
のが楽しいから
のが自分に合っているから
のが家族にも喜ばれるから
のが時間を使いすぎないから
のが明日にも役立つから
のが身近な方法だから
`, 10, 'why reasons'),
  (goal, action, reason) => `${goal}${action}${reason}`,
);

const how = cross3(
  list(`
家族と話しながら
音楽を聴きながら
窓を開けながら
温かい飲み物を用意して
メモを見ながら
時計を気にせず
天気に合わせて
季節を感じながら
家にある道具を使って
友人と相談しながら
子どもと一緒に
ひとりの時間を楽しみながら
散歩のついでに
買い物のついでに
休憩をはさみながら
写真を撮りながら
香りを楽しみながら
景色を眺めながら
深呼吸をしてから
笑顔を忘れずに
`, 20, 'how settings'),
  list(`
少しずつ
ゆっくり
一つずつ
自分のペースで
短い時間で
休みながら
朝のうちに
夕方までに
順番に
気が向いたときに
無理のない範囲で
身近なところから
簡単な方法で
いつもの手順で
思いつくままに
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
一パーセント
三パーセント
五パーセント
一〇パーセント
一五パーセント
二〇パーセント
二五パーセント
三〇パーセント
四〇パーセント
五〇パーセント
六〇パーセント
七五パーセント
八〇パーセント
九〇パーセント
一〇〇パーセント
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
朝起きたときに
出かける直前に
買い物の途中で
料理を始めたあとに
散歩へ出たあとに
友人と会う日に
家族が集まる日に
雨が降りそうな日に
休日の朝に
帰宅が遅くなった日に
冷蔵庫を開けたときに
洗濯を始めたあとに
部屋を片づけている途中で
おやつを作るときに
電車を待っている間に
近所へ出かけたときに
予定のない午後に
よく晴れた日に
急に寒くなった日に
寝る前に
`, 20, 'what-if contexts'),
  list(`
天気の予報が
家族の予定が
電車の時刻が
冷蔵庫の中身が
財布の残りが
体調が
気分が
待ち合わせ時間が
お店の営業時間が
道の混み具合が
洗濯物の乾き具合が
料理のできあがりが
部屋の温度が
予定していた人数が
外出の目的が
`, 15, 'what-if subjects'),
  list(`
思っていたのと違ったら
急に変わったら
予想より少なかったら
予想より多かったら
予定と合わなかったら
直前まで分からなかったら
いつもと違っていたら
途中で変わったら
確認できなかったら
思いどおりにならなかったら
`, 10, 'what-if changes'),
  (context, subject, change) => `もし${context}${subject}${change}`,
);

const soWhat = cross3(
  list(`
今日を振り返ると、
一週間を比べると、
朝と夜を比べると、
晴れの日と雨の日を比べると、
家族の話をまとめると、
写真を見返すと、
買い物メモを見直すと、
食事の記録を見ると、
散歩した日を数えると、
部屋の様子を比べると、
使った時間を振り返ると、
気分の変化を思い出すと、
休日の過ごし方を見ると、
季節ごとに比べると、
友人との会話を思い出すと、
家にある物を見渡すと、
続けられたことを見ると、
やめたことも含めると、
小さな失敗から考えると、
楽しかったことから考えると、
`, 20, 'so-what evidence'),
  list(`
朝の過ごし方には
食事の選び方には
買い物の仕方には
散歩の楽しみ方には
部屋の片づけ方には
家族との話し方には
休日の使い方には
友人との付き合い方には
お金の使い方には
時間の使い方には
眠る前の習慣には
季節の楽しみ方には
家にある物の使い方には
気分転換の方法には
毎日の小さな習慣には
`, 15, 'so-what topics'),
  list(`
小さな違いがあると言える
自分に合う工夫があると言える
続けやすい方法が見つかると言える
無理を減らす余地があると言える
気分を変えるきっかけがあると言える
家族と共有できる発見があると言える
次に試したいことがあると言える
思ったより大切な習慣があると言える
季節による変化があると言える
楽しみを増やす余地があると言える
`, 10, 'so-what conclusions'),
  (evidence, topic, conclusion) => `${evidence}${topic}${conclusion}`,
);

const nowWhat = cross3(
  list(`
まず
今日のうちに
明日の朝に
次の食事までに
出かける前に
帰宅したら
夕食のあとに
寝る前に
週末になったら
次の休日に
家族が集まったら
友人に会ったら
買い物へ行く前に
散歩のついでに
天気がよい日に
雨がやんだら
少し時間ができたら
気分が落ち着いたら
思い出したときに
無理のない範囲で
`, 20, 'now-what timings'),
  list(`
今日の予定を
買い物メモを
部屋の片づけを
夕食のメニューを
明日の持ち物を
散歩コースを
家族への連絡を
友人との約束を
読みたい本を
着ていく服を
冷蔵庫の中身を
休日の過ごし方を
植物の手入れを
写真の整理を
今月の楽しみを
`, 15, 'now-what objects'),
  list(`
見直す
決める
書き留める
家族と相談する
ひとつ選ぶ
簡単に整える
できるところから始める
忘れないように残す
無理のない形に変える
次の機会に試す
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
    await writeFile(path.join(dataDir, `${category}.json`), `${JSON.stringify(values, null, 2)}\n`, 'utf8');
    console.log(`${category}: ${values.length} daily expressions`);
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === path.resolve(fileURLToPath(import.meta.url))) await writeExtendedWordData();
