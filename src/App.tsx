import { useState, useEffect } from 'react'
import MinimalLandingPage from './components/MinimalLandingPage'
import EnhancedChatInterface from './components/EnhancedChatInterface'
import CodeEditorWithPreview from './components/CodeEditorWithPreview'
import UnifiedSidebar from './components/UnifiedSidebar'
import PricingModal from './components/PricingModal'
import ProjectBrowser from './components/ProjectBrowser'
import ProjectFolderManager from './components/ProjectFolderManager'
import PawaIcon from './components/PawaIcon'
import { useChatStore } from './store/chatStore'
import { useCodeStore } from './store/codeStore'
import { Crown, MessageSquare, Code2, FolderKanban } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || ''

function App() {
  const [showLanding, setShowLanding] = useState(false)
  const [activeView, setActiveView] = useState<'chat' | 'code'>('chat')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [userPlan, setUserPlan] = useState('free') // free, pro, enterprise
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [showProjectBrowser, setShowProjectBrowser] = useState(false)
  const [showProjectManager, setShowProjectManager] = useState(false)

  const { currentConversationId } = useChatStore()
  const {
    projects,
    currentProject,
    fileTree,
    currentFile,
    expandedFolders,
    setProjects,
    setCurrentProject,
    setFileTree,
    addOpenFile,
    toggleFolder,
  } = useCodeStore()

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  // Keyboard shortcut for Project Manager (Ctrl+Shift+P)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        setShowProjectManager(true)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  // Load file tree when project changes
  useEffect(() => {
    if (currentProject) {
      loadFileTree()
    }
  }, [currentProject])

  const loadProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/projects`)
      const data = await response.json()
      setProjects(data.projects)
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }

  const loadFileTree = async () => {
    if (!currentProject) return

    try {
      const response = await fetch(`${API_URL}/files/tree?project=${encodeURIComponent(currentProject)}`)
      const data = await response.json()
      setFileTree(data)
    } catch (error) {
      console.error('Failed to load file tree:', error)
      toast.error('Failed to load file tree')
    }
  }

  const handleCreateProject = () => {
    setShowNewProject(true)
  }

  const handleBrowseLocalProject = () => {
    setShowProjectBrowser(true)
  }

  const handleSelectLocalProject = async (path: string, name: string) => {
    try {
      const response = await fetch(`${API_URL}/projects/open-local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      })
      const data = await response.json()

      if (data.success) {
        toast.success(`Opened project: ${name}`)
        setCurrentProject(path)
        // Load file tree for local project
        const treeResponse = await fetch(`${API_URL}/files/tree?project=${encodeURIComponent(path)}&local=true`)
        const treeData = await treeResponse.json()
        setFileTree(treeData)
      } else {
        toast.error(data.message || 'Failed to open project')
      }
    } catch (error) {
      console.error('Failed to open local project:', error)
      toast.error('Failed to open project')
    }
  }

  const createProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('Please enter a project name')
      return
    }

    setIsCreatingProject(true)
    try {
      const response = await fetch(`${API_URL}/projects/create?name=${encodeURIComponent(newProjectName)}`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        toast.success(`Project "${newProjectName}" created!`)
        setNewProjectName('')
        setShowNewProject(false)
        await loadProjects()
        setCurrentProject(data.path)
      } else {
        toast.error(data.message || 'Failed to create project')
      }
    } catch (error) {
      console.error('Failed to create project:', error)
      toast.error('Failed to create project')
    } finally {
      setIsCreatingProject(false)
    }
  }

  const handleFileClick = async (path: string) => {
    try {
      const response = await fetch(`${API_URL}/files/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      })
      const data = await response.json()
      addOpenFile(path, data.content)
    } catch (error) {
      console.error('Failed to open file:', error)
      toast.error('Failed to open file')
    }
  }

  const handleSelectPlan = (plan: string) => {
    // TODO: Integrate with payment provider (Stripe, PayPal, etc.)
    console.log('Selected plan:', plan)
    setPricingOpen(false)
    // For now, just set the plan
    setUserPlan(plan)
  }

  const handleStartChat = () => {
    setShowLanding(false)
  }

  // Show landing page
  if (showLanding) {
    return <MinimalLandingPage onStartChat={handleStartChat} />
  }

  // Show main chat interface
  return (
    <div className="relative flex h-screen bg-black text-gray-100 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 flex w-full">
        {/* Unified Sidebar */}
        <UnifiedSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          activeView={activeView}
          projects={projects}
          currentProject={currentProject}
          onProjectChange={setCurrentProject}
          onCreateProject={handleCreateProject}
          onBrowseLocalProject={handleBrowseLocalProject}
          fileTree={fileTree}
          onFileClick={handleFileClick}
          expandedFolders={expandedFolders}
          onToggleFolder={toggleFolder}
          currentFile={currentFile}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Glassmorphism Header */}
          <header className="backdrop-blur-xl bg-gray-900/50 border-b border-gray-800/50 px-6 py-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-all"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>

                {/* Logo with Animation */}
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowLanding(true)}>
                  <div className="relative">
                    <PawaIcon size={40} />
                    <div className="absolute inset-0 blur-xl opacity-50 animate-pulse">
                      <PawaIcon size={40} />
                    </div>
                  </div>
                  <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Pawa AI
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Projects Button */}
                <button
                  onClick={() => setShowProjectManager(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 hover:border-purple-500/50 rounded-xl transition-all text-gray-300 hover:text-white"
                  title="Open Projects (Ctrl+Shift+P)"
                >
                  <FolderKanban className="w-4 h-4" />
                  Projects
                </button>

                {/* View Switcher */}
                <div className="flex items-center gap-1 bg-gray-800/50 border border-gray-700 rounded-xl p-1">
                  <button
                    onClick={() => setActiveView('chat')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      activeView === 'chat'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat
                  </button>
                  <button
                    onClick={() => setActiveView('code')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      activeView === 'code'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Code2 className="w-4 h-4" />
                    Code
                  </button>
                </div>
                {/* Plan Badge */}
                {userPlan !== 'free' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-semibold text-yellow-400 capitalize">{userPlan}</span>
                  </div>
                )}

                {/* Upgrade Button */}
                {userPlan === 'free' && (
                  <button
                    onClick={() => setPricingOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/30"
                  >
                    <Crown className="w-4 h-4" />
                    Upgrade
                  </button>
                )}

                {/* Status Indicator */}
                <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-sm backdrop-blur-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Online
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area - Switch between Chat and Code Editor */}
          {activeView === 'chat' ? (
            <EnhancedChatInterface conversationId={currentConversationId} />
          ) : (
            <CodeEditorWithPreview />
          )}
        </div>
      </div>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={pricingOpen}
        onClose={() => setPricingOpen(false)}
        onSelectPlan={handleSelectPlan}
      />

      {/* Project Browser Modal */}
      <ProjectBrowser
        isOpen={showProjectBrowser}
        onClose={() => setShowProjectBrowser(false)}
        onSelectProject={handleSelectLocalProject}
      />

      {/* Project Manager Modal */}
      <ProjectFolderManager
        isOpen={showProjectManager}
        onClose={() => setShowProjectManager(false)}
        onSelectProject={(project) => {
          setCurrentProject(project.path)
          loadFileTree()
          toast.success(`Opened project: ${project.name}`)
        }}
        currentProjectId={currentProject || undefined}
      />

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold mb-4">Create New Project</h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createProject()}
              placeholder="Enter project name..."
              autoFocus
              className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewProject(false)
                  setNewProjectName('')
                }}
                disabled={isCreatingProject}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={isCreatingProject || !newProjectName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingProject ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
