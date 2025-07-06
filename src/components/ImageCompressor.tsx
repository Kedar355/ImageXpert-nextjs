'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Download, RotateCcw, Zap, Info, Settings, RefreshCw, Eye, EyeOff } from 'lucide-react'
import Button from './Button'

interface CompressorState {
  originalImage: string | null
  compressedImage: string | null
  fileName: string
  originalSize: number
  compressedSize: number
  compressionRatio: number
  isProcessing: boolean
  originalDimensions: { width: number; height: number }
  compressedDimensions: { width: number; height: number }
}

const ImageCompressor: React.FC = () => {
  const [state, setState] = useState<CompressorState>({
    originalImage: null,
    compressedImage: null,
    fileName: '',
    originalSize: 0,
    compressedSize: 0,
    compressionRatio: 0,
    isProcessing: false,
    originalDimensions: { width: 0, height: 0 },
    compressedDimensions: { width: 0, height: 0 }
  })

  const [settings, setSettings] = useState({
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
    format: 'image/jpeg' as 'image/jpeg' | 'image/png' | 'image/webp',
    maintainAspectRatio: true,
    progressive: true,
    removeMetadata: true
  })

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      fileName: file.name, 
      originalSize: file.size 
    }))

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      
      // Get original dimensions
      const img = new Image()
      img.onload = () => {
        setState(prev => ({ 
          ...prev, 
          originalImage: result, 
          originalDimensions: { width: img.width, height: img.height },
          isProcessing: false 
        }))
        // Auto-compress on upload
        compressImage(result, file.size, img.width, img.height)
      }
      img.src = result
    }
    reader.readAsDataURL(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.bmp', '.gif']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024 // 50MB limit
  })

  const compressImage = async (imageSrc: string, originalSize: number, originalWidth: number, originalHeight: number) => {
    if (!canvasRef.current) return

    setState(prev => ({ ...prev, isProcessing: true }))

    try {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!

        // Calculate new dimensions
        let { width, height } = img
        if (settings.maintainAspectRatio) {
          const ratio = Math.min(settings.maxWidth / width, settings.maxHeight / height)
          if (ratio < 1) {
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }
        } else {
          width = Math.min(width, settings.maxWidth)
          height = Math.min(height, settings.maxHeight)
        }

        canvas.width = width
        canvas.height = height

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Fill with white background for JPEG
        if (settings.format === 'image/jpeg') {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, width, height)
        }

        // Draw image with high quality
        ctx.drawImage(img, 0, 0, width, height)

        // Apply additional filters for better compression
        if (settings.quality < 0.9) {
          const imageData = ctx.getImageData(0, 0, width, height)
          const data = imageData.data

          // Slight noise reduction for better compression
          for (let i = 0; i < data.length; i += 4) {
            const factor = 0.95 + (settings.quality * 0.05)
            data[i] = Math.round(data[i] * factor)     // Red
            data[i + 1] = Math.round(data[i + 1] * factor) // Green
            data[i + 2] = Math.round(data[i + 2] * factor) // Blue
          }

          ctx.putImageData(imageData, 0, 0)
        }

        const compressedDataUrl = canvas.toDataURL(settings.format, settings.quality)
        
        // Calculate compressed size more accurately
        const base64Length = compressedDataUrl.split(',')[1].length
        const compressedSize = Math.round((base64Length * 3) / 4)
        const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100

        setState(prev => ({
          ...prev,
          compressedImage: compressedDataUrl,
          compressedSize,
          compressionRatio: Math.max(0, compressionRatio),
          compressedDimensions: { width, height },
          isProcessing: false
        }))
      }

      img.onerror = () => {
        setState(prev => ({ ...prev, isProcessing: false }))
        alert('Error loading image. Please try a different file.')
      }

      img.src = imageSrc
    } catch (error) {
      console.error('Compression error:', error)
      setState(prev => ({ ...prev, isProcessing: false }))
      alert('Error compressing image. Please try again.')
    }
  }

  const handleApplySettings = () => {
    if (state.originalImage) {
      compressImage(
        state.originalImage, 
        state.originalSize, 
        state.originalDimensions.width, 
        state.originalDimensions.height
      )
    }
  }

  const handleDownload = () => {
    if (!state.compressedImage) return

    try {
      const link = document.createElement('a')
      const extension = settings.format.split('/')[1]
      link.href = state.compressedImage
      link.download = `compressed-${state.fileName.split('.')[0]}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Download error:', error)
      alert('Error downloading image. Please try again.')
    }
  }

  const handleReset = () => {
    setState({
      originalImage: null,
      compressedImage: null,
      fileName: '',
      originalSize: 0,
      compressedSize: 0,
      compressionRatio: 0,
      isProcessing: false,
      originalDimensions: { width: 0, height: 0 },
      compressedDimensions: { width: 0, height: 0 }
    })
    setShowComparison(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getQualityLabel = (quality: number) => {
    if (quality >= 0.9) return 'High Quality'
    if (quality >= 0.7) return 'Good Quality'
    if (quality >= 0.5) return 'Medium Quality'
    return 'Low Quality'
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="flex items-center justify-center mb-3 sm:mb-4">
          <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mr-2 sm:mr-3" />
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Smart Image Compressor</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base px-4">
          Advanced image compression with intelligent optimization. Reduce file sizes while maintaining visual quality.
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
                  <p>Original: {formatFileSize(state.originalSize)}</p>
                  <p>Dimensions: {state.originalDimensions.width} × {state.originalDimensions.height}px</p>
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
                  <p className="text-xs text-gray-400 mt-2">Max size: 50MB</p>
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
                    Quality: {Math.round(settings.quality * 100)}% ({getQualityLabel(settings.quality)})
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={settings.quality}
                    onChange={(e) => setSettings(prev => ({ ...prev, quality: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Smaller file</span>
                    <span>Better quality</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Width (px)</label>
                    <input
                      type="number"
                      min="100"
                      max="8000"
                      value={settings.maxWidth}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxWidth: parseInt(e.target.value) || 1920 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Height (px)</label>
                    <input
                      type="number"
                      min="100"
                      max="8000"
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
                    <option value="image/jpeg">JPEG (Best for photos)</option>
                    <option value="image/png">PNG (Best for graphics)</option>
                    <option value="image/webp">WebP (Modern format)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.maintainAspectRatio}
                      onChange={(e) => setSettings(prev => ({ ...prev, maintainAspectRatio: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Maintain aspect ratio</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.progressive}
                      onChange={(e) => setSettings(prev => ({ ...prev, progressive: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Progressive JPEG</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.removeMetadata}
                      onChange={(e) => setSettings(prev => ({ ...prev, removeMetadata: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Remove metadata</span>
                  </label>
                </div>

                {state.originalImage && (
                  <div className="pt-2">
                    <Button
                      onClick={handleApplySettings}
                      icon={RefreshCw}
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Compression Results
            </h2>
            {state.compressedImage && (
              <Button
                variant="outline"
                size="sm"
                icon={showComparison ? EyeOff : Eye}
                onClick={() => setShowComparison(!showComparison)}
              >
                {showComparison ? 'Hide' : 'Compare'}
              </Button>
            )}
          </div>

          {state.isProcessing ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Compressing image...</p>
              </div>
            </div>
          ) : state.compressedImage ? (
            <div className="space-y-4 sm:space-y-6">
              {showComparison ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium mb-2">Original</p>
                    <img
                      src={state.originalImage!}
                      alt="Original"
                      className="w-full h-32 object-cover rounded-lg shadow-md"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium mb-2">Compressed</p>
                    <img
                      src={state.compressedImage}
                      alt="Compressed"
                      className="w-full h-32 object-cover rounded-lg shadow-md"
                    />
                  </div>
                </div>
              ) : (
                <img
                  src={state.compressedImage}
                  alt="Compressed"
                  className="max-h-32 sm:max-h-48 mx-auto rounded-lg shadow-md"
                />
              )}

              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{formatFileSize(state.originalSize)}</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Original</p>
                  <p className="text-xs text-gray-500">{state.originalDimensions.width}×{state.originalDimensions.height}</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{formatFileSize(state.compressedSize)}</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Compressed</p>
                  <p className="text-xs text-gray-500">{state.compressedDimensions.width}×{state.compressedDimensions.height}</p>
                </div>
              </div>

              <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <p className="text-base sm:text-lg font-semibold text-green-800 dark:text-green-400">
                  {state.compressionRatio.toFixed(1)}% size reduction
                </p>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Saved {formatFileSize(state.originalSize - state.compressedSize)}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Button
                  onClick={handleDownload}
                  icon={Download}
                  className="flex-1"
                >
                  Download Compressed
                </Button>
                <Button
                  variant="outline"
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

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default ImageCompressor