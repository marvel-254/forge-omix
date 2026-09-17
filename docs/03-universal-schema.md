# 03 — Universal Schema

## 3.1 Design Philosophy

The universal project schema is the single source of truth for Omix Builder. It is:

1. **JSON-based** — Universally parseable, no binary formats
2. **Versioned** — Every change tracks version, supports migration
3. **Validated** — JSON Schema (draft-2020-12) for structural validation
4. **Referential** — $ref pointers for reusable definitions
5. **Serializable** — Full project exports to a single .json file
6. **Agent-readable** — Every field has description metadata
7. **Minimal** — No redundant data, normalized structure

## 3.2 Schema Composition

```
forge-project.json
├── $schema (URI reference to project.schema.json)
├── version (schema version string)
├── id (UUIDv7)
├── name (string)
├── description (string)
├── framework (react | nextjs | vite | pwa)
├── pages[] → page.schema.json
│   ├── id
│   ├── path (route path)
│   ├── title
│   ├── layout (reference to layout)
│   ├── components[] → component.schema.json
│   └── meta (SEO, open graph)
├── components[] → component.schema.json (shared/reusable)
├── design-tokens → design-tokens.schema.json
├── flows[] → flow.schema.json
├── tasks[] → task.schema.json
├── settings
│   ├── buildTarget
│   ├── outputDirectory
│   ├── routerMode (file | config)
│   └── cssStrategy (tailwind | css-modules | styled)
└── builder
    ├── version (builder version)
    ├── createdAt
    ├── updatedAt
    └── migrationsApplied[]
```

## 3.3 Page Schema

```json
{
  "$schema": "https://forge-omix.dev/schemas/page.schema.json",
  "id": "page_01H...",
  "path": "/dashboard",
  "title": "Dashboard",
  "description": "Main application dashboard with KPI cards and charts",
  "layout": { "$ref": "layouts/dashboard" },
  "components": ["comp_01H...", "comp_02H..."],
  "meta": {
    "title": "Dashboard | My App",
    "description": "View your key metrics and activity",
    "canonical": "/dashboard"
  },
  "responsive": {
    "desktop": { "visible": true },
    "tablet": { "visible": true },
    "mobile": { "visible": false, "redirectTo": "/mobile-dashboard" }
  }
}
```

## 3.4 Component Schema

```json
{
  "$schema": "https://forge-omix.dev/schemas/component.schema.json",
  "id": "comp_01H...",
  "type": "Button",
  "name": "Submit Button",
  "props": {
    "variant": "primary",
    "size": "md",
    "label": "Save Changes",
    "disabled": false,
    "loading": false
  },
  "children": [],
  "styles": {
    "base": {
      "width": { "$ref": "designTokens.spacing.auto" },
      "height": { "$ref": "designTokens.spacing.11" }
    },
    "hover": {},
    "focus": { "outline": { "$ref": "designTokens.colors.ring" } }
  },
  "interactions": {
    "onClick": {
      "action": "submitForm",
      "target": "form_01H...",
      "payload": {}
    }
  },
  "responsive": {
    "mobile": { "props": { "size": "lg" } }
  },
  "accessibility": {
    "role": "button",
    "label": "Save Changes",
    "keyboardShortcut": "ctrl+s"
  }
}
```

## 3.5 Design Tokens Schema

```json
{
  "version": "1.0.0",
  "colors": {
    "primary": {
      "50": "#eff6ff",
      "500": "#3b82f6",
      "600": "#2563eb",
      "700": "#1d4ed8",
      "900": "#1e3a8a"
    },
    "neutral": { "...": "..." },
    "semantic": {
      "success": "#22c55e",
      "warning": "#f59e0b",
      "error": "#ef4444",
      "info": "#3b82f6"
    }
  },
  "typography": {
    "fontFamily": {
      "sans": "Inter, system-ui, sans-serif",
      "mono": "JetBrains Mono, monospace"
    },
    "fontSize": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem"
    },
    "lineHeight": { "...": "..." },
    "fontWeight": { "...": "..." }
  },
  "spacing": {
    "0": "0",
    "1": "0.25rem",
    "2": "0.5rem",
    "4": "1rem",
    "8": "2rem",
    "auto": "auto"
  },
  "radius": {
    "sm": "0.25rem",
    "md": "0.5rem",
    "lg": "1rem",
    "full": "9999px"
  },
  "shadows": {
    "sm": "0 1px 2px rgba(0,0,0,0.05)",
    "md": "0 4px 6px rgba(0,0,0,0.1)",
    "lg": "0 10px 15px rgba(0,0,0,0.1)"
  },
  "breakpoints": {
    "sm": "640px",
    "md": "768px",
    "lg": "1024px",
    "xl": "1280px"
  },
  "motion": {
    "duration": {
      "fast": "150ms",
      "normal": "250ms",
      "slow": "400ms"
    },
    "easing": {
      "default": "cubic-bezier(0.4, 0, 0.2, 1)"
    }
  }
}
```

## 3.6 Flow Schema

```json
{
  "id": "flow_01H...",
  "name": "User Authentication Flow",
  "trigger": "user_clicks_login",
  "steps": [
    {
      "id": "step_01",
      "type": "screen",
      "target": "/login",
      "action": "navigate"
    },
    {
      "id": "step_02",
      "type": "form",
      "target": "loginForm",
      "action": "fill",
      "fields": ["email", "password"]
    },
    {
      "id": "step_03",
      "type": "action",
      "action": "submitForm",
      "target": "loginForm"
    },
    {
      "id": "step_04",
      "type": "condition",
      "condition": "auth.success",
      "ifTrue": ["step_05"],
      "ifFalse": ["step_06"]
    },
    {
      "id": "step_05",
      "type": "screen",
      "target": "/dashboard",
      "action": "navigate"
    },
    {
      "id": "step_06",
      "type": "feedback",
      "type_variant": "error",
      "message": "Invalid credentials"
    }
  ]
}
```

## 3.7 Task Schema

```json
{
  "id": "TASK-001",
  "title": "Implement authentication layout",
  "description": "Create login and register pages with form validation",
  "type": "component",
  "status": "pending",
  "priority": "high",
  "dependencies": ["LAYOUT-001"],
  "affectedScreens": ["/login", "/register"],
  "affectedComponents": ["Input", "Button", "Form", "Card"],
  "acceptanceCriteria": [
    "Login page renders email/password inputs",
    "Form validation shows inline errors",
    "Submit button loading state works",
    "ARIA labels present on all inputs"
  ],
  "estimatedTokens": 4096,
  "context": {
    "schemaRefs": ["page_01H...", "comp_02H..."],
    "styleRefs": ["designTokens.colors.primary"]
  }
}
```

## 3.8 Template Schema

```json
{
  "id": "tmpl_01H...",
  "name": "SaaS Dashboard Starter",
  "version": "1.0.0",
  "author": "Omix Community",
  "license": "MIT",
  "category": "dashboard",
  "tags": ["saas", "analytics", "charts"],
  "preview": "preview.png",
  "variables": [
    { "name": "primaryColor", "type": "color", "default": "#3b82f6" },
    { "name": "appName", "type": "string", "default": "My App" },
    { "name": "features", "type": "array", "items": "string" }
  ],
  "dependencies": [
    { "name": "recharts", "version": "^2.0.0", "type": "prod" }
  ],
  "schema": {
    "pages": ["..."],
    "components": ["..."],
    "designTokens": { "..." }
  },
  "importMetadata": {
    "source": "https://github.com/user/template-repo",
    "importedAt": "2026-09-16T12:00:00Z",
    "modifications": []
  }
}
```

## 3.9 Versioning Strategy

### Schema Version Format
- Semantic versioning: `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes requiring migration
- MINOR: Additive changes (new optional fields)
- PATCH: Documentation, bug fixes

### Version History
| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | TBD | Initial release |

### Migration Rules
1. Every schema includes a `version` field
2. On load, if version < current, run migration chain
3. Migrations are pure functions: (oldSchema) => newSchema
4. Migrations are idempotent
5. After migration, save with new version

### Migration Example
```typescript
const migrations = {
  "1.0.0": (schema: any) => schema, // identity
  "1.1.0": (schema: any) => ({
    ...schema,
    pages: schema.pages.map((p: any) => ({
      ...p,
      responsive: p.responsive || { desktop: { visible: true } }
    }))
  })
};
```

## 3.10 Validation Strategy

### Validation Layers
1. **Structural** — JSON Schema validation (shape, types, required)
2. **Referential** — All $ref pointers resolve to valid targets
3. **Semantic** — Business logic (unique IDs, valid routes, no cycles)
4. **Performance** — Schema size limits, component count limits

### Limits
| Resource | Soft Limit | Hard Limit |
|----------|-----------|------------|
| Pages per project | 50 | 200 |
| Components per page | 100 | 500 |
| Total components | 500 | 5,000 |
| Design tokens | 200 | 1,000 |
| Flows | 20 | 100 |
| Schema file size | 1 MB | 10 MB |

## 3.11 Serialization Format

### Export File
```jsonc
{
  "$schema": "https://forge-omix.dev/schemas/project.schema.json",
  "format": "forge-omix-export",
  "version": "1.0.0",
  "exportedAt": "2026-09-16T12:00:00Z",
  "builder": {
    "version": "0.1.0",
    "platform": "web"
  },
  "project": { /* full schema */ }
}
```

### Import Rules
1. Validate against JSON Schema
2. Run all pending migrations
3. Re-assign all UUIDs to prevent collisions
4. Record import metadata (source, date)
5. Mark as "imported" in project settings
