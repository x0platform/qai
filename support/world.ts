import type { Page, BrowserContext, Cookie } from '@playwright/test';
import { testContext } from '@qai/core';

/**
 * Cucumber World - Shared context for all step definitions.
 *
 * Holds Playwright browser, page, API request context, and base URL.
 * Integrates with TestContext singleton for cross-scenario cookie sharing.
 */
export class CustomWorld {
  page?: Page;
  apiRequest?: {
    get: (url: string, options?: any) => Promise<any>;
    post: (url: string, options?: any) => Promise<any>;
  };
  browserContext?: BrowserContext;
  baseURL: string;

  constructor() {
    this.baseURL = process.env.BASE_URL || 'http://localhost:3000';
  }

  /**
   * Set the Playwright page for the current scenario
   */
  setPage(page: Page): void {
    this.page = page;
  }

  /**
   * Set the Playwright API request
   */
  setRequest(apiRequest: {
    get: (url: string, options?: any) => Promise<any>;
    post: (url: string, options?: any) => Promise<any>;
  }): void {
    this.apiRequest = apiRequest;
  }

  /**
   * Set the Playwright browser context
   */
  setBrowserContext(context: BrowserContext): void {
    this.browserContext = context;
  }

  /**
   * Attach data to Cucumber report (screenshots, logs, etc.)
   */
  attach(data: Buffer | string, mediaType: string): void {
    // Cucumber injects attach at runtime; this is a type-safe stub
    void data;
    void mediaType;
  }

  /**
   * Get cookies from the shared TestContext for a domain key
   */
  getSharedCookies(key: string): Cookie[] | undefined {
    return testContext.getCookies(key);
  }

  /**
   * Store cookies in the shared TestContext for a domain key
   */
  setSharedCookies(key: string, cookies: Cookie[]): void {
    testContext.setCookies(key, cookies);
  }

  /**
   * Get shared auth token
   */
  getSharedAuthToken(key: string): string | undefined {
    return testContext.getAuthToken(key);
  }

  /**
   * Store shared auth token
   */
  setSharedAuthToken(key: string, token: string): void {
    testContext.setAuthToken(key, token);
  }
}
