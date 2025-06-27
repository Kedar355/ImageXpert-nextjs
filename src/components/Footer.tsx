'use client'

import React from 'react'
import { Heart, ExternalLink, Github, Globe } from 'lucide-react'

const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-white/20 dark:border-gray-700/20 glass-effect">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Attribution */}
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>by</span>
            <a
              href="https://kedar355.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 flex items-center space-x-1"
            >
              <span>Kedar</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-4">
            <a
              href="https://kedar355.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm">Portfolio</span>
            </a>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} ImageXperT
            </span>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-4 pt-4 border-t border-white/10 dark:border-gray-700/10 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            A modern, client-side image processing suite. All processing happens locally in your browser -
            your images never leave your device, ensuring complete privacy and security.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer 