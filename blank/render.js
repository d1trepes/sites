/* =====================================================================
   БЛАНК: сборка страницы из анкеты (ПАПКА/anketa.json).
   Каждый блок — функция в BLOCKS. Новый блок = новая функция здесь
   + стили в blank.css + строка в blank/БЛОКИ.md.
   Запускается сборщиком (tools/build.js), в браузере не нужен.
   ===================================================================== */
"use strict";

const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const plural = (n, a, b, c) => { const m = n % 100, k = n % 10; return (m > 10 && m < 20) ? c : k === 1 ? a : (k > 1 && k < 5) ? b : c; };
const digits = s => String(s || "").replace(/[^\d+]/g, "");

const STAR = '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 1.5l2.6 5.5 6 .7-4.5 4.1 1.2 5.9L10 14.8l-5.3 2.9 1.2-5.9L1.4 7.7l6-.7z"/></svg>';
const stars = n => `<span class="stars" aria-label="${n} из 5">${STAR.repeat(n)}</span>`;
const PIN = '<svg class="pin" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>';
const CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const PHONE = '<svg class="bi" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg>';

/* иконки (поле icon). Список — в blank/БЛОКИ.md */
const ICONS = {
  shield: '<path d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  clock: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M8.5 14.5h3"/>',
  time: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L4 16.8V20h3.2l5.3-5.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  car: '<path d="M3 13l2-5a2 2 0 0 1 2-1.4h10A2 2 0 0 1 19 8l2 5v5h-3v-2H6v2H3z"/><path d="M3 13h18"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  form: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h6"/><path d="m14 17 2 2 4-4"/>',
  truck: '<path d="M2 7h12v9H2zM14 10h4l4 3v3h-8z"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
  check: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  camera: '<path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  drop: '<path d="M12 3s5 5.5 5 9.5a5 5 0 0 1-10 0C7 8.5 12 3 12 3z"/>',
  gears: '<circle cx="5" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><path d="M5 8v8M12 8v8M19 8v4H5"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="M14.5 14.5 21 21"/><circle cx="10" cy="10" r="2"/>',
  crash: '<path d="M5 17H3v-5l2-5h10l4 5h2v5h-2"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="m12 7-1.5 3 3 1-1.5 3"/>',
  body: '<path d="M3 14V9l4-4h10l4 4v5"/><path d="M3 14h18v3H3z"/><path d="M9 5v9M15 5v9"/>',
  bumper: '<path d="M2 10c0-2 1.5-3 3-3h14c1.5 0 3 1 3 3v4H2z"/><path d="M6 14v3M18 14v3M8 10h8"/>',
  paint: '<path d="M14 3h5v5h-5zM14 5.5H9a2 2 0 0 0-2 2V10"/><path d="M5 10h4v4H5z"/><path d="M7 14v7"/><path d="M19 11c1 1.6 2 2.7 2 3.8a2 2 0 0 1-4 0c0-1.1 1-2.2 2-3.8z"/>',
  sills: '<path d="M2 16h20"/><path d="M4 16a4 4 0 0 1 8 0M14 16a4 4 0 0 1 8 0"/><path d="M2 19h20"/>',
  polish: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3"/>',
  anticor: '<path d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5z"/><path d="M12 8c1.3 1.8 2.5 3 2.5 4.3a2.5 2.5 0 0 1-5 0C9.5 11 10.7 9.8 12 8z"/>',
  weld: '<path d="m3 21 8-8M9 11l4 4"/><path d="M14 4v3M18 6l-2 2M20 10h-3M18 14l-2-2"/>',
  towbar: '<path d="M2 14h12v-3h4"/><circle cx="20" cy="11" r="2"/><path d="M8 14v4M5 18h6"/>',
  seat: '<path d="M7 3h10l1 9H6zM5 12h14v4H5zM8 16v5M16 16v5"/>',
  arrow: '<path d="M19 12H5M11 6l-6 6 6 6"/>'
};
const icon = (k, cls = "") => ICONS[k] ? `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>` : "";

/* общие данные для всех блоков */
function ctx(S) {
  const y = S.yandex || {};
  const phones = [{ phone: S.phone, label: S.phoneLabel }, ...(S.phones || [])];
  const route = y.url || `https://yandex.by/maps/?rtext=~${encodeURIComponent(S.address)}`;
  return {
    S, y, phones, route,
    tel: "tel:" + digits(S.phone),
    viber: S.viber ? "viber://chat?number=" + encodeURIComponent(digits(S.viber)) : "",
    tg: S.telegram ? "https://t.me/" + encodeURI(S.telegram.replace(/^@/, "")) : "",
    street: S.address.replace(/^(Минск|Minsk),\s*/, ""),
    marks: y.marks ? `${y.marks} ${plural(y.marks, "оценка", "оценки", "оценок")}` : "",
    revs: y.reviews ? `${y.reviews} ${plural(y.reviews, "отзыв", "отзыва", "отзывов")}` : "",
    city: S.city || "Минск"
  };
}
const rating = c => [c.revs, c.marks].filter(Boolean).join(" · ");

const logo = S => {
  const L = S.logo || {};
  if (L.img) return `<img src="${esc(L.img)}" alt="${esc(S.name)}" class="logo-img">`;
  const t = L.text || S.name, a = L.accent;
  return (a && t.startsWith(a) ? `<b>${esc(a)}</b>${esc(t.slice(a.length))}` : esc(t));
};
const d = i => i ? ` style="--d:${+i.toFixed(2)}s"` : "";
const sec = (b, id, inner, cls = "") =>
  `<section id="${esc(b.id || id)}"${cls ? ` class="${cls}"` : ""} style="padding-top:0"><div class="wrap">${inner}</div></section>`;
/* заголовок блока: *слово* — акцентом (цветом или подчёркиванием, по стилю сайта) */
const h2 = (b, def) => (b.title ?? def) ? `<h2 class="rv">${rich(b.title ?? def)}</h2>` : "";
/* подписи-пояснения под заголовками и блоками не выводим (решение 25.10) — поле sub игнорируется */
const kick = () => "";
/* *слово* в тексте — выделить жирным */
const rich = t => esc(t).replace(/\*([^*]+)\*/g, "<em>$1</em>");

/* ============================ БЛОКИ ============================ */
const BLOCKS = {

  /* Первый экран */
  hero(b, c) {
    const { S, y } = c;
    const tag = b.accentStyle === "mark" ? "mark" : "em";
    const title = b.accent ? esc(b.title).replace(esc(b.accent), `<${tag}>${esc(b.accent)}</${tag}>`) : esc(b.title);
    return `<section class="hero${b.dots === false ? " nodots" : ""}" id="top">
  <div class="wrap grid">
    <div class="htop">
      ${b.badge ? `<p class="hbadge rv">${b.badge.icon ? icon(b.badge.icon) : "<i></i>"}<span>${esc(b.badge.t || b.badge)}</span></p>` : ""}
      ${(b.lead || "").includes(c.street.split(",")[0]) ? "" : `<p class="haddr rv">${PIN}${esc(S.address)}</p>`}
      <h1 class="rv">${title}</h1>
    </div>
    <div class="hbody">
      ${b.lead ? `<p class="lead rv"${d(.1)}>${esc(b.lead)}</p>` : ""}
      <div class="acts rv"${d(.2)}>
        <a class="btn btn-ac" href="${c.tel}">${esc(b.button || "Позвонить")}</a>
        <a class="btn btn-gh" href="${esc(c.route)}" target="_blank" rel="noopener">Как проехать</a>
      </div>
      ${S.schedule?.length ? `<div class="now rv"${d(.25)} data-schedule='${esc(JSON.stringify(S.schedule))}' hidden><i></i><span></span></div>` : ""}
      ${y.rating ? `<div class="trust rv"${d(.3)}><b>${esc(y.rating)}</b><div>${stars(5)}<span style="display:block;margin-top:4px">${rating(c) ? rating(c) + " на Яндекс Картах" : "на Яндекс Картах"}</span></div></div>` : ""}
    </div>
    ${b.img ? `<div class="car${b.imgSize ? " " + esc(b.imgSize) : ""}${b.shape === "circle" ? " circ" : ""} rv"${d(.15)}><img src="${esc(b.img)}" alt="${esc(b.imgAlt || S.name)}" fetchpriority="high"></div>` : ""}
  </div>
</section>`;
  },

  /* Цены: группами (groups) или крупными карточками (items) */
  prices(b, c) {
    if (b.groups?.length) {
      const minP = g => Math.min(...g.items.map(i => parseFloat(String(i[1]).replace(/[^\d.,]/g, "").replace(",", ".")) || Infinity));
      return `<section id="${esc(b.id || "ceny")}" class="sec-prices"><div class="wrap">
  <div class="ph2">${h2(b, "Цены")}</div>
  <div class="pgrid">${b.groups.map((g, i) => `<details class="pg rv"${d((i % 2) * .06)} open>
    <summary><h3>${esc(g.g)}</h3><small>${g.items.length > 1 ? `от ${minP(g)} BYN` : `${g.items[0][1]} BYN`}</small><span class="chev" aria-hidden="true">${CHEV}</span></summary>
    <ul>${g.items.map(it => `<li><span>${esc(it[0])}${it[2] ? `<small>${esc(it[2])}</small>` : ""}</span><b>${esc(it[1])}<em>BYN</em></b></li>`).join("")}</ul>
  </details>`).join("")}</div>
  ${b.note ? `<div class="pnote rv"><p>${esc(b.note)}</p><a class="btn btn-ac btn-sm" href="${c.tel}">${esc(b.button || "Записаться")}</a></div>` : ""}
</div></section>`;
    }
    if (!b.items?.length) return "";
    return sec(b, "ceny", `
  ${h2(b, "Цены")}${kick(b)}
  <div class="prices">${b.items.map((p, i) => `<div class="pcard rv"${d(i * .08)}><div><h3>${esc(p.t)}</h3>${p.note ? `<p>${esc(p.note)}</p>` : ""}</div><b>${esc(p.price)}<small>BYN</small></b></div>`).join("")}</div>
  ${b.note ? `<div class="more rv"><span>${esc(b.note)}</span><a class="btn btn-ac" href="${c.tel}">${esc(b.button || "Узнать цену")}</a></div>` : ""}`);
  },

  /* Отзывы: карточка рейтинга + пересказы отзывов */
  reviews(b, c) {
    const { y } = c;
    if (!b.items?.length && !y.rating) return "";
    return sec(b, "otzyvy", `
  ${h2(b, "Что говорят клиенты")}
  <div class="rev${y.rating ? "" : " norate"}">
    ${y.rating ? `<div class="rate rv">
      <div class="src">${PIN}Яндекс Карты</div>
      <div class="big"><b>${esc(y.rating)}</b>${stars(5)}</div>
      <div class="sub">${rating(c)}</div>
      ${y.url ? `<a class="btn btn-gh btn-sm" href="${esc(y.url.replace(/\/$/, ""))}/reviews/" target="_blank" rel="noopener">Все отзывы на Яндекс Картах</a>` : ""}
    </div>` : ""}
    <div><div class="quotes">${(b.items || []).map((r, i) => `<article class="q rv"${d((i % 2) * .08)}>
      <header><div class="ava">${esc([...r.name][0].toUpperCase())}</div><div><b>${esc(r.name)}</b><small>${esc(r.date || "")}</small></div></header>
      ${stars(r.stars || 5)}<p>${rich(r.text)}</p>
    </article>`).join("")}</div></div>
  </div>`);
  },

  /* Услуги. style: "side" (картинка сбоку), "tiles" (картинка сверху), "list" (иконка + название) */
  services(b, c) {
    if (!b.items?.length) return "";
    const st = b.style || "side", cols = b.cols || 2;
    const btn = b.button ? `<a class="btn btn-ac btn-sm" href="${c.tel}">${esc(b.button)}</a>` : "";
    const hl = b.highlight?.items?.length ? (b.highlight.items.some(h => h.text)
      ? `<div class="hlc">${b.highlight.items.map((h, i) => `<div class="rv"${d(i * .08)}>${icon(h.icon)}<div><h3>${esc(h.t)}</h3>${h.text ? `<p>${esc(h.text)}</p>` : ""}</div></div>`).join("")}</div>`
      : `<div class="hlr rv">${b.highlight.label ? `<b>${esc(b.highlight.label)}</b>` : ""}${b.highlight.items.map(h => `<span>${icon(h.icon)}${esc(h.t)}</span>`).join("")}</div>`) : "";
    let grid;
    if (st === "list") {
      const used = b.items.reduce((n, g) => n + (g.wide ? 2 : 1), 0) % 3;   // занято ячеек в последнем ряду
      const fill = b.banner && !b.banner.price && used === 1;                 // 2 пустые ячейки — плашка встаёт туда
      grid = `<div class="svl">${b.items.map((g, i) => `<div class="sl${g.wide ? " w2" : ""} rv"${d((i % 3) * .04)}>${icon(g.icon)}<h3>${esc(g.title)}</h3></div>`).join("")}${fill ? "@@BANNER@@" : ""}</div>`;
    } else {
      const span = g => g.full ? 6 : g.wide ? 3 : 6 / cols;
      grid = `<div class="svc ${st}">${b.items.map((g, i) => `<article class="sv rv" style="--span:${span(g)}${i % cols ? `;--d:${(i % cols) * .08}s` : ""}">
    ${g.img ? `<div class="pic"><img src="${esc(g.img)}" alt="${esc(g.imgAlt || g.title + " — " + c.S.name + ", " + c.city)}" loading="lazy" decoding="async"></div>` : ""}
    <h3>${esc(g.title)}</h3>
    <div class="chips">${(g.chips || []).map(t => `<span>${esc(t)}</span>`).join("")}</div>
    ${btn}
  </article>`).join("")}</div>`;
    }
    const bn = b.banner;
    const banner = !bn ? "" : bn.price
      ? `<div class="nch rv"><b>${esc(bn.title)} <i>${esc(bn.price)}<span>BYN</span></i></b>${bn.text ? `<p>${esc(bn.text)}</p>` : ""}<a class="btn btn-ac" href="${c.tel}">${esc(bn.button || "Узнать стоимость")}</a></div>`
      : `<div class="bnr rv"><div><b>${esc(bn.title)}</b>${bn.text ? `<p>${esc(bn.text)}</p>` : ""}</div><a class="btn btn-ac" href="${c.tel}">${esc(bn.button || "Узнать стоимость")}</a></div>`;
    return sec(b, "uslugi", `
  ${h2(b, "Услуги")}${kick(b)}
  ${hl}${grid.includes("@@BANNER@@") ? grid.replace("@@BANNER@@", banner.replace('class="bnr rv"', 'class="bnr in-grid rv"')) : grid + banner}`);
  },

  /* Почему мы: карточка «с какими авто» (brands) + карточки с иконками */
  why(b, c) {
    if (!b.items?.length && !b.brands) return "";
    const br = b.brands;
    return sec(b, "pochemu", `
  ${h2(b, "Почему мы")}
  <div class="why${br ? "" : " eq"}">
    ${br ? `<div class="brands rv"><div><span class="ic">${icon("car")}</span><h3>${esc(br.label || "С какими авто")}</h3><p>${esc(br.text)}</p></div>${br.img ? `<img src="${esc(br.img)}" alt="${esc(br.imgAlt || br.text)}" loading="lazy" decoding="async">` : ""}</div>` : ""}
    ${(b.items || []).map((w, i) => `<div class="rv"${d((i + 1) * .08)}><span class="ic">${icon(w.icon)}</span><h3>${esc(w.t)}</h3><p>${esc(w.text)}</p></div>`).join("")}
  </div>`);
  },

  /* Свободный блок: заголовок (можно без) + 1–4 карточки с иконками */
  cards(b, c) {
    if ((b.items?.length || 0) < 2) return "";   // одна карточка смотрится одиноко — блок не показываем
    return sec(b, "blok", `
  ${h2(b)}${kick(b)}
  <div class="cards c${Math.min(b.items.length, 4)}">${b.items.map((w, i) => `<div class="rv"${d(i * .06)}>${w.icon ? `<span class="ic">${icon(w.icon)}</span>` : ""}<h3>${esc(w.t)}</h3>${w.text ? `<p>${esc(w.text)}</p>` : ""}</div>`).join("")}</div>`, b.title ? "" : "notitle");
  },

  /* Бегущая строка: марки, виды техники */
  marquee(b, c) {
    if (!b.items?.length) return "";
    const row = [...b.items, ...b.items, ...b.items, ...b.items].map(t => `<span>${esc(t)}</span>`).join("");
    return `<section id="${esc(b.id || "marki")}" class="sec-marq" style="padding-top:0"><div class="marq rv" aria-label="${esc(b.items.join(", "))}"><div>${row}</div></div></section>`;
  },

  /* Акции: крупная цифра + заголовок + условие */
  promo(b, c) {
    if (!b.items?.length) return "";
    return sec(b, "akcii", `
  ${h2(b, "Акции")}
  <div class="promo">${b.items.map((p, i) => `<div class="rv"${d(i * .08)}><span class="big">${esc(p.big)}</span><h3>${esc(p.t)}</h3>${p.text ? `<p>${esc(p.text)}</p>` : ""}</div>`).join("")}</div>`);
  },

  /* Фото сервиса с подписями */
  photos(b, c) {
    if (!b.items?.length) return "";
    return sec(b, "foto", `
  ${h2(b, "Наш сервис")}
  <div class="photos">${b.items.map((p, i) => `<figure class="rv"${d(i * .08)}><img src="${esc(p.img)}" alt="${esc(p.alt || p.caption || c.S.name)}" loading="lazy" decoding="async">${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ""}</figure>`).join("")}</div>`);
  },

  /* До и после: ползунок. Пары фото: before + after */
  beforeafter(b, c) {
    if (!b.items?.length) return "";
    return sec(b, "do-posle", `
  ${h2(b, "До и после ремонта")}
  <div class="ba-grid">${b.items.map((p, i) => `<figure class="rv"${d(i * .08)}>
    <div class="ba"><img src="${esc(p.before)}" alt="До ремонта" loading="lazy" decoding="async"><img class="after" src="${esc(p.after)}" alt="После ремонта в ${esc(c.S.name)}" loading="lazy" decoding="async"><span class="line"></span><span class="tag l">До</span><span class="tag r">После</span><input type="range" min="0" max="100" value="50" aria-label="Сравнить до и после"></div>
    ${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ""}
  </figure>`).join("")}</div>`);
  },

  /* Как записаться: шаги. style: "line" (обычный) или "panel" (цветная панель) */
  steps(b, c) {
    if (!b.items?.length) return "";
    const S = c.S;
    const list = `<div class="steps">${b.items.map((s, i) => `<div class="step rv"${d(i * .1)}><i></i><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p></div>`).join("")}</div>`;
    const msg = `${c.viber ? `<a class="btn btn-gh" href="${c.viber}">Viber</a>` : ""}${c.tg ? `<a class="btn btn-gh" href="${c.tg}">Telegram</a>` : ""}`;
    if (b.style === "panel") return sec(b, "zapis", `
  <div class="zap rv">
    <div><h2>${rich(b.title || "Как записаться")}</h2>${list}
      <div class="steps-cta"><a class="btn btn-wh" href="${c.tel}">${esc(b.button || "Записаться")}</a></div></div>
    ${b.img ? `<div class="tools"><img src="${esc(b.img)}" alt="Инструменты автосервиса ${esc(S.name)}" loading="lazy" decoding="async"></div>` : ""}
  </div>`);
    return sec(b, "zapis", `
  ${h2(b, "Как записаться")}${list}
  <div class="steps-cta rv"><a class="btn btn-ac" href="${c.tel}">${esc(b.button || "Записаться")}</a>${msg}</div>`);
  },

  /* Контакты и карта */
  contacts(b, c) {
    const { S, y } = c;
    const mapSrc = y.id ? `https://yandex.by/map-widget/v1/org/${esc(y.slug || "org")}/${esc(y.id)}/?z=16`
      : `https://yandex.by/map-widget/v1/?text=${encodeURIComponent(S.address)}&amp;z=16`;
    const ph = c.phones;
    return sec(b, "kontakty", `
  ${h2(b, "Как нас найти")}
  <div class="cnt">
    <dl class="info rv">
      <div><dt>Адрес</dt><dd>${esc(S.address)}</dd></div>
      ${b.entry ? `<div class="entry">${icon("arrow")}${esc(b.entry)}</div>` : ""}
      <div><dt>${ph.length > 1 ? "Телефоны" : "Телефон"}</dt>${ph.map((p, i) => `<dd${i ? ' style="margin-top:6px"' : ""}><a href="tel:${digits(p.phone)}">${esc(p.phone)}</a>${p.label ? ` <small>${esc(p.label)}</small>` : ""}</dd>`).join("")}</div>
      ${S.hours?.length ? `<div><dt>Часы работы</dt><dd class="hrs">${S.hours.map(h => `<span>${esc(h[0])}</span><span>${esc(h[1])}</span>`).join("")}</dd></div>` : ""}
      ${S.payment ? `<div><dt>Оплата</dt><dd>${esc(S.payment)}</dd></div>` : ""}
      ${c.viber || c.tg ? `<div><dt>Написать</dt><dd>${[c.viber && `<a href="${c.viber}">Viber</a>`, c.tg && `<a href="${c.tg}">Telegram</a>`].filter(Boolean).join(" · ")}</dd></div>` : ""}
      <div class="acts"><a class="btn btn-ac btn-sm" href="${c.tel}">Позвонить</a><a class="btn btn-gh btn-sm" href="${esc(c.route)}" target="_blank" rel="noopener">Построить маршрут</a></div>
    </dl>
    <div class="map rv"${d(.1)} data-src="${mapSrc}"><div class="ph">${PIN}Загружаем карту…</div><button class="cover" type="button" aria-label="Включить карту"><span>Нажмите, чтобы двигать карту</span></button></div>
  </div>`);
  },

  /* Кнопки звонка везде одинаковые: «Позвонить», без номера и иконки. Номер — текстом в контактах и в cta. */
  /* КНОПКИ: везде без номера и иконки. Основная — глагол под смысл блока (поле button, по умолчанию свой текст у блока),
     вторая — только «Как проехать» / «Построить маршрут». Номер телефона — текстом (контакты, крупно в cta). */
  /* Финальный цветной призыв */
  cta(b, c) {
    const { S } = c;
    const second = `<a class="btn" href="${esc(c.route)}" target="_blank" rel="noopener">Построить маршрут</a>`;
    return `<section id="${esc(b.id || "zapisatsya")}" style="padding-top:0"><div class="wrap"><div class="cta rv">
  <div>
    <h2>${rich(b.title || "Записаться на ремонт")}</h2>
    <a class="tel" href="${c.tel}">${esc(S.phone)}</a>
    <div class="row"><a class="btn inv" href="${c.tel}">${esc(b.button || "Позвонить")}</a>${second}</div>
  </div>
  ${b.img ? `<div class="tools"><img src="${esc(b.img)}" alt="Инструменты автосервиса ${esc(S.name)}" loading="lazy"></div>` : ""}
</div></div></section>`;
  }
};

/* пункты меню по умолчанию; у блока можно задать menu: "…" или menu: "" (не показывать) */
const MENU = { prices: "Цены", reviews: "Отзывы", services: "Услуги", why: "Почему мы", promo: "Акции", photos: "Фото", contacts: "Контакты" };
const IDS = { prices: "ceny", reviews: "otzyvy", services: "uslugi", why: "pochemu", steps: "zapis", contacts: "kontakty", cards: "blok", promo: "akcii", photos: "foto", marquee: "marki", beforeafter: "do-posle", cta: "zapisatsya" };

/* выключенное ("off": true) — убрать везде: блоки, карточки, пункты */
const strip = v => Array.isArray(v) ? v.filter(x => !(x && x.off)).map(strip)
  : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, strip(x)])) : v;

function render(S) {
  S = strip(S);
  const c = ctx(S), { y } = c, L = S.legal || {};
  const blocks = S.blocks.filter(b => !b.off);
  const unknown = blocks.filter(b => !BLOCKS[b.type]).map(b => b.type);
  if (unknown.length) throw new Error("Нет таких блоков в бланке: " + unknown.join(", "));

  const nav = blocks.map(b => {
    const label = b.menu ?? MENU[b.type];
    return label ? [`#${b.id || IDS[b.type]}`, label] : null;
  }).filter(Boolean);

  const hours = (S.hours || []).filter(x => !/выходн/.test(x[1]));
  const hdr = `<header class="hdr"><div class="wrap">
  <a class="logo${S.logo?.color === "accent" ? " ac" : ""}" href="#top" aria-label="${esc(S.name)} — на главную">${logo(S)}</a>
  <nav class="nav">${nav.map(n => `<a href="${n[0]}">${esc(n[1])}</a>`).join("")}</nav>
  ${hours.length ? `<span class="hh">${hours.map(x => esc(x.join(" "))).join("<br>")}</span>` : ""}
  <a class="btn btn-ac btn-sm" href="${c.tel}">Позвонить</a>
  <button class="burger" type="button" aria-label="Меню"><i></i></button>
</div></header>`;

  const main = blocks.map(b => BLOCKS[b.type](b, c)).join("\n");

  const req = [L.company, L.unp && "УНП " + L.unp, L.regInfo].filter(Boolean).map(esc).join(" · ");
  const ftr = `<footer class="ftr"><div class="wrap">
  <div class="top">
    <div class="brand"><span class="logo${S.logo?.color === "accent" ? " ac" : ""}">${logo(S)}</span><p>${esc(S.footerText || blocks.find(b => b.type === "hero")?.lead || "")}</p>
      ${y.rating ? `${stars(5)}<small>${esc(y.rating)}${c.revs || c.marks ? " · " + (c.revs || c.marks) : ""} на Яндекс Картах</small>` : ""}</div>
    <div><h4>Контакты</h4><ul>
      ${c.phones.map(p => `<li><a href="tel:${digits(p.phone)}">${esc(p.phone)}</a></li>`).join("")}<li>${esc(c.street)}</li>
      ${(S.hours || []).map(h => `<li>${esc(h.join(" "))}</li>`).join("")}
    </ul></div>
    <div><h4>Разделы</h4><ul>${nav.map(n => `<li><a href="${n[0]}">${esc(n[1])}</a></li>`).join("")}</ul></div>
    <div><h4>Документы</h4><ul>
      <li><button type="button" data-open="privacy">Политика конфиденциальности</button></li>
      ${y.url ? `<li><a href="${esc(y.url)}" target="_blank" rel="noopener">Мы на Яндекс Картах</a></li>` : ""}
    </ul></div>
  </div>
  <div class="bot"><span>© ${new Date().getFullYear()} ${esc(S.name)}${req ? " · " + req : ""}</span>${y.rating ? "<span>Рейтинг и отзывы — Яндекс Карты</span>" : ""}</div>
</div></footer>
${S.demo ? `<div class="demo">Демо-версия сайта. Подготовлена бесплатно, удалим по первой просьбе.</div>` : ""}`;

  const owner = esc(L.company || S.name) + (L.unp ? ", УНП " + esc(L.unp) : "");
  const privacy = `<dialog id="privacy" aria-label="Политика конфиденциальности">
  <div class="d-top"><b>Политика конфиденциальности</b><button class="x" type="button" data-close aria-label="Закрыть">×</button></div>
  <div class="in-d">
  <p>Документ составлен в соответствии с Законом Республики Беларусь от 7 мая 2021 г. № 99-З «О защите персональных данных».</p>
  <h3>Кто отвечает за сайт</h3><p>${owner}. Адрес: ${esc(S.address)}. ${c.phones.length > 1 ? "Телефоны" : "Телефон"}: ${c.phones.map(p => esc(p.phone)).join(", ")}${L.email ? ". E-mail: " + esc(L.email) : ""}.</p>
  <h3>Какие данные мы собираем</h3><p>На сайте нет форм и регистрации: мы не просим ввести имя, телефон или другие персональные данные. Связаться с нами можно по телефону${c.viber || c.tg ? " или в мессенджере" : ""} — в этом случае данные обрабатываются только для ответа на ваше обращение и записи на ремонт.</p>
  <h3>Сторонние сервисы</h3><p>На сайте работают сервисы других компаний, которые могут сохранять файлы cookie и получать технические данные (IP-адрес, тип браузера):</p>
  <ul><li>Яндекс Карты — карта с нашим адресом (ООО «Яндекс»);</li><li>Google Fonts — шрифты сайта (Google LLC).</li></ul>
  <p>Их обработку регулируют политики этих компаний. Отключить cookie можно в настройках браузера — сайт продолжит работать.</p>
  <h3>Ваши права</h3><p>Вы вправе получить информацию об обработке ваших данных, потребовать их изменения или удаления, отозвать согласие. Для этого обратитесь по контактам выше.</p>
</div></dialog>`;

  return hdr + `\n<main>\n${main}\n</main>\n` + ftr + "\n" + privacy;
}

module.exports = { render, strip, BLOCKS, ICONS };
