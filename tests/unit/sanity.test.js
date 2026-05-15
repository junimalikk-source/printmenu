import { describe, it, expect } from 'vitest';

describe('tooling', () => {
  it('runs vitest in jsdom', () => {
    const el = document.createElement('div');
    el.textContent = 'hello';
    expect(el.textContent).toBe('hello');
  });
});
