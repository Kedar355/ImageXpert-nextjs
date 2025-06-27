'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'

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
      primary: 'bg-black hover:bg-gray-800 active:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 dark:active:bg-gray-200 text-white dark:text-black shadow-sm hover:shadow-md focus:ring-gray-500 dark:focus:ring-gray-400 border border-transparent',
      secondary: 'bg-black hover:bg-gray-800 active:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 dark:active:bg-gray-200 text-white dark:text-black shadow-sm hover:shadow-md focus:ring-gray-500 dark:focus:ring-gray-400 border border-transparent',
      outline: 'border-2 border-black dark:border-white text-black dark:text-white bg-transparent hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black active:bg-gray-900 dark:active:bg-gray-100 focus:ring-gray-500 dark:focus:ring-gray-400 shadow-sm',
      ghost: 'text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black active:bg-gray-900 dark:active:bg-gray-100 focus:ring-gray-500 dark:focus:ring-gray-400',
      danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 dark:bg-red-500 dark:hover:bg-red-600 dark:active:bg-red-700 text-white shadow-sm hover:shadow-md focus:ring-red-500 dark:focus:ring-red-400 border border-transparent'
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