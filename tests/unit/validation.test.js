import { describe, it, expect } from 'vitest';
import { isUKPhone } from '../../script.js';

describe('isUKPhone', () => {
  it('accepts common UK formats', () => {
    expect(isUKPhone('07572 574582')).toBe(true);
    expect(isUKPhone('07572574582')).toBe(true);
    expect(isUKPhone('+44 7572 574582')).toBe(true);
    expect(isUKPhone('01274 305555')).toBe(true);
    expect(isUKPhone('0044 1274 305555')).toBe(true);
  });
  it('rejects too short / non-numeric', () => {
    expect(isUKPhone('12345')).toBe(false);
    expect(isUKPhone('hello there')).toBe(false);
    expect(isUKPhone('')).toBe(false);
  });
});
