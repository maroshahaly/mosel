/*! موصل (Mosel) — © 2026 Maro Shahaly. جميع الحقوق محفوظة. */
/* طبقات حماية النسخة المنشورة (تُستدعى من build_dist.mjs على مجلد dist/):
   1) بصمة نصية غير مرئية داخل نصوص الأمراض (محارف صفرية العرض تبقى مع النسخ واللصق)
   2) تشفير كل البيانات والصور في ملف واحد data/pack.bin بخوارزمية AES-256-GCM
   3) مُحمِّل (loader.js) يفك التشفير داخل المتصفح فقط على النطاقات المرخّصة (قفل النطاق)
   4) تعمية شيفرة المحمّل والتطبيق (obfuscation)
   5) علامة مائية مرئية وأخرى غير مرئية على الصور (tools/watermark.py)
   6) رؤوس أمان، وملف robots.txt، وبصمة SHA-384 للتحقق من سلامة الملفات (SRI)
   الحماية في المتصفح تصعّب السرقة والاقتباس كثيرًا ولا تجعلهما مستحيلين نظريًا؛ والدليل القانوني
   هو العلامات غير المرئية + سجل Git + ملف LICENSE. */
import { readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { webcrypto as crypto, createHash, randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const OWNER = "MOSEL|Maro Shahaly|2026";
// النطاقات المرخّصة؛ أضف نطاقك الخاص هنا أو في متغير البيئة MOSEL_DOMAINS (مفصولة بفواصل)
const DOMAINS = ["mosol.netlify.app", "mosel-health.mosel.workers.dev", "mosel-health.maro-shahaly.workers.dev", "localhost", "127.0.0.1",
  ...(process.env.MOSEL_DOMAINS || "").split(",").map(s => s.trim()).filter(Boolean)];

// ---------- 1) البصمة غير المرئية: بتات OWNER بمحرفين صفريي العرض بعد أول مسافة في كل تعريف ----------
const ZW0 = "​", ZW1 = "⁠";
const bits = [...Buffer.from(OWNER)].map(b => b.toString(2).padStart(8, "0")).join("");
const MARK = [...bits].map(b => (b === "1" ? ZW1 : ZW0)).join("");
export function fingerprintText(js) {
  // داخل حقول def: "...": نضع العلامة بعد أول مسافة (بين كلمتين، فلا تتأثر الحروف العربية المتصلة)
  return js.replace(/(def:\s*")([^"\s]+ )/g, (_, a, b) => a + b + MARK);
}
export function readFingerprint(text) {
  const m = text.match(/[​⁠]{16,}/);
  if (!m) return null;
  const b = [...m[0]].map(c => (c === ZW1 ? "1" : "0")).join("");
  return Buffer.from(b.match(/.{8}/g).map(x => parseInt(x, 2))).toString();
}

// ---------- 2) التشفير ----------
async function encrypt(buf, keyBytes) {
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const iv = randomBytes(12);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, buf));
  return Buffer.concat([iv, Buffer.from(ct)]);
}
const sri = buf => "sha384-" + createHash("sha384").update(buf).digest("base64");

export async function protect(out, { dataFiles, assetFiles }) {
  // البيانات: نجمع ملفات البيانات بالترتيب، ونضع البصمة، ثم نشفّر مع الصور
  const dataJs = dataFiles.map(f => fingerprintText(readFileSync(out + f, "utf8"))).join("\n;\n");
  const images = {};
  for (const f of assetFiles) images[f] = readFileSync(out + f).toString("base64");
  const payload = Buffer.from(JSON.stringify({ js: dataJs, img: images, sig: OWNER }), "utf8");
  const keyBytes = randomBytes(32);
  writeFileSync(out + "data/pack.bin", await encrypt(payload, keyBytes));
  for (const f of dataFiles) rmSync(out + f);
  for (const f of assetFiles) rmSync(out + f);

  // المفتاح يُقسَّم إلى جزأين مُقنَّعين (XOR) يُجمعان وقت التشغيل، ثم تُعمّى الشيفرة كلها
  const mask = randomBytes(32), k1 = Buffer.from(keyBytes.map((b, i) => b ^ mask[i]));
  const hostHash = DOMAINS.map(d => createHash("sha256").update(d).digest("hex").slice(0, 16));
  const loader = `/*! موصل (Mosel) — © 2026 Maro Shahaly. جميع الحقوق محفوظة. */
(async function(){
  var H=${JSON.stringify(hostHash)}, A="${k1.toString("base64")}", B="${mask.toString("base64")}";
  function b64(s){var b=atob(s),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;}
  async function h(s){var d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return Array.from(new Uint8Array(d)).map(function(x){return x.toString(16).padStart(2,"0");}).join("").slice(0,16);}
  function stop(){var c=document.getElementById("content");if(c)c.innerHTML='<div style="padding:40px 20px;text-align:center;line-height:1.9"><h2>نسخة غير مرخّصة</h2><p>هذه نسخة منسوخة من تطبيق «موصل» دون إذن مالكه.</p><p>النسخة الرسمية: <a href="https://mosel-health.mosel.workers.dev/">mosel-health.mosel.workers.dev</a></p></div>';}
  var ok=false; try{ ok=!!(window.crypto&&crypto.subtle)&&location.protocol!=="file:"&&H.indexOf(await h(location.hostname))>=0; }catch(e){ ok=false; }
  if(!ok){stop();return;}
  try{
    var a=b64(A),m=b64(B),k=new Uint8Array(32);for(var i=0;i<32;i++)k[i]=a[i]^m[i];
    var buf=new Uint8Array(await (await fetch("data/pack.bin",{cache:"no-cache"})).arrayBuffer());
    var key=await crypto.subtle.importKey("raw",k,"AES-GCM",false,["decrypt"]);
    var plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:buf.slice(0,12)},key,buf.slice(12));
    var p=JSON.parse(new TextDecoder().decode(plain));
    window.MOSEL_ASSETS={};
    Object.keys(p.img).forEach(function(f){var t=/\\.png$/.test(f)?"image/png":"image/jpeg";window.MOSEL_ASSETS[f]=URL.createObjectURL(new Blob([b64(p.img[f])],{type:t}));});
    var s=document.createElement("script");s.src=URL.createObjectURL(new Blob([p.js],{type:"text/javascript"}));
    s.onload=function(){var x=document.createElement("script");x.src="app.js";document.body.appendChild(x);};
    document.body.appendChild(s);
  }catch(e){stop();}
})();
`;
  writeFileSync(out + "loader.js", loader);

  // 4) التعمية
  const obf = (file, extra = []) => execFileSync("npx", ["--yes", "javascript-obfuscator@4.1.1", out + file, "--output", out + file,
    "--compact", "true", "--string-array", "true", "--string-array-encoding", "base64", "--string-array-threshold", "0.75",
    "--identifier-names-generator", "hexadecimal", "--rename-globals", "false", "--self-defending", "false", ...extra], { stdio: "pipe" });
  obf("loader.js", ["--control-flow-flattening", "true", "--dead-code-injection", "true", "--string-array-encoding", "rc4"]);
  obf("app.js");
  for (const f of ["loader.js", "app.js"]) {
    const s = readFileSync(out + f, "utf8");
    if (!s.startsWith("/*!")) writeFileSync(out + f, "/*! موصل (Mosel) — © 2026 Maro Shahaly. جميع الحقوق محفوظة. يُمنع النسخ أو إعادة النشر دون إذن كتابي. */\n" + s);
  }

  // index.html: نستبدل سكربتات البيانات والتطبيق بالمحمّل فقط، مع بصمة SRI
  let html = readFileSync(out + "index.html", "utf8");
  html = html.replace(/\s*<script src="data\/[^"]+"><\/script>/g, "").replace(/<script src="app\.js"><\/script>/,
    `<script src="loader.js" integrity="${sri(readFileSync(out + "loader.js"))}"></script>`);
  html = html.replace("<head>", `<head>\n<!-- © 2026 Maro Shahaly — موصل. جميع الحقوق محفوظة. ${createHash("sha256").update(OWNER).digest("hex").slice(0, 24)} -->`);
  writeFileSync(out + "index.html", html);

  // عامل الخدمة: يخزّن الملف المشفّر والمحمّل بدل ملفات البيانات والصور
  let sw = readFileSync(out + "sw.js", "utf8");
  sw = sw.replace(/"\.\/data\/[^"]+",\s*/g, "").replace(/"\.\/assets\/[^"]+",?\s*/g, "").replace('"./app.js",', '"./app.js", "./loader.js", "./data/pack.bin",');
  writeFileSync(out + "sw.js", sw);

  // رؤوس الأمان: السماح بسكربتات وصور blob: الناتجة عن فك التشفير محليًا فقط
  let hdr = readFileSync(out + "_headers", "utf8");
  hdr = hdr.replace("script-src 'self';", "script-src 'self' blob:;").replace("img-src 'self' data:;", "img-src 'self' data: blob:;");
  writeFileSync(out + "_headers", hdr);
  writeFileSync(out + "robots.txt", "User-agent: *\nDisallow: /data/\nDisallow: /assets/\nAllow: /\n");
  return { domains: DOMAINS, packBytes: readFileSync(out + "data/pack.bin").length };
}
