'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, BarChart3, Download, Eye, Palette, Info } from 'lucide-react'
// import Button from './ui/Button'
import Button from './Button'

interface AnalysisResult {
  dimensions: { width: number; height: number }
  fileSize: number
  format: string
  colorProfile: {
    dominantColors: string[]
    averageColor: string
    brightness: number
    contrast: number
  }
  histogram: {
    red: number[]
    green: number[]
    blue: number[]
  }
  metadata: {
    aspectRatio: string
    megapixels: number
    quality: 'Low' | 'Medium' | 'High'
  }
}

const ImageAnalyzer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'colors' | 'histogram'>('overview')

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type.startsWith('image/')) {
      setOriginalFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        setImage(imageData)
        setAnalysisResult(null)
        analyzeImage(imageData, file)
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

  const analyzeImage = async (imageData: string, file: File) => {
    if (!canvasRef.current) return

    setIsAnalyzing(true)

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

        // Calculate basic statistics
        let totalR = 0, totalG = 0, totalB = 0
        let minBrightness = 255, maxBrightness = 0
        const colorCounts: { [key: string]: number } = {}

        // Create histograms
        const redHist = new Array(256).fill(0)
        const greenHist = new Array(256).fill(0)
        const blueHist = new Array(256).fill(0)

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]

          totalR += r
          totalG += g
          totalB += b

          // Calculate brightness
          const brightness = (r + g + b) / 3
          minBrightness = Math.min(minBrightness, brightness)
          maxBrightness = Math.max(maxBrightness, brightness)

          // Update histograms
          redHist[r]++
          greenHist[g]++
          blueHist[b]++

          // Count colors (simplified)
          const colorKey = `${Math.floor(r / 32) * 32},${Math.floor(g / 32) * 32},${Math.floor(b / 32) * 32}`
          colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1
        }

        const pixelCount = data.length / 4
        const avgR = Math.round(totalR / pixelCount)
        const avgG = Math.round(totalG / pixelCount)
        const avgB = Math.round(totalB / pixelCount)

        // Get dominant colors
        const sortedColors = Object.entries(colorCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([color]) => `rgb(${color})`)

        // Calculate quality estimation
        const aspectRatio = img.width / img.height
        const megapixels = (img.width * img.height) / 1000000
        let quality: 'Low' | 'Medium' | 'High' = 'Medium'

        if (megapixels > 5) quality = 'High'
        else if (megapixels < 1) quality = 'Low'

        const result: AnalysisResult = {
          dimensions: { width: img.width, height: img.height },
          fileSize: file.size,
          format: file.type.split('/')[1].toUpperCase(),
          colorProfile: {
            dominantColors: sortedColors,
            averageColor: `rgb(${avgR}, ${avgG}, ${avgB})`,
            brightness: Math.round(((avgR + avgG + avgB) / 3 / 255) * 100),
            contrast: Math.round(((maxBrightness - minBrightness) / 255) * 100)
          },
          histogram: {
            red: redHist,
            green: greenHist,
            blue: blueHist
          },
          metadata: {
            aspectRatio: aspectRatio > 1 ? `${Math.round(aspectRatio * 10) / 10}:1` : `1:${Math.round((1 / aspectRatio) * 10) / 10}`,
            megapixels: Math.round(megapixels * 10) / 10,
            quality
          }
        }

        setAnalysisResult(result)
        setIsAnalyzing(false)
      }

      img.src = imageData
    } catch (error) {
      console.error('Error analyzing image:', error)
      setIsAnalyzing(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const downloadReport = () => {
    if (!analysisResult || !originalFile) return

    const report = {
      filename: originalFile.name,
      analysis: analysisResult,
      timestamp: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.download = `analysis-${originalFile.name.split('.')[0]}.json`
    link.href = url
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">Image Analyzer</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Analyze your images to get detailed information about colors, dimensions, and technical properties.
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
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Analyze Your Image</h3>
          <p className="text-gray-500">Drag & drop or click to select an image for analysis</p>
          <p className="text-sm text-gray-400 mt-2">Supports PNG, JPG, GIF, BMP, WebP</p>
        </div>
      )}

      {image && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Image Preview */}
          <div className="lg:col-span-1">
            <div className="glass-effect rounded-2xl p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Image Preview</h3>
                <Button

                  size="sm"
                  onClick={() => {
                    setImage(null)
                    setAnalysisResult(null)
                    setOriginalFile(null)
                  }}
                >
                  New Image
                </Button>
              </div>

              <div className="bg-gray-100 rounded-xl overflow-hidden mb-4">
                <img
                  src={image}
                  alt="Analysis preview"
                  className="w-full h-auto object-contain max-h-64"
                />
              </div>

              {originalFile && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Filename:</span>
                    <span className="font-medium truncate ml-2">{originalFile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">{formatFileSize(originalFile.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{originalFile.type}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Analysis Results */}
          <div className="lg:col-span-2">
            {isAnalyzing ? (
              <div className="glass-effect rounded-2xl p-12 text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">Analyzing Image...</h3>
                <p className="text-gray-600">This may take a few moments</p>
              </div>
            ) : analysisResult ? (
              <div className="space-y-6">
                {/* Tabs */}
                <div className="glass-effect rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                      {[
                        { id: 'overview', label: 'Overview', icon: Info },
                        { id: 'colors', label: 'Colors', icon: Palette },
                        { id: 'histogram', label: 'Histogram', icon: BarChart3 }
                      ].map((tab) => {
                        const Icon = tab.icon
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`
                              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                              ${activeTab === tab.id
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                              }
                            `}
                          >
                            <Icon size={16} />
                            {tab.label}
                          </button>
                        )
                      })}
                    </div>
                    <Button
                      size="sm"
                      icon={Download}
                      onClick={downloadReport}
                    >
                      Download Report
                    </Button>
                  </div>

                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Dimensions & Format</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Resolution:</span>
                            <span className="font-medium">{analysisResult.dimensions.width} × {analysisResult.dimensions.height}px</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Aspect Ratio:</span>
                            <span className="font-medium">{analysisResult.metadata.aspectRatio}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Megapixels:</span>
                            <span className="font-medium">{analysisResult.metadata.megapixels} MP</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Format:</span>
                            <span className="font-medium">{analysisResult.format}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Quality:</span>
                            <span className={`font-medium ${analysisResult.metadata.quality === 'High' ? 'text-green-600' :
                              analysisResult.metadata.quality === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                              {analysisResult.metadata.quality}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Color Analysis</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Average Color:</span>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: analysisResult.colorProfile.averageColor }}
                              />
                              <span className="font-medium text-xs">{analysisResult.colorProfile.averageColor}</span>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Brightness:</span>
                            <span className="font-medium">{analysisResult.colorProfile.brightness}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Contrast:</span>
                            <span className="font-medium">{analysisResult.colorProfile.contrast}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Colors Tab */}
                  {activeTab === 'colors' && (
                    <div>
                      <h4 className="font-semibold mb-4">Dominant Colors</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {analysisResult.colorProfile.dominantColors.map((color, index) => (
                          <div key={index} className="text-center">
                            <div
                              className="w-full h-16 rounded-lg border border-gray-300 mb-2"
                              style={{ backgroundColor: color }}
                            />
                            <p className="text-xs font-medium text-gray-600">{color}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Histogram Tab */}
                  {activeTab === 'histogram' && (
                    <div>
                      <h4 className="font-semibold mb-4">Color Histograms</h4>
                      <div className="space-y-6">
                        {['red', 'green', 'blue'].map((channel) => (
                          <div key={channel}>
                            <h5 className="text-sm font-medium mb-2 capitalize">{channel} Channel</h5>
                            <div className="h-20 bg-gray-100 rounded-lg flex items-end justify-center p-2">
                              <div className="flex items-end h-full w-full max-w-md gap-px">
                                {analysisResult.histogram[channel as keyof typeof analysisResult.histogram]
                                  .filter((_, i) => i % 8 === 0) // Sample every 8th value for display
                                  .map((value, index) => {
                                    const maxValue = Math.max(...analysisResult.histogram[channel as keyof typeof analysisResult.histogram])
                                    const height = (value / maxValue) * 100
                                    return (
                                      <div
                                        key={index}
                                        className={`flex-1 bg-${channel}-500 rounded-sm opacity-70`}
                                        style={{
                                          height: `${height}%`,
                                          backgroundColor: channel === 'red' ? '#ef4444' :
                                            channel === 'green' ? '#10b981' : '#3b82f6'
                                        }}
                                      />
                                    )
                                  })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Hidden canvas for analysis */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default ImageAnalyzer 