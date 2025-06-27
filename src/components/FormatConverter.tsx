'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Download, RotateCcw, RefreshCw, Archive, FileImage } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
// import Button from './ui/Button'
import Button from './Button'

interface ConversionItem {
  id: string
  originalFile: File
  originalDataUrl: string
  convertedDataUrl: string | null
  status: 'pending' | 'converting' | 'completed' | 'error'
}

const formatOptions = [
  { value: 'image/jpeg', label: 'JPEG', extension: 'jpg', supportsQuality: true },
  { value: 'image/png', label: 'PNG', extension: 'png', supportsQuality: false },
  { value: 'image/webp', label: 'WebP', extension: 'webp', supportsQuality: true },
]

const FormatConverter: React.FC = () => {
  const [items, setItems] = useState<ConversionItem[]>([])
  const [targetFormat, setTargetFormat] = useState(formatOptions[0])
  const [quality, setQuality] = useState(0.9)
  const [isProcessing, setIsProcessing] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newItems: ConversionItem[] = acceptedFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      originalFile: file,
      originalDataUrl: '',
      convertedDataUrl: null,
      status: 'pending'
    }))

    // Load images
    newItems.forEach(item => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setItems(prev => prev.map(i =>
          i.id === item.id
            ? { ...i, originalDataUrl: e.target?.result as string }
            : i
        ))
      }
      reader.readAsDataURL(item.originalFile)
    })

    setItems(prev => [...prev, ...newItems])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.bmp', '.gif', '.svg']
    },
    multiple: true
  })

  const convertImage = async (item: ConversionItem): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!

        canvas.width = img.width
        canvas.height = img.height

        // Fill with white background for JPEG
        if (targetFormat.value === 'image/jpeg') {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        ctx.drawImage(img, 0, 0)

        const convertedDataUrl = canvas.toDataURL(
          targetFormat.value,
          targetFormat.supportsQuality ? quality : undefined
        )
        resolve(convertedDataUrl)
      }
      img.onerror = reject
      img.src = item.originalDataUrl
    })
  }

  const convertAll = async () => {
    if (items.length === 0) return

    setIsProcessing(true)

    for (const item of items) {
      if (item.status === 'completed') continue

      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, status: 'converting' } : i
      ))

      try {
        const convertedDataUrl = await convertImage(item)
        setItems(prev => prev.map(i =>
          i.id === item.id
            ? { ...i, convertedDataUrl, status: 'completed' }
            : i
        ))
      } catch (error) {
        console.error('Conversion error:', error)
        setItems(prev => prev.map(i =>
          i.id === item.id ? { ...i, status: 'error' } : i
        ))
      }

      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setIsProcessing(false)
  }

  const downloadSingle = (item: ConversionItem) => {
    if (!item.convertedDataUrl) return

    const link = document.createElement('a')
    link.href = item.convertedDataUrl
    link.download = `${item.originalFile.name.split('.')[0]}.${targetFormat.extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadAll = async () => {
    const completedItems = items.filter(item => item.convertedDataUrl)
    if (completedItems.length === 0) return

    const zip = new JSZip()

    completedItems.forEach(item => {
      if (item.convertedDataUrl) {
        const base64Data = item.convertedDataUrl.split(',')[1]
        const fileName = `${item.originalFile.name.split('.')[0]}.${targetFormat.extension}`
        zip.file(fileName, base64Data, { base64: true })
      }
    })

    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, `converted-images-${targetFormat.extension}.zip`)
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const handleReset = () => {
    setItems([])
  }

  const getStatusColor = (status: ConversionItem['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500'
      case 'converting': return 'text-blue-500'
      case 'completed': return 'text-green-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusText = (status: ConversionItem['status']) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'converting': return 'Converting...'
      case 'completed': return 'Completed'
      case 'error': return 'Error'
      default: return 'Unknown'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <RefreshCw className="w-8 h-8 text-orange-600 mr-3" />
          <h1 className="text-3xl font-bold gradient-text">Format Converter</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Convert your images between different formats with ease. Supports batch processing and quality optimization.
        </p>
      </div>

      <div className="grid xl:grid-cols-3 gap-8">
        {/* Upload & File List */}
        <div className="xl:col-span-2 space-y-6">
          {/* Upload */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload Images
              </h2>
              <span className="text-sm text-gray-500">
                {items.length} files selected
              </span>
            </div>

            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
                ${isDragActive
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'
                }
              `}
            >
              <input {...getInputProps()} />

              <div className="space-y-4">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    {isDragActive ? 'Drop images here' : 'Drag & drop images'}
                  </p>
                  <p className="text-gray-500 mt-1">or click to select multiple files</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Supports: JPEG, PNG, WebP, BMP, GIF, SVG
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* File List */}
          {items.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Files to Convert</h2>
                <div className="flex space-x-2">
                  <Button
                    onClick={convertAll}
                    loading={isProcessing}
                    disabled={items.length === 0}
                  >
                    Convert All
                  </Button>
                  <Button
                    onClick={handleReset}

                    icon={RotateCcw}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {item.originalDataUrl ? (
                        <img
                          src={item.originalDataUrl}
                          alt={item.originalFile.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <FileImage className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {item.originalFile.name}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatFileSize(item.originalFile.size)}</span>
                        <span className={getStatusColor(item.status)}>
                          {getStatusText(item.status)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {item.convertedDataUrl && (
                        <Button
                          onClick={() => downloadSingle(item)}

                          size="sm"
                          icon={Download}
                        >
                          Download
                        </Button>
                      )}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {items.filter(item => item.convertedDataUrl).length > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button
                    onClick={downloadAll}
                    icon={Archive}
                  >
                    Download All as ZIP
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">Conversion Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Format
                </label>
                <select
                  value={targetFormat.value}
                  onChange={(e) => {
                    const format = formatOptions.find(f => f.value === e.target.value)
                    if (format) setTargetFormat(format)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {formatOptions.map((format) => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </select>
              </div>

              {targetFormat.supportsQuality && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality: {Math.round(quality * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Lower quality, smaller file</span>
                    <span>Higher quality, larger file</span>
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Format Guide</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>JPEG:</strong> Best for photos, smaller files</p>
                  <p><strong>PNG:</strong> Best for graphics, supports transparency</p>
                  <p><strong>WebP:</strong> Modern format, excellent compression</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          {items.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold mb-4">Statistics</h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Files:</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium text-green-600">
                    {items.filter(item => item.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-medium text-gray-500">
                    {items.filter(item => item.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Converting:</span>
                  <span className="font-medium text-blue-500">
                    {items.filter(item => item.status === 'converting').length}
                  </span>
                </div>
                {items.filter(item => item.status === 'error').length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Errors:</span>
                    <span className="font-medium text-red-500">
                      {items.filter(item => item.status === 'error').length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FormatConverter 