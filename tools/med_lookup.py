"""
med_lookup.py
==============
سكريبت لاستدعاء 3 مصادر طبية مجانية والدمج بينهم:

1. ICD-11 API (WHO)        -> يرجع الكود الرسمي للمرض
2. UMLS (NLM)               -> يرجع مصطلحات ومرادفات طبية موحدة
3. MedlinePlus Connect      -> يرجع شرح مبسط للمريض بلغته (يدعم العربي)

طريقة التشغيل:
    pip install requests --break-system-packages
    python med_lookup.py "chest pain"

قبل التشغيل لازم تحط الـcredentials بتاعتك في المتغيرات تحت
(شرح إزاي تجيبهم موجود في README.md المرفق).
"""

import sys
import requests

# ---------------------------------------------------------------------------
# 1) بيانات الاعتماد - هتحطها إنت بعد ما تسجل في كل خدمة (مجاني)
# ---------------------------------------------------------------------------

# من https://icd.who.int/icdapi -> Register -> هتاخد Client Id و Client Secret
ICD_CLIENT_ID = "PUT_YOUR_ICD_CLIENT_ID_HERE"
ICD_CLIENT_SECRET = "PUT_YOUR_ICD_CLIENT_SECRET_HERE"

# من https://uts.nlm.nih.gov/uts/signup-login -> هتاخد UMLS API Key من صفحة My Profile
UMLS_API_KEY = "PUT_YOUR_UMLS_API_KEY_HERE"


# ---------------------------------------------------------------------------
# 2) ICD-11 : جلب توكن أول مرة، وبعدين البحث عن المرض
# ---------------------------------------------------------------------------

def get_icd_token():
    """يجيب access token من WHO عشان نقدر نستخدم ICD-11 API"""
    token_url = "https://icdaccessmanagement.who.int/connect/token"
    payload = {
        "client_id": ICD_CLIENT_ID,
        "client_secret": ICD_CLIENT_SECRET,
        "scope": "icdapi_access",
        "grant_type": "client_credentials",
    }
    r = requests.post(token_url, data=payload, timeout=15)
    r.raise_for_status()
    return r.json()["access_token"]


def search_icd11(term, token):
    """يدور على المرض في ICD-11 ويرجع أعلى نتيجة مع الكود الرسمي"""
    url = "https://id.who.int/icd/release/11/2024-01/mms/search"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Accept-Language": "en",
        "API-Version": "v2",
    }
    params = {"q": term}
    r = requests.get(url, headers=headers, params=params, timeout=15)
    r.raise_for_status()
    data = r.json()
    if not data.get("destinationEntities"):
        return None
    top = data["destinationEntities"][0]
    return {
        "title": top.get("title", "").replace("<em class='found'>", "").replace("</em>", ""),
        "id": top.get("id"),
        "code": top.get("theCode"),
    }


# ---------------------------------------------------------------------------
# 3) UMLS : البحث عن المصطلح الطبي الموحد (CUI) ومرادفاته
# ---------------------------------------------------------------------------

def search_umls(term):
    """يدور في UMLS عن المصطلح ويرجع الـ CUI (الكود الموحد) والاسم الرسمي"""
    url = "https://uts-ws.nlm.nih.gov/rest/search/current"
    params = {"string": term, "apiKey": UMLS_API_KEY}
    r = requests.get(url, params=params, timeout=15)
    r.raise_for_status()
    results = r.json().get("result", {}).get("results", [])
    if not results or results[0].get("ui") == "NONE":
        return None
    top = results[0]
    return {"cui": top.get("ui"), "name": top.get("name")}


# ---------------------------------------------------------------------------
# 4) MedlinePlus Connect : شرح مبسط للمريض (مش محتاج API key)
# ---------------------------------------------------------------------------

def get_medlineplus_summary(icd11_code, language="ar"):
    """ياخد كود ICD ويرجع صفحة شرح مبسطة للمريض - بيدعم العربي"""
    url = "https://connect.medlineplus.gov/service"
    params = {
        "mainSearchCriteria.v.cs": "2.16.840.1.113883.6.4",  # ICD-10-CM code system
        "mainSearchCriteria.v.c": icd11_code,
        "knowledgeResponseType": "application/json",
        "informationRecipient.languageCode.c": language,
    }
    r = requests.get(url, params=params, timeout=15)
    r.raise_for_status()
    return r.json()


# ---------------------------------------------------------------------------
# 5) تشغيل الكل مع بعض
# ---------------------------------------------------------------------------

def lookup(term):
    print(f"\n🔍 البحث عن: {term}\n" + "-" * 40)

    try:
        token = get_icd_token()
        icd_result = search_icd11(term, token)
        if icd_result:
            print(f"✅ ICD-11: {icd_result['title']}  (كود: {icd_result['code']})")
        else:
            print("⚠️  ICD-11: مفيش نتيجة")
    except Exception as e:
        print(f"❌ ICD-11 error: {e}")
        icd_result = None

    try:
        umls_result = search_umls(term)
        if umls_result:
            print(f"✅ UMLS: {umls_result['name']}  (CUI: {umls_result['cui']})")
        else:
            print("⚠️  UMLS: مفيش نتيجة")
    except Exception as e:
        print(f"❌ UMLS error: {e}")

    if icd_result and icd_result.get("code"):
        try:
            summary = get_medlineplus_summary(icd_result["code"])
            print(f"✅ MedlinePlus: {summary}")
        except Exception as e:
            print(f"❌ MedlinePlus error: {e}")


if __name__ == "__main__":
    query = " ".join(sys.argv[1:]) or "chest pain"
    lookup(query)
