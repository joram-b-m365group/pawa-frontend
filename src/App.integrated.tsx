import { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import EnhancedChatInterface from './components/EnhancedChatInterface'
import CodeEditor from './components/CodeEditor'
import UnifiedSidebar from './components/UnifiedSidebar'
import PricingModal from './components/PricingModal'
import ProjectBrowser from './components/ProjectBrowser'
import PawaIcon from './components/PawaIcon'

// NEW UX COMPONENTS
import ErrorBoundary from './components/ErrorBoundary'
import ErrorToast, { useToast } from './components/ErrorToast'
import CommandPalette, { DEFAULT_COMMANDS, CommandItem } from './components/CommandPalette'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import ContextIndicator from './components/ContextIndicator'
import OnboardingTour from './components/OnboardingTour'
import ProjectSetupWizard from './components/ProjectSetupWizard'
import StreamingChatUI from './components/StreamingChatUI'
import UndoRedoPanel from './components/UndoRedoPanel'
import { LoadingPage } from './components/LoadingStates'

import { useChatStore } from './store/chatStore'
import { useCodeStore } from './store/codeStore'
import { Crown, MessageSquare, Code2 } from 'lucide-react'

const API_URL = 'http://localhost:8001'

function AppContent() {
  const [showLanding, setShowLanding] = useState(true)
  const [activeView, setActiveView] = useState<'chat' | 'code'>('chat')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [userPlan, setUserPlan] = useState('free')
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [showProjectBrowser, setShowProjectBrowser] = useState(false)

  // NEW UX STATE
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [isFirstRun, setIsFirstRun] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [sessionId] = useState(() => `session_${Date.now()}`)
  const [filesInContext, setFilesInContext] = useState<string[]>([])

  const toast = useToast()

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

  // Check for first run and initialize
  useEffect(() => {
    checkFirstRun()
  }, [])

  const checkFirstRun = async () => {
    try {
      const response = await fetch('http://localhost:8000/setup/is-first-run')
      const data = await response.json()

      if (data.is_first_run) {
        setIsFirstRun(true)
        // Auto-initialize with defaults
        await fetch('http://localhost:8000/setup/initialize', { method: 'POST' })
        toast.success('Welcome to Pawa AI! Setup complete.', {
          description: 'Your intelligent coding assistant is ready'
        })
      }

      // Check if onboarding was completed
      const onboardingCompleted = localStorage.getItem('onboardingCompleted')
      if (!onboardingCompleted && !showLanding) {
        setShowOnboarding(true)
      }

      // Check if project setup wizard should be shown
      const lastProject = localStorage.getItem('lastProjectPath')
      if (!lastProject && !showLanding) {
        setShowSetupWizard(true)
      }

    } catch (error) {
      console.error('First run check failed:', error)
      toast.warning('Could not connect to backend', {
        description: 'Some features may be limited'
      })
    } finally {
      setIsInitializing(false)
    }
  }

  // Load projects on mount
  useEffect(() => {
    if (!showLanding) {
      loadProjects()
    }
  }, [showLanding])

  // Load file tree when project changes
  useEffect(() => {
    if (currentProject) {
      loadFileTree()
    }
  }, [currentProject])

  // Setup keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      description: 'Open command palette',
      handler: () => setShowCommandPalette(true)
    },
    {
      key: '/',
      ctrl: true,
      description: 'Toggle AI chat',
      handler: () => setActiveView(activeView === 'chat' ? 'code' : 'chat')
    },
    {
      key: 'Escape',
      description: 'Close modals',
      handler: () => {
        setShowCommandPalette(false)
        setPricingOpen(false)
        setShowNewProject(false)
      }
    }
  ])

  // Custom commands for command palette
  const customCommands: CommandItem[] = [
    {
      id: 'create-project',
      label: 'Create New Project',
      description: 'Start a new coding project',
      category: 'Project',
      action: () => setShowNewProject(true)
    },
    {
      id: 'browse-project',
      label: 'Open Local Project',
      description: 'Browse and open a project from your computer',
      category: 'Project',
      action: () => setShowProjectBrowser(true)
    },
    {
      id: 'replay-onboarding',
      label: 'Replay Onboarding Tour',
      description: 'See the feature walkthrough again',
      category: 'Help',
      action: () => setShowOnboarding(true)
    },
    {
      id: 'upgrade-plan',
      label: 'Upgrade Plan',
      description: 'View pricing and upgrade options',
      category: 'Account',
      action: () => setPricingOpen(true)
    }
  ]

  const loadProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/projects`)
      const data = await response.json()
      setProjects(data.projects)
    } catch (error) {
      console.error('Failed to load projects:', error)
      toast.error('Failed to load projects', {
        description: 'Check your connection and try again',
        action: { label: 'Retry', onClick: loadProjects }
      })
    }
  }

  const loadFileTree = async () => {
    if (!currentProject) return

    try {
      const response = await fetch(`${API_URL}/files/tree?project=${encodeURIComponent(currentProject)}`)
      const data = await response.json()
      setFileTree(data)

      // Update files in context
      const filesList = extractFilesList(data)
      setFilesInContext(filesList)
    } catch (error) {
      console.error('Failed to load file tree:', error)
      toast.error('Failed to load file tree', {
        action: { label: 'Retry', onClick: loadFileTree }
      })
    }
  }

  const extractFilesList = (tree: any): string[] => {
    const files: string[] = []
    const traverse = (node: any) => {
      if (node.type === 'file') {
        files.push(node.path)
      } else if (node.children) {
        node.children.forEach(traverse)
      }
    }
    if (Array.isArray(tree)) {
      tree.forEach(traverse)
    } else {
      traverse(tree)
    }
    return files
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
        localStorage.setItem('lastProjectPath', path)

        // Load file tree for local project
        const treeResponse = await fetch(`${API_URL}/files/tree?project=${encodeURIComponent(path)}&local=true`)
        const treeData = await treeResponse.json()
        setFileTree(treeData)
      } else {
        toast.error(data.message || 'Failed to open project')
      }
    } catch (error) {
      console.error('Failed to open local project:', error)
      toast.error('Failed to open project', {
        action: { label: 'Try Again', onClick: () => handleSelectLocalProject(path, name) }
      })
    }
  }

  const createProject = async () => {
    if (!newProjectName.trim()) {
      toast.warning('Please enter a project name')
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
      toast.error('Failed to create project', {
        action: { label: 'Retry', onClick: createProject }
      })
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
      toast.error('Failed to open file', {
        description: path,
        action: { label: 'Retry', onClick: () => handleFileClick(path) }
      })
    }
  }

  const handleSelectPlan = (plan: string) => {
    console.log('Selected plan:', plan)
    setPricingOpen(false)
    setUserPlan(plan)
    toast.success(`Upgraded to ${plan} plan!`, {
      description: 'All premium features unlocked'
    })
  }

  const handleStartChat = () => {
    setShowLanding(false)
  }

  const handleSetupWizardComplete = (projectPath: string) => {
    setShowSetupWizard(false)
    setCurrentProject(projectPath)
    toast.success('Project setup complete!', {
      description: 'Your codebase has been indexed and is ready'
    })

    // Show onboarding tour after setup
    if (!localStorage.getItem('onboardingCompleted')) {
      setTimeout(() => setShowOnboarding(true), 1000)
    }
  }

  const handleUndoRedoRestore = (filePath: string, content: string) => {
    // Update file in editor
    addOpenFile(filePath, content)
    toast.info('File restored', {
      description: filePath.split('/').pop() || filePath
    })
  }

  // Show loading screen during initialization
  if (isInitializing) {
    return <LoadingPage message="Initializing Pawa AI..." />
  }

  // Show landing page
  if (showLanding) {
    return <LandingPage onStartChat={handleStartChat} />
  }

  // Show project setup wizard on first run with no project
  if (showSetupWizard) {
    return (
      <ProjectSetupWizard
        onComplete={handleSetupWizardComplete}
        onSkip={() => setShowSetupWizard(false)}
      />
    )
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
        {/* Unified Sidebar with Undo/Redo Panel */}
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
        >
          {/* Add Undo/Redo Panel to sidebar */}
          {currentProject && (
            <div className="mt-4 px-2">
              <UndoRedoPanel
                sessionId={sessionId}
                onRestore={handleUndoRedoRestore}
              />
            </div>
          )}
        </UnifiedSidebar>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Glassmorphism Header with Context Indicator */}
          <header className="backdrop-blur-xl bg-gray-900/50 border-b border-gray-800/50 px-6 py-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
                {/* View Switcher */}
                <div className="flex items-center gap-1 bg-gray-800/50 border border-gray-700 rounded-xl p-1">
                  <button
                    onClick={() => setActiveView('chat')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      activeView === 'chat' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat
                  </button>
                  <button
                    onClick={() => setActiveView('code')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      activeView === 'code' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
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

            {/* Context Indicator */}
            <ContextIndicator
              projectPath={currentProject || undefined}
              conversationId={currentConversationId || undefined}
              currentModel="llama-3.3-70b-versatile"
              filesInContext={filesInContext}
            />
          </header>

          {/* Main Content Area - Switch between Chat and Code Editor */}
          {activeView === 'chat' ? (
            <StreamingChatUI
              projectPath={currentProject || undefined}
              onFileModified={(filePath) => {
                toast.info('File modified', { description: filePath.split('/').pop() })
              }}
            />
          ) : (
            <CodeEditor />
          )}
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={[...DEFAULT_COMMANDS, ...customCommands]}
      />

      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTour
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      )}

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

      {/* Toast Notifications */}
      <ErrorToast toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  )
}

// Wrap entire app with Error Boundary
function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}

export default App
