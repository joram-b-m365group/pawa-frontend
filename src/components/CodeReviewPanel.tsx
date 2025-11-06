import { useState } from 'react'
import {
  Shield,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Loader2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Code2
} from 'lucide-react'

const API_URL = 'http://localhost:8000'

interface Issue {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: string
  line_number?: number
  title: string
  description: string
  suggestion: string
  code_snippet?: string
}

interface CodeReview {
  overall_score: number
  summary: string
  issues: Issue[]
  strengths: string[]
  metrics: {
    complexity?: string
    maintainability?: number
    security_score?: number
    test_coverage_needed?: boolean
  }
}

interface CodeReviewPanelProps {
  code: string
  filePath?: string
  language?: string
  onJumpToLine?: (line: number) => void
}

export default function CodeReviewPanel({ code, filePath, language, onJumpToLine }: CodeReviewPanelProps) {
  const [review, setReview] = useState<CodeReview | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviewType, setReviewType] = useState<'comprehensive' | 'security' | 'performance' | 'style'>('comprehensive')
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set())

  const runCodeReview = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/code-review/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          file_path: filePath,
          language,
          review_type: reviewType
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setReview(data)

    } catch (error) {
      console.error('Error running code review:', error)
      setError(error instanceof Error ? error.message : 'Failed to run code review')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleIssue = (index: number) => {
    setExpandedIssues(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'high':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      case 'medium':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'low':
        return <Info className="w-4 h-4 text-blue-500" />
      case 'info':
        return <Info className="w-4 h-4 text-gray-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900/20 border-red-500/50 text-red-300'
      case 'high':
        return 'bg-orange-900/20 border-orange-500/50 text-orange-300'
      case 'medium':
        return 'bg-yellow-900/20 border-yellow-500/50 text-yellow-300'
      case 'low':
        return 'bg-blue-900/20 border-blue-500/50 text-blue-300'
      case 'info':
        return 'bg-gray-800/50 border-gray-600/50 text-gray-300'
      default:
        return 'bg-gray-800/50 border-gray-600/50 text-gray-300'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security':
        return <Shield className="w-3 h-3" />
      case 'performance':
        return <Zap className="w-3 h-3" />
      default:
        return <Code2 className="w-3 h-3" />
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 border-l border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">AI Code Review</h3>
          </div>
        </div>

        {/* Review Type Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setReviewType('comprehensive')}
            className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
              reviewType === 'comprehensive'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setReviewType('security')}
            className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
              reviewType === 'security'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Security
          </button>
          <button
            onClick={() => setReviewType('performance')}
            className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
              reviewType === 'performance'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setReviewType('style')}
            className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
              reviewType === 'style'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Style
          </button>
        </div>

        <button
          onClick={runCodeReview}
          disabled={isLoading || !code}
          className="w-full mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              Run Review
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {!review && !error && !isLoading && (
          <div className="text-center text-gray-500 py-8">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Run AI code review to get insights</p>
          </div>
        )}

        {review && (
          <>
            {/* Overall Score */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-400">Overall Score</span>
                <span className={`text-2xl font-bold ${getScoreColor(review.overall_score)}`}>
                  {review.overall_score}/100
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    review.overall_score >= 80 ? 'bg-green-500' :
                    review.overall_score >= 60 ? 'bg-yellow-500' :
                    review.overall_score >= 40 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${review.overall_score}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">{review.summary}</p>
            </div>

            {/* Metrics */}
            {review.metrics && (
              <div className="grid grid-cols-2 gap-2">
                {review.metrics.complexity && (
                  <div className="p-3 bg-gray-800/30 rounded border border-gray-700">
                    <div className="text-xs text-gray-400">Complexity</div>
                    <div className="text-sm font-semibold text-white capitalize">{review.metrics.complexity}</div>
                  </div>
                )}
                {review.metrics.maintainability !== undefined && (
                  <div className="p-3 bg-gray-800/30 rounded border border-gray-700">
                    <div className="text-xs text-gray-400">Maintainability</div>
                    <div className={`text-sm font-semibold ${getScoreColor(review.metrics.maintainability)}`}>
                      {review.metrics.maintainability}/100
                    </div>
                  </div>
                )}
                {review.metrics.security_score !== undefined && (
                  <div className="p-3 bg-gray-800/30 rounded border border-gray-700">
                    <div className="text-xs text-gray-400">Security</div>
                    <div className={`text-sm font-semibold ${getScoreColor(review.metrics.security_score)}`}>
                      {review.metrics.security_score}/100
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Strengths */}
            {review.strengths && review.strengths.length > 0 && (
              <div className="p-3 bg-green-900/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">Strengths</span>
                </div>
                <ul className="space-y-1">
                  {review.strengths.map((strength, index) => (
                    <li key={index} className="text-xs text-green-300 flex items-start gap-2">
                      <span>•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Issues */}
            {review.issues && review.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Issues Found ({review.issues.length})
                </h4>

                {review.issues.map((issue, index) => (
                  <div
                    key={index}
                    className={`rounded-lg border overflow-hidden ${getSeverityColor(issue.severity)}`}
                  >
                    <button
                      onClick={() => toggleIssue(index)}
                      className="w-full p-3 text-left hover:bg-black/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          {getSeverityIcon(issue.severity)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold">{issue.title}</span>
                              {issue.line_number && onJumpToLine && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onJumpToLine(issue.line_number!)
                                  }}
                                  className="text-xs px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                                >
                                  Line {issue.line_number}
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-700/50 rounded capitalize">
                                {issue.severity}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-700/50 rounded flex items-center gap-1">
                                {getCategoryIcon(issue.category)}
                                {issue.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        {expandedIssues.has(index) ? (
                          <ChevronUp className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 flex-shrink-0" />
                        )}
                      </div>
                    </button>

                    {expandedIssues.has(index) && (
                      <div className="px-3 pb-3 space-y-2 border-t border-current/20">
                        <div>
                          <p className="text-xs font-medium mb-1 mt-2">Description:</p>
                          <p className="text-xs opacity-90">{issue.description}</p>
                        </div>

                        {issue.code_snippet && (
                          <div>
                            <p className="text-xs font-medium mb-1">Code:</p>
                            <pre className="text-[10px] bg-black/30 p-2 rounded overflow-x-auto">
                              {issue.code_snippet}
                            </pre>
                          </div>
                        )}

                        <div>
                          <p className="text-xs font-medium mb-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Suggestion:
                          </p>
                          <p className="text-xs opacity-90">{issue.suggestion}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {review.issues && review.issues.length === 0 && (
              <div className="p-4 bg-green-900/10 border border-green-500/30 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-green-300">No issues found! Code looks great.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
