'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Download, RotateCcw, Zap, Info, Settings, RefreshCw } from 'lucide-react'
// import Button from './ui/Button'
import Button from './Button'
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";


interface CompressorState {
  originalImage: string | null
  compressedImage: string | null
  fileName: string
  originalSize: number
  compressedSize: number
  compressionRatio: number
  isProcessing: boolean
}

const ImageCompressor: React.FC = () => {
  const [state, setState] = useState<CompressorState>({
    originalImage: null,
    compressedImage: null,
    fileName: '',
    originalSize: 0,
    compressedSize: 0,
    compressionRatio: 0,
    isProcessing: false
  })

  const [settings, setSettings] = useState({
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
    format: 'image/jpeg' as 'image/jpeg' | 'image/png' | 'image/webp',
    maintainAspectRatio: true
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setState(prev => ({ ...prev, isProcessing: true, fileName: file.name, originalSize: file.size }))

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setState(prev => ({ ...prev, originalImage: result, isProcessing: false }))
      // Auto-compress on upload
      compressImage(result, file.size)
    }
    reader.readAsDataURL(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.bmp', '.gif']
    },
    multiple: false
  })

  const compressImage = async (imageSrc: string, originalSize: number) => {
    setState(prev => ({ ...prev, isProcessing: true }))

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      // Calculate new dimensions
      let { width, height } = img
      if (settings.maintainAspectRatio) {
        const ratio = Math.min(settings.maxWidth / width, settings.maxHeight / height)
        if (ratio < 1) {
          width *= ratio
          height *= ratio
        }
      } else {
        width = Math.min(width, settings.maxWidth)
        height = Math.min(height, settings.maxHeight)
      }

      canvas.width = width
      canvas.height = height

      // Apply compression
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)

      const compressedDataUrl = canvas.toDataURL(settings.format, settings.quality)
      const compressedSize = Math.round((compressedDataUrl.length * 3) / 4)
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100

      setState(prev => ({
        ...prev,
        compressedImage: compressedDataUrl,
        compressedSize,
        compressionRatio,
        isProcessing: false
      }))
    }
    img.src = imageSrc
  }

  const handleApplySettings = () => {
    if (state.originalImage) {
      compressImage(state.originalImage, state.originalSize)
    }
  }

  const handleDownload = () => {
    if (!state.compressedImage) return

    const link = document.createElement('a')
    link.href = state.compressedImage
    link.download = `compressed-${state.fileName}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleReset = () => {
    setState({
      originalImage: null,
      compressedImage: null,
      fileName: '',
      originalSize: 0,
      compressedSize: 0,
      compressionRatio: 0,
      isProcessing: false
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="flex items-center justify-center mb-3 sm:mb-4">
          <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mr-2 sm:mr-3" />
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Image Compressor</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base px-4">
          Reduce your image file sizes while maintaining quality. Perfect for web optimization and storage savings.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Upload Section */}
        <div className="glass-card p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center">
            <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Upload Image
          </h2>

          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all duration-200 cursor-pointer
              ${isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }
            `}
          >
            <input {...getInputProps()} />

            {state.originalImage ? (
              <div className="space-y-4">
                <img
                  src={state.originalImage}
                  alt="Original"
                  className="max-h-32 sm:max-h-48 mx-auto rounded-lg shadow-md"
                />
                <div className="text-sm text-gray-600">
                  <p className="font-medium truncate px-4">{state.fileName}</p>
                  <p>Original size: {formatFileSize(state.originalSize)}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-base sm:text-lg font-medium text-gray-700">
                    {isDragActive ? 'Drop the image here' : 'Drag & drop an image here'}
                  </p>
                  <p className="text-gray-500 mt-1 text-sm sm:text-base">or click to select a file</p>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="mt-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-4 w-full sm:w-auto"
            >
              <Settings className="w-4 h-4 mr-2" />
              Advanced Settings
              <span className="ml-2">{showAdvanced ? '▼' : '▶'}</span>
            </button>

            {showAdvanced && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quality: {Math.round(settings.quality * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={settings.quality}
                    onChange={(e) => setSettings(prev => ({ ...prev, quality: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Width</label>
                    <input
                      type="number"
                      value={settings.maxWidth}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxWidth: parseInt(e.target.value) || 1920 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Height</label>
                    <input
                      type="number"
                      value={settings.maxHeight}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxHeight: parseInt(e.target.value) || 1080 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Output Format</label>
                  <select
                    value={settings.format}
                    onChange={(e) => setSettings(prev => ({ ...prev, format: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/png">PNG</option>
                    <option value="image/webp">WebP</option>
                  </select>
                </div>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.maintainAspectRatio}
                    onChange={(e) => setSettings(prev => ({ ...prev, maintainAspectRatio: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Maintain aspect ratio</span>
                </label>

                {/* Apply Settings Button */}
                {state.originalImage && (
                  <div className="pt-2">
                    <Button
                      onClick={handleApplySettings}
                      // icon={RefreshCw}
                      disabled={state.isProcessing}
                      className="w-full sm:w-auto"
                    >
                      {state.isProcessing ? 'Applying...' : 'Apply Settings'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="glass-card p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Compression Results
          </h2>

          {state.isProcessing ? (
            <div className="flex items-center justify-center h-48">
              <div className="loading-dots text-blue-600"></div>
            </div>
          ) : state.compressedImage ? (
            <div className="space-y-4 sm:space-y-6">
              <img
                src={state.compressedImage}
                alt="Compressed"
                className="max-h-32 sm:max-h-48 mx-auto rounded-lg shadow-md"
              />

              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{formatFileSize(state.originalSize)}</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Original</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{formatFileSize(state.compressedSize)}</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Compressed</p>
                </div>
              </div>

              <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <p className="text-base sm:text-lg font-semibold text-green-800 dark:text-green-400">
                  {state.compressionRatio.toFixed(1)}% reduction
                </p>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Saved {formatFileSize(state.originalSize - state.compressedSize)}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Button
                  onClick={handleDownload}
                  className="flex-1"
                >
                  Download
                </Button>
                <Button
                  onClick={handleReset}
                  icon={RotateCcw}
                  className="sm:flex-none"
                >
                  Reset
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              <div className="text-center">
                <Zap className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Upload an image to see compression results</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImageCompressor 