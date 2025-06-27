'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Download, RotateCcw, Grid, Plus, Trash2 } from 'lucide-react'
// import Button from './ui/Button'
import Button from './Button'

interface CollageState {
  images: string[]
  collageImage: string | null
  isProcessing: boolean
}

const layoutPresets = [
  { id: '2x2', name: '2×2 Grid', cols: 2, rows: 2, maxImages: 4 },
  { id: '3x3', name: '3×3 Grid', cols: 3, rows: 3, maxImages: 9 },
  { id: '2x3', name: '2×3 Grid', cols: 2, rows: 3, maxImages: 6 },
  { id: '3x2', name: '3×2 Grid', cols: 3, rows: 2, maxImages: 6 },
  { id: '1x3', name: '1×3 Strip', cols: 1, rows: 3, maxImages: 3 },
  { id: '3x1', name: '3×1 Strip', cols: 3, rows: 1, maxImages: 3 },
]

const ImageCollageMaker: React.FC = () => {
  const [state, setState] = useState<CollageState>({
    images: [],
    collageImage: null,
    isProcessing: false
  })

  const [selectedLayout, setSelectedLayout] = useState(layoutPresets[0])
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 1200 })
  const [spacing, setSpacing] = useState(10)
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const maxImages = selectedLayout.maxImages
    const filesToProcess = acceptedFiles.slice(0, maxImages - state.images.length)

    setState(prev => ({ ...prev, isProcessing: true }))

    Promise.all(
      filesToProcess.map(file =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      )
    ).then(newImages => {
      setState(prev => ({
        ...prev,
        images: [...prev.images, ...newImages],
        isProcessing: false
      }))
    }).catch(error => {
      console.error('Error loading images:', error)
      setState(prev => ({ ...prev, isProcessing: false }))
    })
  }, [selectedLayout.maxImages, state.images.length])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.bmp', '.gif']
    },
    multiple: true
  })

  const removeImage = (index: number) => {
    setState(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const generateCollage = async () => {
    if (state.images.length === 0) return

    setState(prev => ({ ...prev, isProcessing: true }))

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    canvas.width = canvasSize.width
    canvas.height = canvasSize.height

    // Fill background
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const { cols, rows } = selectedLayout
    const cellWidth = (canvas.width - spacing * (cols + 1)) / cols
    const cellHeight = (canvas.height - spacing * (rows + 1)) / rows

    const imagePromises = state.images.map((imageSrc, index) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => {
          const row = Math.floor(index / cols)
          const col = index % cols

          const x = spacing + col * (cellWidth + spacing)
          const y = spacing + row * (cellHeight + spacing)

          // Calculate scaling to fit image in cell while maintaining aspect ratio
          const scale = Math.min(cellWidth / img.width, cellHeight / img.height)
          const scaledWidth = img.width * scale
          const scaledHeight = img.height * scale

          // Center the image in the cell
          const offsetX = (cellWidth - scaledWidth) / 2
          const offsetY = (cellHeight - scaledHeight) / 2

          ctx.drawImage(img, x + offsetX, y + offsetY, scaledWidth, scaledHeight)
          resolve()
        }
        img.src = imageSrc
      })
    )

    await Promise.all(imagePromises)

    const collageDataUrl = canvas.toDataURL('image/png', 0.95)
    setState(prev => ({
      ...prev,
      collageImage: collageDataUrl,
      isProcessing: false
    }))
  }

  const handleDownload = () => {
    if (!state.collageImage) return

    const link = document.createElement('a')
    link.href = state.collageImage
    link.download = `collage-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleReset = () => {
    setState({
      images: [],
      collageImage: null,
      isProcessing: false
    })
  }

  const handleLayoutChange = (layout: typeof layoutPresets[0]) => {
    setSelectedLayout(layout)
    // Trim images if new layout has fewer slots
    if (state.images.length > layout.maxImages) {
      setState(prev => ({
        ...prev,
        images: prev.images.slice(0, layout.maxImages)
      }))
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Grid className="w-8 h-8 text-indigo-600 mr-3" />
          <h1 className="text-3xl font-bold gradient-text">Collage Maker</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Create beautiful photo collages with customizable layouts and spacing. Perfect for social media and presentations.
        </p>
      </div>

      <div className="grid xl:grid-cols-3 gap-8">
        {/* Upload & Images Section */}
        <div className="xl:col-span-2 space-y-6">
          {/* Upload */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload Images
              </h2>
              <span className="text-sm text-gray-500">
                {state.images.length}/{selectedLayout.maxImages} images
              </span>
            </div>

            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
                ${isDragActive
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                }
              `}
            >
              <input {...getInputProps()} />

              <div className="space-y-4">
                <Upload className="w-10 h-10 text-gray-400 mx-auto" />
                <div>
                  <p className="font-medium text-gray-700">
                    {isDragActive ? 'Drop images here' : 'Drag & drop images'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    or click to select (max {selectedLayout.maxImages} images)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Image Grid Preview */}
          {state.images.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Selected Images</h2>
                <Button
                  onClick={generateCollage}
                  loading={state.isProcessing}
                  disabled={state.images.length === 0}
                >
                  Generate Collage
                </Button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {state.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Image ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg shadow-sm"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: selectedLayout.maxImages - state.images.length }).map((_, index) => (
                  <div key={`empty-${index}`} className="w-full h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <Plus className="w-6 h-6 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collage Preview */}
          {state.collageImage && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Generated Collage</h2>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleDownload}
                    icon={Download}
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

              <div className="bg-gray-100 rounded-xl p-4">
                <img
                  src={state.collageImage}
                  alt="Generated Collage"
                  className="w-full h-auto max-h-96 object-contain mx-auto rounded-lg shadow-md"
                />
              </div>
            </div>
          )}
        </div>

        {/* Settings Section */}
        <div className="space-y-6">
          {/* Layout Selection */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">Layout</h2>

            <div className="grid grid-cols-2 gap-3">
              {layoutPresets.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => handleLayoutChange(layout)}
                  className={`
                    p-3 rounded-lg border transition-all duration-200 text-left
                    ${selectedLayout.id === layout.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="font-medium text-sm">{layout.name}</div>
                  <div className="text-xs text-gray-500">
                    {layout.cols}×{layout.rows} ({layout.maxImages} images)
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Customization */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">Customization</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                  <input
                    type="number"
                    value={canvasSize.width}
                    onChange={(e) => setCanvasSize(prev => ({ ...prev, width: parseInt(e.target.value) || 1200 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                  <input
                    type="number"
                    value={canvasSize.height}
                    onChange={(e) => setCanvasSize(prev => ({ ...prev, height: parseInt(e.target.value) || 1200 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spacing: {spacing}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={spacing}
                  onChange={(e) => setSpacing(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageCollageMaker 