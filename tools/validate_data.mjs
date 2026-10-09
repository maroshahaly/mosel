#!/usr/bin/env node
/* فحص آلي لمكتبة الأمراض — شغّله بعد أي تعديل في data/conditions.js:
     node tools/validate_data.mjs
   يخرج بالرمز 1 عند وجود أي خطأ (صالح للاستخدام في CI). */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const file = fileURLToPath(new URL("../data/conditions.js", import.meta.url));
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(readFileSync(file, "utf8"), ctx);
// الملفات الإضافية بالترتيب نفسه الذي يحمّلها به index.html
const dataDir = fileURLToPath(new URL("../data/", import.meta.url));
const html = readFileSync(fileURLToPath(new URL("../index.html", import.meta.url)), "utf8");
const listed = [...html.matchAll(/src="data\/(more_[^"]+\.js)"/g)].map(m => m[1]);
// MOSEL_ONLY=more_05_x.js : فحص ملف إضافي واحد مع الملفات الأساسية (للعمل المتوازي على ملفات منفصلة)
const ONLY = process.env.MOSEL_ONLY;
for (const f of readdirSync(dataDir).filter(f => /^more_.*\.js$/.test(f)).sort()) {
  if (ONLY && !/^more_0[1-4]_/.test(f) && f !== ONLY) continue;
  if (!ONLY && !listed.includes(f)) { console.error(`✘ الملف data/${f} غير مُدرج في index.html`); process.exit(1); }
  vm.runInContext(readFileSync(dataDir + f, "utf8"), ctx);
}
const { TRIAGE, ZONES, DATA, REGIONS, RISK_FACTORS } = ctx.window.MOSEL_DATA;

const errors = [], warnings = [];
const ORGANS = new Set(["brain", "thyroid", "lungs", "heart", "liver", "gallbladder", "stomach", "spleen", "pancreas", "kidney", "adrenal", "colon", "smallint", "appendix", "bladder", "prostate", "testes", "uterus", "ovaries", "breast", "repro"]);
const ICD10 = /^[A-Z]\d{2}(\.\d{1,2})?$/;
const ids = new Set();
let total = 0;

for (const z of ZONES) {
  const d = DATA[z.key];
  if (!d) { errors.push(`zone ${z.key}: لا توجد بيانات في DATA`); continue; }
  const symIds = new Set();
  for (const s of d.symptoms) {
    if (symIds.has(s.id)) errors.push(`${z.key}: عَرَض مكرر ${s.id}`);
    symIds.add(s.id);
    if (!s.label?.trim()) errors.push(`${z.key}/${s.id}: بلا نص`);
  }
  const used = new Set();
  for (const c of d.conditions) {
    total++;
    const where = `${z.key}/${c.id || c.name}`;
    if (!c.id?.startsWith(z.key + ".")) errors.push(`${where}: يجب أن يبدأ المعرّف بـ "${z.key}."`);
    if (ids.has(c.id)) errors.push(`${where}: معرّف مكرر`);
    ids.add(c.id);
    for (const f of ["name", "en", "def", "treatment"]) if (!c[f]?.trim()) errors.push(`${where}: الحقل ${f} فارغ`);
    if (!ICD10.test(c.icd10 || "")) errors.push(`${where}: رمز ICD-10 غير صحيح (${c.icd10})`);
    if (!TRIAGE[c.triage]) errors.push(`${where}: مستوى استعجال غير معروف (${c.triage})`);
    if (c.flag && !["emergency", "urgent"].includes(c.triage)) warnings.push(`${where}: مُعلَّم طارئ لكن مستوى الاستعجال = ${c.triage}`);
    const w = Object.entries(c.weights || {});
    if (!w.length) errors.push(`${where}: بلا أوزان`);
    for (const [sid, val] of w) {
      if (!symIds.has(sid)) errors.push(`${where}: الوزن يشير إلى عَرَض غير موجود ${sid}`);
      if (![1, 2, 3].includes(val)) errors.push(`${where}: وزن ${sid}=${val} يجب أن يكون 1 أو 2 أو 3`);
      used.add(sid);
    }
    // الفصل بين الذكر والأنثى: لا يرتبط مرض خاص بجنس بعَرَض خاص بالجنس الآخر
    const csex = c.sex || z.sex;
    if (z.sex && c.sex && c.sex !== z.sex) errors.push(`${where}: جنس المرض يخالف جنس القسم`);
    for (const [sid] of w) {
      const sym = d.symptoms.find(x => x.id === sid);
      if (csex && sym && sym.sex && sym.sex !== csex) errors.push(`${where}: مرض خاص بـ${csex} مرتبط بعَرَض خاص بـ${sym.sex} (${sid})`);
    }
    for (const o of [].concat(c.organ || [])) if (!ORGANS.has(o)) errors.push(`${where}: عضو غير معروف ${o}`);
    if (["prostate", "testes"].includes(c.organ) && csex === "female") errors.push(`${where}: عضو ذكري لمرض أنثوي`);
    if (["uterus", "ovaries"].includes(c.organ) && csex === "male") errors.push(`${where}: عضو أنثوي لمرض ذكري`);
    if (!w.some(([, v]) => v === 3)) warnings.push(`${where}: لا يوجد عَرَض مميِّز (وزن 3)`);
  }
  for (const sid of symIds) if (!used.has(sid)) warnings.push(`${z.key}/${sid}: عَرَض غير مرتبط بأي مرض`);

  // أمراض ليها نفس بصمة الأوزان بالظبط = مستحيل التفريق بينها
  const sig = new Map();
  for (const c of d.conditions) {
    const k = JSON.stringify(Object.entries(c.weights).sort());
    if (sig.has(k)) errors.push(`${z.key}: ${sig.get(k)} و${c.id} لهما الأوزان نفسها تمامًا`);
    sig.set(k, c.id);
  }
}
for (const r of REGIONS) for (const k of r.specialties) if (!DATA[k]) errors.push(`region ${r.key}: تخصص غير موجود ${k}`);
for (const k of Object.keys(RISK_FACTORS)) if (!ids.has(k)) errors.push(`RISK_FACTORS: ${k} غير موجود`);

// ما قد يقرّره الطبيب (data/care.js): تغطية كاملة، مصادر معروفة، وبلا جرعات أو أسماء تجارية واضحة
{
  const carePath = dataDir + "care.js";
  if (!existsSync(carePath)) errors.push("data/care.js غير موجود (شغّل node tools/build_care.mjs)");
  else {
    if (!html.includes('src="data/care.js"')) errors.push("data/care.js غير مُدرج في index.html");
    const box = {}; new Function("window", "globalThis", readFileSync(carePath, "utf8"))(box, box);
    let CARE = box.MOSEL_CARE || {};
    if (ONLY) { CARE = {}; for (const f of readdirSync(dataDir + "care_src").filter(f => f.endsWith(".json"))) Object.assign(CARE, JSON.parse(readFileSync(dataDir + "care_src/" + f, "utf8"))); }
    const ORGS = new Set(["WHO","WHO_EML","NICE","CDC","FDA","EMA","ADA","ACC_AHA","ESC","ESH","GINA","GOLD","KDIGO","IDSA","ACOG","RCOG","AUA","EAU","AAP","APA","AAD","AAO","ACR","EULAR","ESHRE","ACG","AASLD","EASL","ATS","ERS","BTS","ESMO","NCCN","ASCO","ILAE","AAN","AHS","ENDO","ATA","AAOS","ACEP","ESPGHAN","AAO_HNS","ADA_DENTAL","WFSBP","ISSM","WHO_MHGAP","ASH","AAAAI"]);
    const DOSE = /\d+(\.\d+)?\s*(mg|mcg|µg|g\b|ml|iu|units?|ملغ|مجم|ملجم|مل\b|وحدة|ميكروغرام|جرام|غرام)|(مرتين|ثلاث مرات|مرة) (يوميًا|يوميا|في اليوم)|\b(bid|tid|qid|q\d+h)\b/i;
    for (const id of ids) if (!CARE[id]) errors.push(`care: ${id} بلا بيانات علاج`);
    for (const [id, k] of Object.entries(CARE)) {
      if (!ids.has(id)) { if (!ONLY) errors.push(`care: ${id} لا يطابق أي مرض`); continue; }
      if (!k.refs?.length) errors.push(`care/${id}: بلا مرجع`);
      for (const r of k.refs || []) if (!ORGS.has(r)) errors.push(`care/${id}: مرجع غير معروف ${r}`);
      if (!k.guide?.trim()) warnings.push(`care/${id}: بلا دليل إرشادي محدد`);
      // الجرعات ممنوعة في الأدوية؛ أما الرعاية الذاتية (كالتفريش مرتين يوميًا أو قاعدة 15/15 لهبوط السكر) فمسموحة
      const medTexts = (k.meds||[]).flatMap(m => [m.cls, m.ex, m.note].filter(Boolean));
      for (const t of medTexts) if (DOSE.test(t)) errors.push(`care/${id}: يبدو أنه يحتوي جرعة دواء: «${t}»`);
      for (const t of [...(k.tests||[]), ...(k.imaging||[]), ...(k.procedures||[])]) if (/\d+\s*(mg|mcg|ملغ|مجم|ملجم)/i.test(t)) errors.push(`care/${id}: جرعة في غير موضعها: «${t}»`);
      for (const m of k.meds || []) if (!m.cls?.trim()) errors.push(`care/${id}: دواء بلا فئة`);
      if (!(k.tests||[]).length && !(k.imaging||[]).length && !(k.meds||[]).length && !(k.procedures||[]).length) errors.push(`care/${id}: فارغ تمامًا`);
    }
  }
}
console.log(`✔ ${ZONES.length} تخصصًا · ${total} مرضًا · ${Object.values(DATA).reduce((a, d) => a + d.symptoms.length, 0)} عَرَضًا`);
warnings.forEach(w => console.log("⚠ " + w));
errors.forEach(e => console.error("✘ " + e));
if (errors.length) { console.error(`\n${errors.length} خطأ`); process.exit(1); }
console.log("نجحت جميع الفحوصات.");
