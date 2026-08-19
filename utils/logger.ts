import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { env } from './env';
import { truncate } from './helpers';

export type LogSource = 'ui' | 'api' | 'test';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  time: string;
  scenario: string;
  source: LogSource;
  level: LogLevel;
  message: string;
  data?: unknown;
}

const SEVERITY: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const COLOR: Record<LogLevel, string> = { debug: '\x1b[90m', info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m' };
const RESET = '\x1b[0m';

/** Colour only when a human is watching. */
const useColour = (): boolean => process.stderr.isTTY === true && !process.env.NO_COLOR;

/** `12:04:31.882  WARN ui   navigated to /dashboard.html` */
function formatEntry(entry: LogEntry): string {
  const time = entry.time.slice(11, 23);
  const line = `${time} ${entry.level.toUpperCase().padEnd(5)} ${entry.source.padEnd(4)} ${entry.message}`;
  return entry.data === undefined ? line : `${line}\n${' '.repeat(24)}${truncate(JSON.stringify(entry.data))}`;
}

/**
 * Collects everything that happened during one scenario — steps, browser events
 * and API calls — so a failure can be read back without a rerun. Entries go to
 * reports/run.log (all sources), reports/api.log (API only) and are attached to
 * the scenario in the HTML report.
 */
export class ScenarioLogger {
  readonly entries: LogEntry[] = [];
  private scenario = 'unknown scenario';

  setScenario(name: string): void {
    this.scenario = name;
  }

  log(source: LogSource, level: LogLevel, message: string, data?: unknown): void {
    if (SEVERITY[level] < SEVERITY[env.logLevel]) return;

    const entry: LogEntry = { time: new Date().toISOString(), scenario: this.scenario, source, level, message, data };
    this.entries.push(entry);

    mkdirSync(env.reportsDir, { recursive: true });
    appendFileSync(join(env.reportsDir, 'run.log'), `${JSON.stringify(entry)}\n`);
    if (source === 'api') appendFileSync(join(env.reportsDir, 'api.log'), `${JSON.stringify(entry)}\n`);

    if (env.logToConsole) {
      const line = formatEntry(entry);
      // stderr, so the Cucumber formatter keeps stdout to itself.
      process.stderr.write(useColour() ? `${COLOR[entry.level]}${line}${RESET}\n` : `${line}\n`);
    }
  }

  ui(level: LogLevel, message: string, data?: unknown): void {
    this.log('ui', level, message, data);
  }

  api(level: LogLevel, message: string, data?: unknown): void {
    this.log('api', level, message, data);
  }

  test(level: LogLevel, message: string, data?: unknown): void {
    this.log('test', level, message, data);
  }

  /** The whole scenario log as text, for attaching to the report. */
  text(): string {
    return this.entries.map(formatEntry).join('\n');
  }
}
