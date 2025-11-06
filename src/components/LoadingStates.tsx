import { Loader2, Code, Brain, Sparkles } from 'lucide-react'

// Spinner Loader
export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin ${className}`} />
  )
}

// Full Page Loader
export function LoadingPage({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4 animate-pulse">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{message}</h2>
        <LoadingSpinner size="lg" className="text-purple-400 mx-auto" />
      </div>
    </div>
  )
}

// Skeleton Loaders
export function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-700 rounded animate-pulse ${className}`} style={{ height: '1rem' }} />
  )
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-700 rounded-lg animate-pulse ${className}`} />
  )
}

export function SkeletonCodeEditor() {
  return (
    <div className="w-full h-full bg-gray-900 p-4 space-y-3">
      <SkeletonLine className="w-1/4" />
      <SkeletonLine className="w-3/4" />
      <SkeletonLine className="w-1/2" />
      <SkeletonLine className="w-5/6" />
      <div className="h-4" />
      <SkeletonLine className="w-2/3" />
      <SkeletonLine className="w-4/5" />
      <SkeletonLine className="w-1/3" />
    </div>
  )
}

export function SkeletonChat() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          {/* User message */}
          <div className="flex justify-end mb-2">
            <SkeletonBlock className="w-2/3 h-16" />
          </div>
          {/* AI message */}
          <div className="flex justify-start">
            <SkeletonBlock className="w-3/4 h-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonFileList() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonBlock className="w-8 h-8" />
          <SkeletonLine className="flex-1" />
        </div>
      ))}
    </div>
  )
}

// Progress Bar
export function ProgressBar({ progress, label, showPercentage = true }: { progress: number; label?: string; showPercentage?: boolean }) {
  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm text-gray-300">{label}</span>}
          {showPercentage && <span className="text-sm text-purple-400 font-medium">{Math.round(progress)}%</span>}
        </div>
      )}
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  )
}

// Circular Progress
export function CircularProgress({ progress, size = 64, strokeWidth = 4 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-purple-500 transition-all duration-300"
        />
      </svg>
      <span className="absolute text-sm font-bold text-white">
        {Math.round(progress)}%
      </span>
    </div>
  )
}

// Operation Status Indicators
export function OperationStatus({ status, message }: { status: 'idle' | 'loading' | 'success' | 'error'; message: string }) {
  const statusConfig = {
    idle: { icon: <Code className="w-5 h-5" />, color: 'text-gray-400', bg: 'bg-gray-800' },
    loading: { icon: <Loader2 className="w-5 h-5 animate-spin" />, color: 'text-blue-400', bg: 'bg-blue-900/20' },
    success: { icon: <Sparkles className="w-5 h-5" />, color: 'text-green-400', bg: 'bg-green-900/20' },
    error: { icon: <Brain className="w-5 h-5" />, color: 'text-red-400', bg: 'bg-red-900/20' }
  }

  const config = statusConfig[status]

  return (
    <div className={`${config.bg} rounded-lg px-4 py-3 flex items-center gap-3`}>
      <div className={config.color}>{config.icon}</div>
      <span className={`text-sm ${config.color}`}>{message}</span>
    </div>
  )
}

// Loading Overlay (for panels/sections)
export function LoadingOverlay({ message = 'Loading...', transparent = false }: { message?: string; transparent?: boolean }) {
  return (
    <div className={`absolute inset-0 flex items-center justify-center ${transparent ? 'bg-gray-900/50' : 'bg-gray-900/90'} backdrop-blur-sm z-10`}>
      <div className="text-center">
        <LoadingSpinner size="lg" className="text-purple-400 mx-auto mb-3" />
        <p className="text-white text-sm">{message}</p>
      </div>
    </div>
  )
}

// Pulse Loading (for cards/items)
export function PulseLoader({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gray-800 rounded-lg p-4 space-y-3 animate-pulse">
          <SkeletonLine className="w-1/3" />
          <SkeletonLine className="w-full" />
          <SkeletonLine className="w-2/3" />
        </div>
      ))}
    </div>
  )
}

// Button Loading State
export function LoadingButton({
  children,
  loading = false,
  disabled = false,
  onClick,
  className = '',
  variant = 'primary'
}: {
  children: React.ReactNode
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  const variantClasses = {
    primary: 'bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700',
    secondary: 'bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 disabled:bg-gray-700'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-4 py-2 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2 ${variantClasses[variant]} ${className}`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}

// Estimated Time Remaining
export function EstimatedTime({ seconds }: { seconds: number }) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return (
    <div className="text-xs text-gray-400">
      Estimated time: {minutes > 0 && `${minutes}m `}
      {remainingSeconds}s
    </div>
  )
}

// Multi-step Progress
export function MultiStepProgress({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="space-y-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isPending = index > currentStep

        return (
          <div key={index} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                isCompleted
                  ? 'bg-green-600 text-white'
                  : isCurrent
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {isCompleted ? '✓' : index + 1}
            </div>
            <div className="flex-1">
              <div className={`text-sm font-medium ${isCurrent ? 'text-white' : isCompleted ? 'text-green-400' : 'text-gray-400'}`}>
                {step}
              </div>
            </div>
            {isCurrent && <LoadingSpinner size="sm" className="text-purple-400" />}
          </div>
        )
      })}
    </div>
  )
}
