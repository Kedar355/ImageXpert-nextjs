'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Scissors, Download, RotateCcw, Grid, Eye, Move, ZoomIn, ZoomOut, Square, Maximize2 } from 'lucide-react'
import Button from './Button'

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface ImageDimensions {
  width: number
  height: number
  naturalWidth: number
  naturalHeight: number
  scale: number
}

const SmartCropper: React.FC = () => {
  const [image, setImage] = useState<string | null>(null)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 50, y: 50, width: 200, height: 200 })
  const [selectedPreset, setSelectedPreset] = useState<string>('free')
  const [showGrid, setShowGrid] = useState(true)
  const [quality, setQuality] = useState(0.9)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions>({
    width: 0,
    height: 0,
    naturalWidth: 0,
    naturalHeight: 0,
    scale: 1
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const cropContainerRef = useRef<HTMLDivElement>(null)

  const cropPresets = [
    { name: 'Free', ratio: 0, icon: '🆓' },
    { name: 'Square', ratio: 1, icon: '⬜' },
    { name: 'Portrait', ratio: 3 / 4, icon: '📱' },
    { name: 'Landscape', ratio: 4 / 3, icon: '🖼️' },
    { name: 'Wide', ratio: 16 / 9, icon: '📺' },
    { name: 'Instagram', ratio: 1, icon: '📷' },
    { name: 'Story', ratio: 9 / 16, icon: '📲' },
    { name: 'Cover', ratio: 16 / 6, icon: '🎭' },
  ]

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        setImage(imageData)
        setCroppedImage(null)
        setSelectedPreset('free')
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024 // 50MB
  })

  // Update image dimensions when image loads
  useEffect(() => {
    if (image && imageRef.current) {
      const img = imageRef.current
      const updateDimensions = () => {
        const rect = img.getBoundingClientRect()
        const scale = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight)
        
        setImageDimensions({
          width: rect.width,
          height: rect.height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          scale
        })

        // Reset crop area to center of image
        const centerX = (rect.width - 200) / 2
        const centerY = (rect.height - 150) / 2
        setCropArea({
          x: Math.max(0, centerX),
          y: Math.max(0, centerY),
          width: Math.min(200, rect.width * 0.6),
          height: Math.min(150, rect.height * 0.6)
        })
      }

      img.onload = updateDimensions
      if (img.complete) updateDimensions()

      const resizeObserver = new ResizeObserver(updateDimensions)
      resizeObserver.observe(img)

      return () => resizeObserver.disconnect()
    }
  }, [image])

  const applyCropPreset = (presetName: string, ratio: number) => {
    setSelectedPreset(presetName.toLowerCase())

    if (ratio === 0) return // Free crop

    const maxWidth = Math.min(imageDimensions.width * 0.8, 400)
    const maxHeight = Math.min(imageDimensions.height * 0.8, 300)

    let newWidth, newHeight

    if (ratio > 1) {
      // Landscape
      newWidth = maxWidth
      newHeight = newWidth / ratio
      if (newHeight > maxHeight) {
        newHeight = maxHeight
        newWidth = newHeight * ratio
      }
    } else {
      // Portrait or square
      newHeight = maxHeight
      newWidth = newHeight * ratio
      if (newWidth > maxWidth) {
        newWidth = maxWidth
        newHeight = newWidth / ratio
      }
    }

    const centerX = (imageDimensions.width - newWidth) / 2
    const centerY = (imageDimensions.height - newHeight) / 2

    setCropArea({
      x: Math.max(0, centerX),
      y: Math.max(0, centerY),
      width: newWidth,
      height: newHeight
    })
  }

  const updateCropArea = (field: keyof CropArea, value: number) => {
    setCropArea(prev => {
      const newArea = { ...prev, [field]: Math.max(0, value) }
      
      // Ensure crop area stays within image bounds
      if (newArea.x + newArea.width > imageDimensions.width) {
        newArea.x = imageDimensions.width - newArea.width
      }
      if (newArea.y + newArea.height > imageDimensions.height) {
        newArea.y = imageDimensions.height - newArea.height
      }
      
      // Minimum size constraints
      newArea.width = Math.max(50, newArea.width)
      newArea.height = Math.max(50, newArea.height)
      
      return newArea
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!cropContainerRef.current) return
    
    const rect = cropContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Check if click is inside crop area
    if (x >= cropArea.x && x <= cropArea.x + cropArea.width &&
        y >= cropArea.y && y <= cropArea.y + cropArea.height) {
      setIsDragging(true)
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !cropContainerRef.current) return
    
    const rect = cropContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - dragStart.x
    const y = e.clientY - rect.top - dragStart.y
    
    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(x, imageDimensions.width - prev.width)),
      y: Math.max(0, Math.min(y, imageDimensions.height - prev.height))
    }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const cropImage = () => {
    if (!image || !canvasRef.current || !imageDimensions.naturalWidth) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!

    // Calculate actual crop coordinates on the original image
    const scaleX = imageDimensions.naturalWidth / imageDimensions.width
    const scaleY = imageDimensions.naturalHeight / imageDimensions.height

    const actualCrop = {
      x: cropArea.x * scaleX,
      y: cropArea.y * scaleY,
      width: cropArea.width * scaleX,
      height: cropArea.height * scaleY
    }

    // Set canvas size to crop area size
    canvas.width = actualCrop.width
    canvas.height = actualCrop.height

    const img = new Image()
    img.onload = () => {
      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // Draw the cropped portion
      ctx.drawImage(
        img,
        actualCrop.x, actualCrop.y, actualCrop.width, actualCrop.height,
        0, 0, actualCrop.width, actualCrop.height
      )

      const croppedDataUrl = canvas.toDataURL('image/png', quality)
      setCroppedImage(croppedDataUrl)
    }

    img.src = image
  }

  const downloadCroppedImage = () => {
    if (!croppedImage) return

    try {
      const link = document.createElement('a')
      link.download = `cropped-image-${Date.now()}.png`
      link.href = croppedImage
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Download error:', error)
      alert('Error downloading image. Please try again.')
    }
  }

  const resetCrop = () => {
    setImage(null)
    setCroppedImage(null)
    setCropArea({ x: 50, y: 50, width: 200, height: 200 })
    setSelectedPreset('free')
    setImageDimensions({
      width: 0,
      height: 0,
      naturalWidth: 0,
      naturalHeight: 0,
      scale: 1
    })
  }

  const centerCrop = () => {
    const centerX = (imageDimensions.width - cropArea.width) / 2
    const centerY = (imageDimensions.height - cropArea.height) / 2
    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, centerX),
      y: Math.max(0, centerY)
    }))
  }

  const maximizeCrop = () => {
    const margin = 20
    setCropArea({
      x: margin,
      y: margin,
      width: imageDimensions.width - (margin * 2),
      height: imageDimensions.height - (margin * 2)
    })
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">Smart Cropper</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Professional image cropping with preset ratios, drag-and-drop positioning, and composition guides.
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
          <p className="text-sm text-gray-400 mt-2">Supports PNG, JPG, GIF, BMP, WebP (Max: 50MB)</p>
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
                  <label className="block text-sm font-medium mb-2">Aspect Ratio Presets</label>
                  <div className="grid grid-cols-2 gap-2">
                    {cropPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => applyCropPreset(preset.name, preset.ratio)}
                        className={`
                          p-2 rounded-lg border transition-all duration-200 flex flex-col items-center gap-1 text-xs
                          ${selectedPreset === preset.name.toLowerCase()
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                          }
                        `}
                      >
                        <span className="text-lg">{preset.icon}</span>
                        <span className="font-medium">{preset.name}</span>
                        {preset.ratio > 0 && (
                          <span className="text-xs text-gray-500">
                            {preset.ratio > 1 ? `${preset.ratio.toFixed(1)}:1` : `1:${(1/preset.ratio).toFixed(1)}`}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <label className="block text-sm font-medium mb-2">Quick Actions</label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={centerCrop}
                      className="flex-1"
                    >
                      Center
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Maximize2}
                      onClick={maximizeCrop}
                      className="flex-1"
                    >
                      Max
                    </Button>
                  </div>
                </div>

                {/* Manual Controls */}
                <div className="space-y-3">
                  <h4 className="font-medium">Manual Adjustment</h4>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">X: {Math.round(cropArea.x)}px</label>
                      <input
                        type="range"
                        min="0"
                        max={Math.max(0, imageDimensions.width - cropArea.width)}
                        value={cropArea.x}
                        onChange={(e) => updateCropArea('x', Number(e.target.value))}
                        className="slider w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Y: {Math.round(cropArea.y)}px</label>
                      <input
                        type="range"
                        min="0"
                        max={Math.max(0, imageDimensions.height - cropArea.height)}
                        value={cropArea.y}
                        onChange={(e) => updateCropArea('y', Number(e.target.value))}
                        className="slider w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Width: {Math.round(cropArea.width)}px</label>
                      <input
                        type="range"
                        min="50"
                        max={imageDimensions.width}
                        value={cropArea.width}
                        onChange={(e) => updateCropArea('width', Number(e.target.value))}
                        className="slider w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Height: {Math.round(cropArea.height)}px</label>
                      <input
                        type="range"
                        min="50"
                        max={imageDimensions.height}
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
                    disabled={!image}
                    className="flex-1"
                  >
                    Crop Image
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetCrop}
                    icon={RotateCcw}
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
                    variant="outline"
                    size="sm"
                    icon={Grid}
                    onClick={() => setShowGrid(!showGrid)}
                  >
                    Grid
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Move}
                    disabled
                  >
                    Drag to Move
                  </Button>
                </div>
              </div>

              <div 
                ref={cropContainerRef}
                className="relative bg-gray-100 rounded-xl overflow-hidden min-h-96 flex items-center justify-center cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {image && (
                  <div className="relative">
                    <img
                      ref={imageRef}
                      src={image}
                      alt="Crop preview"
                      className="max-w-full max-h-96 object-contain select-none"
                      draggable={false}
                    />

                    {/* Crop Overlay */}
                    <div
                      className={`
                        absolute border-2 border-blue-500 bg-blue-500/10 
                        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                        transition-all duration-100
                      `}
                      style={{
                        left: `${cropArea.x}px`,
                        top: `${cropArea.y}px`,
                        width: `${cropArea.width}px`,
                        height: `${cropArea.height}px`,
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

                      {/* Corner Handles */}
                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full"></div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full"></div>
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full"></div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full"></div>

                      {/* Center indicator */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>

                    {/* Overlay to darken non-crop areas */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Top */}
                      <div 
                        className="absolute top-0 left-0 right-0 bg-black/30"
                        style={{ height: `${cropArea.y}px` }}
                      />
                      {/* Bottom */}
                      <div 
                        className="absolute left-0 right-0 bottom-0 bg-black/30"
                        style={{ top: `${cropArea.y + cropArea.height}px` }}
                      />
                      {/* Left */}
                      <div 
                        className="absolute left-0 bg-black/30"
                        style={{ 
                          top: `${cropArea.y}px`,
                          width: `${cropArea.x}px`,
                          height: `${cropArea.height}px`
                        }}
                      />
                      {/* Right */}
                      <div 
                        className="absolute right-0 bg-black/30"
                        style={{ 
                          top: `${cropArea.y}px`,
                          left: `${cropArea.x + cropArea.width}px`,
                          height: `${cropArea.height}px`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Crop Info */}
              {imageDimensions.naturalWidth > 0 && (
                <div className="mt-4 text-sm text-gray-600 grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Original:</span> {imageDimensions.naturalWidth} × {imageDimensions.naturalHeight}px
                  </div>
                  <div>
                    <span className="font-medium">Crop:</span> {Math.round(cropArea.width * imageDimensions.naturalWidth / imageDimensions.width)} × {Math.round(cropArea.height * imageDimensions.naturalHeight / imageDimensions.height)}px
                  </div>
                </div>
              )}
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
                    className="max-w-full max-h-48 object-contain rounded-lg shadow-md"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <Scissors className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Cropped image will appear here</p>
                    <p className="text-xs mt-1">Click "Crop Image" to generate</p>
                  </div>
                )}
              </div>

              {croppedImage && (
                <div className="mt-4 text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Quality:</span>
                    <span>{Math.round(quality * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Crop Size:</span>
                    <span>{Math.round(cropArea.width)} × {Math.round(cropArea.height)}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Aspect Ratio:</span>
                    <span>{(cropArea.width / cropArea.height).toFixed(2)}:1</span>
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