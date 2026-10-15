/*! موصل (Mosel) — © 2026 Maro Shahaly. جميع الحقوق محفوظة. */
/* يُطبّق الوضع الليلي وحجم الخط واللغة قبل رسم الصفحة لتجنّب الوميض */
(function () {
  try {
    var t = localStorage.getItem("moselTheme");
    if (t === "dark" || t === "light") document.documentElement.setAttribute("data-theme", t);
    // اللغة واتجاه الصفحة (العربية من اليمين، والإنجليزية من اليسار)
    if (localStorage.getItem("moselLang") === "en") { document.documentElement.lang = "en"; document.documentElement.dir = "ltr"; }
    var z = +localStorage.getItem("moselZoom");
    if (z >= 80 && z <= 160) document.documentElement.style.setProperty("--ui-zoom", z / 100);
  } catch (e) { /* تخزين مقفول */ }
})();
