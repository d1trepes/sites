import { addDays, todayISO, weekday } from './dates.js';

// Разбор строки быстрого ввода:
// «@прог починить форму на демо клиники завтра !» →
// { title: 'починить форму на демо клиники', assigneeId: 2, dueDate: <завтра>, priority: 1 }

const DAY_WORDS = [
  ['пн', 'понедельник'],
  ['вт', 'вторник'],
  ['ср', 'среда', 'среду'],
  ['чт', 'четверг'],
  ['пт', 'пятница', 'пятницу'],
  ['сб', 'суббота', 'субботу'],
  ['вс', 'воскресенье'],
];

function dayIndex(word) {
  const i = DAY_WORDS.findIndex((forms) => forms.includes(word));
  return i === -1 ? null : i + 1;
}

// Ближайший такой день недели, начиная с сегодняшнего.
function nextWeekday(target, today) {
  let d = today;
  while (weekday(d) !== target) d = addDays(d, 1);
  return d;
}

export function parseQuickTask(text, { userId, today = todayISO() }) {
  let assigneeId = userId;
  let priority = 0;
  let dueDate = today;
  let recurrence = null;
  const words = [];

  const tokens = text.trim().split(/\s+/).filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    const raw = tokens[i];
    const w = raw.toLowerCase().replace(/[.,;]+$/, '');
    const next = (tokens[i + 1] || '').toLowerCase().replace(/[.,;]+$/, '');

    if (/^@прог/.test(w)) { assigneeId = 2; continue; }
    if (/^@диз/.test(w)) { assigneeId = 1; continue; }

    const bangs = (raw.match(/!/g) || []).length;
    if (bangs) {
      priority = Math.max(priority, Math.min(bangs, 2));
      const rest = raw.replace(/!+/g, '');
      if (rest) words.push(rest);
      continue;
    }

    if (w === 'сегодня') { dueDate = today; continue; }
    if (w === 'завтра') { dueDate = addDays(today, 1); continue; }
    if (w === 'послезавтра') { dueDate = addDays(today, 2); continue; }

    if ((w === 'каждый' || w === 'каждую' || w === 'каждое') && next) {
      if (next === 'день') { recurrence = 'daily'; i++; continue; }
      const di = dayIndex(next);
      if (di) { recurrence = `weekly:${di}`; dueDate = nextWeekday(di, today); i++; continue; }
    }
    if (w === 'ежедневно') { recurrence = 'daily'; continue; }
    if (w === 'по' && next === 'будням') {
      recurrence = 'weekdays';
      while (weekday(dueDate) > 5) dueDate = addDays(dueDate, 1);
      i++;
      continue;
    }

    const di = dayIndex(w);
    if (di) { dueDate = nextWeekday(di, today); continue; }

    const dm = /^(\d{1,2})\.(\d{1,2})$/.exec(w);
    if (dm) {
      const d = Number(dm[1]);
      const m = Number(dm[2]);
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
        let y = Number(today.slice(0, 4));
        let iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        // Дата, которая прошла больше месяца назад, — это следующий год.
        if (iso < addDays(today, -31)) iso = `${y + 1}${iso.slice(4)}`;
        dueDate = iso;
        continue;
      }
    }

    words.push(raw);
  }

  return { title: words.join(' ').trim(), assigneeId, priority, dueDate, recurrence };
}
