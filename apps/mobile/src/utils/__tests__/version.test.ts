/** Version comparison, which decides whether the app nags about an update. */

import { describe, expect, it } from 'vitest';

import { compareVersions } from '.././version';

describe('compareVersions', () => {
  it('reports equal versions as 0', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
  });

  it('compares numerically, not as strings', () => {
    // "0.10.0" > "0.9.0", which a string compare would get wrong.
    expect(compareVersions('0.10.0', '0.9.0')).toBeGreaterThan(0);
    expect(compareVersions('1.2.0', '1.10.0')).toBeLessThan(0);
  });

  it('treats a missing part as zero', () => {
    expect(compareVersions('1.2', '1.2.0')).toBe(0);
    expect(compareVersions('1.2.1', '1.2')).toBeGreaterThan(0);
  });

  it('ignores a pre-release suffix', () => {
    expect(compareVersions('1.0.0-beta', '1.0.0')).toBe(0);
    expect(compareVersions('1.0.0', '0.9.9-rc.1')).toBeGreaterThan(0);
  });

  it('treats an unparseable part as zero rather than NaN', () => {
    expect(compareVersions('1.x.0', '1.0.0')).toBe(0);
  });

  it('orders the sample release line', () => {
    expect(compareVersions('0.2.0', '0.1.9')).toBeGreaterThan(0);
    expect(compareVersions('0.1.9', '0.2.0')).toBeLessThan(0);
  });
});
