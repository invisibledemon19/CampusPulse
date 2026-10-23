import { describe, it, expect } from 'vitest';
import { normalizeTag } from '../src/utils/tags.js';

describe('tags utils', () => {
  it('normalizes casing and trims whitespace', () => {
    expect(normalizeTag('  Python  ')).toBe('python');
    expect(normalizeTag('JavaScript')).toBe('javascript');
  });

  it('collapses inner whitespace and strips disallowed characters', () => {
    expect(normalizeTag('react   native')).toBe('react native');
    expect(normalizeTag('c++')).toBe('c++');
    expect(normalizeTag('c#')).toBe('c#');
    expect(normalizeTag('node.js')).toBe('nodejs');
    expect(normalizeTag('hello@world!$%^&*()')).toBe('helloworld');
  });

  it('applies aliases correctly', () => {
    expect(normalizeTag('artificial intelligence')).toBe('ai');
    expect(normalizeTag('machine learning')).toBe('ml');
    expect(normalizeTag('js')).toBe('javascript');
    expect(normalizeTag('node')).toBe('nodejs');
    expect(normalizeTag('node.js')).toBe('nodejs');
    expect(normalizeTag('nodejs')).toBe('nodejs');
    expect(normalizeTag('reactjs')).toBe('react');
    expect(normalizeTag('react.js')).toBe('react');
    expect(normalizeTag('py')).toBe('python');
    expect(normalizeTag('hackathons')).toBe('hackathon');
    expect(normalizeTag('internships')).toBe('internship');
    expect(normalizeTag('workshops')).toBe('workshop');
    expect(normalizeTag('events')).toBe('event');
  });

  it('handles non-string or empty input gracefully', () => {
    expect(normalizeTag('')).toBe('');
    expect(normalizeTag(null)).toBe('');
    expect(normalizeTag(undefined)).toBe('');
    expect(normalizeTag(123)).toBe('');
  });
});
