const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function parseDateOnly(str) {
  if (typeof str !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str.trim());
  if (!match) return null;

  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const d = parseInt(match[3], 10);

  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;

  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }

  return { y, m, d };
}

export function todayParts(now = new Date()) {
  return {
    y: now.getFullYear(),
    m: now.getMonth() + 1,
    d: now.getDate()
  };
}

export function daysLeft(deadlineStr, now = new Date()) {
  const target = parseDateOnly(deadlineStr);
  if (!target) return null;

  const today = todayParts(now);
  const targetUtc = Date.UTC(target.y, target.m - 1, target.d);
  const todayUtc = Date.UTC(today.y, today.m - 1, today.d);

  return Math.round((targetUtc - todayUtc) / 86400000);
}

export function formatDate(str) {
  const parts = parseDateOnly(str);
  if (!parts) return 'Not provided';
  const monthName = MONTHS[parts.m - 1];
  return `${parts.d} ${monthName} ${parts.y}`;
}
