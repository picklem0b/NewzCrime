import { describe, expect, it } from 'vitest';

import { describeError } from '.././errors';

describe('describeError', () => {
	it('recognises a failed network request as offline', () => {
		expect(describeError('Network request failed').kind).toBe('offline');
	});

	it('recognises a timeout', () => {
		expect(describeError('Request timed out after 15000ms').kind).toBe(
			'timeout'
		);
	});

	it('passes any other message through as the detail', () => {
		const described = describeError('Request failed with status 500');

		expect(described.kind).toBe('server');
		expect(described.detail).toBe('Request failed with status 500');
	});

	it('never returns an empty detail', () => {
		expect(describeError('').detail.length).toBeGreaterThan(0);
	});
});
