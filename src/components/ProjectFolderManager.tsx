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
  X,
  Plus,
  Settings,
  FileText,
  Image,
  Book,
  Briefcase,
  Heart,
  Music,
  Video,
  Code2,
  CheckSquare,
  Layers
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ProjectFolder {
  id: string
  name: string
  path: string
  type: 'coding' | 'writing' | 'research' | 'design' | 'business' | 'personal' | 'media' | 'other'
  description?: string
  created: number
  lastOpened: number
  favorite: boolean
  color?: string
  tags?: string[]
  icon?: string
  subfolders?: string[]
  files?: number
}

interface ProjectFolderManagerProps {
  isOpen: boolean
  onClose: () => void
  onSelectProject: (project: ProjectFolder) => void
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

const PROJECT_TYPES = {
  coding: { icon: Code2, label: 'Coding', color: '#3B82F6' },
  writing: { icon: FileText, label: 'Writing', color: '#8B5CF6' },
  research: { icon: Book, label: 'Research', color: '#10B981' },
  design: { icon: Image, label: 'Design', color: '#EC4899' },
  business: { icon: Briefcase, label: 'Business', color: '#F59E0B' },
  personal: { icon: Heart, label: 'Personal', color: '#EF4444' },
  media: { icon: Video, label: 'Media', color: '#6366F1' },
  other: { icon: Layers, label: 'Other', color: '#14B8A6' },
}

const FOLDER_TEMPLATES = {
  coding: {
    subfolders: ['src', 'docs', 'tests', 'assets'],
    description: 'Standard coding project structure'
  },
  writing: {
    subfolders: ['drafts', 'final', 'research', 'notes'],
    description: 'Writing project with drafts and research'
  },
  research: {
    subfolders: ['papers', 'notes', 'data', 'references'],
    description: 'Research project organization'
  },
  design: {
    subfolders: ['mockups', 'assets', 'exports', 'references'],
    description: 'Design project structure'
  },
  business: {
    subfolders: ['documents', 'presentations', 'financials', 'meetings'],
    description: 'Business project organization'
  },
  personal: {
    subfolders: ['documents', 'photos', 'notes'],
    description: 'Personal project folders'
  },
  media: {
    subfolders: ['raw', 'edited', 'exports', 'assets'],
    description: 'Media project structure'
  },
  other: {
    subfolders: ['files', 'notes'],
    description: 'General project structure'
  }
}

export default function ProjectFolderManager({ isOpen, onClose, onSelectProject, currentProjectId }: ProjectFolderManagerProps) {
  const [projects, setProjects] = useState<ProjectFolder[]>([])
  const [filteredProjects, setFilteredProjects] = useState<ProjectFolder[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectFolder | null>(null)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'created'>('recent')
  const [filterByType, setFilterByType] = useState<string>('all')

  useEffect(() => {
    if (isOpen) {
      loadProjects()
    }
  }, [isOpen])

  useEffect(() => {
    // Filter and sort projects
    let filtered = projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesType = filterByType === 'all' || p.type === filterByType

      return matchesSearch && matchesType
    })

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
  }, [projects, searchQuery, sortBy, filterByType])

  const loadProjects = () => {
    const stored = localStorage.getItem('pawa_project_folders')
    if (stored) {
      setProjects(JSON.parse(stored))
    }
  }

  const saveProjects = (updatedProjects: ProjectFolder[]) => {
    localStorage.setItem('pawa_project_folders', JSON.stringify(updatedProjects))
    setProjects(updatedProjects)
  }

  const createProjectFolder = async (project: Omit<ProjectFolder, 'id' | 'created' | 'lastOpened' | 'files'>) => {
    try {
      // Create folder structure via API
      const response = await fetch('http://localhost:8000/project-folders/create-project-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: project.name,
          path: project.path,
          type: project.type,
          subfolders: project.subfolders || FOLDER_TEMPLATES[project.type].subfolders
        })
      })

      if (!response.ok) throw new Error('Failed to create folder structure')

      const newProject: ProjectFolder = {
        ...project,
        id: Date.now().toString(),
        created: Date.now(),
        lastOpened: Date.now(),
        files: 0
      }

      saveProjects([...projects, newProject])
      toast.success(`Project folder "${project.name}" created!`)
      setShowCreateDialog(false)
    } catch (error) {
      toast.error('Failed to create project folder')
      console.error(error)
    }
  }

  const deleteProject = (id: string) => {
    const project = projects.find(p => p.id === id)
    if (project && confirm(`Delete project "${project.name}"? This won't delete the actual folder.`)) {
      saveProjects(projects.filter(p => p.id !== id))
      toast.success('Project removed')
    }
  }

  const toggleFavorite = (id: string) => {
    saveProjects(projects.map(p =>
      p.id === id ? { ...p, favorite: !p.favorite } : p
    ))
  }

  const openProject = (project: ProjectFolder) => {
    // Update last opened
    saveProjects(projects.map(p =>
      p.id === project.id ? { ...p, lastOpened: Date.now() } : p
    ))
    onSelectProject(project)
    onClose()
  }

  const openProjectInFileExplorer = async (path: string) => {
    try {
      await fetch('http://localhost:8000/project-folders/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      })
      toast.success('Opening in file explorer...')
    } catch (error) {
      toast.error('Failed to open folder')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-purple-500/30 shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-7 h-7 text-purple-400" />
              Project Folders
            </h2>
            <p className="text-gray-400 text-sm mt-1">Organize all your projects - coding, writing, research, and more</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-800 space-y-4">
          {/* Search and Create */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 outline-none"
              />
            </div>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Project
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-400">Type:</span>
            <button
              onClick={() => setFilterByType('all')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filterByType === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {Object.entries(PROJECT_TYPES).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => setFilterByType(key)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  filterByType === key ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-400">Sort by:</span>
            <button
              onClick={() => setSortBy('recent')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                sortBy === 'recent' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                sortBy === 'name' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Name
            </button>
            <button
              onClick={() => setSortBy('created')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                sortBy === 'created' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Created
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-20">
              <FolderPlus className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No projects yet</p>
              <p className="text-gray-500 text-sm mt-2">Create your first project to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map(project => {
                const TypeIcon = PROJECT_TYPES[project.type].icon
                return (
                  <div
                    key={project.id}
                    className={`bg-gray-800/50 border rounded-xl p-4 hover:border-purple-500/50 transition-all cursor-pointer ${
                      currentProjectId === project.id ? 'border-purple-500' : 'border-gray-700'
                    }`}
                    onClick={() => openProject(project)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: project.color || PROJECT_TYPES[project.type].color + '20' }}
                        >
                          <TypeIcon
                            className="w-5 h-5"
                            style={{ color: project.color || PROJECT_TYPES[project.type].color }}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{project.name}</h3>
                          <span className="text-xs text-gray-400">{PROJECT_TYPES[project.type].label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(project.id)
                          }}
                          className="p-1 hover:bg-gray-700 rounded"
                        >
                          {project.favorite ? (
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          ) : (
                            <StarOff className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveMenu(activeMenu === project.id ? null : project.id)
                            }}
                            className="p-1 hover:bg-gray-700 rounded"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                          {activeMenu === project.id && (
                            <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 min-w-[150px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openProjectInFileExplorer(project.path)
                                  setActiveMenu(null)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                              >
                                <FolderOpen className="w-4 h-4" />
                                Open in Explorer
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingProject(project)
                                  setActiveMenu(null)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteProject(project.id)
                                  setActiveMenu(null)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{project.description}</p>
                    )}

                    {/* Path */}
                    <div className="text-xs text-gray-500 mb-2 truncate">
                      {project.path}
                    </div>

                    {/* Tags */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {project.tags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300"
                          >
                            {tag}
                          </span>
                        ))}
                        {project.tags.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-400">
                            +{project.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Subfolders */}
                    {project.subfolders && project.subfolders.length > 0 && (
                      <div className="text-xs text-gray-500">
                        <Folder className="w-3 h-3 inline mr-1" />
                        {project.subfolders.length} folders
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(project.lastOpened).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Create Dialog */}
        {showCreateDialog && (
          <CreateProjectDialog
            onClose={() => setShowCreateDialog(false)}
            onCreate={createProjectFolder}
          />
        )}

        {/* Edit Dialog */}
        {editingProject && (
          <EditProjectDialog
            project={editingProject}
            onClose={() => setEditingProject(null)}
            onSave={(updated) => {
              saveProjects(projects.map(p => p.id === updated.id ? updated : p))
              setEditingProject(null)
              toast.success('Project updated!')
            }}
          />
        )}
      </div>
    </div>
  )
}

// Create Project Dialog Component
function CreateProjectDialog({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (project: Omit<ProjectFolder, 'id' | 'created' | 'lastOpened' | 'files'>) => void
}) {
  const [name, setName] = useState('')
  const [path, setPath] = useState('')
  const [type, setType] = useState<ProjectFolder['type']>('other')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [tags, setTags] = useState('')
  const [customSubfolders, setCustomSubfolders] = useState('')
  const [useTemplate, setUseTemplate] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !path) {
      toast.error('Name and path are required')
      return
    }

    onCreate({
      name,
      path,
      type,
      description,
      color,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      favorite: false,
      subfolders: useTemplate
        ? FOLDER_TEMPLATES[type].subfolders
        : customSubfolders.split(',').map(s => s.trim()).filter(Boolean)
    })
  }

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">Create New Project Folder</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none"
              placeholder="My Awesome Project"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project Path *</label>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none"
              placeholder="C:\Users\YourName\Projects\MyProject"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Full path where the project folder will be created</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project Type</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(PROJECT_TYPES).map(([key, { icon: Icon, label, color }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key as ProjectFolder['type'])}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    type === key
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-6 h-6 mx-auto mb-1" style={{ color }} />
                  <div className="text-xs text-gray-300">{label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none"
              rows={3}
              placeholder="Optional project description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Color Theme</label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    color === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none"
              placeholder="frontend, react, typescript"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
              <input
                type="checkbox"
                checked={useTemplate}
                onChange={(e) => setUseTemplate(e.target.checked)}
                className="rounded"
              />
              Use template folder structure for {PROJECT_TYPES[type].label}
            </label>
            {useTemplate ? (
              <div className="text-xs text-gray-500 bg-gray-900 p-2 rounded">
                Will create: {FOLDER_TEMPLATES[type].subfolders.join(', ')}
              </div>
            ) : (
              <input
                type="text"
                value={customSubfolders}
                onChange={(e) => setCustomSubfolders(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none"
                placeholder="folder1, folder2, folder3"
              />
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Project Dialog Component
function EditProjectDialog({ project, onClose, onSave }: {
  project: ProjectFolder
  onClose: () => void
  onSave: (project: ProjectFolder) => void
}) {
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [color, setColor] = useState(project.color || PROJECT_COLORS[0])
  const [tags, setTags] = useState(project.tags?.join(', ') || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...project,
      name,
      description,
      color,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean)
    })
  }

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-white mb-4">Edit Project</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Color Theme</label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    color === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
