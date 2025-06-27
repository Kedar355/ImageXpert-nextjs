'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Type, Download, RotateCcw, Palette, AlignLeft, AlignCenter, AlignRight, Bold, Italic } from 'lucide-react'
// import Button from './ui/Button'
import Button from './Button'

interface TextElement {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  color: string
  bold: boolean
  italic: boolean
  align: 'left' | 'center' | 'right'
  rotation: number
  opacity: number
}

const TextOverlay: React.FC = () => {
  const [image, setImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [textElements, setTextElements] = useState<TextElement[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  const fontFamilies = [
    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
    'Courier New', 'Impact', 'Comic Sans MS', 'Trebuchet MS'
  ]

  const textPresets = [
    { name: 'Heading', fontSize: 48, fontFamily: 'Arial', bold: true, color: '#000000' },
    { name: 'Subheading', fontSize: 32, fontFamily: 'Georgia', bold: false, color: '#333333' },
    { name: 'Body Text', fontSize: 18, fontFamily: 'Verdana', bold: false, color: '#666666' },
    { name: 'Watermark', fontSize: 24, fontFamily: 'Arial', bold: false, color: '#000000', opacity: 0.3 }
  ]

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        setImage(imageData)
        setProcessedImage(null)
        setTextElements([])
        setSelectedElement(null)
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

  const createTextElement = (preset?: any): TextElement => {
    const id = `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const baseElement: TextElement = {
      id,
      text: 'Sample Text',
      x: 100,
      y: 100,
      fontSize: 32,
      fontFamily: 'Arial',
      color: '#000000',
      bold: false,
      italic: false,
      align: 'left',
      rotation: 0,
      opacity: 1
    }

    if (preset) {
      return {
        ...baseElement,
        fontSize: preset.fontSize,
        fontFamily: preset.fontFamily,
        bold: preset.bold,
        color: preset.color,
        opacity: preset.opacity || 1
      }
    }

    return baseElement
  }

  const addTextElement = (preset?: any) => {
    const newElement = createTextElement(preset)
    setTextElements([...textElements, newElement])
    setSelectedElement(newElement.id)
  }

  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(elements =>
      elements.map(el => el.id === id ? { ...el, ...updates } : el)
    )
  }

  const deleteTextElement = (id: string) => {
    setTextElements(elements => elements.filter(el => el.id !== id))
    if (selectedElement === id) {
      setSelectedElement(null)
    }
  }

  const exportImage = () => {
    if (!image || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!

    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)

      // Render text elements
      textElements.forEach(element => {
        ctx.save()

        let fontStyle = ''
        if (element.italic) fontStyle += 'italic '
        if (element.bold) fontStyle += 'bold '
        ctx.font = `${fontStyle}${element.fontSize}px ${element.fontFamily}`

        ctx.fillStyle = element.color
        ctx.globalAlpha = element.opacity
        ctx.textAlign = element.align

        ctx.translate(element.x, element.y)
        ctx.rotate((element.rotation * Math.PI) / 180)

        const lines = element.text.split('\n')
        lines.forEach((line, index) => {
          const yOffset = index * element.fontSize * 1.2
          ctx.fillText(line, 0, yOffset)
        })

        ctx.restore()
      })

      const dataUrl = canvas.toDataURL('image/png')
      setProcessedImage(dataUrl)
    }

    img.src = image
  }

  const downloadImage = () => {
    if (!processedImage) return

    const link = document.createElement('a')
    link.download = 'text-overlay-image.png'
    link.href = processedImage
    link.click()
  }

  const selectedElementData = selectedElement
    ? textElements.find(el => el.id === selectedElement)
    : null

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">Text Overlay</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Add professional text overlays to your images with typography controls and positioning.
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
          <Type className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Add Text to Your Image</h3>
          <p className="text-gray-500">Drag & drop or click to select an image</p>
          <p className="text-sm text-gray-400 mt-2">Supports PNG, JPG, GIF, BMP, WebP</p>
        </div>
      )}

      {image && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Text Presets */}
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Add</h3>
              <div className="space-y-2">
                {textPresets.map((preset) => (
                  <Button
                    key={preset.name}

                    size="sm"
                    onClick={() => addTextElement(preset)}
                    className="w-full justify-start"
                  >
                    {preset.name}
                  </Button>
                ))}
                <Button

                  size="sm"
                  onClick={() => addTextElement()}
                  className="w-full justify-start"
                >
                  Custom Text
                </Button>
              </div>
            </div>

            {/* Text Elements List */}
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Text Elements ({textElements.length})</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {textElements.map((element) => (
                  <div
                    key={element.id}
                    className={`
                      p-3 rounded-lg border cursor-pointer transition-all duration-200
                      ${selectedElement === element.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    onClick={() => setSelectedElement(element.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {element.text.slice(0, 20)}
                        {element.text.length > 20 ? '...' : ''}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTextElement(element.id)
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Text Properties */}
            {selectedElementData && (
              <div className="glass-effect rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Text Properties</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Text Content</label>
                    <textarea
                      value={selectedElementData.text}
                      onChange={(e) => updateTextElement(selectedElementData.id, { text: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Font Size: {selectedElementData.fontSize}px</label>
                      <input
                        type="range"
                        min="8"
                        max="200"
                        value={selectedElementData.fontSize}
                        onChange={(e) => updateTextElement(selectedElementData.id, { fontSize: Number(e.target.value) })}
                        className="slider w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Opacity: {Math.round(selectedElementData.opacity * 100)}%</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={selectedElementData.opacity}
                        onChange={(e) => updateTextElement(selectedElementData.id, { opacity: Number(e.target.value) })}
                        className="slider w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Font Family</label>
                    <select
                      value={selectedElementData.fontFamily}
                      onChange={(e) => updateTextElement(selectedElementData.id, { fontFamily: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {fontFamilies.map((font) => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Text Color</label>
                    <input
                      type="color"
                      value={selectedElementData.color}
                      onChange={(e) => updateTextElement(selectedElementData.id, { color: e.target.value })}
                      className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={selectedElementData.bold ? "primary" : "outline"}
                      size="sm"
                      icon={Bold}
                      onClick={() => updateTextElement(selectedElementData.id, { bold: !selectedElementData.bold })}
                    >
                      Bold
                    </Button>
                    <Button
                      variant={selectedElementData.italic ? "primary" : "outline"}
                      size="sm"
                      icon={Italic}
                      onClick={() => updateTextElement(selectedElementData.id, { italic: !selectedElementData.italic })}
                    >
                      Italic
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">X Position: {selectedElementData.x}px</label>
                      <input
                        type="range"
                        min="0"
                        max="800"
                        value={selectedElementData.x}
                        onChange={(e) => updateTextElement(selectedElementData.id, { x: Number(e.target.value) })}
                        className="slider w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Y Position: {selectedElementData.y}px</label>
                      <input
                        type="range"
                        min="0"
                        max="600"
                        value={selectedElementData.y}
                        onChange={(e) => updateTextElement(selectedElementData.id, { y: Number(e.target.value) })}
                        className="slider w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Rotation: {selectedElementData.rotation}°</label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={selectedElementData.rotation}
                      onChange={(e) => updateTextElement(selectedElementData.id, { rotation: Number(e.target.value) })}
                      className="slider w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="lg:col-span-2">
            <div className="glass-effect rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Text Editor</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={exportImage}
                    disabled={textElements.length === 0}
                  >
                    Apply Text
                  </Button>
                  <Button

                    onClick={() => {
                      setTextElements([])
                      setSelectedElement(null)
                      setProcessedImage(null)
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>

              <div className="relative bg-gray-100 rounded-xl overflow-hidden min-h-96 flex items-center justify-center">
                {image && (
                  <div className="relative">
                    <img
                      src={image}
                      alt="Text editor preview"
                      className="max-w-full max-h-96 object-contain"
                    />

                    {/* Text overlays preview */}
                    {textElements.map((element) => (
                      <div
                        key={element.id}
                        className={`absolute pointer-events-none ${selectedElement === element.id ? 'ring-2 ring-blue-500' : ''}`}
                        style={{
                          left: `${element.x * 0.5}px`, // Scaled for preview
                          top: `${element.y * 0.5}px`,
                          fontSize: `${element.fontSize * 0.5}px`,
                          fontFamily: element.fontFamily,
                          color: element.color,
                          fontWeight: element.bold ? 'bold' : 'normal',
                          fontStyle: element.italic ? 'italic' : 'normal',
                          opacity: element.opacity,
                          transform: `rotate(${element.rotation}deg)`,
                          textAlign: element.align,
                        }}
                      >
                        {element.text}
                      </div>
                    ))}
                  </div>
                )}

                {textElements.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Type className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Click "Add Text" to start</p>
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
                <h3 className="text-lg font-semibold">Final Preview</h3>
                {processedImage && (
                  <Button
                    size="sm"
                    icon={Download}
                    onClick={downloadImage}
                  >
                    Download
                  </Button>
                )}
              </div>

              <div className="relative bg-gray-100 rounded-xl overflow-hidden min-h-48 flex items-center justify-center">
                {processedImage ? (
                  <img
                    src={processedImage}
                    alt="Final result"
                    className="max-w-full max-h-64 object-contain"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <Type className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Final image will appear here</p>
                  </div>
                )}
              </div>

              {textElements.length > 0 && (
                <div className="mt-4 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Text Elements:</span>
                    <span>{textElements.length}</span>
                  </div>
                  {selectedElementData && (
                    <div className="flex justify-between">
                      <span>Selected:</span>
                      <span className="truncate ml-2">{selectedElementData.text.slice(0, 15)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default TextOverlay 