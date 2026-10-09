#!/usr/bin/env node
/* يبني نسخة الموقع النظيفة في dist/ (ملفات الموقع فقط، بلا أدوات التطوير أو المستندات الداخلية)
     node tools/build_dist.mjs
   ثم ارفع محتوى dist/ إلى أي استضافة ملفات ثابتة (Cloudflare Pages أو Netlify أو غيرها). */
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url)), out = root + "dist/";
rmSync(out, { recursive: true, force: true }); mkdirSync(out + "data", { recursive: true });
for (const f of ["index.html", "app.js", "sw.js", "manifest.json", "_headers", "LICENSE"]) cpSync(root + f, out + f);
for (const f of readdirSync(root + "data").filter(f => f === "conditions.js" || f === "care.js" || /^more_.*\.js$/.test(f))) cpSync(root + "data/" + f, out + "data/" + f);
cpSync(root + "icons", out + "icons", { recursive: true });
mkdirSync(out + "assets"); for (const f of readdirSync(root + "assets").filter(f => /\.(jpg|png|webp)$/.test(f))) cpSync(root + "assets/" + f, out + "assets/" + f);
// تصغير الشيفرة (minify) لصعوبة نسخها وسرعة التحميل، مع الإبقاء على سطر حقوق الملكية /*! */
const jsFiles = ["app.js", "sw.js", ...readdirSync(out + "data").map(f => "data/" + f)];
try {
  for (const f of jsFiles) execFileSync("npx", ["--yes", "esbuild@0.28.2", out + f, "--minify", "--legal-comments=inline", "--charset=utf8", "--target=es2019", "--allow-overwrite", "--outfile=" + out + f], { stdio: "pipe" });
  console.log("✔ الشيفرة مصغّرة.");
} catch (e) { console.warn("⚠ تعذّر التصغير (esbuild غير متاح)، ستُنشر الملفات كما هي."); }
// تحقّق: لا ذكر لأي أداة أو جهة تطوير في ملفات الموقع
const walk = d => readdirSync(d).flatMap(f => statSync(d + f).isDirectory() ? walk(d + f + "/") : [d + f]);
const bad = walk(out).filter(f => /claude|anthropic/i.test(readFileSync(f, "latin1")) || /claude|anthropic/i.test(f));
if (bad.length) { console.error("✘ ملفات تحتوي أسماء غير مرغوبة:", bad); process.exit(1); }
console.log(`✔ dist/ جاهزة: ${walk(out).length} ملفًا، ولا تحتوي أي ذكر لأدوات التطوير.`);
