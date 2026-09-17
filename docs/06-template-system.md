# 06 — Template System

## 6.1 Template Architecture

Templates are first-class citizens in Omix Builder. A template is a portable, self-contained package that defines a reusable starting point — from a single component to a complete multi-page application.

### Template Categories

| Category | Description | Example |
|----------|-------------|---------|
| Component | Single reusable UI element | Button, Card, Hero |
| Section | Page section | Pricing table, FAQ block |
| Page | Complete page | Landing, Dashboard, Settings |
| Flow | User journey | Authentication, Onboarding |
| DesignSystem | Complete design token set | Corporate brand system |
| ProjectStarter | Full project scaffold | SaaS starter, E-commerce starter |

## 6.2 Template Format

A template is a JSON file following the template schema with variables, dependencies, and metadata:

```json
{
  "$schema": "https://forge-omix.dev/schemas/template.schema.json",
  "id": "tmpl_saas_dashboard_v1",
  "name": "SaaS Dashboard Starter",
  "version": "1.0.0",
  "author": "Omix Community",
  "license": "MIT",
  "category": "projectStarter",
  "tags": ["saas", "dashboard", "charts", "auth"],
  "description": "A complete SaaS dashboard with authentication, sidebar navigation, KPI cards, and charts.",
  "preview": "https://forge-omix.dev/templates/saas-dashboard/preview.png",
  
  "variables": [
    {
      "name": "appName",
      "type": "string",
      "label": "Application Name",
      "default": "My App",
      "required": true
    },
    {
      "name": "primaryColor",
      "type": "color",
      "label": "Primary Brand Color",
      "default": "#3b82f6",
      "required": false
    },
    {
      "name": "includeAuth",
      "type": "boolean",
      "label": "Include Authentication Flow",
      "default": true,
      "required": false
    }
  ],
  
  "dependencies": [
    { "name": "recharts", "version": "^2.0.0", "type": "prod" },
    { "name": "date-fns", "version": "^3.0.0", "type": "prod" }
  ],
  
  "schema": {
    "project": {
      "name": "{{appName}}",
      "framework": "react"
    },
    "pages": [
      {
        "path": "/",
        "title": "{{appName}} Dashboard",
        "components": ["comp_kpi_01", "comp_chart_01"]
      }
    ],
    "designTokens": {
      "colors": {
        "primary": "{{primaryColor}}"
      }
    }
  },
  
  "importMetadata": {
    "source": "https://github.com/user/saas-starter",
    "originalAuthor": "...",
    "originalLicense": "MIT",
    "importedAt": "2026-09-16T12:00:00Z",
    "attribution": "Based on SaaS Starter by [Author](url) (MIT)"
  }
}
```

## 6.3 Variable Substitution

Variables are referenced using `{{variableName}}` syntax in the schema.

### Variable Types

| Type | Description | Validation |
|------|-------------|------------|
| `string` | Text input | `minLength`, `maxLength`, `pattern` |
| `number` | Numeric | `minimum`, `maximum` |
| `boolean` | True/false toggle | — |
| `color` | Color picker | Hex format validation |
| `select` | From options | `options: [{value, label}]` |
| `image` | Image upload | Max dimensions, format |

### Substitution Process

1. User selects template
2. Builder shows variable form with defaults
3. User fills in variables
4. Builder substitutes `{{var}}` placeholders
5. Resulting schema is validated
6. Project is created from schema

## 6.4 Template Import

### Import Sources

| Source | Method | Notes |
|--------|--------|-------|
| GitHub repository | Clone + scan | Detects components, styles, structure |
| npm package | Install + analyze | Reads package.json, source files |
| shadcn/ui ecosystem | shadcn registry | Reuses component patterns |
| JSON file | Direct upload | Omix native format |
| Figma Community | Export plugin | Future: screenshot analysis |

### Import Analyzer

When importing, the analyzer extracts:

```typescript
interface ImportResult {
  components: ImportedComponent[];
  designTokens: DesignTokens;
  pages: ImportedPage[];
  dependencies: Dependency[];
  license: LicenseInfo;
  attribution: string;
  warnings: string[];     // e.g., "Uses CSS-in-JS, converting to Tailwind"
}
```

### License Attribution

Every imported template records:

```json
{
  "importMetadata": {
    "source": "https://github.com/tailwindui/components",
    "originalAuthor": "Tailwind UI",
    "originalLicense": "Commercial (requires license for distribution)",
    "importedAt": "2026-09-16T12:00:00Z",
    "attribution": "Components based on Tailwind UI (commercial license)",
    "modifications": ["Converted to Tailwind v4", "Added responsive rules"]
  }
}
```

**Critical:** Commercial licenses prevent redistribution. The importer warns the user and records the restriction.

## 6.5 Template Export

Export produces a portable `.forge-template` file (which is JSON with `.zip` assets).

```bash
# Export a project as template
forge export-template --project=my-project --output=my-template.forge

# Import a template
forge import-template --file=my-template.forge --name="My Template"
```

### Export Process

1. User marks project as "template source"
2. User defines which variables to expose
3. Builder extracts schema with variable placeholders
4. Builder generates preview thumbnail
5. Builder packages as `.forge-template` file

## 6.6 Template Inheritance

Templates can extend other templates:

```json
{
  "name": "E-commerce Starter Pro",
  "extends": "base_saas_starter",
  "override": {
    "pages": { "append": ["/products", "/cart", "/checkout"] },
    "designTokens": { "merge": { "colors": { "primary": "#ec4899" } } }
  }
}
```

## 6.7 Built-in Templates (V1)

| Name | Category | Description |
|------|----------|-------------|
| Blank | projectStarter | Empty project, no components |
| Landing Page | projectStarter | Hero, Features, FAQ, Footer |
| SaaS Dashboard | projectStarter | Auth, Sidebar, KPIs, Charts |
| E-commerce | projectStarter | Product grid, Cart, Checkout |
| Blog | projectStarter | Article list, Post detail |
| Admin Panel | projectStarter | Table, Filters, CRUD forms |
| Portfolio | projectStarter | Gallery, About, Contact |
| Documentation | projectStarter | Sidebar nav, Markdown pages |

## 6.8 Template Versioning

- Semantic versioning: `MAJOR.MINOR.PATCH`
- Breaking changes → new MAJOR version
- User can lock template version
- Updates available notification
- Migration path for breaking changes

## 6.9 Template Marketplace (Deferred)

Future: Community template marketplace where users can:
- Publish templates (with license)
- Browse and rate
- Auto-update subscribed templates
- Attribution tracking

**Deferred because:** Marketplace requires user accounts, moderation, payment infrastructure — out of scope for V1.
