import { describe, it, expect } from 'vitest';
import { isSafeHttpUrl } from '../src/utils/url.js';

describe('url utils', () => {
  it('accepts safe http and https urls', () => {
    expect(isSafeHttpUrl('https://example.com/register')).toBe(true);
    expect(isSafeHttpUrl('http://example.com')).toBe(true);
    expect(isSafeHttpUrl('https://sub.domain.org/path?a=1&b=2')).toBe(true);
  });

  it('rejects dangerous or malformed protocols', () => {
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeHttpUrl('data:text/html,<html>')).toBe(false);
    expect(isSafeHttpUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeHttpUrl('')).toBe(false);
    expect(isSafeHttpUrl('not a url')).toBe(false);
    expect(isSafeHttpUrl(null)).toBe(false);
  });
});
