import { describe, it, expect } from 'vitest';
import { toMessSlug, toRoomSlug, idSuffixFromSlug, isSlug } from './slugify';

describe('toMessSlug', () => {
  it('converts a normal name + id to a slug', () => {
    expect(toMessSlug('Aryan Boys Mess', 'ABC123xyz')).toBe('aryan-boys-mess-ABC1');
  });

  it('strips special characters', () => {
    expect(toMessSlug("Maa Tarini's Mess!", 'DEF456ab')).toBe('maa-tarinis-mess-DEF4');
  });

  it('collapses multiple spaces and hyphens', () => {
    expect(toMessSlug('Alpha  --  Mess', 'XYZ789gh')).toBe('alpha-mess-XYZ7');
  });

  it('returns id when name is empty', () => {
    expect(toMessSlug('', 'ABCD1234')).toBe('ABCD1234');
  });

  it('returns empty string when both are empty', () => {
    expect(toMessSlug('', '')).toBe('');
  });
});

describe('toRoomSlug', () => {
  it('generates a seater slug', () => {
    expect(toRoomSlug('Double', 'DEF456ab')).toBe('double-seater-DEF4');
  });

  it('returns id when occupancy is empty', () => {
    expect(toRoomSlug('', 'ABCD1234')).toBe('ABCD1234');
  });
});

describe('idSuffixFromSlug', () => {
  it('extracts the last segment of a slug', () => {
    expect(idSuffixFromSlug('aryan-boys-mess-abc1')).toBe('abc1');
  });

  it('returns empty string for empty input', () => {
    expect(idSuffixFromSlug('')).toBe('');
  });
});

describe('isSlug', () => {
  it('returns true for a slug (contains hyphens)', () => {
    expect(isSlug('aryan-boys-mess-abc1')).toBe(true);
  });

  it('returns false for a raw Firestore ID (no hyphens)', () => {
    expect(isSlug('ABC123xyzABC123xyzAB')).toBe(false);
  });
});
