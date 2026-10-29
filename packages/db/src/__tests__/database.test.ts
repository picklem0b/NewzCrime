/** Connection-string handling: TLS is inferred, never guessed per request. */

import { describe, expect, it } from 'vitest';

import { connectionNeedsTls } from '../database';

describe('connectionNeedsTls', () => {
	it('uses TLS for a Supabase pooler host', () => {
		expect(
			connectionNeedsTls(
				'postgres://postgres.project:secret@aws-0-eu-central-1.pooler.supabase.com:6543/postgres'
			)
		).toBe(true);
	});

	it('uses TLS for a direct Supabase host', () => {
		expect(
			connectionNeedsTls(
				'postgres://postgres:secret@db.project.supabase.co:5432/postgres'
			)
		).toBe(true);
	});

	it('stays plaintext for local Postgres', () => {
		expect(
			connectionNeedsTls(
				'postgres://newzcrime:newzcrime@127.0.0.1:5432/newzcrime'
			)
		).toBe(false);
		expect(
			connectionNeedsTls(
				'postgres://newzcrime:newzcrime@localhost:5432/newzcrime'
			)
		).toBe(false);
		expect(
			connectionNeedsTls(
				'postgres://newzcrime:newzcrime@192.168.1.20:5432/newzcrime'
			)
		).toBe(false);
	});

	it('lets sslmode override the host', () => {
		expect(
			connectionNeedsTls(
				'postgres://newzcrime:newzcrime@127.0.0.1:5432/newzcrime?sslmode=require'
			)
		).toBe(true);
		expect(
			connectionNeedsTls(
				'postgres://postgres:secret@db.project.supabase.co:5432/postgres?sslmode=disable'
			)
		).toBe(false);
	});

	it('does not throw on an unparsable URL', () => {
		expect(connectionNeedsTls('not a connection string')).toBe(false);
	});
});
