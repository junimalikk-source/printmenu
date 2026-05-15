import { describe, it, expect } from 'vitest';
import { selectionsFromCell } from '../../script.js';

describe('selectionsFromCell', () => {
  it('extracts size and qty from a valid cell', () => {
    const el = document.createElement('div');
    el.dataset.size = 'A4';
    el.dataset.qty = '20K';
    expect(selectionsFromCell(el)).toEqual({ size: 'A4', qty: '20K' });
  });

  it('returns null when size or qty is missing', () => {
    const el = document.createElement('div');
    el.dataset.size = 'A4';
    expect(selectionsFromCell(el)).toBeNull();
  });

  it('returns null for non-elements', () => {
    expect(selectionsFromCell(null)).toBeNull();
    expect(selectionsFromCell(undefined)).toBeNull();
  });
});
