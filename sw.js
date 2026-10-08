/* موصل — service worker: التطبيق يفتح من غير نت بعد أول زيارة.
   غيّر VERSION مع أي تعديل في الملفات عشان الموبايلات تاخد التحديث. */
const VERSION = "mosel-v3.1.0";
const SHELL = ["./", "./index.html", "./app.js", "./data/conditions.js", "./manifest.json", "./icons/icon.svg", "./icons/icon-192.png", "./assets/body-male.jpg", "./assets/body-female.jpg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== location.origin && !isFont) return;
  // الشبكة الأول للملفات بتاعتنا (عشان التحديثات توصل)، والكاش لو مفيش نت
  e.respondWith(
    fetch(req).then(res => {
      if (res && (res.ok || res.type === "opaque")) {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === "navigate" ? caches.match("./index.html") : undefined)))
  );
});
