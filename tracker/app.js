// Демо-версия «Трекера студии» для GitHub Pages: без сервера, без пароля.
// Интерфейс повторяет основную версию (d1trepes/studio-tracker), данные — в localStorage.
import { DAYS_SHORT, addDays, isoWeekNumber, longDate, mondayOf, nextRecurrence, rangeLabel, relativeDay, todayISO } from './dates.js';
import { parseQuickTask } from './parse.js';

const KEY = 'studio-tracker-demo-v1';
const NAMES = { 1: 'Дизайнер', 2: 'Программист' };
const NAMES_FROM = { 1: 'Дизайнера', 2: 'Программиста' };
const MARKS = ['', '!', '!!'];
const MAIL_GOAL = { total: 70, radar: 50, manualEach: 10 };
const partnerOf = (id) => (id === 1 ? 2 : 1);

// ---------- данные ----------

const LEVELS = [
  [0, 'Готовы продавать', 'Три демо онлайн, радар работает, первые письма отправлены.'],
  [1, 'Первые деньги', '1 оплаченный проект целиком + отзыв клиента.'],
  [2, '50 000 ₽ за месяц', 'Выручка 50 000 ₽ за календарный месяц.'],
  [3, '100 000 ₽ и 5 клиентов', '100 000 ₽ выручки за месяц и 5 клиентов.'],
  [4, '150 000 ₽ два месяца подряд', '150 000 ₽ выручки два месяца подряд.'],
  [5, '245 000 ₽ стабильно', '245 000 ₽ выручки в месяц стабильно = по 100 000 ₽ на руки.'],
];

// Те же демо-данные, что в основной версии (lib/db.js), даты — от сегодняшнего дня.
function seed() {
  const today = todayISO();
  const mon = mondayOf(today);
  const d = (n) => addDays(today, n);

  const leads = [
    ['Металлпром', 1, d(0), 'Отправить КП'],
    ['ТД «Профмет»', 1, d(0), 'Ответить про сроки сайта'],
    ['ТехноДом', 2, d(0), 'Назначить созвон-бриф'],
    ['Пласт-Урал', 1, d(-1), 'Мини-аудит сайта'],
    ['Дента', 1, d(4), 'Сдать главную'],
  ].map(([company, owner_id, next_step_date, next_step_text], i) => ({ id: i + 1, company, owner_id, next_step_date, next_step_text }));
  const leadId = Object.fromEntries(leads.map((l) => [l.company, l.id]));

  const D = 1, P = 2;
  const raw = [
    [D, D, d(0), 2, 'doing', 'Отправить КП — Металлпром', 'Металлпром'],
    [D, D, d(0), 2, 'todo', 'Экран записи на приём в демо клиники'],
    [D, D, d(0), 1, 'todo', '10 писем вручную — клиники', null, 'daily'],
    [D, D, d(0), 0, 'todo', 'Ответить Денте по правкам главной', 'Дента'],
    [D, D, d(0), 0, 'done', 'Подобрать 3 примера для мини-аудита', 'Пласт-Урал'],
    [D, D, d(0), 0, 'todo', 'Созвон в 18:00 — итоги недели'],
    [P, P, d(0), 2, 'doing', 'Заявки с сайта Денты → Telegram', 'Дента'],
    [P, P, d(0), 1, 'todo', 'Радар: проверка мобильной версии сайтов'],
    [P, P, d(0), 1, 'todo', '10 писем вручную — клиники', null, 'daily'],
    [P, P, d(0), 0, 'todo', 'Демо магазина: каталог и фильтры'],
    [P, D, d(0), 0, 'todo', 'Ежедневный бэкап базы трекера'],
    [P, P, d(0), 0, 'todo', 'Созвон в 18:00 — итоги недели'],
    [D, D, d(-1), 1, 'todo', 'Мини-аудит для Пласт-Урал', 'Пласт-Урал'],
    [D, D, d(-2), 0, 'todo', 'Письмо 2 — Мебель Комфорт'],
    [P, P, d(-1), 1, 'todo', 'Подключить второй почтовый ящик радара'],
    [D, D, addDays(mon, 0), 1, 'done', 'Выложить демо производства'],
    [P, P, addDays(mon, 0), 2, 'done', 'Радар: сбор с Яндекс Карт'],
    [D, D, addDays(mon, 1), 2, 'done', 'Ответить Металлпрому', 'Металлпром'],
    [P, P, addDays(mon, 1), 2, 'done', 'Радар: отправка писем'],
    [P, P, addDays(mon, 2), 0, 'done', 'Демо магазина: корзина'],
    [D, D, d(1), 1, 'todo', 'Созвон-бриф с ТехноДом', 'ТехноДом'],
    [P, P, d(1), 0, 'todo', 'Демо магазина: карточка товара'],
    [D, D, d(2), 0, 'todo', 'Недельный отчёт', null, 'weekly:5'],
  ].filter((t) => !(t[4] === 'done' && t[2] > today));

  const tasks = raw.map(([assignee_id, created_by, due_date, priority, status, title, lead, recurrence], i) => ({
    id: i + 1, title, assignee_id, created_by, due_date, priority, status,
    lead_id: lead ? leadId[lead] : null, recurrence: recurrence || null,
  }));

  return {
    role: null,
    nextId: tasks.length + 1,
    tasks,
    leads,
    mails: { [today]: { 1: { manual: 6, radar: 11 }, 2: { manual: 4, radar: 11 } } },
    levelReached: { 0: d(-6) },
  };
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && Array.isArray(s.tasks)) return s;
  } catch {}
  return seed();
}

let db = load();
let memoryOnly = false;

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    memoryOnly = true; // приватный режим или запрет хранилища — работаем до перезагрузки
  }
}
save(); // демо-данные запоминаются при первом открытии

// ---------- действия (как app/actions.js в основной версии) ----------

const actions = {
  chooseRole(id) { db.role = id; save(); },
  addTask(text) {
    const t = parseQuickTask(text, { userId: db.role });
    if (!t.title) return { error: 'Напишите название задачи' };
    db.tasks.push({
      id: db.nextId++, title: t.title, assignee_id: t.assigneeId, created_by: db.role,
      due_date: t.dueDate, priority: t.priority, status: 'todo', lead_id: null, recurrence: t.recurrence,
    });
    save();
    return { message: t.assigneeId !== db.role ? `Задача ушла партнёру — ${NAMES[t.assigneeId]}` : '' };
  },
  toggleTask(id) {
    const task = db.tasks.find((t) => t.id === id);
    if (!task) return;
    if (task.status === 'done') {
      task.status = 'todo';
      task.done_at = null;
    } else {
      task.status = 'done';
      task.done_at = new Date().toISOString();
      // Повторяющаяся задача: при закрытии появляется копия на следующую дату.
      if (task.recurrence) {
        const today = todayISO();
        const next = nextRecurrence(task.recurrence, task.due_date > today ? task.due_date : today);
        const exists = db.tasks.some((t) => t.title === task.title && t.assignee_id === task.assignee_id && t.due_date === next && t.recurrence === task.recurrence);
        if (next && !exists) db.tasks.push({ ...task, id: db.nextId++, due_date: next, status: 'todo', done_at: null });
      }
    }
    save();
  },
  moveToToday(id) { const t = db.tasks.find((x) => x.id === id); if (t) t.due_date = todayISO(); save(); },
  deleteTask(id) { db.tasks = db.tasks.filter((t) => t.id !== id); save(); },
  addManualMail() {
    const today = todayISO();
    const day = (db.mails[today] ||= {});
    const mine = (day[db.role] ||= { manual: 0, radar: 0 });
    mine.manual += 1;
    save();
  },
  reset() { const role = db.role; db = seed(); db.role = role; save(); },
};

// ---------- выборки ----------

const leadName = (id) => db.leads.find((l) => l.id === id)?.company || '';
const byPriority = (a, b) => (a.status === 'done') - (b.status === 'done') || b.priority - a.priority || a.id - b.id;
const currentLevel = () => LEVELS.find(([n]) => !db.levelReached[n]) || LEVELS[5];
const todayLeft = (userId) => db.tasks.filter((t) => t.assignee_id === userId && t.due_date <= todayISO() && t.status !== 'done').length;

// ---------- разметка ----------

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const ICONS = {
  today: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  tasks: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 12l3 3 5-6"/>',
  crm: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.4 3.4-5.5 6.5-5.5s5.7 2.1 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.7 3 2.5 3.5 5.2"/>',
  money: '<rect x="2.5" y="6" width="19" height="13" rx="3"/><path d="M2.5 10h19M16 14.5h2"/>',
  week: '<rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M7.5 14h4"/>',
  path: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6M12 17h.01"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  repeat: '<path d="M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4"/>',
};
const icon = (name, size = 18, stroke = 1.7, extra = '') =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${ICONS[name]}</svg>`;

const SECTIONS = [
  { route: '', label: 'Сегодня', icon: 'today' },
  { route: 'tasks', label: 'Задачи', icon: 'tasks' },
  { route: 'crm', label: 'Клиенты', icon: 'crm' },
  { route: 'money', label: 'Деньги', icon: 'money' },
  { route: 'week', label: 'Неделя', icon: 'week' },
  { route: 'path', label: 'Путь', icon: 'path' },
];
const HELP = { route: 'help', label: 'Как пользоваться', icon: 'help' };
const href = (route, query = '') => '#/' + route + (query ? '?' + query : '');

function parseRoute() {
  const h = location.hash.replace(/^#\/?/, '');
  const [route, q] = h.split('?');
  return { route: route || '', params: new URLSearchParams(q || '') };
}

const check = (task, small) => {
  const done = task.status === 'done';
  return `<button type="button" class="check" role="checkbox" aria-checked="${done}" aria-label="${done ? 'Вернуть в работу' : 'Отметить выполненной'}" data-act="toggle" data-id="${task.id}">${
    done ? icon('check', small ? 10 : 12, 3, ' style="color:#fff"') : ''}</button>`;
};

function taskRow(t, { overdueLabel, fromName } = {}) {
  const cls = 'task-row' + (overdueLabel ? ' overdue' : '') + (t.status === 'done' ? ' is-done' : '');
  const lead = leadName(t.lead_id);
  const tail = overdueLabel
    ? `<span class="late">${esc(overdueLabel)}</span>
       <button class="btn btn-sm" data-act="today" data-id="${t.id}">На сегодня</button>
       <button class="btn btn-sm" data-act="delete" data-id="${t.id}">Удалить</button>`
    : `<span class="meta">
         ${fromName ? `<span class="small muted">от ${esc(fromName)}</span>` : ''}
         ${lead ? `<span class="tag">${esc(lead)}</span>` : ''}
         ${t.recurrence ? `<span class="muted" title="Повторяющаяся задача" style="display:flex">${icon('repeat', 14, 1.8)}</span>` : ''}
       </span>`;
  return `<div class="${cls}">${check(t)}${overdueLabel ? '' : `<span class="mark">${MARKS[t.priority]}</span>`}<span class="title">${esc(t.title)}</span>${tail}</div>`;
}

const quickForm = (id) => `
  <form data-form="quick">
    <div class="quick">
      <label for="${id}" class="sr-only">Новая задача</label>
      <input id="${id}" name="text" autocomplete="off" enterkeyhint="done" placeholder="Новая задача… «@прог» — партнёру, «!» — важно, Enter — добавить">
      <button class="btn-dark">Добавить</button>
    </div>
    ${flash && flash.form === id ? `<div class="quick-msg ${flash.error ? 'red' : 'green'}">${esc(flash.text)}</div>` : ''}
  </form>`;

let flash = null; // сообщение под строкой ввода после добавления

function todayPage() {
  const me = db.role;
  const today = todayISO();
  const mine = db.tasks.filter((t) => t.assignee_id === me && t.due_date === today).sort(byPriority);
  const overdue = db.tasks
    .filter((t) => t.assignee_id === me && t.due_date < today && t.status !== 'done')
    .sort((a, b) => b.due_date.localeCompare(a.due_date) || b.priority - a.priority);
  const partner = db.tasks.filter((t) => t.assignee_id === partnerOf(me) && t.due_date === today).sort(byPriority);
  const steps = db.leads
    .filter((l) => l.owner_id === me && l.next_step_date && l.next_step_date <= today)
    .sort((a, b) => a.next_step_date.localeCompare(b.next_step_date) || a.company.localeCompare(b.company));
  const day = db.mails[today] || {};
  const mail = { radar: 0, manual: 0, mine: day[me]?.manual || 0 };
  for (const v of Object.values(day)) { mail.radar += v.radar || 0; mail.manual += v.manual || 0; }
  const pct = (n) => Math.min(100, (n / MAIL_GOAL.total) * 100) + '%';
  const doneCount = mine.filter((t) => t.status === 'done').length;
  const [lvN, lvTitle, lvCrit] = currentLevel();

  return `
  <div class="page-head">
    <div><div class="page-sub">${longDate(today)} · ${NAMES[me]}</div><h1 class="page-title">Сегодня</h1></div>
    <div class="page-sub">Сделано ${doneCount} из ${mine.length}</div>
  </div>
  <div class="cols">
    <div class="col-main">
      <section class="card mail">
        <div class="mail-top">
          <div class="mail-count"><span class="block-title">Письма сегодня</span><span class="mail-num">${mail.radar + mail.manual}</span><span class="muted">из ${MAIL_GOAL.total}</span></div>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="small muted">Мои вручную: ${mail.mine} из ${MAIL_GOAL.manualEach}</span>
            <button class="btn" data-act="mail">+1 письмо</button>
          </div>
        </div>
        <div class="bar"><span style="width:${pct(mail.radar)};background:var(--ink)"></span><span style="width:${pct(mail.manual)};background:var(--faint)"></span></div>
        <div class="legend">
          <span><span class="swatch" style="background:var(--ink)"></span>Радар ${mail.radar} из ${MAIL_GOAL.radar}</span>
          <span><span class="swatch" style="background:var(--faint)"></span>Вручную ${mail.manual} из ${MAIL_GOAL.manualEach * 2}</span>
        </div>
      </section>
      ${overdue.length ? `
      <section class="section">
        <div class="section-head" style="justify-content:flex-start"><span class="block-title red">Просрочено</span><span class="pill-red">${overdue.length}</span></div>
        ${overdue.map((t) => taskRow(t, { overdueLabel: relativeDay(t.due_date, today) })).join('')}
      </section>` : ''}
      <section class="section">
        <div class="section-head"><span class="block-title">Мои задачи</span><span class="small muted">по приоритету</span></div>
        ${mine.length
          ? mine.map((t) => taskRow(t, { fromName: t.created_by !== me ? NAMES_FROM[t.created_by] : '' })).join('')
          : '<div class="empty">На сегодня задач нет. Добавьте первую строкой ниже.</div>'}
        ${quickForm('quick')}
      </section>
    </div>
    <div class="col-side">
      <section class="card-soft">
        <div class="block-title" style="margin-bottom:4px">Шаги по лидам на сегодня</div>
        <div class="small muted" style="margin-bottom:8px">У кого дата следующего шага — сегодня</div>
        ${steps.length ? steps.map((s) => `
          <a href="${href('crm')}" class="step"><span class="co">${esc(s.company)}</span>
            <span class="what">${esc(s.next_step_text)}${s.next_step_date < today ? `<span class="red"> · ${relativeDay(s.next_step_date, today)}</span>` : ''}</span></a>`).join('')
          : '<div class="empty" style="padding-left:0">Сегодня шагов по лидам нет.</div>'}
      </section>
      <section class="card">
        <div class="section-head" style="margin-bottom:8px;align-items:baseline"><span class="block-title">У партнёра сегодня</span><span class="small muted">${NAMES[partnerOf(me)]}</span></div>
        ${partner.length ? partner.map((t) => `<div class="partner-row${t.status === 'done' ? ' is-done' : ''}"><span class="dot"></span><span>${esc(t.title)}</span></div>`).join('')
          : '<div class="small muted">Задач на сегодня нет.</div>'}
      </section>
      <section class="card" style="display:flex;flex-direction:column;gap:8px">
        <div class="section-head" style="margin-bottom:0;align-items:baseline"><span class="block-title">Уровень ${lvN} · ${esc(lvTitle)}</span><a href="${href('path')}" class="btn-ghost">Путь →</a></div>
        <div style="font-size:13px" class="muted">${esc(lvCrit)}</div>
      </section>
    </div>
  </div>`;
}

const FILTERS = [['me', 'Мои'], ['partner', 'Партнёра'], ['all', 'Все']];

function tasksPage(params) {
  const me = db.role;
  const filter = FILTERS.some(([k]) => k === params.get('f')) ? params.get('f') : 'all';
  const offset = Number.parseInt(params.get('w'), 10) || 0;
  const today = todayISO();
  const monday = addDays(mondayOf(today), offset * 7);
  const sunday = addDays(monday, 6);
  const link = (patch) => {
    const q = new URLSearchParams();
    const f = patch.f ?? filter;
    const w = patch.w ?? offset;
    if (f !== 'all') q.set('f', f);
    if (w) q.set('w', String(w));
    return href('tasks', q.toString());
  };
  const tasks = db.tasks
    .filter((t) => t.due_date >= monday && t.due_date <= sunday)
    .filter((t) => (filter === 'all' ? true : filter === 'me' ? t.assignee_id === me : t.assignee_id !== me))
    .sort(byPriority);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const list = tasks.filter((t) => t.due_date === date);
    const isToday = date === today;
    return `
      <div class="day${isToday ? ' is-today' : ''}">
        <div class="day-head"><span>${DAYS_SHORT[i]} ${Number(date.slice(8))}${isToday ? ' · сегодня' : ''}</span><span class="small muted">${list.length}</span></div>
        ${list.map((t) => {
          const done = t.status === 'done';
          const late = !done && t.due_date < today;
          const state = done ? 'готово' : late ? 'просрочено' : t.status === 'doing' ? 'в работе' : '';
          const cls = !done && late ? 'state-late' : !done && t.status === 'doing' ? 'state-doing' : '';
          return `
          <div class="wcard${done ? ' is-done' : ''}">
            <div class="wcard-title">${check(t, true)}<span>${MARKS[t.priority] ? MARKS[t.priority] + ' ' : ''}${esc(t.title)}</span></div>
            <div class="wcard-foot"><span class="who" title="${NAMES[t.assignee_id]}">${t.assignee_id === 1 ? 'Д' : 'П'}</span><span class="${cls}">${state}</span></div>
          </div>`;
        }).join('')}
      </div>`;
  }).join('');

  return `
  <div class="page-head" style="margin-bottom:20px">
    <div>
      <div class="page-sub">${rangeLabel(monday, sunday)} · неделя ${isoWeekNumber(monday)}</div>
      <h1 class="page-title">Задачи</h1>
      <div class="week-nav">
        <a href="${link({ w: offset - 1 })}">← Прошлая</a>
        ${offset ? `<a href="${link({ w: 0 })}">Эта неделя</a>` : ''}
        <a href="${link({ w: offset + 1 })}">Следующая →</a>
      </div>
    </div>
    <div class="toolbar">
      <div class="seg">${FILTERS.map(([k, l]) => `<a href="${link({ f: k })}"${filter === k ? ' aria-current="true"' : ''}>${l}</a>`).join('')}</div>
      <div class="seg"><span aria-current="true">Неделя</span><span aria-disabled="true" title="Появится позже">Список</span><span aria-disabled="true" title="Появится позже">Доска</span></div>
    </div>
  </div>
  <div style="margin-bottom:16px;max-width:640px">${quickForm('quick')}</div>
  <div class="week-scroll"><div class="week">${days}</div></div>`;
}

const stub = (title, step, text) => `
  <div class="stub"><h1 class="page-title" style="margin-bottom:8px">${title}</h1><p>${text}</p>
  <p class="small">Раздел появится на шаге ${step} из плана «Версия 1».</p></div>`;

const helpPage = () => `
  <div class="help">
    <h1 class="page-title" style="margin:0 0 6px">Как пользоваться</h1>
    <div class="muted" style="margin-bottom:20px">Пять минут, один раз.</div>
    <ol>
      <li><b>Начинай с «Сегодня».</b> Там всё, что нужно сделать сейчас: письма, просроченное, задачи, шаги по лидам.</li>
      <li><b>Задача — одна строка.</b> Написал и Enter. «@прог» или «@диз» — задача партнёру, «!» — важная, «завтра» / «пт» — дата.</li>
      <li><b>Ручные письма — сразу «+1».</b> Счётчик дня и недели считается сам.</li>
      <li><b>Лид ответил — сразу этап «Ответил».</b> Вставь ответ в историю, поставь дату следующего шага. КП — за 48 часов.</li>
      <li><b>Каждый лид с ответом живёт на доске.</b> База радара — отдельно, её руками не трогаем.</li>
      <li><b>Деньги пришли — «Внести поступление».</b> Налог, фонд и перевод партнёру посчитаются сами.</li>
      <li><b>Просрочено — не копим.</b> Либо «На сегодня», либо удалить. Больше 3 просроченных — разбираем на созвоне.</li>
      <li><b>Пятница — «Неделя».</b> «Черновик от ИИ», правим вдвоём по повестке, «Сохранить неделю».</li>
      <li><b>«Путь» — смотрим раз в неделю.</b> Если задача из списка «не делаем» — не делаем.</li>
      <li><b>Уведомления — в Telegram.</b> Задача от партнёра, ответ лида, деньги и сводка в 16:30.</li>
    </ol>
  </div>`;

function morePage() {
  const partner = partnerOf(db.role);
  const items = [...SECTIONS.slice(3), HELP];
  return `
  <div class="page-head"><div><div class="page-sub">${NAMES[db.role]}</div><h1 class="page-title">Ещё</h1></div></div>
  <div class="more-list">
    ${items.map((s) => `<a href="${href(s.route)}" class="nav-item">${icon(s.icon)}<span class="grow">${s.label}</span></a>`).join('')}
    <div class="nav-sep"></div>
    <button class="btn" style="width:100%;height:40px" data-act="role" data-id="${partner}">Я — ${NAMES[partner]}</button>
    <button class="nav-logout" style="width:100%;text-align:center;margin-top:8px" data-act="reset">Сбросить демо-данные</button>
  </div>`;
}

const PAGES = {
  '': todayPage,
  tasks: tasksPage,
  crm: () => stub('Клиенты', 3, 'Живые лиды на доске воронки, база радара и проекты в работе. Карточка лида с историей и следующим шагом.'),
  money: () => stub('Деньги', 4, 'Выручка месяца против цели уровня, поступления с расчётом налога, фонда и перевода партнёру.'),
  week: () => stub('Неделя', 5, 'Автометрики недели, поля отчёта, черновик от ИИ и архив.'),
  path: () => stub('Путь', 4, 'Шесть уровней, прогресс по выручке, критерий перехода и список «чего не делаем».'),
  help: helpPage,
  more: morePage,
};
const TITLES = { '': 'Сегодня', tasks: 'Задачи', crm: 'Клиенты', money: 'Деньги', week: 'Неделя', path: 'Путь', help: 'Как пользоваться', more: 'Ещё' };

function sidebar(route) {
  const counts = { '': todayLeft(db.role) || '', path: `ур. ${currentLevel()[0]}` };
  const item = (s) => `
    <a href="${href(s.route)}" class="nav-item"${route === s.route ? ' aria-current="page"' : ''}>
      ${icon(s.icon)}<span class="grow">${s.label}</span>${counts[s.route] ? `<span class="count">${counts[s.route]}</span>` : ''}
    </a>`;
  return `
  <nav class="sidebar" aria-label="Разделы">
    <div class="brand"><div class="brand-mark">С</div><div class="brand-name">Студия</div></div>
    <div class="role-switch">
      ${[1, 2].map((id) => `<button aria-pressed="${db.role === id}" data-act="role" data-id="${id}">${NAMES[id]}</button>`).join('')}
    </div>
    ${SECTIONS.map(item).join('')}
    <div class="nav-sep"></div>
    ${item(HELP)}
    <button class="nav-logout" data-act="reset">Сбросить демо-данные</button>
  </nav>`;
}

function tabbar(route) {
  const underMore = ['more', 'money', 'week', 'path', 'help'];
  const tabs = [['', 'Сегодня', 'today'], ['tasks', 'Задачи', 'tasks'], ['crm', 'Клиенты', 'crm'], ['more', 'Ещё', 'more']];
  return `<nav class="tabbar" aria-label="Разделы">${tabs.map(([r, label, ic]) => {
    const on = r === 'more' ? underMore.includes(route) : route === r;
    return `<a href="${href(r)}"${on ? ' aria-current="page"' : ''}>${icon(ic, 22, 1.8)}${label}</a>`;
  }).join('')}</nav>`;
}

const rolePage = () => `
  <div class="auth"><div class="auth-box">
    <div class="brand" style="padding:0"><div class="brand-mark">С</div><div class="brand-name">Студия</div></div>
    <h1>Кто работает?</h1>
    <div class="small muted">Демо-версия: без пароля, данные хранятся только в этом браузере. Сменить роль можно в меню.</div>
    <div class="role-pick">
      <button data-act="role" data-id="1">Дизайнер <span class="small muted">РБ · налог 10%</span></button>
      <button data-act="role" data-id="2">Программист <span class="small muted">РФ · налог 6%</span></button>
    </div>
  </div></div>`;

const app = document.getElementById('app');
let sheetOpen = false;

function render() {
  if (!db.role) {
    document.title = 'Трекер студии — демо';
    app.innerHTML = rolePage();
    return;
  }
  const { route, params } = parseRoute();
  const page = PAGES[route] ? route : '';
  document.title = `${TITLES[page]} — Трекер студии (демо)`;
  app.innerHTML = `
  <div class="shell">
    ${sidebar(page)}
    <main class="main">
      <div class="demo-banner">Демо-версия: данные хранятся только в этом браузере${memoryOnly ? ' (хранилище недоступно — после перезагрузки всё сбросится)' : ''}.</div>
      ${PAGES[page](params)}
    </main>
    <button class="fab" aria-label="Новая задача" data-act="fab">${icon('plus', 22, 2)}</button>
    <div class="sheet-backdrop" data-act="sheet-close" style="display:${sheetOpen ? 'flex' : 'none'}">
      <div class="sheet" role="dialog" aria-label="Новая задача">
        <div class="block-title">Новая задача</div>
        <div class="small muted">«@прог» или «@диз» — партнёру, «!» — важно, «завтра» или «пт» — дата</div>
        ${quickForm('quick-sheet')}
      </div>
    </div>
    ${tabbar(page)}
  </div>`;
}

// ---------- события ----------

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const id = Number(el.dataset.id);
  switch (el.dataset.act) {
    case 'toggle': actions.toggleTask(id); break;
    case 'today': actions.moveToToday(id); break;
    case 'delete': if (!confirm('Удалить задачу?')) return; actions.deleteTask(id); break;
    case 'mail': actions.addManualMail(); break;
    case 'role': actions.chooseRole(id); break;
    case 'reset': if (!confirm('Вернуть демо-данные к началу? Ваши задачи удалятся.')) return; actions.reset(); break;
    case 'fab': {
      // Фокус ставим сразу в обработчике нажатия, иначе iPhone не покажет клавиатуру.
      sheetOpen = true;
      el.parentElement.querySelector('.sheet-backdrop').style.display = 'flex';
      document.getElementById('quick-sheet')?.focus();
      return;
    }
    case 'sheet-close': if (e.target !== el) return; sheetOpen = false; break;
    default: return;
  }
  flash = null;
  render();
});

app.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-form="quick"]');
  if (!form) return;
  e.preventDefault();
  const input = form.querySelector('input');
  if (!input.value.trim()) return;
  const res = actions.addTask(input.value);
  if (res.error) flash = { form: input.id, error: true, text: res.error };
  else {
    flash = res.message ? { form: input.id, text: res.message } : null;
    if (input.id === 'quick-sheet') sheetOpen = false;
  }
  const keepFocus = input.id === 'quick' ? 'quick' : res.error ? 'quick-sheet' : null;
  render();
  if (keepFocus) document.getElementById(keepFocus)?.focus();
});

app.addEventListener('input', (e) => {
  if (e.target.name === 'text' && flash) {
    flash = null;
    e.target.closest('form').querySelector('.quick-msg')?.remove();
  }
});

window.addEventListener('hashchange', () => { sheetOpen = false; flash = null; render(); window.scrollTo(0, 0); });
// Изменения из другой вкладки и смена дня, пока приложение было свёрнуто.
window.addEventListener('storage', (e) => { if (e.key === KEY) { db = load(); render(); } });
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });

render();
