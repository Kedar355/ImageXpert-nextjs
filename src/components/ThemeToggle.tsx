'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme()

  // Don't render the theme toggle until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="flex items-center">
        <div className="relative p-2 rounded-lg bg-gray-200 dark:bg-gray-800 w-9 h-9" />
      </div>
    )
  }

  return (
    <div className="flex items-center">
      <button
        onClick={toggleTheme}
        className="relative p-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 border border-gray-300 dark:border-gray-600"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        <div className="relative w-5 h-5">
          <Sun
            className={`absolute inset-0 transition-all duration-300 ${theme === 'light'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 rotate-90 scale-0'
              }`}
            size={20}
          />
          <Moon
            className={`absolute inset-0 transition-all duration-300 ${theme === 'dark'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-0'
              }`}
            size={20}
          />
        </div>
      </button>
    </div>
  )
} 