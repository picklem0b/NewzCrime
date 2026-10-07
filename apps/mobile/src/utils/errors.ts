export type ErrorKind = 'offline' | 'timeout' | 'server';

export interface DescribedError {
	kind: ErrorKind;
	title: string;
	detail: string;
}

const OFFLINE_PATTERN =
	/network request failed|failed to fetch|network error|internet|offline/i;
const TIMEOUT_PATTERN = /timed out|timeout|408/i;

export function describeError(message: string): DescribedError {
	if (OFFLINE_PATTERN.test(message)) {
		return {
			kind: 'offline',
			title: 'You appear to be offline',
			detail: 'NewzCrime could not reach the network. Check your connection and try again. Saved stories are still available in your Library.'
		};
	}

	if (TIMEOUT_PATTERN.test(message)) {
		return {
			kind: 'timeout',
			title: 'This is taking too long',
			detail: 'The server did not answer in time. Try again in a moment.'
		};
	}

	return {
		kind: 'server',
		title: 'Something went wrong',
		detail: message.length > 0 ? message : 'Please try again.'
	};
}
