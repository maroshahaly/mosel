/*! موصل (Mosel) — © 2026 Maro Shahaly. جميع الحقوق محفوظة. */
/* عارض الجسم ثلاثي الأبعاد (WebGL بلا مكتبات خارجية).
   النموذج مبني من MakeHuman (رخصة CC0) بأداة tools/build_body3d.py:
   شبكة رباعية لها منطقة طبية لكل وجه، وجسم ذكر وأنثى، وفروق تشكيل تُمزج حسب مؤشر كتلة الجسم والعمر.
   في المتصفح تُنعَّم الشبكة بتقسيم Catmull-Clark (أربعة أضعاف الأوجه) ويُحسب تظليل التجاويف (AO) لمظهر واقعي.
   الاختيار بالمؤشر أو اللمس يتم بقراءة لون المنطقة من إطار مخفي (picking). */
(function (root) {
  "use strict";
  function parse(buf) {
    const dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x4433424d) throw new Error("bad body3d");
    const hl = dv.getUint32(4, true);
    const H = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, hl)));
    const base = 8 + hl;
    const view = (T, [off, len]) => new T(buf, base + off, len / T.BYTES_PER_ELEMENT);
    const out = { H, quad: view(Uint16Array, H.quad), treg: view(Uint8Array, H.treg), bodies: {} };
    for (const g in H.bodies) {
      const b = H.bodies[g], morph = {};
      for (const k in b.morph) morph[k] = { idx: view(Uint16Array, b.morph[k].idx), d: view(Int16Array, b.morph[k].d), s: b.morph[k].s };
      out.bodies[g] = { pos: view(Int16Array, b.pos), mat: view(Uint8Array, b.mat), sd: view(Int8Array, b.sd), morph };
    }
    return out;
  }

  const VS = `attribute vec3 aP;attribute vec3 aN;attribute float aR;attribute float aM;attribute vec3 aS;attribute float aA;
uniform mat4 uMVP;uniform mat4 uM;varying vec3 vN;varying vec3 vW;varying float vR;varying float vM;varying vec3 vS;varying vec3 vMN;varying float vA;
void main(){vec4 w=uM*vec4(aP,1.);vW=w.xyz;vMN=aN;vA=aA;vN=mat3(uM)*aN;vR=aR;vM=aM;vS=aS;gl_Position=uMVP*vec4(aP,1.);}`;
  const FS = `precision mediump float;varying vec3 vN;varying vec3 vW;varying float vR;varying float vM;varying vec3 vS;varying vec3 vMN;varying float vA;
uniform vec3 uEye;uniform float uDbg;uniform float uHot;uniform float uSel;uniform float uT;uniform vec3 uSkin;
vec3 matCol(float m){ if(m<.5) return uSkin; if(m<1.5) return vec3(.23,.25,.28); if(m<2.5) return vec3(.10,.075,.06); if(m<3.5) return vec3(.06,.05,.05); return vec3(.30,.47,.46);}
void main(){
  vec3 n=normalize(vN); vec3 v=normalize(uEye-vW);
  if(dot(n,v)<0.) n=-n;
  float m=vM; if(m<.5){ if(vS.x>0.) m=2.; else if(vS.y>0.) m=1.; else if(vS.z>0.) m=4.; }
  vec3 base=matCol(m);
  if(m>2.5&&m<3.5){ float f=normalize(vMN).z; base=mix(vec3(.92,.90,.86),vec3(.24,.15,.09),smoothstep(.86,.9,f)); base=mix(base,vec3(.03),smoothstep(.965,.975,f)); }
  vec3 L1=normalize(vec3(.45,.75,.85)), L2=normalize(vec3(-.7,.25,.5)), L3=normalize(vec3(0.,.4,-1.));
  float skin=step(m,.5);
  float w=.35*skin+.1;
  float d1=max((dot(n,L1)+w)/(1.+w),0.), d2=max((dot(n,L2)+w)/(1.+w),0.);
  float rim=pow(1.-max(dot(n,v),0.),2.6);
  vec3 h=normalize(L1+v); float sp=pow(max(dot(n,h),0.),mix(18.,42.,skin))*mix(.06,.12,skin);
  vec3 sss=vec3(.25,.06,.03)*skin*(1.-d1)*d1*1.6;
  float sky=.5+.5*n.y;
  vec3 c=base*(.30*mix(vec3(.55,.5,.48),vec3(1.,.98,.96),sky)+ .95*d1*vec3(1.,.97,.92) + .32*d2*vec3(.85,.9,1.)) + sss + sp + rim*.18*vec3(1.,.92,.8)*max(dot(n,L3)+.6,0.);
  c*=mix(1.,vA,.9);
  if(uDbg>.5){ c=mix(c, fract(vec3(.37,.61,.83)*(vR+1.)*vec3(7.1,3.3,5.7))*(.35+.75*d1), .8); }
  float hot=1.-step(.5,abs(vR-uHot)); float sel=1.-step(.5,abs(vR-uSel));
  vec3 gold=vec3(.86,.66,.24);
  c=mix(c,gold*(.55+.6*d1),hot*.55);
  c=mix(c,vec3(.80,.18,.20)*(.6+.5*d1),sel*(.45+.15*sin(uT*4.)));
  gl_FragColor=vec4(pow(c,vec3(1./1.12)),1.);
}`;
  const PVS = `attribute vec3 aP;attribute float aR;uniform mat4 uMVP;varying float vR;void main(){vR=aR;gl_Position=uMVP*vec4(aP,1.);}`;
  const PFS = `precision mediump float;varying float vR;void main(){gl_FragColor=vec4((vR+1.)/255.,0.,0.,1.);}`;

  function sh(gl, type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  function prog(gl, vs, fs) { const p = gl.createProgram(); gl.attachShader(p, sh(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl, gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; }
  // مصفوفات 4×4 بسيطة (عمودية الترتيب)
  const mul = (a, b) => { const o = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; };
  const persp = (fy, asp, n, f) => { const t = 1 / Math.tan(fy / 2); return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]); };
  function lookAt(e, c) {
    let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2]; let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    let xx = zz, xy = 0, xz = -zx; l = Math.hypot(xx, xz) || 1; xx /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0, -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]);
  }
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); };

  /* طوبولوجيا الشبكة الرباعية (تُحسب مرة واحدة) */
  function topology(Q, nV) {
    const nQ = Q.length / 4, emap = new Map(), ev = [], ef = [], fe = new Int32Array(nQ * 4);
    for (let f = 0; f < nQ; f++) for (let k = 0; k < 4; k++) {
      const a = Q[f * 4 + k], b = Q[f * 4 + (k + 1) % 4], key = a < b ? a * 65536 + b : b * 65536 + a;
      let e = emap.get(key);
      if (e === undefined) { e = ev.length / 2; emap.set(key, e); ev.push(a, b); ef.push(f, -1); } else ef[e * 2 + 1] = f;
      fe[f * 4 + k] = e;
    }
    const nE = ev.length / 2, EV = Int32Array.from(ev), EF = Int32Array.from(ef);
    const fcnt = new Int32Array(nV), ecnt = new Int32Array(nV), bcnt = new Int32Array(nV), bnb = new Int32Array(nV * 2).fill(-1);
    for (let f = 0; f < nQ * 4; f++) fcnt[Q[f]]++;
    for (let e = 0; e < nE; e++) {
      const a = EV[e * 2], b = EV[e * 2 + 1]; ecnt[a]++; ecnt[b]++;
      if (EF[e * 2 + 1] < 0) { for (const [v, o] of [[a, b], [b, a]]) { if (bcnt[v] < 2) bnb[v * 2 + bcnt[v]] = o; bcnt[v]++; } }
    }
    // الأوجه الأبناء بعد التقسيم: لكل وجه أربعة أوجه رباعية
    const n1 = nV + nQ + nE, Q1 = new Uint32Array(nQ * 16);
    for (let f = 0; f < nQ; f++) for (let k = 0; k < 4; k++) {
      const o = (f * 4 + k) * 4;
      Q1[o] = Q[f * 4 + k]; Q1[o + 1] = nV + nQ + fe[f * 4 + k]; Q1[o + 2] = nV + f; Q1[o + 3] = nV + nQ + fe[f * 4 + (k + 3) % 4];
    }
    return { nV, nQ, nE, EV, EF, fe, fcnt, ecnt, bcnt, bnb, n1, Q1 };
  }
  /* تقسيم Catmull-Clark لأي خاصية خطية (الموضع، أو مسافات الملابس) ذات بُعد d */
  function subdivide(tp, Q, X, d) {
    const { nV, nQ, nE, EV, EF, fcnt, ecnt, bcnt, bnb } = tp, out = new Float32Array(tp.n1 * d);
    for (let f = 0; f < nQ; f++) for (let j = 0; j < d; j++) out[(nV + f) * d + j] = (X[Q[f * 4] * d + j] + X[Q[f * 4 + 1] * d + j] + X[Q[f * 4 + 2] * d + j] + X[Q[f * 4 + 3] * d + j]) / 4;
    const Fs = new Float64Array(nV * d), Rs = new Float64Array(nV * d);
    for (let f = 0; f < nQ; f++) for (let k = 0; k < 4; k++) { const v = Q[f * 4 + k]; for (let j = 0; j < d; j++) Fs[v * d + j] += out[(nV + f) * d + j]; }
    for (let e = 0; e < nE; e++) {
      const a = EV[e * 2], b = EV[e * 2 + 1], f0 = EF[e * 2], f1 = EF[e * 2 + 1], o = (nV + nQ + e) * d;
      for (let j = 0; j < d; j++) {
        const m = (X[a * d + j] + X[b * d + j]) / 2;
        out[o + j] = f1 < 0 ? m : (X[a * d + j] + X[b * d + j] + out[(nV + f0) * d + j] + out[(nV + f1) * d + j]) / 4;
        Rs[a * d + j] += m; Rs[b * d + j] += m;
      }
    }
    for (let v = 0; v < nV; v++) for (let j = 0; j < d; j++) {
      const P = X[v * d + j];
      if (bcnt[v]) out[v * d + j] = bcnt[v] === 2 ? (6 * P + X[bnb[v * 2] * d + j] + X[bnb[v * 2 + 1] * d + j]) / 8 : P;
      else { const n = ecnt[v]; out[v * d + j] = (Fs[v * d + j] / fcnt[v] + 2 * Rs[v * d + j] / n + (n - 3) * P) / n; }
    }
    return out;
  }

  function create(canvas, buf, opt) {
    const M = parse(buf), H = M.H, nV = H.nV, nQ = H.nQ;
    const tp = topology(M.quad, nV), nT = nQ * 8;  // كل وجه ← 4 أوجه ← 8 مثلثات
    const gl = canvas.getContext("webgl", { antialias: true, alpha: true, preserveDrawingBuffer: false });
    if (!gl) throw new Error("no webgl");
    const P = prog(gl, VS, FS), PP = prog(gl, PVS, PFS);
    const loc = (p, n) => gl.getAttribLocation(p, n), uni = (p, n) => gl.getUniformLocation(p, n);
    const bufP = gl.createBuffer(), bufN = gl.createBuffer(), bufR = gl.createBuffer(), bufM = gl.createBuffer(), bufS = gl.createBuffer(), bufA = gl.createBuffer();
    const R = new Float32Array(nT * 3);
    const regKeys = H.regions, regIdx = Object.fromEntries(regKeys.map((k, i) => [k, i]));
    let pos = new Float32Array(nV * 3), height = 1;
    // لكل منطقة مركزان (يمين ويسار) واتجاهان، فتظهر أسماء المناطق المزدوجة (الذراعين، الأذنين...) على الجهة المواجهة
    const NR = regKeys.length, cen = new Float32Array(NR * 6), rn = new Float32Array(NR * 4), rc = new Float32Array(NR * 2);
    const st = { yaw: opt.yaw || 0, pitch: 0, zoom: 1, panY: 0, hot: -1, sel: -1, sex: "male", vel: 0, t0: performance.now() };

    function build(sex, f) {
      const b = M.bodies[sex], s = H.scale, Q = M.quad, Q1 = tp.Q1, n1 = tp.n1;
      for (let i = 0; i < nV * 3; i++) pos[i] = b.pos[i] * s;
      // فرق التشكيل بالوحدات الأصلية = d × s × scale (انظر build_body3d.py)
      for (const k in f) { const m = b.morph[k], w = f[k]; if (!m || !w) continue; const ks = w * m.s * s; for (let j = 0; j < m.idx.length; j++) { const v = m.idx[j] * 3; pos[v] += ks * m.d[j * 3]; pos[v + 1] += ks * m.d[j * 3 + 1]; pos[v + 2] += ks * m.d[j * 3 + 2]; } }
      // التنعيم
      const sd0 = new Float32Array(nV * 3); for (let i = 0; i < nV * 3; i++) sd0[i] = b.sd[i] / 254;
      const P1 = subdivide(tp, Q, pos, 3), S1 = subdivide(tp, Q, sd0, 3);
      // المتجهات العمودية الناعمة على الشبكة المقسّمة
      const nrm = new Float32Array(n1 * 3), nb = new Float32Array(n1 * 3), nbc = new Float32Array(n1);
      const tri = (a, bb, c) => {
        const ux = P1[bb * 3] - P1[a * 3], uy = P1[bb * 3 + 1] - P1[a * 3 + 1], uz = P1[bb * 3 + 2] - P1[a * 3 + 2];
        const vx = P1[c * 3] - P1[a * 3], vy = P1[c * 3 + 1] - P1[a * 3 + 1], vz = P1[c * 3 + 2] - P1[a * 3 + 2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        for (const v of [a, bb, c]) { nrm[v * 3] += nx; nrm[v * 3 + 1] += ny; nrm[v * 3 + 2] += nz; }
      };
      for (let q = 0; q < nQ * 4; q++) {
        const o = q * 4; tri(Q1[o], Q1[o + 1], Q1[o + 2]); tri(Q1[o], Q1[o + 2], Q1[o + 3]);
        for (let k = 0; k < 4; k++) { const v = Q1[o + k]; for (let j = 1; j < 4; j++) { const u = Q1[o + (k + j) % 4]; nb[v * 3] += P1[u * 3]; nb[v * 3 + 1] += P1[u * 3 + 1]; nb[v * 3 + 2] += P1[u * 3 + 2]; } nbc[v] += 3; }
      }
      for (let v = 0; v < n1; v++) { const l = Math.hypot(nrm[v * 3], nrm[v * 3 + 1], nrm[v * 3 + 2]) || 1; nrm[v * 3] /= l; nrm[v * 3 + 1] /= l; nrm[v * 3 + 2] /= l; }
      // تظليل التجاويف: كلما كان الرأس داخل تجويف (الإبط، تحت الذقن، بين الأصابع، الثنيات) أصبح أغمق قليلًا
      const ao = new Float32Array(n1);
      for (let v = 0; v < n1; v++) {
        const c = nbc[v] || 1, dx = nb[v * 3] / c - P1[v * 3], dy = nb[v * 3 + 1] / c - P1[v * 3 + 1], dz = nb[v * 3 + 2] / c - P1[v * 3 + 2];
        const cav = (dx * nrm[v * 3] + dy * nrm[v * 3 + 1] + dz * nrm[v * 3 + 2]) / (Math.hypot(dx, dy, dz) + 1e-4);
        ao[v] = Math.max(0, cav);
      }
      // تنعيم مرتين ثم تظليل خفيف (لا يتجاوز 22%) حتى لا يبدو كبقع
      for (let pass = 0; pass < 3; pass++) {
        const ao2 = new Float32Array(n1), aoc = new Float32Array(n1);
        for (let q = 0; q < nQ * 4; q++) for (let k = 0; k < 4; k++) { const v = Q1[q * 4 + k]; for (let j = 0; j < 4; j++) { ao2[v] += ao[Q1[q * 4 + j]]; aoc[v]++; } }
        for (let v = 0; v < n1; v++) ao[v] = ao2[v] / (aoc[v] || 1);
      }
      for (let v = 0; v < n1; v++) ao[v] = 1 - Math.min(.22, Math.max(0, ao[v] - .12) * .55);
      const alias = (opt.alias && opt.alias(sex)) || {};
      const EP = new Float32Array(nT * 9), EN = new Float32Array(nT * 9), EM = new Float32Array(nT * 3), ES = new Float32Array(nT * 9), EA = new Float32Array(nT * 3);
      cen.fill(0); rn.fill(0); rc.fill(0);
      let ymin = 1e9, ymax = -1e9, t = 0;
      for (let fq = 0; fq < nQ; fq++) {
        const k0 = regKeys[M.treg[fq]], reg = alias[k0] != null ? regIdx[alias[k0]] : M.treg[fq];
        const eye = b.mat[Q[fq * 4]] === 3 && b.mat[Q[fq * 4 + 2]] === 3 ? 3 : 0;
        for (let c = 0; c < 4; c++) {
          const o = (fq * 4 + c) * 4;
          for (const tri3 of [[Q1[o], Q1[o + 1], Q1[o + 2]], [Q1[o], Q1[o + 2], Q1[o + 3]]]) {
            for (let k = 0; k < 3; k++) {
              const v = tri3[k], i3 = (t * 3 + k) * 3;
              EP[i3] = P1[v * 3]; EP[i3 + 1] = P1[v * 3 + 1]; EP[i3 + 2] = P1[v * 3 + 2];
              EN[i3] = nrm[v * 3]; EN[i3 + 1] = nrm[v * 3 + 1]; EN[i3 + 2] = nrm[v * 3 + 2];
              ES[i3] = S1[v * 3]; ES[i3 + 1] = S1[v * 3 + 1]; ES[i3 + 2] = S1[v * 3 + 2];
              EM[t * 3 + k] = eye; EA[t * 3 + k] = ao[v]; R[t * 3 + k] = reg;
              const hs = P1[v * 3] < 0 ? 0 : 1, qq = reg * 2 + hs;
              rn[qq * 2] += nrm[v * 3]; rn[qq * 2 + 1] += nrm[v * 3 + 2]; cen[qq * 3] += P1[v * 3]; cen[qq * 3 + 1] += P1[v * 3 + 1]; cen[qq * 3 + 2] += P1[v * 3 + 2]; rc[qq]++;
              const y = P1[v * 3 + 1]; if (y < ymin) ymin = y; if (y > ymax) ymax = y;
            }
            t++;
          }
        }
      }
      for (let q = 0; q < NR * 2; q++) if (rc[q]) for (let k = 0; k < 3; k++) cen[q * 3 + k] /= rc[q];
      height = ymax - ymin; st.ymin = ymin;
      const up = (bf, arr) => { gl.bindBuffer(gl.ARRAY_BUFFER, bf); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW); };
      up(bufP, EP); up(bufN, EN); up(bufM, EM); up(bufS, ES); up(bufR, R); up(bufA, EA);
    }

    let fb = null, fbTex = null, fbDepth = null, fbW = 0, fbH = 0;
    function ensureFB(w, h) {
      if (fb && fbW === w && fbH === h) return;
      if (fb) { gl.deleteFramebuffer(fb); gl.deleteTexture(fbTex); gl.deleteRenderbuffer(fbDepth); }
      fb = gl.createFramebuffer(); fbTex = gl.createTexture(); fbDepth = gl.createRenderbuffer();
      gl.bindTexture(gl.TEXTURE_2D, fbTex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindRenderbuffer(gl.RENDERBUFFER, fbDepth); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, fbDepth);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); fbW = w; fbH = h;
    }

    let MVP, MM, eye;
    function matrices() {
      const w = canvas.width, h = canvas.height, fov = 0.42;
      const ty = st.ymin + height * (0.5 + st.panY);
      const dist = (height * 0.56) / Math.tan(fov / 2) / st.zoom;
      eye = [0, ty + Math.sin(st.pitch) * dist, Math.cos(st.pitch) * dist];
      MM = rotY(st.yaw);
      MVP = mul(persp(fov, w / h, dist * 0.2, dist * 3), mul(lookAt(eye, [0, ty, 0]), MM));
    }
    function bindAttr(p, name, b, size) { const l = loc(p, name); if (l < 0) return; gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, 0, 0); }
    function draw() {
      const w = canvas.width, h = canvas.height;
      matrices();
      gl.viewport(0, 0, w, h); gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(P);
      bindAttr(P, "aP", bufP, 3); bindAttr(P, "aN", bufN, 3); bindAttr(P, "aR", bufR, 1); bindAttr(P, "aM", bufM, 1); bindAttr(P, "aS", bufS, 3); bindAttr(P, "aA", bufA, 1);
      gl.uniformMatrix4fv(uni(P, "uMVP"), false, MVP); gl.uniformMatrix4fv(uni(P, "uM"), false, MM);
      gl.uniform3fv(uni(P, "uEye"), eye); gl.uniform1f(uni(P, "uHot"), st.hot); gl.uniform1f(uni(P, "uDbg"), opt.debug ? 1 : 0); gl.uniform1f(uni(P, "uSel"), st.sel);
      gl.uniform1f(uni(P, "uT"), (performance.now() - st.t0) / 1000); gl.uniform3fv(uni(P, "uSkin"), opt.skin || [0.70, 0.52, 0.42]);
      gl.drawArrays(gl.TRIANGLES, 0, nT * 3);
    }
    function pick(cx, cy) {
      const r = canvas.getBoundingClientRect(), dpr = canvas.width / r.width;
      const x = Math.floor((cx - r.left) * dpr), y = Math.floor(canvas.height - (cy - r.top) * dpr);
      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return null;
      ensureFB(canvas.width, canvas.height);
      matrices();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.viewport(0, 0, canvas.width, canvas.height); gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(PP); bindAttr(PP, "aP", bufP, 3); bindAttr(PP, "aR", bufR, 1);
      gl.uniformMatrix4fv(uni(PP, "uMVP"), false, MVP);
      gl.drawArrays(gl.TRIANGLES, 0, nT * 3);
      const px = new Uint8Array(4); gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return px[0] ? regKeys[px[0] - 1] : null;
    }
    // موضع منطقة على الشاشة (لإظهار اسمها عند الاختيار بلوحة المفاتيح) وهل هي مواجهة للمشاهد
    function project(key) {
      const r = regIdx[key]; if (r == null) return null;
      matrices();
      const b = canvas.getBoundingClientRect(), tot = rc[r * 2] + rc[r * 2 + 1];
      if (!tot) return null;
      const cs = Math.cos(st.yaw), sn = Math.sin(st.yaw);
      const face = q => { const nx = rn[q * 2], nz = rn[q * 2 + 1], l = Math.hypot(nx, nz) || 1; return (-sn * nx + cs * nz) / l; };
      // منطقة مزدوجة إذا كان في كل جهة ربعها على الأقل؛ وإلا نستخدم المركز الكلي
      let p;
      const paired = Math.min(rc[r * 2], rc[r * 2 + 1]) > tot * .25 && Math.abs(cen[r * 6] - cen[r * 6 + 3]) > .6;
      let f;
      if (paired) { const q = face(r * 2) >= face(r * 2 + 1) ? r * 2 : r * 2 + 1; p = [cen[q * 3], cen[q * 3 + 1], cen[q * 3 + 2], 1]; f = face(q); }
      else {
        p = [0, 0, 0, 1]; for (let k = 0; k < 3; k++) p[k] = (cen[r * 6 + k] * rc[r * 2] + cen[r * 6 + 3 + k] * rc[r * 2 + 1]) / tot;
        const nx = rn[r * 4] + rn[r * 4 + 2], nz = rn[r * 4 + 1] + rn[r * 4 + 3], l = Math.hypot(nx, nz) || 1; f = (-sn * nx + cs * nz) / l;
      }
      const c = [0, 0, 0, 0]; for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) c[i] += MVP[k * 4 + i] * p[k];
      return { x: (c[0] / c[3] * .5 + .5) * b.width, y: (1 - (c[1] / c[3] * .5 + .5)) * b.height, facing: f > 0.15 };
    }

    // الحلقة: نرسم فقط عند الحاجة (تحريك أو منطقة مختارة تنبض)
    let raf = 0, alive = true;
    function frame() {
      raf = 0; if (!alive) return;
      if (Math.abs(st.vel) > 0.0005 && !drag) { st.yaw += st.vel; st.vel *= 0.92; if (opt.onTurn) opt.onTurn(st.yaw); }
      resize(); draw();
      if (Math.abs(st.vel) > 0.0005 || st.sel >= 0 || st.anim) raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    function resize() {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
      if (w && h && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; }
    }

    // التحكم: سحب أفقي يلف الجسم بحرية 360°، وسحب رأسي يحرّك العرض عند التكبير، وعجلة/قرص للتكبير
    let drag = null;
    const pts = new Map();
    canvas.addEventListener("pointerdown", e => {
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      try { canvas.setPointerCapture(e.pointerId); } catch (x) { /* */ }
      if (pts.size === 2) { const [a, b] = [...pts.values()]; drag = { pinch: Math.hypot(a[0] - b[0], a[1] - b[1]), z: st.zoom }; return; }
      drag = { x: e.clientX, y: e.clientY, yaw: st.yaw, pan: st.panY, moved: false, t: performance.now(), lx: e.clientX, type: e.pointerType };
      st.vel = 0;
    });
    canvas.addEventListener("pointermove", e => {
      if (pts.has(e.pointerId)) pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (drag && drag.pinch && pts.size === 2) { const [a, b] = [...pts.values()]; st.zoom = Math.min(2.8, Math.max(1, drag.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / drag.pinch)); kick(); return; }
      if (drag && !drag.pinch) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) > 6) { drag.moved = true; if (opt.onDragStart) opt.onDragStart(); }
        if (drag.moved) {
          e.preventDefault();
          const w = canvas.getBoundingClientRect().width;
          st.yaw = drag.yaw + dx / w * Math.PI * 1.6;
          st.vel = (e.clientX - drag.lx) / w * Math.PI * 1.6 * .5; drag.lx = e.clientX;
          if (st.zoom > 1.05) st.panY = Math.max(-.42, Math.min(.42, drag.pan + dy / canvas.getBoundingClientRect().height / st.zoom));
          if (opt.onTurn) opt.onTurn(st.yaw);
          kick(); return;
        }
      }
      if (!drag && e.pointerType === "mouse" && opt.onHover) {
        const k = pick(e.clientX, e.clientY);
        if (k !== hoverKey) { hoverKey = k; setHot(k); opt.onHover(k, e.clientX, e.clientY); }
      }
    }, { passive: false });
    let hoverKey = null;
    function end(e) {
      pts.delete(e.pointerId);
      if (!drag) return;
      const d = drag; drag = null;
      if (d.pinch) return;
      if (!d.moved && e.type === "pointerup") { const k = pick(e.clientX, e.clientY); if (opt.onPick) opt.onPick(k, e.clientX, e.clientY, d.type); }
      else kick();
    }
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("lostpointercapture", e => { if (drag && pts.has(e.pointerId)) end(e); });
    canvas.addEventListener("pointerleave", e => { if (e.pointerType === "mouse" && !drag) { hoverKey = null; setHot(null); if (opt.onHover) opt.onHover(null); } });
    canvas.addEventListener("wheel", e => { if (!e.ctrlKey) return; // العجلة العادية تمرّر الصفحة؛ Ctrl+العجلة أو قرص لوحة اللمس للتكبير
       e.preventDefault(); st.zoom = Math.min(2.8, Math.max(1, st.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12))); if (st.zoom <= 1.01) st.panY = 0; kick(); }, { passive: false });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => kick()) : null;
    if (ro) ro.observe(canvas);

    function setHot(k) { st.hot = k == null ? -1 : regIdx[k] ?? -1; kick(); }
    const api = {
      regions: regKeys,
      setBody(sex, f) { st.sex = sex; build(sex, f || {}); kick(); },
      setHot, setSel(k) { st.sel = k == null ? -1 : regIdx[k] ?? -1; kick(); },
      turn(d) { st.vel = 0; animateTo(st.yaw + d); },
      face(a) { st.vel = 0; const cur = st.yaw, tgt = a + Math.round((cur - a) / (2 * Math.PI)) * 2 * Math.PI; animateTo(tgt); },
      zoom(f) { st.zoom = Math.min(2.8, Math.max(1, f === 0 ? 1 : st.zoom * f)); if (st.zoom <= 1.01) st.panY = 0; canvas.style.touchAction = st.zoom > 1.01 ? "none" : "pan-y"; kick(); },
      view(z, py) { st.zoom = z; st.panY = py; kick(); },
      get yaw() { return st.yaw; }, get zoomLevel() { return st.zoom; },
      project, pick, redraw: kick,
      destroy() { alive = false; if (ro) ro.disconnect(); const ext = gl.getExtension("WEBGL_lose_context"); if (ext) ext.loseContext(); }
    };
    function animateTo(tgt) {
      const from = st.yaw, t0 = performance.now(), dur = 520; st.anim = true;
      (function step() { const k = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - k, 3); st.yaw = from + (tgt - from) * e; if (opt.onTurn) opt.onTurn(st.yaw); draw(); if (k < 1) requestAnimationFrame(step); else { st.anim = false; kick(); } })();
    }
    resize();
    return api;
  }
  root.MoselBody3D = { create, parse };
})(window);
