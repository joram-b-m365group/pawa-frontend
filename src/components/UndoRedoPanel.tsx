import { useState, useEffect } from 'react'
import { Undo, Redo, History, RotateCcw, Clock, FileCode, X } from 'lucide-react'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

const API_URL = 'http://localhost:8000'

interface Snapshot {
  file_path: string
  content: string
  timestamp: string
  operation: string
  content_hash: string
}

interface UndoRedoPanelProps {
  sessionId: string
  onRestore?: (filePath: string, content: string) => void
}

export default function UndoRedoPanel({ sessionId, onRestore }: UndoRedoPanelProps) {
  const [history, setHistory] = useState<Snapshot[]>([])
  const [undoAvailable, setUndoAvailable] = useState(0)
  const [redoAvailable, setRedoAvailable] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    loadHistory()
    loadStats()
  }, [sessionId])

  // Keyboard shortcuts for undo/redo
  useKeyboardShortcuts([
    {
      key: 'z',
      ctrl: true,
      description: 'Undo',
      handler: handleUndo
    },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      description: 'Redo',
      handler: handleRedo
    }
  ])

  const loadHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/undo/history/${sessionId}?limit=50`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/undo/stats/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setUndoAvailable(data.undo_available || 0)
        setRedoAvailable(data.redo_available || 0)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  async function handleUndo() {
    if (undoAvailable === 0 || isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/undo/undo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, steps: 1 })
      })

      if (response.ok) {
        const data = await response.json()
        const snapshot = data.snapshots[0]

        if (snapshot && onRestore) {
          onRestore(snapshot.file_path, snapshot.content)
        }

        await loadHistory()
        await loadStats()
      }
    } catch (error) {
      console.error('Undo failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRedo() {
    if (redoAvailable === 0 || isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/undo/redo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, steps: 1 })
      })

      if (response.ok) {
        const data = await response.json()
        const snapshot = data.snapshots[0]

        if (snapshot && onRestore) {
          onRestore(snapshot.file_path, snapshot.content)
        }

        await loadHistory()
        await loadStats()
      }
    } catch (error) {
      console.error('Redo failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRollback = async (index: number) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/undo/rollback/${sessionId}?index=${index}`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        const snapshot = data.snapshot

        if (snapshot && onRestore) {
          onRestore(snapshot.file_path, snapshot.content)
        }

        await loadHistory()
        await loadStats()
        setShowHistory(false)
      }
    } catch (error) {
      console.error('Rollback failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'write':
        return <FileCode className="w-4 h-4 text-green-400" />
      case 'edit':
        return <FileCode className="w-4 h-4 text-blue-400" />
      case 'delete':
        return <FileCode className="w-4 h-4 text-red-400" />
      default:
        return <FileCode className="w-4 h-4 text-gray-400" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-semibold">History</h3>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-xs px-2 py-1 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 rounded transition-colors"
        >
          {showHistory ? 'Hide' : 'Show'} Timeline
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 flex items-center gap-2">
        <button
          onClick={handleUndo}
          disabled={undoAvailable === 0 || isLoading}
          className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
          <span className="text-sm">Undo</span>
          {undoAvailable > 0 && (
            <span className="text-xs text-gray-400">({undoAvailable})</span>
          )}
        </button>

        <button
          onClick={handleRedo}
          disabled={redoAvailable === 0 || isLoading}
          className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo className="w-4 h-4" />
          <span className="text-sm">Redo</span>
          {redoAvailable > 0 && (
            <span className="text-xs text-gray-400">({redoAvailable})</span>
          )}
        </button>
      </div>

      {/* History Timeline */}
      {showHistory && (
        <div className="border-t border-gray-800">
          <div className="p-4 max-h-96 overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No history yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...history].reverse().map((snapshot, index) => {
                  const actualIndex = history.length - 1 - index
                  const isSelected = selectedIndex === actualIndex

                  return (
                    <button
                      key={actualIndex}
                      onClick={() => setSelectedIndex(actualIndex)}
                      onDoubleClick={() => handleRollback(actualIndex)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-purple-900/30 border-2 border-purple-500/50'
                          : 'bg-gray-800/30 border-2 border-transparent hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getOperationIcon(snapshot.operation)}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-sm font-medium text-white capitalize truncate">
                              {snapshot.operation}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(snapshot.timestamp)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 font-mono truncate">
                            {snapshot.file_path.split('/').pop() || snapshot.file_path}
                          </div>
                        </div>

                        {/* Rollback Button */}
                        {isSelected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRollback(actualIndex)
                            }}
                            className="flex-shrink-0 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {history.length > 0 && (
            <div className="px-4 py-3 bg-gray-800/30 border-t border-gray-800 text-xs text-gray-400">
              <p>Double-click to rollback to that point</p>
              <p className="mt-1">
                <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-700 rounded font-mono">Ctrl+Z</kbd> Undo •{' '}
                <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-700 rounded font-mono">Ctrl+Shift+Z</kbd> Redo
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
