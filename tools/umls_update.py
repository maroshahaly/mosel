"""
umls_update.py
==============
Pulls from UMLS, for every disease in the "Mosel" app's library:
  - Unified concept code (CUI)
  - Official English name
  - Official medical definition (if available)

How to run:
    pip install requests --break-system-packages
    python umls_update.py

Output is saved to: disease_library_umls.json
Send that file back once it's done, and it will be translated into Arabic
and merged into the app.

Note: This takes a little while (44 diseases x 2 requests each), so don't
worry if it takes a minute or two to finish.
"""

import requests
import json
import time

# Put your UMLS API key here
UMLS_API_KEY = "PUT_YOUR_UMLS_API_KEY_HERE"

BASE_SEARCH = "https://uts-ws.nlm.nih.gov/rest/search/current"
BASE_DEFS = "https://uts-ws.nlm.nih.gov/rest/content/current/CUI/{cui}/definitions"

# All 44 diseases in the app, grouped by specialty.
# Each entry is (arabic_name_used_in_app, english_search_term)
DISEASE_LIBRARY = {
    "Orthopedics": [
        ("خشونة المفاصل", "Osteoarthritis"),
        ("التهاب المفاصل الروماتويدي", "Rheumatoid Arthritis"),
        ("انزلاق غضروفي", "Intervertebral Disc Displacement"),
        ("كسر أو إصابة رباط حادة", "Bone Fracture"),
        ("التهاب مفصلي إنتاني", "Septic Arthritis"),
        ("النقرس", "Gout"),
        ("متلازمة النفق الرسغي", "Carpal Tunnel Syndrome"),
        ("هشاشة العظام", "Osteoporosis"),
    ],
    "Internal Medicine": [
        ("قولون عصبي", "Irritable Bowel Syndrome"),
        ("التهاب معوي", "Gastroenteritis"),
        ("قرحة معدة", "Peptic Ulcer"),
    ],
    "Cardiology and Vascular": [
        ("ذبحة صدرية", "Angina Pectoris"),
        ("احتمال جلطة قلبية", "Myocardial Infarction"),
        ("ارتفاع ضغط الدم", "Hypertension"),
        ("دوالي الأوردة", "Varicose Veins"),
        ("قصور وريدي مزمن", "Chronic Venous Insufficiency"),
    ],
    "Ophthalmology": [
        ("التهاب ملتحمة", "Conjunctivitis"),
        ("جفاف العين", "Dry Eye Syndrome"),
        ("ارتفاع ضغط العين", "Ocular Hypertension"),
    ],
    "ENT": [
        ("التهاب الأذن الوسطى", "Otitis Media"),
        ("التهاب الجيوب الأنفية", "Sinusitis"),
        ("التهاب اللوزتين", "Tonsillitis"),
    ],
    "Dermatology": [
        ("إكزيما", "Eczema"),
        ("صدفية", "Psoriasis"),
        ("ثعلبة", "Alopecia Areata"),
    ],
    "Dental": [
        ("تسوس الأسنان", "Dental Caries"),
        ("التهاب اللثة", "Gingivitis"),
        ("خراج سني", "Dental Abscess"),
    ],
    "Endocrinology": [
        ("مرض السكري", "Diabetes Mellitus"),
        ("قصور الغدة الدرقية", "Hypothyroidism"),
    ],
    "Andrology": [
        ("ضعف جنسي وظيفي", "Erectile Dysfunction"),
        ("دوالي الخصية", "Varicocele"),
    ],
    "Gynecology": [
        ("تكيس المبايض", "Polycystic Ovary Syndrome"),
        ("التهاب مهبلي", "Vaginitis"),
        ("أورام ليفية", "Uterine Fibroids"),
    ],
    "Geriatrics": [
        ("خرف أو ألزهايمر مبكر", "Alzheimer Disease"),
        ("ضعف عام مرتبط بالتقدم في السن", "Frailty Syndrome"),
    ],
    "Congenital and Genetic Disorders": [
        ("عيوب خلقية في القلب", "Congenital Heart Defect"),
        ("اضطرابات وراثية استقلابية", "Inborn Errors of Metabolism"),
        ("تشوهات هيكلية خلقية", "Congenital Skeletal Malformation"),
    ],
    "Mental Health": [
        ("اضطراب قلق", "Anxiety Disorder"),
        ("اكتئاب", "Depression"),
        ("اضطراب نوم أولي", "Primary Insomnia"),
    ],
}


def search_cui(term):
    params = {"string": term, "apiKey": UMLS_API_KEY}
    r = requests.get(BASE_SEARCH, params=params, timeout=15)
    r.raise_for_status()
    results = r.json().get("result", {}).get("results", [])
    if not results or results[0].get("ui") == "NONE":
        return None
    return {"cui": results[0]["ui"], "name": results[0]["name"]}


def get_definition(cui):
    url = BASE_DEFS.format(cui=cui)
    params = {"apiKey": UMLS_API_KEY}
    r = requests.get(url, params=params, timeout=15)
    if r.status_code == 404:
        return None
    r.raise_for_status()
    results = r.json().get("result", [])
    if not results:
        return None
    # Prefer a definition from a well-known, clear source if one exists
    preferred_sources = ["MSH", "NCI", "CSP"]
    for src in preferred_sources:
        for item in results:
            if item.get("rootSource") == src:
                return item.get("value")
    return results[0].get("value")


def main():
    output = {}
    total = sum(len(v) for v in DISEASE_LIBRARY.values())
    done = 0

    for specialty, diseases in DISEASE_LIBRARY.items():
        output[specialty] = []
        for arabic_name, english_term in diseases:
            done += 1
            print(f"[{done}/{total}] {specialty} -> {english_term} ...")
            try:
                found = search_cui(english_term)
                definition = None
                if found:
                    time.sleep(0.3)  # small gap between requests
                    definition = get_definition(found["cui"])
                output[specialty].append({
                    "arabic_name": arabic_name,
                    "english_term": english_term,
                    "cui": found["cui"] if found else None,
                    "official_name": found["name"] if found else None,
                    "definition_en": definition,
                })
            except Exception as e:
                print(f"  Warning: error - {e}")
                output[specialty].append({
                    "arabic_name": arabic_name,
                    "english_term": english_term,
                    "cui": None,
                    "official_name": None,
                    "definition_en": None,
                    "error": str(e),
                })
            time.sleep(0.3)

    with open("disease_library_umls.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print("\nDone! Results saved to disease_library_umls.json")
    print("Send that file back and the definitions will be translated and merged into the app.")


if __name__ == "__main__":
    main()
