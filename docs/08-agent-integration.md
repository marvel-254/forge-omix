# 08 — Agent Integration

## 8.1 Supported Agents

The builder generates projects that any AI coding agent can implement. Primary targets:

| Agent | Compatibility | Notes |
|-------|--------------|-------|
| **Hermes Agent** | Full | OpenRouter-native, memory, skills |
| **OpenCode** | Full | Open source, Claude-powered |
| **Claude Code** | Full | Anthropic's CLI agent |
| **Codex (OpenAI)** | Full | Code-specialized |
| **Jules (Google)** | Partial | Async, may need format adaptation |
| **Generic agents** | Full | AGENTS.md standard format |

## 8.2 Handoff Protocol

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Builder  │ →   │  Spec    │ →   │  Agent   │ →   │  Code    │
│          │     │  Files   │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
  Generate        Write to         Implement       Commit
  project dir     .builder/         per tasks       & push
  + schema        AGENTS.md         Run tests       Report
  + tasks         README.md         Document        status
```

### Step 1: Export

```bash
# Builder generates project directory
forge export --project=my-app --target=hermes --output=./generated/

# Result:
generated/
├── src/
├── docs/
├── .builder/
│   ├── project.json
│   ├── schema.json
│   ├── pages.json
│   ├── components.json
│   ├── flows.json
│   ├── design-tokens.json
│   └── tasks.json
├── AGENTS.md
├── README.md
└── package.json
```

### Step 2: Agent Invocation

```bash
# For Hermes
hermes --workspace ./generated --prompt "Implement the project per AGENTS.md"

# For Claude Code
claude --cwd ./generated

# For OpenCode
opencode --project ./generated
```

### Step 3: Implementation Loop

```
Agent reads AGENTS.md
    ↓
Agent reads tasks.json (sorted by priority)
    ↓
For each task:
    ↓
    Read affected schema files
    ↓
    Implement components/pages
    ↓
    Run tests
    ↓
    Mark task done
    ↓
    Commit changes
    ↓
Final: Report status to Builder
```

### Step 4: Bidirectional Sync

```
Agent commits to Git
    ↓
Builder detects changes (Git webhook or manual import)
    ↓
Builder parses changed files
    ↓
Builder updates visual canvas to match code
    ↓
User reviews changes in visual editor
```

## 8.3 AGENTS.md Specification

The generated AGENTS.md is the primary instruction document for agents.

### Structure

```markdown
# Project: {{project.name}}

## Overview
- **Type:** {{project.type}}
- **Framework:** React + Vite
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Total Pages:** {{pages.count}}
- **Total Components:** {{components.count}}

## Architecture

### Directory Structure
[File tree with descriptions]

### Design System
- Primary color: {{designTokens.colors.primary}}
- Font: {{designTokens.typography.fontFamily}}
- Border radius: {{designTokens.radius.md}}

### Routes
| Path | Page | Components |
|------|------|------------|
| /    | Home | Hero, Features, Footer |

## Tasks (Implementation Order)

### TASK-001: Foundation Setup
**Priority:** critical
**Dependencies:** none
- [ ] Install dependencies
- [ ] Configure Tailwind with design tokens
- [ ] Set up routing

### TASK-002: Navigation Component
**Priority:** high
**Dependencies:** TASK-001
- [ ] Create Navbar with logo and links
- [ ] Implement mobile hamburger menu
- [ ] Add active state for current route

[More tasks...]

## Component Specifications

### Button
**Location:** src/components/ui/Button.tsx
**Props:** variant (primary|secondary|outline), size (sm|md|lg), disabled
**Accessibility:** role="button", keyboard accessible

[More components...]

## API Expectations

### GET /api/products
**Response:**
```json
{ "data": [{ "id": "...", "name": "...", "price": 0 }] }
```

## Testing Requirements
- Unit tests: vitest
- Run: `npm test`
- Coverage: > 80%

## Files to NEVER Modify
- `.builder/**` (builder metadata)
- `package.json` (use npm commands)
- `tailwind.config.ts` (generated from design tokens)

## Sync Rules
1. After implementing a component, update `.builder/tasks.json` with status
2. After all tasks done, run `npm run build` to verify
3. After build passes, commit with message: `feat: implement [TASK-ID]`
```

## 8.4 Task Generation

Tasks are generated from the schema with dependency analysis:

```typescript
function generateTasks(schema: ProjectSchema): Task[] {
  const tasks: Task[] = [];
  
  // 1. Foundation task (always first)
  tasks.push({
    id: 'TASK-001',
    title: 'Project foundation',
    description: 'Set up routing, design tokens, and base layout',
    priority: 'critical',
    dependencies: [],
    affectedScreens: [],
    affectedComponentTypes: ['Layout']
  });
  
  // 2. Component tasks (one per component type used)
  const componentTypes = [...new Set(schema.components.map(c => c.type))];
  componentTypes.forEach((type, i) => {
    tasks.push({
      id: `TASK-${String(i + 2).padStart(3, '0')}`,
      title: `Implement ${type} component`,
      description: generateComponentDescription(type, schema),
      priority: isForm(type) ? 'high' : 'medium',
      dependencies: ['TASK-001'],
      affectedComponents: [type]
    });
  });
  
  // 3. Page tasks (one per page, depends on its components)
  schema.pages.forEach((page, i) => {
    const pageTaskDeps = page.components
      .map(cid => {
        const comp = schema.components.find(c => c.id === cid);
        return comp ? `TASK-${componentTypes.indexOf(comp.type) + 2}` : null;
      })
      .filter(Boolean);
    
    tasks.push({
      id: `TASK-${String(componentTypes.length + i + 2).padStart(3, '0')}`,
      title: `Build ${page.title} page`,
      description: `Assemble page from: ${page.components.join(', ')}`,
      priority: page.path === '/' ? 'high' : 'medium',
      dependencies: pageTaskDeps,
      affectedScreens: [page.path],
      affectedComponents: page.components
    });
  });
  
  // 4. Integration tasks
  tasks.push({
    id: `TASK-${String(tasks.length + 1).padStart(3, '0')}`,
    title: 'Form validation and API integration',
    description: 'Wire up forms with Zod validation and API calls',
    priority: 'medium',
    dependencies: tasks.filter(t => t.title.includes('page')).map(t => t.id)
  });
  
  // 5. Final task
  tests: ['TASK-001'],
  tasks.push({
    id: `TASK-${String(tasks.length + 1).padStart(3, '0')}`,
    title: 'Testing and quality assurance',
    description: 'Run tests, lint, typecheck, and build',
    priority: 'low',
    dependencies: tasks.filter(t => t.id !== `TASK-${tasks.length}`).map(t => t.id)
  });
  
  return tasks;
}
```

## 8.5 Token Estimation

Each task estimates token usage for context window planning:

```json
{
  "id": "TASK-005",
  "title": "Implement authentication pages",
  "estimatedTokens": 8000,
  "context": {
    "schemaRefs": ["page_login", "page_register", "flow_auth"],
    "componentTypes": ["Input", "Button", "Form", "Card"],
    "apiEndpoints": ["/api/auth/login", "/api/auth/register"]
  }
}
```

**Budget management:**
- Default context budget: 32,000 tokens per agent session
- Split tasks across sessions if needed
- Priority ordering ensures critical work done first

## 8.6 Agent Output Validation

After agent reports completion:

1. **Parse agent output** for task completion markers
2. **Verify files exist** that should have been created
3. **Run quality gates** (TypeScript, ESLint, Prettier, Build)
4. **Run tests** and check coverage
5. **Update task status** in `.builder/tasks.json`

If validation fails:
- Report specific errors to agent
- Agent re-attempts with error feedback
- Max 3 retries, then escalate to human

## 8.7 Security: Agent Sandboxing

### Filesystem Access
```
Agent workspace: ./generated/    # Read/Write
Agent can read:  ./generated/docs/
Agent can write: ./generated/src/
Agent CANNOT:    access parent directories
                 access .env files
                 execute system commands (unless permitted)
```

### Network Access
- Agent CAN: install npm packages (from package.json)
- Agent CANNOT: make arbitrary network requests
- Agent CANNOT: access user's Git credentials

### Execution
- Agent runs in separate process or container
- Timeout: 30 minutes per task
- Memory limit: 512MB per agent instance

## 8.8 Multi-Agent Coordination (Deferred)

Future: Multiple agents working on different tasks simultaneously:

```
Agent A: Foundation tasks
Agent B: Component library
Agent C: Page assembly
Agent D: Tests and quality
```

Requires: Task locking, conflict detection, merge coordination.

**Deferred because:** Single-agent is sufficient for V1 projects (< 50 components).
