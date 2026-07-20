# 5W1Hメーカー

「いつ・どこで・だれが・なにを・どのように・どうしたか」をランダムに組み合わせ、物語の種になる一文を作る静的Webアプリです。

## 使い方

データを `fetch` で読み込むため、`index.html` を直接開かず、ローカルサーバーまたは GitHub Pages から表示してください。

```powershell
python -m http.server 8000
```

起動後、ブラウザーで `http://localhost:8000/` を開きます。

## データ

`data/` に次の6カテゴリを分けて収録しています。各ファイルはUTF-8の文字列配列で、3,000件ずつ、計18,000件です。

- `when.json` — いつ
- `where.json` — どこで
- `who.json` — だれが
- `what.json` — なにを
- `how.json` — どのように
- `action.json` — どうしたか

固有人物名、作品固有のキャラクター名、企業・ブランド・商品名を意図的に避け、一般的な語彙から専門的な一般語までを対象にしています。

## 再生成と検証

```powershell
node scripts/generate-word-data.mjs
node scripts/validate-word-data.mjs
```

検証では、件数、型、空文字、完全重複、NFKC正規化後の重複、近似表現の集中、動詞の過去形語尾を確認します。

## 構成

- `index.html` — 画面構造
- `styles.css` — レスポンシブ表示と装飾
- `app.js` — データ読込、抽選、個別再抽選、コピー
- `data/` — 6カテゴリの語彙データ
- `scripts/` — 語彙の生成・検証スクリプト

外部ライブラリやビルド工程は不要です。
