import { useState } from 'react'
import { Brain, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

interface ThinkingDisplayProps {
  thoughts: string[]
  isThinking: boolean
  onComplete?: () => void
}

export default function ThinkingDisplay({ thoughts, isThinking, onComplete }: ThinkingDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!isThinking && thoughts.length === 0) return null

  return (
    <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-purple-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className={`w-5 h-5 text-purple-600 ${isThinking ? 'animate-pulse' : ''}`} />
            {isThinking && (
              <Sparkles className="w-3 h-3 text-purple-400 absolute -top-1 -right-1 animate-ping" />
            )}
          </div>
          <span className="text-sm font-semibold text-purple-900">
            {isThinking ? 'Thinking...' : 'Thought process'}
          </span>
          {!isThinking && thoughts.length > 0 && (
            <span className="px-2 py-0.5 bg-purple-200 text-purple-700 text-xs font-medium rounded-full">
              {thoughts.length} steps
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-purple-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-purple-600" />
        )}
      </button>

      {/* Thinking Steps */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {thoughts.map((thought, index) => (
            <div
              key={index}
              className="flex items-start gap-3 text-sm text-purple-800 animate-fadeIn"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'backwards'
              }}
            >
              <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-purple-200 text-purple-700 rounded-full text-xs font-semibold mt-0.5">
                {index + 1}
              </div>
              <p className="flex-1 pt-0.5">{thought}</p>
            </div>
          ))}

          {/* Loading indicator when thinking */}
          {isThinking && (
            <div className="flex items-center gap-3 text-sm text-purple-600">
              <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
              </div>
              <p className="flex-1 italic">Analyzing and reasoning...</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
