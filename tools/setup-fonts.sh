#!/usr/bin/env bash
# Noto Sans JP（SIL Open Font License）を tools/fonts/ に取得する。一度だけ実行すればよい。
set -euo pipefail
dir="$(cd "$(dirname "$0")" && pwd)/fonts"
mkdir -p "$dir"
base="https://fonts.gstatic.com/s/notosansjp/v57"
for pair in "400 -F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEj75s" \
            "700 -F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFPYk75s" \
            "900 -F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFLgk75s"; do
  weight="${pair%% *}"; id="${pair#* }"
  out="$dir/NotoSansJP-$weight.ttf"
  if [ ! -s "$out" ]; then
    echo "フォントを取得中: NotoSansJP-$weight"
    curl -fsSL -o "$out" "$base/$id.ttf"
  fi
done
echo "フォントの準備ができました: $dir"
