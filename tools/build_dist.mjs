#!/usr/bin/env node
/* يبني نسخة الموقع النظيفة في dist/ (ملفات الموقع فقط، بلا أدوات التطوير أو المستندات الداخلية)
     node tools/build_dist.mjs
   ثم ارفع محتوى dist/ إلى أي استضافة ملفات ثابتة (Cloudflare Pages أو Netlify أو غيرها). */
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { protect } from "./protect.mjs";
const root = fileURLToPath(new URL("../", import.meta.url)), out = root + "dist/";
// رقم الإصدار من مصدر واحد (data/conditions.js)، ويجب أن يطابق نسخة عامل الخدمة
const VER = readFileSync(root + "data/conditions.js", "utf8").match(/version: "([\d.]+)"/)[1];
if (!readFileSync(root + "sw.js", "utf8").includes(`"mosel-v${VER}"`)) { console.error(`✘ رقم الإصدار في sw.js لا يطابق ${VER}`); process.exit(1); }
rmSync(out, { recursive: true, force: true }); mkdirSync(out + "data", { recursive: true });
for (const f of ["index.html", "app.js", "prefs.js", "sw.js", "manifest.json", "_headers", "LICENSE"]) cpSync(root + f, out + f);
for (const f of readdirSync(root + "data").filter(f => f === "conditions.js" || f === "care.js" || f === "tips.js" || /^more_.*\.js$/.test(f))) cpSync(root + "data/" + f, out + "data/" + f);
cpSync(root + "icons", out + "icons", { recursive: true });
mkdirSync(out + "assets"); for (const f of readdirSync(root + "assets").filter(f => /\.(jpg|png|webp)$/.test(f))) cpSync(root + "assets/" + f, out + "assets/" + f);
// الصور التشريحية (Blausen، رخصة CC BY 3.0): تُنسخ وتُشفَّر مع الحزمة، لكن لا نضع عليها علامتنا لأنها ليست من إنتاجنا
mkdirSync(out + "assets/organs"); for (const f of readdirSync(root + "assets/organs").filter(f => /\.(jpg|png|webp)$/.test(f))) cpSync(root + "assets/organs/" + f, out + "assets/organs/" + f);
// تصغير الشيفرة (minify) لصعوبة نسخها وسرعة التحميل، مع الإبقاء على سطر حقوق الملكية /*! */
const jsFiles = ["app.js", "prefs.js", "sw.js", ...readdirSync(out + "data").map(f => "data/" + f)];
try {
  for (const f of jsFiles) execFileSync("npx", ["--yes", "esbuild@0.28.2", out + f, "--minify", "--legal-comments=inline", "--charset=utf8", "--target=es2019", "--allow-overwrite", "--outfile=" + out + f], { stdio: "pipe" });
  console.log("✔ الشيفرة مصغّرة.");
} catch (e) { console.warn("⚠ تعذّر التصغير (esbuild غير متاح)، ستُنشر الملفات كما هي."); }
// الحماية: علامة مائية على الصور، ثم تشفير البيانات والصور وقفل النطاق وتعمية الشيفرة (MOSEL_PROTECT=0 لتعطيلها أثناء التطوير)
if (process.env.MOSEL_PROTECT !== "0") {
  const assetFiles = readdirSync(out + "assets").filter(f => /\.(jpg|jpeg)$/.test(f)).map(f => "assets/" + f);
  for (const f of assetFiles) execFileSync("python3", [root + "tools/watermark.py", "embed", out + f, out + f], { stdio: "pipe" });
  const html = readFileSync(out + "index.html", "utf8");
  const dataFiles = [...html.matchAll(/<script src="(data\/[^"]+)"><\/script>/g)].map(m => m[1]);
  const organFiles = readdirSync(out + "assets/organs").map(f => "assets/organs/" + f);
  const r = await protect(out, { dataFiles, assetFiles: [...assetFiles, ...organFiles] });
  console.log(`✔ الحماية: ${assetFiles.length} صور بعلامة مائية، ${dataFiles.length} ملفات بيانات مشفّرة في pack.bin (${(r.packBytes / 1024).toFixed(0)} ك.ب)، قفل النطاق على: ${r.domains.join("، ")}`);
}
// رقم الإصدار داخل الحزمة: ملف VERSION.txt ووسم في الصفحة
const built = new Date().toISOString().slice(0, 10);
writeFileSync(out + "VERSION.txt", `موصل (Mosel) — الإصدار ${VER}\nتاريخ البناء: ${built}\n© 2026 Maro Shahaly. جميع الحقوق محفوظة.\n`);
writeFileSync(out + "index.html", readFileSync(out + "index.html", "utf8").replace("<head>", `<head>\n<meta name="version" content="${VER}">`));
// تحقّق: لا ذكر لأي أداة أو جهة تطوير في ملفات الموقع
const walk = d => readdirSync(d).flatMap(f => statSync(d + f).isDirectory() ? walk(d + f + "/") : [d + f]);
const bad = walk(out).filter(f => /claude|anthropic/i.test(readFileSync(f, "latin1")) || /claude|anthropic/i.test(f));
if (bad.length) { console.error("✘ ملفات تحتوي أسماء غير مرغوبة:", bad); process.exit(1); }
console.log(`✔ dist/ جاهزة: ${walk(out).length} ملفًا، ولا تحتوي أي ذكر لأدوات التطوير.`);
// ملف الضغط باسم يحمل رقم الإصدار
for (const f of readdirSync(root).filter(f => /^mosel-site.*\.zip$/.test(f))) rmSync(root + f);
const zipName = `mosel-site-v${VER}.zip`;
execFileSync("zip", ["-qr", root + zipName, "."], { cwd: out });
console.log(`✔ الإصدار ${VER} → ${zipName}`);
