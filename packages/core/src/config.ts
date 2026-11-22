/**
 * Configuration loader for QAI Automation Framework.
 * Reads environment variables with type-safe defaults.
 */

export interface AppConfig {
  baseURL: string;
  port: number;
  headless: boolean;
  browser: 'chromium' | 'firefox' | 'webkit';
  timeout: number;
  retries: number;
  maxFileSizeMB: number;
  pdfValidSizeMB: number;
  pdfInvalidSizeMB: number;
}

function getEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const val = process.env[key];
  return val ? parseInt(val, 10) : defaultValue;
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const val = process.env[key];
  if (val === undefined) return defaultValue;
  return val.toLowerCase() === 'true';
}

export function loadConfig(): AppConfig {
  const browser = (process.env.BROWSER as AppConfig['browser']) ?? 'chromium';
  const validBrowsers: AppConfig['browser'][] = ['chromium', 'firefox', 'webkit'];
  if (!validBrowsers.includes(browser)) {
    throw new Error(`Invalid BROWSER: ${browser}. Must be one of ${validBrowsers.join(', ')}`);
  }

  return {
    baseURL: getEnv('BASE_URL', 'http://localhost:3000'),
    port: getEnvNumber('PORT', 3000),
    headless: getEnvBoolean('HEADLESS', true),
    browser,
    timeout: getEnvNumber('TIMEOUT', 30000),
    retries: getEnvNumber('RETRIES', 0),
    maxFileSizeMB: getEnvNumber('MAX_FILE_SIZE_MB', 2),
    pdfValidSizeMB: getEnvNumber('PDF_VALID_SIZE_MB', 2),
    pdfInvalidSizeMB: getEnvNumber('PDF_INVALID_SIZE_MB', 2.1),
  };
}

export const config = loadConfig();
