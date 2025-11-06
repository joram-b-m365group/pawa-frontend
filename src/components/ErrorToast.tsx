import { useState, useEffect } from 'react'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, RefreshCw } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ErrorToastProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export default function ErrorToast({ toasts, onRemove }: ErrorToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10)

    // Auto-dismiss
    if (toast.duration) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, toast.duration)

      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 300)
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getStyles = () => {
    const base = "border-2 "
    switch (toast.type) {
      case 'success':
        return base + "bg-green-900/20 border-green-500/50"
      case 'error':
        return base + "bg-red-900/20 border-red-500/50"
      case 'warning':
        return base + "bg-yellow-900/20 border-yellow-500/50"
      case 'info':
        return base + "bg-blue-900/20 border-blue-500/50"
    }
  }

  const getTextColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-100'
      case 'error':
        return 'text-red-100'
      case 'warning':
        return 'text-yellow-100'
      case 'info':
        return 'text-blue-100'
    }
  }

  return (
    <div
      className={`${getStyles()} backdrop-blur-sm rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ${
        isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${getTextColor()}`}>{toast.message}</p>
          {toast.description && (
            <p className="text-xs text-gray-300 mt-1">{toast.description}</p>
          )}
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.onClick()
                handleDismiss()
              }}
              className="mt-2 text-xs font-medium text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (
    type: ToastType,
    message: string,
    options?: {
      description?: string
      duration?: number
      action?: { label: string; onClick: () => void }
    }
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    const toast: Toast = {
      id,
      type,
      message,
      description: options?.description,
      duration: options?.duration ?? (type === 'error' ? 5000 : 3000),
      action: options?.action
    }
    setToasts((prev) => [...prev, toast])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const success = (message: string, options?: Parameters<typeof addToast>[2]) => {
    addToast('success', message, options)
  }

  const error = (message: string, options?: Parameters<typeof addToast>[2]) => {
    addToast('error', message, options)
  }

  const warning = (message: string, options?: Parameters<typeof addToast>[2]) => {
    addToast('warning', message, options)
  }

  const info = (message: string, options?: Parameters<typeof addToast>[2]) => {
    addToast('info', message, options)
  }

  return {
    toasts,
    removeToast,
    success,
    error,
    warning,
    info
  }
}

// Error handler utility
export function handleApiError(error: any, toast: ReturnType<typeof useToast>) {
  let message = 'An unexpected error occurred'
  let description = 'Please try again'

  if (error.response) {
    // Server responded with error
    message = error.response.data?.message || 'Server Error'
    description = error.response.data?.detail || `Status: ${error.response.status}`
  } else if (error.request) {
    // Request made but no response
    message = 'Connection Failed'
    description = 'Unable to reach the server. Check your internet connection.'
  } else {
    // Something else went wrong
    message = error.message || 'Unknown Error'
  }

  toast.error(message, {
    description,
    duration: 5000,
    action: {
      label: 'Retry',
      onClick: () => {
        window.location.reload()
      }
    }
  })
}
