import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface ChatStore {
  conversations: Map<string, Conversation>
  currentConversationId: string | null
  isLoading: boolean

  // Actions
  createConversation: () => string
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => void
  setCurrentConversation: (id: string) => void
  deleteConversation: (id: string) => void
  setLoading: (loading: boolean) => void
  clearConversations: () => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: new Map(),
  currentConversationId: null,
  isLoading: false,

  createConversation: () => {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const conversation: Conversation = {
      id,
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    set((state) => {
      const newConversations = new Map(state.conversations)
      newConversations.set(id, conversation)
      return {
        conversations: newConversations,
        currentConversationId: id,
      }
    })

    return id
  },

  addMessage: (conversationId, message) => {
    const conversations = get().conversations
    const conversation = conversations.get(conversationId)

    if (!conversation) return

    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    }

    // Update title from first user message
    if (conversation.messages.length === 0 && message.role === 'user') {
      conversation.title = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')
    }

    conversation.messages.push(newMessage)
    conversation.updatedAt = new Date()

    set((state) => {
      const newConversations = new Map(state.conversations)
      newConversations.set(conversationId, { ...conversation })
      return { conversations: newConversations }
    })
  },

  setCurrentConversation: (id) => {
    set({ currentConversationId: id })
  },

  deleteConversation: (id) => {
    set((state) => {
      const newConversations = new Map(state.conversations)
      newConversations.delete(id)

      let newCurrentId = state.currentConversationId
      if (newCurrentId === id) {
        // Set to first available conversation or null
        newCurrentId = newConversations.size > 0
          ? Array.from(newConversations.keys())[0]
          : null
      }

      return {
        conversations: newConversations,
        currentConversationId: newCurrentId,
      }
    })
  },

  setLoading: (loading) => {
    set({ isLoading: loading })
  },

  clearConversations: () => {
    set({
      conversations: new Map(),
      currentConversationId: null,
    })
  },
}))
