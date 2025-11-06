import { useState, useEffect, useRef } from 'react'
import {
  RefreshCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  AlertCircle,
  Smartphone,
  Monitor,
  Tablet,
  X
} from 'lucide-react'

interface EnhancedPreviewProps {
  projectPath: string
  previewUrl?: string
}

type ViewportSize = 'mobile' | 'tablet' | 'desktop' | 'fullscreen'

interface BuildError {
  message: string
  file?: string
  line?: number
}

export default function EnhancedPreview({ projectPath, previewUrl = 'http://localhost:8002' }: EnhancedPreviewProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<BuildError[]>([])
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [isMaximized, setIsMaximized] = useState(false)
  const [showErrors, setShowErrors] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Auto-reload on file changes (polling for now, can be upgraded to WebSocket)
  useEffect(() => {
    const checkForChanges = setInterval(() => {
      // This would be better with WebSocket file watcher
      // For now, we'll just reload periodically if there were recent saves
      const timeSinceRefresh = Date.now() - lastRefresh
      if (timeSinceRefresh > 5000 && timeSinceRefresh < 6000) {
        handleRefresh()
      }
    }, 1000)

    return () => clearInterval(checkForChanges)
  }, [lastRefresh])

  const handleRefresh = () => {
    setIsLoading(true)
    setErrors([])

    if (iframeRef.current) {
      const currentUrl = iframeRef.current.src
      iframeRef.current.src = ''
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentUrl
        }
        setIsLoading(false)
      }, 100)
    }

    setLastRefresh(Date.now())
  }

  const handleOpenExternal = () => {
    window.open(previewUrl, '_blank')
  }

  const getViewportDimensions = (): { width: string; height: string } => {
    switch (viewport) {
      case 'mobile':
        return { width: '375px', height: '667px' }
      case 'tablet':
        return { width: '768px', height: '1024px' }
      case 'desktop':
        return { width: '100%', height: '100%' }
      case 'fullscreen':
        return { width: '100vw', height: '100vh' }
    }
  }

  const dimensions = getViewportDimensions()

  return (
    <div className={`flex flex-col bg-gray-900 ${
      isMaximized ? 'fixed inset-0 z-50' : 'h-full'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white">Live Preview</h3>
          {isLoading && (
            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Viewport Selector */}
          <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-1">
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1.5 rounded ${
                viewport === 'mobile' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Mobile view"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1.5 rounded ${
                viewport === 'tablet' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Tablet view"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1.5 rounded ${
                viewport === 'desktop' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Desktop view"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          {/* Controls */}
          <button
            onClick={handleRefresh}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Refresh preview"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenExternal}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title={isMaximized ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {isMaximized && (
            <button
              onClick={() => setIsMaximized(false)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error Overlay */}
      {errors.length > 0 && showErrors && (
        <div className="bg-red-900/20 border-b border-red-500/50 px-4 py-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2 flex-1">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-400 mb-1">Build Errors</h4>
                <div className="space-y-1">
                  {errors.slice(0, 3).map((error, index) => (
                    <div key={index} className="text-xs text-red-300">
                      {error.file && (
                        <span className="font-mono text-red-400">{error.file}:{error.line} </span>
                      )}
                      {error.message}
                    </div>
                  ))}
                </div>
                {errors.length > 3 && (
                  <p className="text-xs text-red-400 mt-1">
                    +{errors.length - 3} more errors
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowErrors(false)}
              className="text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Preview Container */}
      <div className="flex-1 flex items-center justify-center bg-gray-950 overflow-auto p-4">
        <div
          className={`bg-white rounded-lg shadow-2xl overflow-hidden transition-all ${
            viewport === 'desktop' ? 'w-full h-full' : ''
          }`}
          style={{
            width: dimensions.width,
            height: dimensions.height,
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false)
              setErrors([{
                message: 'Failed to load preview. Make sure the dev server is running.'
              }])
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 px-4 py-2 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>Viewport: {viewport}</span>
          {viewport !== 'desktop' && (
            <span>{dimensions.width} × {dimensions.height}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${errors.length > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
          <span>{errors.length > 0 ? `${errors.length} errors` : 'Ready'}</span>
        </div>
      </div>
    </div>
  )
}
