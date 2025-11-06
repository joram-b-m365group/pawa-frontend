import { useState, useRef, useEffect } from 'react'
import { Send, Bot, Code, Terminal, FileEdit, Loader2, CheckCircle2, XCircle, Mic } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import VoiceCoding from './VoiceCoding'

const API_URL = 'http://localhost:8000'

interface Message {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: Array<{
    tool: string
    arguments: any
    result: any
  }>
  filesModified?: string[]
}

interface AICodeChatProps {
  projectPath: string
  onFileChange?: (filePath: string) => void
  onFileTreeRefresh?: () => void
}

export default function AICodeChat({ projectPath, onFileChange, onFileTreeRefresh }: AICodeChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showVoice, setShowVoice] = useState(false)
  const [sessionId] = useState(`session_${Date.now()}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/ai-agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          project_path: projectPath,
          conversation_history: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          session_id: sessionId
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        toolCalls: data.tool_calls || [],
        filesModified: data.files_modified || []
      }

      setMessages(prev => [...prev, assistantMessage])

      // Notify parent if files were modified
      if (data.files_modified && data.files_modified.length > 0) {
        console.log('🔄 Files modified, refreshing file tree:', data.files_modified)

        // Refresh file tree to show new files in sidebar (with small delay to ensure files are written)
        if (onFileTreeRefresh) {
          setTimeout(() => {
            console.log('🌲 Triggering file tree refresh...')
            onFileTreeRefresh()
          }, 500)
        }

        // Reload the first modified file
        if (onFileChange) {
          setTimeout(() => {
            onFileChange(data.files_modified[0])
          }, 600)
        }
      }

    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleVoiceCommand = (command: string) => {
    // Automatically send voice command to AI
    setInput(command)
    // Trigger sendMessage after input is set
    setTimeout(() => sendMessage(), 100)
  }

  const handleVoiceTranscript = (transcript: string) => {
    // Update input field with transcript in real-time
    setInput(transcript)
  }

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'read_file':
      case 'write_file':
      case 'edit_file':
        return <FileEdit className="w-3 h-3" />
      case 'run_command':
        return <Terminal className="w-3 h-3" />
      case 'search_files':
      case 'list_files':
      case 'get_file_tree':
        return <Code className="w-3 h-3" />
      default:
        return <Bot className="w-3 h-3" />
    }
  }

  const getToolBadgeColor = (success: boolean | undefined) => {
    if (success === true) return 'bg-green-500/20 text-green-400 border-green-500/30'
    if (success === false) return 'bg-red-500/20 text-red-400 border-red-500/30'
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-semibold text-sm">AI Code Agent</h3>
              <p className="text-xs text-gray-400">Pawa AI can edit files, run commands, and more</p>
            </div>
          </div>
          <button
            onClick={() => setShowVoice(!showVoice)}
            className={`p-2 rounded-lg transition-all ${
              showVoice
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                : 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600'
            }`}
            title={showVoice ? 'Hide voice coding' : 'Show voice coding'}
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Voice Coding Panel */}
      {showVoice && (
        <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/30">
          <VoiceCoding
            onCommand={handleVoiceCommand}
            onTranscript={handleVoiceTranscript}
            isProcessing={isLoading}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Ask me to help with your code!</p>
            <div className="mt-4 text-xs space-y-1">
              <p>"Add error handling to the login function"</p>
              <p>"Create a new React component for user profile"</p>
              <p>"Run npm install"</p>
              <p>"Find all TODO comments"</p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
              message.role === 'user'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-100'
            }`}>
              {/* Message content */}
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
                        <code className="bg-gray-900 px-1 py-0.5 rounded text-xs" {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>

              {/* Tool calls */}
              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                  <p className="text-xs font-semibold text-gray-400 mb-2">Actions performed:</p>
                  {message.toolCalls.map((toolCall, toolIndex) => (
                    <div key={toolIndex} className="text-xs">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border ${
                        getToolBadgeColor(toolCall.result?.success)
                      }`}>
                        {getToolIcon(toolCall.tool)}
                        <span className="font-mono">{toolCall.tool}</span>
                        {toolCall.result?.success === true && <CheckCircle2 className="w-3 h-3" />}
                        {toolCall.result?.success === false && <XCircle className="w-3 h-3" />}
                      </div>
                      {/* Show arguments */}
                      <details className="mt-1 ml-4">
                        <summary className="cursor-pointer text-gray-500 hover:text-gray-400">
                          Details
                        </summary>
                        <pre className="mt-1 text-[10px] bg-gray-900/50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(toolCall.arguments, null, 2)}
                        </pre>
                        {toolCall.result?.error && (
                          <p className="text-red-400 mt-1">{toolCall.result.error}</p>
                        )}
                      </details>
                    </div>
                  ))}
                </div>
              )}

              {/* Files modified */}
              {message.filesModified && message.filesModified.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <p className="text-xs text-green-400 font-semibold mb-1">Files modified:</p>
                  <div className="space-y-1">
                    {message.filesModified.map((file, fileIndex) => (
                      <div key={fileIndex} className="text-xs font-mono text-gray-400">
                        • {file}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-lg px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span className="text-sm text-gray-400">AI is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-800 bg-gray-800/30">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask AI to edit code, run commands, etc..."
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
