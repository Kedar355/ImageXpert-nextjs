'use client'

import React from 'react'
import { DivideIcon as LucideIcon } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  loading?: boolean
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    children,
    className = '',
    disabled,
    ...props
  }, ref) => {
    const baseClasses = 'relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-gray-900 text-white border border-gray-900 shadow-sm focus:ring-gray-500',
      secondary: 'bg-gray-100 text-gray-900 border border-gray-300 shadow-sm focus:ring-gray-500',
      outline: 'border-2 border-gray-900 text-gray-900 bg-transparent shadow-sm focus:ring-gray-500',
      ghost: 'text-gray-900 bg-transparent focus:ring-gray-500',
      danger: 'bg-red-600 text-white border border-red-600 shadow-sm focus:ring-red-500'
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5 min-h-[32px]',
      md: 'px-4 py-2 text-sm gap-2 min-h-[40px]',
      lg: 'px-6 py-3 text-base gap-2.5 min-h-[44px]'
    }

    const iconSizes = {
      sm: 16,
      md: 18,
      lg: 20
    }

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
            <span>Loading...</span>
          </div>
        )}

        {!loading && (
          <>
            {Icon && iconPosition === 'left' && (
              <Icon size={iconSizes[size]} className="text-current" />
            )}

            <span>{children}</span>

            {Icon && iconPosition === 'right' && (
              <Icon size={iconSizes[size]} className="text-current" />
            )}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button