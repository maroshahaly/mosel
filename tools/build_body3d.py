#!/usr/bin/env python3
# © 2026 Maro Shahaly — موصل. جميع الحقوق محفوظة.
"""يبني نموذج الجسم ثلاثي الأبعاد assets/body3d.bin من بيانات MakeHuman (رخصة CC0).

  git clone --depth 1 --filter=blob:none --sparse https://github.com/makehumancommunity/makehuman.git mh
  (cd mh && git sparse-checkout set makehuman/data/3dobjs makehuman/data/targets/macrodetails makehuman/data/rigs)
  python3 tools/build_body3d.py mh/makehuman/data

المخرجات: شبكة واحدة مشتركة (مثلثات + منطقة لكل مثلث) + جسم ذكر وجسم أنثى
+ فروق تشكيل (نحيف/ممتلئ/كبير السن) تُمزج في المتصفح حسب مؤشر كتلة الجسم والعمر.
"""
import json, struct, sys, collections
import numpy as np

D = (sys.argv[1] if len(sys.argv) > 1 else "mh/makehuman/data").rstrip("/") + "/"
OUT = sys.argv[2] if len(sys.argv) > 2 else "assets/body3d.bin"

# ---------- القراءة ----------
V0, FACES = [], []
cur = None
for line in open(D + "3dobjs/base.obj"):
    if line.startswith("v "): V0.append(list(map(float, line.split()[1:4])))
    elif line.startswith("g "): cur = line.split()[1]
    elif line.startswith("f "): FACES.append((cur, [int(p.split("/")[0]) - 1 for p in line.split()[1:]]))
V0 = np.array(V0)
N = len(V0)

def delta(name):
    out = np.zeros((N, 3))
    for line in open(D + "targets/" + name):
        if line[0] == "#" or not line.strip(): continue
        p = line.split(); out[int(p[0])] = list(map(float, p[1:4]))
    return out

RACE = {"caucasian": .5, "african": .25, "asian": .25}
def gender_mesh(g):
    acc = sum(w * delta(f"macrodetails/{r}-{g}-young.target") for r, w in RACE.items())
    return V0 + acc + delta(f"macrodetails/universal-{g}-young-averagemuscle-averageweight.target")
def gender_morphs(g):
    old = delta(f"macrodetails/universal-{g}-old-averagemuscle-averageweight.target")
    for r, w in RACE.items():
        old += w * (delta(f"macrodetails/{r}-{g}-old.target") - delta(f"macrodetails/{r}-{g}-young.target"))
    return {"thin": delta(f"macrodetails/universal-{g}-young-averagemuscle-minweight.target"),
            "heavy": delta(f"macrodetails/universal-{g}-young-averagemuscle-maxweight.target"),
            "old": old}

# ---------- العظام: لكل رأس وزن كل عظمة ----------
W = json.load(open(D + "rigs/default_weights.mhw"))["weights"]
SK = json.load(open(D + "rigs/default.mhskel"))
bw = collections.defaultdict(dict)
for b, lst in W.items():
    for i, w in lst: bw[i][b] = w
def fam(b):
    if b.startswith(("upperarm",)): return "uarm"
    if b.startswith(("lowerarm",)): return "larm"
    if b.startswith(("wrist", "metacarpal", "finger", "thumb")): return "hand"
    if b.startswith(("upperleg",)): return "uleg"
    if b.startswith(("lowerleg",)): return "lleg"
    if b.startswith(("foot", "toe")): return "foot"
    if b.startswith(("neck",)): return "neck"
    if b.startswith(("clavicle", "shoulder")): return "shoulder"
    if b.startswith(("spine", "breast", "pelvis", "root")): return "torso"
    return "head"
famw = []
for i in range(N):
    d = collections.Counter()
    for b, w in bw[i].items(): d[fam(b)] += w
    famw.append(d)
ARM = ("upperarm", "lowerarm", "wrist", "metacarpal", "finger", "thumb")
def armw(i, side):
    return sum(w for b, w in bw[i].items() if b.startswith(ARM) and b.endswith("." + side))

def joint(V, name):
    return V[SK["joints"][name]].mean(0)

# ---------- الوضعية: إنزال الذراعين بجانب الجسم (مثل الصور) ----------
def pose(V, ang=31):
    V = V.copy()
    for side, sgn in (("L", 1), ("R", -1)):
        piv = joint(V, f"upperarm01.{side}____head")
        a = np.radians(ang) * -sgn  # الذراع اليسرى (+x) تدور مع عقارب الساعة نحو الأسفل
        c, s = np.cos(a), np.sin(a)
        R = np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
        w = np.array([armw(i, side) for i in range(N)])[:, None]
        V = (1 - w) * V + w * ((V - piv) @ R.T + piv)
    return V

def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)


# ---------- الشبكة المعروضة: الجسم + الشعر + العينان ----------
KEEP = {"body": 0, "helper-l-eye": 3, "helper-r-eye": 3}
# نحفظ الأوجه رباعية كما هي: المتصفح ينعّمها بتقسيم Catmull-Clark فيخرج سطح الجسم ناعمًا وواقعيًا
quads, tmat = [], []
for g, f in FACES:
    if g not in KEEP: continue
    assert len(f) == 4
    quads.append(tuple(f)); tmat.append(KEEP[g])
used = sorted({i for t in quads for i in t})
remap = {o: n for n, o in enumerate(used)}
T = np.array([[remap[i] for i in t] for t in quads], dtype=np.uint16)
M = len(used)

# احتشام: نستخدم أدوات MakeHuman الرسمية لتنعيم بروز الصدر تحت القميص
MODEST = {"breast/nipple-point-decr.target": 1.0, "breast/nipple-size-decr.target": 1.0}
def modest(Vg): return Vg + sum(w * delta(t) for t, w in MODEST.items())
male, female = pose(gender_mesh("male")), pose(modest(gender_mesh("female")))
mm, fm = gender_morphs("male"), gender_morphs("female")
# الإزاحات تُطبَّق على الجسم بعد الوضعية؛ نحسبها بالفرق بين الجسم المُشكَّل بعد الوضعية والجسم المتوسط بعد الوضعية
def posed_morphs(base_g, morphs):
    out = {}
    for k, d in morphs.items(): out[k] = pose(base_g + d) - pose(base_g)
    return out
mm = posed_morphs(gender_mesh("male"), mm)
fm = posed_morphs(modest(gender_mesh("female")), fm)

# ---------- المناطق ----------
REG = ["head", "eyes", "ears", "nose", "mouth", "jaw", "neck", "shoulder", "chest", "breast", "armpit",
       "ruq", "epi", "luq", "rlq", "hypo", "llq", "umbilical", "pelvis", "groin", "arm", "elbow", "hand",
       "thigh", "knee", "leg", "foot", "occiput", "nape", "scapula", "upperback", "flank", "lowback",
       "buttocks", "hamstring", "calf", "heel"]
RI = {k: i for i, k in enumerate(REG)}

def normals(V, T):
    fn = np.cross(V[T[:, 1]] - V[T[:, 0]], V[T[:, 2]] - V[T[:, 0]])
    return fn / (np.linalg.norm(fn, axis=1, keepdims=True) + 1e-12)

def assign(V, Vf):
    """V: الذكر بعد الوضعية (الإحداثيات الأصلية)، Vf: الأنثى (لمنطقة الثدي)"""
    P = V[used]
    C = P[T].mean(1); Nn = normals(P, T)
    y0, y1 = P[:, 1].min(), P[:, 1].max(); H = y1 - y0
    h = lambda f: y0 + f * H
    nip = joint(V, "breast.L____tail")[1]
    navel = joint(V, "spine03____head")[1]  # موضع السرّة على النموذج (مقيس)
    eyeL = V[[i for g, f in FACES if g == "helper-l-eye" for i in f]].mean(0)
    eyeR = V[[i for g, f in FACES if g == "helper-r-eye" for i in f]].mean(0)
    eyey, eyez = (eyeL[1] + eyeR[1]) / 2, (eyeL[2] + eyeR[2]) / 2
    headtop = y1
    # مستويات الوجه بالنسبة لطول الرأس
    hh = headtop - joint(V, "neck01____head")[1]
    chin = eyey - .50 * hh * .9
    nose_tip = eyey - .20 * hh
    mouth = eyey - .33 * hh
    # منتصف عمق الجذع لكل ارتفاع (للتمييز بين الأمام والخلف)
    out = np.zeros(len(T), dtype=np.uint8)
    inv = {n: o for o, n in remap.items()}
    sh = joint(V, "upperarm01.L____head")
    elbowL = joint(V, "lowerarm01.L____head"); elbowR = joint(V, "lowerarm01.R____head")
    kneeL = joint(V, "lowerleg01.L____head"); kneeR = joint(V, "lowerleg01.R____head")
    ankleL = joint(V, "foot.L____head")
    crotch = joint(V, "upperleg01.L____head")[1]
    for t in range(len(T)):
        if tmat[t] == 2: out[t] = RI["occiput"] if C[t][2] < eyez - .9 else RI["head"]; continue
        if tmat[t] == 3: out[t] = RI["eyes"]; continue
        x, y, z = C[t]; nx, ny, nz = Nn[t]
        fw = collections.Counter()
        for vi in T[t]:
            for k, w in famw[inv[vi]].items(): fw[k] += w
        f = fw.most_common(1)[0][0] if fw else "torso"
        front = nz > 0.05
        ax = abs(x)
        if f == "head":
            if y > eyey + .02 * hh and nz < -.15 or (z < eyez - 1.0 and y > chin): r = "occiput"
            elif ax > .62 * max(abs(eyeL[0]), .3) * 2.1 and abs(nx) > .55 and mouth < y < eyey + .25 * hh: r = "ears"
            elif front and abs(y - eyey) < .09 * hh and ax < abs(eyeL[0]) + .14 * hh: r = "eyes"
            elif front and ax < .08 * hh and nose_tip - .06 * hh < y < eyey - .04 * hh and z > eyez - .1: r = "nose"
            elif front and ax < .17 * hh and mouth - .085 * hh < y < mouth + .07 * hh: r = "mouth"
            elif y < mouth + .1 * hh and (ax > .12 * hh or y < mouth - .08 * hh) and z > eyez - 1.0: r = "jaw"
            else: r = "head"
        elif f == "neck": r = "neck" if nz > -.2 else "nape"
        elif f == "shoulder":
            r = "shoulder" if (ax > sh[0] * .55 or nz > -.3) else ("nape" if y > sh[1] + .35 else "scapula")
        elif f in ("uarm", "larm"):
            el = elbowL if x > 0 else elbowR
            r = "elbow" if np.linalg.norm(C[t] - el) < .55 else ("armpit" if f == "uarm" and ny < -.35 and y > sh[1] - 1.6 and ax < sh[0] + .9 else "arm")
        elif f == "hand": r = "hand"
        elif f == "uleg":
            kn = kneeL if x > 0 else kneeR
            if np.linalg.norm(C[t] - kn) < .75 and front: r = "knee"
            elif not front and y > crotch - 1.15: r = "buttocks"
            elif front and y > crotch - .55 and ax < 1.5: r = "groin"
            else: r = "thigh" if front else "hamstring"
        elif f == "lleg":
            kn = kneeL if x > 0 else kneeR
            if np.linalg.norm(C[t] - kn) < .7 and front: r = "knee"
            elif y < ankleL[1] + .45: r = "foot" if front else "heel"
            else: r = "leg" if front else "calf"
        elif f == "foot":
            r = "heel" if (z < ankleL[2] - .05 and y < ankleL[1] + .7) else "foot"
        else:  # الجذع — المعالم: السرّة عند رأس الفقرة spine03، والعانة تحت مفصل الورك قليلًا
            xiph = nip - .75; pubis = crotch - .1
            side = abs(nx) > .8 and pubis + .4 < y < nip - .6
            if front and not side:
                if y > nip + .9 and ax > sh[0] * .55 and ny > .1: r = "shoulder"
                elif y > xiph: r = "chest"
                elif np.hypot(x, y - navel) < .38: r = "umbilical"
                elif y > navel:
                    r = "epi" if ax < .5 else ("ruq" if x < 0 else "luq")
                elif y > pubis:
                    r = "hypo" if ax < .5 else ("rlq" if x < 0 else "llq")
                    if ax > .75 and y < pubis + .55: r = "groin"
                elif ax > .75: r = "groin"
                else: r = "pelvis"
            elif side: r = "flank"
            else:
                lumbar_top, sacrum = navel + .55, crotch + .55
                if y > nip - .3:
                    r = "upperback" if ax < .42 else ("scapula" if y < sh[1] - .1 else "shoulder")
                elif y > lumbar_top: r = "upperback" if ax < .42 else ("flank" if ax > 1.2 else "scapula" if y > nip - .9 else "upperback")
                elif y > sacrum: r = "lowback" if ax < 1.15 else "flank"
                else: r = "buttocks"
            # الإبط: أعلى جانب الجذع تحت الكتف
            if y > nip - .2 and y < sh[1] - .4 and abs(nx) > .55 and ax > 1.15: r = "armpit"
        out[t] = RI[r]
    # الثدي (للأنثى فقط، ويظهر صدرًا عند الذكر)
    Pf = Vf[used]; Cf = Pf[T].mean(1)
    for t in range(len(T)):
        if REG[out[t]] != "chest": continue
        bwt = sum(bw[inv[vi]].get("breast.L", 0) + bw[inv[vi]].get("breast.R", 0) for vi in T[t]) / 3
        if bwt > .25: out[t] = RI["breast"]
    return out

TR = assign(male, female)
print("مناطق:", {REG[k]: int(v) for k, v in collections.Counter(TR.tolist()).items()})

# ---------- الملابس (احتشام): شورت للجميع، وقميص علوي للأنثى ----------
def clothing(V, g):
    """يُرجع لكل رأس ثلاث «مسافات موقّعة» (شعر، شورت، قميص): موجبة داخل القطعة وسالبة خارجها.
    المتصفح يرسم الحدّ عند الصفر بعد الاستيفاء، فتخرج حواف الملابس وخط الشعر ناعمة ومستقيمة."""
    P = V[used]; y0, y1 = P[:, 1].min(), P[:, 1].max()
    crotch = joint(V, "upperleg01.L____head")[1]
    knee = joint(V, "lowerleg01.L____head")[1]
    inv = {n: o for o, n in remap.items()}
    nip = joint(V, "breast.L____tail")[1]
    navel = joint(V, "spine03____head")[1]
    neck_y = joint(V, "neck01____head")[1]
    eyes = V[[i for gg, f in FACES if gg in ("helper-l-eye", "helper-r-eye") for i in f]]
    ey, ez = eyes[:, 1].mean(), eyes[:, 2].mean()
    headv = V[[inv[n] for n in range(M) if famw[inv[n]]["head"] > .5]]
    hw = np.abs(headv[:, 0]).max(); hh = y1 - ey
    sd = np.full((M, 3), -.5)
    waist = navel - (.45 if g == "male" else .25)
    hem = crotch - (1.45 if g == "male" else 1.75)
    sleeve = nip - .05
    for n in range(M):
        o = inv[n]; x, y, z = V[o]; fw = famw[o]
        armish = fw["uarm"] + fw["larm"] + fw["hand"]
        if fw["head"] + fw["neck"] > .5 and y > ey - .6 * hh:
            # خط الشعر: عند الجبهة من الأمام، وينخفض تدريجيًا إلى مؤخرة الرأس
            back = smoothstep(ez - .25, ez - 1.05, z)
            line = (ey + .50 * hh) * (1 - back) + (ey - (.42 if g == "female" else .12) * hh) * back
            if g == "female":  # الشعر ينسدل على الصدغين عند الأنثى
                line -= smoothstep(.35 * hw, .7 * hw, abs(x)) * .48 * hh * (1 - back * .3) * smoothstep(ez + .6, ez - .2, z)
            d = y - line
            # فتحة حول الأذنين والسوالف
            if abs(x) > .80 * hw and z > ez - 1.1:
                d = min(d, (ez - .75 - z) * 1.2 + (y - (ey + .3 * hh)) * .8) if g == "male" else min(d, (ez - 1.0 - z) * 1.6 + (y - (ey + .1 * hh)) * 1.4)
            # الحاجبان: قوس رفيع فوق كل عين
            xe = abs(eyes[:, 0]).mean()
            if z > ez - .15:
                yb = ey + .135 * hh - .9 * (abs(x) - xe - .02) ** 2
                db = min((.022 if g == 'female' else .028) * hh - abs(y - yb), .24 - abs(abs(x) - xe - .04))
                d = max(d, db * 2.2)
            sd[n, 0] = d
            continue
        if armish > .5:
            if g == "female" and fw["uarm"] > .3: sd[n, 2] = (y - sleeve)
            continue
        sd[n, 1] = min(waist - y, y - hem)  # الشورت
        if g == "female":  # قميص برقبة دائرية
            neckline = neck_y - .55 - .9 * smoothstep(.0, 1.0, z - .55) * .0 - .25 * (1 - smoothstep(.2, .9, abs(x)))
            sd[n, 2] = min(y - waist + .02, neckline - y)
    return np.clip(sd, -.5, .5)

def eye_mat():
    mat = np.zeros(M, dtype=np.uint8)
    eyeset = {remap[i] for gg, f in FACES if gg in ("helper-l-eye", "helper-r-eye") for i in f}
    for n in eyeset: mat[n] = 3
    return mat


# ---------- الشعر: حجم فوق فروة الرأس، وكعكة شعر خلف رأس الأنثى ----------
def vnormals(P):
    nrm = np.zeros_like(P)
    for q in T:
        a, b, c, d = P[q]
        n = np.cross(c - a, d - b); nrm[q] += n
    return nrm / (np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-9)

def cube_sphere(k=4):
    vs, idx = [], {}
    def vid(p):
        key = tuple(np.round(p, 5))
        if key not in idx: idx[key] = len(vs); vs.append(p)
        return idx[key]
    qs = []
    for ax in range(3):
        for sgn in (-1, 1):
            u, v = [(i) for i in range(3) if i != ax]
            for i in range(k):
                for j in range(k):
                    corners = []
                    for di, dj in ((0, 0), (1, 0), (1, 1), (0, 1)):
                        p = np.zeros(3); p[ax] = sgn; p[u] = -1 + 2 * (i + di) / k; p[v] = -1 + 2 * (j + dj) / k
                        corners.append(vid(p / np.linalg.norm(p)))
                    if sgn < 0: corners = corners[::-1]
                    qs.append(corners if ax != 1 else corners[::-1])
    return np.array(vs), np.array(qs)

BV, BQ = cube_sphere(4)
def hair_volume_and_bun(Pfull, g, sd):
    P = Pfull[used].copy()
    nrm = vnormals(P)
    w = np.clip(sd[:, 0] / .15, 0, 1)
    P += nrm * (w * (.07 if g == "female" else .045))[:, None]
    inv = {n: o for o, n in remap.items()}
    head = np.array([n for n in range(M) if famw[inv[n]]["head"] > .5])
    eyes = Pfull[[i for gg, f in FACES if gg in ("helper-l-eye", "helper-r-eye") for i in f]]
    ey = eyes[:, 1].mean(); hh = P[:, 1].max() - ey
    band = head[(P[head, 1] > ey - .25 * hh) & (P[head, 1] < ey + .15 * hh)]
    zb = P[band, 2].min()
    if g == "female":
        c = np.array([0, ey - .12 * hh, zb - .22]); r = np.array([.42, .36, .34])
        bun = BV * r + c
    else:
        bun = BV * 1e-3 + np.array([0, ey, zb + 1.0])  # مخفية داخل الرأس للذكر
    return P, bun

# ---------- الحفظ ----------
def q(P):
    return P
SDm, SDf = clothing(male, "male"), clothing(female, "female")
Pm, bunM = hair_volume_and_bun(male, "male", SDm)
Pf, bunF = hair_volume_and_bun(female, "female", SDf)
nB = len(BV)
allP = np.concatenate([Pm, Pf, bunF])
lo, hi = allP.min(0), allP.max(0)
scale = float((hi - lo).max())
center = (lo + hi) / 2; center[1] = lo[1]  # الأرض عند y=0
# محور الدوران في منتصف عمق الجذع (لا منتصف الصندوق، لأن القدمين تبرزان للأمام)
tor = male[[o for o in used if famw[o]["torso"] > .6]]
center[0] = 0.0; center[2] = float((tor[:, 2].min() + tor[:, 2].max()) / 2)
def enc(P): return np.round((P - center) / scale * 32000).astype(np.int16)
blobs, header = [], {"v": 2, "nV": M, "nQ": int(len(T)), "scale": scale / 32000, "regions": REG, "bodies": {}}
def add(arr):
    b = arr.tobytes(); off = sum(len(x) for x in blobs)
    pad = (-len(b)) % 4; blobs.append(b + b"\0" * pad); return [off, len(b)]
header["nV"] = M + nB; header["nQ"] = int(len(T) + len(BQ))
header["quad"] = add(np.concatenate([T, (BQ + M).astype(np.uint16)]).astype(np.uint16).reshape(-1))
header["treg"] = add(np.concatenate([TR, np.full(len(BQ), RI["occiput"], np.uint8)]).astype(np.uint8))
for g, P, mo, SD, bun in (("male", Pm, mm, SDm, bunM), ("female", Pf, fm, SDf, bunF)):
    sdb = np.full((nB, 3), -.5); sdb[:, 0] = .5 if g == "female" else -.5
    ent = {"pos": add(enc(np.concatenate([P, bun])).reshape(-1)), "mat": add(np.concatenate([eye_mat(), np.zeros(nB, np.uint8)])),
           "sd": add(np.round(np.concatenate([SD, sdb]) * 254).astype(np.int8).reshape(-1)), "morph": {}}
    for k, d in mo.items():
        d = d[used]; nz = np.where(np.abs(d).sum(1) > 1e-5)[0].astype(np.uint16)
        s = float(np.abs(d).max()) or 1.0
        ent["morph"][k] = {"idx": add(nz), "d": add(np.round(d[nz] / s * 32000).astype(np.int16).reshape(-1)), "s": s / scale, "n": int(len(nz))}
    header["bodies"][g] = ent
hj = json.dumps(header, separators=(",", ":")).encode()
hj += b" " * ((-len(hj)) % 4)
with open(OUT, "wb") as fo:
    fo.write(b"MB3D"); fo.write(struct.pack("<I", len(hj))); fo.write(hj)
    for b in blobs: fo.write(b)
import os
print("✔", OUT, f"{os.path.getsize(OUT)/1024:.0f} ك.ب", "رؤوس:", M, "أوجه رباعية:", len(T))
