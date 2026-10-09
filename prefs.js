/*! موصل (Mosel) — © 2026 Maro Shahaly. جميع الحقوق محفوظة. */
/* يُطبّق الوضع الليلي وحجم الخط قبل رسم الصفحة لتجنّب الوميض */
(function () {
  try {
    var t = localStorage.getItem("moselTheme");
    if (t === "dark" || t === "light") document.documentElement.setAttribute("data-theme", t);
    var z = +localStorage.getItem("moselZoom");
    if (z >= 80 && z <= 160) document.documentElement.style.setProperty("--ui-zoom", z / 100);
  } catch (e) { /* تخزين مقفول */ }
})();
