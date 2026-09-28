import { test, expect } from '@playwright/test';

/**
 * Critical-path E2E: onboarding → project → library add → layers →
 * generated-code preview. Real client + API, isolated ports/database.
 */

async function register(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Need an account? Register' }).click()
  await page.getByLabel('Email').fill(`e2e-${Date.now()}-${Math.random()}@example.com`)
  await page.getByLabel('Password').fill('correct horse battery staple')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('button', { name: 'Create new project' })).toBeVisible()
}

test('project lifecycle: create, add component, preview code', async ({ page }) => {
  await register(page)

  await page.getByRole('button', { name: 'Create new project' }).click();
  await expect(page.getByRole('heading', { name: 'Pages' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Component Library' })).toBeVisible();

  // Add a Button from the library (click-to-add path).
  await page.getByTestId('library-card-Button').click();

  // It appears in the Layers panel.
  await page.getByRole('button', { name: 'Layers' }).click();
  await expect(page.locator('[data-testid^="layer-item-"]')).toHaveCount(1);

  // Generated-code modal lists the emitted tree.
  await page.getByRole('button', { name: 'Code', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Generated code' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'src/App.tsx' })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
});

test('template gallery: start from Blank', async ({ page }) => {
  await register(page)
  await page.getByRole('button', { name: 'Start from a template' }).click();
  await expect(page.getByText('Start from a template')).toBeVisible();

  await page.getByRole('button', { name: /Blank/ }).click();
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByRole('heading', { name: 'Pages' })).toBeVisible();
});
