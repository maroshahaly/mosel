# med_lookup.py — دليل التشغيل

سكريبت بسيط بيوضح إزاي نربط 3 مصادر طبية مجانية مع بعض كأول لبنة لمحرك التشخيص.

## قبل التشغيل: هتحتاج تسجل في مكانين (مجانًا)

### 1. ICD-11 (WHO)
1. روح على https://icd.who.int/icdapi
2. اعمل حساب (Register)
3. من لوحة التحكم هتاخد `Client Id` و `Client Secret`
4. حطهم في أول السكريبت مكان `PUT_YOUR_ICD_CLIENT_ID_HERE`

### 2. UMLS (NLM)
1. روح على https://uts.nlm.nih.gov/uts/signup-login
2. اعمل حساب (الموافقة على الترخيص مجانية وفورية عادةً)
3. من صفحة "My Profile" هتلاقي `API Key`
4. حطه مكان `PUT_YOUR_UMLS_API_KEY_HERE`

### 3. MedlinePlus Connect
مش محتاج تسجيل ولا API key خالص — شغال مباشرة.

## التشغيل

```bash
pip install requests --break-system-packages
python med_lookup.py "chest pain"
```

هيطلعلك:
- الكود الرسمي للمرض من ICD-11
- المصطلح الموحد من UMLS (CUI)
- شرح مبسط من MedlinePlus (لو الكود اتلاقى)

## الخطوة الجاية

ده مجرد proof-of-concept إن الاتصال شغال. الخطوة الحقيقية إننا:
1. نلف على الأعراض الأساسية اللي حطيناها في الـ demo (زي "ألم صدر"، "طنين أذن"، إلخ) ونعمل lookup لكل واحدة، ونخزن النتايج في قاعدة بيانات محلية بدل ما نستدعي الـAPI كل مرة (أسرع وأرخص).
2. نربط كل كود ICD برقم تخصص من التخصصات التمنية عندنا.
3. نستبدل الأوزان التجريبية في الـdemo بأوزان حقيقية من DDXPlus dataset.
