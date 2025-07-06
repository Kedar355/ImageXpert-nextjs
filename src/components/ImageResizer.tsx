'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Download, RotateCcw, Maximize, Square, Zap, Settings, Eye } from 'lucide-react'
import Button from './Button'

interface ResizerState {
  originalImage: string | null
  resizedImage: string | null
  fileName: string
  originalDimensions: { width: number; height: number }
  newDimensions: { width: number; height: number }
  isProcessing: boolean
  fileSize: { original: number; resized: number }
}

interface ResizeSettings {
  algorithm: 'bicubic' | 'bilinear' | 'nearest'
  quality: number
  format: 'png' | 'jpeg' | 'webp'
  maintainAspectRatio: boolean
  resizeMode: 'fit' | 'fill' | 'stretch' | 'crop'
  backgroundColor: string
  sharpen: number
}

const presetSizes = [
  { label: 'Instagram Square', width: 1080, height: 1080, icon: '📷', category: 'social' },
  { label: 'Instagram Story', width: 1080, height: 1920, icon: '📱', category: 'social' },
  { label: 'Instagram Post', width: 1080, height: 1350, icon: '📸', category: 'social' },
  { label: 'Facebook Cover', width: 1200, height: 630, icon: '📘', category: 'social' },
  { label: 'Facebook Post', width: 1200, height: 630, icon: '👥', category: 'social' },
  { label: 'Twitter Header', width: 1500, height: 500, icon: '🐦', category: 'social' },
  { label: 'Twitter Post', width: 1200, height: 675, icon: '🔄', category: 'social' },
  { label: 'LinkedIn Banner', width: 1584, height: 396, icon: '💼', category: 'social' },
  { label: 'YouTube Thumbnail', width: 1280, height: 720, icon: '▶️', category: 'video' },
  { label: 'YouTube Banner', width: 2560, height: 1440, icon: '📺', category: 'video' },
  { label: 'HD (720p)', width: 1280, height: 720, icon: '🖥️', category: 'screen' },
  { label: 'Full HD (1080p)', width: 1920, height: 1080, icon: '📺', category: 'screen' },
  { label: '4K UHD', width: 3840, height: 2160, icon: '🎬', category: 'screen' },
  { label: '8K UHD', width: 7680, height: 4320, icon: '🎭', category: 'screen' },
  { label: 'Mobile Wallpaper', width: 1080, height: 2340, icon: '📱', category: 'wallpaper' },
  { label: 'Desktop Wallpaper', width: 2560, height: 1440, icon: '💻', category: 'wallpaper' },
  { label: 'Print 4x6', width: 1800, height: 1200, icon: '🖼️', category: 'print' },
  { label: 'Print 8x10', width: 3000, height: 2400, icon: '🖼️', category: 'print' },
  { label: 'A4 Print', width: 2480, height: 3508, icon: '📄', category: 'print' },
  { label: 'Business Card', width: 1050, height: 600, icon: '💳', category: 'print' },
]

const ImageResizer: React.FC = () => {
  const [state, setState] = useState<ResizerState>({
    originalImage: null,
    resizedImage: null,
    fileName: '',
    originalDimensions: { width: 0, height: 0 },
    newDimensions: { width: 0, height: 0 },
    isProcessing: false,
    fileSize: { original: 0, resized: 0 }
  })

  const [customDimensions, setCustomDimensions] = useState({ width: 800, height: 600 })
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('social')
  const [showComparison, setShowComparison] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [settings, setSettings] = useState<ResizeSettings>({
    algorithm: 'bicubic',
    quality: 0.9,
    format: 'png',
    maintainAspectRatio: true,
    resizeMode: 'fit',
    backgroundColor: '#ffffff',
    sharpen: 0
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tempCanvasRef = useRef<HTMLCanvasElement>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      fileName: file.name,
      fileSize: { ...prev.fileSize, original: file.size }
    }))

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
    multiple: false,
    maxSize: 50 * 1024 * 1024
  })

  // Advanced bicubic interpolation
  const bicubicInterpolation = (src: ImageData, dest: ImageData) => {
    const srcData = src.data
    const destData = dest.data
    const srcWidth = src.width
    const srcHeight = src.height
    const destWidth = dest.width
    const destHeight = dest.height

    const scaleX = srcWidth / destWidth
    const scaleY = srcHeight / destHeight

    for (let destY = 0; destY < destHeight; destY++) {
      for (let destX = 0; destX < destWidth; destX++) {
        const srcX = destX * scaleX
        const srcY = destY * scaleY

        const x = Math.floor(srcX)
        const y = Math.floor(srcY)
        const dx = srcX - x
        const dy = srcY - y

        const destIdx = (destY * destWidth + destX) * 4

        for (let channel = 0; channel < 4; channel++) {
          let value = 0

          // Bicubic interpolation using 16 surrounding pixels
          for (let j = -1; j <= 2; j++) {
            for (let i = -1; i <= 2; i++) {
              const px = Math.max(0, Math.min(srcWidth - 1, x + i))
              const py = Math.max(0, Math.min(srcHeight - 1, y + j))
              const srcIdx = (py * srcWidth + px) * 4 + channel

              const wx = cubicWeight(dx - i)
              const wy = cubicWeight(dy - j)
              value += srcData[srcIdx] * wx * wy
            }
          }

          destData[destIdx + channel] = Math.max(0, Math.min(255, Math.round(value)))
        }
      }
    }
  }

  const cubicWeight = (t: number): number => {
    const absT = Math.abs(t)
    if (absT <= 1) {
      return 1.5 * absT * absT * absT - 2.5 * absT * absT + 1
    } else if (absT <= 2) {
      return -0.5 * absT * absT * absT + 2.5 * absT * absT - 4 * absT + 2
    }
    return 0
  }

  // Sharpening filter
  const applySharpen = (imageData: ImageData, amount: number) => {
    if (amount === 0) return imageData

    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    const result = new ImageData(width, height)
    const resultData = result.data

    // Sharpening kernel
    const kernel = [
      0, -amount, 0,
      -amount, 1 + 4 * amount, -amount,
      0, -amount, 0
    ]

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4

        for (let channel = 0; channel < 3; channel++) {
          let value = 0
          let kernelIdx = 0

          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const pixelIdx = ((y + ky) * width + (x + kx)) * 4 + channel
              value += data[pixelIdx] * kernel[kernelIdx]
              kernelIdx++
            }
          }

          resultData[idx + channel] = Math.max(0, Math.min(255, value))
        }
        resultData[idx + 3] = data[idx + 3] // Alpha channel
      }
    }

    // Copy edges
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          const idx = (y * width + x) * 4
          for (let channel = 0; channel < 4; channel++) {
            resultData[idx + channel] = data[idx + channel]
          }
        }
      }
    }

    return result
  }

  const applyPreset = (preset: typeof presetSizes[0]) => {
    setSelectedPreset(preset.label)
    setCustomDimensions({ width: preset.width, height: preset.height })
    setState(prev => ({
      ...prev,
      newDimensions: { width: preset.width, height: preset.height }
    }))
  }

  const handleCustomDimensionChange = (dimension: 'width' | 'height', value: number) => {
    if (settings.maintainAspectRatio && state.originalDimensions.width && state.originalDimensions.height) {
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
    if (!state.originalImage || !canvasRef.current) return

    setState(prev => ({ ...prev, isProcessing: true }))

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')!
      const tempCanvas = tempCanvasRef.current!
      const tempCtx = tempCanvas.getContext('2d')!

      const img = new Image()
      img.onload = () => {
        const { width: newWidth, height: newHeight } = state.newDimensions

        canvas.width = newWidth
        canvas.height = newHeight

        // Fill with background color
        ctx.fillStyle = settings.backgroundColor
        ctx.fillRect(0, 0, newWidth, newHeight)

        let drawWidth = newWidth
        let drawHeight = newHeight
        let offsetX = 0
        let offsetY = 0

        if (settings.resizeMode === 'fit') {
          // Maintain aspect ratio, fit within bounds
          const scale = Math.min(newWidth / img.width, newHeight / img.height)
          drawWidth = img.width * scale
          drawHeight = img.height * scale
          offsetX = (newWidth - drawWidth) / 2
          offsetY = (newHeight - drawHeight) / 2
        } else if (settings.resizeMode === 'fill') {
          // Maintain aspect ratio, fill entire canvas
          const scale = Math.max(newWidth / img.width, newHeight / img.height)
          drawWidth = img.width * scale
          drawHeight = img.height * scale
          offsetX = (newWidth - drawWidth) / 2
          offsetY = (newHeight - drawHeight) / 2
        } else if (settings.resizeMode === 'crop') {
          // Crop to fit exactly
          const scale = Math.max(newWidth / img.width, newHeight / img.height)
          const scaledWidth = img.width * scale
          const scaledHeight = img.height * scale
          
          tempCanvas.width = scaledWidth
          tempCanvas.height = scaledHeight
          tempCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight)
          
          const cropX = (scaledWidth - newWidth) / 2
          const cropY = (scaledHeight - newHeight) / 2
          
          ctx.drawImage(tempCanvas, cropX, cropY, newWidth, newHeight, 0, 0, newWidth, newHeight)
        }

        if (settings.resizeMode !== 'crop') {
          // Enable high-quality scaling
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'

          if (settings.algorithm === 'bicubic' && (drawWidth !== img.width || drawHeight !== img.height)) {
            // Use custom bicubic interpolation for better quality
            tempCanvas.width = img.width
            tempCanvas.height = img.height
            tempCtx.drawImage(img, 0, 0)
            const srcImageData = tempCtx.getImageData(0, 0, img.width, img.height)

            const destImageData = ctx.createImageData(Math.round(drawWidth), Math.round(drawHeight))
            bicubicInterpolation(srcImageData, destImageData)

            const resizedCanvas = document.createElement('canvas')
            const resizedCtx = resizedCanvas.getContext('2d')!
            resizedCanvas.width = Math.round(drawWidth)
            resizedCanvas.height = Math.round(drawHeight)
            resizedCtx.putImageData(destImageData, 0, 0)

            ctx.drawImage(resizedCanvas, offsetX, offsetY)
          } else {
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
          }
        }

        // Apply sharpening if needed
        if (settings.sharpen > 0) {
          const imageData = ctx.getImageData(0, 0, newWidth, newHeight)
          const sharpenedData = applySharpen(imageData, settings.sharpen / 100)
          ctx.putImageData(sharpenedData, 0, 0)
        }

        const format = settings.format === 'jpeg' ? 'image/jpeg' : 
                      settings.format === 'webp' ? 'image/webp' : 'image/png'
        const resizedDataUrl = canvas.toDataURL(format, settings.quality)

        // Calculate file size
        const base64Length = resizedDataUrl.split(',')[1].length
        const resizedSize = Math.round((base64Length * 3) / 4)

        setState(prev => ({
          ...prev,
          resizedImage: resizedDataUrl,
          fileSize: { ...prev.fileSize, resized: resizedSize },
          isProcessing: false
        }))
      }

      img.onerror = () => {
        setState(prev => ({ ...prev, isProcessing: false }))
        alert('Error loading image. Please try again.')
      }

      img.src = state.originalImage
    } catch (error) {
      console.error('Resize error:', error)
      setState(prev => ({ ...prev, isProcessing: false }))
      alert('Error resizing image. Please try again.')
    }
  }

  const handleDownload = () => {
    if (!state.resizedImage) return

    try {
      const link = document.createElement('a')
      const extension = settings.format
      link.download = `resized-${state.fileName.split('.')[0]}.${extension}`
      link.href = state.resizedImage
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  const handleReset = () => {
    setState({
      originalImage: null,
      resizedImage: null,
      fileName: '',
      originalDimensions: { width: 0, height: 0 },
      newDimensions: { width: 0, height: 0 },
      isProcessing: false,
      fileSize: { original: 0, resized: 0 }
    })
    setCustomDimensions({ width: 800, height: 600 })
    setSelectedPreset(null)
    setShowComparison(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const categories = [...new Set(presetSizes.map(p => p.category))]

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Maximize className="w-8 h-8 text-purple-600 mr-3" />
          <h1 className="text-3xl font-bold gradient-text">Advanced Image Resizer</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Professional image resizing with advanced algorithms, smart cropping, and format optimization.
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
                  <p>{formatFileSize(state.fileSize.original)}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-10 h-10 text-gray-400 mx-auto" />
                <div>
                  <p className="font-medium text-gray-700">
                    {isDragActive ? 'Drop the image here' : 'Drag & drop an image'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">or click to select (Max: 50MB)</p>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Settings */}
          {state.originalImage && (
            <div className="mt-6 space-y-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center text-purple-600 hover:text-purple-700 font-medium"
              >
                <Settings className="w-4 h-4 mr-2" />
                Advanced Settings
                <span className="ml-2">{showAdvanced ? '▼' : '▶'}</span>
              </button>

              {showAdvanced && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium mb-2">Resize Algorithm</label>
                    <select
                      value={settings.algorithm}
                      onChange={(e) => setSettings(prev => ({ ...prev, algorithm: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="bicubic">Bicubic (Best Quality)</option>
                      <option value="bilinear">Bilinear (Balanced)</option>
                      <option value="nearest">Nearest Neighbor (Fastest)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Resize Mode</label>
                    <select
                      value={settings.resizeMode}
                      onChange={(e) => setSettings(prev => ({ ...prev, resizeMode: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="fit">Fit (Maintain ratio, fit in bounds)</option>
                      <option value="fill">Fill (Maintain ratio, fill canvas)</option>
                      <option value="stretch">Stretch (Ignore ratio)</option>
                      <option value="crop">Crop (Smart crop to exact size)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Output Format</label>
                    <select
                      value={settings.format}
                      onChange={(e) => setSettings(prev => ({ ...prev, format: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="png">PNG (Lossless)</option>
                      <option value="jpeg">JPEG (Smaller file)</option>
                      <option value="webp">WebP (Modern format)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Quality: {Math.round(settings.quality * 100)}%</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={settings.quality}
                      onChange={(e) => setSettings(prev => ({ ...prev, quality: Number(e.target.value) }))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Sharpening: {settings.sharpen}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.sharpen}
                      onChange={(e) => setSettings(prev => ({ ...prev, sharpen: Number(e.target.value) }))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Background Color</label>
                    <input
                      type="color"
                      value={settings.backgroundColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                  </div>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.maintainAspectRatio}
                      onChange={(e) => setSettings(prev => ({ ...prev, maintainAspectRatio: e.target.checked }))}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm">Lock aspect ratio</span>
                  </label>
                </div>
              )}

              <Button
                onClick={resizeImage}
                loading={state.isProcessing}
                icon={Zap}
                className="w-full"
                disabled={!state.originalImage}
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

          {/* Category Filter */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    px-3 py-1 text-sm rounded-lg transition-all duration-200 capitalize
                    ${selectedCategory === category
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }
                  `}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Sizes */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-3">Preset Sizes</h3>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {presetSizes
                .filter(preset => preset.category === selectedCategory)
                .map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => applyPreset(preset)}
                    disabled={!state.originalImage}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border transition-all duration-200 text-left
                      ${selectedPreset === preset.label
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed'
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
                  min="1"
                  max="10000"
                  value={customDimensions.width}
                  onChange={(e) => handleCustomDimensionChange('width', parseInt(e.target.value) || 0)}
                  disabled={!state.originalImage}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height (px)</label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={customDimensions.height}
                  onChange={(e) => handleCustomDimensionChange('height', parseInt(e.target.value) || 0)}
                  disabled={!state.originalImage}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                />
              </div>
            </div>

            {state.originalDimensions.width > 0 && (
              <div className="text-sm text-gray-600">
                <p>Original: {state.originalDimensions.width} × {state.originalDimensions.height}</p>
                <p>Scale: {((state.newDimensions.width / state.originalDimensions.width) * 100).toFixed(1)}%</p>
              </div>
            )}
          </div>
        </div>

        {/* Preview Section */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Preview & Download
            </h2>
            {state.resizedImage && (
              <Button
                variant="outline"
                size="sm"
                icon={Eye}
                onClick={() => setShowComparison(!showComparison)}
              >
                {showComparison ? 'Hide' : 'Compare'}
              </Button>
            )}
          </div>

          {state.isProcessing ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Resizing image...</p>
              </div>
            </div>
          ) : state.resizedImage ? (
            <div className="space-y-6">
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
                    <p className="text-sm font-medium mb-2">Resized</p>
                    <img
                      src={state.resizedImage}
                      alt="Resized"
                      className="w-full h-32 object-cover rounded-lg shadow-md"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <img
                    src={state.resizedImage}
                    alt="Resized"
                    className="max-h-48 mx-auto rounded-lg shadow-md border"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-center text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-semibold text-gray-700">Original</p>
                  <p className="text-gray-600">
                    {state.originalDimensions.width} × {state.originalDimensions.height}
                  </p>
                  <p className="text-gray-500">{formatFileSize(state.fileSize.original)}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="font-semibold text-purple-700">Resized</p>
                  <p className="text-purple-600">
                    {state.newDimensions.width} × {state.newDimensions.height}
                  </p>
                  <p className="text-purple-500">{formatFileSize(state.fileSize.resized)}</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleDownload}
                  icon={Download}
                  className="flex-1"
                >
                  Download Resized
                </Button>
                <Button
                  variant="outline"
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

      {/* Hidden canvases for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <canvas ref={tempCanvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default ImageResizer