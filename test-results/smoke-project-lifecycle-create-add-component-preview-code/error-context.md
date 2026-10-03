# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> project lifecycle: create, add component, preview code
- Location: tests/e2e/smoke.spec.ts:17:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByTestId('library-card-Button')
    - locator resolved to <div draggable="true" data-testid="library-card-Button" title="Clickable button with variants and sizes" class="rounded-lg border bg-card text-card-foreground shadow-sm cursor-grab overflow-hidden p-2 transition-shadow hover:shadow-md active:cursor-grabbing">…</div>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - button "Back to projects" [ref=e5]: ‹
    - generic [ref=e6]: forge@omix
    - button "Untitled Project" [ref=e8]
    - generic [ref=e9]:
      - button "Undo" [disabled] [ref=e10]
      - button "Redo" [disabled] [ref=e11]
      - button "Toggle dark mode" [ref=e12]: Theme
      - generic [ref=e13]: v1.0.0
      - generic [ref=e14]: Saved
      - button "Save" [ref=e16]
      - button "Export" [ref=e17]
      - button "Template" [ref=e18]
      - button "Code" [ref=e19]
      - button "Deploy" [ref=e20]
      - button "Account" [ref=e21]
      - button "Plans" [ref=e22]
      - button "Domains" [ref=e23]
      - button "Git" [ref=e24]
      - button "AI" [ref=e25]
  - generic [ref=e26]:
    - complementary [ref=e27]:
      - generic [ref=e28]:
        - heading "Pages" [level=2] [ref=e29]
        - list [ref=e30]:
          - listitem [ref=e31]:
            - button "Home /" [pressed] [ref=e32]:
              - generic [ref=e33]: Home
              - generic [ref=e34]: /
        - generic [ref=e35]:
          - textbox "/about" [ref=e37]
          - button "Add page" [ref=e38]: +
      - generic [ref=e41]:
        - heading "Component Library" [level=2] [ref=e42]
        - textbox "Search components" [ref=e44]:
          - /placeholder: Search components…
        - region "Basic" [ref=e45]:
          - heading "Basic" [level=3] [ref=e46]
          - generic [ref=e47]:
            - generic "Clickable button with variants and sizes" [ref=e48]:
              - generic [ref=e49]:
                - button "Button" [ref=e51]
                - generic [ref=e52]: Button
            - generic "Single-line text input with label" [ref=e53]:
              - generic [ref=e54]:
                - textbox "Input" [ref=e57]
                - generic [ref=e58]: Input
            - generic "Content card with header and footer" [ref=e59]:
              - generic [ref=e60]:
                - generic [ref=e61]: Card
                - generic [ref=e64]: Card
        - region "Navigation" [ref=e65]:
          - heading "Navigation" [level=3] [ref=e66]
          - generic "Top navigation bar with logo and links" [ref=e68]:
            - generic [ref=e69]:
              - navigation [ref=e71]:
                - generic [ref=e72]: Logo
                - list
              - generic [ref=e74]: Navbar
        - region "Dashboard" [ref=e75]:
          - heading "Dashboard" [level=3] [ref=e76]
          - generic [ref=e77]:
            - generic "Line, bar, pie, doughnut, or area chart" [ref=e78]:
              - generic [ref=e79]:
                - paragraph [ref=e83]: "Chart: no data"
                - generic [ref=e84]: Chart
            - generic "Sortable, filterable data table" [ref=e85]:
              - generic [ref=e86]:
                - table [ref=e89]:
                  - rowgroup [ref=e90]:
                    - row [ref=e91]:
                      - columnheader "ID" [ref=e92]
                      - columnheader "Name" [ref=e93]
                  - rowgroup [ref=e94]:
                    - row [ref=e95]:
                      - cell "1" [ref=e96]
                      - cell "Item 1" [ref=e97]
                    - row [ref=e98]:
                      - cell "2" [ref=e99]
                      - cell "Item 2" [ref=e100]
                - generic [ref=e101]: Table
    - main "Canvas" [ref=e102]:
      - generic [ref=e103]:
        - generic [ref=e104]: Viewport
        - button "mobile" [ref=e105]
        - button "tablet" [ref=e106]
        - button "desktop" [pressed] [ref=e107]
        - generic [ref=e108]: 1200px
        - button "Fit" [ref=e109]
      - generic [ref=e114]:
        - generic [ref=e116]:
          - generic [ref=e117]:
            - button "Toggle left sidebar" [ref=e119]
            - button "Toggle right sidebar" [ref=e124]
          - heading "Home" [level=2] [ref=e129]
          - generic [ref=e132]:
            - generic [ref=e133]:
              - button "undo" [disabled] [ref=e134]
              - button "redo" [disabled] [ref=e139]
            - generic [ref=e144] [cursor=pointer]: Publish
        - generic [ref=e149]:
          - generic [ref=e150]:
            - heading "Components" [level=2] [ref=e154]
            - generic [ref=e159]:
              - generic [ref=e161]:
                - generic: Button
                - generic [ref=e162]: Button
              - generic [ref=e173]:
                - generic: Input
                - generic [ref=e174]: Input
              - generic [ref=e185]:
                - generic: Card
                - generic [ref=e186]: Card
              - generic [ref=e197]:
                - generic: Navbar
                - generic [ref=e198]: Navbar
              - generic [ref=e209]:
                - generic: Chart
                - generic [ref=e210]: Chart
              - generic [ref=e221]:
                - generic: Table
                - generic [ref=e222]: Table
          - generic [ref=e232]:
            - heading "Outline" [level=2] [ref=e236]
            - list [ref=e239]:
              - generic [ref=e240]: No items
        - generic [ref=e242]:
          - generic [ref=e244]:
            - button "Switch to desktop viewport" [disabled] [ref=e246]
            - button "Zoom viewport out" [ref=e252]
            - button "Zoom viewport in" [disabled] [ref=e257]
            - combobox [ref=e263]:
              - option
              - option [selected]
          - generic [ref=e264]:
            - iframe [ref=e265]
            - generic "loading" [ref=e267]
        - generic [ref=e269]:
          - heading "Page" [level=2] [ref=e273]
          - generic [ref=e278]:
            - generic [ref=e279]: title
            - textbox "title" [ref=e283]: Home
    - complementary [ref=e285]:
      - generic [ref=e286]:
        - button "properties" [pressed] [ref=e287]
        - button "layers" [ref=e288]
      - generic [ref=e290]:
        - generic [ref=e291]: ◈
        - paragraph [ref=e292]: No component selected
        - paragraph [ref=e293]: Select a component on the canvas to edit its properties.
  - button "Feedback" [ref=e294]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Critical-path E2E: onboarding → project → library add → layers →
  5  |  * generated-code preview. Real client + API, isolated ports/database.
  6  |  */
  7  | 
  8  | async function register(page: import('@playwright/test').Page) {
  9  |   await page.goto('/')
  10 |   await page.getByRole('button', { name: 'Need an account? Register' }).click()
  11 |   await page.getByLabel('Email').fill(`e2e-${Date.now()}-${Math.random()}@example.com`)
  12 |   await page.getByLabel('Password').fill('correct horse battery staple')
  13 |   await page.getByRole('button', { name: 'Create account' }).click()
  14 |   await expect(page.getByRole('button', { name: 'Create new project' })).toBeVisible()
  15 | }
  16 | 
  17 | test('project lifecycle: create, add component, preview code', async ({ page }) => {
  18 |   await register(page)
  19 | 
  20 |   await page.getByRole('button', { name: 'Create new project' }).click();
  21 |   await expect(page.getByRole('heading', { name: 'Pages' })).toBeVisible();
  22 |   await expect(page.getByRole('heading', { name: 'Component Library' })).toBeVisible();
  23 | 
  24 |   // Add a Button from the library (click-to-add path).
> 25 |   await page.getByTestId('library-card-Button').click();
     |                                                 ^ Error: locator.click: Test timeout of 30000ms exceeded.
  26 | 
  27 |   // It appears in the Layers panel.
  28 |   await page.getByRole('button', { name: 'Layers' }).click();
  29 |   await expect(page.locator('[data-testid^="layer-item-"]')).toHaveCount(1);
  30 | 
  31 |   // Generated-code modal lists the emitted tree.
  32 |   await page.getByRole('button', { name: 'Code', exact: true }).click();
  33 |   await expect(page.getByRole('dialog', { name: 'Generated code' })).toBeVisible();
  34 |   await expect(page.getByRole('button', { name: 'src/App.tsx' })).toBeVisible();
  35 |   await page.getByRole('button', { name: 'Close' }).click();
  36 | });
  37 | 
  38 | test('template gallery: start from Blank', async ({ page }) => {
  39 |   await register(page)
  40 |   await page.getByRole('button', { name: 'Start from a template' }).click();
  41 |   await expect(page.getByText('Start from a template')).toBeVisible();
  42 | 
  43 |   await page.getByRole('button', { name: /Blank/ }).click();
  44 |   await page.getByRole('button', { name: 'Create project' }).click();
  45 |   await expect(page.getByRole('heading', { name: 'Pages' })).toBeVisible();
  46 | });
  47 | 
```