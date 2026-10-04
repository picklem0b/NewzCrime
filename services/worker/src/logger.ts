/** Structured JSON logging. Every log line carries the process name. */

import { pino } from 'pino';
import type { Logger } from 'pino';

import type { LogLevel } from './types';

export function createLogger(name: string, level: LogLevel): Logger {
  return pino({ level, base: { service: name } });
}
