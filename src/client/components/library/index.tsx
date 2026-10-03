import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Navbar } from '../ui/Navbar';
import { Chart } from '../ui/Chart';
import { Table } from '../ui/Table';
import { AvatarGroup } from '../ui/AvatarGroup';
import { Checkbox } from '../ui/Checkbox';
import { Skeleton } from '../ui/Skeleton';
import { Divider } from '../ui/Divider';
import { Modal } from '../ui/Modal';
import { Stepper } from '../ui/Stepper';
import { Pagination } from '../ui/Pagination';
// Extended from shadcn/ui, flowbite, meraki-ui, hyperui, daisyUI, open-props

// Layout & Containers


const componentRegistry = {
  // Layout
  Container: ({ children }: { children?: React.ReactNode }) => <div className="max-w-6xl mx-auto px-4">{children}</div>,
  Card,
  Panel: ({ title, children }: { title?: string; children?: React.ReactNode }) => <aside className="rounded-xl border bg-card shadow-sm p-4"><h3 className="font-semibold text-sm mb-2">{title || 'Panel'}</h3>{children}</aside>,
  // Primitives (shadcn / radix / open-props)
  Button,
  Badge: ({ label }: { label?: string }) => <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800">{label || 'Badge'}</span>,
  Label: ({ text }: { text?: string }) => <label className="text-sm font-medium text-foreground">{text || 'Label'}</label>,
  Divider,
  Spacer: ({ size = 'md' }: { size?: string }) => <div className={`h-${size === 'sm' ? '2' : size === 'lg' ? '8' : '4'} w-full`} />,
  // Forms (shadcn + react-hook-form style)
  Input,
  Textarea: ({ placeholder }: { placeholder?: string }) => <textarea placeholder={placeholder || 'Enter text…'} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />,
  Checkbox,
  // Data (tanstack-table / meraki-ui)
  Table,
  DataGrid: Table, // alias for advanced grids
  List: ({ items }: { items?: string[] }) => <ul className="space-y-1 text-sm">{(items || ['Item 1']).map((i) => <li key={i} className="text-foreground/80">{i}</li>)}</ul>,
  Accordion: ({ title, open = false }: { title?: string; open?: boolean }) => <details open={open} className="rounded-lg border bg-card"><summary className="text-sm font-medium px-4 py-3 cursor-pointer">{title || 'Accordion'}</summary><div className="px-4 pb-3 text-sm text-muted-foreground">Content</div></details>,
  Tabs: ({ labels }: { labels?: string[] }) => <div className="flex gap-2 border-b border-border mb-2">{(labels || ['Tab 1', 'Tab 2']).map((l) => <button key={l} className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">{l}</button>)}</div>,
  // Navigation
  Navbar,
  Breadcrumb: ({ items }: { items?: string[] }) => <nav className="text-xs text-muted-foreground"><ol className="flex gap-2">{(items || ['Home', 'Project']).map((i, idx) => <li key={i}>{i}{idx < (items || []).length - 1 && ' / '}</li>)}</ol></nav>,
  Pagination,
  // Media (lucide-react / recharts / hyperui)
  Chart,
  Image: ({ src, alt }: { src?: string; alt?: string }) => <img src={src || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'} alt={alt || 'Image'} className="w-full rounded-lg object-cover" />,
  Icon: ({ name }: { name?: string }) => <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-primary-100 text-primary-700 text-xs font-bold">{(name || 'Ic')}</span>,
  AvatarGroup,
  Carousel: ({ slides }: { slides?: number }) => <div className="overflow-hidden rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 h-32 flex items-center justify-center text-sm text-muted-foreground">Carousel ({slides || 3} slides)</div>,
  // Feedback (daisyUI / flowbite / meraki)
  Modal,
  Alert: ({ message, type = 'info' }: { message?: string; type?: string }) => <div className={`rounded-lg border px-3 py-2 text-sm ${type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{message || 'Alert message'}</div>,
  Skeleton,
  Progress: ({ value = 60 }: { value?: number }) => <div className="w-full h-2 bg-border rounded-full overflow-hidden"><div className="h-full bg-primary-500 rounded-full" style={{ width: `${value}%` }} /></div>,
  // Commerce (meraki / flowbite)
  PlanCard: ({ name, price }: { name?: string; price?: string }) => <div className="rounded-xl border bg-card shadow-sm p-5"><h4 className="font-semibold text-base">{name || 'Pro'}</h4><p className="text-2xl font-bold mt-1">{price || '$29/mo'}</p></div>,
  ProductGrid: ({ count = 4 }: { count?: number }) => <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array.from({ length: count }).map((_, i) => <div key={i} className="rounded-lg border bg-card h-24" />)}</div>,
  // AI / Creation
  AIPanel: ({ title }: { title?: string }) => <aside className="rounded-xl border p-4 shadow-sm"><h3 className="font-semibold text-sm">{title || "AI Assistant"}</h3><p className="text-xs text-muted-foreground mt-1">Generate content.</p></aside>,
  StreamOutput: ({ text }: { text?: string }) => <pre className="rounded-lg bg-slate-900 text-slate-50 p-3 text-xs font-mono whitespace-pre-wrap">{text || 'AI stream response…'}</pre>,
  // Utilities
  Stepper,
  FileUpload: () => <label className="inline-flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground hover:bg-accent cursor-pointer">Upload file</label>,
};

export type ComponentType = keyof typeof componentRegistry;

export function getComponent(type: ComponentType) {
  return componentRegistry[type];
}

export function getComponentList() {
  return Object.keys(componentRegistry) as ComponentType[];
}

export function getComponentCatalog() {
  return [
    { category: 'Layout', types: ['Container', 'Panel', 'Card'] },
    { category: 'Primitives', types: ['Button', 'Badge', 'Label', 'Divider', 'Spacer'] },
    { category: 'Forms', types: ['Input', 'Textarea', 'Checkbox'] },
    { category: 'Data', types: ['Table', 'DataGrid', 'List', 'Accordion', 'Tabs'] },
    { category: 'Navigation', types: ['Navbar', 'Breadcrumb', 'Pagination'] },
    { category: 'Media', types: ['Chart', 'Image', 'Icon', 'AvatarGroup', 'Carousel'] },
    { category: 'Feedback', types: ['Modal', 'Alert', 'Skeleton', 'Progress'] },
    { category: 'Commerce', types: ['PlanCard', 'ProductGrid'] },
    { category: 'AI / Creation', types: ['AIPanel', 'StreamOutput'] },
    { category: 'Utilities', types: ['Stepper', 'FileUpload'] },
  ] as const;
}
