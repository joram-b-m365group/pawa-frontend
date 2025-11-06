import { useState, useEffect, useRef } from 'react'
import { X, Maximize2, Minimize2, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface ArtifactViewerProps {
  code: string
  type: 'react' | 'html' | 'svg' | 'markdown' | 'mermaid'
  title?: string
  onClose?: () => void
}

export default function ArtifactViewer({ code, type, title, onClose }: ArtifactViewerProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [copied, setCopied] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (type === 'react' || type === 'html') {
      renderPreview()
    }
  }, [code, type, previewKey])

  const renderPreview = () => {
    if (!iframeRef.current) return

    const iframe = iframeRef.current
    const doc = iframe.contentDocument || iframe.contentWindow?.document

    if (!doc) return

    let htmlContent = ''

    if (type === 'react') {
      // Convert React JSX to HTML (simplified version)
      // In production, you'd use Babel or a proper transpiler
      const convertedCode = convertReactToHTML(code)
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
            <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; }
              * { box-sizing: border-box; }
            </style>
          </head>
          <body>
            <div id="root"></div>
            <script type="text/babel">
              ${code}
            </script>
          </body>
        </html>
      `
    } else if (type === 'html') {
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; }
              * { box-sizing: border-box; }
            </style>
          </head>
          <body>
            ${code}
          </body>
        </html>
      `
    } else if (type === 'svg') {
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 16px; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f9fafb; }
              svg { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            ${code}
          </body>
        </html>
      `
    }

    doc.open()
    doc.write(htmlContent)
    doc.close()
  }

  const convertReactToHTML = (reactCode: string): string => {
    // Simple conversion for demo purposes
    // In production, use proper JSX transpilation
    return reactCode
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Code copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRefresh = () => {
    setPreviewKey(prev => prev + 1)
    toast.success('Preview refreshed')
  }

  const handleOpenExternal = () => {
    const blob = new Blob([code], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return (
    <div
      className={`
        ${isMaximized ? 'fixed inset-0 z-50' : 'relative'}
        flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg
      `}
      style={isMaximized ? {} : { height: '600px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-gray-800">
            {title || 'Live Preview'}
          </h3>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
            {type}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleCopy}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleOpenExternal}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            title={isMaximized ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden bg-white">
        {(type === 'react' || type === 'html' || type === 'svg') && (
          <iframe
            ref={iframeRef}
            key={previewKey}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-scripts"
          />
        )}

        {type === 'markdown' && (
          <div className="w-full h-full overflow-auto p-6 prose prose-slate max-w-none">
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(code) }} />
          </div>
        )}

        {type === 'mermaid' && (
          <div className="w-full h-full flex items-center justify-center p-6">
            <div className="text-center">
              <p className="text-gray-500 mb-2">Mermaid diagram</p>
              <p className="text-xs text-gray-400">Mermaid rendering coming soon</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
        <span>Interactive preview • Updates in real-time</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Ready</span>
        </div>
      </div>
    </div>
  )
}

// Simple markdown renderer (you can use a library like marked or remark)
function renderMarkdown(markdown: string): string {
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n/gim, '<br>')
}
