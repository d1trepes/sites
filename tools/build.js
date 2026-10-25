#!/usr/bin/env node
/* =====================================================================
   СБОРЩИК: анкета → готовый сайт.
     node tools/build.js gtgarage            — собрать демо gtgarage/index.html
     node tools/build.js --all               — пересобрать все демо (после правки бланка)
     node tools/build.js gtgarage --launch https://gtgarage.by
                                             — версия для хостинга в _zapusk/gtgarage/
   ===================================================================== */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const ROOT = path.join(__dirname, "..");
const BLANK = path.join(ROOT, "blank");
const { render, strip } = require(path.join(BLANK, "render.js"));
const DEMO_BASE = "https://d1trepes.github.io/sites/";

const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const hash = f => crypto.createHash("md5").update(fs.readFileSync(f)).digest("hex").slice(0, 8);
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const hm = x => String(Math.floor(x)).padStart(2, "0") + ":" + String(Math.round((x % 1) * 60)).padStart(2, "0");

/* СТИЛИ САЙТА (поле "style" в анкете) → шрифты. Вид каждого стиля — в blank/blank.css, [data-style="…"] */
const STYLES = {
  "классика": "family=Onest:wght@400;500;600&family=Unbounded:wght@500;700",
  "мастерская": "family=Golos+Text:wght@400;500;600&family=Oswald:wght@500;600;700",
  "чистый": "family=Manrope:wght@400;500;600;700;800",
  "плакат": "family=Rubik:wght@400;500;600&family=Russo+One"
};

/* ПОВТОРЫ ТЕКСТА: одна и та же фраза в двух местах сайта или на другом сайте */
const TXT_KEYS = new Set(["title", "lead", "text", "t", "d", "sub", "note", "caption", "entry", "description", "ogDescription"]);
function texts(S) {
  const out = [];
  const walk = (v, where) => {
    if (Array.isArray(v)) return v.forEach(x => walk(x, where));
    if (!v || typeof v !== "object") return;
    for (const [k, x] of Object.entries(v)) {
      if (typeof x === "string" && TXT_KEYS.has(k)) out.push({ where, s: x });
      else if (typeof x === "object") walk(x, where);
    }
  };
  strip(S).blocks.forEach((b, i) => { if (b.type !== "reviews") walk(b, `${b.type}#${i + 1}`); });
  return out;
}
const words = s => s.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9\s]/g, " ").split(/\s+/).filter(Boolean);
const _sh = (s, n) => { const w = words(s), r = []; for (let i = 0; i + n <= w.length; i++) r.push(w.slice(i, i + n).join(" ")); return r; };
function repeats(S, dir) {
  const w = [], seen = new Map();
  // адрес, часы и цены повторять можно — это данные, а не фразы
  const addr = words(S.address || "").join(" ");
  const ok = sh => !addr.includes(sh) && sh.split(" ").filter(x => /\d/.test(x)).length < 2;
  const T = texts(S);
  const shingles = (s, n) => _sh(s, n).filter(ok);
  // внутри сайта: 5 слов подряд в двух разных блоках
  for (const { where, s } of T) for (const sh of new Set(shingles(s, 5))) {
    const prev = seen.get(sh);
    if (prev && prev !== where) { w.push(`повтор внутри сайта: «${sh}…» — в ${prev} и ${where}`); seen.set(sh, where); }
    else if (!prev) seen.set(sh, where);
  }
  // между сайтами: 6 слов подряд, которые уже есть на другом сайте
  const mine = new Map();
  T.forEach(({ where, s }) => shingles(s, 6).forEach(sh => mine.set(sh, where)));
  const hero = words(strip(S).blocks.find(b => b.type === "hero")?.title || "").join(" ");
  for (const d of fs.readdirSync(ROOT)) {
    const f = path.join(ROOT, d, "anketa.json");
    if (d === dir || !fs.existsSync(f)) continue;
    let O; try { O = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; }
    const other = new Set(texts(O).flatMap(x => shingles(x.s, 6)));
    const hit = [...mine].filter(([sh]) => other.has(sh));
    if (hit.length) w.push(`как на сайте ${d}: «${hit[0][0]}…» (${hit[0][1]})${hit.length > 1 ? ` и ещё ${hit.length - 1}` : ""} — перепиши своими словами`);
    if (hero && hero === words(O.blocks?.find(b => b.type === "hero")?.title || "").join(" ")) w.push(`заголовок первого экрана такой же, как у ${d}`);
  }
  return [...new Set(w)].slice(0, 8);
}

function check(S, dir) {
  const need = ["name", "phone", "address", "seo", "blocks"];
  const miss = need.filter(k => !S[k]);
  if (miss.length) throw new Error(`${dir}: в анкете нет полей: ${miss.join(", ")}`);
  if (!S.blocks.some(b => b.type === "hero")) throw new Error(`${dir}: нет блока hero (первый экран)`);
  // все картинки из анкеты должны лежать в папке
  const imgs = [];
  JSON.stringify(strip(S), (k, v) => { if (typeof v === "string" && /\.(webp|png|jpe?g|svg)$/i.test(v) && !/^https?:/.test(v)) imgs.push(v); return v; });
  const lost = imgs.filter(p => !fs.existsSync(path.join(ROOT, dir, p)));
  if (lost.length) throw new Error(`${dir}: нет картинок: ${lost.join(", ")}`);
}

/* подсказки по качеству: блоки, которые выглядят плохо */
function warn(S, dir) {
  const w = [], on = strip(S).blocks;
  for (const b of on) {
    if (b.type === "cards" && (b.items || []).length < 2) w.push("cards: меньше 2 карточек — блок не показан. Добавь карточки из данных или убери блок");
    if (b.type === "why" && (b.items || []).length + (b.brands ? 1 : 0) < 3) w.push("why: меньше 3 карточек — смотрится пусто");
    if (b.type === "hero" && b.title && b.title.length > 60) w.push("hero: заголовок длинный (>60 знаков) — будет больше 3 строк");
    if (b.type === "services" && b.style === "tiles" && (b.cols || 2) === 3) w.push("services: плитки в 3 колонки дают пустоты — лучше style: side");
  }
  if (on.length < 6) w.push(`всего ${on.length} блоков — сайт выглядит пустым, нужно 7+ (см. blank/БЛОКИ.md)`);
  if (S.style && !STYLES[S.style]) w.push(`style: нет стиля «${S.style}» — есть ${Object.keys(STYLES).join(", ")}`);
  w.push(...repeats(S, dir));
  w.forEach(x => console.log(`  ⚠ ${dir}: ${x}`));
}

function jsonld(S, url, ogImg) {
  const y = S.yandex || {};
  const prices = S.blocks.filter(b => b.type === "prices").flatMap(b => b.groups || []).flatMap(g => g.items.map(i => +i[1])).filter(n => n > 0);
  const ld = {
    "@context": "https://schema.org", "@type": "AutoRepair",
    name: S.name, url, image: ogImg || undefined,
    telephone: S.phones?.length ? [S.phone, ...S.phones.map(p => p.phone)].map(p => p.replace(/[^\d+]/g, "")) : S.phone.replace(/[^\d+]/g, ""),
    paymentAccepted: S.payment || undefined,
    address: { "@type": "PostalAddress", streetAddress: S.address.replace(/^Минск,\s*/, ""), addressLocality: S.city || "Минск", addressCountry: "BY" },
    openingHoursSpecification: (S.schedule || []).map(s => ({ "@type": "OpeningHoursSpecification", dayOfWeek: s.d.map(n => DAYS[n - 1]), opens: hm(s.from), closes: hm(s.to) })),
    priceRange: prices.length ? `${Math.min(...prices)}–${Math.max(...prices)} BYN` : undefined,
    currenciesAccepted: prices.length ? "BYN" : undefined,
    sameAs: y.url ? [y.url] : undefined,
    aggregateRating: y.rating ? { "@type": "AggregateRating", ratingValue: String(y.rating).replace(",", "."), ratingCount: y.marks, reviewCount: y.reviews, bestRating: 5 } : undefined
  };
  if (!ld.openingHoursSpecification.length) delete ld.openingHoursSpecification;
  return JSON.stringify(ld, null, 2);
}

function page(S, { url, css, js, demo }) {
  const seo = S.seo, hero = S.blocks.find(b => b.type === "hero");
  const ogF = path.join(S._dir, "img/og.jpg");
  // ?v=… — чтобы Telegram/Viber показали новую обложку, а не старую из своей памяти
  const ogImg = fs.existsSync(ogF) ? url + "img/og.jpg?v=" + hash(ogF) : "";
  const ac = S.accent || "#E10600";
  const cols = Object.entries(S.colors || {}).map(([k, v]) => `;--${k}:${v}`).join("");
  const style = `--ac:${ac};--ac-tx:${S.accentText || ac};--pin:${ac};--on-ac:${S.onAccent || "#ffffff"}${cols}`;
  const theme = S.theme || "тёмная";
  const st = STYLES[S.style] ? S.style : "классика";
  const bg = S.colors?.bg || (theme === "светлая" ? "#f5f1ea" : "#0b0b0c");
  return `<!doctype html>
<html lang="ru" data-theme="${esc(theme)}" data-style="${esc(st)}" style="${style}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cut">
${demo ? '<meta name="robots" content="noindex, nofollow">\n' : ""}<title>${esc(seo.title)}</title>
<meta name="description" content="${esc(seo.description)}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="${bg}">
<meta property="og:type" content="website">
<meta property="og:locale" content="ru_BY">
<meta property="og:site_name" content="${esc(S.name)}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(seo.ogTitle || seo.title)}">
<meta property="og:description" content="${esc(seo.ogDescription || seo.description)}">
${ogImg ? `<meta property="og:image" content="${ogImg}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">\n` : ""}${hero?.img ? `<link rel="preload" as="image" href="${esc(hero.img)}" fetchpriority="high">\n` : ""}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?${STYLES[st]}&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${css}">
<script>document.documentElement.classList.add("js")</script>
<script type="application/ld+json">
${jsonld(S, url, ogImg)}
</script>
</head>
<body>
<!-- Сайт собран из ${demo ? "анкеты anketa.json" : "анкеты"} и общего бланка. Править анкету, а не этот файл. -->
${render({ ...S, demo })}
<script src="${js}" defer></script>
</body>
</html>
`;
}

function extras(url, demo) {
  // демо не закрываем в robots.txt: иначе Viber/Telegram не покажут превью ссылки.
  // От поиска демо закрыто строкой noindex в самой странице.
  const robots = `User-agent: *\nAllow: /\nSitemap: ${url}sitemap.xml\n`;
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${url}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>\n</urlset>\n`;
  return { robots, sitemap };
}

function load(dir) {
  const f = path.join(ROOT, dir, "anketa.json");
  if (!fs.existsSync(f)) throw new Error(`${dir}: нет файла anketa.json`);
  let S;
  try { S = JSON.parse(fs.readFileSync(f, "utf8")); }
  catch (e) { throw new Error(`${dir}/anketa.json: ошибка в записи (${e.message})`); }
  S._dir = path.join(ROOT, dir);
  check(S, dir);
  warn(S, dir);
  return S;
}

function buildDemo(dir) {
  const S = load(dir), url = DEMO_BASE + dir + "/";
  const css = `../blank/blank.css?v=${hash(path.join(BLANK, "blank.css"))}`;
  const js = `../blank/site.js?v=${hash(path.join(BLANK, "site.js"))}`;
  fs.writeFileSync(path.join(S._dir, "index.html"), page(S, { url, css, js, demo: S.demo !== false }));
  const ex = extras(url, true);
  fs.writeFileSync(path.join(S._dir, "robots.txt"), ex.robots);
  fs.writeFileSync(path.join(S._dir, "sitemap.xml"), ex.sitemap);
  console.log(`✓ ${dir}: ${url}`);
}

function buildLaunch(dir, domain) {
  if (!/^https:\/\/[^/]+$/.test(domain.replace(/\/$/, ""))) throw new Error("Адрес сайта нужен в виде https://имя.by");
  const S = load(dir), url = domain.replace(/\/$/, "") + "/";
  const out = path.join(ROOT, "_zapusk", dir);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, "assets"), { recursive: true });
  for (const sub of ["img", "photos"]) {
    const src = path.join(S._dir, sub);
    if (fs.existsSync(src)) fs.cpSync(src, path.join(out, sub), { recursive: true, filter: f => !/screenshot/i.test(f) });
  }
  fs.copyFileSync(path.join(BLANK, "blank.css"), path.join(out, "assets/style.css"));
  fs.copyFileSync(path.join(BLANK, "site.js"), path.join(out, "assets/site.js"));
  fs.writeFileSync(path.join(out, "index.html"), page(S, { url, css: "assets/style.css", js: "assets/site.js", demo: false }));
  const ex = extras(url, false);
  fs.writeFileSync(path.join(out, "robots.txt"), ex.robots);
  fs.writeFileSync(path.join(out, "sitemap.xml"), ex.sitemap);
  console.log(`✓ ${dir}: версия для хостинга готова в папке _zapusk/${dir}/ (без плашки демо, для ${url})`);
}

const args = process.argv.slice(2);
try {
  if (!args.length) throw new Error("Укажи папку: node tools/build.js ИМЯ-ПАПКИ  (или --all)");
  if (args[0] === "--all") {
    const dirs = fs.readdirSync(ROOT).filter(d => fs.existsSync(path.join(ROOT, d, "anketa.json")));
    let bad = 0;
    for (const d of dirs) { try { buildDemo(d); } catch (e) { bad++; console.error("✗ " + e.message); } }
    require("./table.js").run();
    if (bad) process.exit(1);
  } else if (args[1] === "--launch") buildLaunch(args[0], args[2] || "");
  else { buildDemo(args[0]); require("./table.js").run(); }
} catch (e) { console.error("✗ " + e.message); process.exit(1); }
