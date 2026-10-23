import { ALIASES } from '../data/aliases.js';

export function normalizeTag(s) {
  if (typeof s !== 'string') return '';
  let str = s.trim().toLowerCase();
  str = str.replace(/[^a-z0-9\s+#.]/g, '');
  str = str.replace(/\s+/g, ' ');
  if (ALIASES[str]) {
    return ALIASES[str];
  }
  return str;
}
