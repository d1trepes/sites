#!/usr/bin/env node
/* =====================================================================
   АВТОПРОВЕРКА САЙТА: node tools/check.js ПАПКА
   Открывает сайт как телефон (375px) и компьютер (1440px):
   - ищет элементы, которые вылезают за край экрана;
   - проверяет, что следующий блок не выглядывает на первом экране;
   - сохраняет снимки в _check/ПАПКА-телефон.png и -комп.png (посмотреть глазами).
   Первый раз: cd tools && npm install
   ===================================================================== */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const dir = process.argv[2];
if (!dir) { console.error("Укажи папку: node tools/check.js ИМЯ-ПАПКИ"); process.exit(1); }

(async () => {
  const { chromium } = require("playwright-core");
  let exe, args = [];
  try { const sp = (await import("@sparticuz/chromium")).default; exe = await sp.executablePath(); args = sp.args; } catch {}
  const out = path.join(ROOT, "_check"); fs.mkdirSync(out, { recursive: true });
  const url = "file://" + path.join(ROOT, dir, "index.html");
  let bad = 0;
  for (const [name, w, h, mob] of [["телефон", 375, 800, true], ["комп", 1440, 900, false]]) {
    const b = await chromium.launch({ executablePath: exe, args });
    const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob });
    await p.goto(url, { waitUntil: "load", timeout: 30000 }).catch(() => {});
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => {
      document.querySelectorAll(".rv").forEach(e => e.classList.add("in"));
      const W = document.documentElement.clientWidth, H = innerHeight;
      const over = [...document.querySelectorAll("main *")].filter(e => {
        if (e.closest(".quotes,.marq,.hero")) return false;          // листаются / бегут / обрезаются специально
        const x = e.getBoundingClientRect(); return x.width && (x.right > W + 1 || x.left < -1);
      }).slice(0, 5).map(e => (e.closest("section")?.id || "?") + ": " + e.tagName.toLowerCase() + "." + e.className);
      const second = document.querySelector("main > section:nth-of-type(2)");
      const peek = second ? Math.round(second.getBoundingClientRect().top + parseFloat(getComputedStyle(second).paddingTop)) : 9999;
      return { scroll: document.documentElement.scrollWidth > W, over, peek, H };
    });
    await p.waitForTimeout(900);
    await p.screenshot({ path: path.join(out, `${dir}-${name}.png`), fullPage: true });
    await b.close();
    const msgs = [];
    if (r.scroll) msgs.push("страница листается вбок");
    r.over.forEach(o => msgs.push("вылезает за край — " + o));
    if (!mob && r.peek < r.H) msgs.push(`второй блок выглядывает на первом экране (виден с ${r.peek}px из ${r.H})`);
    bad += msgs.length;
    console.log(msgs.length ? `✗ ${dir} (${name}):\n  - ` + msgs.join("\n  - ") : `✓ ${dir} (${name}): ок`);
  }
  console.log(`Снимки: _check/${dir}-телефон.png, _check/${dir}-комп.png — посмотри глазами перед отправкой.`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error("✗ " + e.message); process.exit(1); });
