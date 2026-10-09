#!/usr/bin/env python3
# © 2026 Maro Shahaly — موصل. جميع الحقوق محفوظة.
"""علامة ملكية مرئية وأخرى غير مرئية للصور.

  python3 tools/watermark.py embed  <in.jpg> <out.jpg>   # يضيف العلامتين
  python3 tools/watermark.py detect <image>              # يكشف العلامة غير المرئية

العلامة غير المرئية «طيف منتشر»: نمط عشوائي ضعيف جدًا (±2 من 255) مولَّد من مفتاح سري
يُضاف إلى إضاءة الصورة كلها. لا تراه العين، ويبقى بعد الضغط JPEG والقص البسيط وتغيير الحجم.
الكشف بحساب الارتباط مع النمط نفسه: قيمة z أكبر من 6 تعني أن الصورة صورتنا.
المفتاح السري في متغير البيئة MOSEL_WM_KEY (لا يُرفع إلى المستودع)، وله قيمة افتراضية للتجربة.
"""
import hashlib, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

KEY = os.environ.get("MOSEL_WM_KEY", "mosel-maro-shahaly-2026")
STRENGTH = 2.2
BLOCK = 4  # النمط بكتل 4×4 بكسل ليصمد أمام الضغط وتصغير الحجم

TILE = 128  # النمط يتكرر كل 128 بكسل، فيُكشف حتى بعد القص بالبحث عن الإزاحة

def tile():
    seed = int.from_bytes(hashlib.sha256(KEY.encode()).digest()[:8], "big")
    rng = np.random.default_rng(seed)
    small = rng.choice([-1.0, 1.0], size=(TILE // BLOCK, TILE // BLOCK))
    return np.kron(small, np.ones((BLOCK, BLOCK)))

def pattern(w, h):
    t = tile()
    return np.tile(t, ((h + TILE - 1) // TILE, (w + TILE - 1) // TILE))[:h, :w]

def embed(src, dst):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    # 1) العلامة المرئية: سطر رفيع في أسفل الصورة
    d = ImageDraw.Draw(im)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", max(11, w // 40))
    except OSError:
        font = ImageFont.load_default()
    text = "© MOSEL 2026"
    tw = d.textlength(text, font=font)
    d.text((w - tw - w * 0.03, h - h * 0.025 - font.size), text, fill=(150, 150, 150), font=font)
    # 2) العلامة غير المرئية في الإضاءة
    a = np.asarray(im).astype(np.float32)
    p = pattern(w, h)[:, :, None]
    a = np.clip(a + STRENGTH * p, 0, 255).astype(np.uint8)
    out = Image.fromarray(a)
    # 3) بيانات الملكية داخل الملف (EXIF)
    exif = out.getexif()
    exif[0x8298] = "Copyright (c) 2026 Maro Shahaly - Mosel. All rights reserved."
    exif[0x013B] = "Maro Shahaly"
    out.save(dst, quality=88, exif=exif)

def detect(path):
    im = Image.open(path).convert("L")
    w, h = im.size
    a = np.asarray(im).astype(np.float32)
    # إزالة المحتوى منخفض التردد ثم الارتباط بالنمط
    from PIL import ImageFilter
    blur = np.asarray(im.filter(ImageFilter.BoxBlur(BLOCK * 2))).astype(np.float32)
    resid = a - blur
    # طيّ البقايا في مربع واحد 128×128 ثم ارتباط دائري بكل الإزاحات (يتحمل القص)
    hh, ww = (h // TILE) * TILE, (w // TILE) * TILE
    folded = resid[:hh, :ww].reshape(hh // TILE, TILE, ww // TILE, TILE).sum(axis=(0, 2))
    t = tile()
    corr = np.real(np.fft.ifft2(np.fft.fft2(folded) * np.conj(np.fft.fft2(t))))
    n = np.sqrt((folded ** 2).sum() * (t ** 2).sum()) + 1e-9
    r = corr.max() / n
    # مستوى المصادفة: متوسط وانحراف بقية الإزاحات
    z = (corr.max() - corr.mean()) / (corr.std() + 1e-9)
    print(f"{path}: z={z:.1f} → {'✔ العلامة موجودة (ملكيتنا)' if z > 6 else '✘ لا توجد علامة'}")
    return z

if __name__ == "__main__":
    if len(sys.argv) >= 4 and sys.argv[1] == "embed":
        embed(sys.argv[2], sys.argv[3])
    elif len(sys.argv) >= 3 and sys.argv[1] == "detect":
        for f in sys.argv[2:]:
            detect(f)
    else:
        print(__doc__)
