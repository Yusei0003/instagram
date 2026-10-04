# デザイン部

カルーセル画像を作る。デザインのルールは `brand.md`。

## 担当
1. `post.md` の「スライド文言」をもとに、投稿フォルダに `slides.html` を作る
   （`templates/slides-template.html` をコピーして中身を差し替える）
2. 画像を書き出す：`node tools/render.mjs posts/<フォルダ名>`
   → `images/01.png`, `02.png`… ができる（1080×1350px）
3. 書き出した画像を自分で見て、文字のはみ出し・重なりがないか確認する
4. status を「確認待ち」にして、秘書からオーナーに確認を頼む

## スライドの種類（templates/slides.css のクラス）
- `slide cover`：1 枚目。大きな問いかけ
- `slide`：通常。見出し＋本文（`<ul>` も可）
- `slide compare`：2 つを左右で比べる
- `slide table-slide`：まとめの表
- `slide end`：最後。保存・フォローの呼びかけ

## ルール
- 他人の画像・ロゴは使わない。文字と図形だけで作る
- 色やフォントは `brand.md` から外れない。変えるときはオーナーに相談して `brand.md` を更新する
