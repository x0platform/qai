import type { Cookie } from '@playwright/test';

/**
 * TestContext - Singleton shared across Cucumber scenarios.
 *
 * Enables passing cookies and auth state between scenarios,
 * showcasing how user session context persists in BDD execution.
 */
export class TestContext {
  private static instance: TestContext;

  private cookies: Map<string, Cookie[]> = new Map();
  private authTokens: Map<string, string> = new Map();
  private scenarioData: Map<string, unknown> = new Map();

  private constructor() {}

  static getInstance(): TestContext {
    if (!TestContext.instance) {
      TestContext.instance = new TestContext();
    }
    return TestContext.instance;
  }

  /**
   * Store cookies for a given domain/key
   */
  setCookies(key: string, cookies: Cookie[]): void {
    this.cookies.set(key, cookies);
  }

  /**
   * Retrieve cookies for a given domain/key
   */
  getCookies(key: string): Cookie[] | undefined {
    return this.cookies.get(key);
  }

  /**
   * Store an auth token
   */
  setAuthToken(key: string, token: string): void {
    this.authTokens.set(key, token);
  }

  /**
   * Retrieve an auth token
   */
  getAuthToken(key: string): string | undefined {
    return this.authTokens.get(key);
  }

  /**
   * Store arbitrary scenario data
   */
  setScenarioData(key: string, value: unknown): void {
    this.scenarioData.set(key, value);
  }

  /**
   * Retrieve arbitrary scenario data
   */
  getScenarioData(key: string): unknown {
    return this.scenarioData.get(key);
  }

  /**
   * Clear all context (use between test suites if needed)
   */
  clear(): void {
    this.cookies.clear();
    this.authTokens.clear();
    this.scenarioData.clear();
  }

  /**
   * Clear cookies for a specific key
   */
  clearCookies(key: string): void {
    this.cookies.delete(key);
  }
}

export const testContext = TestContext.getInstance();
