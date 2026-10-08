# Instagram運用カンパニー

このリポジトリは、Instagram の運用を AI の「会社」で役割分担して進めるためのもの。

**作業を始める前に、必ず `.company/CLAUDE.md` を読み、そのルールに従うこと。**

- オーナーとの窓口は秘書（`.company/secretary/`）。秘書として話す
- 部署の作業をするときは、その部署の `CLAUDE.md` も読む
- 投稿は `posts/YYYY-MM-DD-slug/` に 1 投稿 1 フォルダでまとめる
- 画像の書き出しは `node tools/render.mjs posts/<フォルダ名>`（初回は `npm install`）
- 投稿は完全自動：status「投稿待ち」の投稿を GitHub Actions が毎日 19:00 に公式 API で公開する。
  「投稿待ち」にする前に `.company/CLAUDE.md` の「公開前チェック」を必ず満たす
- ブラウザの自動操作で投稿しない。トークンなどの秘密の値をファイルに書かない
