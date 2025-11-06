import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react'
import { useChatStore } from '../store/chatStore'
import ReactMarkdown from 'react-markdown'

interface ChatInterfaceProps {
  conversationId: string | null
}

export default function ChatInterfaceWithFiles({ conversationId }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { conversations, addMessage, createConversation } = useChatStore()

  const conversation = conversationId ? conversations.get(conversationId) : null

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation?.messages])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPreviewUrl(null)
      }
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || isLoading) return

    let convId = conversationId
    if (!convId) {
      convId = createConversation()
    }

    const userInput = input.trim() || 'Analyze this file'

    // Add user message
    addMessage(convId, {
      role: 'user',
      content: selectedFile ? `${userInput} [${selectedFile.name}]` : userInput,
    })

    setInput('')
    setIsLoading(true)

    try {
      if (selectedFile) {
        // Upload file
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('message', userInput)

        const response = await fetch('http://localhost:8000/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        addMessage(convId, {
          role: 'assistant',
          content: data.response,
        })

        clearFile()
      } else {
        // Regular chat
        const response = await fetch('http://localhost:8000/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userInput,
          }),
        })

        const data = await response.json()

        addMessage(convId, {
          role: 'assistant',
          content: data.response,
        })
      }

      setIsLoading(false)
    } catch (error: any) {
      console.error('Send error:', error)
      addMessage(convId, {
        role: 'assistant',
        content: `Error: ${error.message}`,
      })
      setIsLoading(false)
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
                Chat, upload images, analyze documents - powered by FREE 70B AI!
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {[
                  'What is biology?',
                  'Upload an image',
                  'Analyze a document',
                  'Help me code'
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-sm text-gray-300 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          conversation.messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-gray-800/50 text-gray-100'
                }`}
              >
                <ReactMarkdown className="prose prose-invert max-w-none">
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800/50 rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div className="px-4 py-2 border-t border-gray-800/50">
          <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded" />
            ) : (
              <FileText className="w-8 h-8 text-gray-400" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-200">{selectedFile.name}</p>
              <p className="text-xs text-gray-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={clearFile}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-800/50 p-4">
        <div className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,text/*,application/pdf"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl transition-colors disabled:opacity-50"
            title="Upload file"
          >
            <Paperclip className="w-5 h-5 text-gray-400" />
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={selectedFile ? "Ask about this file..." : "Message Genius AI..."}
            disabled={isLoading}
            className="flex-1 bg-gray-800/50 text-white rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 min-h-[52px] max-h-[200px]"
            rows={1}
          />

          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !selectedFile)}
            className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2 text-center">
          Powered by FREE Groq 70B AI • Upload images, PDFs, or text files
        </p>
      </div>
    </div>
  )
}
