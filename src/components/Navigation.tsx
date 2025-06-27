'use client'

import React, { useState } from 'react'
import { Menu, X, Image, Zap, Filter, Grid, RefreshCw, Eye, Palette, Scissors, Layers, Type } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { id: 'compressor', label: 'Compressor', icon: Zap, shortLabel: 'Compress' },
    { id: 'resizer', label: 'Resizer', icon: Image, shortLabel: 'Resize' },
    { id: 'filter', label: 'Filters', icon: Filter, shortLabel: 'Filters' },
    { id: 'collage', label: 'Collage', icon: Grid, shortLabel: 'Collage' },
    { id: 'format', label: 'Convert', icon: RefreshCw, shortLabel: 'Convert' },
    { id: 'background', label: 'Background', icon: Layers, shortLabel: 'BG' },
    { id: 'analyzer', label: 'Analyze', icon: Eye, shortLabel: 'Analyze' },
    { id: 'palette', label: 'Colors', icon: Palette, shortLabel: 'Colors' },
    { id: 'cropper', label: 'Crop', icon: Scissors, shortLabel: 'Crop' },
    { id: 'text', label: 'Text', icon: Type, shortLabel: 'Text' },
  ]

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId)
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/95 dark:bg-gray-900/95">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <div className="w-14 h-12 sm:w-16 sm:h-14 rounded-lg flex items-center justify-center shadow-sm overflow-hidden">
              <img
                src="/logoo.png"
                alt="ImageXpert Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-grap-900">ImageXperT</h1>
              {/* <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">AI-Powered Image Suite</p> */}
            </div>
          </div>

          {/* Desktop Navigation - Horizontal Scroll */}
          <div className="hidden md:flex items-center flex-1 justify-center">
            <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide px-4 max-w-4xl">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`
                      relative px-3 py-2 text-sm font-medium transition-all duration-200 flex items-center space-x-2 whitespace-nowrap
                      ${isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                      }
                    `}
                  >
                    <Icon size={16} />
                    <span className="hidden lg:inline">{item.label}</span>
                    <span className="lg:hidden">{item.shortLabel}</span>

                    {/* Simple underline indicator */}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-gray-100 rounded-full" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tablet Navigation - Dropdown Style */}
          <div className="hidden sm:flex md:hidden items-center">
            <div className="relative">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="font-medium">
                  {navItems.find(item => item.id === activeTab)?.label || 'Tools'}
                </span>
                {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>

              {isMobileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.id

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={`
                          w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors
                          ${isActive
                            ? 'text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700'
                            : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }
                        `}
                      >
                        <Icon size={18} />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Theme Toggle and Mobile Menu */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />

            {/* Mobile menu button */}
            <div className="sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="sm:hidden py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`
                      relative flex flex-col items-center space-y-1 px-2 py-3 rounded-lg text-center transition-all duration-200
                      ${isActive
                        ? 'text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span className="text-xs font-medium">{item.shortLabel}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navigation 