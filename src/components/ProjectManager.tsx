import { useState, useEffect } from 'react'
import {
  FolderPlus,
  Folder,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Star,
  StarOff,
  Clock,
  FolderOpen,
  Code,
  X,
  Plus,
  Settings
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Project {
  id: string
  name: string
  path: string
  description?: string
  language?: string
  framework?: string
  created: number
  lastOpened: number
  favorite: boolean
  color?: string
  tags?: string[]
}

interface ProjectManagerProps {
  isOpen: boolean
  onClose: () => void
  onSelectProject: (project: Project) => void
  currentProjectId?: string
}

const PROJECT_COLORS = [
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
]

const LANGUAGE_ICONS: Record<string, string> = {
  typescript: '📘',
  javascript: '📙',
  python: '🐍',
  java: '☕',
  go: '🔷',
  rust: '🦀',
  ruby: '💎',
  php: '🐘',
}

export default function ProjectManager({ isOpen, onClose, onSelectProject, currentProjectId }: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'created'>('recent')

  useEffect(() => {
    if (isOpen) {
      loadProjects()
    }
  }, [isOpen])

  useEffect(() => {
    // Filter and sort projects
    let filtered = projects.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    // Sort projects
    filtered = filtered.sort((a, b) => {
      if (sortBy === 'recent') return b.lastOpened - a.lastOpened
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'created') return b.created - a.created
      return 0
    })

    // Favorites first
    filtered = [
      ...filtered.filter(p => p.favorite),
      ...filtered.filter(p => !p.favorite)
    ]

    setFilteredProjects(filtered)
  }, [projects, searchQuery, sortBy])

  const loadProjects = () => {
    const stored = localStorage.getItem('pawa_projects')
    if (stored) {
      setProjects(JSON.parse(stored))
    }
  }

  const saveProjects = (updatedProjects: Project[]) => {
    localStorage.setItem('pawa_projects', JSON.stringify(updatedProjects))
    setProjects(updatedProjects)
  }

  const createProject = (name: string, path: string, details: Partial<Project>) => {
    const newProject: Project = {
      id: `project_${Date.now()}`,
      name,
      path,
      ...details,
      created: Date.now(),
      lastOpened: Date.now(),
      favorite: false,
    }
    saveProjects([...projects, newProject])
    toast.success(`Project "${name}" created!`)
    return newProject
  }

  const updateProject = (id: string, updates: Partial<Project>) => {
    const updated = projects.map(p =>
      p.id === id ? { ...p, ...updates } : p
    )
    saveProjects(updated)
    toast.success('Project updated!')
  }

  const deleteProject = (id: string) => {
    const project = projects.find(p => p.id === id)
    if (confirm(`Delete project "${project?.name}"? This won't delete the files.`)) {
      saveProjects(projects.filter(p => p.id !== id))
      toast.success('Project removed from list')
    }
  }

  const toggleFavorite = (id: string) => {
    const updated = projects.map(p =>
      p.id === id ? { ...p, favorite: !p.favorite } : p
    )
    saveProjects(updated)
  }

  const handleSelectProject = (project: Project) => {
    updateProject(project.id, { lastOpened: Date.now() })
    onSelectProject(project)
    onClose()
  }

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl w-full max-w-6xl max-h-[90vh] border border-gray-700 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-blue-900/20">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Projects</h2>
              <p className="text-sm text-gray-400">{projects.length} total projects</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Actions */}
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/50">
          <div className="flex gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by name, description, or tags..."
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            >
              <option value="recent">Recently Opened</option>
              <option value="name">Name</option>
              <option value="created">Date Created</option>
            </select>

            {/* New Project Button */}
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Project
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-20">
              <Folder className="w-20 h-20 mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create your first project to get started'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium inline-flex items-center gap-2"
                >
                  <FolderPlus className="w-5 h-5" />
                  Create First Project
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className={`group relative bg-gray-800 border-2 rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl ${
                    project.id === currentProjectId
                      ? 'border-purple-500 ring-2 ring-purple-500/30'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => handleSelectProject(project)}
                  style={{
                    borderTopColor: project.color || '#8B5CF6',
                    borderTopWidth: '4px'
                  }}
                >
                  {/* Favorite Star */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(project.id)
                    }}
                    className="absolute top-3 right-3 p-1.5 hover:bg-gray-700 rounded-lg transition-colors z-10"
                  >
                    {project.favorite ? (
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ) : (
                      <StarOff className="w-4 h-4 text-gray-500 group-hover:text-gray-400" />
                    )}
                  </button>

                  {/* Project Info */}
                  <div className="mb-3">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="p-2 bg-gray-700 rounded-lg">
                        <span className="text-2xl">
                          {project.language ? LANGUAGE_ICONS[project.language.toLowerCase()] || '📁' : '📁'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate mb-1">{project.name}</h3>
                        {project.framework && (
                          <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">
                            {project.framework}
                          </span>
                        )}
                      </div>
                    </div>

                    {project.description && (
                      <p className="text-sm text-gray-400 line-clamp-2 mb-2">{project.description}</p>
                    )}

                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {project.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-xs bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                        {project.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{project.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-700">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(project.lastOpened)}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingProject(project)
                          setShowCreateDialog(true)
                        }}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteProject(project.id)
                        }}
                        className="p-1 hover:bg-red-900/30 hover:text-red-400 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Current Project Badge */}
                  {project.id === currentProjectId && (
                    <div className="absolute -top-2 -left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                      Active
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Project Dialog */}
      {showCreateDialog && (
        <CreateProjectDialog
          isOpen={showCreateDialog}
          onClose={() => {
            setShowCreateDialog(false)
            setEditingProject(null)
          }}
          onCreate={createProject}
          onUpdate={updateProject}
          editingProject={editingProject}
        />
      )}
    </div>
  )
}

// Create Project Dialog Component
interface CreateProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, path: string, details: Partial<Project>) => Project
  onUpdate: (id: string, updates: Partial<Project>) => void
  editingProject: Project | null
}

function CreateProjectDialog({ isOpen, onClose, onCreate, onUpdate, editingProject }: CreateProjectDialogProps) {
  const [name, setName] = useState(editingProject?.name || '')
  const [path, setPath] = useState(editingProject?.path || '')
  const [description, setDescription] = useState(editingProject?.description || '')
  const [language, setLanguage] = useState(editingProject?.language || '')
  const [framework, setFramework] = useState(editingProject?.framework || '')
  const [color, setColor] = useState(editingProject?.color || PROJECT_COLORS[0])
  const [tags, setTags] = useState(editingProject?.tags?.join(', ') || '')
  const [showBrowser, setShowBrowser] = useState(false)

  const handleSubmit = () => {
    if (!name || !path) {
      toast.error('Name and path are required')
      return
    }

    const details: Partial<Project> = {
      description: description || undefined,
      language: language || undefined,
      framework: framework || undefined,
      color,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
    }

    if (editingProject) {
      onUpdate(editingProject.id, { name, path, ...details })
    } else {
      onCreate(name, path, details)
    }

    onClose()
  }

  const handleBrowsePath = () => {
    // Open folder browser
    setShowBrowser(true)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl border border-gray-700 p-6">
        <h3 className="text-xl font-bold mb-6">
          {editingProject ? 'Edit Project' : 'Create New Project'}
        </h3>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Project"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            />
          </div>

          {/* Path */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project Path *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="C:\Users\...\my-project"
                className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white font-mono text-sm"
              />
              <button
                onClick={handleBrowsePath}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Browse
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={3}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white resize-none"
            />
          </div>

          {/* Language & Framework */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              >
                <option value="">Select...</option>
                <option value="TypeScript">TypeScript</option>
                <option value="JavaScript">JavaScript</option>
                <option value="Python">Python</option>
                <option value="Java">Java</option>
                <option value="Go">Go</option>
                <option value="Rust">Rust</option>
                <option value="Ruby">Ruby</option>
                <option value="PHP">PHP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Framework</label>
              <input
                type="text"
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                placeholder="React, Next.js, FastAPI..."
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project Color</label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    color === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="web, frontend, ecommerce"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
          >
            {editingProject ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  )
}
