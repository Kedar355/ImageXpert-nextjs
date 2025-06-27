'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Download, RotateCcw, Maximize, Square, Zap } from 'lucide-react'
// import Button from './ui/Button'
import Button from './Button'

interface ResizerState {
  originalImage: string | null
  resizedImage: string | null
  fileName: string
  originalDimensions: { width: number; height: number }
  newDimensions: { width: number; height: number }
  isProcessing: boolean
}

const presetSizes = [
  { label: 'Instagram Square', width: 1080, height: 1080, icon: '📷' },
  { label: 'Instagram Story', width: 1080, height: 1920, icon: '📱' },
  { label: 'Facebook Cover', width: 1200, height: 630, icon: '📘' },
  { label: 'Twitter Header', width: 1500, height: 500, icon: '🐦' },
  { label: 'LinkedIn Banner', width: 1584, height: 396, icon: '💼' },
  { label: 'YouTube Thumbnail', width: 1280, height: 720, icon: '▶️' },
  { label: 'Full HD', width: 1920, height: 1080, icon: '🖥️' },
  { label: '4K UHD', width: 3840, height: 2160, icon: '📺' },
  { label: 'Mobile Wallpaper', width: 1080, height: 2340, icon: '📱' },
  { label: 'Desktop Wallpaper', width: 2560, height: 1440, icon: '💻' },
]

const ImageResizer: React.FC = () => {
  const [state, setState] = useState<ResizerState>({
    originalImage: null,
    resizedImage: null,
    fileName: '',
    originalDimensions: { width: 0, height: 0 },
    newDimensions: { width: 0, height: 0 },
    isProcessing: false
  })

  const [customDimensions, setCustomDimensions] = useState({ width: 800, height: 600 })
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [resizeMode, setResizeMode] = useState<'fit' | 'fill' | 'stretch'>('fit')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setState(prev => ({ ...prev, isProcessing: true, fileName: file.name }))

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string

      const img = new Image()
      img.onload = () => {
        setState(prev => ({
          ...prev,
          originalImage: result,
          originalDimensions: { width: img.width, height: img.height },
          newDimensions: { width: img.width, height: img.height },
          isProcessing: false
        }))
        setCustomDimensions({ width: img.width, height: img.height })
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
    multiple: false
  })

  const applyPreset = (preset: typeof presetSizes[0]) => {
    setSelectedPreset(preset.label)
    setCustomDimensions({ width: preset.width, height: preset.height })
    setState(prev => ({
      ...prev,
      newDimensions: { width: preset.width, height: preset.height }
    }))
  }

  const handleCustomDimensionChange = (dimension: 'width' | 'height', value: number) => {
    if (maintainAspectRatio && state.originalDimensions.width && state.originalDimensions.height) {
      const aspectRatio = state.originalDimensions.width / state.originalDimensions.height

      if (dimension === 'width') {
        const newHeight = Math.round(value / aspectRatio)
        setCustomDimensions({ width: value, height: newHeight })
        setState(prev => ({ ...prev, newDimensions: { width: value, height: newHeight } }))
      } else {
        const newWidth = Math.round(value * aspectRatio)
        setCustomDimensions({ width: newWidth, height: value })
        setState(prev => ({ ...prev, newDimensions: { width: newWidth, height: value } }))
      }
    } else {
      setCustomDimensions(prev => ({ ...prev, [dimension]: value }))
      setState(prev => ({ ...prev, newDimensions: { ...prev.newDimensions, [dimension]: value } }))
    }
    setSelectedPreset(null)
  }

  const resizeImage = async () => {
    if (!state.originalImage) return

    setState(prev => ({ ...prev, isProcessing: true }))

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      const { width: newWidth, height: newHeight } = state.newDimensions

      canvas.width = newWidth
      canvas.height = newHeight

      // Fill with white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, newWidth, newHeight)

      let drawWidth = newWidth
      let drawHeight = newHeight
      let offsetX = 0
      let offsetY = 0

      if (resizeMode === 'fit') {
        // Maintain aspect ratio, fit within bounds
        const scale = Math.min(newWidth / img.width, newHeight / img.height)
        drawWidth = img.width * scale
        drawHeight = img.height * scale
        offsetX = (newWidth - drawWidth) / 2
        offsetY = (newHeight - drawHeight) / 2
      } else if (resizeMode === 'fill') {
        // Maintain aspect ratio, fill entire canvas
        const scale = Math.max(newWidth / img.width, newHeight / img.height)
        drawWidth = img.width * scale
        drawHeight = img.height * scale
        offsetX = (newWidth - drawWidth) / 2
        offsetY = (newHeight - drawHeight) / 2
      }
      // For 'stretch', use the full canvas dimensions (default values)

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)

      const resizedDataUrl = canvas.toDataURL('image/png', 0.95)
      setState(prev => ({
        ...prev,
        resizedImage: resizedDataUrl,
        isProcessing: false
      }))
    }
    img.src = state.originalImage
  }

  const handleDownload = () => {
    if (!state.resizedImage) return

    const link = document.createElement('a')
    link.href = state.resizedImage
    link.download = `resized-${state.fileName}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleReset = () => {
    setState({
      originalImage: null,
      resizedImage: null,
      fileName: '',
      originalDimensions: { width: 0, height: 0 },
      newDimensions: { width: 0, height: 0 },
      isProcessing: false
    })
    setCustomDimensions({ width: 800, height: 600 })
    setSelectedPreset(null)
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Maximize className="w-8 h-8 text-purple-600 mr-3" />
          <h1 className="text-3xl font-bold gradient-text">Image Resizer</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Resize your images to any dimension with precision. Choose from popular presets or set custom dimensions.
        </p>
      </div>

      <div className="grid xl:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload Image
          </h2>

          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
              ${isDragActive
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-300 hover:border-purple-400'
              }
            `}
          >
            <input {...getInputProps()} />

            {state.originalImage ? (
              <div className="space-y-4">
                <img
                  src={state.originalImage}
                  alt="Original"
                  className="max-h-40 mx-auto rounded-lg shadow-md"
                />
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{state.fileName}</p>
                  <p>{state.originalDimensions.width} × {state.originalDimensions.height} px</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-10 h-10 text-gray-400 mx-auto" />
                <div>
                  <p className="font-medium text-gray-700">
                    {isDragActive ? 'Drop the image here' : 'Drag & drop an image'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">or click to select</p>
                </div>
              </div>
            )}
          </div>

          {/* Resize Mode */}
          {state.originalImage && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resize Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'fit', label: 'Fit', desc: 'Maintain ratio, fit in bounds' },
                    { key: 'fill', label: 'Fill', desc: 'Maintain ratio, fill canvas' },
                    { key: 'stretch', label: 'Stretch', desc: 'Ignore ratio, stretch to fit' }
                  ].map((mode) => (
                    <button
                      key={mode.key}
                      onClick={() => setResizeMode(mode.key as any)}
                      className={`
                        p-2 text-xs rounded-lg border transition-all duration-200
                        ${resizeMode === mode.key
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-300 hover:border-purple-300'
                        }
                      `}
                    >
                      <div className="font-medium">{mode.label}</div>
                      <div>{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={resizeImage}
                loading={state.isProcessing}
                icon={Zap}
                className="w-full"
              >
                Resize Image
              </Button>
            </div>
          )}
        </div>

        {/* Presets & Custom Dimensions */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Square className="w-5 h-5 mr-2" />
            Dimensions
          </h2>

          {/* Preset Sizes */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-3">Popular Presets</h3>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {presetSizes.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border transition-all duration-200 text-left mr-2
                    ${selectedPreset === preset.label
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{preset.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{preset.label}</div>
                      <div className="text-xs text-gray-500">{preset.width} × {preset.height}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Dimensions */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Custom Dimensions</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Width (px)</label>
                <input
                  type="number"
                  value={customDimensions.width}
                  onChange={(e) => handleCustomDimensionChange('width', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height (px)</label>
                <input
                  type="number"
                  value={customDimensions.height}
                  onChange={(e) => handleCustomDimensionChange('height', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={maintainAspectRatio}
                onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Lock aspect ratio</span>
            </label>
          </div>
        </div>

        {/* Preview Section */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Download className="w-5 h-5 mr-2" />
            Preview & Download
          </h2>

          {state.isProcessing ? (
            <div className="flex items-center justify-center h-48">
              <div className="loading-dots text-purple-600"></div>
            </div>
          ) : state.resizedImage ? (
            <div className="space-y-6">
              <div className="text-center">
                <img
                  src={state.resizedImage}
                  alt="Resized"
                  className="max-h-48 mx-auto rounded-lg shadow-md border"
                />
                <p className="text-sm text-gray-600 mt-2">
                  {state.newDimensions.width} × {state.newDimensions.height} px
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-semibold text-gray-700">Original</p>
                  <p className="text-gray-600">
                    {state.originalDimensions.width} × {state.originalDimensions.height}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="font-semibold text-purple-700">Resized</p>
                  <p className="text-purple-600">
                    {state.newDimensions.width} × {state.newDimensions.height}
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleDownload}
                  icon={Download}
                  className="flex-1"
                >
                  Download
                </Button>
                <Button
                  onClick={handleReset}
                  icon={RotateCcw}
                >
                  Reset
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              <div className="text-center">
                <Maximize className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Upload and resize an image to see preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImageResizer 