#!/usr/bin/env node
/* يصدّر كل الأمراض في ملف مراجعة للأطباء (CSV يفتح في Excel):
     node tools/export_review.mjs   →  review/medical_review.csv
   كل صف مرض واحد، مع أعراضه وأوزانها، وأعمدة فارغة لقرار الطبيب وملاحظاته. */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
const root = fileURLToPath(new URL("../", import.meta.url));
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(readFileSync(root + "data/conditions.js", "utf8"), ctx);
for (const f of readdirSync(root + "data").filter(f => /^more_.*\.js$/.test(f)).sort()) vm.runInContext(readFileSync(root + "data/" + f, "utf8"), ctx);
const { ZONES, DATA, TRIAGE } = ctx.window.MOSEL_DATA;
const SEX = { male: "ذكور فقط", female: "إناث فقط" };
const head = ["التخصص", "المعرّف", "اسم المرض", "English", "ICD-10", "مستوى الاستعجال", "خاص بجنس", "الأعراض (الوزن 1–3)", "التعريف", "العلاج والتوجيه", "ملاحظة", "حالة المراجعة", "قرار الطبيب (موافق/تعديل/حذف)", "التعديل المقترح", "اسم الطبيب المراجع", "التخصص", "التاريخ"];
const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
const rows = [head.map(q).join(",")];
let n = 0;
for (const z of ZONES) for (const c of DATA[z.key].conditions) {
  const syms = Object.entries(c.weights).map(([id, w]) => `${DATA[z.key].symptoms.find(s => s.id === id)?.label} (${w})`).join(" • ");
  const status = c.review === "pending" || z.status !== "validated" ? "قيد المراجعة" : "متحقق من مصادر";
  rows.push([z.name, c.id, c.name, c.en, c.icd10, TRIAGE[c.triage].label, SEX[c.sex || z.sex] || "الجنسان", syms, c.def, c.treatment, c.note || "", status, "", "", "", "", ""].map(q).join(","));
  n++;
}
mkdirSync(root + "review", { recursive: true });
writeFileSync(root + "review/medical_review.csv", "﻿" + rows.join("\r\n"), "utf8");
console.log(`✔ صُدّر ${n} مرضًا إلى review/medical_review.csv`);
