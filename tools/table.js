#!/usr/bin/env node
/* =====================================================================
   ТАБЛИЦА КЛИЕНТОВ — собирается сама из папок сервисов:
     ПАПКА/anketa.json — название, телефоны, адрес, рейтинг, цвет, демо
     ПАПКА/crm.json    — статус, следующий шаг, даты, цена, домен, заметка
   Пишет: clients.md (для Claude), clients.csv (открыть в Excel / Google Таблицах),
          tablica/index.html (страница-таблица: d1trepes.github.io/sites/tablica/)
   Запускается сама после node tools/build.js. Вручную: node tools/table.js
   ===================================================================== */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const DEMO = "https://d1trepes.github.io/sites/";
const STATUSES = ["кандидат", "демо готово", "позвонил", "скинул демо", "думает", "правки", "оплатил", "запущен", "отказ"];
const read = f => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; } };
const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function rows() {
  const skip = new Set(["blank", "tools", "archive", "tablica", "node_modules", "_zapusk", "_check"]);
  return fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith(".") && !skip.has(d.name))
    .map(d => {
      const A = read(path.join(ROOT, d.name, "anketa.json")) || {};
      const C = read(path.join(ROOT, d.name, "crm.json")) || {};
      if (!A.name && !C.name) return null;
      const y = A.yandex || {};
      const phones = [A.phone || C.phone, ...(A.phones || []).map(p => p.phone)].filter(Boolean);
      return {
        folder: d.name,
        name: A.name || C.name,
        phones: phones.map(p => op(p) ? `${p} (${op(p)})` : p).join(", "),
        address: A.address || C.address || "",
        rating: y.rating ? `${y.rating}${y.reviews ? ` · ${y.reviews} отз.` : ""}` : (C.rating || ""),
        yandex: y.url || C.yandex || "",
        demo: A.blocks ? DEMO + d.name + "/" : "",
        color: A.accent ? `${A.style || "классика"}, ${A.theme || ""} ${A.accent}`.trim() : "",
        status: C.status || (A.blocks ? "демо готово" : "кандидат"),
        next: C.next || "",
        created: C.created || "",
        last: C.lastContact || "",
        price: C.price || "",
        domain: C.domain || "",
        note: C.note || ""
      };
    }).filter(Boolean)
    .sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || a.name.localeCompare(b.name, "ru"));
}

// Оператор по коду белорусского номера: 29 (1,3,6,9) и 44 — A1; 29 (2,5,7,8) и 33 — МТС; 25 — life:); 17 и др. — городской
function op(p) {
  const d = p.replace(/\D/g, "").replace(/^375/, "").replace(/^80/, "");
  const c = d.slice(0, 2), n = d[2];
  if (c === "44") return "A1";
  if (c === "33") return "МТС";
  if (c === "25") return "life:)";
  if (c === "29") return "1369".includes(n) ? "A1" : "2578".includes(n) ? "МТС" : "";
  if (d.length === 9) return "городской";
  return "";
}

const COLS = [["name", "Название"], ["status", "Статус"], ["next", "Следующий шаг"], ["phones", "Телефон"], ["address", "Адрес"],
  ["rating", "Рейтинг"], ["demo", "Демо"], ["yandex", "Яндекс Карты"], ["color", "Стиль и цвет"], ["created", "Создан"],
  ["last", "Последний контакт"], ["price", "Цена"], ["domain", "Домен"], ["note", "Заметка"], ["folder", "Папка"]];

function md(R) {
  const head = `# Клиенты\n\nСобирается автоматически (tools/table.js) из anketa.json и crm.json — руками не править. Статус меняется в ПАПКА/crm.json.\n\n`;
  return head + `| ${COLS.map(c => c[1]).join(" | ")} |\n|${COLS.map(() => "---").join("|")}|\n` +
    R.map(r => `| ${COLS.map(c => String(r[c[0]] || "—").replace(/\|/g, "/")).join(" | ")} |`).join("\n") + "\n";
}

function csv(R) {
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return "﻿" + [COLS.map(c => q(c[1])).join(";"), ...R.map(r => COLS.map(c => q(r[c[0]])).join(";"))].join("\r\n") + "\r\n";
}

function page(R) {
  const MAIN = STATUSES.filter(s => s !== "отказ");
  const count = s => R.filter(r => r.status === s).length;
  const n = (...ss) => R.filter(r => ss.includes(r.status)).length;
  const money = R.filter(r => ["оплатил", "запущен"].includes(r.status)).reduce((a, r) => a + (parseFloat(String(r.price).replace(",", ".")) || 0), 0);
  const tel = p => p.replace(/\s*\(.*\)$/, "").replace(/[^\d+]/g, "");
  const hex = r => (r.color.match(/#[0-9a-f]{3,8}/i) || ["#8a8a8a"])[0];
  const stage = s => s === "отказ" ? -1 : MAIN.indexOf(s);

  const funnel = MAIN.map((s, i) => `<button type="button" class="fs${count(s) ? "" : " z"}" data-f="${esc(s)}"><i>${i + 1}</i><span>${esc(s)}</span><b>${count(s)}</b></button>`).join("")
    + (count("отказ") ? `<button type="button" class="fs x" data-f="отказ"><i>✕</i><span>отказ</span><b>${count("отказ")}</b></button>` : "");

  const todo = R.filter(r => !["запущен", "отказ"].includes(r.status))
    .map(r => `<li data-s="${esc(r.status)}" data-last="${esc(r.last)}" data-created="${esc(r.created)}"><span class="dot" style="background:${hex(r)}"></span><div><b>${esc(r.name)}</b> <span class="st st-${stage(r.status)}">${esc(r.status)}</span><p>${esc(r.next || "—")}</p></div><em class="age"></em></li>`).join("");

  const cards = R.map(r => {
    const k = stage(r.status);
    const bar = MAIN.map((s, i) => `<span class="${k >= i ? "on" : ""}" title="${esc(s)}"></span>`).join("");
    const phones = r.phones.split(", ").filter(Boolean).map(p => {
      const m = p.match(/^(.*?)\s*\((.*)\)$/);
      return `<a class="ph" href="tel:${tel(p)}"><span>${esc(m ? m[1] : p)}</span>${m ? `<small>${esc(m[2])}</small>` : ""}</a>`;
    }).join("");
    return `<article class="c" data-s="${esc(r.status)}" style="--a:${hex(r)}">
  <header><span class="dot"></span><div><h3>${esc(r.name)}</h3><p>${esc(r.address.replace(/^Минск,\s*/, "") || "адрес не указан")}${r.rating ? ` · ★ ${esc(r.rating)}` : ""}</p></div><span class="st st-${k}">${esc(r.status)}</span></header>
  <div class="bar${k < 0 ? " no" : ""}">${bar}</div>
  <div class="nx"><small>Следующий шаг</small>${esc(r.next || "—")}</div>
  ${phones ? `<div class="phs">${phones}</div>` : ""}
  <div class="ln">${r.demo ? `<a href="${esc(r.demo)}" target="_blank" rel="noopener">Открыть демо ↗</a>` : `<span class="off">демо нет</span>`}${r.yandex ? `<a href="${esc(r.yandex)}" target="_blank" rel="noopener">Яндекс Карты ↗</a>` : ""}</div>
  <dl><div><dt>Создан</dt><dd>${esc(r.created || "—")}</dd></div><div><dt>Последний контакт</dt><dd data-d="${esc(r.last)}">${esc(r.last || "ещё не было")}</dd></div>${r.price ? `<div><dt>Цена</dt><dd>${esc(r.price)} BYN</dd></div>` : ""}${r.domain ? `<div><dt>Домен</dt><dd>${esc(r.domain)}</dd></div>` : ""}</dl>
  ${r.note ? `<p class="nt">${esc(r.note)}</p>` : ""}
</article>`;
  }).join("\n");

  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Мои клиенты</title>
<style>
:root{--bg:#f4f3ef;--card:#fff;--line:#e6e3dc;--tx:#141412;--mut:#6d6a62;--soft:#f0eee9;--ac:#1E6BFF;--ok:#118a49;--wait:#b97800;--bad:#c62a1f}
@media(prefers-color-scheme:dark){:root{--bg:#0d0e10;--card:#17191d;--line:#262930;--tx:#eef0f3;--mut:#9399a4;--soft:#1f2227;--ac:#5b93ff;--ok:#3ccf7f;--wait:#f0b43a;--bad:#ff6b5e}}
*{box-sizing:border-box;margin:0;padding:0}body{background:var(--bg);color:var(--tx);font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:28px 16px 60px;-webkit-font-smoothing:antialiased}
.w{max-width:1200px;margin:0 auto}a{color:var(--ac);text-decoration:none}
.top{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:20px}
h1{font-size:30px;letter-spacing:-.03em;line-height:1.1}.top p{color:var(--mut);font-size:13px;margin-top:4px}
h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:var(--mut);font-weight:650;margin:28px 0 12px}
.kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.k{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 16px}.k b{display:block;font-size:30px;letter-spacing:-.03em;line-height:1.1;font-variant-numeric:tabular-nums}.k span{color:var(--mut);font-size:13px}
.k.g b{color:var(--ok)}
.fun{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}.fun::-webkit-scrollbar{display:none}
.fs{flex:1 0 108px;font:inherit;color:inherit;text-align:left;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px 12px;cursor:pointer;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:8px;align-items:center}
.fs i{font-style:normal;font-size:11px;color:var(--mut);grid-row:1}.fs span{font-size:13px;grid-column:1/3;grid-row:2;white-space:nowrap}.fs b{font-size:20px;grid-row:1;grid-column:2;text-align:right;font-variant-numeric:tabular-nums}
.fs.z{opacity:.45}.fs.on{background:var(--tx);color:var(--bg);border-color:var(--tx)}.fs.on i{color:inherit;opacity:.6}
.all{font:inherit;font-size:13px;color:var(--ac);background:none;border:0;cursor:pointer;margin-top:8px}
.todo{list-style:none;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden}
.todo li{display:flex;gap:12px;align-items:flex-start;padding:12px 16px;border-top:1px solid var(--line)}.todo li:first-child{border-top:0}
.todo li div{flex:1;min-width:0}.todo li p{color:var(--mut);font-size:14px;margin-top:2px}.todo .dot{margin-top:6px}
.todo li.hot{background:color-mix(in srgb,var(--bad) 7%,transparent)}.age{font-style:normal;font-size:12px;color:var(--mut);white-space:nowrap;margin-top:2px}.hot .age{color:var(--bad);font-weight:650}
.dot{width:10px;height:10px;border-radius:50%;flex:none;background:var(--a)}
.st{display:inline-block;border-radius:99px;padding:2px 9px;font-size:12px;font-weight:650;white-space:nowrap;background:var(--soft);color:var(--mut);vertical-align:1px}
.st-1{background:color-mix(in srgb,var(--ac) 14%,transparent);color:var(--ac)}.st-2,.st-3,.st-4,.st-5{background:color-mix(in srgb,var(--wait) 16%,transparent);color:var(--wait)}.st-6,.st-7{background:color-mix(in srgb,var(--ok) 16%,transparent);color:var(--ok)}.st--1{background:color-mix(in srgb,var(--bad) 13%,transparent);color:var(--bad)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:12px}
.c{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:12px;border-top:4px solid var(--a)}
.c header{display:flex;gap:10px;align-items:flex-start}.c header>div{flex:1;min-width:0}.c header .dot{margin-top:7px}
.c h3{font-size:18px;letter-spacing:-.01em}.c header p{color:var(--mut);font-size:13px}
.bar{display:grid;grid-template-columns:repeat(8,1fr);gap:3px}.bar span{height:5px;border-radius:3px;background:var(--soft)}.bar span.on{background:var(--a)}.bar.no span{background:color-mix(in srgb,var(--bad) 25%,transparent)}
.nx{background:var(--soft);border-radius:12px;padding:10px 12px;font-size:14px}.nx small{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin-bottom:2px}
.phs{display:flex;flex-wrap:wrap;gap:6px}.ph{display:inline-flex;gap:6px;align-items:baseline;border:1px solid var(--line);border-radius:10px;padding:6px 10px;color:var(--tx);font-variant-numeric:tabular-nums;white-space:nowrap}.ph small{font-size:11px;font-weight:650;color:var(--mut)}
.ln{display:flex;gap:16px;flex-wrap:wrap;font-size:14px;font-weight:600}.off{color:var(--mut);font-weight:400}
dl{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:13px}dt{color:var(--mut);font-size:11px}dd{font-variant-numeric:tabular-nums}
.nt{font-size:13px;color:var(--mut);border-top:1px dashed var(--line);padding-top:10px}
@media(max-width:760px){.kpi{grid-template-columns:repeat(2,1fr)}.grid{grid-template-columns:1fr}h1{font-size:26px}}
</style></head><body><div class="w">
<div class="top"><div><h1>Мои клиенты</h1><p>Сайты для автосервисов · обновлено ${new Date().toLocaleString("ru-RU", { timeZone: "Europe/Minsk", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p></div></div>
<div class="kpi">
<div class="k"><b>${R.length}</b><span>всего сервисов</span></div>
<div class="k"><b>${n("демо готово")}</b><span>демо ждут звонка</span></div>
<div class="k"><b>${n("позвонил", "скинул демо", "думает", "правки")}</b><span>в переговорах</span></div>
<div class="k g"><b>${n("оплатил", "запущен")}</b><span>оплатили${money ? ` · ${money} BYN` : ""}</span></div>
</div>
<h2>Что сделать</h2>
<ul class="todo">${todo || `<li><div><p>Всё сделано</p></div></li>`}</ul>
<h2>Этапы</h2>
<div class="fun">${funnel}</div><button type="button" class="all" hidden>Показать всех</button>
<h2 id="ct">Все клиенты</h2>
<div class="grid">
${cards}
</div></div>
<script>
const day=s=>s?Math.floor((Date.now()-new Date(s+"T00:00:00+03:00"))/864e5):null;
const ago=d=>d===0?"сегодня":d===1?"вчера":d+" дн. назад";
document.querySelectorAll("dd[data-d]").forEach(e=>{const d=day(e.dataset.d);if(d!==null)e.textContent+=" · "+ago(d)});
const todo=document.querySelector(".todo");
[...todo.querySelectorAll("li[data-s]")].map(li=>{
  const s=li.dataset.s,dl=day(li.dataset.last),dc=day(li.dataset.created),a=li.querySelector(".age");let w=0;
  if(["скинул демо","думает"].includes(s)&&dl!==null&&dl>2){li.classList.add("hot");a.textContent="напомнить · "+ago(dl);w=3}
  else if(s==="демо готово"){a.textContent=dl===null?"не звонил"+(dc!==null&&dc>0?" · "+dc+" дн.":""):ago(dl);w=2}
  else if(s==="кандидат"){a.textContent="запас";w=0}
  else{a.textContent=dl!==null?ago(dl):"";w=1}
  return [w,li]}).sort((x,y)=>y[0]-x[0]).forEach(([,li])=>todo.appendChild(li));
const fs=document.querySelectorAll(".fs"),all=document.querySelector(".all"),ct=document.getElementById("ct");
function f(v){fs.forEach(b=>b.classList.toggle("on",b.dataset.f===v));all.hidden=!v;ct.textContent=v?"Этап: "+v:"Все клиенты";
document.querySelectorAll(".c").forEach(c=>c.hidden=!!v&&c.dataset.s!==v)}
fs.forEach(b=>b.onclick=()=>{f(b.classList.contains("on")?"":b.dataset.f);if(!b.classList.contains("z"))ct.scrollIntoView({behavior:"smooth"})});all.onclick=()=>f("");
</script></body></html>
`;
}

function run() {
  const R = rows();
  fs.writeFileSync(path.join(ROOT, "clients.md"), md(R));
  fs.writeFileSync(path.join(ROOT, "clients.csv"), csv(R));
  fs.mkdirSync(path.join(ROOT, "tablica"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "tablica", "index.html"), page(R));
  console.log(`✓ таблица: ${R.length} сервисов → clients.md, clients.csv, ${DEMO}tablica/`);
}
if (require.main === module) run();
module.exports = { run, STATUSES };
