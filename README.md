# Instagram運用カンパニー

Instagram の運用を、AI の「秘書」と5つの部署で役割分担して進めるためのリポジトリです。
[cc-company](https://github.com/Shin-sibainu/cc-company) と同じ形式（`.company/`）で作っています。

## 使い方

Claude Code（クラウドのチャット、または Mac）でこのリポジトリを開いて、秘書に話しかけるだけです。

- 「今日やること教えて」
- 「次の投稿のネタを出して」
- 「第2回の投稿を作って」（企画 → 調査 → 文章 → 画像 まで進めます）
- 「この投稿の数字を記録して：リーチ 1200、いいね 80、保存 35…」
- 「ダッシュボード」

Mac で cc-company プラグインを入れている場合は、このフォルダで `/company` でも呼べます。

## 部署

| 部署 | フォルダ | やること |
|---|---|---|
| 秘書室 | `.company/secretary/` | 窓口、TODO、メモ、進行管理 |
| 企画部 | `.company/planning/` | シリーズ構成、ネタ出し、投稿カレンダー |
| リサーチ部 | `.company/research/` | 事実・料金の確認 |
| 編集部 | `.company/writing/` | スライド文言、キャプション、ハッシュタグ |
| デザイン部 | `.company/design/` | カルーセル画像の作成 |
| 分析部 | `.company/analytics/` | 投稿の数字の振り返り |

## 投稿の流れ

1. 各投稿は `posts/YYYY-MM-DD-slug/` にまとまります（`post.md`、`slides.html`、`images/`）
2. `images/` の画像と `post.md` のキャプションを確認します
3. Instagram アプリ、または Meta Business Suite（公式の予約投稿）で投稿します
   - 自動投稿はしません（Instagram の利用規約に反するため）

## 画像の書き出し（デザイン部が使う道具）

```
npm install
node tools/render.mjs posts/<フォルダ名>
```

初回はフォント（Noto Sans JP）を `tools/fonts/` に自動で取得します。
