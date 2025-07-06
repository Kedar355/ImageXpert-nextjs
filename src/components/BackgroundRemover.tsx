'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Download, Layers, Palette, RefreshCw, Eye, EyeOff, RotateCcw, Wand2, Settings } from 'lucide-react'
import Button from './Button'

interface ProcessingSettings {
  threshold: number
  feather: number
  quality: number
  edgeSmoothing: number
  colorTolerance: number
  preserveDetails: boolean
}

const BackgroundRemover: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)
  const [backgroundType, setBackgroundType] = useState<'remove' | 'color' | 'gradient' | 'image'>('remove')
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [gradientColors, setGradientColors] = useState(['#667eea', '#764ba2'])
  const [gradientDirection, setGradientDirection] = useState('to right')
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const [settings, setSettings] = useState<ProcessingSettings>({
    threshold: 128,
    feather: 2,
    quality: 0.9,
    edgeSmoothing: 3,
    colorTolerance: 30,
    preserveDetails: true
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tempCanvasRef = useRef<HTMLCanvasElement>(null)

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
    multiple: false,
    maxSize: 50 * 1024 * 1024
  })

  const { getRootProps: getBgRootProps, getInputProps: getBgInputProps } = useDropzone({
    onDrop: backgroundImageDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    multiple: false
  })

  // Advanced edge detection algorithm
  const detectEdges = (imageData: ImageData, threshold: number) => {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    const edges = new Uint8ClampedArray(width * height)

    // Sobel edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4

        // Get surrounding pixels
        const pixels = []
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const pixelIdx = ((y + dy) * width + (x + dx)) * 4
            const gray = 0.299 * data[pixelIdx] + 0.587 * data[pixelIdx + 1] + 0.114 * data[pixelIdx + 2]
            pixels.push(gray)
          }
        }

        // Sobel operators
        const sobelX = (-1 * pixels[0]) + (1 * pixels[2]) + 
                      (-2 * pixels[3]) + (2 * pixels[5]) + 
                      (-1 * pixels[6]) + (1 * pixels[8])

        const sobelY = (-1 * pixels[0]) + (-2 * pixels[1]) + (-1 * pixels[2]) + 
                      (1 * pixels[6]) + (2 * pixels[7]) + (1 * pixels[8])

        const magnitude = Math.sqrt(sobelX * sobelX + sobelY * sobelY)
        edges[y * width + x] = magnitude > threshold ? 255 : 0
      }
    }

    return edges
  }

  // Smart background removal with multiple algorithms
  const removeBackground = (imageData: ImageData, settings: ProcessingSettings) => {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    const result = new ImageData(width, height)
    const resultData = result.data

    // Copy original data
    for (let i = 0; i < data.length; i++) {
      resultData[i] = data[i]
    }

    // Method 1: Edge-based detection
    const edges = detectEdges(imageData, settings.threshold / 2)

    // Method 2: Color clustering for background detection
    const cornerSamples = []
    const sampleSize = Math.min(20, Math.floor(width / 10))
    
    // Sample corners to determine likely background colors
    for (let y = 0; y < sampleSize; y++) {
      for (let x = 0; x < sampleSize; x++) {
        const idx = (y * width + x) * 4
        cornerSamples.push({
          r: data[idx],
          g: data[idx + 1],
          b: data[idx + 2]
        })
      }
    }

    // Calculate average background color
    const avgBg = cornerSamples.reduce((acc, color) => ({
      r: acc.r + color.r,
      g: acc.g + color.g,
      b: acc.b + color.b
    }), { r: 0, g: 0, b: 0 })

    avgBg.r /= cornerSamples.length
    avgBg.g /= cornerSamples.length
    avgBg.b /= cornerSamples.length

    // Process each pixel
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % width
      const y = Math.floor((i / 4) / width)
      const edgeIdx = y * width + x

      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      // Calculate color distance from background
      const colorDist = Math.sqrt(
        Math.pow(r - avgBg.r, 2) + 
        Math.pow(g - avgBg.g, 2) + 
        Math.pow(b - avgBg.b, 2)
      )

      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b

      // Determine if pixel should be transparent
      let alpha = 255
      
      // Edge-based removal
      if (edges[edgeIdx] === 0 && colorDist < settings.colorTolerance) {
        alpha = 0
      }
      
      // Luminance-based removal
      if (luminance > settings.threshold && colorDist < settings.colorTolerance * 1.5) {
        alpha = Math.max(0, 255 - (luminance - settings.threshold) * 2)
      }

      // Apply feathering for smooth edges
      if (alpha < 255 && settings.feather > 0) {
        const featherRadius = settings.feather
        let neighborAlphas = 0
        let neighborCount = 0

        for (let dy = -featherRadius; dy <= featherRadius; dy++) {
          for (let dx = -featherRadius; dx <= featherRadius; dx++) {
            const nx = x + dx
            const ny = y + dy
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = (ny * width + nx) * 4
              const nLum = 0.299 * data[nIdx] + 0.587 * data[nIdx + 1] + 0.114 * data[nIdx + 2]
              neighborAlphas += nLum > settings.threshold ? 0 : 255
              neighborCount++
            }
          }
        }

        const avgNeighborAlpha = neighborAlphas / neighborCount
        alpha = (alpha + avgNeighborAlpha) / 2
      }

      // Edge smoothing
      if (settings.edgeSmoothing > 0 && alpha > 0 && alpha < 255) {
        const smoothRadius = settings.edgeSmoothing
        let smoothSum = 0
        let smoothCount = 0

        for (let dy = -smoothRadius; dy <= smoothRadius; dy++) {
          for (let dx = -smoothRadius; dx <= smoothRadius; dx++) {
            const nx = x + dx
            const ny = y + dy
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const distance = Math.sqrt(dx * dx + dy * dy)
              if (distance <= smoothRadius) {
                const weight = 1 - (distance / smoothRadius)
                smoothSum += alpha * weight
                smoothCount += weight
              }
            }
          }
        }

        alpha = smoothSum / smoothCount
      }

      resultData[i] = r
      resultData[i + 1] = g
      resultData[i + 2] = b
      resultData[i + 3] = Math.round(alpha)
    }

    return result
  }

  // Process image with background replacement
  const processImage = async () => {
    if (!originalImage || !canvasRef.current) return

    setIsProcessing(true)

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')!
      const tempCanvas = tempCanvasRef.current!
      const tempCtx = tempCanvas.getContext('2d')!

      const img = new Image()
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        tempCanvas.width = img.width
        tempCanvas.height = img.height

        // Draw original image
        tempCtx.drawImage(img, 0, 0)
        const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height)

        if (backgroundType === 'remove') {
          // Remove background
          const processedData = removeBackground(imageData, settings)
          ctx.putImageData(processedData, 0, 0)
        } else {
          // Create background first
          if (backgroundType === 'color') {
            ctx.fillStyle = backgroundColor
            ctx.fillRect(0, 0, canvas.width, canvas.height)
          } else if (backgroundType === 'gradient') {
            const gradient = ctx.createLinearGradient(
              0, 0, 
              gradientDirection.includes('right') ? canvas.width : 0,
              gradientDirection.includes('bottom') ? canvas.height : 0
            )
            gradient.addColorStop(0, gradientColors[0])
            gradient.addColorStop(1, gradientColors[1])
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, canvas.width, canvas.height)
          } else if (backgroundType === 'image' && backgroundImage) {
            const bgImg = new Image()
            bgImg.onload = () => {
              ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)
              
              // Apply foreground with transparency
              const processedData = removeBackground(imageData, settings)
              tempCtx.putImageData(processedData, 0, 0)
              ctx.drawImage(tempCanvas, 0, 0)

              setProcessedImage(canvas.toDataURL('image/png', settings.quality))
              setIsProcessing(false)
            }
            bgImg.src = backgroundImage
            return
          }

          // Apply foreground with transparency
          const processedData = removeBackground(imageData, settings)
          tempCtx.putImageData(processedData, 0, 0)
          ctx.drawImage(tempCanvas, 0, 0)
        }

        setProcessedImage(canvas.toDataURL('image/png', settings.quality))
        setIsProcessing(false)
      }

      img.onerror = () => {
        setIsProcessing(false)
        alert('Error loading image. Please try again.')
      }

      img.src = originalImage
    } catch (error) {
      console.error('Error processing image:', error)
      setIsProcessing(false)
      alert('Error processing image. Please try again.')
    }
  }

  const downloadImage = () => {
    if (!processedImage) return

    try {
      const link = document.createElement('a')
      link.download = `background-processed-${Date.now()}.png`
      link.href = processedImage
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  const resetImage = () => {
    setOriginalImage(null)
    setProcessedImage(null)
    setBackgroundImage(null)
    setShowOriginal(false)
  }

  const gradientDirections = [
    { value: 'to right', label: 'Left to Right' },
    { value: 'to left', label: 'Right to Left' },
    { value: 'to bottom', label: 'Top to Bottom' },
    { value: 'to top', label: 'Bottom to Top' },
    { value: 'to bottom right', label: 'Diagonal ↘' },
    { value: 'to bottom left', label: 'Diagonal ↙' }
  ]

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">Advanced Background Tools</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Professional background removal and replacement with intelligent edge detection and advanced processing algorithms.
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
          <p className="text-sm text-gray-400 mt-2">Supports PNG, JPG, GIF, BMP, WebP (Max: 50MB)</p>
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
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                )}

                {backgroundType === 'gradient' && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium">Gradient Settings</label>
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
                    <select
                      value={gradientDirection}
                      onChange={(e) => setGradientDirection(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {gradientDirections.map(dir => (
                        <option key={dir.value} value={dir.value}>{dir.label}</option>
                      ))}
                    </select>
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
                    {backgroundImage && (
                      <img src={backgroundImage} alt="Background preview" className="mt-2 w-full h-20 object-cover rounded-lg" />
                    )}
                  </div>
                )}

                {/* Advanced Settings */}
                <div>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-3"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Advanced Settings
                    <span className="ml-2">{showAdvanced ? '▼' : '▶'}</span>
                  </button>

                  {showAdvanced && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium mb-2">Detection Threshold: {settings.threshold}</label>
                        <input
                          type="range"
                          min="50"
                          max="200"
                          value={settings.threshold}
                          onChange={(e) => setSettings(prev => ({ ...prev, threshold: Number(e.target.value) }))}
                          className="slider w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Color Tolerance: {settings.colorTolerance}</label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={settings.colorTolerance}
                          onChange={(e) => setSettings(prev => ({ ...prev, colorTolerance: Number(e.target.value) }))}
                          className="slider w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Edge Feather: {settings.feather}px</label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={settings.feather}
                          onChange={(e) => setSettings(prev => ({ ...prev, feather: Number(e.target.value) }))}
                          className="slider w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Edge Smoothing: {settings.edgeSmoothing}</label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={settings.edgeSmoothing}
                          onChange={(e) => setSettings(prev => ({ ...prev, edgeSmoothing: Number(e.target.value) }))}
                          className="slider w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Quality: {Math.round(settings.quality * 100)}%</label>
                        <input
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.1"
                          value={settings.quality}
                          onChange={(e) => setSettings(prev => ({ ...prev, quality: Number(e.target.value) }))}
                          className="slider w-full"
                        />
                      </div>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.preserveDetails}
                          onChange={(e) => setSettings(prev => ({ ...prev, preserveDetails: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm">Preserve fine details</span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={processImage}
                    disabled={isProcessing}
                    loading={isProcessing}
                    icon={Wand2}
                    className="flex-1"
                  >
                    Process Image
                  </Button>
                  <Button
                    variant="outline"
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
                        variant="outline"
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
                    <div className="bg-white rounded-lg p-6 flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <div className="text-center">
                        <p className="font-medium">Processing image...</p>
                        <p className="text-sm text-gray-600">This may take a moment</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {processedImage && (
                <div className="mt-4 text-sm text-gray-600 grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Background:</span> {backgroundType === 'remove' ? 'Removed' : backgroundType}
                  </div>
                  <div>
                    <span className="font-medium">Quality:</span> {Math.round(settings.quality * 100)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvases for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <canvas ref={tempCanvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default BackgroundRemover