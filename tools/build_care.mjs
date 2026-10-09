#!/usr/bin/env node
/*! موصل (Mosel) — © 2026 Maro Shahaly. جميع الحقوق محفوظة. */
/* يجمع ملفات data/care_src/*.json (ما قد يقرّره الطبيب لكل مرض) في data/care.js
     node tools/build_care.mjs
   ثم شغّل node tools/validate_data.mjs */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const src = root + "data/care_src/";
const all = {};
for (const f of readdirSync(src).filter(f => f.endsWith(".json")).sort()) Object.assign(all, JSON.parse(readFileSync(src + f, "utf8")));
const ids = Object.keys(all).sort();
const out = `/*! موصل (Mosel) — © 2026 Maro Shahaly. جميع الحقوق محفوظة. يُمنع النسخ أو إعادة النشر دون إذن كتابي. */
/* =========================================================
   موصل — ما قد يقرّره الطبيب: الفحوصات والتحاليل والأشعة والأدوية (فئات وأسماء علمية بلا جرعات)
   والإجراءات، مع الدليل الإرشادي الدولي المرجعي لكل مرض.
   مُولَّد من data/care_src/*.json بالأمر: node tools/build_care.mjs — لا تعدّله يدويًا.
   كل المحتوى بحالة «قيد المراجعة الطبية» إلى أن يعتمده طبيب مختص.
   ========================================================= */
(function (root) {
  "use strict";
  root.MOSEL_CARE = ${JSON.stringify(Object.fromEntries(ids.map(k => [k, all[k]])), null, 0)};
})(typeof window !== "undefined" ? window : globalThis);
`;
writeFileSync(root + "data/care.js", out);
console.log(`✔ data/care.js: ${ids.length} مرضًا.`);
