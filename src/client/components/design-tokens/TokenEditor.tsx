import React, { useState, useEffect } from 'react';
import { getDesignTokens, setDesignTokens, resetDesignTokens } from '../../lib/design-tokens';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useFieldValidation } from '../../hooks/useValidation';
import { z } from 'zod';

const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const spacingSchema = z.string().regex(/^\d+(\.\d+)?(px|rem|em|%)?$/);

const TokenEditor: React.FC = () => {
  const [tokens, setTokens] = useState(getDesignTokens());
  const [activeTab, setActiveTab] = useState<
    'colors' | 'spacing' | 'radius' | 'shadows' | 'typography' | 'breakpoints'
  >('colors');

  // Color field validation
  const colorField = useFieldValidation(colorSchema, '');
  const spacingField = useFieldValidation(spacingSchema, '');

  useEffect(() => {
    setTokens(getDesignTokens());
  }, []);

  const handleSave = () => {
    setDesignTokens(tokens);
    alert('Design tokens saved!');
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset to default tokens?')) {
      resetDesignTokens();
      setTokens(getDesignTokens());
    }
  };

  const renderColorSwatch = (color: string) => (
    <div className="flex items-center space-x-2">
      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: color }}></div>
      <span>{color}</span>
    </div>
  );

  const renderColorSection = (section: 'primary' | 'secondary' | 'neutral') => {
    const sectionColors = tokens.colors?.[section];
    if (!sectionColors || typeof sectionColors === 'string') return null;
    return (
      <div className="space-y-2">
        <h3 className="font-medium capitalize">{section}</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(sectionColors).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">{key}</label>
              <Input
                value={String(value ?? '')}
                onChange={(e) => {
                  colorField.handleChange(e.target.value);
                  if (colorField.validateField(e.target.value)) {
                    setTokens((prev) => ({
                      ...prev,
                      colors: {
                        ...prev.colors,
                        [section]: {
                          ...(typeof prev.colors[section] === 'object' ? prev.colors[section] : {}),
                          [key]: e.target.value,
                        },
                      },
                    }));
                  }
                }}
                onBlur={colorField.handleBlur}
                error={colorField.error ?? undefined}
              />
              {renderColorSwatch(String(value ?? ''))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStringTokenSection = (
    section: 'spacing' | 'radius',
    field: ReturnType<typeof useFieldValidation>
  ) => (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(tokens[section] ?? {}).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">{key}</label>
            <Input
              value={String(value ?? '')}
              onChange={(e) => {
                field.handleChange(e.target.value);
                if (field.validateField(e.target.value)) {
                  setTokens((prev) => ({
                    ...prev,
                    [section]: {
                      ...prev[section],
                      [key]: e.target.value,
                    },
                  }));
                }
              }}
              onBlur={field.handleBlur}
              error={field.error ?? undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderShadowsSection = () => (
    <div className="space-y-4">
      {Object.entries(tokens.shadows ?? {}).map(([key, value]) => (
        <div key={key} className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">{key}</label>
          <div className="p-4 rounded-lg" style={{ boxShadow: String(value ?? '') }}>
            <span className="text-xs text-neutral-500 break-all">{String(value ?? '')}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTypographySection = () => {
    const families = tokens.typography?.fontFamilies ?? {};
    const sizes = tokens.typography?.fontSizes ?? {};
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-medium">Font Families</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(families).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">{key}</label>
                <Input
                  value={String(value ?? '')}
                  onChange={(e) =>
                    setTokens((prev) => ({
                      ...prev,
                      typography: {
                        ...prev.typography,
                        fontFamilies: {
                          ...prev.typography?.fontFamilies,
                          [key]: e.target.value,
                        },
                      },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-medium">Font Sizes</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(sizes).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">{key}</label>
                <Input
                  value={String(value ?? '')}
                  onChange={(e) =>
                    setTokens((prev) => ({
                      ...prev,
                      typography: {
                        ...prev.typography,
                        fontSizes: {
                          ...prev.typography?.fontSizes,
                          [key]: e.target.value,
                        },
                      },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderBreakpointsSection = () => (
    <div className="space-y-4">
      {Object.entries(tokens.breakpoints ?? {}).map(([key, value]) => (
        <div key={key} className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">{key}</label>
          <Input
            value={String(value ?? '')}
            onChange={(e) =>
              setTokens((prev) => ({
                ...prev,
                breakpoints: {
                  ...prev.breakpoints,
                  [key]: e.target.value,
                },
              }))
            }
          />
        </div>
      ))}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'colors':
        return (
          <div className="space-y-6">
            {renderColorSection('primary')}
            {renderColorSection('secondary')}
            {renderColorSection('neutral')}
          </div>
        );
      case 'spacing':
        return renderStringTokenSection('spacing', spacingField);
      case 'radius':
        return renderStringTokenSection('radius', spacingField);
      case 'shadows':
        return renderShadowsSection();
      case 'typography':
        return renderTypographySection();
      case 'breakpoints':
        return renderBreakpointsSection();
      default:
        return null;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Design Tokens Editor</h2>
        <div className="flex space-x-2">
          <Button onClick={handleSave} variant="default">
            Save
          </Button>
          <Button onClick={handleReset} variant="outline">
            Reset
          </Button>
        </div>
      </div>

      <div className="flex space-x-4 mb-6">
        {(['colors', 'spacing', 'radius', 'shadows', 'typography', 'breakpoints'] as const).map(
          (tab) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              variant={activeTab === tab ? 'default' : 'outline'}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          )
        )}
      </div>

      <div className="space-y-6">{renderTabContent()}</div>
    </Card>
  );
};

export default TokenEditor;
