import React, { createElement, useMemo, useState, type ComponentType as ReactComponentType, type DragEvent } from 'react';
import { getComponent, type ComponentType } from './index';
import {
  COMPONENT_CATEGORIES,
  getCatalogByCategory,
  searchCatalog,
  type ComponentMeta,
} from '../../canvas/componentCatalog';
import { useSchemaStore } from '../../store/schemaStore';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface ComponentLibraryProps {
  onSelectComponent: (type: ComponentType) => void;
}

function previewPropsFor(type: string): Record<string, unknown> {
  // Minimal props so the live preview renders without overflowing its card.
  switch (type) {
    case 'Button':
      return { children: 'Button', variant: 'default' };
    case 'Input':
      return { placeholder: 'Input' };
    case 'Card':
      return { children: <div className="p-4">Card</div> };
    case 'Navbar':
      return { logo: <span className="font-bold">Logo</span>, links: [] };
    case 'Chart':
      return { type: 'bar', data: {} };
    case 'Table':
      return {
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
        ],
        data: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
      };
    default:
      return {};
  }
}

function LibraryCard({
  meta,
  isDragging,
  onSelect,
  onDragStart,
  onDragEnd,
}: {
  meta: ComponentMeta;
  isDragging: boolean;
  onSelect: () => void;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}) {
  const PreviewComponent = getComponent(meta.type as ComponentType) as ReactComponentType<
    Record<string, unknown>
  >;
  return (
    <Card
      className={`cursor-grab overflow-hidden p-2 transition-shadow hover:shadow-md active:cursor-grabbing ${
        isDragging ? 'opacity-50 ring-2 ring-primary-400' : ''
      }`}
      onClick={onSelect}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title={meta.description}
    >
      <div className="flex flex-col items-center">
        <div className="mb-1 flex h-16 w-full items-center justify-center overflow-hidden text-neutral-700 [&>*]:max-w-full [&>*]:scale-[0.8]">
          {createElement(PreviewComponent, previewPropsFor(meta.type))}
        </div>
        <span className="text-xs font-medium text-neutral-600">{meta.label}</span>
      </div>
    </Card>
  );
}

const ComponentLibrary: React.FC<ComponentLibraryProps> = ({ onSelectComponent }) => {
  const draggingType = useSchemaStore((s) => s.draggingLibraryType);
  const setDraggingType = useSchemaStore((s) => s.setDraggingLibraryType);
  const [query, setQuery] = useState('');

  const handleDragStart = (event: DragEvent<HTMLDivElement>, type: ComponentType) => {
    event.dataTransfer.effectAllowed = 'copy';
    // Fallback payload for drop targets that read dataTransfer directly.
    event.dataTransfer.setData('text/omix-component', type);
    setDraggingType(type);
  };

  const handleDragEnd = () => setDraggingType(null);

  const results = useMemo(() => searchCatalog(query), [query]);
  const searching = query.trim().length > 0;
  const resultTypes = useMemo(() => new Set(results.map((r) => r.type)), [results]);

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Component Library
      </h2>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search components…"
        aria-label="Search components"
      />
      {searching ? (
        results.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-neutral-400">
            No components match “{query.trim()}”.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {results.map((meta) => (
              <LibraryCard
                key={meta.type}
                meta={meta}
                isDragging={draggingType === meta.type}
                onSelect={() => onSelectComponent(meta.type as ComponentType)}
                onDragStart={(e) => handleDragStart(e, meta.type as ComponentType)}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        )
      ) : (
        COMPONENT_CATEGORIES.map((category) => {
          const items = getCatalogByCategory(category.id).filter((m) => resultTypes.has(m.type));
          if (items.length === 0) return null;
          return (
            <section key={category.id} aria-label={category.label}>
              <h3 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                {category.label}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {items.map((meta) => (
                  <LibraryCard
                    key={meta.type}
                    meta={meta}
                    isDragging={draggingType === meta.type}
                    onSelect={() => onSelectComponent(meta.type as ComponentType)}
                    onDragStart={(e) => handleDragStart(e, meta.type as ComponentType)}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
};

export default ComponentLibrary;
