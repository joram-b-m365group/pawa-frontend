import { useState, useEffect, useRef } from 'react'
import { Search, Command, X, Zap, Code, FileText, Settings, Terminal, Mic, Brain } from 'lucide-react'
import { formatShortcut } from '../hooks/useKeyboardShortcuts'

export interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  shortcut?: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean }
  action: () => void
  category?: string
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  commands: CommandItem[]
}

export default function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter commands based on search
  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description?.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category?.toLowerCase().includes(search.toLowerCase())
  )

  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    const category = cmd.category || 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push(cmd)
    return acc
  }, {} as Record<string, CommandItem[]>)

  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selectedCommand = filteredCommands[selectedIndex]
        if (selectedCommand) {
          selectedCommand.action()
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[10vh]">
      <div className="bg-gray-900 border-2 border-purple-500/50 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Search Input */}
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-3 bg-gray-800/50">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
          />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Commands List */}
        <div className="max-h-[60vh] overflow-y-auto">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No commands found for "{search}"
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, categoryCommands]) => (
              <div key={category} className="py-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {category}
                </div>
                {categoryCommands.map((cmd, categoryIndex) => {
                  const globalIndex = filteredCommands.indexOf(cmd)
                  const isSelected = globalIndex === selectedIndex

                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action()
                        onClose()
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                        isSelected ? 'bg-purple-600/20 border-l-4 border-purple-500' : 'border-l-4 border-transparent hover:bg-gray-800/50'
                      }`}
                    >
                      {/* Icon */}
                      {cmd.icon && (
                        <div className={`flex-shrink-0 ${isSelected ? 'text-purple-400' : 'text-gray-400'}`}>
                          {cmd.icon}
                        </div>
                      )}

                      {/* Label & Description */}
                      <div className="flex-1 text-left">
                        <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                          {cmd.label}
                        </div>
                        {cmd.description && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {cmd.description}
                          </div>
                        )}
                      </div>

                      {/* Shortcut */}
                      {cmd.shortcut && (
                        <div className="flex-shrink-0">
                          <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-400 font-mono">
                            {formatShortcut(cmd.shortcut)}
                          </kbd>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-800/30 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded font-mono">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded font-mono">↵</kbd>
              Execute
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded font-mono">Esc</kbd>
              Close
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span>Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Default commands that can be used across the app
export const DEFAULT_COMMANDS: CommandItem[] = [
  {
    id: 'new-file',
    label: 'Create New File',
    description: 'Create a new file in the current project',
    icon: <FileText className="w-5 h-5" />,
    category: 'File',
    action: () => console.log('Create new file')
  },
  {
    id: 'open-file',
    label: 'Open File',
    description: 'Open an existing file',
    icon: <FileText className="w-5 h-5" />,
    category: 'File',
    shortcut: { key: 'o', ctrl: true },
    action: () => console.log('Open file')
  },
  {
    id: 'save-file',
    label: 'Save File',
    description: 'Save current file',
    icon: <FileText className="w-5 h-5" />,
    category: 'File',
    shortcut: { key: 's', ctrl: true },
    action: () => console.log('Save file')
  },
  {
    id: 'toggle-ai-chat',
    label: 'Toggle AI Chat',
    description: 'Show or hide the AI chat panel',
    icon: <Brain className="w-5 h-5" />,
    category: 'AI',
    shortcut: { key: '/', ctrl: true },
    action: () => console.log('Toggle AI chat')
  },
  {
    id: 'voice-coding',
    label: 'Start Voice Coding',
    description: 'Activate voice command mode',
    icon: <Mic className="w-5 h-5" />,
    category: 'AI',
    action: () => console.log('Start voice coding')
  },
  {
    id: 'run-code',
    label: 'Run Code',
    description: 'Execute the current code',
    icon: <Zap className="w-5 h-5" />,
    category: 'Code',
    shortcut: { key: 'r', ctrl: true },
    action: () => console.log('Run code')
  },
  {
    id: 'format-code',
    label: 'Format Code',
    description: 'Auto-format current file',
    icon: <Code className="w-5 h-5" />,
    category: 'Code',
    shortcut: { key: 'f', ctrl: true, shift: true },
    action: () => console.log('Format code')
  },
  {
    id: 'open-terminal',
    label: 'Open Terminal',
    description: 'Show the integrated terminal',
    icon: <Terminal className="w-5 h-5" />,
    category: 'View',
    shortcut: { key: '`', ctrl: true },
    action: () => console.log('Open terminal')
  },
  {
    id: 'settings',
    label: 'Open Settings',
    description: 'Configure Pawa AI preferences',
    icon: <Settings className="w-5 h-5" />,
    category: 'Settings',
    shortcut: { key: ',', ctrl: true },
    action: () => console.log('Open settings')
  }
]
