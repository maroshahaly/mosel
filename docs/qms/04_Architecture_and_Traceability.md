# معمارية البرمجية ومصفوفة التتبع — «موصل» (Mosel)

| البند | القيمة |
|---|---|
| رمز الوثيقة | MOSEL-SAD-001 |
| المعايير المرجعية | IEC 62304 §5.3 (المعمارية)، §5.4 (التصميم التفصيلي)، §5.7.4 و§7.3.3 (التتبع)؛ ISO 13485 §7.3.4، §7.3.6 |
| الإصدار | 0.1 — مسودة |
| التاريخ | 2026-10-09 |
| إصدار البرمجية | 3.7.0 |
| وثائق مرتبطة | MOSEL-SRS-001، MOSEL-SDP-001، MOSEL-QM-001 |

---

## 1. نظرة عامة على المعمارية

«موصل» تطبيق صفحة واحدة يعمل كليًا داخل المتصفح. لا خادم تطبيق، ولا قاعدة بيانات بعيدة، ولا مكتبات JavaScript خارجية. الحدود الخارجية الوحيدة: الاستضافة الثابتة، وGoogle Fonts، وواجهات المتصفح (التخزين المحلي، عامل الخدمة، الكلام، المشاركة، الطباعة، `tel:`)، والروابط الخارجية التي يفتحها المستخدم بنفسه.

```
                 ┌────────────────────────── المتصفح ───────────────────────────┐
                 │                                                                │
  الاستضافة ──►  │  index.html ─► prefs.js (الوضع/الخط قبل الرسم)                 │
  (_headers:     │       │                                                        │
   CSP, HSTS…)   │       ├─► data/conditions.js ──► window.MOSEL_DATA             │
                 │       ├─► data/more_0{1,2,3}_*.js ──► MOSEL_EXTEND(...)        │
                 │       ├─► data/care.js ──► window.MOSEL_CARE                   │
                 │       ├─► data/tips.js ──► window.MOSEL_TIPS                   │
                 │       └─► app.js (IIFE واحدة)                                  │
                 │              ├─ الحالة state + localStorage (moselProfile،     │
                 │              │   moselTerms، moselCard، moselHistory،          │
                 │              │   moselTheme، moselZoom)                         │
                 │              ├─ المحركات: scoreZone / overallTriage /         │
                 │              │   analyzeDescription / classify*                 │
                 │              └─ العرض: render* ← أحداث click/input/change      │
                 │  sw.js ◄── تسجيل عند load ── ذاكرة SHELL (العمل دون اتصال)     │
                 └────────────────────────────────────────────────────────────────┘
        Google Fonts (IBM Plex Sans Arabic)      Web Speech API (مزوّد المتصفح)
```

**ترتيب التحميل** (من `index.html`، وهو ترتيب ملزم لأن `more_*.js` تستدعي `MOSEL_EXTEND` المعرّفة في `conditions.js`، و`app.js` يقرأ `window.MOSEL_DATA` و`MOSEL_CARE` و`MOSEL_TIPS` عند بدء التشغيل):
`prefs.js` ← `data/conditions.js` ← `data/more_01_zones.js` ← `data/more_02_systems.js` ← `data/more_03_specialties.js` ← `data/care.js` ← `data/tips.js` ← `app.js`.

**نمط العرض:** كل شاشة دالة `render<Screen>()` تكتب `innerHTML` لعنصر `#content`، ويعيد `render()` الرسم كاملًا بعد كل تغيير في `state`. معالج نقر واحد مفوَّض على `document` يوزع الأحداث حسب سمات `data-*`.

---

## 2. وحدات البرمجية (Software items / units)

تقسيم منطقي داخل الملفات. كل الوحدات بفئة سلامة C لعدم وجود فصل فعلي (MOSEL-SDP-001 §2.3)؛ وعمود «حرجة» يحدد الوحدات التي تنفذ ضوابط مخاطر.

| المعرّف | الوحدة | الموقع | العناصر الرئيسية | المسؤولية | حرجة |
|---|---|---|---|---|---|
| U01 | مكتبة البيانات الأساسية | `data/conditions.js` | `TRIAGE`، `ZONES`، `ZONE_SOURCES`، `DATA`، `REGIONS`، `REGION_ORGANS`، `RISK_FACTORS`، `version`، `MOSEL_EXTEND` | الأمراض والأعراض والأوزان والاستعجال وعلامات الخطر | نعم |
| U02 | إضافات البيانات | `data/more_01_zones.js`، `more_02_systems.js`، `more_03_specialties.js` | استدعاءات `MOSEL_EXTEND(zone, {zone, symptoms, conditions, risk, regions})` | تخصصات وأمراض إضافية (أعراض `X..`) | نعم |
| U03 | بيانات الرعاية | `data/care.js` (مولَّد من `data/care_src/*.json`) | `MOSEL_CARE[id] = {tests, imaging, meds[{cls, ex, note}], procedures, selfcare, guide, refs}` | «ما قد يقرّره الطبيب» بلا جرعات | نعم |
| U04 | بيانات النصائح | `data/tips.js` | `MOSEL_TIPS = {general, when, zone}` | نصائح وقائية | لا |
| U05 | الإعدادات والثوابت | `app.js` | `EMERGENCY_NUMBER`، `MENTAL_HOTLINE`، `TERMS`، `TERMS_VERSION`، `TERMS_ACK`، `MAX_FOLLOWUP_ROUNDS`، `QUICK_ACCESS`، `CHRONIC_OPTIONS` | ثوابت السلامة والوسم | نعم |
| U06 | أدوات مساعدة | `app.js` | `esc`، `normAr`، `ico`، `toast` | تهريب HTML، تطبيع العربية | نعم (`esc`) |
| U07 | خريطة الجسم | `app.js` | `bodyStage`، `bodyFace`، `bodyMapSvg`، `bodyFigure`، `photoGeo`، `photoGeoBack`، `PHOTO_GEO`، `PHOTO_GEO_BACK`، `photoOK`، `setTurn`، `turnBy`، `showTip`، `hideTip`، `offRegions`، `regionOrgans` | اختيار موضع الشكوى | لا |
| U08 | رسوم الأعضاء | `app.js` | `organDefs`، `ORGAN_SVG`، `REPRO_SVG`، `resolveOrgans`، `organLayer`، `organCard`، `organTag`، `sexKey` | موضع العضو في بطاقة النتيجة | لا |
| U09 | الحالة والتخزين | `app.js` | `state`، `resetCase`، `load`، `keep`، `termsOk`، `saveTerms`، `saveHistory`، `saveCard`، `openHistory`، `applyTheme`، `applyZoom`؛ و`prefs.js` | حالة الجلسة والحفظ المحلي | نعم (`termsOk`) |
| U10 | البروفايل | `app.js` | `LIMITS`، `fieldError`، `profileValid`، `bmiOf`، `profileCtx`، `submitProfile` | التحقق من المدخلات وسياق عوامل الخطورة | نعم |
| U11 | تصفية الجنس | `app.js` | `sexOk`، `zoneSymptoms`، `allowedZone` | إخفاء محتوى الجنس الآخر | نعم |
| U12 | محرك التقييم | `app.js` | `scoreZone`، `level`، `pickQuestions`، `evaluate`، `answer`، `commitAnswers` | ترتيب الاحتمالات وأسئلة المتابعة | نعم |
| U13 | الفرز | `app.js` | `overallTriage`، `TRIAGE_ORDER` | مستوى الاستعجال الكلي، الطوارئ، الأزمة | **نعم — الأعلى** |
| U14 | محرك الوصف | `app.js` | `STOP`، `SYN`، `PRE2`، `PRE1`، `SUF`، `unprefix`، `stem`، `toks`، `variants`، `userStems`، `NEED`، `HINT`، `describeIndex`، `analyzeDescription`، `runDescribe`، `toggleVoice` | تحويل النص الحر إلى تخصصات وأعراض | نعم |
| U15 | المراجع والرعاية | `app.js` | `CARE`، `GUIDE_ORGS`، `LOCAL_GUIDES`، `LOCAL_ORGS`، `guideLine`، `careBlock`، `refsFor`، `condCard`، `statusBadge` | عرض المرجعية والرعاية وحالة المراجعة | نعم |
| U16 | حاسبة المراحل | `app.js` | `num`، `classifyGlucose`، `classifyBP`، `classifyKidney`، `renderStages`، `renderStageOut` | تصنيف السكر والضغط والكلى | نعم |
| U17 | التقرير | `app.js` | `cardSummary`، `reportText`، `shareReport` | تقرير للمشاركة والطباعة | لا |
| U18 | الشاشات والتنقل | `app.js` | `render`، `renderTopbar`، `setCta`، `renderTerms`، `renderOnboarding`، `updateOnboardCta`، `renderHome`، `renderSearch`، `renderSections`، `renderSymptoms`، `renderFollowup`، `renderResults`، `renderDescribe`، `renderRecords`، `renderTips`، `renderAbout`؛ `go`، `back`، `pickRegion`، `pickZone`، `restart`؛ معالجات `click`/`keydown`/`input`/`change`/`pointerover` | الواجهة | نعم (`render` يفرض الشروط؛ `renderResults` يعرض الطوارئ) |
| U19 | PWA | `sw.js`، `manifest.json`، تسجيل العامل في `app.js` | `VERSION`، `SHELL`، معالجات `install`/`activate`/`fetch` | العمل دون اتصال والتحديث | نعم |
| U20 | إعداد الأمن | `_headers` | CSP وبقية الرؤوس | حماية الصفحة | لا |
| U21 | أدوات التحقق والبناء | `tools/validate_data.mjs`، `build_care.mjs`، `export_review.mjs`، `build_dist.mjs` | — | تحقق البيانات، توليد `care.js`، ملف المراجعة الطبية، حزمة النشر | أدوات (ليست في المنتج) |

### 2.1 واجهة الاختبار
`app.js` يكشف في نهايته: `window.__mosel = { state, scoreZone, evaluate, render, analyzeDescription }`. هذه هي نقطة الدخول التي تستخدمها اختبارات Playwright. لا تشمل `overallTriage` ولا `classifyGlucose`/`classifyBP`/`classifyKidney` — يجب إضافتها لاختبار الوحدات الحرجة مباشرة.

### 2.2 تدفق البيانات في التقييم (التصميم التفصيلي المختصر للوحدات الحرجة)
1. **الإدخال:** `pickZone(key, preset)` يعيد ضبط الحالة (`resetCase`) ويُنشئ `caseId`؛ أو `data-desc-zone` يحدد مسبقًا `z.syms` من `analyzeDescription`؛ أو بحث `data-preset`.
2. **الاختيار:** النقر على `data-sym` يبدّل وجود المعرّف في `state.checked`.
3. **`evaluate()`:** يستدعي `scoreZone(state.zone)`؛ إذا كان الأول والثاني متقاربين (< 25) و`state.round < 4` ووُجدت أسئلة من `pickQuestions` ← شاشة `followup`؛ وإلا ← `results`.
4. **`commitAnswers()`:** يسجل كل سؤال في `state.asked`، ويحدّث `checked`/`denied` حسب الإجابة، ثم `evaluate()` مجددًا.
5. **`renderResults()`:** `scoreZone` ← `overallTriage(scored)` ← (`tri.crisis` ⇒ بطاقة الأزمة) أو (`emergency` ⇒ تنبيه الطوارئ) ← قسم «الخطوة التالية» ← `condCard` للأول وحتى 5 بعده ← `saveHistory(top, tri.key)`.

**`scoreZone`** — المدخلات: `DATA[zone]`، `state.checked`، `state.denied`، `profileCtx(state.profile)`. المخرجات: مصفوفة أمراض مع `pct` و`reasons` و`matchedSyms` و`deniedSyms`. الحدود: `total` يُستبدل بـ 1 إن كان صفرًا؛ `explained = 0` إن لم يُختر شيء؛ القص إلى [0، 1] قبل التقريب؛ مكافأة الخطورة فقط عند `pct > 0` و`ctx.age`؛ السقف 95.

**`overallTriage`** — المدخلات: نتائج `scoreZone` و`state.checked`. القاعدة الحاكمة: أي عرض `red` مختار في التخصص الحالي ⇒ `emergency`؛ `crisis` ⇒ بطاقة الأزمة. الحد المعروف: يفحص علامات الخطر في **التخصص الحالي فقط** (`DATA[state.zone].symptoms`)، وهو سليم لأن المعرّفات محلية لكل تخصص (`S11` في القلب غير `S11` في الصدر).

**`analyzeDescription`** — المدخلات: نص حر. المخرجات: حتى 3 تخصصات `{key, score, syms (≤6 قوية), maybe (≤4 ضعيفة), red, hint}`. ضوابط السلامة: استبعاد علامة الخطر إن كانت `ratio < 0.75`؛ لا تحديد مسبق إلا عند `r ≥ 0.5`؛ تخفيض `r` إلى 0.49 كحد أقصى إذا غابت أكثر كلمات العرض تميزًا؛ استبعاد الجهة المعاكسة (يمين/يسار)؛ تخصصات `NEED` تتطلب ذكر الموضع.

---

## 3. التحقق القائم

### 3.1 فحوص آلية في المستودع — `node tools/validate_data.mjs`
يحمّل `data/conditions.js` وكل `more_*.js` في سياق `node:vm` بالترتيب، ثم `data/care.js`، ويخرج بالرمز 1 عند أي خطأ. آخر تشغيل (عند إعداد هذه الوثيقة): «✔ 19 تخصصًا · 294 مرضًا · 360 عَرَضًا … نجحت جميع الفحوصات» مع 4 تحذيرات «لا يوجد عَرَض مميِّز (وزن 3)» (`bones.osteoporosis`، `bones.rotatorcuff`، `internal.diverticular`، `congenital.metabolic`).

| المعرّف | الفحص | النوع |
|---|---|---|
| VA-01 | كل ملف `data/more_*.js` مُدرج في `index.html` | خطأ |
| VA-02 | لكل تخصص في `ZONES` بيانات في `DATA` | خطأ |
| VA-03 | لا عرض مكرر المعرّف داخل التخصص، ولا عرض بلا نص | خطأ |
| VA-04 | معرّف المرض يبدأ بـ `<zone>.` وفريد على مستوى المكتبة | خطأ |
| VA-05 | الحقول `name`، `en`، `def`، `treatment` غير فارغة | خطأ |
| VA-06 | رمز ICD-10 بصيغة `^[A-Z]\d{2}(\.\d{1,2})?$` | خطأ |
| VA-07 | `triage` قيمة معروفة في `TRIAGE` | خطأ |
| VA-08 | مرض `flag` بمستوى غير `emergency`/`urgent` | تحذير |
| VA-09 | للمرض أوزان؛ كل وزن يشير إلى عرض موجود؛ والقيم 1 أو 2 أو 3 فقط | خطأ |
| VA-10 | جنس المرض لا يخالف جنس التخصص | خطأ |
| VA-11 | مرض خاص بجنس غير مرتبط بعرض خاص بالجنس الآخر | خطأ |
| VA-12 | `organ` من القائمة المعروفة؛ لا عضو ذكري لمرض أنثوي ولا العكس | خطأ |
| VA-13 | مرض بلا عرض وزنه 3 | تحذير |
| VA-14 | عرض غير مرتبط بأي مرض | تحذير |
| VA-15 | لا مرضين في التخصص بالبصمة نفسها من الأوزان | خطأ |
| VA-16 | كل تخصص في `REGIONS[].specialties` موجود | خطأ |
| VA-17 | كل مفتاح في `RISK_FACTORS` مرض موجود | خطأ |
| VA-18 | `data/care.js` موجود ومُدرج في `index.html` | خطأ |
| VA-19 | لكل مرض مدخل رعاية، ولا مدخل رعاية بلا مرض | خطأ |
| VA-20 | لكل مدخل رعاية مرجع واحد على الأقل من قائمة الجهات المعروفة (`ORGS`) | خطأ |
| VA-21 | مدخل رعاية بلا `guide` | تحذير |
| VA-22 | **لا جرعة ولا تكرار** في نصوص الأدوية (`cls`، `ex`، `note`) وفق التعبير `DOSE` | خطأ |
| VA-23 | لا جرعة بالملليغرام في التحاليل أو الأشعة أو الإجراءات | خطأ |
| VA-24 | كل دواء له فئة؛ ولا مدخل رعاية فارغ تمامًا | خطأ |

**فحوص أخرى في المستودع:**

| المعرّف | الفحص | الأداة |
|---|---|---|
| VB-01 | الحزمة `dist/` لا تحتوي أسماء أدوات التطوير، وإلا يفشل البناء | `tools/build_dist.mjs` |
| VB-02 | صحة صياغة JavaScript | `node --check app.js` (وارد في `docs/HANDOFF.md`) |

### 3.2 اختبارات النظام في المتصفح (Playwright) — **موصوفة نثرًا؛ السكربتات والسجلات غير محفوظة في المستودع**

| المعرّف | السيناريو | ما يتحقق منه |
|---|---|---|
| E2E-01 | **طوارئ — احتشاء عضلة القلب:** إنشاء بروفايل والموافقة ← منطقة الصدر ← تخصص القلب ← اختيار «ألم مستمر أكثر من 15 دقيقة حتى مع الراحة» (`red:true`) مع أعراض مصاحبة ← النتيجة | قسم «الخطوة التالية» = «طوارئ فورًا»؛ تنبيه `role="alert"` «هذه الأعراض تستدعي الطوارئ» يذكر علامة الخطر؛ زر `tel:123`؛ الاحتشاء ضمن الاحتمالات |
| E2E-02 | **مسار الشروط:** فتح التطبيق بلا موافقة؛ محاولة البدء دون الإقرار؛ فتح الشروط من الرابط؛ الموافقة؛ إعادة التحميل | زر البدء معطل دون إقرار؛ لا وصول لأي شاشة أخرى؛ حفظ `moselTerms` بالإصدار والتاريخ؛ الدخول المباشر إلى الرئيسية بعد إعادة التحميل |
| E2E-03 | **تقييم محرك الوصف:** 74 جملة وصف (فصحى وعامية مصرية) مع التخصص المتوقع لكل منها، عبر `window.__mosel.analyzeDescription` | التخصص الصحيح في المرتبة الأولى في نحو 95% من الجمل |
| E2E-04 | **تدقيق علامات الخطر في الوصف:** جمل تذكر كلمات قريبة من علامات الخطر دون أن تذكرها صراحة، وجمل تذكرها صراحة | لا تُحدَّد علامة الخطر مسبقًا إلا عند المطابقة الصريحة (`ratio ≥ 0.75`)؛ وتنبيه الوصف يظهر عندها |

---

## 4. مصفوفة التتبع: المتطلب ← موقع الكود ← التحقق ← الحالة

**مفتاح الحالة:**
- **آلي ✔** = يتحقق منه فحص آلي موجود في المستودع ويمر.
- **E2E ✔ (خارجي)** = نُفذ سيناريو آلي ونجح، لكن الدليل غير محفوظ في المستودع.
- **فحص** = تحقق بفحص الكود فقط عند إعداد الوثيقة، بلا سجل اختبار.
- **✘ غير مُتحقق** = لا يوجد تحقق بعد.
- **⚠ يفشل** = الكود يخالف المتطلب.

| SRS | الوصف المختصر | موقع الكود | التحقق | الحالة |
|---|---|---|---|---|
| SRS-001 | لا وصول قبل الموافقة | `render` (السطر الحارس)، `termsOk`، `state.screen` الابتدائي | E2E-02 | E2E ✔ (خارجي) |
| SRS-002 | إقرار واحد + رابط الشروط | `renderOnboarding`، `TERMS_ACK`، `renderTerms`، `TERMS` | E2E-02 | E2E ✔ (خارجي) |
| SRS-003 | زر البدء معطل | `updateOnboardCta`، `submitProfile` | E2E-02 | E2E ✔ (خارجي) |
| SRS-004 | حفظ الموافقة بالإصدار والتاريخ | `saveTerms`، `TERMS_KEY` | E2E-02 | E2E ✔ (خارجي) |
| SRS-005 | إعادة الطلب عند تغيير الإصدار | `termsOk` (`terms.v === TERMS_VERSION`) | فحص | فحص |
| SRS-006 | عرض تاريخ الموافقة | `renderTerms`، `renderAbout` | V-MAN | ✘ غير مُتحقق |
| SRS-007 | حد 18 عامًا في الشروط | `TERMS` (بند «القاصرون») | فحص | فحص |
| SRS-010 | حدود البروفايل | `LIMITS`، `fieldError`، `profileValid` | V-UNIT مقترح | ✘ غير مُتحقق |
| SRS-011 | الأمراض المزمنة | `CHRONIC_OPTIONS`، معالج `data-chronic` | فحص | فحص |
| SRS-012 | مؤشر كتلة الجسم | `bmiOf` | V-UNIT مقترح | ✘ غير مُتحقق |
| SRS-013 | حفظ وتعديل البروفايل | `submitProfile`، `cancel-edit` | E2E-02 (جزئيًا) | E2E ✔ (خارجي، جزئي) |
| SRS-020 | خريطة بصورة ورجوع إلى SVG | `bodyStage`، `photoOK`، `bodyMapSvg` | V-MAN | ✘ غير مُتحقق |
| SRS-021 | المناطق ← التخصصات | `REGIONS`، `pickRegion`، `renderSections` | VA-16؛ E2E-01 (منطقة الصدر) | آلي ✔ (البيانات) |
| SRS-022 | لمستان على اللمس | معالج `click` (`armed`، `showTip`) | V-MAN | ✘ غير مُتحقق |
| SRS-023 | التركيز بلوحة المفاتيح | `bodyFace`/`bodyMapSvg` (`tabindex`)، معالج `keydown` | V-MAN | ✘ غير مُتحقق |
| SRS-024 | الوصول السريع والبحث | `QUICK_ACCESS`، `renderSearch` | V-E2E مقترح | ✘ غير مُتحقق |
| SRS-025 | الخطوات والرجوع | `renderTopbar`، `stepIndex`، `back` | V-MAN | ✘ غير مُتحقق |
| SRS-026 | رسم العضو | `organCard`، `resolveOrgans`، `sexKey` | VA-12 (البيانات) | آلي ✔ (البيانات فقط) |
| SRS-030 | تصفية الجنس في كل المسارات | `sexOk`، `zoneSymptoms`، `allowedZone` في `scoreZone`، `pickQuestions`، `renderSearch`، `analyzeDescription`، `renderHome`، `renderSections` | VA-10، VA-11 (البيانات)؛ V-UNIT للمنطق مقترح | آلي ✔ (البيانات)؛ المنطق فحص |
| SRS-031 | اتساق الجنس في البيانات | البيانات | VA-10، VA-11، VA-12 | آلي ✔ |
| SRS-040 | عرض الأعراض وشارة الخطر | `renderSymptoms`، `symButton` | E2E-01 | E2E ✔ (خارجي) |
| SRS-041 | عرض واحد على الأقل | `renderSymptoms` (`setCta` معطل) | فحص | فحص |
| SRS-042 | تنبيه «قيد المراجعة» في التخصص | `renderSymptoms` | فحص | فحص |
| SRS-043 | شرط المتابعة وحدودها | `evaluate`، `MAX_FOLLOWUP_ROUNDS` | V-UNIT مقترح | ✘ غير مُتحقق |
| SRS-044 | اختيار الأسئلة | `pickQuestions` | V-UNIT مقترح | ✘ غير مُتحقق |
| SRS-045 | الإجابات الثلاث والتخطي | `answer`، `commitAnswers`، `skip` | V-UNIT مقترح | ✘ غير مُتحقق |
| SRS-050 | صيغة الدرجة | `scoreZone` | V-UNIT مقترح؛ E2E-01 (نتيجة نهائية) | فحص + E2E ✔ (غير مباشر) |
| SRS-051 | الأوزان 1–3 والبصمات | البيانات | VA-09، VA-15 | آلي ✔ |
| SRS-052 | مكافأة الخطورة | `scoreZone`، `RISK_FACTORS`، `profileCtx` | VA-17 (المفاتيح)؛ V-UNIT مقترح | آلي ✔ (جزئي) |
| SRS-053 | سقف 95% | `scoreZone` (`Math.min(pct, 95)`) | V-UNIT مقترح | فحص |
| SRS-054 | الترتيب وتقديم `flag` | `scoreZone` (`sort`) | V-UNIT مقترح | فحص |
| SRS-055 | محتوى بطاقات النتيجة | `renderResults`، `condCard`، `level` | E2E-01 | E2E ✔ (خارجي) |
| SRS-056 | عبارة «ليست تشخيصًا» | `renderResults` | فحص | فحص |
| SRS-057 | «لا يوجد تطابق واضح» | `renderResults` | V-E2E مقترح | ✘ غير مُتحقق |
| SRS-060 | مستوى استعجال صالح لكل مرض | البيانات، `TRIAGE` | VA-07، VA-08؛ V-CLIN | آلي ✔؛ سريريًا: تخصصان من 19 |
| SRS-061 | رفع المستوى الكلي | `overallTriage` | V-UNIT مقترح | فحص |
| SRS-062 | **علامة خطر ⇒ طوارئ** | `overallTriage` (`if (redSym.length) t = "emergency"`) | E2E-01 | E2E ✔ (خارجي) |
| SRS-063 | تنبيه الطوارئ وزر 123 | `renderResults` (`isEmergency`)، `EMERGENCY_NUMBER` | E2E-01 | E2E ✔ (خارجي) |
| SRS-064 | قائمة علامات الخطر الثابتة | `renderHome` (`details.redflags`) | فحص | فحص |
| SRS-065 | قسم «الخطوة التالية» | `renderResults` (`section.triage`) | E2E-01 | E2E ✔ (خارجي) |
| SRS-070 | بطاقة الأزمة والخط الساخن | `overallTriage` (`crisis`)، `renderResults`، `MENTAL_HOTLINE` | V-E2E مقترح | فحص |
| SRS-071 | الأزمة تستبدل تنبيه الطوارئ | `renderResults` (`isEmergency = … && !tri.crisis`) | فحص | فحص |
| SRS-072 | صحة الأرقام | `EMERGENCY_NUMBER`، `MENTAL_HOTLINE` | إجراء صيانة دوري | ✘ غير مُتحقق |
| SRS-080 | حدود طول الوصف | `renderHome` (`maxlength="600"`)، `runDescribe` | فحص | فحص |
| SRS-081 | التطبيع والتجريد والعامية | `normAr`، `stem`، `variants`، `userStems`، `SYN`، `describeIndex` | E2E-03 | E2E ✔ (خارجي) |
| SRS-082 | تخصصات تتطلب ذكر الموضع | `NEED`، `NEED_S`، `analyzeDescription` | E2E-03 (غير مباشر) | E2E ✔ (خارجي، غير مباشر) |
| SRS-083 | عدم خلط اليمين واليسار | `analyzeDescription` | V-UNIT مقترح | فحص |
| SRS-084 | **علامة الخطر لا تُطابَق إلا عند ≥ 0.75** | `analyzeDescription` (`if (d.sym.red && ratio < 0.75) continue;`) | E2E-04 | E2E ✔ (خارجي) |
| SRS-085 | تحديد مسبق للقوي فقط | `analyzeDescription` (`strong`/`weak`)، معالج `data-desc-zone`، `renderDescribe` | E2E-04 | E2E ✔ (خارجي) |
| SRS-086 | حتى 3 تخصصات | `analyzeDescription` (`slice(0, 3)`)، `renderDescribe` | E2E-03 | E2E ✔ (خارجي) |
| SRS-087 | تنبيه الخطر في الوصف | `renderDescribe` (`red`) | E2E-04 | E2E ✔ (خارجي) |
| SRS-088 | توجيه عند عدم الفهم | `renderDescribe` | فحص | فحص |
| SRS-089 | الإملاء الصوتي | `SpeechRec`، `toggleVoice` | V-MAN | ✘ غير مُتحقق |
| SRS-090 | دقة ≥ 90% | `analyzeDescription` | E2E-03 (≈95% على 74 جملة) | E2E ✔ (خارجي) |
| SRS-100 | حقول المرض وICD-10 | البيانات | VA-04، VA-05، VA-06 | آلي ✔ |
| SRS-101 | المرجعية والمراجع | `guideLine`، `refsFor`، `GUIDE_ORGS`، `LOCAL_GUIDES` | فحص | فحص |
| SRS-102 | تغطية الرعاية ومراجعها | `data/care.js` | VA-18، VA-19، VA-20، VA-24 | آلي ✔ |
| SRS-103 | **لا جرعات** | `data/care.js`، `data/care_src/*.json` | VA-22، VA-23 | آلي ✔ |
| SRS-104 | تحذير الأدوية | `careBlock` (`care-warn`) | فحص | فحص |
| SRS-105 | إعلان حالة المراجعة | `statusBadge`، `condCard`، `careBlock`، `renderAbout` | فحص | فحص |
| SRS-106 | تصدير ملف المراجعة | `tools/export_review.mjs` | تشغيل الأداة | فحص (الملف `review/medical_review.csv` موجود) |
| SRS-110 | هبوط السكر | `classifyGlucose` | V-UNIT مقترح | فحص |
| SRS-111 | ارتفاع شديد ≥ 300 | `classifyGlucose` | V-UNIT مقترح | فحص |
| SRS-112 | تشخيص السكري ومقدماته | `classifyGlucose` | V-UNIT مقترح | فحص |
| SRS-113 | انضباط السكري المعروف | `classifyGlucose` (`g.known`) | V-UNIT مقترح | فحص |
| SRS-114 | فئات الضغط | `classifyBP` | V-UNIT مقترح | فحص |
| SRS-115 | مراحل الكلى | `classifyKidney` | V-UNIT مقترح | فحص |
| SRS-116 | تجاهل القيم غير الصالحة والتحديث الفوري | `num`، `renderStageOut`، معالج `input` | V-UNIT مقترح | فحص |
| SRS-117 | تحديد «سكري معروف» تلقائيًا | `renderStages` | V-MAN | ✘ غير مُتحقق |
| SRS-120 | حفظ السجل (≤ 50) | `saveHistory`، `HIST_MAX` | V-UNIT مقترح | فحص |
| SRS-121 | فتح/حذف/مسح السجل | `openHistory`، `data-hist-del`، `hist-clear` | V-MAN | ✘ غير مُتحقق |
| SRS-122 | البطاقة الصحية | `renderRecords`، `CARD_FIELDS`، `saveCard` | V-MAN | ✘ غير مُتحقق |
| SRS-123 | التقرير والمشاركة والطباعة | `reportText`، `shareReport`، `cardSummary`، `@media print` | V-MAN | ✘ غير مُتحقق |
| SRS-124 | حذف البيانات | معالج `wipe` | V-E2E مقترح | فحص (يحذف 3 مفاتيح من 6) |
| SRS-125 | النصائح | `personalTips`، `renderTips`، `TIPS.zone` | فحص | فحص |
| SRS-200 | لا إرسال بيانات | غياب أي `fetch`/`XMLHttpRequest` في `app.js`؛ CSP | فحص | فحص |
| SRS-201 | مطابقة نصوص الخصوصية للسلوك | `renderAbout`، `QUICK_ACCESS` مقابل `saveHistory` | فحص | **⚠ يفشل** |
| SRS-202 | إفصاح الكلام والخطوط | — | — | ✘ غير منفذ |
| SRS-210 | CSP | `_headers` | فحص الملف؛ فحص الرؤوس بعد النشر | فحص (الملف فقط) |
| SRS-211 | رؤوس الأمن الأخرى | `_headers` | فحص الملف | فحص (الملف فقط) |
| SRS-212 | التهريب و`noopener` | `esc` في كل `render*`؛ روابط `target="_blank"` | فحص | فحص |
| SRS-213 | خلو الحزمة | `tools/build_dist.mjs` | VB-01 | آلي ✔ |
| SRS-220 | العمل دون اتصال | `sw.js` (`SHELL`، `install`) | V-MAN مقترح | ✘ غير مُتحقق |
| SRS-221 | الشبكة أولًا ثم الذاكرة | `sw.js` (`fetch`) | V-MAN مقترح | فحص |
| SRS-222 | حذف الذاكرات القديمة | `sw.js` (`activate`) | V-MAN مقترح | فحص |
| SRS-223 | إدراج ملفات البيانات | `index.html`، `sw.js` (`SHELL`) | VA-01 (`index.html` فقط) | آلي ✔ (جزئي) |
| SRS-224 | العمل مع تخزين مقفول | `load`، `keep`، `try/catch` | V-MAN | ✘ غير مُتحقق |
| SRS-230 | العربية وRTL | `index.html` (`lang="ar" dir="rtl"`)، `manifest.json` | فحص | فحص |
| SRS-231 | سمات ARIA | `render*`، `symButton`، `renderStages` | فحص؛ تدقيق WCAG مقترح | فحص |
| SRS-232 | التركيز وتقليل الحركة | CSS في `index.html` | فحص | فحص |
| SRS-233 | الخط والوضع | `prefs.js`، `applyTheme`، `applyZoom`، `ZOOMS` | V-MAN | ✘ غير مُتحقق |
| SRS-234 | قابلية استخدام رسائل الطوارئ | `renderResults`، CSS | دراسة IEC 62366-1 | ✘ غير مُتحقق |
| SRS-240 | المتصفحات المدعومة | — | مصفوفة متصفحات | ✘ غير مُتحقق |
| SRS-241 | التثبيت كـ PWA | `manifest.json`، `icons/` | V-MAN | ✘ غير مُتحقق |
| SRS-242 | عرض الإصدار | `renderHome`، `renderAbout` (`version`) | فحص | فحص |

### 4.1 ملخص حالة التتبع
| الحالة | العدد التقريبي |
|---|---|
| آلي ✔ (كليًا أو جزئيًا) | 13 |
| E2E ✔ (خارجي — الدليل غير محفوظ) | 19 |
| فحص فقط | 39 |
| ✘ غير مُتحقق / غير منفذ | 24 |
| ⚠ يفشل | 1 (SRS-201) |

### 4.2 ربط المواقف الخطرة بضوابطها (تمهيد لملف ISO 14971)
| الموقف الخطر | ضوابط المخاطر (SRS) | الوحدات | أقوى دليل حالي |
|---|---|---|---|
| H1 فرز طارئ بمستوى أدنى | SRS-051، 054، 060، 061، **062**، 063، 064، 065 | U01، U02، U12، U13، U18 | VA-07/09/15 + E2E-01 |
| H2 غياب دعم الأزمة | SRS-070، 071، 072 | U05، U13، U18 | فحص فقط — **يحتاج سيناريو E2E مخصصًا** |
| H3 خطأ حاسبة المراحل | SRS-110–116 | U16 | فحص فقط — **يحتاج اختبار وحدات بقيم الحدود** (54، 70، 100، 126، 300؛ 120، 130، 140، 180؛ 15، 30، 45، 60، 90) |
| H4 جرعات دوائية | SRS-103، 104 | U03، U15 | VA-22، VA-23 |
| H5 طوارئ زائفة من الوصف | SRS-084، 085، 087 | U14 | E2E-04 |
| H6 خطأ تصفية الجنس | SRS-030، 031 | U11 | VA-10/11/12 |

---

## الفجوات المتبقية قبل التقديم

1. **حفظ أدلة E2E في المستودع**: سكربتات Playwright للسيناريوهات E2E-01 إلى E2E-04، ومجموعة الـ74 جملة بتوقعاتها، وتقارير التشغيل المؤرخة مع رقم الإصدار — حاليًا 19 متطلبًا يعتمد على دليل غير محفوظ.
2. **اختبارات وحدات** للوحدات الحرجة U12 وU13 وU14 وU16 (قيم الحدود لكل عتبة) — مطلوبة للفئة C؛ وتوسيع `window.__mosel` ليكشف `overallTriage` و`classify*`.
3. **سيناريو E2E لبطاقة الأزمة** (H2) — لا دليل اختبار حاليًا على أخطر سيناريو في التطبيق.
4. **إصلاح SRS-201** (نصوص الخصوصية مقابل `saveHistory`).
5. **فحص آلي لـ `SHELL` في `sw.js`** وتطابق `version`/`VERSION`.
6. **اختبار العمل دون اتصال** وتحديث عامل الخدمة على أجهزة حقيقية (Android Chrome، iOS Safari).
7. **تدقيق إمكانية الوصول WCAG 2.1 AA** ودراسة قابلية الاستخدام IEC 62366-1 لرسائل الطوارئ.
8. **التصميم التفصيلي الكامل** لكل وحدة (§5.4) يتجاوز الملخص في القسم 2.2، خاصة ثوابت `analyzeDescription` (0.25، 0.3، 0.33، 0.4، 0.45، 0.49، 0.5، 0.6، 0.65، 0.75، 4.5) ومبرراتها.
9. **التحقق السريري** للبيانات (U01–U03): 17 من 19 تخصصًا و192 مرضًا بحالة «قيد المراجعة»، و0 من 294 مدخل رعاية معتمد بحقل `reviewed`.
10. **فحص رؤوس الأمان على النطاق المنشور** فعليًا، لا على ملف `_headers` فقط.
11. **التحقق من صلاحية الحزمة المصغّرة**: تشغيل كل ما سبق على `dist/` بعد esbuild.
12. **فصل المحرك** في وحدة مستقلة قابلة للاختبار دون DOM، تمهيدًا لتبرير التجزئة مستقبلًا.
