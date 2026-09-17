# 07 — Code Generation

## 7.1 Generation Pipeline

The code generator converts the universal project schema into a runnable application. It follows a three-stage pipeline:

```
┌──────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Schema     │ →  │  Intermediate     │ →  │   Generated     │
│   Input      │    │  Representation   │    │   Code          │
└──────────────┘    └──────────────────┘    └─────────────────┘
     │                     │                       │
  - Project            - File tree              - .tsx files
  - Pages              - Dependencies          - .css files
  - Components         - Imports               - package.json
  - Design Tokens      - Routes                - configs
  - Flows              - State                 - AGENTS.md
  - Tasks              - Tests                 - README.md
```

### Stage 1: Schema Ingestion
- Validate schema against JSON Schema
- Resolve all `$ref` pointers
- Flatten component tree into render order
- Identify dependencies

### Stage 2: IR Generation
- Build file tree structure
- Calculate dependencies (npm packages)
- Generate route definitions
- Map design tokens to Tailwind config
- Identify state management needs

### Stage 3: Code Emission
- Generate source files from templates
- Apply Prettier formatting
- Generate package.json
- Generate configuration files
- Generate agent documentation

## 7.2 Target Frameworks

### Priority 1: React + Vite (Default)
**When to use:** Default for most projects. Fastest, simplest, most compatible.

```
generated-project/
├── src/
│   ├── components/       # Generated components
│   ├── pages/           # Route pages (file-based)
│   ├── stores/          # Zustand stores
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities
│   ├── styles/          # Tailwind + tokens
│   └── types/           # TypeScript types
├── public/              # Static assets
├── docs/                # Agent documentation
├── .builder/            # Builder metadata
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── AGENTS.md
└── README.md
```

### Priority 2: Next.js
**When to use:** When SEO, SSR, or static generation is required.

```
generated-project/
├── app/                 # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   └── globals.css
├── components/          # Shared components
├── lib/                 # Utilities
├── public/              # Static assets
├── .builder/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── AGENTS.md
└── README.md
```

### Priority 3: PWA
**When to use:** When offline capability is required.

- Service worker for offline caching
- Web app manifest for installability
- React + Vite base with PWA plugin

## 7.3 Component-to-Code Mapping

Each component type maps to a code template:

```typescript
const componentTemplates = {
  Button: (props) => `
    <button
      className={cn(
        buttonVariants({ variant: "${props.variant}", size: "${props.size}" }),
        className
      )}
      ${props.disabled ? 'disabled' : ''}
      onClick={${props.interactions.onClick ? handleClick : undefined}}
    >
      ${props.label}
    </button>
  `,
  
  Input: (props) => `
    <input
      type="${props.type || 'text'}"
      placeholder="${props.placeholder}"
      ${props.required ? 'required' : ''}
      className={cn(inputVariants(), className)}
      onChange={handleChange}
    />
  `,
  
  Card: (props, children) => `
    <div className={cn(cardVariants({ variant: "${props.variant}" }), className)}>
      ${children}
    </div>
  `
};
```

## 7.4 Design Token Generation

Design tokens become CSS custom properties and Tailwind config:

### CSS Custom Properties
```css
:root {
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --font-sans: 'Inter', system-ui, sans-serif;
  --spacing-4: 1rem;
  --radius-md: 0.5rem;
}
```

### Tailwind Config
```typescript
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
        }
      },
      fontFamily: {
        sans: 'var(--font-sans)',
      },
      spacing: {
        '4': 'var(--spacing-4)',
      },
      borderRadius: {
        md: 'var(--radius-md)',
      }
    }
  }
}
```

## 7.5 Route Generation

Routes generated from pages in schema:

### React + Vite (react-router-dom v7)
```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Next.js (App Router)
```
app/
├── page.tsx          → /
├── dashboard/
│   └── page.tsx      → /dashboard
├── settings/
│   └── page.tsx      → /settings
```

## 7.6 State Management Generation

Complex state becomes Zustand stores:

```typescript
// src/stores/auth.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (email, password) => {
    const user = await api.login(email, password);
    set({ user, isAuthenticated: true });
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

## 7.7 API Integration

Data sources become React Query hooks:

```typescript
// src/hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      return res.json();
    }
  });
}
```

## 7.8 Form Generation

Forms include validation with Zod:

```typescript
// src/pages/ContactPage.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

export function ContactPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(contactSchema)
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('name')} label="Name" error={errors.name?.message} />
      <Input {...register('email')} label="Email" error={errors.email?.message} />
      <Textarea {...register('message')} label="Message" error={errors.message?.message} />
      <Button type="submit">Send</Button>
    </form>
  );
}
```

## 7.9 Preserving Existing Code

When re-generating (e.g., after schema change):

### Sync Rules
1. `.builder/sync-rules.json` defines protected files
2. Files marked as "agent-modified" are NOT overwritten
3. New components are added alongside existing ones
4. Merge conflicts reported to user

```json
{
  "protectedFiles": [
    "src/components/custom/**",
    "src/lib/utils.ts"
  ],
  "protectedPatterns": [
    "**/*.custom.tsx"
  ],
  "lastSyncAt": "2026-09-16T12:00:00Z"
}
```

## 7.10 Post-Generation

After generation:

1. **Format:** `prettier --write .`
2. **Lint:** `eslint . --fix`
3. **Typecheck:** `tsc --noEmit`
4. **Test:** `vitest run`
5. **Build:** `vite build`

All must pass for generation to be considered successful.

## 7.11 Quality Gates

| Gate | Requirement |
|------|-------------|
| TypeScript | Strict mode, no errors |
| ESLint | Zero errors, zero warnings |
| Prettier | All files formatted |
| Build | `vite build` succeeds |
| Unit tests | All pass |
| Accessibility | No critical axe violations |

If any gate fails, the generation reports errors and suggests fixes.
