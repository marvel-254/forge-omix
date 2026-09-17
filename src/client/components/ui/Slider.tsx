import { cn } from '@client/lib/utils'

interface SliderProps {
  value?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  showValue?: boolean
  disabled?: boolean
  className?: string
}

export function Slider({
  value = 50,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = false,
  disabled = false,
  className,
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className={cn(className)}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-neutral-700">{label}</label>
          {showValue && <span className="text-sm text-neutral-600">{value}</span>}
        </div>
      )}
      <input
        type="range"
        value={value}
        onChange={(e) => onChange?.(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={cn(
          'w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          'slider'
        )}
        style={{
          background: `linear-gradient(to right, #2563eb 0%, #2563eb ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
        }}
      />
    </div>
  )
}
