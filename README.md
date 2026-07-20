# 5W1H+メーカー

問いの要素をランダムに組み合わせ、情報整理、計画、分析、意思決定のきっかけを作る静的Webアプリです。デフォルトは5W1Hです。

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

## データ

`data/` に次の14要素を分けて収録しています。各ファイルはUTF-8の文字列配列で3,000件ずつ、利用対象は計42,000件です。

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

以前の文章生成で使っていた `action.json` も互換用データとして残しています。固有人物名、作品固有のキャラクター名、企業・ブランド・商品名を意図的に避け、一般的な語彙から専門的な一般語までを対象にしています。

## 再生成と検証

```powershell
node scripts/generate-word-data.mjs
node scripts/validate-word-data.mjs
```

検証では、各3,000件の件数、型、空文字、完全重複、NFKC正規化後の重複、近似表現の集中、カテゴリ固有の語尾を確認します。

## 構成

- `index.html` — 画面構造と形式ガイド
- `styles.css` — レスポンシブ表示と装飾
- `app.js` — 形式切替、データ読込、抽選、個別再抽選、コピー
- `data/` — 要素別の語彙データ
- `scripts/` — 語彙の生成・検証スクリプト

外部ライブラリやビルド工程は不要です。
