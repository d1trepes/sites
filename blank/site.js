/* БЛАНК: поведение страницы (меню, карта, цены на телефоне, появление блоков).
   Общий для всех сайтов. Данные сервиса сюда не пишем. */
(function () {
const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const root = document.documentElement;
const wide = matchMedia("(min-width: 761px)");

/* открыто ли сейчас (время Минска) */
const now = $(".now[data-schedule]");
if (now) {
  const sch = JSON.parse(now.dataset.schedule);
  const m = new Date(Date.now() + 3 * 3600e3), d = m.getUTCDay() || 7, h = m.getUTCHours() + m.getUTCMinutes() / 60;
  const t = sch.find(s => s.d.includes(d));
  const open = t && h >= t.from && h < t.to;
  const fmt = x => Math.floor(x) + ":" + String(Math.round((x % 1) * 60)).padStart(2, "0");
  now.classList.toggle("open", !!open);
  now.querySelector("span").textContent = open ? `Сейчас открыто, до ${fmt(t.to)}` : "Сейчас закрыто";
  now.hidden = false;
}

/* цены: на компьютере группы всегда открыты, на телефоне — по нажатию */
const pgs = [...$$(".pg")];
const syncPg = () => pgs.forEach((g, k) => g.open = wide.matches || k === 0);
syncPg(); wide.addEventListener("change", syncPg);
$$(".pg summary").forEach(s => s.addEventListener("click", e => { if (wide.matches) e.preventDefault(); }));

/* политика конфиденциальности */
const dlg = $("#privacy");
if (dlg) {
  const openP = () => { root.classList.add("lock"); dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", ""); };
  dlg.addEventListener("close", () => root.classList.remove("lock"));
  $$("[data-open=privacy]").forEach(b => b.onclick = openP);
  dlg.querySelector("[data-close]").onclick = () => dlg.close();
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  if (location.hash === "#privacy") openP();
}

/* меню и переходы к блокам */
const hdr = $(".hdr");
$(".burger").onclick = () => root.classList.toggle("menu-open");
hdr.addEventListener("click", e => { if (e.target === hdr) root.classList.remove("menu-open"); });
addEventListener("keydown", e => { if (e.key === "Escape") root.classList.remove("menu-open"); });
$$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
  const id = a.getAttribute("href"); if (id === "#") return;
  const t = id === "#top" ? document.body : $(id); if (!t) return;
  e.preventDefault(); root.classList.remove("menu-open");
  t.querySelectorAll(".rv").forEach(el => el.classList.add("in"));
  const top = id === "#top" ? 0 : scrollY + t.getBoundingClientRect().top - 64;
  scrollTo({ top: Math.max(0, top), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  history.replaceState(null, "", id);
}));

/* карта: грузится заранее, показывается плавно; на телефоне включается касанием */
const map = $(".map[data-src]");
if (map) {
  const load = () => {
    if (map.querySelector("iframe")) return;
    const f = document.createElement("iframe");
    f.src = map.dataset.src; f.title = "Мы на карте"; f.allowFullscreen = true;
    f.onload = () => setTimeout(() => map.classList.add("ok"), 150);
    map.appendChild(f);
  };
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { load(); o.disconnect(); } }, { rootMargin: "1200px 0px" }).observe(map);
  map.querySelector(".cover").onclick = e => e.currentTarget.remove();
}

/* до и после: ползунок */
$$(".ba input").forEach(r => r.addEventListener("input", () => r.parentElement.style.setProperty("--p", r.value + "%")));

/* кнопки: круг заливки растёт от места, где вошёл курсор */
$$(".btn").forEach(b => b.addEventListener("pointerenter", e => {
  const r = b.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  b.style.setProperty("--x", x + "px"); b.style.setProperty("--y", y + "px");
  b.style.setProperty("--s", 2.2 * Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y)) + "px");
}));

/* шапка с фоном после прокрутки */
const onScroll = () => hdr.classList.toggle("solid", scrollY > 20);
addEventListener("scroll", onScroll, { passive: true }); onScroll();

/* плавное появление блоков */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; e.target.classList.add("in"); io.unobserve(e.target);
}), { rootMargin: "0px 0px -8% 0px" });
$$(".rv").forEach(el => io.observe(el));
})();
