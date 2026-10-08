// posts/ 配下の投稿フォルダを読み書きする共通処理（publish.mjs / insights.mjs で使う）
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const postsDir = join(root, "posts");

// 日本時間の今日（YYYY-MM-DD）
export function todayJST(now = new Date()) {
  return new Date(now.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

export function daysBetween(fromDate, toDate) {
  return Math.round((Date.parse(toDate) - Date.parse(fromDate)) / 86400000);
}

function parseFrontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  const data = {};
  if (!m) return data;
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].replace(/\s+#.*$/, "").trim();
    value = value.replace(/^"(.*)"$/, "$1");
    data[kv[1]] = value;
  }
  return data;
}

export function loadPosts() {
  if (!existsSync(postsDir)) return [];
  return readdirSync(postsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => {
      const dir = join(postsDir, d.name);
      const file = join(dir, "post.md");
      if (!existsSync(file)) return null;
      const text = readFileSync(file, "utf8");
      return { name: d.name, dir, file, text, meta: parseFrontMatter(text) };
    })
    .filter(Boolean);
}

// front matter の値を書き換える（なければ追加する）
export function updateFrontMatter(post, updates) {
  let text = readFileSync(post.file, "utf8");
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error(`${post.name}/post.md に front matter がありません`);
  let fm = m[1];
  for (const [key, value] of Object.entries(updates)) {
    const line = `${key}: "${value}"`;
    const re = new RegExp(`^${key}:.*$`, "m");
    fm = re.test(fm) ? fm.replace(re, line) : `${fm}\n${line}`;
  }
  text = text.replace(m[0], `---\n${fm}\n---\n`);
  writeFileSync(post.file, text);
  post.text = text;
  post.meta = { ...post.meta, ...updates };
}

// 「## 見出し」から次の「## 」までの本文
export function section(text, heading) {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.startsWith(`## ${heading}`));
  if (start === -1) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith("## "));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();
}
