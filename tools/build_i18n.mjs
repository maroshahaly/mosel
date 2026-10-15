#!/usr/bin/env node
/*! موصل (Mosel) — © 2026 Maro Shahaly. جميع الحقوق محفوظة. */
/* يجمع قواميس الترجمة data/i18n_src/en_*.json ({"النص العربي": "English"}) في data/i18n_en.js
     node tools/build_i18n.mjs
   النصوص التي فيها متغيرات ({0} أو {x}) تتحول إلى أنماط بحث، وتُحذف القيم null (مفردات داخلية لا تُعرض). */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url)), src = root + "data/i18n_src/";
const exact = {}, patterns = [];
const esc = s => s.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/[{}]/g, m => "\\" + m);
let n = 0;
for (const f of readdirSync(src).filter(f => /^en_.*\.json$/.test(f)).sort()) {
  const d = JSON.parse(readFileSync(src + f, "utf8"));
  for (let [ar, en] of Object.entries(d)) {
    if (en == null || typeof en !== "string" || !en.trim()) continue;
    ar = ar.replace(/\s+/g, " ").trim(); n++;
    if (/\{(\d+|x)\}/.test(ar)) {
      // {x} المتتالية ← {0} {1}… بالترتيب في الطرفين
      let i = 0, j = 0;
      const a = ar.replace(/\{x\}/g, () => `{${i++}}`), e = en.replace(/\{x\}/g, () => `{${j++}}`);
      const parts = a.split(/\{\d+\}/), keys = [...a.matchAll(/\{(\d+)\}/g)].map(m => +m[1]);
      if (parts.every(p => !p.trim())) continue; // نمط بلا نص ثابت لا فائدة منه
      let re = esc(parts[0]); keys.forEach((k, idx) => { re += "(.+?)" + esc(parts[idx + 1]); });
      // نعيد ترقيم المتغيرات حسب ترتيب ظهورها في النص العربي
      const order = Object.fromEntries(keys.map((k, idx) => [k, idx]));
      patterns.push([re.replace(/\s+/g, " "), e.replace(/\{(\d+)\}/g, (_, k) => `{${order[k] ?? k}}`)]);
    } else exact[ar] = en;
  }
}
// الأنماط الأطول أولًا (أكثر تحديدًا)
patterns.sort((a, b) => b[0].length - a[0].length);
writeFileSync(root + "data/i18n_en.js", `/*! موصل (Mosel) — © 2026 Maro Shahaly. جميع الحقوق محفوظة. */
/* قاموس الواجهة والمحتوى بالإنجليزية — مُولَّد من data/i18n_src بالأمر node tools/build_i18n.mjs؛ لا تعدّله يدويًا. */
(function (root) { "use strict"; root.MOSEL_EN = ${JSON.stringify({ exact, patterns })}; })(typeof window !== "undefined" ? window : globalThis);
`);
console.log(`✔ data/i18n_en.js: ${Object.keys(exact).length} نصًا و${patterns.length} نمطًا (من ${n} ترجمة).`);
