import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../../../support/world';
import { LoginPage, DashboardPage } from '../page-objects/login-page';

interface WebWorld extends CustomWorld {
  loginPage?: LoginPage;
  dashboardPage?: DashboardPage;
}

function getLoginPage(world: WebWorld): LoginPage {
  if (!world.loginPage) {
    if (!world.page) {
      throw new Error('Page not initialized. Ensure Before hook ran.');
    }
    world.loginPage = new LoginPage(world.page, world.baseURL);
  }
  return world.loginPage;
}

function getDashboardPage(world: WebWorld): DashboardPage {
  if (!world.dashboardPage) {
    if (!world.page) {
      throw new Error('Page not initialized. Ensure Before hook ran.');
    }
    world.dashboardPage = new DashboardPage(world.page, world.baseURL);
  }
  return world.dashboardPage;
}

// ============================================================================
// Login Steps
// ============================================================================

Given('I am on the login page', async function (this: WebWorld) {
  const loginPage = getLoginPage(this);
  await loginPage.goto();
  await loginPage.page.waitForLoadState('networkidle');
});

When('I enter valid credentials', async function (this: WebWorld) {
  const loginPage = getLoginPage(this);
  await loginPage.login('alice', 'password123');
});

When('I enter invalid credentials', async function (this: WebWorld) {
  const loginPage = getLoginPage(this);
  await loginPage.login('invalid', 'wrongpassword');
});

Then('I should be redirected to the dashboard', async function (this: WebWorld) {
  const loginPage = getLoginPage(this);
  await loginPage.waitForDashboard();
  const dashboardPage = getDashboardPage(this);
  await dashboardPage.waitForLoad();
  expect(await dashboardPage.isDashboardVisible()).toBe(true);
});

Then('the welcome text should be visible', async function (this: WebWorld) {
  const dashboardPage = getDashboardPage(this);
  const heading = await dashboardPage.getWelcomeHeading();
  expect(heading).toContain('Welcome');
});

Then('an error message should be visible', async function (this: WebWorld) {
  const loginPage = getLoginPage(this);
  const error = await loginPage.getErrorMessage();
  expect(error).not.toBeNull();
  expect(error).toContain('Invalid');
});

// ============================================================================
// Dashboard Steps
// ============================================================================

Then('the dashboard should display user info', async function (this: WebWorld) {
  const dashboardPage = getDashboardPage(this);
  expect(await dashboardPage.isDashboardVisible()).toBe(true);
});

Then('I should see my username on the dashboard', async function (this: WebWorld) {
  const dashboardPage = getDashboardPage(this);
  const heading = await dashboardPage.getWelcomeHeading();
  expect(heading).toContain('Welcome');
});
