import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultDataDir = path.join(root, 'data');

const list = (text, expected, label) => {
  const values = text.trim().split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
  if (values.length !== expected) {
    throw new Error(`${label}: expected ${expected} parts, got ${values.length}`);
  }
  return values;
};

const cross3 = (first, second, third, render) => first.flatMap((a) => (
  second.flatMap((b) => third.map((c) => render(a, b, c)))
));

const whom = cross3(
  list(`
地域の
現場の
利用部門の
顧客側の
運営チームの
研究班の
制作現場の
保守部門の
教育現場の
医療現場の
福祉部門の
物流現場の
行政窓口の
地域活動の
協力組織の
取引先の
専門部署の
検証チームの
利用者側の
支援機関の
`, 20, 'whom scopes'),
  list(`
経験豊富な
事情に詳しい
調整力のある
判断の早い
説明の丁寧な
実務経験がある
慎重な
協力的な
責任感の強い
中立的な
課題を理解する
長期的に関わる
利用者目線を持つ
専門知識を持つ
意見をまとめられる
`, 15, 'whom descriptors'),
  list(`
担当者
利用者
責任者
協力者
相談員
専門家
代表者
実務者
参加者
支援者
`, 10, 'whom roles'),
  (scope, descriptor, role) => `${scope}${descriptor}${role}`,
);

const which = cross3(
  list(`
安全性を重視した
費用対効果を優先した
実現可能性を確かめた
利用者負担を抑えた
短期間で試せる
長期運用に向いた
保守しやすさを考えた
環境負荷を減らした
説明しやすさを意識した
拡張性を持たせた
地域事情に合わせた
既存資源を活用した
専門家の意見を反映した
利用者の声を反映した
失敗時に戻しやすい
段階的に導入できる
少人数で始められる
品質を安定させた
再現性を確かめた
将来変更に備えた
`, 20, 'which criteria'),
  list(`
計画案
運用案
改善案
設計案
検証案
導入案
配置案
広報案
調査案
教育案
保守案
予算案
日程案
代替案
実施案
`, 15, 'which options'),
  list(`
として最も有力
として次に有力
として優先度が高い
として予備に残す
として短期向け
として長期向け
として標準的
として簡易に試せる
として慎重に進める
として挑戦的
`, 10, 'which positions'),
  (criterion, option, position) => `${criterion}${option}${position}`,
);

const why = cross3(
  list(`
利用者の安全を守るために
品質を安定させるために
現場の負担を減らすために
判断を早めるために
説明責任を果たすために
将来の変更に備えるために
費用の増加を抑えるために
作業の抜けを防ぐために
地域差に対応するために
利用者の不安を減らすために
技術を継承するために
記録を後世に残すために
資源を有効に使うために
再現性を高めるために
関係者の認識を揃えるために
緊急時の混乱を防ぐために
小さく試して学ぶために
公平な判断を保つために
長期運用を可能にするために
成果を測れるようにするために
`, 20, 'why goals'),
  list(`
手順を標準化する
判断基準を明確にする
役割分担を整理する
小規模な検証を行う
利用者の意見を確認する
代替案を用意する
進捗を定期的に測る
情報共有の方法を統一する
作業順序を見直す
必要な資源を早めに確保する
教育内容を更新する
保守計画を具体化する
記録方法を揃える
安全確認を追加する
意思決定の期限を定める
`, 15, 'why actions'),
  list(`
のが必要だから
のが有効だから
のが現実的だから
のが合理的だから
のが安全だから
のが効率的だから
のが関係者の合意を得やすいから
のが長期的に有利だから
のが検証結果に沿っているから
のが将来の変更に対応しやすいから
`, 10, 'why reasons'),
  (goal, action, reason) => `${goal}${action}${reason}`,
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
件
個
人
組
台
枚
本
箱
項目
工程
拠点
回
種類
チーム
案
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
総予算は
初期費用は
月間運用費は
年間保守費は
一件あたりの費用は
一人あたりの費用は
追加費用は
試験導入費は
予備費は
削減目標額は
`, 10, 'how-much money scopes'),
  amountQualifiers,
  list(`
千円
三千円
五千円
一万円
二万円
三万円
五万円
十万円
二十万円
三十万円
五十万円
百万円
二百万円
五百万円
千万円
`, 15, 'how-much money values'),
  (scope, qualifier, amount) => `${scope}${qualifier}${amount}`,
);

const howMuchDegree = cross3(
  list(`
改善幅は
削減率は
達成率は
利用率は
進捗度は
影響の大きさは
負担の程度は
品質向上幅は
余裕の大きさは
変化の割合は
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
準備を含めて
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
営業日
週間
か月
年
四半期
年度
学期
季節
夜
昼夜
作業日
`, 15, 'how-long units'),
  (qualifier, number, unit) => `${qualifier}${number}${unit}`,
);

const whatIf = cross3(
  list(`
繁忙期に
計画の初期段階で
実施直前に
試験運用中に
本格導入後に
予算決定後に
担当交代の時期に
災害発生時に
需要が高まる時期に
人員が少ない日に
長期休暇中に
機器更新の前に
契約更新時に
地域行事と重なる日に
悪天候が続く時期に
新しい規則の施行後に
利用者が急増する時期に
供給が不安定な時期に
年度末に
次の見直しまでに
`, 20, 'what-if contexts'),
  list(`
需要の前提が
予算の前提が
人員配置の前提が
期限の前提が
設備利用の前提が
原材料調達の前提が
通信環境の前提が
判断基準の前提が
利用者数の前提が
供給量の前提が
品質基準の前提が
作業量の前提が
協力体制の前提が
優先順位の前提が
外部環境の前提が
`, 15, 'what-if assumptions'),
  list(`
崩れたら
想定と異なったら
急に変わったら
成立しなくなったら
厳しくなったら
緩和されたら
二つ同時に変化したら
確認できなくなったら
一時的に失われたら
根本から見直されたら
`, 10, 'what-if changes'),
  (context, assumption, change) => `もし${context}${assumption}${change}`,
);

const soWhat = cross3(
  list(`
この結果から、
比較結果を見ると、
時間の変化を追うと、
地域別に比べると、
利用者の声をまとめると、
複数の記録を重ねると、
例外事例も含めると、
費用との関係を見ると、
品質指標と照らすと、
過去の計画と比べると、
少数意見にも注目すると、
現場観察を踏まえると、
失敗事例から考えると、
成功事例から考えると、
短期と長期を分けると、
担当者別に整理すると、
条件を揃えて比べると、
優先度を加味すると、
不確実性を考慮すると、
全体像を見渡すと、
`, 20, 'so-what evidence'),
  list(`
利用者の行動には
現場の負担には
品質の安定性には
費用の使い方には
意思決定の速さには
情報共有の方法には
地域ごとの成果には
時間帯ごとの成果には
担当者間の連携には
安全確認の方法には
教育の効果には
保守のしやすさには
計画の実現性には
資源の配分には
利用者の満足度には
`, 15, 'so-what topics'),
  list(`
一定の傾向があると言える
改善の余地があると言える
優先課題があると言える
予想以上の影響があると言える
再検討の必要があると言える
注目すべき関連があると言える
無視できない差があると言える
条件による差があると言える
有力な判断材料があると言える
次の仮説につながる示唆があると言える
`, 10, 'so-what implications'),
  (evidence, topic, implication) => `${evidence}${topic}${implication}`,
);

const nowWhat = cross3(
  list(`
まず
今日中に
今週中に
次の会議で
次の作業前に
担当交代までに
試験運用の前に
本格導入の前に
月末までに
年度末までに
問題が広がる前に
関係者が集まる日に
小規模な範囲で
優先度の高い順に
利用者へ説明する前に
予算を確定する前に
次回の測定までに
記録が新しいうちに
判断材料が揃った段階で
実施結果を確認した後に
`, 20, 'now-what timings'),
  list(`
課題一覧を
優先順位を
検証計画を
役割分担を
判断基準を
進捗指標を
代替案を
利用者への説明を
必要な資源を
実施手順を
期限と節目を
リスク対応を
関係者の意見を
成果の測り方を
次回の判断材料を
`, 15, 'now-what objects'),
  list(`
整理する
見直す
具体化する
確認する
文書化する
共有する
更新する
評価する
比較する
検討する
`, 10, 'now-what actions'),
  (timing, object, action) => `${timing}${object}${action}`,
);

export const extendedCategories = {
  whom,
  which,
  why,
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
    if (values.length !== 3000) {
      throw new Error(`${category}: expected 3000 values, got ${values.length}`);
    }
    if (new Set(values).size !== values.length) {
      throw new Error(`${category}: duplicate values detected`);
    }
    await writeFile(path.join(dataDir, `${category}.json`), `${JSON.stringify(values, null, 2)}\n`, 'utf8');
    console.log(`${category}: ${values.length}`);
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === path.resolve(fileURLToPath(import.meta.url))) {
  await writeExtendedWordData();
}
