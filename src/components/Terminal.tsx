import { useState, useEffect, useRef } from 'react'
import { Terminal as TerminalIcon, X, Maximize2, Minimize2 } from 'lucide-react'

interface TerminalProps {
  projectPath: string
  onClose?: () => void
}

export default function Terminal({ projectPath, onClose }: TerminalProps) {
  const [output, setOutput] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const outputEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [output])

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket(`ws://localhost:8000/terminal/ws?project_path=${encodeURIComponent(projectPath)}`)

    ws.onopen = () => {
      setIsConnected(true)
      console.log('Terminal WebSocket connected')
    }

    ws.onmessage = (event) => {
      setOutput(prev => [...prev, event.data])
    }

    ws.onerror = (error) => {
      console.error('Terminal WebSocket error:', error)
      setOutput(prev => [...prev, '\n❌ Connection error\n'])
    }

    ws.onclose = () => {
      setIsConnected(false)
      setOutput(prev => [...prev, '\n📡 Connection closed\n'])
      console.log('Terminal WebSocket disconnected')
    }

    wsRef.current = ws

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('__CLOSE__')
        ws.close()
      }
    }
  }, [projectPath])

  const sendCommand = () => {
    if (!input.trim() || !wsRef.current || !isConnected) return

    // Add command to output for display
    setOutput(prev => [...prev, `$ ${input}\n`])

    // Send to backend
    wsRef.current.send(input)

    // Clear input
    setInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      sendCommand()
    } else if (e.key === 'c' && e.ctrlKey) {
      // Ctrl+C - send interrupt signal
      if (wsRef.current && isConnected) {
        wsRef.current.send('\x03') // ASCII ETX (End of Text)
      }
    }
  }

  const clearTerminal = () => {
    setOutput([])
  }

  return (
    <div className={`flex flex-col bg-gray-950 border border-gray-800 rounded-lg overflow-hidden ${
      isMaximized ? 'fixed inset-4 z-50' : 'h-full'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-900 px-4 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-green-400" />
          <span className="text-sm font-semibold text-white">Terminal</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-500">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearTerminal}
            className="text-gray-400 hover:text-white text-xs px-2 py-1 hover:bg-gray-800 rounded transition-colors"
            title="Clear terminal"
          >
            Clear
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded transition-colors"
            title={isMaximized ? 'Minimize' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded transition-colors"
              title="Close terminal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Output Area */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm text-green-400 bg-gray-950">
        <pre className="whitespace-pre-wrap">
          {output.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </pre>
        <div ref={outputEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex items-center gap-2 bg-gray-900 px-4 py-3 border-t border-gray-800">
        <span className="text-green-400 font-mono text-sm">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a command..."
          disabled={!isConnected}
          className="flex-1 bg-transparent text-green-400 font-mono text-sm outline-none disabled:opacity-50"
          autoFocus
        />
        <button
          onClick={sendCommand}
          disabled={!isConnected || !input.trim()}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
        >
          Run
        </button>
      </div>

      {/* Helper Text */}
      <div className="px-4 py-1 bg-gray-900/50 border-t border-gray-800 text-xs text-gray-500">
        Press Enter to run • Ctrl+C to interrupt • Type "exit" to close shell
      </div>
    </div>
  )
}
