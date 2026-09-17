# 13 — Testing

## 13.1 Testing Philosophy

Testing ensures that:
1. Schema validation catches invalid states before they corrupt projects
2. Generated code actually compiles and runs
3. Canvas interactions work correctly across browsers
4. Agent handoff produces actionable tasks
5. Performance doesn't regress

## 13.2 Test Categories

### Unit Tests (Vitest)
- **Schema validation** — Every schema change validates correctly
- **Migration functions** — Old schema versions migrate to new
- **Utility functions** — ID generation, path resolution, token resolution
- **Store actions** — Zustand actions produce correct state
- **Pure functions** — Token substitution, variable replacement

### Component Tests (Testing Library + Vitest)
- **Canvas rendering** — Components render correctly
- **Drag and drop** — dnd-kit interactions work
- **Panel interactions** — Props panel updates schema
- **Selection** — Click, multi-select, keyboard selection
- **Undo/redo** — Yjs snapshots restore correctly

### Integration Tests (Playwright E2E)
- **Project lifecycle** — Create, edit, save, reload, export
- **Code generation** — Schema → generated code → compiles
- **AI interaction** — Prompt → schema modification → canvas updates
- **Git integration** — Init, commit, push to GitHub
- **Import/export** — Template import, project export

### Visual Regression (Playwright + Argos)
- **Component snapshots** — Every component in every state
- **Canvas states** — Selection, hover, drag, zoom
- **Generated code output** — Before/after for templates

## 13.3 Test Infrastructure

```typescript
// Example: Schema validation test
describe('ComponentSchema', () => {
  it('validates a minimal Button component', () => {
    const component = {
      id: 'comp_test001',
      type: 'Button',
      name: 'Submit',
      props: { variant: 'primary' },
      children: [],
      styles: {},
      interactions: {}
    };
    expect(validateComponent(component).valid).toBe(true);
  });
  
  it('rejects component with invalid $ref', () => {
    const component = {
      id: 'comp_test002',
      type: 'Button',
      styles: { color: { '$ref': 'designTokens.colors.nonexistent' } }
    };
    expect(validateComponent(component).valid).toBe(false);
  });
});
```

## 13.4 Generated Code Testing

The code generator must produce code that passes:

1. **TypeScript strict** — No `any`, no implicit any
2. **ESLint** — Zero errors, zero warnings
3. **Prettier** — Formatted correctly
4. **Build** — `vite build` succeeds
5. **Smoke test** — Generated app renders without runtime errors
6. **Accessibility** — axe-core finds no critical violations

```bash
# Generated project CI (runs after generation)
cd generated-project/
npm ci
npx tsc --noEmit
npx eslint . --max-warnings 0
npx vite build
npx playwright test smoke-test
npx axe-core --exit
```

## 13.5 Canvas Testing Challenges

Canvas testing is hard because:
- Pixel output depends on OS, GPU, font rendering
- Drag/drop involves complex timing
- 60fps requirement needs performance testing

**Strategy:**
1. Test behavior (state after drag), not pixels
2. Use `data-testid` attributes, not CSS selectors
3. Mock canvas APIs where possible
4. Use `requestAnimationFrame` helpers for timing
5. Performance tests: measure FPS, memory, long tasks

## 13.6 Performance Budget Tests

```typescript
// Fail test if canvas drops below 55fps with 500 components
test('canvas maintains 55fps with 500 components', async () => {
  await renderCanvasWithComponents(500);
  const fps = await measureFps(async () => {
    await dragComponent('comp_001', { x: 100, y: 100 });
  });
  expect(fps).toBeGreaterThan(55);
});
```

## 13.7 Agent Handoff Testing

```typescript
test('generated AGENTS.md contains required sections', async () => {
  const agent = await generateAgentProject(schema);
  const agentsMd = await readFile(agent.path + '/AGENTS.md');
  
  expect(agentsMd).toContain('# Project:');
  expect(agentsMd).toContain('## Architecture');
  expect(agentsMd).toContain('## Tasks');
  expect(agentsMd).toContain('## Files to Not Modify');
});
```

## 13.8 Test Data

- **Fixtures** — Sample projects: minimal (1 page, 1 component), medium (5 pages, 50 components), complex (20 pages, 500+ components)
- **Schemas** — Invalid schemas for negative testing
- **Mocks** — AI provider responses, Git operations, filesystem

## 13.9 CI/CD Pipeline

```yaml
# GitHub Actions (runs on every PR)
jobs:
  test:
    - npm run test:unit
    - npm run test:components
    - npm run test:integration
    - npm run test:generated-code
    - npm run build
    - npm run test:smoke
```
