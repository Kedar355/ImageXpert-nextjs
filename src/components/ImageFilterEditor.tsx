'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Download, RotateCcw, Filter, Sliders, Eye, EyeOff } from 'lucide-react'
import Button from './Button'
// import Button from './ui/Button'

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
    opacity: 100
  })

  const [showPreview, setShowPreview] = useState(true)
  const [showOriginal, setShowOriginal] = useState(false)

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
    multiple: false
  })

  const applyFilters = useCallback(() => {
    if (!state.originalImage) return

    setState(prev => ({ ...prev, isProcessing: true }))

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      canvas.width = img.width
      canvas.height = img.height

      // Apply CSS filters to context
      const filterString = `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturation}%)
        hue-rotate(${filters.hue}deg)
        blur(${filters.blur}px)
        grayscale(${filters.grayscale}%)
        sepia(${filters.sepia}%)
        invert(${filters.invert}%)
        opacity(${filters.opacity}%)
      `.trim()

      ctx.filter = filterString
      ctx.drawImage(img, 0, 0)

      const filteredDataUrl = canvas.toDataURL('image/png', 0.95)
      setState(prev => ({
        ...prev,
        filteredImage: filteredDataUrl,
        isProcessing: false
      }))
    }
    img.src = state.originalImage
  }, [state.originalImage, filters])

  useEffect(() => {
    if (state.originalImage) {
      const debounceTimer = setTimeout(applyFilters, 100)
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
      opacity: 100
    })
  }

  const applyPreset = (preset: Partial<FilterValues>) => {
    setFilters(prev => ({ ...prev, ...preset }))
  }

  const presets = [
    { name: 'Vintage', filters: { sepia: 40, contrast: 110, brightness: 90, saturation: 80 } },
    { name: 'B&W', filters: { grayscale: 100, contrast: 110 } },
    { name: 'Vibrant', filters: { saturation: 140, contrast: 115, brightness: 105 } },
    { name: 'Soft', filters: { blur: 1, brightness: 110, opacity: 90 } },
    { name: 'High Contrast', filters: { contrast: 150, brightness: 95 } },
    { name: 'Cool', filters: { hue: 180, saturation: 110 } },
    { name: 'Warm', filters: { hue: -20, brightness: 110, saturation: 110 } },
    { name: 'Dreamy', filters: { blur: 2, brightness: 115, opacity: 85, saturation: 120 } }
  ]

  const handleDownload = () => {
    if (!state.filteredImage) return

    const link = document.createElement('a')
    link.href = state.filteredImage
    link.download = `filtered-${state.fileName}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
    { name: 'brightness', label: 'Brightness', min: 0, max: 200, step: 1, unit: '%' },
    { name: 'contrast', label: 'Contrast', min: 0, max: 200, step: 1, unit: '%' },
    { name: 'saturation', label: 'Saturation', min: 0, max: 200, step: 1, unit: '%' },
    { name: 'hue', label: 'Hue', min: -180, max: 180, step: 1, unit: '°' },
    { name: 'blur', label: 'Blur', min: 0, max: 10, step: 0.1, unit: 'px' },
    { name: 'grayscale', label: 'Grayscale', min: 0, max: 100, step: 1, unit: '%' },
    { name: 'sepia', label: 'Sepia', min: 0, max: 100, step: 1, unit: '%' },
    { name: 'invert', label: 'Invert', min: 0, max: 100, step: 1, unit: '%' },
    { name: 'opacity', label: 'Opacity', min: 0, max: 100, step: 1, unit: '%' }
  ]

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Filter className="w-8 h-8 text-green-600 mr-3" />
          <h1 className="text-3xl font-bold gradient-text">Image Filter Editor</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Apply stunning filters and effects to your images with real-time preview. Create the perfect look for your photos.
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
                    <p className="text-sm text-gray-500 mt-1">or click to select</p>
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
                </div>
              </div>

              <div className="relative bg-gray-100 rounded-xl overflow-hidden">
                {state.isProcessing && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <div className="loading-dots text-green-600"></div>
                  </div>
                )}

                <img
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
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Sliders className="w-5 h-5 mr-2" />
              Quick Presets
            </h2>

            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset.filters)}
                  className="p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Filter Controls</h2>
              <Button
                onClick={resetFilters}

                size="sm"
                icon={RotateCcw}
              >
                Reset
              </Button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filterControls.map((control) => (
                <div className='mr-2' key={control.name}>
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
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Download */}
          {state.filteredImage && (
            <div className="glass-card p-6">
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
                  Reset All
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImageFilterEditor 