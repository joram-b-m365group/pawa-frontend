import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Brain, Zap, Code2, FileEdit, Terminal as TerminalIcon } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const API_URL = 'http://localhost:8000'

interface Message {
  role: 'user' | 'assistant' | 'thinking' | 'tool'
  content: string
  timestamp: Date
  toolCall?: {
    name: string
    args: any
    result?: any
  }
}

interface StreamingChatUIProps {
  projectPath?: string
  onFileModified?: (filePath: string) => void
  initialMessages?: Message[]
}

export default function StreamingChatUI({ projectPath, onFileModified, initialMessages = [] }: StreamingChatUIProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentThinking, setCurrentThinking] = useState('')
  const [currentContent, setCurrentContent] = useState('')
  const [showThinking, setShowThinking] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auto-scroll to bottom with smooth animation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentContent, currentThinking])

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)
    setCurrentThinking('')
    setCurrentContent('')

    try {
      // Use streaming endpoint with thinking
      const response = await fetch(`${API_URL}/streaming/chat-with-thinking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role === 'thinking' || m.role === 'tool' ? 'assistant' : m.role,
            content: m.content
          })),
          model: 'llama-3.3-70b-versatile',
          temperature: 0.7,
          max_tokens: 8000,
          stream: true
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''
      let thinkingBuffer = ''
      let contentBuffer = ''
      let inThinking = false
      let inAnswer = false

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'thinking') {
                inThinking = true
                thinkingBuffer += data.content
                setCurrentThinking(thinkingBuffer)
              } else if (data.type === 'content') {
                inThinking = false
                inAnswer = true
                contentBuffer += data.content
                setCurrentContent(contentBuffer)
              } else if (data.type === 'tool_call') {
                // Show tool execution
                const toolMessage: Message = {
                  role: 'tool',
                  content: `Executing: ${data.tool_name}`,
                  timestamp: new Date(),
                  toolCall: {
                    name: data.tool_name,
                    args: data.tool_args
                  }
                }
                setMessages(prev => [...prev, toolMessage])
              } else if (data.type === 'tool_result') {
                // Update tool result
                setMessages(prev => {
                  const newMessages = [...prev]
                  const lastToolIndex = newMessages.findLastIndex(m => m.role === 'tool')
                  if (lastToolIndex !== -1 && newMessages[lastToolIndex].toolCall) {
                    newMessages[lastToolIndex].toolCall!.result = data.result
                  }
                  return newMessages
                })

                // Track file modifications
                if (data.tool_name === 'write_file' || data.tool_name === 'edit_file') {
                  onFileModified?.(data.tool_args?.file_path)
                }
              } else if (data.type === 'done') {
                // Finalize message
                if (thinkingBuffer && showThinking) {
                  setMessages(prev => [...prev, {
                    role: 'thinking',
                    content: thinkingBuffer,
                    timestamp: new Date()
                  }])
                }
                if (contentBuffer) {
                  setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: contentBuffer,
                    timestamp: new Date()
                  }])
                }
                setCurrentThinking('')
                setCurrentContent('')
              } else if (data.type === 'error') {
                throw new Error(data.error)
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
        timestamp: new Date()
      }])
    } finally {
      setIsStreaming(false)
    }
  }

  const stopStreaming = () => {
    eventSourceRef.current?.close()
    abortControllerRef.current?.abort()
    setIsStreaming(false)
  }

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'read_file':
        return <Code2 className="w-4 h-4" />
      case 'write_file':
      case 'edit_file':
        return <FileEdit className="w-4 h-4" />
      case 'run_command':
        return <TerminalIcon className="w-4 h-4" />
      default:
        return <Zap className="w-4 h-4" />
    }
  }

  const renderMessage = (message: Message, index: number) => {
    if (message.role === 'user') {
      return (
        <div key={index} className="flex justify-end mb-4">
          <div className="bg-blue-600 text-white rounded-lg px-4 py-3 max-w-[80%]">
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            <span className="text-xs text-blue-200 mt-1 block">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
        </div>
      )
    }

    if (message.role === 'thinking') {
      return (
        <div key={index} className="flex justify-start mb-4">
          <div className="bg-purple-900/30 border border-purple-500/50 text-purple-200 rounded-lg px-4 py-3 max-w-[80%]">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-purple-300">Thinking...</span>
            </div>
            <p className="text-sm whitespace-pre-wrap italic">{message.content}</p>
          </div>
        </div>
      )
    }

    if (message.role === 'tool') {
      return (
        <div key={index} className="flex justify-start mb-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 max-w-[80%]">
            <div className="flex items-center gap-2 mb-2">
              {getToolIcon(message.toolCall?.name || '')}
              <span className="text-xs font-semibold text-gray-300">{message.toolCall?.name}</span>
              {!message.toolCall?.result && (
                <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
              )}
            </div>
            <pre className="text-xs text-gray-400 overflow-x-auto">
              {JSON.stringify(message.toolCall?.args, null, 2)}
            </pre>
            {message.toolCall?.result && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <span className="text-xs text-green-400">✓ Complete</span>
              </div>
            )}
          </div>
        </div>
      )
    }

    // Assistant message
    return (
      <div key={index} className="flex justify-start mb-4">
        <div className="bg-gray-800 text-white rounded-lg px-4 py-3 max-w-[80%]">
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
          <span className="text-xs text-gray-400 mt-1 block">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-semibold">AI Assistant</h3>
          {isStreaming && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Streaming...
            </span>
          )}
        </div>
        <button
          onClick={() => setShowThinking(!showThinking)}
          className="text-xs px-2 py-1 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 rounded transition-colors"
        >
          {showThinking ? 'Hide' : 'Show'} Thinking
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((message, index) => renderMessage(message, index))}

        {/* Current thinking bubble */}
        {isStreaming && currentThinking && showThinking && (
          <div className="flex justify-start mb-4">
            <div className="bg-purple-900/30 border border-purple-500/50 text-purple-200 rounded-lg px-4 py-3 max-w-[80%] animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="text-xs font-semibold text-purple-300">Thinking...</span>
              </div>
              <p className="text-sm whitespace-pre-wrap italic">{currentThinking}</p>
            </div>
          </div>
        )}

        {/* Current content streaming */}
        {isStreaming && currentContent && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-800 text-white rounded-lg px-4 py-3 max-w-[80%]">
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{currentContent}</ReactMarkdown>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <div className="w-1 h-4 bg-blue-400 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder="Ask me anything about your code..."
            disabled={isStreaming}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />
          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <span className="text-sm">Stop</span>
            </button>
          ) : (
            <button
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
