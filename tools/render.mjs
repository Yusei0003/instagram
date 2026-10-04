// 投稿フォルダの slides.html を 1 枚ずつ PNG に書き出す。
// 使い方: node tools/render.mjs posts/2026-10-06-claude-vs-codex-01
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = process.argv[2];
if (!target) {
  console.error("使い方: node tools/render.mjs posts/<フォルダ名>");
  process.exit(1);
}

const postDir = resolve(target);
const html = join(postDir, "slides.html");
if (!existsSync(html)) {
  console.error(`slides.html が見つかりません: ${html}`);
  process.exit(1);
}

execFileSync("bash", [join(root, "tools/setup-fonts.sh")], { stdio: "inherit" });

const outDir = join(postDir, "images");
mkdirSync(outDir, { recursive: true });
for (const f of readdirSync(outDir)) {
  if (f.endsWith(".png")) rmSync(join(outDir, f));
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1500 } });
await page.goto(pathToFileURL(html).href);
await page.evaluate(() => document.fonts.ready);

const slides = await page.$$(".slide");
const problems = [];
for (const [i, slide] of slides.entries()) {
  const name = `${String(i + 1).padStart(2, "0")}.png`;
  await slide.screenshot({ path: join(outDir, name) });
  const overflow = await slide.evaluate((el) => el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth);
  if (overflow) problems.push(name);
  console.log(`書き出し: images/${name}`);
}
await browser.close();

console.log(`\n${slides.length} 枚を書き出しました: ${outDir}`);
if (problems.length) {
  console.log(`⚠ 文字がはみ出している可能性があります: ${problems.join(", ")}`);
  process.exitCode = 2;
}
