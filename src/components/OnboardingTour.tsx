import { useState, useEffect } from 'react'
import { X, ArrowRight, ArrowLeft, Sparkles, Code, MessageSquare, Mic, Wrench, FileCode, Play } from 'lucide-react'

interface TourStep {
  title: string
  description: string
  icon: React.ReactNode
  target?: string // CSS selector for spotlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to Pawa AI',
    description: 'Your intelligent AI coding assistant. Let me show you around!',
    icon: <Sparkles className="w-8 h-8" />,
    position: 'center'
  },
  {
    title: 'AI Code Chat',
    description: 'Ask me anything about your code. I can read, write, and edit files automatically.',
    icon: <MessageSquare className="w-8 h-8" />,
    target: '.ai-chat-panel',
    position: 'left'
  },
  {
    title: 'Code Editor',
    description: 'Full-featured Monaco editor with syntax highlighting and IntelliSense.',
    icon: <Code className="w-8 h-8" />,
    target: '.monaco-editor',
    position: 'right'
  },
  {
    title: 'Voice Coding',
    description: 'Use voice commands to code hands-free. Just click the mic icon and speak!',
    icon: <Mic className="w-8 h-8" />,
    target: '.voice-coding-button',
    position: 'bottom'
  },
  {
    title: 'Project Templates',
    description: 'Generate entire projects with AI. Choose from templates or describe your own.',
    icon: <FileCode className="w-8 h-8" />,
    target: '.templates-button',
    position: 'bottom'
  },
  {
    title: 'Code Review',
    description: 'Get instant AI-powered code reviews with security and performance insights.',
    icon: <Wrench className="w-8 h-8" />,
    target: '.code-review-button',
    position: 'bottom'
  },
  {
    title: 'Live Preview',
    description: 'See your changes in real-time with responsive preview and error handling.',
    icon: <Play className="w-8 h-8" />,
    target: '.preview-panel',
    position: 'left'
  },
  {
    title: 'Ready to Code!',
    description: 'Press Cmd/Ctrl+K for quick commands, Cmd/Ctrl+Enter to send messages. Happy coding!',
    icon: <Sparkles className="w-8 h-8" />,
    position: 'center'
  }
]

interface OnboardingTourProps {
  onComplete: () => void
  onSkip: () => void
}

export default function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null)

  const step = TOUR_STEPS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === TOUR_STEPS.length - 1

  useEffect(() => {
    updateSpotlight()
  }, [currentStep])

  useEffect(() => {
    // Mark tour as completed in localStorage
    return () => {
      localStorage.setItem('onboardingCompleted', 'true')
    }
  }, [])

  const updateSpotlight = () => {
    if (step.target) {
      const element = document.querySelector(step.target)
      if (element) {
        const rect = element.getBoundingClientRect()
        setSpotlightRect(rect)
      } else {
        setSpotlightRect(null)
      }
    } else {
      setSpotlightRect(null)
    }
  }

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    localStorage.setItem('onboardingCompleted', 'true')
    localStorage.setItem('onboardingSkipped', 'true')
    onSkip()
  }

  const getTooltipPosition = () => {
    if (!spotlightRect) {
      // Center position
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }
    }

    const padding = 20

    switch (step.position) {
      case 'top':
        return {
          top: `${spotlightRect.top - padding}px`,
          left: `${spotlightRect.left + spotlightRect.width / 2}px`,
          transform: 'translate(-50%, -100%)'
        }
      case 'bottom':
        return {
          top: `${spotlightRect.bottom + padding}px`,
          left: `${spotlightRect.left + spotlightRect.width / 2}px`,
          transform: 'translate(-50%, 0)'
        }
      case 'left':
        return {
          top: `${spotlightRect.top + spotlightRect.height / 2}px`,
          left: `${spotlightRect.left - padding}px`,
          transform: 'translate(-100%, -50%)'
        }
      case 'right':
        return {
          top: `${spotlightRect.top + spotlightRect.height / 2}px`,
          left: `${spotlightRect.right + padding}px`,
          transform: 'translate(0, -50%)'
        }
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay with spotlight */}
      <div className="absolute inset-0">
        <svg width="100%" height="100%" className="pointer-events-none">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {spotlightRect && (
                <rect
                  x={spotlightRect.left - 8}
                  y={spotlightRect.top - 8}
                  width={spotlightRect.width + 16}
                  height={spotlightRect.height + 16}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Spotlight glow */}
        {spotlightRect && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: spotlightRect.left - 8,
              top: spotlightRect.top - 8,
              width: spotlightRect.width + 16,
              height: spotlightRect.height + 16,
              boxShadow: '0 0 0 4px rgba(168, 85, 247, 0.5), 0 0 40px 20px rgba(168, 85, 247, 0.3)',
              borderRadius: '8px',
              animation: 'pulse 2s ease-in-out infinite'
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        className="absolute w-96 bg-gray-900 border-2 border-purple-500/50 rounded-xl shadow-2xl overflow-hidden"
        style={getTooltipPosition()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-white">{step.icon}</div>
            <h3 className="text-white font-bold text-lg">{step.title}</h3>
          </div>
          <button
            onClick={handleSkip}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-gray-300 text-sm leading-relaxed">{step.description}</p>
        </div>

        {/* Progress Dots */}
        <div className="px-6 pb-4 flex items-center justify-center gap-2">
          {TOUR_STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-purple-500 w-6'
                  : index < currentStep
                  ? 'bg-purple-700'
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-800 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Step {currentStep + 1} of {TOUR_STEPS.length}
          </div>
          <div className="flex gap-2">
            {!isFirstStep && (
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {isLastStep ? (
                <>
                  Get Started
                  <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  )
}
