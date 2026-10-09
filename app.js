/*! موصل (Mosel) — © 2026 Maro Shahaly. جميع الحقوق محفوظة. يُمنع النسخ أو إعادة النشر دون إذن كتابي. */
/* =========================================================
   موصل — منطق التطبيق
   البيانات في data/conditions.js (window.MOSEL_DATA)
   ========================================================= */
(function () {
"use strict";

const { TRIAGE, ZONES, ZONE_SOURCES, DATA, REGIONS, RISK_FACTORS, version } = window.MOSEL_DATA;
const ZONE = Object.fromEntries(ZONES.map(z => [z.key, z]));

/* ---------- إعدادات ---------- */
const EMERGENCY_NUMBER = "123";                 // إسعاف مصر
const MENTAL_HOTLINE = "08008880700";           // الخط الساخن للصحة النفسية — الأمانة العامة للصحة النفسية (مصر)
const PROFILE_KEY = "moselProfile";
const TERMS_KEY = "moselTerms";
const TERMS_VERSION = "1.0";
/* شروط الاستخدام وإخلاء المسؤولية: يجب الموافقة عليها قبل أي استخدام، ويُعاد طلبها عند تغيير TERMS_VERSION */
const TERMS = [
  ["طبيعة الخدمة", "«موصل» أداة معلوماتية للتثقيف والاسترشاد الصحي العام فقط، تعرض احتمالات تقريبية مبنية على الأعراض التي يُدخلها المستخدم بنفسه. وهو ليس جهازًا طبيًا، ولا يقدّم تشخيصًا ولا وصفة علاجية ولا استشارة طبية، ولا تنشأ عن استخدامه أي علاقة بين طبيب ومريض."],
  ["ليس بديلًا عن الطبيب", "كل ما يعرضه التطبيق من أمراض وتحاليل وأشعة وأدوية وإجراءات هو للمعرفة العامة فقط. ويجب مراجعة طبيب مرخّص قبل اتخاذ أي قرار صحي، ولا يجوز تناول أي دواء أو تغيير أي علاج أو إيقافه اعتمادًا على التطبيق."],
  ["حالات الطوارئ", "في أي حالة طارئة أو عند الشك في خطورة الحالة يجب الاتصال بالإسعاف (123) أو التوجه إلى أقرب قسم طوارئ فورًا، دون الاعتماد على التطبيق أو انتظار نتيجته."],
  ["مسؤولية المستخدم", "يُقرّ المستخدم بأنه المسؤول الأول والأخير عن صحته الشخصية وعن صحة من يستخدم التطبيق نيابةً عنهم من أسرته وذويه، وعن كل قرار يتخذه أو يمتنع عنه بناءً على ما يعرضه التطبيق، وعن صحة البيانات التي يُدخلها."],
  ["إخلاء المسؤولية", "تُقدَّم المعلومات «كما هي» ودون أي ضمان صريح أو ضمني بدقتها أو اكتمالها أو ملاءمتها لحالة بعينها. وإلى أقصى حد يسمح به القانون، لا يتحمل التطبيق ولا مالكه ولا القائمون عليه ولا المساهمون فيه، من قريب أو بعيد، أي مسؤولية قانونية أو طبية أو مدنية، مباشرة أو غير مباشرة، عن أي ضرر أو خسارة أو مضاعفات تنشأ عن استخدام التطبيق أو الاعتماد عليه أو تعذّر استخدامه."],
  ["عدم المطالبة", "يتعهد المستخدم، إلى الحد الذي يسمح به القانون، بعدم إقامة أي دعوى أو شكوى أو مطالبة ضد التطبيق أو القائمين عليه بسبب استخدامه، وبتحمّل أي مطالبة يقيمها الغير بسبب مخالفته لهذه الشروط."],
  ["القاصرون", "الاستخدام مقصور على من بلغ ثمانية عشر عامًا. ومن هو دون ذلك لا يستخدمه إلا بموافقة وليّ أمره وإشرافه، ويتحمل وليّ الأمر المسؤولية كاملة."],
  ["الخصوصية", "تُحفظ بيانات المستخدم على جهازه فقط ولا تُرسل إلى أي خادم، ويستطيع حذفها في أي وقت من صفحة «عن التطبيق»."],
  ["المحتوى الطبي", "المحتوى مبني على مراجع وأدلة إرشادية دولية، وهو قيد المراجعة من أطباء مختصين، وقد يُعدَّل أو يُحذف دون إشعار مسبق."],
  ["الملكية الفكرية", "جميع حقوق التطبيق ومحتواه وتصميمه وبياناته محفوظة لمالكه. ويُمنع نسخه أو إعادة نشره أو استخدامه في منتج آخر، كليًا أو جزئيًا، دون إذن كتابي مسبق."],
  ["القانون الواجب التطبيق", "تخضع هذه الشروط لقوانين جمهورية مصر العربية، وتختص المحاكم المصرية بنظر أي نزاع ينشأ عنها."],
  ["تعديل الشروط", "يجوز تعديل هذه الشروط في أي وقت، ويُطلب من المستخدم الموافقة على النسخة الجديدة قبل مواصلة الاستخدام. واستمرار الاستخدام بعد الموافقة يعني القبول الكامل بها."]
];
const TERMS_CHECKS = [
  "قرأتُ شروط الاستخدام وفهمتها، وأوافق عليها كاملة.",
  "أُقرّ بأنني المسؤول الأول والأخير عن صحتي وصحة ذويّ، وأن «موصل» للاسترشاد فقط، ولا تقع على التطبيق أو القائمين عليه أي مسؤولية قانونية أو طبية من قريب أو بعيد.",
  "أتعهد بمراجعة طبيب مرخّص قبل أي علاج، وبالاتصال بالإسعاف (123) في حالات الطوارئ.",
  "أُقرّ بأن عمري ثمانية عشر عامًا فأكثر، أو أنني أستخدم التطبيق بموافقة وليّ أمري وإشرافه."
];
const MAX_FOLLOWUP_ROUNDS = 4;
const QUICK_ACCESS = [
  { key: "sexual", title: "الصحة الجنسية — بسرية تامة", sub: "إفرازات، قروح، ثآليل، عدوى منقولة جنسيًا؛ لا يُحفظ شيء" },
  { key: "pediatrics", title: "صحة الأطفال والرضّع", sub: "حمّى الرضيع، الجفاف، السعال، النمو والسلوك" },
  { key: "infectious", title: "الحميات والأمراض المعدية", sub: "تيفود، حمّى مالطية، بلهارسيا، جديري، تسمم غذائي" },
  { key: "hematology", title: "أمراض الدم", sub: "أنيميا، ثلاسيميا، أنيميا الفول، نزف، تضخم الغدد" },
  { key: "skin", title: "مشكلة في الجلد أو الشعر؟", sub: "حكة، طفح، حبوب، تساقط الشعر" },
  { key: "mental", title: "الصحة النفسية", sub: "قلق، اكتئاب، أرق، نوبات هلع" },
  { key: "geriatric", title: "صحة كبار السن", sub: "النسيان، التوازن، السقوط، التشوش المفاجئ" },
  { key: "congenital", title: "العيوب الخلقية والوراثية", sub: "أعراض منذ الولادة أو تاريخ عائلي" }
];
const CHRONIC_OPTIONS = ["سكر", "ضغط", "قلب", "ربو", "كلى", "كبد", "حساسية مزمنة"];

/* ---------- أيقونات ---------- */
const I = {
  pulse: '<path d="M3 12h4l2-7 4 14 3-10 2 3h3"/>',
  back: '<path d="M9 6l6 6-6 6"/>',
  chevL: '<path d="M15 18l-6-6 6-6"/>',
  chevD: '<path d="M6 9l6 6 6-6"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  alert: '<path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/>',
  phone: '<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v14z"/><path d="M20 17v4H6.5A2.5 2.5 0 014 18.5"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
  share: '<path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14"/>',
  print: '<path d="M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-6a1 1 0 011-1h16a1 1 0 011 1v6a1 1 0 01-1 1h-2"/><rect x="6" y="14" width="12" height="7"/>',
  restart: '<path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8"/><path d="M3 3v5h5"/>',
  steth: '<path d="M6 3v6a5 5 0 0010 0V3"/><path d="M11 14v2a5 5 0 0010 0v-3"/><circle cx="21" cy="11" r="2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  heart: '<path d="M12 21s-7-4.5-9.5-9C.5 8 2 4 6 4c2 0 3.5 1.2 4 2.2C10.5 5.2 12 4 14 4c4 0 5.5 4 3.5 8-2.5 4.5-9.5 9-9.5 9z"/>',
  bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'
};
const ico = (p, sw = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normAr = s => String(s || "").toLowerCase()
  .replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي");

/* =========================================================
   رسمة الجسم (SVG) — viewBox 300×700، منظر أمامي
   يمين المريض = يسار الصورة (كما في أطالس التشريح)
   ========================================================= */
const G = {
  torso: "M150 94 C128 94 104 96 94 108 C86 118 88 134 94 152 C100 176 110 200 113 222 C112 246 104 266 103 286 L105 302 C122 310 140 309 150 303 C160 309 178 310 195 302 L197 286 C196 266 188 246 187 222 C190 200 200 176 206 152 C212 134 214 118 206 108 C196 96 172 94 150 94 Z",
  neck: "M137 70 L163 70 L167 102 C156 106 144 106 133 102 Z",
  arm: "M98 105 C85 107 77 120 75 138 L60 228 C56 262 50 296 46 326 L60 328 C64 298 70 264 76 234 L98 158 Z",
  leg: "M103 282 C100 340 104 400 110 452 C105 492 108 545 117 600 L134 601 C136 552 141 500 141 452 C143 400 148 345 150 300 Z",
  hair: "M122 46 C120 22 135 13 150 13 C165 13 180 22 178 46 C174 33 162 26 150 27 C138 26 126 33 122 46 Z",
  briefs: "M103 280 C125 287 175 287 197 280 L197 300 C182 311 162 313 150 320 C138 313 118 311 103 300 Z"
};
const MIRROR = 'transform="translate(300 0) scale(-1 1)"';

function bodyFigure(id, detailed) {
  const side = `
    <path d="${G.arm}" fill="url(#${id}-limb)"/>
    <ellipse cx="52" cy="342" rx="9.5" ry="15" transform="rotate(8 52 342)" fill="url(#${id}-limb)"/>
    <path d="${G.leg}" fill="url(#${id}-limb)"/>
    <ellipse cx="124" cy="611" rx="16" ry="8.5" fill="url(#${id}-skin)"/>`;
  const sideDetail = `
    <g stroke="url(#${id}-limb)" stroke-width="4.5" stroke-linecap="round" fill="none">
      <path d="M45 352 L41 366"/><path d="M50 355 L48 371"/><path d="M55 355 L56 370"/><path d="M59 351 L62 364"/><path d="M60 334 L66 346"/>
    </g>
    <g fill="var(--skin-lo)"><circle cx="112" cy="614" r="2.6"/><circle cx="118" cy="617" r="2.6"/><circle cx="124" cy="618" r="2.6"/><circle cx="130" cy="617" r="2.6"/></g>
    <g stroke="var(--skin-line)" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55">
      <path d="M62 228 q7 6 14 2"/><path d="M116 450 q10 8 21 0"/><path d="M120 104 Q134 111 147 106"/>
      <path d="M114 150 Q130 161 146 153" opacity=".7"/><path d="M121 262 Q134 284 146 296" opacity=".6"/>
    </g>`;
  return `
    <defs>
      <radialGradient id="${id}-skin" cx="40%" cy="22%" r="85%"><stop offset="0%" stop-color="var(--skin-hi)"/><stop offset="100%" stop-color="var(--skin-lo)"/></radialGradient>
      <linearGradient id="${id}-limb" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="var(--skin-lo)"/><stop offset="50%" stop-color="var(--skin-hi)"/><stop offset="100%" stop-color="var(--skin)"/></linearGradient>
      <linearGradient id="${id}-torso" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="var(--skin-lo)"/><stop offset="35%" stop-color="var(--skin-hi)"/><stop offset="70%" stop-color="var(--skin)"/><stop offset="100%" stop-color="var(--skin-lo)"/></linearGradient>
    </defs>
    <ellipse cx="150" cy="652" rx="78" ry="10" fill="#000" opacity=".07"/>
    <g>${side}${detailed ? sideDetail : ""}</g>
    <g ${MIRROR}>${side}${detailed ? sideDetail : ""}</g>
    <path d="${G.neck}" fill="url(#${id}-limb)"/>
    <path d="${G.torso}" fill="url(#${id}-torso)"/>
    <path d="${G.briefs}" fill="#7F93A8"/>
    <ellipse cx="123" cy="50" rx="4.5" ry="8" fill="var(--skin-lo)"/><ellipse cx="177" cy="50" rx="4.5" ry="8" fill="var(--skin-lo)"/>
    <ellipse cx="150" cy="48" rx="27" ry="33" fill="url(#${id}-skin)"/>
    <path d="${G.hair}" fill="#4A3628"/>
    ${detailed ? `
    <g fill="#5A4030"><circle cx="139" cy="47" r="2.3"/><circle cx="161" cy="47" r="2.3"/></g>
    <g stroke="var(--skin-line)" fill="none" stroke-linecap="round">
      <path d="M134 40 q5 -3 10 0" stroke="#5A4030" stroke-width="1.6"/><path d="M156 40 q5 -3 10 0" stroke="#5A4030" stroke-width="1.6"/>
      <path d="M150 50 q-3 7 0 10 q2 1 3 0" stroke-width="1.4"/><path d="M142 66 q8 4 16 0" stroke-width="1.8" stroke="#B0735A"/>
      <path d="M150 108 L150 172" stroke-width="1.4" opacity=".35"/>
    </g>
    <g ${MIRROR} stroke="var(--skin-line)" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55">
      <path d="M120 104 Q134 111 147 106"/><path d="M114 150 Q130 161 146 153" opacity=".7"/><path d="M121 262 Q134 284 146 296" opacity=".6"/>
    </g>
    <circle cx="150" cy="232" r="2.6" fill="var(--skin-line)" opacity=".7"/>` : ""}`;
}

/* مواضع العلامات والتسميات في الرسم البديل (SVG) — إحداثيات viewBox 300×700 */
const SVG_GEO = {
  head: { a: [150, 52], l: [252, 40] }, chest: { a: [150, 140], l: [252, 128] }, abdomen: { a: [150, 215], l: [252, 210] },
  arm: { a: [60, 230], l: [36, 170] }, pelvis: { a: [150, 290], l: [44, 292] }, leg: { a: [128, 470], l: [40, 450] }
};

function bodyMapSvg() {
  const id = "bm";
  const r = Object.fromEntries(REGIONS.map(x => [x.key, x]));
  const reg = (key, inner) => `<g class="region" data-region="${key}" tabindex="0" role="button" aria-label="${esc(r[key].name)}" fill="${r[key].color}">${inner}</g>`;
  return `<svg viewBox="0 0 300 700" role="group" aria-label="خريطة الجسم — اضغط على موضع الألم">
    ${bodyFigure(id, true)}
    <defs>
      <clipPath id="${id}-cT"><path d="${G.torso}"/></clipPath>
      <clipPath id="${id}-cP"><path d="${G.torso}"/><path d="${G.leg}"/><path d="${G.leg}" ${MIRROR}/></clipPath>
    </defs>
    ${reg("leg", `<path d="${G.leg}"/><ellipse cx="124" cy="611" rx="16" ry="8.5"/><g ${MIRROR}><path d="${G.leg}"/><ellipse cx="124" cy="611" rx="16" ry="8.5"/></g>`)}
    ${reg("arm", `<path d="${G.arm}"/><ellipse cx="52" cy="342" rx="11" ry="17" transform="rotate(8 52 342)"/><g ${MIRROR}><path d="${G.arm}"/><ellipse cx="52" cy="342" rx="11" ry="17" transform="rotate(8 52 342)"/></g>`)}
    ${reg("head", `<ellipse cx="150" cy="50" rx="36" ry="44"/><rect x="134" y="80" width="32" height="22" rx="6"/>`)}
    ${reg("chest", `<rect x="80" y="100" width="140" height="84" clip-path="url(#${id}-cT)"/>`)}
    ${reg("abdomen", `<rect x="80" y="184" width="140" height="84" clip-path="url(#${id}-cT)"/>`)}
    ${reg("pelvis", `<rect x="90" y="268" width="120" height="58" clip-path="url(#${id}-cP)"/>`)}
    ${pulses(SVG_GEO, 5)}
  </svg>`;
}

function pulses(geo, r) {
  return `<g class="pulse-g" aria-hidden="true">${REGIONS.map((x, i) => {
    const g = geo[x.key];
    return `<line class="leader" x1="${g.a[0]}" y1="${g.a[1]}" x2="${g.l[0]}" y2="${g.l[1]}"/>
      <circle class="pulse-ring" cx="${g.a[0]}" cy="${g.a[1]}" r="${r}" style="animation-delay:${(i * .37).toFixed(2)}s"/>
      <circle class="pulse-dot" cx="${g.a[0]}" cy="${g.a[1]}" r="${r * .9}"/>`;
  }).join("")}</g>`;
}

/* =========================================================
   خريطة الجسم الواقعية (صورة فوتوغرافية)
   ---------------------------------------------------------
   الصور في assets/ بنسبة 1:2 (عرض:ارتفاع). المناطق مرسومة فوقها
   في نظام إحداثيات 100×200، فتبقى مطابقة لأي حجم شاشة.
   إن لم تتوفر الصورة يعود التطبيق تلقائيًا إلى الرسم البديل.
   ========================================================= */
const BODY_PHOTOS = { male: "assets/body-male.jpg", female: "assets/body-female.jpg" };
const PHOTO_GEO = {
  male: {
    shapes: {
      head: '<ellipse cx="50" cy="18" rx="11" ry="17"/>',
      chest: '<rect x="29" y="34" width="42" height="28" rx="7"/>',
      abdomen: '<rect x="30" y="62" width="40" height="34" rx="6"/>',
      pelvis: '<rect x="29" y="96" width="42" height="28" rx="6"/>',
      arm: '<polygon points="29,35 21,40 18,70 15,96 13,114 21,119 24,100 27,74 30,52"/><polygon points="71,35 79,40 82,70 85,96 87,114 79,119 76,100 73,74 70,52"/>',
      leg: '<polygon points="30,124 49,124 47,160 45,196 33,196 33,160"/><polygon points="70,124 51,124 53,160 55,196 67,196 67,160"/>'
    },
    geo: { head: { a: [50, 18], l: [80, 12] }, chest: { a: [50, 46], l: [86, 40] }, abdomen: { a: [50, 78], l: [86, 74] },
           arm: { a: [21, 80], l: [10, 62] }, pelvis: { a: [50, 106], l: [14, 104] }, leg: { a: [40, 160], l: [14, 152] } }
  },
  female: {
    shapes: {
      head: '<ellipse cx="50" cy="20" rx="10" ry="17"/>',
      chest: '<rect x="30" y="36" width="40" height="28" rx="7"/>',
      abdomen: '<rect x="31" y="64" width="38" height="28" rx="6"/>',
      pelvis: '<rect x="29" y="92" width="42" height="36" rx="6"/>',
      arm: '<polygon points="30,37 22,42 20,70 18,96 17,114 25,116 27,96 29,72 31,54"/><polygon points="70,37 78,42 80,70 82,96 83,114 75,116 73,96 71,72 69,54"/>',
      leg: '<polygon points="31,128 49,128 46,160 43,192 34,192 33,160"/><polygon points="69,128 51,128 54,160 57,192 66,192 67,160"/>'
    },
    geo: { head: { a: [50, 20], l: [80, 14] }, chest: { a: [50, 48], l: [86, 42] }, abdomen: { a: [50, 76], l: [86, 74] },
           arm: { a: [23, 82], l: [10, 64] }, pelvis: { a: [50, 106], l: [14, 106] }, leg: { a: [40, 162], l: [14, 156] } }
  }
};
const photoOK = {};
for (const [sex, src] of Object.entries(BODY_PHOTOS)) {
  const im = new Image();
  im.onload = () => { photoOK[sex] = true; if (state.screen === "home") render(); };
  im.src = src;
}

function bodyStage() {
  const sex = state.profile.gender === "female" ? "female" : "male";
  if (photoOK[sex]) {
    const P = PHOTO_GEO[sex];
    return `<div class="body-wrap photo">
      <img src="${BODY_PHOTOS[sex]}" alt="" draggable="false">
      <svg viewBox="0 0 100 200" preserveAspectRatio="none" role="group" aria-label="خريطة الجسم — اضغط على موضع الألم">
        ${REGIONS.map(r => `<g class="region" data-region="${r.key}" tabindex="0" role="button" aria-label="${esc(r.name)}" fill="${r.color}">${P.shapes[r.key]}</g>`).join("")}
        ${pulses(P.geo, 1.6)}
      </svg>
      ${tagLayer(P.geo, 100, 200)}
    </div>`;
  }
  return `<div class="body-wrap">${bodyMapSvg()}${tagLayer(SVG_GEO, 300, 700)}</div>`;
}

/* =========================================================
   طبقة الأعضاء الداخلية فوق الصورة الواقعية
   ---------------------------------------------------------
   الإحداثيات في نظام صورة الرجل (100×200)، وتُزاح قليلًا لصورة المرأة.
   يمين المريض = يسار الصورة. الأعضاء التناسلية تُرسم حسب جنس المستخدم فقط.
   ========================================================= */
const ORGAN_NAMES = {
  brain: "الدماغ", thyroid: "الغدة الدرقية", lungs: "الرئتان", heart: "القلب", liver: "الكبد", gallbladder: "المرارة",
  stomach: "المعدة", spleen: "الطحال", pancreas: "البنكرياس", kidney: "الكليتان", adrenal: "الغدتان الكظريتان",
  colon: "القولون (الأمعاء الغليظة)", smallint: "الأمعاء الدقيقة", appendix: "الزائدة الدودية", bladder: "المثانة",
  prostate: "البروستاتا", testes: "الخصيتان", uterus: "الرحم", ovaries: "المبيضان وقناتا فالوب", breast: "الثديان"
};
/* رسوم الأعضاء بأسلوب الرسم الطبي الواقعي: تدرّجات لونية للحجم والعمق،
   ولمعة سطحية، ونسيج دقيق، وظلال ناعمة، وتفاصيل تشريحية (أوعية، فصوص، تلافيف). */
function organDefs() {
  const rg = (id, c1, c2, c3, cx = "38%", cy = "32%") => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="75%"><stop offset="0" stop-color="${c1}"/><stop offset=".55" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></radialGradient>`;
  return `<defs>
    <filter id="og-real" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="5" numOctaves="2" seed="7" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.45 .3" result="spots"/>
      <feComposite in="spots" in2="SourceGraphic" operator="in" result="tex"/>
      <feBlend in="SourceGraphic" in2="tex" mode="multiply" result="b"/>
      <feGaussianBlur in="SourceAlpha" stdDeviation=".45" result="sh"/><feOffset in="sh" dx=".25" dy=".45" result="sho"/>
      <feFlood flood-color="#2a0d0d" flood-opacity=".45"/><feComposite in2="sho" operator="in" result="shadow"/>
      <feMerge><feMergeNode in="shadow"/><feMergeNode in="b"/></feMerge>
    </filter>
    <filter id="og-soft"><feGaussianBlur stdDeviation=".35"/></filter>
    ${rg("g-brain", "#F6C9C3", "#E3A19C", "#B86F6C")}${rg("g-thy", "#E58A97", "#C2566A", "#8E2E43")}
    ${rg("g-lung", "#F5C2C2", "#E08F97", "#A9555F")}${rg("g-heart", "#E2636F", "#B32F42", "#6E1626", "40%", "35%")}
    ${rg("g-liver", "#B9573F", "#8E3424", "#5A1B12")}${rg("g-gb", "#9DC25A", "#5E8C3A", "#355A1E")}
    ${rg("g-stom", "#F3B4A6", "#D9897A", "#A9574C")}${rg("g-spl", "#A84A5A", "#7A2E3B", "#4A1520")}
    ${rg("g-panc", "#F7D9A0", "#E8B86D", "#B9853C")}${rg("g-kid", "#C46A55", "#9C4A3C", "#5E2219")}
    ${rg("g-adr", "#F4C463", "#E0A23A", "#A8701A")}${rg("g-sint", "#F6C8B2", "#E7AE93", "#B97A5F")}
    ${rg("g-blad", "#F6E09A", "#E6C25A", "#B08D2C")}${rg("g-pros", "#D79A90", "#B5716A", "#7E433D")}
    ${rg("g-test", "#EBB8AE", "#C98A80", "#8E5249")}${rg("g-ut", "#EFA2B0", "#D27A8C", "#9C4559")}${rg("g-ov", "#F6C4CE", "#E39AA8", "#B06276")}
    <linearGradient id="g-colon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E7B08F"/><stop offset="1" stop-color="#B9785A"/></linearGradient>
  </defs>`;
}
const SHINE = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".35" filter="url(#og-soft)"/>`;
const ORGAN_SVG = {
  brain: `<path d="M42.6 10.6 C42.4 6.6 46.2 5.2 50 5.2 C53.8 5.2 57.6 6.6 57.4 10.6 C57.3 13.4 54.6 14.8 50 14.8 C45.4 14.8 42.7 13.4 42.6 10.6 Z" fill="url(#g-brain)"/>
    <path d="M50 5.6 V14.4 M44 8 q1.6-.8 2.6.6 q-1.4 1.2 0 2.4 M44.2 12 q1.4-1 2.8 0 q1.2-1.2 2.2 0 M56 8 q-1.6-.8-2.6.6 q1.4 1.2 0 2.4 M55.8 12 q-1.4-1-2.8 0 q-1.2-1.2-2.2 0 M47 6.6 q.8 1.4 2.2.8 M53 6.6 q-.8 1.4-2.2.8" stroke="#A35E5A" stroke-width=".32" fill="none" stroke-linecap="round"/>${SHINE(46.5, 7.6, 2.6, 1.1)}`,
  thyroid: `<path d="M50 29.8 L50 33.6" stroke="#B9C3CA" stroke-width="1.4"/><path d="M46.6 31.2 C46.4 29.2 48.6 29 49.4 30.5 L50.6 30.5 C51.4 29 53.6 29.2 53.4 31.2 C53.3 33.1 51.2 33.5 50 32.4 C48.8 33.5 46.7 33.1 46.6 31.2 Z" fill="url(#g-thy)"/>${SHINE(48, 30.6, .8, .4)}`,
  lungs: `<path d="M50 28.5 V38.2" stroke="#C9D2D8" stroke-width="1.5" stroke-linecap="round"/><path d="M50 37.8 L46.6 41.4 M50 37.8 L53.4 41.4" stroke="#C9D2D8" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M47 37 C42 35.8 37 38.8 35 44.8 C33 50.8 32 57 33 62 C37 63.2 43 61.2 46 59 C47.2 52 48 44 47 37 Z" fill="url(#g-lung)"/>
    <path d="M53 37 C58 35.8 63 38.8 65 44.8 C67 50.8 68 57 67 62 C63 63.2 58 62.2 55 60 C56 57 57 55 55.2 53 C54 47 54.2 42 53 37 Z" fill="url(#g-lung)"/>
    <path d="M35.6 49.5 q5 1.4 10.6-2.6 M34 56.4 q6.4 .4 12.2-1.8 M66 51.2 q-5.4 1.4-10.6-2.4" stroke="#9E4B55" stroke-width=".35" fill="none"/>
    <path d="M46.6 41.6 q-3 3-4.2 8 M46.6 41.6 q-1.4 5-1 10 M53.4 41.6 q3 3 4.2 8 M53.4 41.6 q1.6 5 1.4 9" stroke="#C47D86" stroke-width=".3" fill="none" opacity=".8"/>${SHINE(39, 43, 2.4, 3.6)}${SHINE(61, 43, 2.2, 3.4)}`,
  heart: `<path d="M50.8 46.2 C50.8 43 52.6 41.6 54.4 41.8 C56 42 56.6 43.6 56 45" stroke="#C0384B" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M50 46 L49.6 42.4" stroke="#5D7FB5" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M48.6 45.6 C45.6 45.8 44.6 50 46.8 53.2 C49 56.4 53.2 58.4 57.2 57.2 C59.4 55.2 59.4 51 57.2 48.8 C55.2 46 52 44.8 48.6 45.6 Z" fill="url(#g-heart)"/>
    <path d="M52.4 46.4 C51.4 49.6 52.6 53.6 55.6 56.6 M49 47.4 q-1.6 3 .4 6" stroke="#E9B44C" stroke-width=".45" fill="none" opacity=".85"/><path d="M52.4 46.4 C51.4 49.6 52.6 53.6 55.6 56.6" stroke="#7E1C2B" stroke-width=".25" fill="none"/>${SHINE(48.6, 48, 1.4, 1.8)}`,
  liver: `<path d="M31 58 C38 55.6 50 55.6 57.2 57.8 C58.2 60.8 55.2 63 51 64.2 C45 66.2 39 69.2 34 70.2 C30.8 67 30 62 31 58 Z" fill="url(#g-liver)"/>
    <path d="M45.6 56.4 C45 59.4 46.4 62 48.4 64.8" stroke="#5A1B12" stroke-width=".35" fill="none"/>${SHINE(37, 59.6, 4, 1.4)}`,
  gallbladder: `<path d="M40.2 64.4 C42.6 64.6 43.4 67.6 42.4 69.8 C41.4 71.4 39.4 70.8 39.4 68.8 C39.2 67 39.2 65.4 40.2 64.4 Z" fill="url(#g-gb)"/>${SHINE(40.6, 66.4, .5, .9)}`,
  stomach: `<path d="M54.6 58.6 C60 56.6 66.4 58.6 66.4 64 C66.4 70.4 62.2 74.4 56 74.2 C52.8 74.2 50.8 72.2 51.8 70 C55 70 59 69 59.8 65 C60 62 57.2 61 54.8 61.2 Z" fill="url(#g-stom)"/>
    <path d="M58 63 q3 1 5 -.4 M57.6 66.4 q3 1 5.8-.6 M55.6 70 q3 .8 6.2-1.4" stroke="#B86A5D" stroke-width=".3" fill="none"/>${SHINE(61.6, 60.6, 2, .9)}`,
  spleen: `<path d="M66 59.6 C68.6 59.8 69.8 63 69 66.4 C68.4 68.6 66 69 65.2 67 C64.6 64.6 64.8 61.4 66 59.6 Z" fill="url(#g-spl)"/>${SHINE(66.6, 62, .5, 1.1)}`,
  pancreas: `<path d="M44.6 72.4 C48.6 70.4 56 70 62.2 70.4 C63.6 71.4 62.6 73.2 60.2 73.2 C55 73.6 50 74.2 46 74.4 C43.8 74.4 43.6 72.8 44.6 72.4 Z" fill="url(#g-panc)"/>
    <path d="M45.6 73 q3 -.6 6 -.4 t6 -.4 t4 -.4" stroke="#C49048" stroke-width=".25" fill="none" stroke-dasharray=".5 .5"/>`,
  kidney: `<path d="M41.6 81.4 L43.6 92" stroke="#E6D9A8" stroke-width=".7" fill="none"/><path d="M58.4 80.4 L56.4 92" stroke="#E6D9A8" stroke-width=".7" fill="none"/>
    <path d="M40.6 71 C37.2 71.4 37 80.6 40.6 81.4 C42.8 81.8 43.2 78.4 42.2 76.4 C43.2 74.4 43 70.8 40.6 71 Z" fill="url(#g-kid)"/>
    <path d="M59.4 70 C62.8 70.4 63 79.6 59.4 80.4 C57.2 80.8 56.8 77.4 57.8 75.4 C56.8 73.4 57 69.8 59.4 70 Z" fill="url(#g-kid)"/>${SHINE(39.6, 73.6, .8, 1.6)}${SHINE(60.6, 72.6, .8, 1.6)}`,
  adrenal: `<path d="M38.8 71.6 Q40.6 68.2 42.6 71 Z M57.4 70.6 Q59.4 67.2 61.2 70 Z" fill="url(#g-adr)"/>`,
  colon: `<path d="M38 96 L37 82 C37 78 39 77 42 77 L58 77 C61 77 63 78 63 82 L63 92 C63 96 58 98 54 99 L51 101" stroke="#9C5E43" stroke-width="4.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M38 96 L37 82 C37 78 39 77 42 77 L58 77 C61 77 63 78 63 82 L63 92 C63 96 58 98 54 99 L51 101" stroke="url(#g-colon)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M38 96 L37 82 C37 78 39 77 42 77 L58 77 C61 77 63 78 63 82 L63 92" stroke="#8C5238" stroke-width="4" stroke-dasharray=".35 1.9" fill="none" opacity=".7"/>
    <path d="M36.4 94 L35.8 83 M41 76.2 L58 76.2 M64 82 L64 91" stroke="#fff" stroke-width=".5" opacity=".35" fill="none"/>`,
  smallint: `<ellipse cx="50" cy="88" rx="10" ry="7.6" fill="url(#g-sint)"/>
    <path d="M41.6 84.6 q2-2.4 4 0 t4 0 t4 0 t4 0 M41 88 q2 2.4 4 0 t4 0 t4 0 t4 0 t4 0 M42.4 91.6 q2-2.2 4 0 t4 0 t4 0 t4 0" stroke="#B9775C" stroke-width=".45" fill="none"/>${SHINE(46, 84, 3, 1)}`,
  appendix: `<path d="M38.2 97.2 q-2 2.6 .2 5" stroke="#9C5E43" stroke-width="1.9" stroke-linecap="round" fill="none"/><path d="M38.2 97.2 q-2 2.6 .2 5" stroke="#D59473" stroke-width="1.2" stroke-linecap="round" fill="none"/>`,
  bladder: `<path d="M45 105.6 C45 101.6 55 101.6 55 105.6 C55 109 52.4 110.4 50 110.4 C47.6 110.4 45 109 45 105.6 Z" fill="url(#g-blad)"/>${SHINE(48, 104, 1.6, .8)}`,
  breast: `<circle cx="42" cy="47" r="5" fill="#F2B7C2" opacity=".45"/><circle cx="58" cy="47" r="5" fill="#F2B7C2" opacity=".45"/><circle cx="42" cy="47" r="5" fill="none" stroke="#C2566A" stroke-width=".5"/><circle cx="58" cy="47" r="5" fill="none" stroke="#C2566A" stroke-width=".5"/>`
};
const REPRO_SVG = {
  male: {
    prostate: `<path d="M47.6 111.6 C47.6 110 52.4 110 52.4 111.6 C52.4 113.2 51 114 50 114 C49 114 47.6 113.2 47.6 111.6 Z" fill="url(#g-pros)"/>`,
    testes: `<path d="M48.6 113.4 C47.6 115.6 47.4 116.6 47.6 117.6 M51.4 113.4 C52.4 115.6 52.6 116.6 52.4 117.6" stroke="#B9C3CA" stroke-width=".5" fill="none"/>
      <ellipse cx="47.6" cy="120" rx="1.9" ry="2.6" fill="url(#g-test)"/><ellipse cx="52.4" cy="120" rx="1.9" ry="2.6" fill="url(#g-test)"/>${SHINE(47.2, 119, .5, .8)}${SHINE(52, 119, .5, .8)}`
  },
  female: {
    uterus: `<path d="M47 99 C46.8 95.8 53.2 95.8 53 99 C53 103 51.6 106.2 50 107.4 C48.4 106.2 47 103 47 99 Z" fill="url(#g-ut)"/>
      <path d="M50 99.4 L50 105.6" stroke="#9C4559" stroke-width=".35"/>${SHINE(48.6, 98, .9, .7)}`,
    ovaries: `<path d="M47.2 98.4 C44.6 96.2 42.4 97.2 41.4 99.4 M52.8 98.4 C55.4 96.2 57.6 97.2 58.6 99.4" stroke="#D27A8C" stroke-width=".9" fill="none" stroke-linecap="round"/>
      <path d="M41.4 99.4 l-1 .6 M41.4 99.4 l-.6 1 M58.6 99.4 l1 .6 M58.6 99.4 l.6 1" stroke="#D27A8C" stroke-width=".4"/>
      <ellipse cx="41.4" cy="101.2" rx="2" ry="1.4" fill="url(#g-ov)"/><ellipse cx="58.6" cy="101.2" rx="2" ry="1.4" fill="url(#g-ov)"/>`
  }
};
const ORGAN_CENTER = { brain: [50, 10], thyroid: [50, 31], lungs: [50, 50], heart: [52, 51], liver: [42, 63], gallbladder: [41, 67.5], stomach: [59, 66],
  spleen: [67, 64], pancreas: [53, 72], kidney: [50, 76], adrenal: [50, 70], colon: [50, 85], smallint: [50, 88], appendix: [38.5, 99], bladder: [50, 106],
  prostate: [50, 112], testes: [50, 120], uterus: [50, 101], ovaries: [50, 100], breast: [50, 47] };
const DRAW_ORDER = ["kidney", "adrenal", "lungs", "heart", "liver", "gallbladder", "spleen", "stomach", "pancreas", "colon", "smallint", "appendix", "bladder", "thyroid", "brain", "breast"];

function sexKey() { return state.profile.gender === "female" ? "female" : "male"; }
/* "repro" = الأعضاء التناسلية حسب جنس المستخدم، ولا يُرسم أبدًا عضو من الجنس الآخر */
function resolveOrgans(o) {
  return [].concat(o || []).flatMap(k => k === "repro" ? (sexKey() === "female" ? ["uterus", "ovaries"] : ["testes", "prostate"]) : [k])
    .filter(k => sexKey() === "female" ? !["prostate", "testes"].includes(k) : !["uterus", "ovaries"].includes(k));
}
/* تُرسم الأعضاء المصابة فقط — لا تظهر الأعضاء الداخلية في العموم */
function organLayer(keys) {
  const sex = sexKey(), set = new Set(keys);
  const upper = DRAW_ORDER.filter(k => set.has(k)).map(k => `<g class="organ">${ORGAN_SVG[k]}</g>`).join("");
  const repro = Object.entries(REPRO_SVG[sex]).filter(([k]) => set.has(k)).map(([, svg]) => `<g class="organ">${svg}</g>`).join("");
  const fx = sex === "female" ? x => 2.5 + x * .95 : x => x;
  const rings = keys.map(k => { const c = ORGAN_CENTER[k]; return c ? `<circle class="organ-ring" cx="${fx(c[0])}" cy="${c[1] + (sex === "female" ? 2 : 0)}" r="5"/>` : ""; }).join("");
  const t = sex === "female" ? 'transform="translate(2.5 2) scale(.95 1)"' : "";
  const tr = sex === "female" ? 'transform="translate(2.5 0) scale(.95 1)"' : "";
  return `${organDefs()}<g class="organs" filter="url(#og-real)"><g ${t}>${upper}</g><g ${tr}>${repro}</g></g>${rings}`;
}

/* بطاقة العضو المصاب في النتيجة: الصورة الواقعية + العضو بحجم كبير وواضح */
function organCard(organ) {
  const keys = resolveOrgans(organ);
  if (!keys.length) return "";
  const sex = sexKey();
  if (!photoOK[sex]) return ORGANS[keys[0]] ? organTag(keys[0]) : "";
  // قصّ الصورة حول العضو المصاب ليظهر مكبّرًا وواضحًا
  const pts = keys.map(k => ORGAN_CENTER[k]).filter(Boolean);
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length + (sex === "female" ? 2 : 0);
  const span = Math.max(64, ...pts.map(p => Math.abs(p[1] - cy) * 2 + 40));
  const w = span * .8, h = span;
  const vb = `${Math.max(0, Math.min(100 - w, cx - w / 2)).toFixed(1)} ${Math.max(0, Math.min(200 - h, cy - h / 2)).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
  return `<div class="organ photo"><svg viewBox="${vb}" role="img" aria-label="موضع ${keys.map(k => ORGAN_NAMES[k]).join(" و")} في الجسم"><image href="${BODY_PHOTOS[sex]}" x="0" y="0" width="100" height="200" preserveAspectRatio="none" opacity=".75"/>${organLayer(keys)}</svg>
    <span><b>العضو المعني: ${keys.map(k => ORGAN_NAMES[k]).join("، ")}</b><br><span class="muted small">رسم توضيحي لموضع العضو داخل الجسم (يمين المريض يظهر على يسار الصورة).</span></span></div>`;
}

const tagLayer = (geo, w, h) => `<div class="tag-layer">${REGIONS.map(r => `<button class="tag" data-region="${r.key}" style="left:${geo[r.key].l[0] / w * 100}%;top:${geo[r.key].l[1] / h * 100}%"><i style="background:${r.color}"></i>${esc(r.name)}</button>`).join("")}</div>`;

/* رسمة صغيرة لمكان العضو — نفس الجسم بالظبط عشان التناسق */
const ORGANS = {
  kidney: { label: "موضع الكليتين: في الظهر أسفل الضلوع على الجانبين", m: [{ cx: 130, cy: 214, rx: 9, ry: 13 }, { cx: 170, cy: 214, rx: 9, ry: 13 }] },
  appendix: { label: "موضع الزائدة الدودية: أسفل يمين البطن", m: [{ cx: 128, cy: 254, rx: 8, ry: 8 }] },
  gallbladder: { label: "موضع المرارة: أسفل الضلوع اليمنى تحت الكبد", m: [{ cx: 133, cy: 192, rx: 8, ry: 10 }] },
  liver: { label: "موضع الكبد: أعلى يمين البطن", m: [{ cx: 136, cy: 182, rx: 22, ry: 14 }] },
  stomach: { label: "موضع المعدة: أعلى منتصف البطن مائلًا إلى اليسار", m: [{ cx: 164, cy: 192, rx: 14, ry: 12 }] },
  heart: { label: "موضع القلب: منتصف الصدر مائلًا إلى اليسار", m: [{ cx: 158, cy: 150, rx: 13, ry: 15 }] },
  lungs: { label: "موضع الرئتين: جانبا الصدر", m: [{ cx: 127, cy: 148, rx: 13, ry: 26 }, { cx: 173, cy: 148, rx: 13, ry: 26 }] }
};
let organSeq = 0;
function organTag(key) {
  const o = ORGANS[key];
  if (!o) return "";
  const id = "og" + (organSeq++);
  const marks = o.m.map(m => `<ellipse cx="${m.cx}" cy="${m.cy}" rx="${m.rx}" ry="${m.ry}" fill="#C2414B" opacity=".9"/><ellipse cx="${m.cx}" cy="${m.cy}" rx="${m.rx + 12}" ry="${m.ry + 12}" fill="none" stroke="#E5484D" stroke-width="4" opacity=".45"/>`).join("");
  return `<div class="organ"><svg viewBox="40 0 220 660" aria-hidden="true">${bodyFigure(id, false)}${marks}</svg><span>${o.label}</span></div>`;
}

/* =========================================================
   الحالة
   ========================================================= */
let saved = null;
try { const raw = localStorage.getItem(PROFILE_KEY); if (raw) saved = JSON.parse(raw); } catch (e) { /* تخزين مقفول */ }
if (saved && !Array.isArray(saved.chronic)) saved.chronic = [];
let terms = null;
try { terms = JSON.parse(localStorage.getItem(TERMS_KEY) || "null"); } catch (e) { /* تخزين مقفول */ }
const termsOk = () => !!(terms && terms.v === TERMS_VERSION);

const state = {
  screen: !termsOk() ? "terms" : saved ? "home" : "onboarding",
  termsChecks: TERMS_CHECKS.map(() => false), termsView: false,
  profile: saved || { gender: null, age: "", height: "", weight: "", chronic: [] },
  consent: !!saved || termsOk(),
  editingProfile: false,
  region: null, zone: null,
  checked: new Set(), denied: new Set(), asked: new Set(),
  answers: {}, followup: [], round: 0,
  openCond: null, query: ""
};
const resetCase = () => { state.checked = new Set(); state.denied = new Set(); state.asked = new Set(); state.answers = {}; state.followup = []; state.round = 0; state.openCond = null; };

const $content = document.getElementById("content");
const $topbar = document.getElementById("topbar");
const $ctaBar = document.getElementById("ctaBar");
const $ctaBtn = document.getElementById("ctaBtn");

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2200);
}

/* =========================================================
   البروفايل
   ========================================================= */
const LIMITS = { age: [1, 120], height: [50, 230], weight: [3, 300] };
function fieldError(f, v) {
  if (v === "" || v == null) return null;
  const n = Number(v), [lo, hi] = LIMITS[f];
  return (!Number.isFinite(n) || n < lo || n > hi) ? `من ${lo} لـ ${hi}` : null;
}
const profileValid = p => p.gender && ["age", "height", "weight"].every(f => p[f] !== "" && !fieldError(f, p[f]));

function bmiOf(p) {
  const h = parseFloat(p.height), w = parseFloat(p.weight);
  if (!h || !w) return null;
  const v = w / Math.pow(h / 100, 2);
  let cat, color;
  if (v < 18.5) { cat = "نقص في الوزن"; color = "var(--warn-ink)"; }
  else if (v < 25) { cat = "وزن طبيعي"; color = "var(--ok-ink)"; }
  else if (v < 30) { cat = "زيادة في الوزن"; color = "var(--warn-ink)"; }
  else { cat = "سمنة"; color = "var(--danger-ink)"; }
  const pct = Math.min(Math.max((v - 15) / (40 - 15) * 100, 2), 98);
  return { value: v, text: v.toFixed(1), cat, color, pct };
}

function profileCtx(p) {
  const b = bmiOf(p);
  const chronic = p.chronic || [];
  return { age: parseFloat(p.age) || 0, sex: p.gender, bmi: b ? b.value : 0, has: c => chronic.includes(c) };
}

/* =========================================================
   محرك التقييم
   ---------------------------------------------------------
   coverage  = مجموع أوزان الأعراض المطابقة ÷ مجموع أوزان المرض
   explained = نسبة الأعراض المختارة اللي المرض بيفسرها
   denied    = أعراض اتسألت والمريض قال "لا" → بتقلل النسبة
   strength  = متوسط وزن الأعراض المطابقة ÷ 3
   النتيجة   = coverage × (0.6 + 0.4 × explained) × (0.5 + 0.5 × strength) − 0.5 × denied
   بعدين مكافأة عوامل الخطورة (بترفع بس) والسقف 95% —
   عمر الأعراض لوحدها ما تكفي لتأكيد 100%.
   ========================================================= */
function scoreZone(zoneKey) {
  const d = DATA[zoneKey];
  const ctx = profileCtx(state.profile);
  const checked = state.checked, denied = state.denied;
  const okSym = new Set(zoneSymptoms(zoneKey).map(s => s.id));
  return d.conditions.filter(sexOk).map(c => {
    const entries = Object.entries(c.weights).filter(([sid]) => okSym.has(sid));
    const total = entries.reduce((a, [, w]) => a + w, 0) || 1;
    let matched = 0, deniedW = 0, nExplained = 0;
    for (const [sid, w] of entries) {
      if (checked.has(sid)) { matched += w; nExplained++; }
      if (denied.has(sid)) deniedW += w;
    }
    const coverage = matched / total;
    const explained = checked.size ? nExplained / checked.size : 0;
    const strength = nExplained ? matched / nExplained / 3 : 0;   // متوسط وزن الأعراض المطابقة: عرض مميز (3) أقوى من عرض عام (1)
    let raw = coverage * (0.6 + 0.4 * explained) * (0.5 + 0.5 * strength) - 0.5 * (deniedW / total);
    let pct = Math.round(Math.max(0, Math.min(1, raw)) * 100);
    let reasons = [];
    if (pct > 0 && RISK_FACTORS[c.id] && ctx.age) {
      reasons = RISK_FACTORS[c.id](ctx).filter(Boolean);
      if (reasons.length) pct += Math.min(reasons.length * 5, 10);
    }
    pct = Math.min(pct, 95);
    const matchedSyms = d.symptoms.filter(s => checked.has(s.id) && c.weights[s.id]);
    const deniedSyms = d.symptoms.filter(s => denied.has(s.id) && c.weights[s.id]);
    return { ...c, pct, reasons, matchedSyms, deniedSyms };
  }).filter(c => c.pct > 0).sort((a, b) => b.pct - a.pct || (b.flag ? 1 : 0) - (a.flag ? 1 : 0));
}

const level = p => p >= 70 ? "تطابق قوي" : p >= 40 ? "تطابق متوسط" : "تطابق ضعيف";
const TRIAGE_ORDER = ["self", "doctor", "urgent", "emergency"];

function pickQuestions(zoneKey, top) {
  const d = DATA[zoneKey];
  return zoneSymptoms(zoneKey)
    .filter(s => !state.checked.has(s.id) && !state.asked.has(s.id))
    .map(s => {
      const ws = top.map(c => c.weights[s.id] || 0);
      return { ...s, spread: Math.max(...ws) - Math.min(...ws), hits: ws.filter(Boolean).length };
    })
    .filter(s => s.spread > 0)
    .sort((a, b) => b.spread - a.spread || a.hits - b.hits)
    .slice(0, 3);
}

function evaluate() {
  const scored = scoreZone(state.zone);
  const top = scored.slice(0, 3);
  const ambiguous = top.length >= 2 && (top[0].pct - top[1].pct) < 25;
  if (ambiguous && state.round < MAX_FOLLOWUP_ROUNDS) {
    const qs = pickQuestions(state.zone, top);
    if (qs.length) {
      state.followup = qs; state.round++;
      go("followup"); return;
    }
  }
  state.openCond = null;
  go("results");
}

function answer(id, val) {
  state.answers[id] = state.answers[id] === val ? undefined : val;
  render();
}
function commitAnswers() {
  for (const q of state.followup) {
    const a = state.answers[q.id];
    state.asked.add(q.id);
    state.checked.delete(q.id); state.denied.delete(q.id);
    if (a === "yes") state.checked.add(q.id);
    else if (a === "no") state.denied.add(q.id);
  }
  evaluate();
}

/* =========================================================
   التنقل
   ========================================================= */
function go(screen) { state.screen = screen; render(); }
function back() {
  const s = state.screen;
  if (s === "terms") { state.termsView = false; go(state.prev || "about"); }
  else if (s === "about" || s === "stages") go(state.prev || "home");
  else if (s === "results" || s === "followup") { state.round = 0; state.asked = new Set(); state.denied = new Set(); state.answers = {}; go("symptoms"); }
  else if (s === "symptoms") { resetCase(); state.zone = null; go(state.region ? "sections" : "home"); }
  else if (s === "sections") { state.region = null; go("home"); }
  else go("home");
}
function pickRegion(key) { state.region = key; go("sections"); }
function pickZone(key, preset) {
  state.zone = key; resetCase();
  if (preset) state.checked.add(preset);
  go("symptoms");
}
function restart() { resetCase(); state.zone = null; state.region = null; state.query = ""; go("home"); }
/* الفصل بين الذكر والأنثى: لا يظهر للمستخدم عَرَض أو مرض خاص بالجنس الآخر */
const sexOk = x => !x.sex || !state.profile.gender || x.sex === state.profile.gender;
const zoneSymptoms = k => DATA[k].symptoms.filter(sexOk);
function allowedZone(k) {
  const z = ZONE[k];
  return !z.sex || !state.profile.gender || z.sex === state.profile.gender;
}

/* =========================================================
   الشريط العلوي
   ========================================================= */
const STEPS = ["الموضع", "التخصص", "الأعراض", "النتيجة"];
function stepIndex() {
  return { sections: 1, symptoms: 2, followup: 2, results: 3 }[state.screen];
}
function renderTopbar() {
  if (state.screen === "onboarding" || (state.screen === "terms" && !state.termsView)) { $topbar.hidden = true; return; }
  $topbar.hidden = false;
  if (state.screen === "home") {
    $topbar.innerHTML = `<div class="bar-row">
      <div class="brand"><div class="logo">${ico(I.pulse, 2.4).replace('stroke="currentColor"', 'stroke="#fff"')}</div>
        <div><div class="brand-name">موصل</div><div class="brand-sub">حدّد موضع الألم واعرف الطبيب المناسب</div></div></div>
      <button class="icon-btn" data-act="about" aria-label="عن موصل والمصادر">${ico(I.info)}</button>
    </div>`;
    return;
  }
  const z = ZONE[state.zone], r = REGIONS.find(x => x.key === state.region);
  const title = {
    sections: `اختر التخصص — ${r ? r.name : ""}`,
    symptoms: z ? z.name : "",
    followup: "أسئلة للتأكد",
    results: "النتيجة",
    about: "عن موصل والمصادر",
    stages: "حاسبة المراحل", terms: "شروط الاستخدام"
  }[state.screen] || "";
  const si = stepIndex();
  $topbar.innerHTML = `<div class="bar-row">
      <button class="icon-btn" data-act="back" aria-label="رجوع">${ico(I.back)}</button>
      <div class="bar-title">${esc(title)}</div>
      ${state.screen === "results" ? `<button class="icon-btn" data-act="home" aria-label="الرئيسية">${ico(I.home)}</button>` : ""}
    </div>
    ${si != null ? `<div class="stepper" aria-hidden="true">${STEPS.map((_, i) => `<i class="${i <= si ? "on" : ""}"></i>`).join("")}</div>
    <div class="step-caption"><span>خطوة ${si + 1} من ${STEPS.length}: ${STEPS[si]}</span>${state.screen === "followup" ? `<span>جولة ${state.round} من ${MAX_FOLLOWUP_ROUNDS}</span>` : ""}</div>` : ""}`;
}

function setCta(text, onClick, disabled) {
  if (!text) { $ctaBar.hidden = true; return; }
  $ctaBar.hidden = false;
  $ctaBtn.innerHTML = text;
  $ctaBtn.disabled = !!disabled;
  $ctaBtn.onclick = onClick;
}

/* =========================================================
   الشاشات
   ========================================================= */
function renderTerms() {
  const view = state.termsView;
  const all = state.termsChecks.every(Boolean);
  $content.innerHTML = `<div class="fade-in terms">
    <div class="onb-hero"><div class="brand"><div class="logo">${ico(I.pulse, 2.4)}</div><div class="brand-name">موصل</div></div>
      <h1>شروط الاستخدام وإخلاء المسؤولية</h1>
      <p>${view ? `وافقت على هذه الشروط (الإصدار ${TERMS_VERSION})${terms && terms.at ? " بتاريخ " + esc(new Date(terms.at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })) : ""}.` : "يُرجى قراءة الشروط التالية بعناية. لا يمكن استخدام التطبيق دون الموافقة عليها."}</p></div>
    <ol class="terms-list">${TERMS.map(([h, t]) => `<li><b>${esc(h)}:</b> ${esc(t)}</li>`).join("")}</ol>
    ${view ? `<div style="text-align:center;margin-top:12px"><button class="btn btn-ghost" data-act="back">رجوع</button></div>` : `
    <div class="terms-checks">${TERMS_CHECKS.map((t, i) => `<label class="consent"><input type="checkbox" data-term="${i}" ${state.termsChecks[i] ? "checked" : ""}><span>${esc(t)}</span></label>`).join("")}</div>
    <p class="small muted" id="terms-hint" style="text-align:center">${all ? "شكرًا لك. اضغط «أوافق وأتابع»." : "يجب تحديد جميع الإقرارات للمتابعة."}</p>
    <div style="text-align:center"><button class="link-btn" data-act="decline">لا أوافق</button></div>`}
  </div>`;
  if (view) setCta(null); else setCta("أوافق وأتابع", acceptTerms, !all);
}
function acceptTerms() {
  if (!state.termsChecks.every(Boolean)) return;
  terms = { v: TERMS_VERSION, at: new Date().toISOString(), checks: TERMS_CHECKS.length };
  try { localStorage.setItem(TERMS_KEY, JSON.stringify(terms)); } catch (e) { /* ignore */ }
  state.consent = true;
  go(saved || profileValid(state.profile) ? "home" : "onboarding");
}

function renderOnboarding() {
  const p = state.profile;
  const fld = (f, label, unit, ph) => {
    const e = fieldError(f, p[f]);
    return `<div class="num"><label for="f-${f}">${label}</label>
      <input id="f-${f}" type="number" inputmode="numeric" placeholder="${ph}" value="${esc(p[f])}" data-field="${f}" aria-invalid="${!!e}" aria-describedby="u-${f}">
      <div class="unit" id="u-${f}">${e ? `<span class="err">${e}</span>` : unit}</div></div>`;
  };
  $content.innerHTML = `<div class="fade-in">
    <div class="onb-hero">
      <div class="brand"><div class="logo">${ico(I.pulse, 2.4)}</div><div class="brand-name">موصل</div></div>
      <h1>${state.editingProfile ? "تعديل بياناتك" : "اعرف دلالة أعراضك والطبيب المناسب لحالتك"}</h1>
      <p>ثلاث خطوات: حدّد موضع الألم، واختر أعراضك، واحصل على احتمالات مرتبة مع مستوى الاستعجال والتخصص المناسب.</p>
      <div class="trust-row">
        <span>${ico(I.lock)} بياناتك على جهازك فقط</span>
        <span>${ico(I.book)} رموز ICD-10 ومراجع</span>
        <span>${ico(I.clock)} أقل من دقيقتين</span>
      </div>
    </div>
    <div class="field"><span class="flabel" id="lg">الجنس</span>
      <div class="seg" role="group" aria-labelledby="lg">
        <button data-gender="male" aria-pressed="${p.gender === "male"}">ذكر</button>
        <button data-gender="female" aria-pressed="${p.gender === "female"}">أنثى</button>
      </div></div>
    <div class="field"><div class="nums">
      ${fld("age", "العمر", "سنة", "35")}${fld("height", "الطول", "سم", "170")}${fld("weight", "الوزن", "كجم", "70")}
    </div></div>
    <div class="field"><span class="flabel" id="lc">الأمراض المزمنة <span class="muted small">(اختياري — تزيد دقة الترشيح)</span></span>
      <div class="chips" role="group" aria-labelledby="lc">${CHRONIC_OPTIONS.map(c => `<button class="chip" data-chronic="${esc(c)}" aria-pressed="${p.chronic.includes(c)}">${esc(c)}</button>`).join("")}</div></div>
    ${state.editingProfile || termsOk() ? "" : `<label class="consent"><input type="checkbox" id="consent" ${state.consent ? "checked" : ""}>
      <span>أُقرّ بأن «موصل» <b>أداة توجيه أولية وليس تشخيصًا طبيًا</b>، ولا يغني عن زيارة الطبيب، وفي الطوارئ سأتصل بالإسعاف ${EMERGENCY_NUMBER}.</span></label>`}
    ${state.editingProfile ? `<div style="text-align:center;margin-top:8px"><button class="link-btn" data-act="cancel-edit">رجوع دون حفظ</button></div>` : ""}
  </div>`;
  updateOnboardCta();
}
function updateOnboardCta() {
  const ok = profileValid(state.profile) && (state.editingProfile || state.consent);
  setCta(state.editingProfile ? "حفظ التعديلات" : "ابدأ الآن", submitProfile, !ok);
}
function submitProfile() {
  if (!profileValid(state.profile)) return;
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(state.profile)); } catch (e) { /* ignore */ }
  const wasEditing = state.editingProfile;
  state.editingProfile = false;
  go("home");
  if (wasEditing) toast("حُفظت بياناتك");
}

function renderHome() {
  const p = state.profile, b = bmiOf(p);
  const chronic = (p.chronic || []);
  const quick = QUICK_ACCESS.filter(q => allowedZone(q.key)).map(q => `
    <button class="quick" data-zone="${q.key}"><span class="qi">${ico(ZONE[q.key].icon)}</span>
      <span class="t"><b>${q.title}</b><span>${q.sub}</span></span>${ico(I.chevL).replace("<svg", '<svg class="chev"')}</button>`).join("");

  $content.innerHTML = `<div class="fade-in">
    <div class="card">
      <div class="profile-strip">
        <div class="avatar">${ico(I.user)}</div>
        <div class="meta"><b>${p.gender === "male" ? "ذكر" : "أنثى"} · ${esc(p.age)} سنة</b>
          <span class="muted small">${esc(p.height)} سم · ${esc(p.weight)} كجم${chronic.length ? " · " + chronic.map(esc).join("، ") : ""}</span></div>
        <button class="btn btn-ghost" style="padding:8px 12px;font-size:13px" data-act="edit">تعديل</button>
      </div>
      ${b ? `<div class="bmi"><div class="bmi-val">${b.text}<small>مؤشر كتلة الجسم</small></div>
        <div style="flex:1"><div class="bmi-scale" role="img" aria-label="مؤشر كتلة الجسم ${b.text}: ${b.cat}"><div class="bmi-mark" style="right:${b.pct}%"></div></div>
        <div class="bmi-cat" style="color:${b.color};margin-top:6px">${b.cat}</div></div></div>` : ""}
    </div>

    <div class="search" role="search">
      ${ico(I.search)}
      <label for="q" class="sr-only">ابحث عن عرض</label>
      <input id="q" type="search" placeholder="ابحث عن عرض… مثل: حرقان، دوخة، ألم في الصدر" value="${esc(state.query)}" autocomplete="off">
      <div id="qres" aria-live="polite"></div>
    </div>

    <div class="stage">
      <div class="stage-head"><b>أين تشعر بالألم؟</b><span>اضغط على الموضع في الجسم</span></div>
      ${bodyStage()}
    </div>

    <button class="quick stages-card" data-act="stages"><span class="qi">${ico(I.clock)}</span>
      <span class="t"><b>اعرف مرحلة السكري والضغط والكلى</b><span>أدخل نتائج تحاليلك وقياساتك لتعرف درجتها وفق الإرشادات الدولية</span></span>${ico(I.chevL).replace("<svg", '<svg class="chev"')}</button>
    <div class="label">أو اختر مباشرة دون تحديد موضع</div>
    ${quick}

    <details class="redflags">
      <summary>${ico(I.alert)}علامات الخطر — اتصل بالإسعاف ${EMERGENCY_NUMBER} فورًا${ico(I.chevD).replace("<svg", '<svg class="chev"')}</summary>
      <ul>
        <li>ألم أو ضغط في الصدر يستمر أكثر من 15 دقيقة، أو يمتد إلى الذراع أو الفك مع عرق بارد</li>
        <li>اعوجاج مفاجئ في الوجه، أو ضعف أو خدر في جانب واحد من الجسم، أو صعوبة في الكلام</li>
        <li>صعوبة شديدة في التنفس، أو تورّم في الشفتين أو اللسان</li>
        <li>نزيف شديد لا يتوقف، أو قيء دموي، أو براز أسود</li>
        <li>إغماء أو تشنجات أو تشوّش مفاجئ في الوعي</li>
        <li>أفكار عن إيذاء النفس</li>
      </ul>
      <a class="btn btn-danger btn-block" href="tel:${EMERGENCY_NUMBER}">${ico(I.phone)} اتصل بالإسعاف ${EMERGENCY_NUMBER}</a>
    </details>

    <div class="disclaimer">${ico(I.shield)}<span>«موصل» أداة توجيه أولية وليس تشخيصًا طبيًا؛ فالنتائج مبنية على الأعراض التي تختارها وعلى مراجع طبية عامة، والقرار النهائي للطبيب. <button class="link-btn" style="padding:0" data-act="about">كيف يعمل؟</button></span></div>
    <div class="foot">الإصدار ${version} · جميع الحقوق محفوظة © 2026 موصل</div>
  </div>`;
  setCta(null);
  renderSearch();
}

function renderSearch() {
  const box = document.getElementById("qres");
  if (!box) return;
  const q = normAr(state.query.trim());
  if (q.length < 2) { box.innerHTML = ""; return; }
  const words = q.split(/\s+/).filter(Boolean);
  const hits = [];
  for (const z of ZONES) {
    if (!allowedZone(z.key)) continue;
    for (const s of zoneSymptoms(z.key)) {
      const n = normAr(s.label);
      if (words.every(w => n.includes(w))) hits.push({ z, s, i: n.indexOf(words[0]) });
    }
    for (const c of DATA[z.key].conditions.filter(sexOk)) {
      const n = normAr(c.name + " " + c.en);
      if (words.every(w => n.includes(w))) hits.push({ z, c, i: -1 });
    }
  }
  hits.sort((a, b) => (a.c ? 1 : 0) - (b.c ? 1 : 0) || a.i - b.i);
  const hl = label => {
    // تمييز أول كلمة متطابقة
    const n = normAr(label), i = n.indexOf(words[0]);
    if (i < 0) return esc(label);
    return esc(label.slice(0, i)) + "<mark>" + esc(label.slice(i, i + words[0].length)) + "</mark>" + esc(label.slice(i + words[0].length));
  };
  box.innerHTML = `<div class="results-pop">${hits.length ? hits.slice(0, 8).map(h => h.s
    ? `<button data-zone="${h.z.key}" data-preset="${h.s.id}"><span>${hl(h.s.label)}</span><span class="z">${esc(h.z.name)}</span></button>`
    : `<button data-zone="${h.z.key}"><span>${ico(I.book).replace("<svg", '<svg style="width:16px;height:16px;flex:0 0 auto;color:var(--ink-3)"')} ${hl(h.c.name)}</span><span class="z">${esc(h.z.name)}</span></button>`
  ).join("") : `<div class="empty">لم نجد نتائج لـ«${esc(state.query)}». جرّب كلمة أخرى أو اضغط على موضع الألم في الجسم.</div>`}</div>`;
}

function renderSections() {
  const r = REGIONS.find(x => x.key === state.region);
  const zones = r.specialties.filter(allowedZone);
  $content.innerHTML = `<div class="fade-in">
    <h1 class="h1">${esc(r.name)}: أي التخصصات أقرب إلى شكواك؟</h1>
    <p class="lead">اختر التخصص الأقرب إلى شكواك. إن لم تكن متأكدًا فابدأ بالأول، ويمكنك الرجوع لاحقًا.</p>
    <div class="zone-grid">${zones.map(k => {
      const z = ZONE[k];
      return `<button class="zone" data-zone="${k}"><span class="zi">${ico(z.icon)}</span><b>${esc(z.name)}</b>
        <small>${DATA[k].conditions.filter(sexOk).length} حالة · ${zoneSymptoms(k).length} عَرَضًا</small>${statusBadge(z)}</button>`;
    }).join("")}</div>
  </div>`;
  setCta(null);
}
const statusBadge = z => z.status === "validated"
  ? `<span class="badge ok">${ico(I.check, 3)}مُراجَع وفق مصادر</span>`
  : `<span class="badge pending">${ico(I.clock)}قيد المراجعة الطبية</span>`;

function symButton(s, attr) {
  return `<button class="sym" role="checkbox" aria-checked="${state.checked.has(s.id)}" ${attr}="${s.id}">
    <span class="box">${ico(I.check, 3)}</span><span class="txt">${esc(s.label)}</span>${s.red ? `<span class="rf">علامة خطر</span>` : ""}</button>`;
}

function renderSymptoms() {
  const d = DATA[state.zone], z = ZONE[state.zone];
  $content.innerHTML = `<div class="fade-in">
    <h1 class="h1">ما الأعراض التي تشعر بها؟</h1>
    <p class="lead">اختر كل ما ينطبق عليك؛ فكلما كان اختيارك أدق كانت النتيجة أدق.</p>
    ${z.status !== "validated" ? `<div class="info-note">${ico(I.info)}<span>هذا القسم ما زال قيد المراجعة الطبية؛ فاستخدم النتيجة توجيهًا مبدئيًا فقط.</span></div>` : ""}
    <div role="group" aria-label="الأعراض">${zoneSymptoms(state.zone).map(s => symButton(s, "data-sym")).join("")}</div>
  </div>`;
  const n = state.checked.size;
  setCta(n ? `اعرض النتيجة (${n} ${n === 1 ? "عَرَض" : "أعراض"})` : "اختر عَرَضًا واحدًا على الأقل", evaluate, !n);
}

function renderFollowup() {
  $content.innerHTML = `<div class="fade-in">
    <h1 class="h1">أسئلة قليلة للتمييز بين الاحتمالات</h1>
    <div class="info-note">${ico(I.bulb)}<span>هناك أكثر من احتمال متقارب، وإجابتك — حتى لو كانت «لا» — تساعدنا على استبعاد غير المناسب.</span></div>
    ${state.followup.map(q => {
      const a = state.answers[q.id];
      return `<div class="q"><p>${esc(q.label)}${q.red ? ` <span class="badge pending" style="background:var(--danger-bg);color:var(--danger-ink)">علامة خطر</span>` : ""}</p>
        <div class="opts" role="group" aria-label="${esc(q.label)}">
          <button class="yes" data-ans="yes" data-q="${q.id}" aria-pressed="${a === "yes"}">نعم</button>
          <button class="no" data-ans="no" data-q="${q.id}" aria-pressed="${a === "no"}">لا</button>
          <button class="unsure" data-ans="unsure" data-q="${q.id}" aria-pressed="${a === "unsure"}">لست متأكدًا</button>
        </div></div>`;
    }).join("")}
    <div style="text-align:center"><button class="link-btn" data-act="skip">تخطَّ واعرض النتيجة الآن</button></div>
  </div>`;
  setCta("حدِّث النتيجة", commitAnswers, false);
}

/* ما قد يقرّره الطبيب: من data/care.js — فحوصات وأشعة وأدوية (فئات بلا جرعات) وإجراءات، مع الدليل الإرشادي */
const CARE = window.MOSEL_CARE || {};
const GUIDE_ORGS = {
  WHO: ["منظمة الصحة العالمية", "https://www.who.int/publications/who-guidelines"],
  WHO_EML: ["قائمة الأدوية الأساسية — WHO", "https://list.essentialmeds.org/"],
  WHO_MHGAP: ["برنامج الصحة النفسية mhGAP — WHO", "https://www.who.int/teams/mental-health-and-substance-use/treatment-care/mental-health-gap-action-programme"],
  NICE: ["المعهد البريطاني للتميز الصحي NICE", "https://www.nice.org.uk/guidance"],
  CDC: ["مراكز مكافحة الأمراض الأمريكية CDC", "https://www.cdc.gov/"],
  FDA: ["هيئة الغذاء والدواء الأمريكية FDA", "https://www.fda.gov/drugs"],
  EMA: ["وكالة الأدوية الأوروبية EMA", "https://www.ema.europa.eu/en/medicines"],
  ADA: ["الجمعية الأمريكية للسكري ADA", "https://professional.diabetes.org/standards-of-care"],
  ACC_AHA: ["الكلية الأمريكية لأمراض القلب ACC/AHA", "https://www.acc.org/guidelines"],
  ESC: ["الجمعية الأوروبية لأمراض القلب ESC", "https://www.escardio.org/Guidelines"],
  ESH: ["الجمعية الأوروبية لارتفاع ضغط الدم ESH", "https://www.eshonline.org/guidelines/"],
  GINA: ["المبادرة العالمية للربو GINA", "https://ginasthma.org/reports/"],
  GOLD: ["المبادرة العالمية للانسداد الرئوي GOLD", "https://goldcopd.org/"],
  KDIGO: ["KDIGO — أمراض الكلى", "https://kdigo.org/guidelines/"],
  IDSA: ["جمعية الأمراض المعدية الأمريكية IDSA", "https://www.idsociety.org/practice-guideline/practice-guidelines/"],
  ACOG: ["الكلية الأمريكية للنساء والتوليد ACOG", "https://www.acog.org/clinical"],
  RCOG: ["الكلية الملكية للنساء والتوليد RCOG", "https://www.rcog.org.uk/guidance/"],
  AUA: ["الجمعية الأمريكية للمسالك البولية AUA", "https://www.auanet.org/guidelines-and-quality/guidelines"],
  EAU: ["الجمعية الأوروبية للمسالك البولية EAU", "https://uroweb.org/guidelines"],
  AAP: ["الأكاديمية الأمريكية لطب الأطفال AAP", "https://publications.aap.org/pediatrics"],
  APA: ["الجمعية الأمريكية للطب النفسي APA", "https://www.psychiatry.org/psychiatrists/practice/clinical-practice-guidelines"],
  AAD: ["الأكاديمية الأمريكية للأمراض الجلدية AAD", "https://www.aad.org/member/clinical-quality/guidelines"],
  AAO: ["الأكاديمية الأمريكية لطب العيون AAO", "https://www.aao.org/education/preferred-practice-patterns"],
  AAO_HNS: ["الأكاديمية الأمريكية للأنف والأذن والحنجرة", "https://www.entnet.org/quality-practice/quality-products/clinical-practice-guidelines/"],
  ACR: ["الكلية الأمريكية للروماتيزم ACR", "https://rheumatology.org/clinical-practice-guidelines"],
  EULAR: ["الرابطة الأوروبية للروماتيزم EULAR", "https://www.eular.org/recommendations"],
  ESHRE: ["الجمعية الأوروبية للتكاثر البشري ESHRE", "https://www.eshre.eu/Guidelines-and-Legal"],
  ACG: ["الكلية الأمريكية لأمراض الجهاز الهضمي ACG", "https://gi.org/guidelines/"],
  AASLD: ["الجمعية الأمريكية لأمراض الكبد AASLD", "https://www.aasld.org/practice-guidelines"],
  EASL: ["الرابطة الأوروبية لدراسة الكبد EASL", "https://easl.eu/publications/clinical-practice-guidelines/"],
  ATS: ["جمعية الصدر الأمريكية ATS", "https://www.thoracic.org/statements/"],
  ERS: ["الجمعية الأوروبية للجهاز التنفسي ERS", "https://www.ersnet.org/guidelines/"],
  BTS: ["جمعية الصدر البريطانية BTS", "https://www.brit-thoracic.org.uk/quality-improvement/guidelines/"],
  ESMO: ["الجمعية الأوروبية للأورام ESMO", "https://www.esmo.org/guidelines"],
  NCCN: ["الشبكة الأمريكية الشاملة للسرطان NCCN", "https://www.nccn.org/guidelines/patients"],
  ASCO: ["الجمعية الأمريكية لعلاج الأورام ASCO", "https://www.asco.org/practice-patients/guidelines"],
  ILAE: ["الرابطة الدولية لمكافحة الصرع ILAE", "https://www.ilae.org/guidelines"],
  AAN: ["الأكاديمية الأمريكية للأعصاب AAN", "https://www.aan.com/guidelines"],
  AHS: ["الجمعية الأمريكية للصداع AHS", "https://americanheadachesociety.org/"],
  ENDO: ["جمعية الغدد الصماء Endocrine Society", "https://www.endocrine.org/clinical-practice-guidelines"],
  ATA: ["الجمعية الأمريكية للغدة الدرقية ATA", "https://www.thyroid.org/professionals/ata-professional-guidelines/"],
  AAOS: ["الأكاديمية الأمريكية لجراحي العظام AAOS", "https://www.aaos.org/quality/quality-programs/"],
  ACEP: ["الكلية الأمريكية لأطباء الطوارئ ACEP", "https://www.acep.org/patient-care/clinical-policies"],
  ESPGHAN: ["الجمعية الأوروبية لجهاز هضم الأطفال ESPGHAN", "https://www.espghan.org/knowledge-center/publications"],
  ADA_DENTAL: ["جمعية طب الأسنان الأمريكية", "https://www.ada.org/resources/research/science-and-research-institute"],
  WFSBP: ["الاتحاد العالمي للطب النفسي البيولوجي WFSBP", "https://www.wfsbp.org/educational-activities/wfsbp-treatment-guideline-and-consensus-papers/"],
  ISSM: ["الجمعية الدولية للطب الجنسي ISSM", "https://www.issm.info/"],
  ASH: ["الجمعية الأمريكية لأمراض الدم ASH", "https://www.hematology.org/education/clinicians/guidelines-and-quality-care/clinical-practice-guidelines"],
  AAAAI: ["الأكاديمية الأمريكية للحساسية والمناعة AAAAI", "https://www.aaaai.org/allergist-resources/statements-practice-parameters"]
};
function careBlock(c) {
  const k = CARE[c.id];
  if (!k) return "";
  const li = arr => arr.map(x => `<li>${esc(x)}</li>`).join("");
  const grp = (title, icon, body) => body ? `<div class="care-g"><h4>${ico(icon)}${title}</h4>${body}</div>` : "";
  const meds = (k.meds || []).map(m => `<li><b>${esc(m.cls)}</b>${m.ex ? `<span class="ex" dir="ltr">${m.ex.split(/\s*,\s*/).map(n => `<a href="https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?v%3Aproject=medlineplus&v%3Asources=medlineplus-bundle&query=${encodeURIComponent(n)}" target="_blank" rel="noopener noreferrer">${esc(n)}</a>`).join("، ")}</span>` : ""}${m.note ? `<small>${esc(m.note)}</small>` : ""}</li>`).join("");
  const orgs = (k.refs || []).filter(r => GUIDE_ORGS[r]);
  return `<details class="care"${c.triage === "emergency" ? "" : ""}><summary>${ico(I.steth)}ما قد يقرّره الطبيب: الفحوصات والعلاج</summary>
    <p class="care-warn">${ico(I.alert)}<span>للمعرفة والنقاش مع طبيبك فقط. <b>لا تتناول أي دواء دون وصفة طبية</b>؛ الاختيار والجرعة يحددهما الطبيب حسب حالتك وأدويتك الأخرى والحمل والرضاعة.</span></p>
    ${grp("التحاليل", I.list, k.tests && k.tests.length ? `<ul>${li(k.tests)}</ul>` : "")}
    ${grp("الأشعة والتصوير", I.info, k.imaging && k.imaging.length ? `<ul>${li(k.imaging)}</ul>` : "")}
    ${grp("الأدوية المعتمدة (فئات وأسماء علمية دون جرعات)", I.shield, meds ? `<ul class="meds">${meds}</ul>` : "")}
    ${grp("الإجراءات والعلاجات غير الدوائية", I.steth, k.procedures && k.procedures.length ? `<ul>${li(k.procedures)}</ul>` : "")}
    ${grp("ما يمكنك فعله بنفسك", I.user, k.selfcare && k.selfcare.length ? `<ul>${li(k.selfcare)}</ul>` : "")}
    <div class="care-src">${k.guide ? `<div>الدليل الإرشادي: <a href="https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(k.guide)}" target="_blank" rel="noopener noreferrer" dir="ltr">${esc(k.guide)}</a></div>` : ""}
      ${orgs.length ? `<div class="orgs">${orgs.map(r => `<a href="${GUIDE_ORGS[r][1]}" target="_blank" rel="noopener noreferrer">${esc(GUIDE_ORGS[r][0])}</a>`).join("")}</div>` : ""}
      <small>${k.reviewed ? `راجعه: ${esc(k.reviewed)}` : "قيد المراجعة من أطباء مختصين"}</small></div>
  </details>`;
}

/* المراجع: روابط بحث مباشر في مصادر موثوقة (مابتتكسرش) + كود ICD-10 */
function refsFor(c) {
  const q = encodeURIComponent(c.en);
  const list = [
    { name: `ICD-10 · ${c.icd10}`, src: "منظمة الصحة العالمية (WHO)", url: `https://icd.who.int/browse10/2019/en#/${c.icd10}` },
    { name: "MedlinePlus", src: "المكتبة الوطنية الأمريكية للطب (NIH)", url: `https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?v%3Aproject=medlineplus&v%3Asources=medlineplus-bundle&query=${q}` },
    { name: "NHS Health A–Z", src: "هيئة الصحة البريطانية", url: `https://www.nhs.uk/search/results?q=${q}` },
    { name: "Mayo Clinic", src: "مايو كلينك", url: `https://www.mayoclinic.org/search/search-results?q=${q}` },
    { name: "StatPearls", src: "NCBI Bookshelf — مرجع للأطباء", url: `https://www.ncbi.nlm.nih.gov/books/?term=${q}+StatPearls` }
  ];
  if (c.cui) list.push({ name: `UMLS · ${c.cui}`, src: "Unified Medical Language System", url: `https://uts.nlm.nih.gov/uts/umls/concept/${c.cui}` });
  return `<details class="refs"><summary>${ico(I.book)}المراجع والرموز (${list.length})</summary><ul>
    ${list.map(r => `<li>${ico(I.ext)}<a href="${r.url}" target="_blank" rel="noopener noreferrer">${esc(r.name)}</a><small>${esc(r.src)}</small></li>`).join("")}
  </ul></details>`;
}

function condCard(c, rank, isTop) {
  const open = isTop || state.openCond === c.id;
  const reviewPending = ZONE[state.zone].status !== "validated" || c.review === "pending";
  return `<article class="cond ${isTop ? "top" : ""} ${c.flag ? "flag" : ""} ${open ? "open" : ""}">
    <${isTop ? "div" : "button"} class="cond-head" ${isTop ? "" : `data-open="${c.id}" aria-expanded="${open}"`}>
      <div class="kicker">
        <span class="rank">${isTop ? "الاحتمال الأقرب" : "#" + rank}</span>
        <span class="badge code">ICD-10 ${esc(c.icd10)}</span>
        ${c.flag ? `<span class="badge" style="background:var(--danger-bg);color:var(--danger-ink)">${ico(I.alert)}قد تكون طارئة</span>` : ""}
        ${!isTop ? ico(I.chevD).replace("<svg", '<svg class="expand" style="margin-inline-start:auto"') : ""}
      </div>
      <h3 class="cond-name">${esc(c.name)}</h3>
      <div class="cond-en">${esc(c.en)}</div>
      <div class="meter"><div class="track"><div class="fill" style="width:${c.pct}%"></div></div><span class="pct">${c.pct}%</span><span class="lvl">${level(c.pct)}</span></div>
    </${isTop ? "div" : "button"}>
    ${open ? `<div class="cond-body">
      ${c.reasons.length ? `<span class="risk">${ico(I.user)}ارتفعت قليلًا بسبب: ${c.reasons.map(esc).join("، ")}</span>` : ""}
      ${c.organ ? organCard(c.organ) : ""}
      <div class="blk why"><span class="bl">${ico(I.list)}لماذا رُشِّح؟</span>
        ${c.note ? esc(c.note) : "بناءً على تطابق الأعراض التالية:"}
        <div class="matched">${c.matchedSyms.map(s => `<span>✓ ${esc(s.label)}</span>`).join("")}${c.deniedSyms.map(s => `<span class="miss">${esc(s.label)}</span>`).join("")}</div>
      </div>
      <div class="blk def"><span class="bl">${ico(I.info)}ما هو؟</span>${esc(c.def)}</div>
      <div class="blk tx"><span class="bl">${ico(I.steth)}كيف يُعالَج؟</span>${esc(c.treatment)}</div>
      ${careBlock(c)}
      <div class="small muted" style="margin-top:8px">مستوى الاستعجال المعتاد: <b>${TRIAGE[c.triage].label}</b>${reviewPending ? " · المحتوى قيد المراجعة الطبية" : ""}</div>
      ${refsFor(c)}
    </div>` : ""}
  </article>`;
}

function overallTriage(scored) {
  const redSym = DATA[state.zone].symptoms.filter(s => s.red && state.checked.has(s.id));
  let t = scored.length ? scored[0].triage : "doctor";
  for (const c of scored) {
    if (c.pct >= 50 && TRIAGE_ORDER.indexOf(c.triage) > TRIAGE_ORDER.indexOf(t) && (c.flag || c.triage === "urgent")) t = c.triage;
  }
  if (redSym.length) t = "emergency";
  return { key: t, redSym, crisis: redSym.some(s => s.crisis) };
}

function renderResults() {
  const d = DATA[state.zone], z = ZONE[state.zone];
  const scored = scoreZone(state.zone);
  const tri = overallTriage(scored);
  const T = TRIAGE[tri.key];
  const toneIcon = { danger: I.alert, warn: I.clock, info: I.steth, ok: I.heart }[T.tone];
  const top = scored[0], rest = scored.slice(1, 6);
  const picked = zoneSymptoms(state.zone).filter(s => state.checked.has(s.id));
  const isEmergency = tri.key === "emergency" && !tri.crisis;

  $content.innerHTML = `<div class="fade-in">
    <div class="print-only"><h2>تقرير موصل — ${new Date().toLocaleDateString("ar-EG")}</h2></div>
    ${tri.crisis ? `<div class="alert crisis" role="alert">${ico(I.heart).replace("<svg", '<svg class="ai"')}<div>
      <b>لست وحدك — تحدّث مع أحد الآن</b>
      <p>لهذه الأفكار علاج ومساعدة متاحة. اتصل بالخط الساخن للصحة النفسية (مجاني وسري)، أو بشخص تثق به. وإذا كنت في خطر الآن فاتصل بالإسعاف ${EMERGENCY_NUMBER}.</p>
      <div class="btn-row"><a class="btn" href="tel:${MENTAL_HOTLINE}">${ico(I.phone)} ${MENTAL_HOTLINE}</a><a class="btn" href="tel:${EMERGENCY_NUMBER}">${ico(I.phone)} ${EMERGENCY_NUMBER}</a></div></div></div>` : ""}
    ${isEmergency ? `<div class="alert danger" role="alert">${ico(I.alert).replace("<svg", '<svg class="ai"')}<div>
      <b>هذه الأعراض تستدعي الطوارئ</b>
      <p>${tri.redSym.length ? "اخترت علامة خطر: " + tri.redSym.map(s => esc(s.label)).join("، ") + "." : "هناك احتمال لحالة طارئة."} لا تنتظر؛ اتصل بالإسعاف أو توجّه إلى أقرب مستشفى.</p>
      <a class="btn" href="tel:${EMERGENCY_NUMBER}">${ico(I.phone)} اتصل ${EMERGENCY_NUMBER}</a></div></div>` : ""}

    <section class="triage t-${T.tone}" aria-label="الخطوة التالية">
      <div class="tl">${ico(toneIcon)}الخطوة التالية</div>
      <h2>${T.label}</h2>
      <p>${T.action}</p>
      <div class="spec">${ico(I.steth)}<span>التخصص المقترح: <b>${esc(z.name)}</b></span></div>
    </section>

    <div class="summary-card">
      <div class="sh"><span>الأعراض التي اخترتها (${picked.length})</span><button class="link-btn" style="padding:0;font-size:12.5px" data-act="edit-sym">تعديل</button></div>
      <div class="sel-chips">${picked.map(s => `<span class="sel-chip">${esc(s.label)}<button data-remove="${s.id}" aria-label="شيل ${esc(s.label)}">${ico(I.x, 2.6)}</button></span>`).join("")}</div>
    </div>

    ${top ? condCard(top, 1, true) : `<div class="card"><b>لا يوجد تطابق واضح</b><p class="muted small" style="margin:6px 0 0">لا تشير الأعراض التي اخترتها إلى حالة محددة في هذا القسم. جرّب الرجوع واختيار أعراض أخرى، أو راجع طبيبًا في تخصص ${esc(z.name)}.</p></div>`}

    ${rest.length ? `<div class="more-hd"><b>احتمالات أخرى</b><span class="muted small">اضغط لعرض التفاصيل</span></div>
      ${rest.map((c, i) => condCard(c, i + 2, false)).join("")}` : ""}

    <div class="btn-row no-print" style="margin-top:16px">
      <button class="btn btn-ghost" data-act="share">${ico(I.share)} مشاركة التقرير</button>
      <button class="btn btn-ghost" data-act="print">${ico(I.print)} طباعة للطبيب</button>
    </div>
    <button class="btn btn-primary btn-block no-print" style="margin-top:10px" data-act="restart">${ico(I.restart)} فحص جديد</button>

    <div class="disclaimer">${ico(I.shield)}<span>هذه النسب درجة تطابق بين أعراضك والأعراض المعروفة لكل حالة، وليست احتمالًا إحصائيًا ولا تشخيصًا. ${z.status === "validated" ? "راجعنا هذا القسم وفق مصادر طبية" : "هذا القسم ما زال قيد المراجعة الطبية"}. افتح «المراجع» أسفل أي حالة للقراءة من المصدر.</span></div>
  </div>`;
  setCta(null);
}

function renderAbout() {
  const zoneRows = ZONES.map(z => `<tr><td>${esc(z.name)}</td><td>${DATA[z.key].conditions.length}</td><td>${z.status === "validated" ? `<span class="badge ok">مُراجَع</span>` : `<span class="badge pending">قيد المراجعة</span>`}</td></tr>`).join("");
  const total = ZONES.reduce((a, z) => a + DATA[z.key].conditions.length, 0);
  const sources = Object.entries(ZONE_SOURCES).flatMap(([k, arr]) => arr.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.name)}</a> <span class="muted small">(${esc(ZONE[k].name)})</span></li>`)).join("");
  $content.innerHTML = `<div class="fade-in about">
    <h1 class="h1">كيف يعمل «موصل»؟</h1>
    <p>يقارن «موصل» الأعراض التي تختارها بمكتبة تضم <b>${total} حالة</b> في <b>${ZONES.length} تخصصًا</b>، وكل حالة مرتبطة برمز <b>ICD-10</b> الدولي الصادر عن منظمة الصحة العالمية.</p>
    <h2>خطوات التقييم</h2>
    <ol>
      <li><b>التطابق:</b> لكل عرض وزن من 1 إلى 3 بحسب درجة تمييزه للحالة.</li>
      <li><b>التفسير:</b> الحالة التي تفسّر عددًا أكبر من الأعراض المختارة تنال درجة أعلى.</li>
      <li><b>الاستبعاد:</b> إذا أجبت بـ«لا» عن سؤال تأكيدي، تنخفض درجة الحالات المعتمدة على ذلك العرض.</li>
      <li><b>عوامل الخطورة:</b> العمر والجنس والوزن والأمراض المزمنة ترفع الدرجة قليلًا (حتى 10%)، وذلك فقط عند وجود تطابق في الأعراض.</li>
      <li><b>الحد الأقصى 95%:</b> الأعراض وحدها لا تؤكد تشخيصًا أبدًا؛ فالفحص والتحاليل هي التي تؤكده.</li>
    </ol>
    <h2>مستويات الاستعجال</h2>
    <div class="legend-t">${Object.values(TRIAGE).map(t => `<div class="t-${t.tone}"><b>${t.label}:</b> ${t.action}</div>`).join("")}</div>
    <h2>حالة المراجعة</h2>
    <table class="tbl"><thead><tr><th>التخصص</th><th>حالات</th><th>الحالة</th></tr></thead><tbody>${zoneRows}</tbody></table>
    <h2>المصادر</h2>
    <ul>
      <li>تصنيف الأمراض: <a href="https://icd.who.int/browse10/2019/en" target="_blank" rel="noopener noreferrer">ICD-10 — WHO</a>، ومصطلحات <a href="https://www.nlm.nih.gov/research/umls/" target="_blank" rel="noopener noreferrer">UMLS — NLM</a></li>
      <li>معلومات المرضى: <a href="https://medlineplus.gov/" target="_blank" rel="noopener noreferrer">MedlinePlus</a>، <a href="https://www.nhs.uk/conditions/" target="_blank" rel="noopener noreferrer">NHS</a>، <a href="https://www.mayoclinic.org/diseases-conditions" target="_blank" rel="noopener noreferrer">Mayo Clinic</a></li>
      <li>مرجع الأطباء: <a href="https://www.ncbi.nlm.nih.gov/books/NBK430685/" target="_blank" rel="noopener noreferrer">StatPearls — NCBI</a></li>
      ${sources}
    </ul>
    <h2>خصوصيتك</h2>
    <p>تُحفظ بياناتك (العمر والطول والوزن والأمراض المزمنة) على جهازك فقط ولا تُرسَل إلى أي خادم، ولا تُحفظ الأعراض إطلاقًا.</p>
    <h2>شروط الاستخدام</h2>
    <p>استخدامك لـ«موصل» خاضع لشروط الاستخدام وإخلاء المسؤولية التي وافقت عليها${terms && terms.at ? " بتاريخ " + esc(new Date(terms.at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })) : ""}. <button class="link-btn" data-act="terms">اقرأ الشروط</button></p>
    <div class="btn-row"><button class="btn btn-ghost" data-act="edit">${ico(I.user)} تعديل بياناتي</button><button class="btn btn-ghost" data-act="wipe">${ico(I.x)} حذف بياناتي</button></div>
    <div class="disclaimer">${ico(I.shield)}<span>«موصل» أداة توجيه وتثقيف صحي، وليس جهازًا طبيًا ولا بديلًا عن الطبيب، ويحتاج محتواه إلى مراجعة أطباء متخصصين واعتمادهم قبل الاستخدام الواسع.</span></div>
    <div class="foot">الإصدار ${version} · جميع الحقوق محفوظة © 2026 موصل</div>
  </div>`;
  setCta(null);
}


/* =========================================================
   حاسبة مراحل الأمراض المزمنة
   السكري: معايير الجمعية الأمريكية للسكري (ADA Standards of Care 2025)
   الضغط: تصنيف ACC/AHA 2017 (مع الإشارة إلى حد 140/90 الأوروبي)
   الكلى: تصنيف KDIGO حسب معدل الترشيح الكبيبي eGFR
   ========================================================= */
const num = v => { const n = parseFloat(v); return Number.isFinite(n) && n > 0 ? n : null; };
function classifyGlucose(g) {
  const f = num(g.fpg), a = num(g.a1c), r = num(g.rpg), out = [];
  const low = [f, r].filter(Boolean).some(x => x < 54) ? 2 : [f, r].filter(Boolean).some(x => x < 70) ? 1 : 0;
  if (low) out.push({ tone: low === 2 ? "danger" : "warn", title: low === 2 ? "هبوط سكر شديد (المستوى الثاني: أقل من 54)" : "هبوط سكر (المستوى الأول: أقل من 70)",
    text: "تناول 15 جرامًا من سكر سريع (نصف كوب عصير) وأعد القياس بعد 15 دقيقة. فقدان الوعي أو التشنج يستدعي الإسعاف 123." });
  if ([f, r].filter(Boolean).some(x => x >= 300)) out.push({ tone: "danger", title: "ارتفاع شديد في السكر (300 فأكثر)",
    text: "قِس الكيتونات إن أمكن. مع القيء أو ألم البطن أو سرعة التنفس أو النعاس توجّه إلى الطوارئ فورًا (احتمال حماض كيتوني)." });
  if (g.known) {
    if (a) out.push(a < 7 ? { tone: "ok", title: `السكري منضبط (تراكمي ${a}%)`, text: "ضمن الهدف المعتاد لمعظم البالغين (أقل من 7%). استمر على الخطة وافحص التراكمي كل 3–6 أشهر." }
      : a < 9 ? { tone: "warn", title: `أعلى من الهدف (تراكمي ${a}%)`, text: "الهدف المعتاد أقل من 7%. راجع طبيبك لتعديل الغذاء أو الأدوية خلال أسابيع." }
      : { tone: "danger", title: `السكري غير منضبط (تراكمي ${a}%)`, text: "تراكمي 9% فأكثر يعني سيطرة ضعيفة وخطرًا أعلى للمضاعفات؛ راجع الطبيب قريبًا لتكثيف العلاج." });
    if (f && f >= 70 && f < 300) out.push(f <= 130 ? { tone: "ok", title: `سكر صائم ${f} ضمن الهدف`, text: "الهدف المعتاد قبل الأكل 80–130 ملغم/دل." }
      : { tone: "warn", title: `سكر صائم ${f} أعلى من الهدف`, text: "الهدف المعتاد قبل الأكل 80–130 ملغم/دل." });
  } else {
    let lvl = -1; const why = [];
    if (f) { const l = f >= 126 ? 2 : f >= 100 ? 1 : 0; lvl = Math.max(lvl, l); why.push(`صائم ${f}`); }
    if (a) { const l = a >= 6.5 ? 2 : a >= 5.7 ? 1 : 0; lvl = Math.max(lvl, l); why.push(`تراكمي ${a}%`); }
    if (r && r >= 200) { lvl = 2; why.push(`عشوائي ${r}`); } else if (r) { lvl = Math.max(lvl, 0); why.push(`عشوائي ${r}`); }
    if (lvl === 0) out.push({ tone: "ok", title: "سكر طبيعي", text: `(${why.join("، ")}) — أعد الفحص كل ثلاث سنوات بعد سن 35، أو أبكر مع زيادة الوزن أو التاريخ العائلي.` });
    if (lvl === 1) out.push({ tone: "warn", title: "مقدمات السكري", text: `(${why.join("، ")}) — صائم 100–125 أو تراكمي 5.7–6.4%. مرحلة قابلة للعكس: إنقاص 5–7% من الوزن ونشاط 150 دقيقة أسبوعيًا، وإعادة الفحص سنويًا.` });
    if (lvl === 2) out.push({ tone: "danger", title: "في نطاق داء السكري", text: `(${why.join("، ")}) — صائم 126 فأكثر أو تراكمي 6.5% فأكثر أو عشوائي 200 فأكثر مع الأعراض. يُؤكَّد بتحليل ثانٍ؛ راجع الطبيب خلال أيام.` });
  }
  return out;
}
function classifyBP(b) {
  const sy = num(b.sys), di = num(b.dia);
  if (!sy || !di) return [];
  const cat = (sy > 180 || di > 120) ? 4 : (sy >= 140 || di >= 90) ? 3 : (sy >= 130 || di >= 80) ? 2 : (sy >= 120) ? 1 : 0;
  return [[
    { tone: "ok", title: `ضغط طبيعي (${sy}/${di})`, text: "أقل من 120/80. حافظ على نمط حياة صحي وقِس الضغط سنويًا." },
    { tone: "info", title: `ضغط مرتفع قليلًا (${sy}/${di})`, text: "انقباضي 120–129 مع انبساطي أقل من 80. ليس مرضًا بعد، لكنه إنذار: قلّل الملح وتحرّك أكثر." },
    { tone: "warn", title: `ارتفاع ضغط — المرحلة الأولى (${sy}/${di})`, text: "130–139 أو 80–89 (ACC/AHA). أكّد بقياسات متكررة. تعتمد الإرشادات الأوروبية ومنظمة الصحة العالمية حد 140/90 للتشخيص، فناقش طبيبك." },
    { tone: "warn", title: `ارتفاع ضغط — المرحلة الثانية (${sy}/${di})`, text: "140/90 فأكثر. يحتاج غالبًا إلى دواء مع تعديل نمط الحياة؛ راجع الطبيب خلال أيام." },
    { tone: "danger", title: `أزمة ارتفاع ضغط (${sy}/${di})`, text: "أعلى من 180/120. أعد القياس بعد 5 دقائق راحة. مع صداع شديد أو ألم صدر أو ضيق تنفس أو ضعف أو زغللة: إسعاف 123 فورًا." }
  ][cat]];
}
function classifyKidney(k) {
  const e = num(k.egfr);
  if (!e) return [];
  const st = e >= 90 ? ["G1", "طبيعي أو مرتفع", "ok"] : e >= 60 ? ["G2", "انخفاض بسيط", "ok"] : e >= 45 ? ["G3a", "انخفاض بسيط إلى متوسط", "warn"]
    : e >= 30 ? ["G3b", "انخفاض متوسط إلى شديد", "warn"] : e >= 15 ? ["G4", "انخفاض شديد", "danger"] : ["G5", "فشل كلوي", "danger"];
  const advice = { G1: "إذا وُجد زلال في البول فهي المرحلة الأولى من مرض الكلى المزمن؛ وإلا فوظيفة الكلى طبيعية.", G2: "تُعد مرضًا كلويًا مزمنًا فقط مع وجود زلال أو تلف كلوي آخر. اضبط السكر والضغط.",
    G3a: "مرض كلى مزمن مرحلة 3أ: متابعة دورية، وضبط الضغط والسكر، وتجنّب المسكنات المضرة بالكلى.", G3b: "مرحلة 3ب: متابعة لدى طبيب الكلى وتعديل جرعات بعض الأدوية.",
    G4: "مرحلة 4: متابعة لصيقة لدى طبيب الكلى والاستعداد لخيارات الغسيل أو الزراعة.", G5: "مرحلة 5 (فشل كلوي): يحتاج إلى غسيل كلوي أو زراعة؛ راجع طبيب الكلى عاجلًا." };
  return [{ tone: st[2], title: `وظائف الكلى: المرحلة ${st[0]} — ${st[1]} (eGFR ${e})`, text: advice[st[0]] }];
}

function renderStages() {
  const g = state.stages || (state.stages = { known: (state.profile.chronic || []).includes("سكر") });
  const fld = (k, label, unit, ph) => `<div class="num"><label for="st-${k}">${label}</label><input id="st-${k}" type="number" inputmode="decimal" step="any" placeholder="${ph}" value="${esc(g[k] || "")}" data-stage="${k}"><div class="unit">${unit}</div></div>`;
  $content.innerHTML = `<div class="fade-in">
    <h1 class="h1">حاسبة مراحل الأمراض المزمنة</h1>
    <p class="lead">أدخل ما لديك من نتائج تحاليل أو قياسات (ليس شرطًا أن تملأ كل الخانات)، وستظهر المرحلة فورًا وفق الإرشادات الدولية.</p>
    <div class="card"><b>السكري</b>
      <label class="consent" style="margin:10px 0"><input type="checkbox" data-stage-known ${g.known ? "checked" : ""}><span>أنا مريض سكري معروف (لتقييم درجة الانضباط بدل التشخيص)</span></label>
      <div class="nums">${fld("fpg", "صائم", "ملغم/دل", "95")}${fld("a1c", "تراكمي HbA1c", "%", "5.4")}${fld("rpg", "عشوائي", "ملغم/دل", "140")}</div></div>
    <div class="card"><b>ضغط الدم</b><div class="nums" style="grid-template-columns:1fr 1fr;margin-top:10px">${fld("sys", "الانقباضي (العلوي)", "ملم زئبق", "120")}${fld("dia", "الانبساطي (السفلي)", "ملم زئبق", "80")}</div></div>
    <div class="card"><b>وظائف الكلى</b><div class="nums" style="grid-template-columns:1fr;margin-top:10px">${fld("egfr", "معدل الترشيح eGFR", "مل/دقيقة/1.73م²", "95")}</div></div>
    <div id="stage-out" aria-live="polite"></div>
    <div class="disclaimer">${ico(I.book)}<span>المصادر: الجمعية الأمريكية للسكري (ADA Standards of Care)، وإرشادات ACC/AHA 2017 لضغط الدم، وإرشادات KDIGO لأمراض الكلى. قراءة واحدة لا تكفي للتشخيص؛ فالتشخيص يحتاج إلى تكرار القياس وتأكيد الطبيب.</span></div>
  </div>`;
  setCta(null);
  renderStageOut();
}
function renderStageOut() {
  const box = document.getElementById("stage-out");
  if (!box) return;
  const g = state.stages, res = [...classifyGlucose(g), ...classifyBP(g), ...classifyKidney(g)];
  const icon = { danger: I.alert, warn: I.clock, info: I.steth, ok: I.check };
  box.innerHTML = res.length ? `<div class="label">النتيجة</div>${res.map(r => `<section class="triage t-${r.tone}"><div class="tl">${ico(icon[r.tone])}${r.tone === "danger" ? "يحتاج إلى تصرّف" : r.tone === "warn" ? "يحتاج إلى متابعة" : "معلومة"}</div><h2>${esc(r.title)}</h2><p>${esc(r.text)}</p></section>`).join("")}`
    : `<div class="empty">أدخل قراءة واحدة على الأقل لعرض المرحلة.</div>`;
}

/* ---------- التقرير ---------- */
function reportText() {
  const p = state.profile, z = ZONE[state.zone], d = DATA[state.zone];
  const scored = scoreZone(state.zone).slice(0, 3);
  const tri = TRIAGE[overallTriage(scoreZone(state.zone)).key];
  return [
    `تقرير موصل — ${new Date().toLocaleDateString("ar-EG")}`,
    `${p.gender === "male" ? "ذكر" : "أنثى"}، ${p.age} سنة، ${p.height} سم، ${p.weight} كجم${p.chronic.length ? "، أمراض مزمنة: " + p.chronic.join("، ") : ""}`,
    `التخصص: ${z.name}`,
    `الأعراض: ${d.symptoms.filter(s => state.checked.has(s.id)).map(s => s.label).join("، ")}`,
    state.denied.size ? `أعراض نفاها: ${d.symptoms.filter(s => state.denied.has(s.id)).map(s => s.label).join("، ")}` : "",
    `الاحتمالات: ${scored.map(c => `${c.name} (${c.en}, ICD-10 ${c.icd10}) ${c.pct}%`).join(" | ")}`,
    `الخطوة التالية: ${tri.label}`,
    `— أداة توجيه وليست تشخيصًا.`
  ].filter(Boolean).join("\n");
}
async function shareReport() {
  const text = reportText();
  try {
    if (navigator.share) { await navigator.share({ title: "تقرير موصل", text }); return; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); toast("نُسخ التقرير؛ يمكنك لصقه في أي رسالة"); }
  catch (e) { toast("تعذّر النسخ؛ جرّب الطباعة"); }
}

/* =========================================================
   الرسم + الأحداث
   ========================================================= */
function render() {
  renderTopbar();
  const s = state.screen;
  if (s !== "terms" && !termsOk()) { state.screen = "terms"; return render(); }
  if (s === "terms") renderTerms();
  else if (s === "onboarding") renderOnboarding();
  else if (s === "home") renderHome();
  else if (s === "sections") renderSections();
  else if (s === "symptoms") renderSymptoms();
  else if (s === "followup") renderFollowup();
  else if (s === "results") renderResults();
  else if (s === "about") renderAbout();
  else if (s === "stages") renderStages();
  if (render.last !== s) { window.scrollTo(0, 0); render.last = s; }
}

document.addEventListener("click", e => {
  const t = e.target.closest("button, [data-region]");
  if (!t) return;
  const ds = t.dataset;
  if (ds.region) return pickRegion(ds.region);
  if (ds.zone) return pickZone(ds.zone, ds.preset);
  if (ds.sym) { state.checked.has(ds.sym) ? state.checked.delete(ds.sym) : state.checked.add(ds.sym); return render(); }
  if (ds.ans) return answer(ds.q, ds.ans);
  if (ds.open) { state.openCond = state.openCond === ds.open ? null : ds.open; return render(); }
  if (ds.remove) {
    state.checked.delete(ds.remove);
    if (!state.checked.size) return go("symptoms");
    return render();
  }
  if (ds.gender) { state.profile.gender = ds.gender; return render(); }
  if (ds.chronic) {
    const c = ds.chronic, arr = state.profile.chronic;
    state.profile.chronic = arr.includes(c) ? arr.filter(x => x !== c) : [...arr, c];
    return render();
  }
  switch (ds.act) {
    case "back": return back();
    case "home": return restart();
    case "about": state.prev = state.screen; return go("about");
    case "stages": state.prev = state.screen; return go("stages");
    case "terms": state.prev = state.screen; state.termsView = true; return go("terms");
    case "decline":
      return toast("لا يمكن استخدام «موصل» دون الموافقة على الشروط. في الطوارئ اتصل بالإسعاف 123.");
    case "edit": state.editingProfile = true; return go("onboarding");
    case "cancel-edit":
      try { state.profile = JSON.parse(localStorage.getItem(PROFILE_KEY)) || state.profile; } catch (err) { /* ignore */ }
      state.editingProfile = false; return go("home");
    case "skip": state.openCond = null; return go("results");
    case "edit-sym": state.round = 0; state.asked = new Set(); state.denied = new Set(); state.answers = {}; return go("symptoms");
    case "restart": return restart();
    case "share": return shareReport();
    case "print": return window.print();
    case "wipe":
      if (!confirm("هل تريد حذف بياناتك من هذا الجهاز؟")) return;
      try { localStorage.removeItem(PROFILE_KEY); } catch (err) { /* ignore */ }
      state.profile = { gender: null, age: "", height: "", weight: "", chronic: [] };
      state.consent = false; resetCase(); return go("onboarding");
  }
});

document.addEventListener("keydown", e => {
  const g = e.target.closest && e.target.closest("g.region");
  if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pickRegion(g.dataset.region); }
});

/* تمييز المنطقة لما المستخدم يقف على التاج بتاعها */
document.addEventListener("pointerover", e => {
  const tag = e.target.closest && e.target.closest(".tag");
  document.querySelectorAll("g.region.hot").forEach(g => g.classList.remove("hot"));
  if (tag) document.querySelector(`g.region[data-region="${tag.dataset.region}"]`)?.classList.add("hot");
});

document.addEventListener("input", e => {
  const t = e.target;
  if (t.id === "q") { state.query = t.value; return renderSearch(); }
  if (t.dataset && t.dataset.field) {
    state.profile[t.dataset.field] = t.value;
    const err = fieldError(t.dataset.field, t.value);
    t.setAttribute("aria-invalid", !!err);
    const u = document.getElementById("u-" + t.dataset.field);
    if (u) u.innerHTML = err ? `<span class="err">${err}</span>` : { age: "سنة", height: "سم", weight: "كجم" }[t.dataset.field];
    updateOnboardCta();
  }
  if (t.id === "consent") { state.consent = t.checked; updateOnboardCta(); }
  if (t.dataset && t.dataset.term !== undefined) { state.termsChecks[+t.dataset.term] = t.checked;
    const all = state.termsChecks.every(Boolean), h = document.getElementById("terms-hint");
    if (h) h.textContent = all ? "شكرًا لك. اضغط «أوافق وأتابع»." : "يجب تحديد جميع الإقرارات للمتابعة.";
    setCta("أوافق وأتابع", acceptTerms, !all); }
  if (t.dataset && t.dataset.stage) { state.stages[t.dataset.stage] = t.value; renderStageOut(); }
  if (t.dataset && "stageKnown" in t.dataset) { state.stages.known = t.checked; renderStageOut(); }
});
document.addEventListener("change", e => {
  if (e.target.id === "consent") { state.consent = e.target.checked; updateOnboardCta(); }
  if ("stageKnown" in (e.target.dataset || {})) { state.stages.known = e.target.checked; renderStageOut(); }
});

render();

/* PWA: يشتغل من غير نت بعد أول فتح */
/* داخل بيئة معزولة (مثل صفحات المعاينة) لا يُسمح بالعمل دون اتصال، فنتجاهل ذلك بهدوء */
window.addEventListener("load", () => {
  try { if (location.protocol !== "file:" && navigator.serviceWorker) navigator.serviceWorker.register("sw.js").catch(() => {}); } catch (e) { /* غير متاح */ }
});

/* للاختبارات الآلية */
window.__mosel = { state, scoreZone, evaluate, render };
})();
