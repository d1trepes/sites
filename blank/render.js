/* =====================================================================
   БЛАНК: сборка страницы из анкеты (ПАПКА/anketa.json).
   Каждый блок — функция в BLOCKS. Новый блок = новая функция здесь
   + стили в blank.css + описание в blank/БЛОКИ.md.
   Запускается только сборщиком (tools/build.js), в браузере не нужен.
   ===================================================================== */
"use strict";

const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const plural = (n, a, b, c) => { const m = n % 100, k = n % 10; return (m > 10 && m < 20) ? c : k === 1 ? a : (k > 1 && k < 5) ? b : c; };

const STAR = '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 1.5l2.6 5.5 6 .7-4.5 4.1 1.2 5.9L10 14.8l-5.3 2.9 1.2-5.9L1.4 7.7l6-.7z"/></svg>';
const stars = n => `<span class="stars" aria-label="${n} из 5">${STAR.repeat(n)}</span>`;
const PIN = '<svg class="pin" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>';
const CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

/* иконки для карточек (поле icon) */
const ICONS = {
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  clock: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M8.5 14.5h3"/>',
  time: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L4 16.8V20h3.2l5.3-5.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  car: '<path d="M5 16V11l2-5h10l2 5v5"/><path d="M3 16h18v3H3zM7 19v2M17 19v2"/><circle cx="7.5" cy="13.5" r="1"/><circle cx="16.5" cy="13.5" r="1"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/>',
  doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
  truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  check: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8" r="1.3"/>',
  bolt: '<path d="M13 2L5 13h6l-1 9 8-11h-6z"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'
};
const icon = k => ICONS[k] ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>` : "";

/* общие данные, которые нужны всем блокам */
function ctx(S) {
  const y = S.yandex || {};
  const digits = s => String(s || "").replace(/[^\d+]/g, "");
  return {
    S, y,
    tel: "tel:" + digits(S.phone),
    viber: S.viber ? "viber://chat?number=" + encodeURIComponent(digits(S.viber)) : "",
    tg: S.telegram ? "https://t.me/" + encodeURIComponent(S.telegram) : "",
    street: S.address.replace(/^Минск,\s*/, ""),
    marks: y.marks ? `${y.marks} ${plural(y.marks, "оценка", "оценки", "оценок")}` : "",
    revs: y.reviews ? `${y.reviews} ${plural(y.reviews, "отзыв", "отзыва", "отзывов")}` : "",
    city: S.city || "Минск"
  };
}

const logo = S => {
  const L = S.logo || {};
  if (L.img) return `<img src="${esc(L.img)}" alt="${esc(S.name)}" class="logo-img">`;
  const t = L.text || S.name, a = L.accent;
  return a && t.startsWith(a) ? `<b>${esc(a)}</b>${esc(t.slice(a.length))}` : esc(t);
};
const d = i => i ? ` style="--d:${i}s"` : "";
const sec = (b, id, inner, pad0 = true) =>
  `<section id="${esc(b.id || id)}"${pad0 ? ' style="padding-top:0"' : ""}><div class="wrap">${inner}</div></section>`;
const h2 = (b, def) => (b.title ?? def) ? `<h2 class="rv">${esc(b.title ?? def)}</h2>` : "";

/* ============================ БЛОКИ ============================ */
const BLOCKS = {

  /* Первый экран */
  hero(b, c) {
    const { S, y } = c;
    const title = b.accent ? esc(b.title).replace(esc(b.accent), `<em>${esc(b.accent)}</em>`) : esc(b.title);
    return `<section class="hero" id="top">
  <div class="wrap grid">
    <div>
      <h1 class="rv">${title}</h1>
      ${b.lead ? `<p class="lead rv"${d(.1)}>${esc(b.lead)}</p>` : ""}
      <div class="acts rv"${d(.2)}>
        <a class="btn btn-ac" href="${c.tel}">Позвонить ${esc(S.phone)}</a>
        ${y.url ? `<a class="btn btn-gh" href="${esc(y.url)}" target="_blank" rel="noopener">Как проехать</a>` : ""}
      </div>
      ${S.schedule?.length ? `<div class="now rv"${d(.25)} data-schedule='${esc(JSON.stringify(S.schedule))}' hidden><i></i><span></span></div>` : ""}
      ${y.rating ? `<div class="trust rv"${d(.3)}><b>${esc(y.rating)}</b><div>${stars(5)}<span style="display:block;margin-top:4px">${[c.marks, c.revs].filter(Boolean).join(" · ")} на Яндекс Картах</span></div></div>` : ""}
    </div>
    ${b.img ? `<div class="car rv"${d(.15)}><img src="${esc(b.img)}" alt="${esc(b.imgAlt || S.name)}" width="432" height="374" fetchpriority="high"></div>` : ""}
  </div>
</section>`;
  },

  /* Цены группами (на телефоне группы раскрываются) */
  prices(b, c) {
    if (!b.groups?.length) return "";
    const minP = g => Math.min(...g.items.map(i => i[1]));
    return `<section id="${esc(b.id || "ceny")}" class="sec-prices"><div class="wrap">
  <div class="ph2"><div>${h2(b, "Цены")}${b.sub !== "" ? `<p class="rv"${d(.08)}>${esc(b.sub ?? "Цены в белорусских рублях.")}</p>` : ""}</div></div>
  <div class="pgrid">${b.groups.map((g, i) => `<details class="pg rv"${d((i % 2) * .06)} open>
    <summary><h3>${esc(g.g)}</h3><small>${g.items.length > 1 ? `от ${minP(g)} BYN` : `${g.items[0][1]} BYN`}</small><span class="chev" aria-hidden="true">${CHEV}</span></summary>
    <ul>${g.items.map(it => `<li><span>${esc(it[0])}${it[2] ? `<small>${esc(it[2])}</small>` : ""}</span><b>${esc(it[1])}<em>BYN</em></b></li>`).join("")}</ul>
  </details>`).join("")}</div>
  ${b.note ? `<div class="pnote rv"><p>${esc(b.note)}</p><a class="btn btn-ac btn-sm" href="${c.tel}">Позвонить и записаться</a></div>` : ""}
</div></section>`;
  },

  /* Отзывы: карточка рейтинга + пересказы отзывов */
  reviews(b, c) {
    const { y } = c;
    if (!b.items?.length && !y.rating) return "";
    return sec(b, "otzyvy", `
  ${h2(b, "Что говорят клиенты")}
  <div class="rev">
    ${y.rating ? `<div class="rate rv">
      <div class="src">${PIN}Яндекс Карты</div>
      <div class="big"><b>${esc(y.rating)}</b>${stars(5)}</div>
      <div class="sub">${[c.marks, c.revs].filter(Boolean).join(" · ")}</div>
      ${y.url ? `<a class="btn btn-gh btn-sm" href="${esc(y.url)}reviews/" target="_blank" rel="noopener">Все отзывы на Яндекс Картах</a>` : ""}
    </div>` : ""}
    <div class="quotes">${(b.items || []).map((r, i) => `<article class="q rv"${d((i % 2) * .08)}>
      <header><div class="ava">${esc([...r.name][0].toUpperCase())}</div><div><b>${esc(r.name)}</b><small>${esc(r.date || "")}</small></div></header>
      ${stars(r.stars || 5)}<p>${esc(r.text)}</p>
    </article>`).join("")}</div>
  </div>`);
  },

  /* Услуги карточками: заголовок, картинка, метки */
  services(b, c) {
    if (!b.items?.length) return "";
    return sec(b, "uslugi", `
  ${h2(b, "Услуги")}
  <div class="svc">${b.items.map((g, i) => `<article class="sv rv"${d((i % 2) * .08)}>
    ${g.img ? `<div class="pic"><img src="${esc(g.img)}" alt="${esc(g.title)} — ${esc(c.S.name)}, ${esc(c.city)}" loading="lazy" decoding="async"></div>` : ""}
    <h3>${esc(g.title)}</h3>
    <div class="chips">${g.chips.map(t => `<span>${esc(t)}</span>`).join("")}</div>
  </article>`).join("")}</div>`);
  },

  /* Почему мы: широкая карточка «с какими авто» + карточки с иконками */
  why(b, c) {
    if (!b.items?.length && !b.brands) return "";
    const br = b.brands;
    return sec(b, "pochemu", `
  ${h2(b, "Почему мы")}
  <div class="why">
    ${br ? `<div class="brands rv"><div><small>${esc(br.label || "С какими авто работаем")}</small><h3>${esc(br.text)}</h3></div>${br.img ? `<img src="${esc(br.img)}" alt="${esc(br.imgAlt || br.text)}" loading="lazy" decoding="async">` : ""}</div>` : ""}
    ${(b.items || []).map((w, i) => `<div class="rv"${d((i + 1) * .08)}><span class="ic">${icon(w.icon)}</span><h3>${esc(w.t)}</h3><p>${esc(w.text)}</p></div>`).join("")}
  </div>`);
  },

  /* Свободный блок: заголовок + 2–4 карточки с иконками (эвакуатор, страховые, оплата…) */
  cards(b, c) {
    if (!b.items?.length) return "";
    return sec(b, "blok", `
  ${h2(b)}${b.sub ? `<p class="sub2 rv">${esc(b.sub)}</p>` : ""}
  <div class="cards c${Math.min(b.items.length, 4)}">${b.items.map((w, i) => `<div class="rv"${d(i * .08)}>${w.icon ? `<span class="ic">${icon(w.icon)}</span>` : ""}<h3>${esc(w.t)}</h3>${w.text ? `<p>${esc(w.text)}</p>` : ""}</div>`).join("")}</div>`);
  },

  /* Как записаться: три шага */
  steps(b, c) {
    if (!b.items?.length) return "";
    return sec(b, "zapis", `
  ${h2(b, "Как записаться")}
  <div class="steps">${b.items.map((s, i) => `<div class="step rv"${d(i * .1)}><i></i><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p></div>`).join("")}</div>
  <div class="steps-cta rv"><a class="btn btn-ac" href="${c.tel}">Позвонить ${esc(c.S.phone)}</a>${c.viber ? `<a class="btn btn-gh" href="${c.viber}">Viber</a>` : ""}${c.tg ? `<a class="btn btn-gh" href="${c.tg}">Telegram</a>` : ""}</div>`);
  },

  /* Контакты и карта */
  contacts(b, c) {
    const { S, y } = c;
    const mapSrc = y.id ? `https://yandex.by/map-widget/v1/org/${esc(y.slug || "org")}/${esc(y.id)}/?z=16`
      : `https://yandex.by/map-widget/v1/?text=${encodeURIComponent(S.address)}&z=16`;
    return sec(b, "kontakty", `
  ${h2(b, "Как нас найти")}
  <div class="cnt">
    <dl class="info rv">
      <div><dt>Адрес</dt><dd>${esc(S.address)}${b.addressNote ? `<small class="anote">${esc(b.addressNote)}</small>` : ""}</dd></div>
      <div><dt>Телефон</dt><dd><a href="${c.tel}">${esc(S.phone)}</a></dd></div>
      ${S.hours?.length ? `<div><dt>Часы работы</dt><dd class="hrs">${S.hours.map(h => `<span>${esc(h[0])}</span><span>${esc(h[1])}</span>`).join("")}</dd></div>` : ""}
      ${c.viber || c.tg ? `<div><dt>Написать</dt><dd>${[c.viber && `<a href="${c.viber}">Viber</a>`, c.tg && `<a href="${c.tg}">Telegram</a>`].filter(Boolean).join(" · ")}</dd></div>` : ""}
      ${y.url ? `<a class="btn btn-ac btn-sm" href="${esc(y.url)}" target="_blank" rel="noopener">Построить маршрут</a>` : ""}
    </dl>
    <div class="map rv"${d(.1)} data-src="${mapSrc}"><div class="ph">${PIN}Загружаем карту…</div><button class="cover" type="button" aria-label="Включить карту"><span>Нажмите, чтобы двигать карту</span></button></div>
  </div>`);
  },

  /* Финальный призыв цветом акцента */
  cta(b, c) {
    const { S, y } = c;
    return `<section style="padding-top:0"><div class="wrap"><div class="cta rv">
  <div>
    <h2>${esc(b.title || "Записаться на ремонт")}</h2>
    <a class="tel" href="${c.tel}">${esc(S.phone)}</a>
    <div class="row"><a class="btn inv" href="${c.tel}">Позвонить</a>${y.url ? `<a class="btn" href="${esc(y.url)}" target="_blank" rel="noopener">Открыть на карте</a>` : ""}</div>
  </div>
  ${b.img ? `<div class="tools"><img src="${esc(b.img)}" alt="Инструменты автосервиса ${esc(S.name)}" loading="lazy"></div>` : ""}
</div></div></section>`;
  }
};

/* пункты меню: у блока есть menu: "Цены" */
const MENU = { prices: "Цены", reviews: "Отзывы", services: "Услуги", why: "Почему мы", contacts: "Контакты" };
const IDS = { prices: "ceny", reviews: "otzyvy", services: "uslugi", why: "pochemu", steps: "zapis", contacts: "kontakty", cards: "blok" };

function render(S) {
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
  <a class="logo" href="#top" aria-label="${esc(S.name)}">${logo(S)}</a>
  <nav class="nav">${nav.map(n => `<a href="${n[0]}">${esc(n[1])}</a>`).join("")}</nav>
  ${hours.length ? `<span class="hh">${hours.map(x => esc(x.join(" "))).join("<br>")}</span>` : ""}
  <a class="btn btn-ac btn-sm" href="${c.tel}">Позвонить</a>
  <button class="burger" type="button" aria-label="Меню"><i></i></button>
</div></header>`;

  const main = blocks.map(b => BLOCKS[b.type](b, c)).join("\n");

  const req = [L.company, L.unp && "УНП " + L.unp, L.regInfo].filter(Boolean).map(esc).join(" · ");
  const ftr = `<footer class="ftr"><div class="wrap">
  <div class="top">
    <div class="brand"><span class="logo">${logo(S)}</span><p>${esc(S.footerText || blocks.find(b => b.type === "hero")?.lead || "")}</p>
      ${y.rating ? `${stars(5)}<small>${esc(y.rating)}${c.marks ? " · " + c.marks : ""} на Яндекс Картах</small>` : ""}</div>
    <div><h4>Контакты</h4><ul>
      <li><a href="${c.tel}">${esc(S.phone)}</a></li><li>${esc(c.street)}</li>
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
  <h3>Кто отвечает за сайт</h3><p>${owner}. Адрес: ${esc(S.address)}. Телефон: ${esc(S.phone)}${L.email ? ". E-mail: " + esc(L.email) : ""}.</p>
  <h3>Какие данные мы собираем</h3><p>На сайте нет форм и регистрации: мы не просим ввести имя, телефон или другие персональные данные. Связаться с нами можно по телефону${c.viber || c.tg ? " или в мессенджере" : ""} — в этом случае данные обрабатываются только для ответа на ваше обращение и записи на ремонт.</p>
  <h3>Сторонние сервисы</h3><p>На сайте работают сервисы других компаний, которые могут сохранять файлы cookie и получать технические данные (IP-адрес, тип браузера):</p>
  <ul><li>Яндекс Карты — карта с нашим адресом (ООО «Яндекс»);</li><li>Google Fonts — шрифты сайта (Google LLC).</li></ul>
  <p>Их обработку регулируют политики этих компаний. Отключить cookie можно в настройках браузера — сайт продолжит работать.</p>
  <h3>Ваши права</h3><p>Вы вправе получить информацию об обработке ваших данных, потребовать их изменения или удаления, отозвать согласие. Для этого обратитесь по контактам выше.</p>
</div></dialog>`;

  return hdr + `\n<main>\n${main}\n</main>\n` + ftr + "\n" + privacy;
}

module.exports = { render, BLOCKS, ICONS };
