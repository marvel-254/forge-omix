import type { Component, DesignTokens, Page, Project } from '../../server/types/schema'
import { generateAppFile, generatePageFile, pageComponentName } from './pages'
import type { ComponentGenContext } from './components'
import { generateTailwindExtend, generateTokensCss } from './tokens'
import { generateAgentsMd, generateBuilderFiles, generateTasks } from '../agent'

/**
 * Full project emission (docs/07 §7.1–§7.2, React + Vite target).
 * `generateProject` validates nothing — callers validate the schema first.
 */

export interface GeneratedFile {
  path: string
  content: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'omix-app'
}

const UI_KIT = `import React, { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler
);

function cn(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

const buttonStyles: Record<string, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300',
  outline: 'border border-slate-300 bg-white hover:bg-slate-50',
  ghost: 'hover:bg-slate-100',
  link: 'text-blue-600 underline-offset-4 hover:underline',
};

const buttonSizes: Record<string, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function Button({ variant = 'primary', size = 'md', icon, ...props }: {
  variant?: keyof typeof buttonStyles;
  size?: keyof typeof buttonSizes;
  icon?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn('inline-flex items-center justify-center rounded-md font-medium', buttonStyles[variant], buttonSizes[size])}
      {...props}
    >
      {icon ? <span aria-hidden="true" className="mr-2">{icon}</span> : null}
      {props.children}
    </button>
  );
}

export function Input({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      {label ? <span className="mb-1 block text-sm font-medium">{label}</span> : null}
      <input
        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        {...props}
      />
    </label>
  );
}

const cardShadows = ['shadow-none', 'shadow-sm', 'shadow-md', 'shadow-lg'];

export function Card({ header, content, footer, elevation = 1, children, ...props }: {
  header?: string;
  content?: string;
  footer?: string;
  elevation?: number;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('rounded-lg border bg-white p-4', cardShadows[elevation] ?? 'shadow-sm')} {...props}>
      {header ? <h3 className="mb-1 text-base font-semibold">{header}</h3> : null}
      {content ? <p className="text-sm text-slate-600">{content}</p> : null}
      {children}
      {footer ? <div className="mt-3 border-t pt-3 text-xs text-slate-500">{footer}</div> : null}
    </section>
  );
}

export function Navbar({ logo, links = [], sticky, transparent, ...props }: {
  logo?: string;
  links?: Array<{ label: string; href: string }>;
  sticky?: boolean;
  transparent?: boolean;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <nav
      className={cn(
        'flex items-center gap-4 px-4 py-3',
        transparent ? 'bg-transparent' : 'bg-white border-b',
        sticky && 'sticky top-0 z-10'
      )}
      {...props}
    >
      {logo ? <span className="font-semibold">{logo}</span> : null}
      {links.map((link) => (
        <a key={link.href + link.label} href={link.href} className="text-sm text-slate-600 hover:text-slate-900">
          {link.label}
        </a>
      ))}
    </nav>
  );
}

export function Chart({ type, data, ...props }: {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  data: { labels?: string[]; datasets?: Array<{ label?: string; data: number[]; color?: string }> } | null;
} & React.HTMLAttributes<HTMLDivElement>) {
  const labels = data?.labels ?? [];
  const datasets = (data?.datasets ?? []).map((dataset, i) => ({
    label: dataset.label,
    data: dataset.data,
    backgroundColor: dataset.color ?? ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5],
    borderColor: dataset.color ?? '#3b82f6',
    fill: type === 'area',
  }));
  const chartData = { labels, datasets };
  const kind = type === 'area' ? 'line' : type;
  return (
    <div {...props}>
      {kind === 'bar' ? <Bar data={chartData} /> : null}
      {kind === 'line' ? <Line data={chartData} /> : null}
      {kind === 'pie' ? <Pie data={chartData} /> : null}
      {kind === 'doughnut' ? <Doughnut data={chartData} /> : null}
    </div>
  );
}

export function Table({ columns = [], data = [], sortable, filterable, ...props }: {
  columns?: Array<{ key: string; label: string }>;
  data?: Array<Record<string, unknown>>;
  sortable?: boolean;
  filterable?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const rows = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const filtered = needle
      ? data.filter((row) => JSON.stringify(row).toLowerCase().includes(needle))
      : [...data];
    if (sortable && sortKey) {
      filtered.sort((a, b) => String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? '')));
    }
    return filtered;
  }, [data, filter, sortKey, sortable]);
  return (
    <div {...props}>
      {filterable ? (
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter…"
          className="mb-2 h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
        />
      ) : null}
      <table className="w-full text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={sortable ? () => setSortKey(column.key) : undefined}
                className="h-10 border-b px-3 text-left font-medium text-slate-500"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b">
              {columns.map((column) => (
                <td key={column.key} className="px-3 py-2">{String(row[column.key] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
`;

const RESPONSIVE_LIB = `import { useEffect, useState } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const QUERIES: Array<[Breakpoint, string]> = [
  ['2xl', '(min-width: 1536px)'],
  ['xl', '(min-width: 1280px)'],
  ['lg', '(min-width: 1024px)'],
  ['md', '(min-width: 768px)'],
  ['sm', '(min-width: 640px)'],
  ['xs', '(max-width: 639px)'],
];

export function useBreakpoint(): Breakpoint {
  const current = (): Breakpoint => {
    if (typeof window === 'undefined' || !window.matchMedia) return 'lg';
    for (const [breakpoint, query] of QUERIES) {
      if (window.matchMedia(query).matches) return breakpoint;
    }
    return 'xs';
  };
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(current);
  useEffect(() => {
    const update = () => setBreakpoint(current());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return breakpoint;
}

export function useResponsiveProps<T extends Record<string, unknown>>(
  base: T,
  overrides: Partial<Record<Breakpoint, Partial<T>>>
): T {
  const breakpoint = useBreakpoint();
  return { ...base, ...(overrides[breakpoint] ?? {}) };
}

export function useResponsiveHidden(hidden: Partial<Record<Breakpoint, boolean>>): boolean {
  const breakpoint = useBreakpoint();
  return hidden[breakpoint] === true;
}
`;

function packageJson(name: string): string {
  return JSON.stringify(
    {
      name,
      private: true,
      version: '0.1.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc --noEmit && vite build',
        preview: 'vite preview',
        typecheck: 'tsc --noEmit',
      },
      dependencies: {
        'chart.js': '^4.4.0',
        react: '^18.3.1',
        'react-chartjs-2': '^5.2.0',
        'react-dom': '^18.3.1',
        'react-router-dom': '^7.0.0',
      },
      devDependencies: {
        '@types/react': '^18.3.0',
        '@types/react-dom': '^18.3.0',
        '@vitejs/plugin-react': '^4.2.0',
        autoprefixer: '^10.4.0',
        postcss: '^8.4.0',
        tailwindcss: '^3.4.0',
        typescript: '^5.4.0',
        vite: '^5.0.0',
      },
    },
    null,
    2
  ) + '\n';
}

const VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;

const TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
`;

const MAIN_TSX = `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Omix App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const GITIGNORE = `node_modules/
dist/
`;

function indexCss(tokens?: DesignTokens | null): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

${generateTokensCss(tokens)}
body {
  margin: 0;
}
`;
}

function tailwindConfig(tokens?: DesignTokens | null): string {
  return `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
${generateTailwindExtend(tokens)}
  },
  plugins: [],
};
`;
}

function readme(name: string, pageCount: number, componentCount: number): string {
  return `# ${name}

Generated with forge@omix. React + Vite + Tailwind CSS.

- Pages: ${pageCount}
- Components: ${componentCount}

## Scripts

- \`npm run dev\` — start the dev server
- \`npm run build\` — typecheck and build for production
- \`npm run preview\` — preview the production build
`;
}

export function generateProject(project: Project): GeneratedFile[] {
  const record = project as unknown as Record<string, unknown>
  const name = typeof record.name === 'string' && record.name ? record.name : 'Omix App'
  const pages = (Array.isArray(record.pages) ? record.pages : []) as Page[]
  const tokens = (record.designTokens ?? null) as DesignTokens | null
  const ctx: ComponentGenContext = { tokens }

  const taken = new Set<string>()
  const pageFiles = pages.map((page) => {
    const componentName = pageComponentName(page, taken)
    return {
      page,
      ...generatePageFile(page, ctx, componentName),
    }
  });

  const files: GeneratedFile[] = [
    { path: 'package.json', content: packageJson(slugify(name)) },
    { path: 'vite.config.ts', content: VITE_CONFIG },
    { path: 'tsconfig.json', content: TSCONFIG },
    { path: 'index.html', content: INDEX_HTML },
    { path: '.gitignore', content: GITIGNORE },
    { path: 'tailwind.config.js', content: tailwindConfig(tokens) },
    { path: 'src/index.css', content: indexCss(tokens) },
    { path: 'src/main.tsx', content: MAIN_TSX },
    { path: 'src/components/ui.tsx', content: UI_KIT },
    { path: 'src/lib/responsive.tsx', content: RESPONSIVE_LIB },
    {
      path: 'src/App.tsx',
      content: generateAppFile(
        pageFiles.map(({ page, componentName }) => ({
          path: typeof page.path === 'string' ? page.path : '/',
          componentName,
        }))
      ),
    },
    ...pageFiles.map(({ filePath, code }) => ({ path: filePath, content: code })),
  ];

  const componentCount = pages.reduce(
    (n, page) =>
      n + (Array.isArray(asRecord(page).components) ? (asRecord(page).components as Component[]).length : 0),
    0
  );
  files.push({ path: 'README.md', content: readme(name, pages.length, componentCount) });

  // Agent handoff (docs/08): generated tasks, full AGENTS.md, .builder/ spec.
  const tasks = generateTasks(project);
  const builderFiles: GeneratedFile[] = generateBuilderFiles(project, tasks);
  const agentsMd: GeneratedFile = { path: 'AGENTS.md', content: '' };
  agentsMd.content = generateAgentsMd({
    project,
    files: [...files, ...builderFiles, { path: agentsMd.path }],
    tasks,
  });

  return [...files, ...builderFiles, agentsMd];
}
