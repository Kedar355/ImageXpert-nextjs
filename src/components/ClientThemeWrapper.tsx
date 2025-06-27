'use client'

import { useEffect, useState } from 'react'
import { ThemeProvider } from '@/context/ThemeContext'

export function ClientThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  )
} 