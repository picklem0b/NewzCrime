/** Cache headers: a public read must stay revalidateable. */

import { describe, expect, it } from 'vitest';

import { NO_STORE, publicCache } from '../cacheControl';

describe('publicCache', () => {
	it('sets a public max-age in seconds', () => {
		expect(publicCache(300)).toContain('public');
		expect(publicCache(300)).toContain('max-age=300');
	});

	it('adds stale-while-revalidate so a cold instance still answers instantly', () => {
		expect(publicCache(120)).toContain('stale-while-revalidate=480');
	});

	it('never lets the revalidate window be shorter than max-age', () => {
		expect(publicCache(600)).toContain('stale-while-revalidate=2400');
	});
});

describe('NO_STORE', () => {
	it('forbids caching', () => {
		expect(NO_STORE).toContain('no-store');
		expect(NO_STORE).toContain('max-age=0');
	});
});
