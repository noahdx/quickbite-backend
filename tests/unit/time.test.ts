import { describe, expect, it } from 'vitest';
import { toMs } from '../../src/pkg/utils/time';

describe('toMs', () => {
  it('converts seconds to milliseconds', () => {
    expect(toMs(2, 's')).toBe(2000);
  });

  it('converts minutes to milliseconds', () => {
    expect(toMs(3, 'm')).toBe(3 * 60 * 1000);
  });

  it('converts hours to milliseconds', () => {
    expect(toMs(2, 'h')).toBe(2 * 60 * 60 * 1000);
  });

  it('converts days to milliseconds', () => {
    expect(toMs(1, 'd')).toBe(24 * 60 * 60 * 1000);
  });

  it('returns zero for zero', () => {
    expect(toMs(0, 's')).toBe(0);
  });
});
