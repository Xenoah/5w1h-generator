# 5W1H+メーカー

問いの要素をランダムに組み合わせ、情報整理、計画、分析、意思決定のきっかけを作る静的Webアプリです。ジャンル・雰囲気・目的を複数選択してミックスできます。デフォルトは5W1Hです。

## 対応形式

- 5W1H
- 5W2H
- 5W3H
- 6W1H（Whom / Which）
- 6W2H（Whom / Which）
- 4W1H
- 5W1H ＋ So What
- 5W1H ＋ Now What
- 5W1H ＋ What if

## 使い方

データを `fetch` で読み込むため、`index.html` を直接開かず、ローカルサーバーまたはGitHub Pagesから表示してください。

```powershell
python -m http.server 8000
```

起動後、ブラウザーで `http://localhost:8000/` を開きます。

ジャンル・雰囲気・目的はチェックボックスで複数選択できます。複数選択時は、引き直すたびに各項目から最大2つを生成条件として採用し、What・Why・Howなど既存要素の内容へ反映します。テーマを独立した要素として追加しないため、5W1HならWho・What・When・Where・Why・Howの6要素を厳守します。

## データ

`data/` に次の14要素を分けて収録しています。各ファイルはUTF-8の文字列配列で3,000件ずつ、利用対象は計42,000件です。すべての要素を20文字以内に収めています。

- `who.json` — Who / だれが
- `whom.json` — Whom / だれに
- `what.json` — What / なにを・なにが
- `which.json` — Which / どれを
- `when.json` — When / いつ
- `where.json` — Where / どこで
- `why.json` — Why / なぜ
- `how.json` — How / どのように
- `how_many.json` — How many / いくつ・何人
- `how_much.json` — How much / いくら・どの程度
- `how_long.json` — How long / どのくらい
- `what_if.json` — What if / もし〜なら
- `so_what.json` — So what / それで何が言える
- `now_what.json` — Now what / 次に何をする

以前の文章生成で使っていた `action.json` も互換用データとして残しています。固有人物名、作品固有のキャラクター名、企業・ブランド・商品名を意図的に避け、家族、食事、買い物、散歩、趣味、天気など、日常的で一般的な語彙を中心にしています。

`facets.json` には、身近・多彩・少数派の3段階でジャンル68件、雰囲気40件、目的40件を収録しています。暮らしや家族などの身近な題材から、深海、古地図、製本、音の採集、思考実験などの少数派までを含みます。

## 再生成と検証

```powershell
node scripts/generate-word-data.mjs
node scripts/validate-word-data.mjs
```

検証では、各3,000件の件数、20文字以内の上限、型、空文字、完全重複、NFKC正規化後の重複、近似表現の集中、カテゴリ固有の語尾に加え、テーマ148件のID・表示名・段階・初期値を確認します。

## 構成

- `index.html` — 画面構造と形式ガイド
- `styles.css` — レスポンシブ表示と装飾
- `app.js` — 形式切替、テーマの複数選択とミックス、データ読込、抽選、個別再抽選、コピー
- `data/` — 要素別の語彙データ
- `scripts/` — 語彙の生成・検証スクリプト

外部ライブラリやビルド工程は不要です。
