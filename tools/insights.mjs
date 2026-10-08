// 投稿済みの投稿について、投稿から 3 日後と 7 日後の数字を Instagram API で取得し、
// .company/analytics/metrics.csv に追記する。7 日後の記録が済んだら status を「振り返り済み」にする。
// GitHub Actions（publish.yml）から毎日実行される。
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { daysBetween, loadPosts, root, todayJST, updateFrontMatter } from "./lib/posts.mjs";

const token = process.env.IG_ACCESS_TOKEN;
const apiVersion = process.env.IG_API_VERSION || "v23.0";
const api = `https://graph.instagram.com/${apiVersion}`;
const csv = join(root, ".company/analytics/metrics.csv");
const today = todayJST();
const CHECKPOINTS = [3, 7];

if (!token) {
  console.log("IG_ACCESS_TOKEN が未設定のため、数字の取得をスキップしました。");
  process.exit(0);
}

const recorded = new Set(
  (existsSync(csv) ? readFileSync(csv, "utf8") : "")
    .split("\n")
    .slice(1)
    .map((line) => line.split(","))
    .filter((cols) => cols.length > 3)
    .map((cols) => `${cols[0]}|${cols[3]}`),
);

// 指標名は投稿の種類によって使えないものがあるので、1 つずつ取得して失敗したものは空欄にする
const METRICS = ["reach", "likes", "comments", "saved", "shares", "profile_visits", "follows"];
async function metric(mediaId, name) {
  const params = new URLSearchParams({ metric: name, access_token: token });
  const res = await fetch(`${api}/${mediaId}/insights?${params}`);
  const json = await res.json().catch(() => ({}));
  const item = json.data?.[0];
  if (!res.ok || !item) return "";
  return item.total_value?.value ?? item.values?.[0]?.value ?? "";
}

let failures = 0;
for (const post of loadPosts()) {
  const { status, media_id, published_at } = post.meta;
  if (status !== "投稿済み" || !media_id || !published_at) continue;
  const elapsed = daysBetween(published_at, today);
  for (const day of CHECKPOINTS) {
    if (elapsed < day || recorded.has(`${post.name}|${day}`)) continue;
    try {
      const v = {};
      for (const name of METRICS) v[name] = await metric(media_id, name);
      const row = [post.name, published_at, today, day, v.reach, v.likes, v.comments, v.saved, v.shares, v.profile_visits, v.follows];
      appendFileSync(csv, row.join(",") + "\n");
      recorded.add(`${post.name}|${day}`);
      console.log(`記録: ${post.name}（${day} 日後）リーチ ${v.reach}、保存 ${v.saved}`);
    } catch (e) {
      failures++;
      console.error(`取得に失敗: ${post.name}（${day} 日後）: ${e.message}`);
    }
  }
  if (CHECKPOINTS.every((d) => recorded.has(`${post.name}|${d}`))) {
    updateFrontMatter(post, { status: "振り返り済み" });
  }
}
if (failures) process.exitCode = 1;
