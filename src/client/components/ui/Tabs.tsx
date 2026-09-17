import { type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@client/lib/utils'

const tabsVariants = cva('', {
  variants: {
    variant: {
      default: 'border-b border-neutral-200',
      pill: 'gap-2',
      underline: '',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const tabTriggerVariants = cva(
  'px-4 py-2 font-medium text-sm transition-colors relative',
  {
    variants: {
      variant: {
        default:
          'text-neutral-600 hover:text-neutral-900 data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:-mb-[2px]',
        pill: 'rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white',
        underline:
          'text-neutral-600 hover:text-neutral-900 data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-blue-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export type TabsVariants = VariantProps<typeof tabsVariants>

interface Tab {
  value: string
  label: ReactNode
  content: ReactNode
  disabled?: boolean
}

interface TabsProps {
  tabs: Tab[]
  variant?: TabsVariants['variant']
  defaultValue?: string
  onChange?: (value: string) => void
  className?: string
}

export function Tabs({
  tabs,
  variant,
  defaultValue,
  onChange,
  className,
}: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue ?? tabs[0]?.value ?? '')

  const handleChange = (value: string) => {
    setActiveTab(value)
    onChange?.(value)
  }

  const activeTabContent = tabs.find((t) => t.value === activeTab)?.content

  return (
    <div className={cn(tabsVariants({ variant }), className)}>
      <div className="flex" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={activeTab === tab.value}
            aria-disabled={tab.disabled}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && handleChange(tab.value)}
            data-state={activeTab === tab.value ? 'active' : 'inactive'}
            className={cn(tabTriggerVariants({ variant }), tab.disabled && 'opacity-50 cursor-not-allowed')}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{activeTabContent}</div>
    </div>
  )
}

import * as React from 'react'