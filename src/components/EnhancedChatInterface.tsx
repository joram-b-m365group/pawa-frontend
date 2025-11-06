import { useState, useRef, useEffect } from 'react'
import {
  Send, Loader2, Paperclip, X, FileText, Copy, Check,
  Download, Mic, MicOff, Trash2, Share2, Image as ImageIcon
} from 'lucide-react'
import { useChatStore } from '../store/chatStore'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import toast, { Toaster } from 'react-hot-toast'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface ChatInterfaceProps {
  conversationId: string | null
}

export default function EnhancedChatInterface({ conversationId }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [isRecording, setIsRecording] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const { conversations, addMessage, createConversation, deleteConversation } = useChatStore()

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
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }

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

      toast.success(`File "${file.name}" selected`)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleExportChat = () => {
    if (!conversation) return

    const chatText = conversation.messages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n')

    const blob = new Blob([chatText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `genius-ai-chat-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Chat exported!')
  }

  const handleShareChat = async () => {
    if (!conversation) return

    const chatText = conversation.messages
      .map(msg => `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`)
      .join('\n\n')

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pawa AI Conversation',
          text: chatText,
        })
        toast.success('Shared successfully!')
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      handleCopy(chatText, -1)
      toast.success('Chat copied to clipboard! (Share not supported)')
    }
  }

  const handleClearChat = () => {
    if (conversationId && window.confirm('Clear this conversation?')) {
      deleteConversation(conversationId)
      toast.success('Conversation cleared')
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })

        try {
          // Send to Groq Whisper API for transcription
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')

          toast.loading('Transcribing audio...', { id: 'transcribe' })

          const response = await fetch('http://localhost:8000/transcribe', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) {
            throw new Error('Transcription failed')
          }

          const data = await response.json()

          // Set the transcribed text as input
          setInput(data.transcription)
          toast.success('Audio transcribed successfully!', { id: 'transcribe' })
        } catch (error) {
          console.error('Transcription error:', error)
          toast.error('Failed to transcribe audio', { id: 'transcribe' })
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      toast.success('Recording started...')
    } catch (error) {
      toast.error('Microphone access denied')
      console.error('Recording error:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      toast.success('Recording stopped')
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
        // Check if file is an image for vision analysis
        const isImage = selectedFile.type.startsWith('image/')

        if (isImage) {
          // Use Vision API for images
          const formData = new FormData()
          formData.append('image', selectedFile)
          formData.append('message', userInput)

          toast.loading('Analyzing image with vision AI...', { id: 'vision' })

          const response = await fetch('http://localhost:8000/vision', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            throw new Error(`Vision API error: ${response.status}`)
          }

          const data = await response.json()

          addMessage(convId, {
            role: 'assistant',
            content: data.response,
          })

          clearFile()
          toast.success('Image analyzed with Vision AI!', { id: 'vision' })
        } else {
          // Use regular upload for non-image files
          const formData = new FormData()
          formData.append('file', selectedFile)
          formData.append('message', userInput)

          const response = await fetch('http://localhost:8000/upload', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            throw new Error(`Server error: ${response.status}`)
          }

          const data = await response.json()

          addMessage(convId, {
            role: 'assistant',
            content: data.response,
          })

          clearFile()
          toast.success('File analyzed!')
        }
      } else {
        // Regular chat
        // Get conversation history for context
        const currentConv = conversations.get(convId)
        const conversationHistory = currentConv?.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })) || []

        const response = await fetch('http://localhost:8000/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userInput,
            conversation_history: conversationHistory,
            conversation_id: convId,
          }),
        })

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`)
        }

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
      toast.error('Failed to send message')
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const welcomePrompts = [
    { text: 'Explain quantum computing', icon: '⚛️' },
    { text: 'Write a Python web scraper', icon: '🐍' },
    { text: 'Analyze this image', icon: '🖼️' },
    { text: 'Debug my code', icon: '🐛' },
    { text: 'Create a business plan', icon: '💼' },
    { text: 'Explain machine learning', icon: '🤖' },
    { text: 'Write a song', icon: '🎵' },
    { text: 'Design a database schema', icon: '🗄️' },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Toaster position="top-right" />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {!conversation || conversation.messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-6 max-w-3xl">
              <div className="space-y-3">
                <h2 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Pawa AI
                </h2>
                <p className="text-xl text-gray-300">
                  Your intelligent AI coding assistant
                </p>
                <p className="text-sm text-gray-400">
                  Upload images, analyze documents, write code, create content, and more!
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
                {welcomePrompts.map((prompt) => (
                  <button
                    key={prompt.text}
                    onClick={() => setInput(prompt.text)}
                    className="group p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:from-gray-700/50 hover:to-gray-800/50 rounded-xl text-sm text-gray-300 transition-all border border-gray-700/50 hover:border-gray-600/50 hover:scale-105"
                  >
                    <div className="text-2xl mb-2">{prompt.icon}</div>
                    <div className="text-xs">{prompt.text}</div>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center gap-4 mt-8 text-xs text-gray-500">
                <span>🚀 Lightning fast</span>
                <span>•</span>
                <span>💰 100% FREE</span>
                <span>•</span>
                <span>🤖 AI-powered</span>
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
                className={`group relative max-w-[85%] rounded-2xl px-5 py-4 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-gray-800/50 text-gray-100 border border-gray-700/50'
                }`}
              >
                <ReactMarkdown
                  className="prose prose-invert max-w-none prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700"
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus as any}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                          }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>

                {/* Copy button for assistant messages */}
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => handleCopy(msg.content, idx)}
                    className="absolute top-2 right-2 p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title="Copy message"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-300" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-sm text-gray-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Action Bar */}
      {conversation && conversation.messages.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-800/50">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleExportChat}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-xs text-gray-300 transition-colors"
              title="Export chat"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={handleShareChat}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-xs text-gray-300 transition-colors"
              title="Share chat"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={handleClearChat}
              className="flex items-center gap-2 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 rounded-lg text-xs text-red-400 transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="px-4 py-2 border-t border-gray-800/50">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-gray-700" />
            ) : (
              <div className="w-16 h-16 flex items-center justify-center bg-gray-800 rounded-lg">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-200">{selectedFile.name}</p>
              <p className="text-xs text-gray-400">
                {(selectedFile.size / 1024).toFixed(1)} KB • Ready to analyze
              </p>
            </div>
            <button
              onClick={clearFile}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              title="Remove file"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      )}


      {/* Input */}
      <div className="border-t border-gray-800/50 p-4 bg-gray-900/30">
        {/* Image Preview */}
        {previewUrl && selectedFile && (
          <div className="mb-4 p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-600"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type.split('/')[1]?.toUpperCase()}
                    </p>
                  </div>
                  <button
                    onClick={clearFile}
                    className="p-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors flex-shrink-0"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
                  </div>
                  <span className="text-xs text-gray-400">Ready</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,text/*,application/pdf,.doc,.docx"
            className="hidden"
          />

          {/* File Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl transition-colors disabled:opacity-50 group"
            title="Upload file (images, PDFs, documents)"
          >
            <Paperclip className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
          </button>

          {/* Voice Input */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={`p-3 rounded-xl transition-all disabled:opacity-50 ${
              isRecording
                ? 'bg-red-600 hover:bg-red-500 animate-pulse'
                : 'bg-gray-800/50 hover:bg-gray-700/50'
            }`}
            title={isRecording ? 'Stop recording' : 'Voice input'}
          >
            {isRecording ? (
              <MicOff className="w-5 h-5 text-white" />
            ) : (
              <Mic className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {/* Text Input */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={selectedFile ? "Ask about this file..." : "Ask anything... (Shift+Enter for new line)"}
            disabled={isLoading}
            className="flex-1 bg-gray-800/50 text-white rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 min-h-[52px] max-h-[200px] border border-gray-700/50"
            rows={1}
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !selectedFile)}
            className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-center mt-3 text-xs text-gray-500">
          <span>Press Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  )
}
