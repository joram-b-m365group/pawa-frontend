import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface ChatRequest {
  message: string
  conversation_id?: string
  stream?: boolean
  use_rag?: boolean
  temperature?: number
  max_tokens?: number
}

export interface ChatResponse {
  response: string
  conversation_id: string
  model: string
  tokens_used: number
  metadata?: Record<string, any>
  timestamp: string
}

export interface HealthResponse {
  status: string
  version: string
  model_loaded: boolean
  timestamp: string
}

export const chatApi = {
  // Send chat message
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/chat', request)
    return response.data
  },

  // Stream chat message
  streamMessage: async (
    request: ChatRequest,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          onComplete()
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              onComplete()
              return
            }

            if (data.startsWith('[ERROR]')) {
              onError(new Error(data.slice(8)))
              return
            }

            onChunk(data)
          }
        }
      }
    } catch (error) {
      onError(error as Error)
    }
  },

  // Health check
  healthCheck: async (): Promise<HealthResponse> => {
    const response = await api.get<HealthResponse>('/health')
    return response.data
  },

  // Upload document
  uploadDocument: async (content: string, metadata?: Record<string, any>) => {
    const response = await api.post('/documents', {
      content,
      metadata: metadata || {},
    })
    return response.data
  },

  // Delete conversation
  deleteConversation: async (conversationId: string) => {
    const response = await api.delete(`/conversations/${conversationId}`)
    return response.data
  },

  // Get conversation
  getConversation: async (conversationId: string) => {
    const response = await api.get(`/conversations/${conversationId}`)
    return response.data
  },
}

export default api
