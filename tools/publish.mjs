// status が「投稿待ち」で、投稿予定日が今日以前の投稿を 1 件、Instagram API で公開する。
// GitHub Actions（.github/workflows/publish.yml）から毎日 19:00（日本時間）に実行される。
//
// 使い方:
//   node tools/publish.mjs            本番（IG_ACCESS_TOKEN が必要）
//   node tools/publish.mjs --dry-run  投稿せずに、何を投稿するかだけ表示する
//
// 環境変数:
//   IG_ACCESS_TOKEN   Instagram API のアクセストークン（GitHub Secrets に保存）
//   IG_API_VERSION    Graph API のバージョン（省略時 v23.0）
//   GITHUB_REPOSITORY / GITHUB_SHA  画像の公開 URL を作るのに使う（Actions が自動で設定）
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { execFileSync } from "node:child_process";
import { loadPosts, root, section, todayJST, updateFrontMatter } from "./lib/posts.mjs";

const dryRun = process.argv.includes("--dry-run");
const token = process.env.IG_ACCESS_TOKEN;
const apiVersion = process.env.IG_API_VERSION || "v23.0";
const api = `https://graph.instagram.com/${apiVersion}`;
const today = todayJST();

const candidates = loadPosts()
  .filter((p) => p.meta.status === "投稿待ち" && p.meta.scheduled && p.meta.scheduled <= today)
  .sort((a, b) => a.meta.scheduled.localeCompare(b.meta.scheduled));

if (candidates.length === 0) {
  console.log(`${today}: 投稿待ちの投稿はありません。`);
  process.exit(0);
}
const post = candidates[0];
console.log(`${today}: 投稿します → ${post.name}（予定日 ${post.meta.scheduled}）`);

// ---- 投稿前のチェック ----
const problems = [];
const imagesDir = join(post.dir, "images");
const images = existsSync(imagesDir)
  ? readdirSync(imagesDir).filter((f) => /\.jpe?g$/i.test(f)).sort()
  : [];
if (images.length === 0) problems.push("images/ に JPEG がありません（node tools/render.mjs で書き出す）");
if (images.length > 10) problems.push(`画像が ${images.length} 枚あります（カルーセルは最大 10 枚）`);

const caption = [section(post.text, "キャプション"), section(post.text, "ハッシュタグ")]
  .filter(Boolean)
  .join("\n\n");
if (!section(post.text, "キャプション")) problems.push("キャプションが空です");
if (caption.length > 2200) problems.push(`キャプションが ${caption.length} 文字あります（上限 2200）`);
const tagCount = (caption.match(/#[^\s#]+/g) || []).length;
if (tagCount > 30) problems.push(`ハッシュタグが ${tagCount} 個あります（上限 30）`);

const styleFiles = [join(root, ".company/design/templates/slides.css"), join(post.dir, "slides.html")];
if (styleFiles.some((f) => existsSync(f) && readFileSync(f, "utf8").includes("@your_account"))) {
  problems.push("画像のアカウント名が仮（@your_account）のままです。slides.css の --handle を設定する");
}

if (problems.length) {
  console.error("投稿を中止しました:\n- " + problems.join("\n- "));
  process.exit(1);
}

// 画像は公開リポジトリの raw URL から Instagram に取得させる
const repo = process.env.GITHUB_REPOSITORY || "Yusei0003/instagram";
const sha = process.env.GITHUB_SHA || execFileSync("git", ["rev-parse", "HEAD"], { cwd: root }).toString().trim();
const imageUrls = images.map(
  (f) => `https://raw.githubusercontent.com/${repo}/${sha}/${relative(root, join(imagesDir, f))}`,
);

if (dryRun) {
  console.log("\n[dry-run] 画像:");
  imageUrls.forEach((u) => console.log("  " + u));
  console.log(`\n[dry-run] キャプション（${caption.length} 文字、ハッシュタグ ${tagCount} 個）:\n${caption}`);
  process.exit(0);
}

if (!token) {
  console.log("IG_ACCESS_TOKEN が未設定のため、投稿をスキップしました（GitHub Secrets に登録すると動きます）。");
  process.exit(0);
}

// ---- Instagram API ----
async function call(method, path, params = {}) {
  const url = new URL(`${api}/${path}`);
  const body = new URLSearchParams({ ...params, access_token: token });
  const res =
    method === "GET"
      ? await fetch(`${url}?${body}`)
      : await fetch(url, { method, body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const msg = json.error ? `${json.error.message} (code ${json.error.code})` : `HTTP ${res.status}`;
    throw new Error(`${method} ${path} に失敗: ${msg}`);
  }
  return json;
}

async function waitUntilReady(containerId) {
  for (let i = 0; i < 30; i++) {
    const { status_code } = await call("GET", containerId, { fields: "status_code" });
    if (status_code === "FINISHED") return;
    if (status_code === "ERROR" || status_code === "EXPIRED") {
      throw new Error(`メディアの準備に失敗しました（${status_code}）`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("メディアの準備がタイムアウトしました");
}

const me = await call("GET", "me", { fields: "user_id,username" });
const igId = me.user_id || me.id;
console.log(`アカウント: @${me.username}`);

let creationId;
if (imageUrls.length === 1) {
  ({ id: creationId } = await call("POST", `${igId}/media`, { image_url: imageUrls[0], caption }));
} else {
  const children = [];
  for (const image_url of imageUrls) {
    const { id } = await call("POST", `${igId}/media`, { image_url, is_carousel_item: "true" });
    await waitUntilReady(id);
    children.push(id);
  }
  ({ id: creationId } = await call("POST", `${igId}/media`, {
    media_type: "CAROUSEL",
    children: children.join(","),
    caption,
  }));
}
await waitUntilReady(creationId);

const { id: mediaId } = await call("POST", `${igId}/media_publish`, { creation_id: creationId });
const { permalink } = await call("GET", mediaId, { fields: "permalink" });

updateFrontMatter(post, {
  status: "投稿済み",
  published_at: today,
  media_id: mediaId,
  permalink: permalink || "",
});
console.log(`投稿しました: ${permalink || mediaId}`);
