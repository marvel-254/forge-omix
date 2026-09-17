import { cn } from '@client/lib/utils'

interface StepperProps {
  steps: string[]
  currentStep: number
  onStepClick?: (step: number) => void
  variant?: 'default' | 'vertical'
  className?: string
}

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  variant = 'default',
  className,
}: StepperProps) {
  const isVertical = variant === 'vertical'

  return (
    <div
      className={cn(
        isVertical ? 'flex flex-col' : 'flex items-center',
        className
      )}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep
        const isNext = index > currentStep

        return (
          <div
            key={index}
            className={cn(
              isVertical ? 'flex gap-4 mb-8 relative' : 'flex items-center',
              index !== steps.length - 1 && 'flex-1'
            )}
          >
            {/* Step circle */}
            <button
              onClick={() => onStepClick?.(index)}
              disabled={isNext}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all flex-shrink-0',
                isCompleted && 'bg-green-600 text-white',
                isActive && 'bg-blue-600 text-white ring-2 ring-blue-300',
                isNext && 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
              )}
            >
              {isCompleted ? '✓' : index + 1}
            </button>

            {/* Step label */}
            <div className={cn(isVertical ? 'absolute left-12 top-0' : 'ml-3')}>
              <p className={cn(
                'text-sm font-medium',
                isActive ? 'text-neutral-900' : 'text-neutral-600'
              )}>
                {step}
              </p>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  isVertical ? 'absolute left-5 top-10 w-0.5 h-12' : 'h-0.5 flex-1 mx-2',
                  isCompleted ? 'bg-green-600' : 'bg-neutral-200'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
