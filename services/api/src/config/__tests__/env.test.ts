import { describe, expect, it } from 'vitest';

import { formatIssues, loadApiConfig } from '.././env';

const minimal = { DATABASE_URL: 'postgres://user:pass@127.0.0.1:5432/newzcrime' };

describe('loadApiConfig', () => {
  it('applies defaults for everything optional', () => {
    const config = loadApiConfig(minimal);

    expect(config.nodeEnv).toBe('development');
    expect(config.port).toBe(4000);
    expect(config.redisUrl).toBe('redis://127.0.0.1:6379');
    expect(config.logLevel).toBe('info');
    expect(config.rateLimitMax).toBe(300);
    expect(config.rateLimitWindowMs).toBe(60_000);
    expect(config.corsOrigins).toEqual([]);
    expect(config.trustProxy).toBe(false);
  });

  it('trusts no proxy unless one is configured', () => {
    // Trusting a proxy that is not there lets a caller spoof the client IP and
    // mint a fresh rate-limit bucket with each request.
    expect(loadApiConfig(minimal).trustProxy).toBe(false);
  });

  it('accepts an explicit true', () => {
    expect(loadApiConfig({ ...minimal, TRUST_PROXY: 'true' }).trustProxy).toBe(true);
  });

  it('accepts a hop count as a number, not a string', () => {
    expect(loadApiConfig({ ...minimal, TRUST_PROXY: '2' }).trustProxy).toBe(2);
  });

  it('rejects a trust-proxy value it cannot interpret', () => {
    expect(() => loadApiConfig({ ...minimal, TRUST_PROXY: 'yes' })).toThrowError(
      /TRUST_PROXY/
    );
  });

  it('coerces numeric strings, because the environment only holds strings', () => {
    const config = loadApiConfig({
      ...minimal,
      API_PORT: '8080',
      API_RATE_LIMIT_MAX: '50',
      API_RATE_LIMIT_WINDOW_MS: '30000',
    });

    expect(config.port).toBe(8080);
    expect(config.rateLimitMax).toBe(50);
    expect(config.rateLimitWindowMs).toBe(30_000);
  });

  it('treats an empty CORS list as an empty list, not one empty origin', () => {
    expect(loadApiConfig({ ...minimal, CORS_ORIGINS: '' }).corsOrigins).toEqual([]);
  });

  it('splits, trims and drops blank CORS entries', () => {
    const config = loadApiConfig({
      ...minimal,
      CORS_ORIGINS: ' http://a.test , http://b.test ,, ',
    });

    expect(config.corsOrigins).toEqual(['http://a.test', 'http://b.test']);
  });

  it('accepts each supported log level', () => {
    for (const level of ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const) {
      expect(loadApiConfig({ ...minimal, LOG_LEVEL: level }).logLevel).toBe(level);
    }
  });

  it('fails when the database URL is missing, and says which variable', () => {
    expect(() => loadApiConfig({})).toThrowError(/DATABASE_URL/);
  });

  it('fails when the database URL is blank rather than deferring to the first query', () => {
    expect(() => loadApiConfig({ DATABASE_URL: '' })).toThrowError(/DATABASE_URL/);
  });

  it('fails on a log level pino does not support', () => {
    expect(() => loadApiConfig({ ...minimal, LOG_LEVEL: 'verbose' })).toThrowError(
      /LOG_LEVEL/
    );
  });

  it('fails on a negative rate limit rather than silently disabling it', () => {
    expect(() =>
      loadApiConfig({ ...minimal, API_RATE_LIMIT_MAX: '-5' })
    ).toThrowError(/API_RATE_LIMIT_MAX/);
  });

  it('fails on a zero port', () => {
    expect(() => loadApiConfig({ ...minimal, API_PORT: '0' })).toThrowError(
      /API_PORT/
    );
  });

  it('points the reader at .env.example', () => {
    expect(() => loadApiConfig({})).toThrowError(/\.env\.example/);
  });

  it('does not leak a resolved value into the message', () => {
    // A connection string often carries a password.
    expect(() =>
      loadApiConfig({ DATABASE_URL: 'postgres://u:secret@h/db', API_PORT: 'x' })
    ).not.toThrowError(/secret/);
  });
});

describe('formatIssues', () => {
  it('names the offending variable and indents the reason', () => {
    const message = formatIssues({
      issues: [{ path: ['API_PORT'], message: 'is required' }],
    } as never);

    expect(message).toBe('  - API_PORT is required');
  });

  it('labels a root-level issue rather than printing an empty name', () => {
    const message = formatIssues({
      issues: [{ path: [], message: 'bad' }],
    } as never);

    expect(message).toBe('  - (root) bad');
  });
});
