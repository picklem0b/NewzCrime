/** Cache headers: a public read must stay revalidateable. */

import { describe, expect, it } from 'vitest';

import {
	NO_STORE,
	pageCache,
	publicCache,
	skipConditionalGet,
} from '../cacheControl';

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

describe('pageCache', () => {
	it('never stores an empty page', () => {
		expect(pageCache(300, true)).toBe(NO_STORE);
	});

	it('caches a non-empty page normally', () => {
		expect(pageCache(300, false)).toContain('max-age=300');
	});
});

describe('skipConditionalGet', () => {
	it('removes both validators', () => {
		const req = {
			headers: {
				'if-none-match': 'W/"abc"',
				'if-modified-since': 'Wed, 21 Oct 2026 07:28:00 GMT',
				accept: 'application/json',
			},
		};

		skipConditionalGet(req);

		expect(req.headers).not.toHaveProperty('if-none-match');
		expect(req.headers).not.toHaveProperty('if-modified-since');
		expect(req.headers.accept).toBe('application/json');
	});
});
