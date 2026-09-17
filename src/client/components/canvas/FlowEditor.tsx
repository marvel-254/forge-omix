import React, { useState, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import { flowSchema } from '../../../lib/validations';
import type { Flow, FlowStep } from '../../../types';

type EditorStepType = 'decision' | 'action' | 'trigger' | 'end';

interface FlowEditorProps {
  initialFlow?: Flow;
  onSave?: (flow: Flow) => void;
}

const STEP_STYLES: Record<EditorStepType, string> = {
  decision: 'bg-purple-100 border-purple-300',
  action: 'bg-blue-100 border-blue-300',
  trigger: 'bg-green-100 border-green-300',
  end: 'bg-red-100 border-red-300',
};

const STEP_HINTS: Record<EditorStepType, string> = {
  decision: 'Make a decision',
  action: 'Perform an action',
  trigger: 'Trigger event',
  end: 'End of flow',
};

const FlowEditor: React.FC<FlowEditorProps> = ({ initialFlow, onSave }) => {
  const [flow, setFlow] = useState<Flow>(
    initialFlow || {
      id: 'flow_' + Math.random().toString(36).slice(2, 11),
      name: 'New Flow',
      steps: [],
      triggers: [],
    }
  );

  const [selectedStep, setSelectedStep] = useState<FlowStep | null>(null);
  const [draggedType, setDraggedType] = useState<EditorStepType | null>(null);

  const addStep = useCallback((type: EditorStepType, position: { x: number; y: number }) => {
    const newStep: FlowStep = {
      id: 'step_' + Math.random().toString(36).slice(2, 11),
      name:
        type === 'decision' ? 'Decision Step' :
        type === 'action' ? 'Action Step' :
        type === 'trigger' ? 'Trigger Step' :
        'End Step',
      type,
      config: {},
      position,
    };

    setFlow((prev) => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));
  }, []);

  const updateStep = useCallback((updatedStep: FlowStep) => {
    setFlow((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => (step.id === updatedStep.id ? updatedStep : step)),
    }));
  }, []);

  const deleteStep = useCallback((stepId: string) => {
    setFlow((prev) => ({
      ...prev,
      steps: prev.steps.filter((step) => step.id !== stepId),
    }));
    setSelectedStep(null);
  }, []);

  const connectSteps = useCallback((sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setFlow((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => {
        if (step.id === sourceId) {
          return {
            ...step,
            next: [...(step.next || []), targetId],
          };
        }
        return step;
      }),
    }));
  }, []);

  const handleSave = useCallback(() => {
    try {
      const validatedFlow = flowSchema.parse(flow) as unknown as Flow;
      if (onSave) {
        onSave(validatedFlow);
      }
      alert('Flow saved successfully!');
    } catch (error) {
      alert('Failed to save flow: ' + String(error));
    }
  }, [flow, onSave]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!draggedType) return;
      const rect = e.currentTarget.getBoundingClientRect();
      addStep(draggedType, {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setDraggedType(null);
    },
    [draggedType, addStep]
  );

  const StepCard: React.FC<{ step: FlowStep }> = ({ step }) => {
    const stepType = (step.type as EditorStepType) || 'action';
    return (
      <div
        className={cn(
          'absolute p-4 rounded-lg shadow-md cursor-move transition-all duration-200 border',
          STEP_STYLES[stepType]
        )}
        style={{ left: step.position?.x ?? 0, top: step.position?.y ?? 0 }}
        onClick={() => setSelectedStep(step)}
        onDragStart={(e) => e.dataTransfer.setData('text/step-id', step.id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.stopPropagation();
          const sourceId = e.dataTransfer.getData('text/step-id');
          if (sourceId) connectSteps(sourceId, step.id);
        }}
        draggable
      >
        <div className="flex justify-between items-center mb-2 gap-2">
          <span className="font-medium">{step.name}</span>
          <span className="text-xs px-2 py-1 rounded-full bg-white">{stepType}</span>
        </div>
        <div className="text-xs text-gray-600">{STEP_HINTS[stepType]}</div>
      </div>
    );
  };

  const StepPalette: React.FC = () => (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="font-medium mb-4">Step Palette</h3>
      <div className="space-y-2">
        {(['decision', 'action', 'trigger', 'end'] as const).map((type) => (
          <div
            key={type}
            draggable
            onDragStart={() => setDraggedType(type)}
            className={cn(
              'p-3 rounded-md cursor-pointer hover:shadow-md transition-all duration-200 border',
              STEP_STYLES[type]
            )}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)} Step
          </div>
        ))}
      </div>
    </div>
  );

  const StepProperties: React.FC = () => {
    if (!selectedStep) return null;

    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-4">Step Properties</h3>
        <div className="space-y-4">
          <Input
            label="Name"
            value={selectedStep.name}
            onChange={(e) =>
              updateStep({
                ...selectedStep,
                name: e.target.value,
              })
            }
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={(selectedStep.type as EditorStepType) || 'action'}
              onChange={(e) =>
                updateStep({
                  ...selectedStep,
                  type: e.target.value as EditorStepType,
                })
              }
              className="w-full p-2 border rounded-md"
            >
              <option value="decision">Decision</option>
              <option value="action">Action</option>
              <option value="trigger">Trigger</option>
              <option value="end">End</option>
            </select>
          </div>
          <Button variant="destructive" onClick={() => deleteStep(selectedStep.id)}>
            Delete Step
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 bg-white border-b">
        <h2 className="text-xl font-semibold">Flow Editor</h2>
        <div className="flex space-x-2">
          <Button onClick={handleSave} variant="default">
            Save Flow
          </Button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 p-4 border-r overflow-y-auto space-y-4">
          <StepPalette />
          {selectedStep && <StepProperties />}
        </div>
        <div
          className="flex-1 relative bg-gray-50 bg-grid-pattern"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {flow.steps.map((step) => (
            <StepCard key={step.id} step={step} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlowEditor;
