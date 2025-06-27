'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Palette, Download, Copy, Check, Eye, Grid } from 'lucide-react'
import Button from './Button'

interface ColorInfo {
  hex: string
  rgb: string
  hsl: string
  cmyk: string
  name: string
  percentage: number
}

const ColorExtractor: React.FC = () => {
  const [image, setImage] = useState<string | null>(null)
  const [extractedColors, setExtractedColors] = useState<ColorInfo[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [colorCount, setColorCount] = useState(8)
  const [extractionMethod, setExtractionMethod] = useState<'dominant' | 'average' | 'palette'>('dominant')
  const [copiedColor, setCopiedColor] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<ColorInfo | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        setImage(imageData)
        setExtractedColors([])
        setSelectedColor(null)
        extractColors(imageData)
      }
      reader.readAsDataURL(file)
    }
  }, [colorCount, extractionMethod])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    multiple: false
  })

  // Convert RGB to HSL
  const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255
    g /= 255
    b /= 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
  }

  // Convert RGB to CMYK
  const rgbToCmyk = (r: number, g: number, b: number): [number, number, number, number] => {
    r /= 255
    g /= 255
    b /= 255

    const k = 1 - Math.max(r, g, b)
    const c = k === 1 ? 0 : (1 - r - k) / (1 - k)
    const m = k === 1 ? 0 : (1 - g - k) / (1 - k)
    const y = k === 1 ? 0 : (1 - b - k) / (1 - k)

    return [Math.round(c * 100), Math.round(m * 100), Math.round(y * 100), Math.round(k * 100)]
  }

  // Get color name (simplified)
  const getColorName = (r: number, g: number, b: number): string => {
    const colors = [
      { name: 'Black', r: 0, g: 0, b: 0 },
      { name: 'White', r: 255, g: 255, b: 255 },
      { name: 'Red', r: 255, g: 0, b: 0 },
      { name: 'Green', r: 0, g: 255, b: 0 },
      { name: 'Blue', r: 0, g: 0, b: 255 },
      { name: 'Yellow', r: 255, g: 255, b: 0 },
      { name: 'Cyan', r: 0, g: 255, b: 255 },
      { name: 'Magenta', r: 255, g: 0, b: 255 },
      { name: 'Orange', r: 255, g: 165, b: 0 },
      { name: 'Purple', r: 128, g: 0, b: 128 },
      { name: 'Pink', r: 255, g: 192, b: 203 },
      { name: 'Brown', r: 165, g: 42, b: 42 },
      { name: 'Gray', r: 128, g: 128, b: 128 },
    ]

    let minDistance = Infinity
    let closestColor = 'Unknown'

    colors.forEach(color => {
      const distance = Math.sqrt(
        Math.pow(r - color.r, 2) +
        Math.pow(g - color.g, 2) +
        Math.pow(b - color.b, 2)
      )
      if (distance < minDistance) {
        minDistance = distance
        closestColor = color.name
      }
    })

    return closestColor
  }

  const extractColors = async (imageData: string) => {
    if (!canvasRef.current) return

    setIsExtracting(true)

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')!

      const img = new Image()
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        const colorMap = new Map<string, number>()

        // Sample pixels for color extraction
        const sampleRate = Math.max(1, Math.floor(data.length / 40000)) // Sample for performance

        for (let i = 0; i < data.length; i += 4 * sampleRate) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const a = data[i + 3]

          if (a > 128) { // Only count non-transparent pixels
            let colorKey: string

            if (extractionMethod === 'dominant') {
              // Group similar colors together
              const rBin = Math.floor(r / 32) * 32
              const gBin = Math.floor(g / 32) * 32
              const bBin = Math.floor(b / 32) * 32
              colorKey = `${rBin},${gBin},${bBin}`
            } else {
              colorKey = `${r},${g},${b}`
            }

            colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1)
          }
        }

        // Sort colors by frequency
        const sortedColors = Array.from(colorMap.entries())
          .sort(([, a], [, b]) => b - a)
          .slice(0, colorCount)

        const totalPixels = sortedColors.reduce((sum, [, count]) => sum + count, 0)

        const colors: ColorInfo[] = sortedColors.map(([colorKey, count]) => {
          const [r, g, b] = colorKey.split(',').map(Number)
          const [h, s, l] = rgbToHsl(r, g, b)
          const [c, m, y, k] = rgbToCmyk(r, g, b)

          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
          const percentage = Math.round((count / totalPixels) * 100 * 100) / 100

          return {
            hex: hex.toUpperCase(),
            rgb: `rgb(${r}, ${g}, ${b})`,
            hsl: `hsl(${h}, ${s}%, ${l}%)`,
            cmyk: `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`,
            name: getColorName(r, g, b),
            percentage
          }
        })

        setExtractedColors(colors)
        setIsExtracting(false)
      }

      img.src = imageData
    } catch (error) {
      console.error('Error extracting colors:', error)
      setIsExtracting(false)
    }
  }

  const copyToClipboard = (text: string, colorId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedColor(colorId)
      setTimeout(() => setCopiedColor(null), 2000)
    })
  }

  const downloadPalette = () => {
    if (extractedColors.length === 0) return

    const paletteData = {
      colors: extractedColors,
      extractionMethod,
      colorCount,
      extractedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(paletteData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.download = `color-palette-${Date.now()}.json`
    link.href = url
    link.click()

    URL.revokeObjectURL(url)
  }

  const generatePaletteImage = () => {
    if (extractedColors.length === 0 || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!

    canvas.width = 800
    canvas.height = 200

    const colorWidth = canvas.width / extractedColors.length

    extractedColors.forEach((color, index) => {
      ctx.fillStyle = color.hex
      ctx.fillRect(index * colorWidth, 0, colorWidth, canvas.height)
    })

    const link = document.createElement('a')
    link.download = `color-palette-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">Color Extractor</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Extract dominant colors from your images and get detailed color information in multiple formats.
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
          <Palette className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Extract Colors from Image</h3>
          <p className="text-gray-500">Drag & drop or click to select an image</p>
          <p className="text-sm text-gray-400 mt-2">Supports PNG, JPG, GIF, BMP, WebP</p>
        </div>
      )}

      {image && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Extraction Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Method</label>
                  <div className="space-y-2">
                    {[
                      { value: 'dominant', label: 'Dominant Colors' },
                      { value: 'average', label: 'Average Colors' },
                      { value: 'palette', label: 'Color Palette' }
                    ].map((method) => (
                      <button
                        key={method.value}
                        onClick={() => {
                          setExtractionMethod(method.value as any)
                          if (image) extractColors(image)
                        }}
                        className={`
                          w-full p-2 rounded-lg border transition-all duration-200 text-sm text-left
                          ${extractionMethod === method.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                          }
                        `}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Color Count: {colorCount}</label>
                  <input
                    type="range"
                    min="3"
                    max="16"
                    value={colorCount}
                    onChange={(e) => {
                      setColorCount(Number(e.target.value))
                      if (image) extractColors(image)
                    }}
                    className="slider w-full"
                  />
                </div>

                <div className="flex gap-2">
                  <Button

                    size="sm"
                    onClick={() => {
                      setImage(null)
                      setExtractedColors([])
                      setSelectedColor(null)
                    }}
                    className="flex-1"
                  >
                    New Image
                  </Button>
                  <Button

                    size="sm"
                    icon={Download}
                    onClick={downloadPalette}
                    disabled={extractedColors.length === 0}
                  >
                    Export
                  </Button>
                </div>
              </div>
            </div>

            {/* Image Preview */}
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Source Image</h3>
              <div className="bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={image}
                  alt="Source for color extraction"
                  className="w-full h-auto object-contain max-h-48"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {isExtracting ? (
              <div className="glass-effect rounded-2xl p-12 text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">Extracting Colors...</h3>
                <p className="text-gray-600">Analyzing image colors using {extractionMethod} method</p>
              </div>
            ) : extractedColors.length > 0 ? (
              <div className="space-y-6">
                {/* Color Palette */}
                <div className="glass-effect rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      {extractedColors.length} colors extracted using {extractionMethod} method
                    </h3>
                    <Button
                      size="sm"
                      icon={Download}
                      onClick={generatePaletteImage}
                    >
                      Export Palette
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {extractedColors.map((color, index) => (
                      <div
                        key={index}
                        className={`
                          rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200 hover:scale-105
                          ${selectedColor === color ? 'border-blue-500 shadow-lg' : 'border-gray-200'}
                        `}
                        onClick={() => setSelectedColor(color)}
                      >
                        <div
                          className="w-full h-24"
                          style={{ backgroundColor: color.hex }}
                        />
                        <div className="p-3 bg-white">
                          <div className="text-xs font-mono text-gray-600 mb-1">{color.hex}</div>
                          <div className="text-xs text-gray-500">{color.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Color Details */}
                {selectedColor && (
                  <div className="glass-effect rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Color Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div
                          className="w-full h-32 rounded-xl border border-gray-300 mb-4"
                          style={{ backgroundColor: selectedColor.hex }}
                        />
                        <div className="text-center">
                          <h4 className="font-semibold text-lg">{selectedColor.name}</h4>
                          <p className="text-gray-600">{selectedColor.percentage}% of image</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {[
                          { label: 'HEX', value: selectedColor.hex, key: 'hex' },
                          { label: 'RGB', value: selectedColor.rgb, key: 'rgb' },
                          { label: 'HSL', value: selectedColor.hsl, key: 'hsl' },
                          { label: 'CMYK', value: selectedColor.cmyk, key: 'cmyk' }
                        ].map((format) => (
                          <div key={format.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium">{format.label}</div>
                              <div className="text-sm text-gray-600 font-mono">{format.value}</div>
                            </div>
                            <Button

                              size="sm"
                              icon={copiedColor === `${selectedColor.hex}-${format.key}` ? Check : Copy}
                              onClick={() => copyToClipboard(format.value, `${selectedColor.hex}-${format.key}`)}
                            >
                              {copiedColor === `${selectedColor.hex}-${format.key}` ? 'Copied' : 'Copy'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default ColorExtractor 