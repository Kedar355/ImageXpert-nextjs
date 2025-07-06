'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Download, RotateCcw, Filter, Sliders, Eye, EyeOff, Save, Palette, Zap } from 'lucide-react'
import Button from './Button'

interface FilterState {
  originalImage: string | null
  filteredImage: string | null
  fileName: string
  isProcessing: boolean
}

interface FilterValues {
  brightness: number
  contrast: number
  saturation: number
  hue: number
  blur: number
  grayscale: number
  sepia: number
  invert: number
  opacity: number
  vibrance: number
  warmth: number
  highlights: number
  shadows: number
  vignette: number
}

const ImageFilterEditor: React.FC = () => {
  const [state, setState] = useState<FilterState>({
    originalImage: null,
    filteredImage: null,
    fileName: '',
    isProcessing: false
  })

  const [filters, setFilters] = useState<FilterValues>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    grayscale: 0,
    sepia: 0,
    invert: 0,
    opacity: 100,
    vibrance: 100,
    warmth: 0,
    highlights: 0,
    shadows: 0,
    vignette: 0
  })

  const [showPreview, setShowPreview] = useState(true)
  const [showOriginal, setShowOriginal] = useState(false)
  const [savedPresets, setSavedPresets] = useState<{[key: string]: FilterValues}>({})
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setState(prev => ({ ...prev, isProcessing: true, fileName: file.name }))

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setState(prev => ({
        ...prev,
        originalImage: result,
        filteredImage: result,
        isProcessing: false
      }))
    }
    reader.readAsDataURL(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.bmp', '.gif']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024 // 50MB
  })

  const applyAdvancedFilters = useCallback((imageData: ImageData, filters: FilterValues) => {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]
      let a = data[i + 3]

      // Brightness
      if (filters.brightness !== 100) {
        const factor = filters.brightness / 100
        r *= factor
        g *= factor
        b *= factor
      }

      // Contrast
      if (filters.contrast !== 100) {
        const factor = filters.contrast / 100
        r = ((r / 255 - 0.5) * factor + 0.5) * 255
        g = ((g / 255 - 0.5) * factor + 0.5) * 255
        b = ((b / 255 - 0.5) * factor + 0.5) * 255
      }

      // Saturation
      if (filters.saturation !== 100) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        const factor = filters.saturation / 100
        r = gray + (r - gray) * factor
        g = gray + (g - gray) * factor
        b = gray + (b - gray) * factor
      }

      // Vibrance (selective saturation)
      if (filters.vibrance !== 100) {
        const max = Math.max(r, g, b)
        const avg = (r + g + b) / 3
        const amt = ((Math.abs(max - avg) * 2 / 255) * (filters.vibrance - 100)) / 100
        if (r !== max) r += (max - r) * amt
        if (g !== max) g += (max - g) * amt
        if (b !== max) b += (max - b) * amt
      }

      // Warmth
      if (filters.warmth !== 0) {
        const factor = filters.warmth / 100
        r += factor * 30
        b -= factor * 30
      }

      // Highlights and Shadows
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b
      if (filters.highlights !== 0 && luminance > 128) {
        const factor = (filters.highlights / 100) * ((luminance - 128) / 127)
        r += factor * 50
        g += factor * 50
        b += factor * 50
      }
      if (filters.shadows !== 0 && luminance < 128) {
        const factor = (filters.shadows / 100) * ((128 - luminance) / 128)
        r += factor * 50
        g += factor * 50
        b += factor * 50
      }

      // Vignette
      if (filters.vignette > 0) {
        const x = (i / 4) % width
        const y = Math.floor((i / 4) / width)
        const centerX = width / 2
        const centerY = height / 2
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
        const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2))
        const vignetteFactor = 1 - (distance / maxDistance) * (filters.vignette / 100)
        r *= vignetteFactor
        g *= vignetteFactor
        b *= vignetteFactor
      }

      // Grayscale
      if (filters.grayscale > 0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        const factor = filters.grayscale / 100
        r = r * (1 - factor) + gray * factor
        g = g * (1 - factor) + gray * factor
        b = b * (1 - factor) + gray * factor
      }

      // Sepia
      if (filters.sepia > 0) {
        const factor = filters.sepia / 100
        const tr = 0.393 * r + 0.769 * g + 0.189 * b
        const tg = 0.349 * r + 0.686 * g + 0.168 * b
        const tb = 0.272 * r + 0.534 * g + 0.131 * b
        r = r * (1 - factor) + tr * factor
        g = g * (1 - factor) + tg * factor
        b = b * (1 - factor) + tb * factor
      }

      // Invert
      if (filters.invert > 0) {
        const factor = filters.invert / 100
        r = r * (1 - factor) + (255 - r) * factor
        g = g * (1 - factor) + (255 - g) * factor
        b = b * (1 - factor) + (255 - b) * factor
      }

      // Opacity
      if (filters.opacity !== 100) {
        a = (a * filters.opacity) / 100
      }

      // Clamp values
      data[i] = Math.max(0, Math.min(255, r))
      data[i + 1] = Math.max(0, Math.min(255, g))
      data[i + 2] = Math.max(0, Math.min(255, b))
      data[i + 3] = Math.max(0, Math.min(255, a))
    }

    return imageData
  }, [])

  const applyFilters = useCallback(() => {
    if (!state.originalImage || !canvasRef.current) return

    setState(prev => ({ ...prev, isProcessing: true }))

    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current!
      const ctx = canvas.getContext('2d')!

      canvas.width = img.width
      canvas.height = img.height

      // Draw original image
      ctx.drawImage(img, 0, 0)

      // Apply blur first (CSS filter)
      if (filters.blur > 0) {
        ctx.filter = `blur(${filters.blur}px)`
        ctx.drawImage(canvas, 0, 0)
        ctx.filter = 'none'
      }

      // Apply hue rotation (CSS filter)
      if (filters.hue !== 0) {
        ctx.filter = `hue-rotate(${filters.hue}deg)`
        ctx.drawImage(canvas, 0, 0)
        ctx.filter = 'none'
      }

      // Get image data for pixel-level operations
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const processedData = applyAdvancedFilters(imageData, filters)
      ctx.putImageData(processedData, 0, 0)

      const filteredDataUrl = canvas.toDataURL('image/png', 0.95)
      setState(prev => ({
        ...prev,
        filteredImage: filteredDataUrl,
        isProcessing: false
      }))
    }

    img.onerror = () => {
      setState(prev => ({ ...prev, isProcessing: false }))
    }

    img.src = state.originalImage
  }, [state.originalImage, filters, applyAdvancedFilters])

  useEffect(() => {
    if (state.originalImage) {
      const debounceTimer = setTimeout(applyFilters, 150)
      return () => clearTimeout(debounceTimer)
    }
  }, [filters, applyFilters, state.originalImage])

  const handleFilterChange = (filterName: keyof FilterValues, value: number) => {
    setFilters(prev => ({ ...prev, [filterName]: value }))
  }

  const resetFilters = () => {
    setFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      blur: 0,
      grayscale: 0,
      sepia: 0,
      invert: 0,
      opacity: 100,
      vibrance: 100,
      warmth: 0,
      highlights: 0,
      shadows: 0,
      vignette: 0
    })
  }

  const applyPreset = (preset: Partial<FilterValues>) => {
    setFilters(prev => ({ ...prev, ...preset }))
  }

  const savePreset = () => {
    const name = prompt('Enter preset name:')
    if (name) {
      setSavedPresets(prev => ({ ...prev, [name]: { ...filters } }))
    }
  }

  const presets = [
    { 
      name: 'Vintage', 
      filters: { sepia: 40, contrast: 110, brightness: 90, saturation: 80, warmth: 20, vignette: 30 },
      icon: '📸'
    },
    { 
      name: 'B&W Classic', 
      filters: { grayscale: 100, contrast: 120, brightness: 95, highlights: 10, shadows: -10 },
      icon: '⚫'
    },
    { 
      name: 'Vibrant', 
      filters: { saturation: 140, vibrance: 120, contrast: 115, brightness: 105, warmth: 10 },
      icon: '🌈'
    },
    { 
      name: 'Soft Dream', 
      filters: { blur: 1, brightness: 110, opacity: 90, saturation: 120, warmth: 15 },
      icon: '☁️'
    },
    { 
      name: 'High Contrast', 
      filters: { contrast: 150, brightness: 95, saturation: 110, highlights: 20, shadows: -20 },
      icon: '⚡'
    },
    { 
      name: 'Cool Tone', 
      filters: { hue: 180, saturation: 110, warmth: -30, brightness: 105 },
      icon: '❄️'
    },
    { 
      name: 'Warm Sunset', 
      filters: { hue: -20, brightness: 110, saturation: 110, warmth: 40, vignette: 20 },
      icon: '🌅'
    },
    { 
      name: 'Film Noir', 
      filters: { grayscale: 100, contrast: 140, brightness: 85, vignette: 50, highlights: -15 },
      icon: '🎬'
    }
  ]

  const handleDownload = () => {
    if (!state.filteredImage) return

    try {
      const link = document.createElement('a')
      link.href = state.filteredImage
      link.download = `filtered-${state.fileName}`
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
      filteredImage: null,
      fileName: '',
      isProcessing: false
    })
    resetFilters()
  }

  const filterControls = [
    { name: 'brightness', label: 'Brightness', min: 0, max: 200, step: 1, unit: '%', category: 'basic' },
    { name: 'contrast', label: 'Contrast', min: 0, max: 200, step: 1, unit: '%', category: 'basic' },
    { name: 'saturation', label: 'Saturation', min: 0, max: 200, step: 1, unit: '%', category: 'basic' },
    { name: 'vibrance', label: 'Vibrance', min: 0, max: 200, step: 1, unit: '%', category: 'basic' },
    { name: 'hue', label: 'Hue', min: -180, max: 180, step: 1, unit: '°', category: 'color' },
    { name: 'warmth', label: 'Warmth', min: -100, max: 100, step: 1, unit: '', category: 'color' },
    { name: 'highlights', label: 'Highlights', min: -100, max: 100, step: 1, unit: '', category: 'tone' },
    { name: 'shadows', label: 'Shadows', min: -100, max: 100, step: 1, unit: '', category: 'tone' },
    { name: 'vignette', label: 'Vignette', min: 0, max: 100, step: 1, unit: '%', category: 'effects' },
    { name: 'blur', label: 'Blur', min: 0, max: 10, step: 0.1, unit: 'px', category: 'effects' },
    { name: 'grayscale', label: 'Grayscale', min: 0, max: 100, step: 1, unit: '%', category: 'effects' },
    { name: 'sepia', label: 'Sepia', min: 0, max: 100, step: 1, unit: '%', category: 'effects' },
    { name: 'invert', label: 'Invert', min: 0, max: 100, step: 1, unit: '%', category: 'effects' },
    { name: 'opacity', label: 'Opacity', min: 0, max: 100, step: 1, unit: '%', category: 'effects' }
  ]

  const categories = {
    basic: 'Basic Adjustments',
    color: 'Color Grading',
    tone: 'Tone Mapping',
    effects: 'Effects'
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Filter className="w-8 h-8 text-green-600 mr-3" />
          <h1 className="text-3xl font-bold gradient-text">Advanced Filter Editor</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Professional-grade image filtering with real-time preview. Apply stunning effects and create custom looks.
        </p>
      </div>

      <div className="grid xl:grid-cols-3 gap-8">
        {/* Upload & Preview Section */}
        <div className="xl:col-span-2 space-y-6">
          {/* Upload */}
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
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
                }
              `}
            >
              <input {...getInputProps()} />

              {state.originalImage ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{state.fileName}</p>
                    <p>Click or drag to replace</p>
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
          </div>

          {/* Preview */}
          {state.originalImage && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Preview
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowOriginal(!showOriginal)}
                    className={`
                      px-3 py-1 text-sm rounded-lg transition-all duration-200
                      ${showOriginal ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                    `}
                  >
                    {showOriginal ? 'Show Filtered' : 'Show Original'}
                  </button>
                  {state.filteredImage && (
                    <Button
                      size="sm"
                      icon={Download}
                      onClick={handleDownload}
                    >
                      Download
                    </Button>
                  )}
                </div>
              </div>

              <div className="relative bg-gray-100 rounded-xl overflow-hidden">
                {state.isProcessing && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Processing...</p>
                    </div>
                  </div>
                )}

                <img
                  ref={imageRef}
                  src={showOriginal ? (state.originalImage || '') : (state.filteredImage || '')}
                  alt="Preview"
                  className="w-full h-auto max-h-96 object-contain mx-auto"
                />
              </div>
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className="space-y-6">
          {/* Presets */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Presets
              </h2>
              <Button
                variant="outline"
                size="sm"
                icon={Save}
                onClick={savePreset}
                disabled={!state.originalImage}
              >
                Save
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset.filters)}
                  disabled={!state.originalImage}
                  className="p-3 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{preset.icon}</span>
                    <span className="font-medium">{preset.name}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Saved Presets */}
            {Object.keys(savedPresets).length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Saved Presets</h3>
                <div className="space-y-1">
                  {Object.entries(savedPresets).map(([name, preset]) => (
                    <button
                      key={name}
                      onClick={() => applyPreset(preset)}
                      disabled={!state.originalImage}
                      className="w-full p-2 text-sm bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 text-left"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filter Controls */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Filter Controls</h2>
              <Button
                variant="outline"
                onClick={resetFilters}
                size="sm"
                icon={RotateCcw}
                disabled={!state.originalImage}
              >
                Reset
              </Button>
            </div>

            <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
              {Object.entries(categories).map(([categoryKey, categoryName]) => (
                <div key={categoryKey}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-1">
                    {categoryName}
                  </h3>
                  <div className="space-y-4">
                    {filterControls
                      .filter(control => control.category === categoryKey)
                      .map((control) => (
                        <div key={control.name}>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-medium text-gray-700">
                              {control.label}
                            </label>
                            <span className="text-sm text-gray-500">
                              {filters[control.name as keyof FilterValues]}{control.unit}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={control.min}
                            max={control.max}
                            step={control.step}
                            value={filters[control.name as keyof FilterValues]}
                            onChange={(e) => handleFilterChange(
                              control.name as keyof FilterValues,
                              parseFloat(e.target.value)
                            )}
                            disabled={!state.originalImage}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {state.filteredImage && (
            <div className="glass-card p-6">
              <div className="flex space-x-3">
                <Button
                  onClick={handleDownload}
                  icon={Download}
                  className="flex-1"
                >
                  Download Filtered
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  icon={RotateCcw}
                >
                  Reset All
                </Button>
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

export default ImageFilterEditor