'use client'

import { useState } from 'react'
import Navigation from '@/components/Navigation'
import ImageCompressor from '@/components/ImageCompressor'
import ImageResizer from '@/components/ImageResizer'
import ImageFilterEditor from '@/components/ImageFilterEditor'
import ImageCollageMaker from '@/components/ImageCollageMaker'
import FormatConverter from '@/components/FormatConverter'
import BackgroundRemover from '@/components/BackgroundRemover'
import ImageAnalyzer from '@/components/ImageAnalyzer'
import ColorExtractor from '@/components/ColorExtractor'
import SmartCropper from '@/components/SmartCropper'
import TextOverlay from '@/components/TextOverlay'
import Footer from '@/components/Footer'
import { GridPattern } from '@/components/magicui/grid-pattern'

export default function Home() {
  const [activeTab, setActiveTab] = useState('compressor')

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'compressor':
        return <ImageCompressor />
      case 'resizer':
        return <ImageResizer />
      case 'filter':
        return <ImageFilterEditor />
      case 'collage':
        return <ImageCollageMaker />
      case 'format':
        return <FormatConverter />
      case 'background':
        return <BackgroundRemover />
      case 'analyzer':
        return <ImageAnalyzer />
      case 'palette':
        return <ColorExtractor />
      case 'cropper':
        return <SmartCropper />
      case 'text':
        return <TextOverlay />
      default:
        return <ImageCompressor />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col relative overflow-hidden transition-colors duration-300">
      <GridPattern
        width={60}
        height={60}
        x={-1}
        squares={[
          [4, 4],
          [5, 1],
          [8, 2],
          [5, 6],
          [10, 3],
          [12, 1],
          [4, 9],
          [15, 7],
          [2, 8],
          [7, 11],
          [13, 5],
          [18, 4],
          [6, 13],
          [20, 9],
          [3, 15],
          [16, 12],
          [9, 6],
          [14, 14],
          [11, 8],
          [17, 2],
        ]}
        y={-1}
        strokeDasharray="0"
        className="absolute inset-0 h-full w-full fill-gray-400/20 stroke-gray-400/20 dark:fill-gray-600/20 dark:stroke-gray-600/20 transform -skew-y-12"
      />

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 py-8 relative z-10">
        {renderActiveComponent()}
      </main>

      <Footer />
    </div>
  )
}
