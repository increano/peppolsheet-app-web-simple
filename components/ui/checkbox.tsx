"use client"

import * as React from "react"
import { Check } from "lucide-react"

interface CheckboxProps {
  id?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  defaultChecked?: boolean
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ id, checked, onCheckedChange, disabled, className = "", defaultChecked, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked || false)
    const isControlled = checked !== undefined
    const checkedValue = isControlled ? checked : internalChecked

    const handleChange = (newChecked: boolean) => {
      console.log('Checkbox handleChange called with:', newChecked, 'isControlled:', isControlled, 'current checkedValue:', checkedValue)
      if (!isControlled) {
        setInternalChecked(newChecked)
      }
      onCheckedChange?.(newChecked)
    }

    return (
      <div className="relative inline-flex items-center">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          checked={checkedValue}
          onChange={(e) => handleChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
        <div
          className={`
            h-4 w-4 rounded border-2 flex items-center justify-center cursor-pointer relative transition-all duration-200
            ${checkedValue 
              ? 'bg-blue-600 border-blue-600 shadow-sm' 
              : 'bg-white border-gray-300 hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-1'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
          `}
          onClick={() => !disabled && handleChange(!checkedValue)}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              !disabled && handleChange(!checkedValue)
            }
          }}
        >
          {checkedValue && (
            <svg 
              className="h-2.5 w-2.5 text-white flex-shrink-0 animate-in fade-in duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ strokeWidth: '2.5px' }}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          )}
        </div>
      </div>
    )
  }
)

Checkbox.displayName = "Checkbox" 