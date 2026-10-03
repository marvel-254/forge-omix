// @ts-nocheck
import { useMemo, useState, type DragEvent } from 'react';
import { useSchemaStore } from '../../store/schemaStore';
import { Input } from '../ui/Input';
import { getComponent, getComponentCatalog } from './index';
import type { ComponentType } from './index';


function LibraryCard({ meta, onDragStart, isDragging }: { meta: { type: string; label?: string; category?: string }; onDragStart: (e: DragEvent<HTMLDivElement>) => void; isDragging: boolean }) {
  const PreviewComponent = getComponent(meta.type as ComponentType) as ReactComponentType<any>;
  return (
    <button data-testid={`library-card-${meta.type}`} className={`cursor-grab overflow-hidden p-2 text-left transition-shadow hover:shadow-md active:cursor-grabbing rounded-lg border bg-card ${isDragging ? 'opacity-50 ring-2 ring-primary-400' : ''} `} onDragStart={onDragStart} onDragEnd={() => {}} draggable={true}>
      <div className="h-10 mb-2 flex items-center justify-center rounded bg-background/60">{PreviewComponent ? <PreviewComponent {...({ label: meta.label || meta.type } as any)} /> : meta.type.slice(0, 2)}</div>
      <span className="text-xs font-medium text-foreground block truncate">{meta.label || meta.type}</span>
      <span className="text-[10px] text-muted-foreground">{meta.category || 'UI'}</span>
    </button>
  );
}

export default function ComponentLibrary({ onSelectComponent }: { onSelectComponent: (type: ComponentType) => void }) {
  const draggingType = useSchemaStore((s) => s.draggingLibraryType);
  const setDraggingType = useSchemaStore((s) => s.setDraggingLibraryType);
  const [query, setQuery] = useState('');

  const catalog = useMemo(() => getComponentCatalog(), []);
  const categorized = useMemo(() => { const g: Record<string, string[]> = {}; for (const c of catalog) g[c.category] = c.types; return g; }, [catalog]);
  const searching = query.trim().length > 0;
  const results = useMemo(() => {
    if (!searching) return [];
    const q = query.toLowerCase();
    const out: { type: string; label: string; category: string }[] = [];
    for (const [cat, types] of Object.entries(categorized)) {
      for (const t of types) if (t.toLowerCase().includes(q) || cat.toLowerCase().includes(q)) out.push({ type: t, label: t, category: cat });
    }
    return out;
  }, [searching, query, categorized]);

  const handleDragStart = (event: DragEvent<HTMLDivElement>, type: string) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/omix-component', type);
    setDraggingType(type as ComponentType);
  };

  const /* @unused */ handleDragEnd = () => setDraggingType(null);

  return (
    <div className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
        Component Library <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full font-medium">shadcn + meraki + hyperui + daisyUI + flowbite</span>
      </h2>
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search components…" aria-label="Search components" />
      {searching ? (
        results.length === 0 ? <p className="px-1 py-4 text-center text-xs text-muted-foreground">No components match “{query.trim()}”.</p> : (
          <div className="space-y-2">
            {results.map((r) => <LibraryCard key={r.type} meta={r} onDragStart={(e) => handleDragStart(e, r.type)} isDragging={draggingType === r.type} />)}
          </div>
        )
      ) : (
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {Object.entries(categorized).map(([cat, types]) => (
            <section key={cat}>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sticky top-0 bg-background/90 backdrop-blur z-10 py-1">{cat}</h3>
              <div className="grid grid-cols-2 gap-2">
                {types.map((t) => <LibraryCard key={t} meta={{ type: t, label: t, category: cat }} onDragStart={(e) => handleDragStart(e, t)} isDragging={draggingType === t} />)}
              </div>
            </section>
          ))}
          <section className="pt-2 border-t border-border">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sticky top-0 bg-background/90 backdrop-blur z-10 py-1">More sources</h3>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-xs text-muted-foreground p-2 rounded-md border bg-card">meraki-ui <span className="text-[10px] text-muted-foreground/70">dashboards</span></span>
              <span className="text-xs text-muted-foreground p-2 rounded-md border bg-card">tailblocks <span className="text-[10px] text-muted-foreground/70">landing</span></span>
              <span className="text-xs text-muted-foreground p-2 rounded-md border bg-card">hyperui <span className="text-[10px] text-muted-foreground/70">marketing</span></span>
              <span className="text-xs text-muted-foreground p-2 rounded-md border bg-card">open-props <span className="text-[10px] text-muted-foreground/70">animation</span></span>
              <span className="text-xs text-muted-foreground p-2 rounded-md border bg-card">daisyUI <span className="text-[10px] text-muted-foreground/70">themes</span></span>
              <span className="text-xs text-muted-foreground p-2 rounded-md border bg-card">radix-ui <span className="text-[10px] text-muted-foreground/70">primitives</span></span>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
