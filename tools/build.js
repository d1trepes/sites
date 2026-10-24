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
const { render } = require(path.join(BLANK, "render.js"));
const DEMO_BASE = "https://d1trepes.github.io/sites/";

const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const hash = f => crypto.createHash("md5").update(fs.readFileSync(f)).digest("hex").slice(0, 8);
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const hm = x => String(Math.floor(x)).padStart(2, "0") + ":" + String(Math.round((x % 1) * 60)).padStart(2, "0");

function check(S, dir) {
  const need = ["name", "phone", "address", "seo", "blocks"];
  const miss = need.filter(k => !S[k]);
  if (miss.length) throw new Error(`${dir}: в анкете нет полей: ${miss.join(", ")}`);
  if (!S.blocks.some(b => b.type === "hero")) throw new Error(`${dir}: нет блока hero (первый экран)`);
  // все картинки из анкеты должны лежать в папке
  const imgs = [];
  JSON.stringify(S, (k, v) => { if (typeof v === "string" && /\.(webp|png|jpe?g|svg)$/i.test(v) && !/^https?:/.test(v)) imgs.push(v); return v; });
  const lost = imgs.filter(p => !fs.existsSync(path.join(ROOT, dir, p)));
  if (lost.length) throw new Error(`${dir}: нет картинок: ${lost.join(", ")}`);
}

function jsonld(S, url, ogImg) {
  const y = S.yandex || {};
  const prices = S.blocks.filter(b => b.type === "prices").flatMap(b => b.groups || []).flatMap(g => g.items.map(i => +i[1])).filter(n => n > 0);
  const ld = {
    "@context": "https://schema.org", "@type": "AutoRepair",
    name: S.name, url, image: ogImg || undefined,
    telephone: S.phone.replace(/[^\d+]/g, ""),
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
  const ogImg = fs.existsSync(path.join(S._dir, "img/og.jpg")) ? url + "img/og.jpg" : "";
  const ac = S.accent || "#E10600";
  const style = `--ac:${ac};--ac-tx:${S.accentText || ac};--pin:${ac};--on-ac:${S.onAccent || "#ffffff"}`;
  const theme = S.theme || "тёмная";
  const bg = theme === "светлая" ? "#f5f1ea" : "#0b0b0c";
  return `<!doctype html>
<html lang="ru" data-theme="${esc(theme)}" style="${style}">
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
<link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600&family=Unbounded:wght@500;700&display=swap" rel="stylesheet">
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
    if (bad) process.exit(1);
  } else if (args[1] === "--launch") buildLaunch(args[0], args[2] || "");
  else buildDemo(args[0]);
} catch (e) { console.error("✗ " + e.message); process.exit(1); }
