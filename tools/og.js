#!/usr/bin/env node
/* =====================================================================
   ОБЛОЖКА ДЛЯ ССЫЛКИ (Viber, Telegram): ПАПКА/img/og.jpg, 1200×630.
   Рисуется сама из анкеты: название, заголовок первого экрана, рейтинг,
   телефон, адрес, картинка первого экрана, цвет и тема сайта.
     node tools/og.js gtgarage      — одна обложка
     node tools/og.js --all         — все
   Первый раз: cd tools && npm install
   ===================================================================== */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const plural = (n, a, b, c) => { const m = n % 100, k = n % 10; return (m > 10 && m < 20) ? c : k === 1 ? a : (k > 1 && k < 5) ? b : c; };

function html(S, dir) {
  const hero = S.blocks.find(b => b.type === "hero") || {};
  const light = S.theme === "светлая";
  const ac = S.accent || "#E10600", acTx = S.accentText || ac, onAc = S.onAccent || "#fff";
  const C = S.colors || {};
  const bg = C.bg || (light ? "#f5f1ea" : "#0b0b0c"), card = C.card || (light ? "#ffffff" : "#16161a"), line = C.line || (light ? "#e2dcd2" : "#26262b");
  const tx = C.tx || (light ? "#141414" : "#f3f3f1"), mut = C.mut || (light ? "#5f5f66" : "#9d9da3");
  const title = esc(hero.ogTitle || hero.title || S.name);
  const tag = hero.accentStyle === "mark" ? "mark" : "em";
  const t = hero.accent ? title.replace(esc(hero.accent), `<${tag}>${esc(hero.accent)}</${tag}>`) : title;
  const L = S.logo || {};
  const logoTxt = L.text || S.name;
  const logo = L.img ? `<img class="lg" src="${esc(L.img)}">`
    : (L.mark === "diamond" ? "<i></i>" : "") + (L.accent && logoTxt.startsWith(L.accent) ? `<b>${esc(L.accent)}</b>${esc(logoTxt.slice(L.accent.length))}` : esc(logoTxt));
  const y = S.yandex || {};
  const ip = hero.img ? path.join(ROOT, dir, hero.img) : "";
  const img = ip && fs.existsSync(ip) ? `data:image/${path.extname(ip).slice(1).replace("jpg", "jpeg")};base64,${fs.readFileSync(ip).toString("base64")}` : "";
  return `<!doctype html><html><head><meta charset="utf-8">
<style>@font-face{font-family:Onest;font-weight:400;src:url(file://${path.join(__dirname, "fonts")}/onest-cyrillic-400-normal.woff2);unicode-range:U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}@font-face{font-family:Onest;font-weight:400;src:url(file://${path.join(__dirname, "fonts")}/onest-latin-400-normal.woff2);unicode-range:U+0000-00FF,U+2000-206F,U+20AC,U+2122}@font-face{font-family:Onest;font-weight:500;src:url(file://${path.join(__dirname, "fonts")}/onest-cyrillic-500-normal.woff2);unicode-range:U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}@font-face{font-family:Onest;font-weight:500;src:url(file://${path.join(__dirname, "fonts")}/onest-latin-500-normal.woff2);unicode-range:U+0000-00FF,U+2000-206F,U+20AC,U+2122}@font-face{font-family:Onest;font-weight:600;src:url(file://${path.join(__dirname, "fonts")}/onest-cyrillic-600-normal.woff2);unicode-range:U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}@font-face{font-family:Onest;font-weight:600;src:url(file://${path.join(__dirname, "fonts")}/onest-latin-600-normal.woff2);unicode-range:U+0000-00FF,U+2000-206F,U+20AC,U+2122}@font-face{font-family:Unbounded;font-weight:700;src:url(file://${path.join(__dirname, "fonts")}/unbounded-cyrillic-700-normal.woff2);unicode-range:U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}@font-face{font-family:Unbounded;font-weight:700;src:url(file://${path.join(__dirname, "fonts")}/unbounded-latin-700-normal.woff2);unicode-range:U+0000-00FF,U+2000-206F,U+20AC,U+2122}</style>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:630px;background:${bg};color:${tx};font-family:Onest,sans-serif;overflow:hidden;position:relative}
.l{position:absolute;left:64px;top:56px;bottom:56px;width:620px;display:flex;flex-direction:column}
.logo{font:700 30px Unbounded;letter-spacing:-.02em;display:flex;align-items:center;gap:12px${L.color === "accent" ? ";color:" + acTx : ""}}.logo b{color:${ac}}.logo i{width:15px;height:15px;border-radius:4px;background:${ac};transform:rotate(45deg)}.lg{height:72px;width:auto}
h1 mark{background:linear-gradient(transparent 58%,${ac} 58%,${ac} 92%,transparent 92%);color:inherit;padding:0 .08em}
h1{font:700 56px/1.06 Unbounded;letter-spacing:-.03em;margin-top:auto;text-wrap:balance}
h1 em{font-style:normal;color:${acTx}}
.row{display:flex;align-items:center;gap:14px;margin-top:36px}
.tel{background:${ac};color:${onAc};font:600 24px Onest;padding:16px 28px;border-radius:99px;white-space:nowrap}
.rt{display:flex;align-items:center;gap:10px;border:1.5px solid ${line};border-radius:99px;padding:14px 22px;font:500 20px Onest;color:${mut};white-space:nowrap}
.rt b{font:700 24px Unbounded;color:${tx}}.rt i{color:#ffc531;font-style:normal;font-size:22px}
.adr{margin-top:18px;font:400 20px Onest;color:${mut}}
.r{position:absolute;right:0;top:0;bottom:0;width:470px;background:${ac};overflow:hidden;display:grid;place-items:center}
.r::before{content:"";position:absolute;width:560px;height:560px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.22),rgba(255,255,255,0) 70%)}
.r img{position:relative;max-width:410px;max-height:380px;filter:drop-shadow(0 24px 30px rgba(0,0,0,.35))}
</style></head><body>
<div class="l">
  <div class="logo">${logo}</div>
  <h1>${t}</h1>
  <div class="row">
    <span class="tel">${esc(S.phone)}</span>
    ${y.rating ? `<span class="rt"><i>★</i><b>${esc(y.rating)}</b>${y.marks ? `${y.marks} ${plural(y.marks, "оценка", "оценки", "оценок")}` : y.reviews ? `${y.reviews} ${plural(y.reviews, "отзыв", "отзыва", "отзывов")}` : ""}</span>` : ""}
  </div>
  <div class="adr">${esc(S.address)}</div>
</div>
${img ? `<div class="r"><img id="hi" src="${img}"></div>
<script>(()=>{const i=document.getElementById("hi");const go=()=>{const c=document.createElement("canvas");c.width=i.naturalWidth;c.height=i.naturalHeight;const x=c.getContext("2d");x.drawImage(i,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let a=c.width,b=c.height,e=0,f=0;for(let y=0;y<c.height;y++)for(let X=0;X<c.width;X++)if(d[(y*c.width+X)*4+3]>16){if(X<a)a=X;if(X>e)e=X;if(y<b)b=y;if(y>f)f=y}if(e<=a||f<=b)return;const o=document.createElement("canvas");o.width=e-a+1;o.height=f-b+1;o.getContext("2d").drawImage(c,a,b,o.width,o.height,0,0,o.width,o.height);i.onload=null;i.src=o.toDataURL();};i.complete?go():i.onload=go})()</script>` : ""}
</body></html>`;
}

async function browser() {
  let chromium, exe, args = [];
  try { ({ chromium } = require("playwright-core")); }
  catch { throw new Error("Нет программы для рисования обложки. Выполни один раз: cd tools && npm install"); }
  try { const sp = (await import("@sparticuz/chromium")).default; exe = await sp.executablePath(); args = sp.args; } catch { /* системный браузер */ }
  return chromium.launch({ executablePath: exe, args });
}

async function one(b, dir) {
  const f = path.join(ROOT, dir, "anketa.json");
  const S = JSON.parse(fs.readFileSync(f, "utf8"));
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  const tmp = path.join(ROOT, dir, ".og.html");
  fs.writeFileSync(tmp, html(S, dir));
  await p.goto("file://" + tmp, { waitUntil: "load", timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(600);
  await p.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.join(ROOT, dir, "img"), { recursive: true });
  await p.screenshot({ path: path.join(ROOT, dir, "img/og.jpg"), type: "jpeg", quality: 88 });
  fs.unlinkSync(tmp); await p.close();
  console.log(`✓ ${dir}/img/og.jpg`);
}

(async () => {
  const a = process.argv[2];
  if (!a) { console.error("Укажи папку: node tools/og.js ИМЯ-ПАПКИ  (или --all)"); process.exit(1); }
  const dirs = a === "--all" ? fs.readdirSync(ROOT).filter(d => fs.existsSync(path.join(ROOT, d, "anketa.json"))) : [a];
  for (const d of dirs) {           // свой браузер на каждую обложку — так надёжнее
    const b = await browser();
    try { await one(b, d); } catch (e) { console.error(`✗ ${d}: ${e.message}`); process.exitCode = 1; }
    await b.close();
  }
})().catch(e => { console.error("✗ " + e.message); process.exit(1); });
