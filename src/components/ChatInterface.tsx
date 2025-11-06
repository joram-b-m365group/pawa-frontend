import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { useChatStore } from '../store/chatStore'
import { chatApi } from '../services/api'
import ReactMarkdown from 'react-markdown'

interface ChatInterfaceProps {
  conversationId: string | null
}

export default function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { conversations, addMessage, createConversation, isLoading, setLoading } = useChatStore()

  const conversation = conversationId ? conversations.get(conversationId) : null

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation?.messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading || isStreaming) return

    let convId = conversationId
    if (!convId) {
      convId = createConversation()
    }

    // Add user message
    addMessage(convId, {
      role: 'user',
      content: input.trim(),
    })

    const userInput = input.trim()
    setInput('')
    setIsStreaming(true)

    try {
      // Use non-streaming API
      const response = await chatApi.sendMessage({
        message: userInput,
        conversation_id: convId,
        use_rag: true,
        temperature: 0.7,
        max_tokens: 2048,
      })

      // Add assistant response
      addMessage(convId, {
        role: 'assistant',
        content: response.response,
      })

      setIsStreaming(false)
    } catch (error: any) {
      console.error('Send error:', error)
      addMessage(convId, {
        role: 'assistant',
        content: `Error: ${error.message}`,
      })
      setIsStreaming(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {!conversation || conversation.messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Welcome to Genius AI
              </h2>
              <p className="text-gray-400 max-w-md">
                An advanced conversational AI with multi-agent reasoning, knowledge retrieval, and continuous learning.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {[
                  'Explain quantum computing',
                  'Write a Python function',
                  'Analyze this problem',
                  'Create a project plan'
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          conversation.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-2xl px-6 py-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                {message.role === 'assistant' ? (
                  <ReactMarkdown
                    className="prose prose-invert max-w-none"
                    components={{
                      code: ({ inline, children }) =>
                        inline ? (
                          <code className="bg-gray-900 px-1.5 py-0.5 rounded text-sm">
                            {children}
                          </code>
                        ) : (
                          <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                            <code>{children}</code>
                          </pre>
                        ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl px-6 py-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 bg-gray-900 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything..."
              rows={1}
              className="flex-1 bg-gray-800 text-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32"
              style={{ minHeight: '48px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isStreaming}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
