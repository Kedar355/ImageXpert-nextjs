'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Download, Layers, Palette, RefreshCw, Eye, EyeOff, RotateCcw } from 'lucide-react'
// import Button from './ui/Button'
import Button from './Button'

const BackgroundRemover: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)
  const [backgroundType, setBackgroundType] = useState<'remove' | 'color' | 'gradient' | 'image'>('remove')
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [gradientColors, setGradientColors] = useState(['#667eea', '#764ba2'])
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [threshold, setThreshold] = useState(128)
  const [feather, setFeather] = useState(2)
  const [quality, setQuality] = useState(0.9)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        setOriginalImage(imageData)
        setProcessedImage(null)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const backgroundImageDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        setBackgroundImage(imageData)
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

  const { getRootProps: getBgRootProps, getInputProps: getBgInputProps } = useDropzone({
    onDrop: backgroundImageDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    multiple: false
  })

  // Simple background removal simulation
  const processImage = async () => {
    if (!originalImage || !canvasRef.current) return

    setIsProcessing(true)

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = new Image()
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height

        ctx.drawImage(img, 0, 0)

        if (backgroundType === 'remove') {
          // Simple background removal simulation
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]

            // Simple luminance-based background removal
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b

            if (luminance > threshold) {
              data[i + 3] = Math.max(0, data[i + 3] - (luminance - threshold) * 2)
            }
          }

          ctx.putImageData(imageData, 0, 0)
        } else {
          // Apply new background
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

          // Create background
          const bgCanvas = document.createElement('canvas')
          const bgCtx = bgCanvas.getContext('2d')!
          bgCanvas.width = canvas.width
          bgCanvas.height = canvas.height

          if (backgroundType === 'color') {
            bgCtx.fillStyle = backgroundColor
            bgCtx.fillRect(0, 0, canvas.width, canvas.height)
          } else if (backgroundType === 'gradient') {
            const gradient = bgCtx.createLinearGradient(0, 0, canvas.width, canvas.height)
            gradient.addColorStop(0, gradientColors[0])
            gradient.addColorStop(1, gradientColors[1])
            bgCtx.fillStyle = gradient
            bgCtx.fillRect(0, 0, canvas.width, canvas.height)
          } else if (backgroundType === 'image' && backgroundImage) {
            const bgImg = new Image()
            bgImg.onload = () => {
              bgCtx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)

              // Composite
              ctx.clearRect(0, 0, canvas.width, canvas.height)
              ctx.drawImage(bgCanvas, 0, 0)
              ctx.putImageData(imageData, 0, 0)

              setProcessedImage(canvas.toDataURL('image/png', quality))
              setIsProcessing(false)
            }
            bgImg.src = backgroundImage
            return
          }

          // Composite
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(bgCanvas, 0, 0)
          ctx.putImageData(imageData, 0, 0)
        }

        setProcessedImage(canvas.toDataURL('image/png', quality))
        setIsProcessing(false)
      }

      img.src = originalImage
    } catch (error) {
      console.error('Error processing image:', error)
      setIsProcessing(false)
    }
  }

  const downloadImage = () => {
    if (!processedImage) return

    const link = document.createElement('a')
    link.download = 'background-processed-image.png'
    link.href = processedImage
    link.click()
  }

  const resetImage = () => {
    setOriginalImage(null)
    setProcessedImage(null)
    setBackgroundImage(null)
    setShowOriginal(false)
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">Background Tools</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Remove, replace, or modify image backgrounds with advanced tools and professional controls.
        </p>
      </div>

      {/* Upload Section */}
      {!originalImage && (
        <div
          {...getRootProps()}
          className={`
            glass-effect border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200
            ${isDragActive ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 hover:border-gray-400'}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Upload Your Image</h3>
          <p className="text-gray-500">Drag & drop or click to select an image for background processing</p>
          <p className="text-sm text-gray-400 mt-2">Supports PNG, JPG, GIF, BMP, WebP</p>
        </div>
      )}

      {originalImage && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Background Options
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Background Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'remove', label: 'Remove', icon: EyeOff },
                      { value: 'color', label: 'Color', icon: Palette },
                      { value: 'gradient', label: 'Gradient', icon: RefreshCw },
                      { value: 'image', label: 'Image', icon: Upload }
                    ].map((option) => {
                      const Icon = option.icon
                      return (
                        <button
                          key={option.value}
                          onClick={() => setBackgroundType(option.value as any)}
                          className={`
                            p-3 rounded-lg border transition-all duration-200 flex flex-col items-center gap-1
                            ${backgroundType === option.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                            }
                          `}
                        >
                          <Icon size={16} />
                          <span className="text-xs font-medium">{option.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {backgroundType === 'color' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Background Color</label>
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-full h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                  </div>
                )}

                {backgroundType === 'gradient' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Gradient Colors</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={gradientColors[0]}
                        onChange={(e) => setGradientColors([e.target.value, gradientColors[1]])}
                        className="flex-1 h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="color"
                        value={gradientColors[1]}
                        onChange={(e) => setGradientColors([gradientColors[0], e.target.value])}
                        className="flex-1 h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {backgroundType === 'image' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Background Image</label>
                    <div
                      {...getBgRootProps()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
                    >
                      <input {...getBgInputProps()} />
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        {backgroundImage ? 'Change background image' : 'Upload background image'}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Threshold: {threshold}</label>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="slider w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Edge Feather: {feather}px</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={feather}
                    onChange={(e) => setFeather(Number(e.target.value))}
                    className="slider w-full"
                  />
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

                <div className="flex gap-2">
                  <Button
                    onClick={processImage}
                    disabled={isProcessing}
                    loading={isProcessing}
                    className="flex-1"
                  >
                    Process Image
                  </Button>
                  <Button
                    icon={RotateCcw}
                    onClick={resetImage}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-2">
            <div className="glass-effect rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Preview</h3>
                <div className="flex items-center gap-2">
                  {processedImage && (
                    <>
                      <Button
                        size="sm"
                        icon={showOriginal ? EyeOff : Eye}
                        onClick={() => setShowOriginal(!showOriginal)}
                      >
                        {showOriginal ? 'Processed' : 'Original'}
                      </Button>
                      <Button
                        size="sm"
                        icon={Download}
                        onClick={downloadImage}
                      >
                        Download
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="relative bg-gray-100 rounded-xl overflow-hidden min-h-96 flex items-center justify-center">
                {originalImage && (
                  <img
                    src={showOriginal ? originalImage : (processedImage || originalImage)}
                    alt="Preview"
                    className="max-w-full max-h-96 object-contain"
                  />
                )}

                {isProcessing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing image...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default BackgroundRemover 