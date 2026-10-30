// Даты задач хранятся как календарный день по Москве: 'YYYY-MM-DD'.
// Метки времени (done_at, created_at) — ISO в UTC.

const TZ = 'Europe/Moscow';

export function todayISO(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(now);
}

function toDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromDate(dt) {
  return dt.toISOString().slice(0, 10);
}

export function addDays(iso, n) {
  const dt = toDate(iso);
  dt.setUTCDate(dt.getUTCDate() + n);
  return fromDate(dt);
}

// 1 = понедельник … 7 = воскресенье
export function weekday(iso) {
  const d = toDate(iso).getUTCDay();
  return d === 0 ? 7 : d;
}

export function mondayOf(iso) {
  return addDays(iso, 1 - weekday(iso));
}

export function isoWeekNumber(iso) {
  const thursday = addDays(iso, 4 - weekday(iso));
  const yearStart = toDate(thursday.slice(0, 4) + '-01-01');
  return Math.floor((toDate(thursday) - yearStart) / 86400000 / 7) + 1;
}

const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const DAYS_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
export const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const day = (iso) => Number(iso.slice(8, 10));
const month = (iso) => Number(iso.slice(5, 7)) - 1;

// «Пятница, 30 октября»
export function longDate(iso) {
  return `${DAYS_FULL[weekday(iso) - 1]}, ${day(iso)} ${MONTHS_GEN[month(iso)]}`;
}

// «26 октября — 1 ноября»
export function rangeLabel(from, to) {
  return `${day(from)} ${MONTHS_GEN[month(from)]} — ${day(to)} ${MONTHS_GEN[month(to)]}`;
}

// «вчера», «сегодня», «завтра» или «28 окт»
export function relativeDay(iso, today = todayISO()) {
  if (iso === today) return 'сегодня';
  if (iso === addDays(today, -1)) return 'вчера';
  if (iso === addDays(today, 1)) return 'завтра';
  return `${day(iso)} ${MONTHS_SHORT[month(iso)]}`;
}

// Следующая дата повторяющейся задачи после даты from.
export function nextRecurrence(rule, from) {
  if (rule === 'daily') return addDays(from, 1);
  if (rule === 'weekdays') {
    let d = addDays(from, 1);
    while (weekday(d) > 5) d = addDays(d, 1);
    return d;
  }
  const m = /^weekly:([1-7])$/.exec(rule || '');
  if (m) {
    const target = Number(m[1]);
    let d = addDays(from, 1);
    while (weekday(d) !== target) d = addDays(d, 1);
    return d;
  }
  return null;
}
