import { BeforeAll, AfterAll, Before, After, setWorldConstructor, Status } from '@cucumber/cucumber';
import type { ITestCaseHookParameter } from '@cucumber/cucumber';
import { chromium } from 'playwright';
import { startServer, stopServer } from '@qai/test-app';
import { CustomWorld } from './world';
import { testContext, config } from '@qai/core';

// Register custom World constructor with Cucumber
setWorldConstructor(CustomWorld);

let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;

/**
 * BeforeAll - Start the in-repo test application server once before all scenarios.
 */
BeforeAll(async function () {
  await startServer(Number(config.port));
  console.log(`Test app server started on port ${config.port}`);
});

/**
 * AfterAll - Stop the test application server after all scenarios complete.
 */
AfterAll(async function () {
  await stopServer();
  if (browser) {
    await browser.close();
    browser = null;
  }
  console.log('Test app server stopped');
});

/**
 * Before - Launch browser, create context and page, set up world for each scenario.
 */
Before(async function (this: CustomWorld) {
  // Launch browser if not already running (single browser instance shared across scenarios)
  if (!browser) {
    browser = await chromium.launch({
      headless: config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  // Create browser context (isolated per scenario for cookie isolation)
  const context = await browser.newContext();

  // Create page
  const page = await context.newPage();
  page.setDefaultTimeout(config.timeout);

  // Create API request from page (shares cookies with page context)
  const apiRequest = page.request;

  // Set world properties
  this.setBrowserContext(context);
  this.setPage(page);
  this.setRequest(apiRequest);

  // Restore shared cookies from TestContext if available
  const sharedCookies = testContext.getCookies('default');
  if (sharedCookies && sharedCookies.length > 0) {
    await context.addCookies(sharedCookies);
  }

  console.log(`Scenario started: baseURL=${this.baseURL}`);
});

/**
 * After - Close browser context, capture screenshot on failure, store cookies for sharing.
 */
After(async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  // Store cookies in shared TestContext for cross-scenario access
  if (this.browserContext) {
    const cookies = await this.browserContext.cookies();
    if (cookies.length > 0) {
      testContext.setCookies('default', cookies);
    }
  }

  // Capture screenshot on failure
  if (this.page && !this.page.isClosed() && scenario.result?.status === Status.FAILED) {
    const screenshot = await this.page.screenshot({ fullPage: true });
    this.attach(screenshot, 'image/png');
  }

  // Close page and context
  if (this.page && !this.page.isClosed()) {
    await this.page.close();
  }
  if (this.browserContext) {
    await this.browserContext.close();
  }

  console.log('Scenario finished');
});

export { CustomWorld };
