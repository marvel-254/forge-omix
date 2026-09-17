import React, { createElement, type ComponentType as ReactComponentType, type DragEvent } from 'react';
import { getComponent, getComponentList, type ComponentType } from './index';
import { useSchemaStore } from '../../store/schemaStore';
import { Card } from '../ui/Card';

interface ComponentLibraryProps {
  onSelectComponent: (type: ComponentType) => void;
}

const ComponentLibrary: React.FC<ComponentLibraryProps> = ({ onSelectComponent }) => {
  const components = getComponentList();
  const draggingType = useSchemaStore((s) => s.draggingLibraryType);
  const setDraggingType = useSchemaStore((s) => s.setDraggingLibraryType);

  const handleDragStart = (event: DragEvent<HTMLDivElement>, type: ComponentType) => {
    event.dataTransfer.effectAllowed = 'copy';
    // Fallback payload for drop targets that read dataTransfer directly.
    event.dataTransfer.setData('text/omix-component', type);
    setDraggingType(type);
  };

  const handleDragEnd = () => setDraggingType(null);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Component Library</h2>
      <div className="grid grid-cols-2 gap-4">
        {components.map((type) => {
          const PreviewComponent = getComponent(type) as ReactComponentType<Record<string, unknown>>;
          const isDragging = draggingType === type;
          return (
            <Card
              key={type}
              className={`p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
                isDragging ? 'opacity-50 ring-2 ring-primary-400' : ''
              }`}
              onClick={() => onSelectComponent(type)}
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex flex-col items-center">
                <div className="mb-2">
                  {createElement(PreviewComponent, {
                    // Add default props for preview
                    ...(type === 'Button' && { children: 'Button', variant: 'default' }),
                    ...(type === 'Input' && { placeholder: 'Input', label: 'Input' }),
                    ...(type === 'Card' && { children: <div className="p-4">Card</div> }),
                    ...(type === 'Navbar' && {
                      logo: <span className="font-bold">Logo</span>,
                      links: [
                        { label: 'Home', href: '#' },
                        { label: 'About', href: '#' },
                      ],
                    }),
                    ...(type === 'Chart' && { type: 'bar', data: {} }),
                    ...(type === 'Table' && {
                      columns: [
                        { key: 'id', label: 'ID' },
                        { key: 'name', label: 'Name' },
                      ],
                      data: [
                        { id: 1, name: 'Item 1' },
                        { id: 2, name: 'Item 2' },
                      ],
                    }),
                  })}
                </div>
                <span className="text-sm font-medium">{type}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ComponentLibrary;
