import { cn } from '@client/lib/utils'

interface FileInputProps {
  accept?: string
  multiple?: boolean
  onChange?: (files: FileList | null) => void
  disabled?: boolean
  label?: string
  required?: boolean
  className?: string
  id?: string
  dragActive?: boolean
}

export function FileInput({
  accept,
  multiple = false,
  onChange,
  disabled = false,
  label,
  required,
  className,
  id,
}: FileInputProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer?.files) {
      onChange?.(e.dataTransfer.files)
    }
  }

  return (
    <div className={cn(className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-neutral-300 hover:border-neutral-400'
        )}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => onChange?.(e.target.files)}
          disabled={disabled}
          required={required}
          className="hidden"
          id={id}
        />
        <div className="text-neutral-600">
          <p className="font-medium">Drop files here or click to select</p>
          {accept && <p className="text-xs text-neutral-500 mt-1">{accept}</p>}
        </div>
      </div>
    </div>
  )
}

import * as React from 'react'
