import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorCount: number
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }))

    // Log to error reporting service (e.g., Sentry)
    if (typeof window !== 'undefined') {
      // @ts-ignore
      if (window.Sentry) {
        // @ts-ignore
        window.Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
      }
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, errorInfo, errorCount } = this.state

      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-gray-800 border-2 border-red-500/50 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-xl font-bold text-white">Something went wrong</h1>
                <p className="text-red-100 text-sm">Don't worry, we can fix this</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Error Message */}
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                <h3 className="text-red-300 font-semibold mb-2 flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Error Details
                </h3>
                <p className="text-red-200 text-sm font-mono">
                  {error?.toString() || 'Unknown error'}
                </p>
              </div>

              {/* Suggestions */}
              <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                <h3 className="text-blue-300 font-semibold mb-3">What you can try:</h3>
                <ul className="space-y-2 text-sm text-blue-200">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>Click "Try Again" to retry the failed operation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>Refresh the page if the error persists</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>Check your internet connection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>Clear your browser cache and reload</span>
                  </li>
                  {errorCount > 2 && (
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">⚠</span>
                      <span className="text-orange-300">
                        Multiple errors detected. Consider reloading the page.
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Stack Trace (collapsed) */}
              {errorInfo && (
                <details className="bg-gray-900 border border-gray-700 rounded-lg">
                  <summary className="px-4 py-3 cursor-pointer text-gray-400 text-sm hover:text-white transition-colors">
                    Technical Details (for developers)
                  </summary>
                  <div className="px-4 pb-3 pt-2 border-t border-gray-700">
                    <pre className="text-xs text-gray-400 overflow-x-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-900 border-t border-gray-700 flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
