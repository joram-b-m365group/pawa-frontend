import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: number
  username: string
  email: string
}

interface AuthStore {
  user: User | null
  sessionToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>
  signup: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setLoading: (loading: boolean) => void
}

const API_URL = 'http://localhost:8000'

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      sessionToken: null,
      isAuthenticated: false,
      isLoading: false,

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      login: async (username: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          })

          const data = await response.json()

          if (data.success) {
            set({
              user: data.user,
              sessionToken: data.session_token,
              isAuthenticated: true,
              isLoading: false,
            })
            return { success: true, message: data.message }
          } else {
            set({ isLoading: false })
            return { success: false, message: data.message }
          }
        } catch (error: any) {
          set({ isLoading: false })
          return { success: false, message: error.message || 'Login failed' }
        }
      },

      signup: async (username: string, email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
          })

          const data = await response.json()

          if (data.success) {
            set({
              user: data.user,
              sessionToken: data.session_token,
              isAuthenticated: true,
              isLoading: false,
            })
            return { success: true, message: data.message }
          } else {
            set({ isLoading: false })
            return { success: false, message: data.message }
          }
        } catch (error: any) {
          set({ isLoading: false })
          return { success: false, message: error.message || 'Signup failed' }
        }
      },

      logout: async () => {
        const { sessionToken } = get()

        if (sessionToken) {
          try {
            await fetch(`${API_URL}/auth/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${sessionToken}`,
              },
            })
          } catch (error) {
            console.error('Logout error:', error)
          }
        }

        set({
          user: null,
          sessionToken: null,
          isAuthenticated: false,
        })
      },

      checkAuth: async () => {
        const { sessionToken } = get()

        if (!sessionToken) {
          set({ isAuthenticated: false, user: null })
          return
        }

        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${sessionToken}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            set({
              user: data.user,
              isAuthenticated: true,
            })
          } else {
            // Session expired or invalid
            set({
              user: null,
              sessionToken: null,
              isAuthenticated: false,
            })
          }
        } catch (error) {
          console.error('Auth check error:', error)
          set({
            user: null,
            sessionToken: null,
            isAuthenticated: false,
          })
        }
      },
    }),
    {
      name: 'genius-ai-auth',
      partialize: (state) => ({
        user: state.user,
        sessionToken: state.sessionToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
