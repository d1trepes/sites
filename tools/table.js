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
        phones: phones.join(", "),
        address: A.address || C.address || "",
        rating: y.rating ? `${y.rating}${y.reviews ? ` · ${y.reviews} отз.` : ""}` : (C.rating || ""),
        yandex: y.url || C.yandex || "",
        demo: A.blocks ? DEMO + d.name + "/" : "",
        color: A.accent ? `${A.theme || ""} ${A.accent}`.trim() : "",
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

const COLS = [["name", "Название"], ["status", "Статус"], ["next", "Следующий шаг"], ["phones", "Телефон"], ["address", "Адрес"],
  ["rating", "Рейтинг"], ["demo", "Демо"], ["yandex", "Яндекс Карты"], ["color", "Цвет"], ["created", "Создан"],
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
  const count = s => R.filter(r => r.status === s).length;
  const chips = STATUSES.filter(count).map(s => `<button type="button" data-f="${esc(s)}">${esc(s)} <b>${count(s)}</b></button>`).join("");
  const tr = R.map(r => `<tr data-s="${esc(r.status)}">
  <td><b>${esc(r.name)}</b><small>${esc(r.address.replace(/^Минск,\s*/, ""))}</small></td>
  <td><span class="st st-${STATUSES.indexOf(r.status)}">${esc(r.status)}</span>${r.next ? `<small>${esc(r.next)}</small>` : ""}</td>
  <td>${r.phones.split(", ").filter(Boolean).map(p => `<a href="tel:${p.replace(/[^\d+]/g, "")}">${esc(p)}</a>`).join("<br>")}</td>
  <td>${esc(r.rating)}</td>
  <td>${r.demo ? `<a href="${esc(r.demo)}" target="_blank" rel="noopener">демо</a>` : "—"}${r.yandex ? ` · <a href="${esc(r.yandex)}" target="_blank" rel="noopener">карты</a>` : ""}</td>
  <td>${esc(r.last || r.created)}${r.price ? `<small>${esc(r.price)}</small>` : ""}${r.domain ? `<small>${esc(r.domain)}</small>` : ""}</td>
  <td class="nt">${esc(r.note)}</td>
</tr>`).join("\n");
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Клиенты — сайты для автосервисов</title>
<style>
:root{--bg:#f6f5f2;--card:#fff;--line:#e4e1da;--tx:#151513;--mut:#6b6860;--ac:#1E6BFF}
@media(prefers-color-scheme:dark){:root{--bg:#0e0f11;--card:#16181c;--line:#272a30;--tx:#eef0f3;--mut:#9aa1ad}}
*{box-sizing:border-box;margin:0}body{background:var(--bg);color:var(--tx);font:15px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;padding:24px 16px 48px}
.w{max-width:1280px;margin:0 auto}h1{font-size:26px;letter-spacing:-.02em}p.s{color:var(--mut);margin:6px 0 18px}
.f{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}.f button{font:inherit;color:inherit;background:var(--card);border:1px solid var(--line);border-radius:99px;padding:7px 13px;cursor:pointer}
.f button.on{background:var(--tx);color:var(--bg);border-color:var(--tx)}.f b{opacity:.6;font-weight:600}
.tw{overflow-x:auto;background:var(--card);border:1px solid var(--line);border-radius:16px}
table{border-collapse:collapse;width:100%;min-width:900px}th,td{text-align:left;vertical-align:top;padding:12px 14px;border-bottom:1px solid var(--line)}
th{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--mut);font-weight:600;background:var(--card);position:sticky;top:0}
tr:last-child td{border-bottom:0}td small{display:block;color:var(--mut);font-size:13px;margin-top:3px}a{color:var(--ac);text-decoration:none}a[href^=tel]{white-space:nowrap}
.st{display:inline-block;border-radius:99px;padding:3px 10px;font-size:13px;font-weight:600;background:#8881;white-space:nowrap}
.st-0{background:#8883}.st-1{background:#1E6BFF22;color:#1E6BFF}.st-2,.st-3,.st-4,.st-5{background:#f5a40026;color:#b97800}.st-6,.st-7{background:#18a05826;color:#118a49}.st-8{background:#e1060018;color:#c00500}
.nt{color:var(--mut);max-width:280px}
@media(max-width:700px){table{min-width:0}thead{display:none}tr{display:block;padding:12px 14px;border-bottom:1px solid var(--line)}td{display:block;border:0;padding:3px 0}.nt{max-width:none}}
</style></head><body><div class="w">
<h1>Клиенты</h1><p class="s">${R.length} сервисов · обновлено ${new Date().toLocaleString("ru-RU", { timeZone: "Europe/Minsk" })} · таблица собирается сама</p>
<div class="f"><button type="button" data-f="" class="on">все <b>${R.length}</b></button>${chips}</div>
<div class="tw"><table><thead><tr><th>Сервис</th><th>Статус</th><th>Телефон</th><th>Рейтинг</th><th>Ссылки</th><th>Дата</th><th>Заметка</th></tr></thead><tbody>
${tr}
</tbody></table></div></div>
<script>
document.querySelectorAll(".f button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".f button").forEach(x=>x.classList.toggle("on",x===b));
document.querySelectorAll("tbody tr").forEach(r=>r.hidden=!!b.dataset.f&&r.dataset.s!==b.dataset.f)});
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
