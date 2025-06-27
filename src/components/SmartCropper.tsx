'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Scissors, Download, RotateCcw, Grid, Eye, Move, ZoomIn, ZoomOut, Square } from 'lucide-react'
// import Button from './ui/Button'
import Button from './Button'

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

const SmartCropper: React.FC = () => {
  const [image, setImage] = useState<string | null>(null)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 50, y: 50, width: 200, height: 200 })
  const [selectedPreset, setSelectedPreset] = useState<string>('free')
  const [showGrid, setShowGrid] = useState(true)
  const [quality, setQuality] = useState(0.9)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const cropPresets = [
    { name: 'Free', ratio: 0 },
    { name: 'Square', ratio: 1 },
    { name: 'Portrait', ratio: 3 / 4 },
    { name: 'Landscape', ratio: 4 / 3 },
    { name: 'Wide', ratio: 16 / 9 },
    { name: 'Instagram', ratio: 1 },
    { name: 'Story', ratio: 9 / 16 },
  ]

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        setImage(imageData)
        setCroppedImage(null)

        // Reset crop area when new image is loaded
        setCropArea({ x: 50, y: 50, width: 200, height: 200 })
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    multiple: false
  })

  const applyCropPreset = (presetName: string) => {
    setSelectedPreset(presetName.toLowerCase())

    const preset = cropPresets.find(p => p.name === presetName)
    if (!preset || preset.ratio === 0) return

    // Apply aspect ratio to current crop area
    const currentWidth = cropArea.width
    const newHeight = currentWidth / preset.ratio

    setCropArea(prev => ({
      ...prev,
      height: newHeight
    }))
  }

  const updateCropArea = (field: keyof CropArea, value: number) => {
    setCropArea(prev => ({
      ...prev,
      [field]: Math.max(0, value)
    }))
  }

  const cropImage = () => {
    if (!image || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!

    const img = new Image()
    img.onload = () => {
      // Set canvas size to crop area size
      canvas.width = cropArea.width
      canvas.height = cropArea.height

      // Draw the cropped portion
      ctx.drawImage(
        img,
        cropArea.x, cropArea.y, cropArea.width, cropArea.height, // Source rectangle
        0, 0, cropArea.width, cropArea.height // Destination rectangle
      )

      const croppedDataUrl = canvas.toDataURL('image/png', quality)
      setCroppedImage(croppedDataUrl)
    }

    img.src = image
  }

  const downloadCroppedImage = () => {
    if (!croppedImage) return

    const link = document.createElement('a')
    link.download = 'cropped-image.png'
    link.href = croppedImage
    link.click()
  }

  const resetCrop = () => {
    setImage(null)
    setCroppedImage(null)
    setCropArea({ x: 50, y: 50, width: 200, height: 200 })
    setSelectedPreset('free')
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">Smart Cropper</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Crop images with preset ratios and professional composition guides.
        </p>
      </div>

      {/* Upload Section */}
      {!image && (
        <div
          {...getRootProps()}
          className={`
            glass-effect border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200
            ${isDragActive ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 hover:border-gray-400'}
          `}
        >
          <input {...getInputProps()} />
          <Scissors className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Smart Crop Your Image</h3>
          <p className="text-gray-500">Drag & drop or click to select an image for cropping</p>
          <p className="text-sm text-gray-400 mt-2">Supports PNG, JPG, GIF, BMP, WebP</p>
        </div>
      )}

      {image && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Crop Settings</h3>

              <div className="space-y-4">
                {/* Aspect Ratio Presets */}
                <div>
                  <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
                  <div className="grid grid-cols-2 gap-2">
                    {cropPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => applyCropPreset(preset.name)}
                        className={`
                          p-2 rounded-lg border transition-all duration-200 flex flex-col items-center gap-1 text-xs
                          ${selectedPreset === preset.name.toLowerCase()
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                          }
                        `}
                      >
                        <Square size={16} />
                        <span className="font-medium">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Controls */}
                <div className="space-y-3">
                  <h4 className="font-medium">Manual Adjustment</h4>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">X: {cropArea.x}px</label>
                      <input
                        type="range"
                        min="0"
                        max="800"
                        value={cropArea.x}
                        onChange={(e) => updateCropArea('x', Number(e.target.value))}
                        className="slider w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Y: {cropArea.y}px</label>
                      <input
                        type="range"
                        min="0"
                        max="600"
                        value={cropArea.y}
                        onChange={(e) => updateCropArea('y', Number(e.target.value))}
                        className="slider w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Width: {cropArea.width}px</label>
                      <input
                        type="range"
                        min="50"
                        max="800"
                        value={cropArea.width}
                        onChange={(e) => updateCropArea('width', Number(e.target.value))}
                        className="slider w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Height: {cropArea.height}px</label>
                      <input
                        type="range"
                        min="50"
                        max="600"
                        value={cropArea.height}
                        onChange={(e) => updateCropArea('height', Number(e.target.value))}
                        className="slider w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Show Grid</label>
                    <button
                      onClick={() => setShowGrid(!showGrid)}
                      className={`
                        w-12 h-6 rounded-full transition-colors duration-200 relative
                        ${showGrid ? 'bg-blue-500' : 'bg-gray-300'}
                      `}
                    >
                      <div className={`
                        w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-200
                        ${showGrid ? 'translate-x-7' : 'translate-x-1'}
                      `} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Quality: {Math.round(quality * 100)}%</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="slider w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={cropImage}
                    className="flex-1"
                  >
                    Crop Image
                  </Button>
                  <Button

                    onClick={resetCrop}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Image Editor */}
          <div className="lg:col-span-2">
            <div className="glass-effect rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Crop Editor</h3>
                <div className="flex items-center gap-2">
                  <Button

                    size="sm"
                    icon={Grid}
                    onClick={() => setShowGrid(!showGrid)}
                  >
                    Grid
                  </Button>
                </div>
              </div>

              <div className="relative bg-gray-100 rounded-xl overflow-hidden min-h-96 flex items-center justify-center">
                {image && (
                  <div className="relative">
                    <img
                      ref={imageRef}
                      src={image}
                      alt="Crop preview"
                      className="max-w-full max-h-96 object-contain"
                    />

                    {/* Crop Overlay */}
                    <div
                      className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none"
                      style={{
                        left: `${cropArea.x * 0.5}px`, // Scaled for preview
                        top: `${cropArea.y * 0.5}px`,
                        width: `${cropArea.width * 0.5}px`,
                        height: `${cropArea.height * 0.5}px`,
                      }}
                    >
                      {/* Grid Lines */}
                      {showGrid && (
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="border border-white/50" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-1">
            <div className="glass-effect rounded-2xl p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Preview</h3>
                {croppedImage && (
                  <Button
                    size="sm"
                    icon={Download}
                    onClick={downloadCroppedImage}
                  >
                    Download
                  </Button>
                )}
              </div>

              <div className="relative bg-gray-100 rounded-xl overflow-hidden min-h-48 flex items-center justify-center">
                {croppedImage ? (
                  <img
                    src={croppedImage}
                    alt="Cropped preview"
                    className="max-w-full max-h-48 object-contain"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <Scissors className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Cropped image will appear here</p>
                  </div>
                )}
              </div>

              {croppedImage && (
                <div className="mt-4 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Quality:</span>
                    <span>{Math.round(quality * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span>{cropArea.width} × {cropArea.height}px</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default SmartCropper 