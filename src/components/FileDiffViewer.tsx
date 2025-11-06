import { useState } from 'react'
import { Check, X, RotateCcw, FileCode, ChevronDown, ChevronUp } from 'lucide-react'

interface FileDiff {
  file_path: string
  old_content: string
  new_content: string
  changes: Array<{
    type: 'add' | 'remove' | 'unchanged'
    line_number: number
    content: string
  }>
}

interface FileDiffViewerProps {
  diffs: FileDiff[]
  onApprove: (filePath: string) => void
  onReject: (filePath: string) => void
  onApproveAll: () => void
  onRejectAll: () => void
}

export default function FileDiffViewer({ diffs, onApprove, onReject, onApproveAll, onRejectAll }: FileDiffViewerProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set(diffs.map(d => d.file_path)))
  const [approvedFiles, setApprovedFiles] = useState<Set<string>>(new Set())
  const [rejectedFiles, setRejectedFiles] = useState<Set<string>>(new Set())

  const toggleFile = (filePath: string) => {
    setExpandedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(filePath)) {
        newSet.delete(filePath)
      } else {
        newSet.add(filePath)
      }
      return newSet
    })
  }

  const handleApprove = (filePath: string) => {
    setApprovedFiles(prev => new Set(prev).add(filePath))
    setRejectedFiles(prev => {
      const newSet = new Set(prev)
      newSet.delete(filePath)
      return newSet
    })
    onApprove(filePath)
  }

  const handleReject = (filePath: string) => {
    setRejectedFiles(prev => new Set(prev).add(filePath))
    setApprovedFiles(prev => {
      const newSet = new Set(prev)
      newSet.delete(filePath)
      return newSet
    })
    onReject(filePath)
  }

  const getLineClass = (type: string) => {
    switch (type) {
      case 'add':
        return 'bg-green-900/30 border-l-4 border-green-500'
      case 'remove':
        return 'bg-red-900/30 border-l-4 border-red-500'
      default:
        return 'bg-gray-900/10'
    }
  }

  const getLinePrefix = (type: string) => {
    switch (type) {
      case 'add':
        return '+'
      case 'remove':
        return '-'
      default:
        return ' '
    }
  }

  const getPrefixColor = (type: string) => {
    switch (type) {
      case 'add':
        return 'text-green-400'
      case 'remove':
        return 'text-red-400'
      default:
        return 'text-gray-600'
    }
  }

  if (diffs.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col border border-gray-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-800/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileCode className="w-6 h-6 text-purple-400" />
              Review Changes
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {diffs.length} file{diffs.length !== 1 ? 's' : ''} modified • Review and approve changes
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onRejectAll}
              className="px-4 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-500/50 text-red-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Reject All
            </button>
            <button
              onClick={onApproveAll}
              className="px-4 py-2 bg-green-900/20 hover:bg-green-900/30 border border-green-500/50 text-green-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Approve All
            </button>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {diffs.map((diff) => {
            const isExpanded = expandedFiles.has(diff.file_path)
            const isApproved = approvedFiles.has(diff.file_path)
            const isRejected = rejectedFiles.has(diff.file_path)

            const addedLines = diff.changes.filter(c => c.type === 'add').length
            const removedLines = diff.changes.filter(c => c.type === 'remove').length

            return (
              <div
                key={diff.file_path}
                className={`rounded-lg border-2 overflow-hidden transition-all ${
                  isApproved ? 'border-green-500/50 bg-green-900/10' :
                  isRejected ? 'border-red-500/50 bg-red-900/10' :
                  'border-gray-700 bg-gray-800/30'
                }`}
              >
                {/* File Header */}
                <div className="px-4 py-3 bg-gray-800/50 flex items-center justify-between">
                  <button
                    onClick={() => toggleFile(diff.file_path)}
                    className="flex items-center gap-3 flex-1 text-left hover:text-white transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    )}
                    <FileCode className="w-5 h-5 text-blue-400" />
                    <div className="flex-1">
                      <div className="font-mono text-sm text-white">{diff.file_path}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        <span className="text-green-400">+{addedLines}</span>
                        {' '}
                        <span className="text-red-400">-{removedLines}</span>
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-2">
                    {isApproved && (
                      <span className="text-xs px-2 py-1 bg-green-900/50 text-green-300 rounded">
                        Approved
                      </span>
                    )}
                    {isRejected && (
                      <span className="text-xs px-2 py-1 bg-red-900/50 text-red-300 rounded">
                        Rejected
                      </span>
                    )}
                    <button
                      onClick={() => handleReject(diff.file_path)}
                      disabled={isRejected}
                      className="p-2 bg-red-900/20 hover:bg-red-900/30 disabled:bg-gray-800 disabled:opacity-50 border border-red-500/50 disabled:border-gray-700 text-red-300 disabled:text-gray-600 rounded transition-colors"
                      title="Reject changes"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleApprove(diff.file_path)}
                      disabled={isApproved}
                      className="p-2 bg-green-900/20 hover:bg-green-900/30 disabled:bg-gray-800 disabled:opacity-50 border border-green-500/50 disabled:border-gray-700 text-green-300 disabled:text-gray-600 rounded transition-colors"
                      title="Approve changes"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Diff Content */}
                {isExpanded && (
                  <div className="bg-gray-950 overflow-x-auto">
                    <div className="font-mono text-xs">
                      {diff.changes.map((change, idx) => (
                        <div
                          key={idx}
                          className={`flex ${getLineClass(change.type)}`}
                        >
                          <div className="w-12 text-center py-1 text-gray-600 border-r border-gray-800 flex-shrink-0">
                            {change.line_number}
                          </div>
                          <div className={`w-8 text-center py-1 ${getPrefixColor(change.type)} flex-shrink-0`}>
                            {getLinePrefix(change.type)}
                          </div>
                          <div className="flex-1 py-1 px-3 text-gray-300 whitespace-pre">
                            {change.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-800/30 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            <span className="text-green-400">{approvedFiles.size} approved</span>
            {' • '}
            <span className="text-red-400">{rejectedFiles.size} rejected</span>
            {' • '}
            <span>{diffs.length - approvedFiles.size - rejectedFiles.size} pending</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onRejectAll}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Apply approved changes
                onApproveAll()
              }}
              disabled={approvedFiles.size === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              Apply {approvedFiles.size} Change{approvedFiles.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
