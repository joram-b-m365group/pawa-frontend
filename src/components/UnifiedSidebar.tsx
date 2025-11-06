import { useState } from 'react'
import {
  Plus, MessageSquare, Trash2, X, LogIn, LogOut, User, Code2,
  Folder, File, FolderPlus, ChevronRight, ChevronDown, FolderOpen
} from 'lucide-react'
import { useChatStore } from '../store/chatStore'
import { useAuthStore } from '../store/authStore'
import AuthModal from './AuthModal'
import toast from 'react-hot-toast'

interface UnifiedSidebarProps {
  isOpen: boolean
  onToggle: () => void
  activeView: 'chat' | 'code'
  // Code editor props
  projects?: any[]
  currentProject?: string | null
  onProjectChange?: (project: string) => void
  onCreateProject?: () => void
  onBrowseLocalProject?: () => void
  fileTree?: any
  onFileClick?: (path: string) => void
  expandedFolders?: Set<string>
  onToggleFolder?: (path: string) => void
  currentFile?: string | null
}

export default function UnifiedSidebar({
  isOpen,
  onToggle,
  activeView,
  projects = [],
  currentProject,
  onProjectChange,
  onCreateProject,
  onBrowseLocalProject,
  fileTree,
  onFileClick,
  expandedFolders = new Set(),
  onToggleFolder,
  currentFile
}: UnifiedSidebarProps) {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  const {
    conversations,
    currentConversationId,
    createConversation,
    setCurrentConversation,
    deleteConversation,
    clearConversations,
  } = useChatStore()

  const { user, isAuthenticated, logout } = useAuthStore()

  const handleLogout = () => {
    clearConversations()
    logout()
    toast.success('Logged out successfully')
  }

  const conversationsList = Array.from(conversations.values()).sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  )

  const renderFileTree = (node: any, level: number = 0): JSX.Element => {
    if (!node) return <></>

    const isExpanded = expandedFolders.has(node.path)
    const isCurrentFile = currentFile === node.path

    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-2 px-2 py-1.5 hover:bg-gray-700/50 cursor-pointer rounded text-sm ${
            isCurrentFile ? 'bg-blue-600/30 border-l-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => {
            if (node.type === 'directory') {
              onToggleFolder?.(node.path)
            } else {
              onFileClick?.(node.path)
            }
          }}
        >
          {node.type === 'directory' ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              <Folder className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
            </>
          ) : (
            <File className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-4" />
          )}
          <span className="text-sm truncate">{node.name}</span>
        </div>

        {node.type === 'directory' && isExpanded && node.children && (
          <div>
            {node.children.map((child: any) => renderFileTree(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-gray-900/95 backdrop-blur-xl border-r border-gray-800/50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-800/50 bg-gradient-to-r from-gray-900/50 to-gray-800/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                {activeView === 'chat' ? (
                  <>
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    Conversations
                  </>
                ) : (
                  <>
                    <Code2 className="w-5 h-5 text-purple-400" />
                    Projects
                  </>
                )}
              </h2>
              <button
                onClick={onToggle}
                className="lg:hidden p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Button */}
            {activeView === 'chat' ? (
              <button
                onClick={() => {
                  createConversation()
                  if (window.innerWidth < 1024) onToggle()
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg transition-all shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-5 h-5" />
                New Chat
              </button>
            ) : (
              <div className="space-y-2">
                <select
                  value={currentProject || ''}
                  onChange={(e) => onProjectChange?.(e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                >
                  <option value="">Select project...</option>
                  {projects.map((project: any) => (
                    <option key={project.path} value={project.path}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onCreateProject}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-lg transition-all shadow-lg shadow-purple-500/20 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    New
                  </button>
                  <button
                    onClick={onBrowseLocalProject}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg transition-all shadow-lg shadow-blue-500/20 text-sm"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Browse
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Section */}
          <div className="p-4 border-b border-gray-800/50 bg-gray-800/20">
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{user.username}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-all border border-red-500/20"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setAuthMode('login')
                    setShowAuthModal(true)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg transition-all shadow-lg shadow-blue-500/20"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup')
                    setShowAuthModal(true)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-lg transition-all"
                >
                  <User className="w-4 h-4" />
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Content List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {activeView === 'chat' ? (
              // Chat Conversations
              conversationsList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-1">Start a new chat to begin</p>
                </div>
              ) : (
                conversationsList.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                      currentConversationId === conv.id
                        ? 'bg-blue-600/20 border border-blue-500/30'
                        : 'hover:bg-gray-800/50 border border-transparent'
                    }`}
                    onClick={() => {
                      setCurrentConversation(conv.id)
                      if (window.innerWidth < 1024) onToggle()
                    }}
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate font-medium">{conv.title}</p>
                      <p className="text-xs text-gray-500">
                        {conv.messages.length} messages
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Delete this conversation?')) {
                          deleteConversation(conv.id)
                          toast.success('Conversation deleted')
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-600/20 text-red-400 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )
            ) : (
              // Code Editor File Tree
              fileTree ? (
                <div className="space-y-1">
                  {renderFileTree(fileTree)}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {currentProject ? 'Loading files...' : 'No project selected'}
                  </p>
                  <p className="text-xs mt-1">
                    {currentProject ? '' : 'Create or select a project'}
                  </p>
                </div>
              )
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800/50 bg-gray-800/20">
            <div className="text-xs text-gray-500 space-y-1 text-center">
              <p className="font-semibold text-gray-400">Pawa AI v1.0</p>
              <p>
                {activeView === 'chat'
                  ? 'Multi-agent reasoning'
                  : 'AI-powered coding'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  )
}
