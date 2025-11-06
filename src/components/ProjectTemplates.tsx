import { useState, useEffect } from 'react'
import {
  Sparkles,
  FolderPlus,
  CheckCircle,
  XCircle,
  Loader2,
  Code,
  Zap,
  FileCode,
  X
} from 'lucide-react'

const API_URL = 'http://localhost:8000'

interface PredefinedTemplate {
  id: string
  name: string
  description: string
  tech_stack: string[]
}

interface ProjectTemplatesProps {
  onClose?: () => void
  onProjectCreated?: (projectPath: string) => void
}

export default function ProjectTemplates({ onClose, onProjectCreated }: ProjectTemplatesProps) {
  const [mode, setMode] = useState<'select' | 'custom' | 'predefined'>('select')
  const [predefinedTemplates, setPredefinedTemplates] = useState<PredefinedTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Custom template form
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [projectType, setProjectType] = useState('react')
  const [features, setFeatures] = useState<string[]>([])
  const [customRequirements, setCustomRequirements] = useState('')
  const [outputPath, setOutputPath] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadPredefinedTemplates()
  }, [])

  const loadPredefinedTemplates = async () => {
    try {
      const response = await fetch(`${API_URL}/templates/predefined`)
      const data = await response.json()
      setPredefinedTemplates(data.templates)
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const handleFeatureToggle = (feature: string) => {
    setFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    )
  }

  const generateCustomProject = async () => {
    if (!projectName || !outputPath) {
      setError('Project name and output path are required')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`${API_URL}/templates/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          description: description,
          project_type: projectType,
          features: features,
          output_path: outputPath,
          custom_requirements: customRequirements || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to generate project')
      }

      const data = await response.json()

      setSuccess(`Project created successfully with ${data.files_created.length} files!`)

      // Notify parent
      if (onProjectCreated) {
        onProjectCreated(data.project_path)
      }

      // Reset form after 2 seconds
      setTimeout(() => {
        if (onClose) onClose()
      }, 2000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate project')
    } finally {
      setIsLoading(false)
    }
  }

  const generateFromPredefined = async () => {
    if (!selectedTemplate || !projectName || !outputPath) {
      setError('Please select a template, provide a project name, and output path')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`${API_URL}/templates/predefined/${selectedTemplate}?project_name=${encodeURIComponent(projectName)}&output_path=${encodeURIComponent(outputPath)}`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create project')
      }

      const data = await response.json()

      setSuccess(`Project created successfully with ${data.files_created.length} files!`)

      // Notify parent
      if (onProjectCreated) {
        onProjectCreated(data.project_path)
      }

      // Reset form after 2 seconds
      setTimeout(() => {
        if (onClose) onClose()
      }, 2000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  const availableFeatures = [
    'Authentication',
    'Database Integration',
    'API Routes',
    'Testing Setup',
    'Docker Support',
    'CI/CD Pipeline',
    'Error Handling',
    'Logging',
    'Environment Variables',
    'TypeScript',
    'State Management',
    'Routing'
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto border border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Smart Project Templates</h2>
              <p className="text-sm text-gray-400">Generate production-ready projects with AI</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Mode Selection */}
          {mode === 'select' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Choose Template Type</h3>

              <button
                onClick={() => setMode('predefined')}
                className="w-full p-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg text-left transition-all group"
              >
                <div className="flex items-start gap-4">
                  <Zap className="w-8 h-8 text-white flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-1">Predefined Templates</h4>
                    <p className="text-blue-100 text-sm">
                      Choose from popular frameworks and stacks. One-click setup with best practices built-in.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode('custom')}
                className="w-full p-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg text-left transition-all group"
              >
                <div className="flex items-start gap-4">
                  <Sparkles className="w-8 h-8 text-white flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-1">AI-Generated Custom Project</h4>
                    <p className="text-purple-100 text-sm">
                      Describe your project requirements and let AI generate a complete project structure tailored to your needs.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Predefined Templates */}
          {mode === 'predefined' && (
            <div className="space-y-6">
              <button
                onClick={() => setMode('select')}
                className="text-sm text-gray-400 hover:text-white mb-4"
              >
                ← Back to selection
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {predefinedTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedTemplate === template.id
                        ? 'border-purple-500 bg-purple-900/20'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <FileCode className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">{template.name}</h4>
                        <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {template.tech_stack.map((tech) => (
                            <span
                              key={tech}
                              className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedTemplate && (
                <div className="space-y-4 mt-6 p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="font-semibold text-white">Project Details</h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="my-awesome-project"
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Output Path
                    </label>
                    <input
                      type="text"
                      value={outputPath}
                      onChange={(e) => setOutputPath(e.target.value)}
                      placeholder="C:/Users/YourName/projects/my-awesome-project"
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <button
                    onClick={generateFromPredefined}
                    disabled={isLoading || !projectName || !outputPath}
                    className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Project...
                      </>
                    ) : (
                      <>
                        <FolderPlus className="w-5 h-5" />
                        Create Project
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Custom AI Generation */}
          {mode === 'custom' && (
            <div className="space-y-6">
              <button
                onClick={() => setMode('select')}
                className="text-sm text-gray-400 hover:text-white mb-4"
              >
                ← Back to selection
              </button>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="my-awesome-app"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A web application for managing tasks with real-time collaboration"
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Type *
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="react">React</option>
                    <option value="vue">Vue</option>
                    <option value="nextjs">Next.js</option>
                    <option value="nodejs">Node.js</option>
                    <option value="python">Python</option>
                    <option value="fastapi">FastAPI</option>
                    <option value="django">Django</option>
                    <option value="flask">Flask</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Features
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableFeatures.map((feature) => (
                      <button
                        key={feature}
                        onClick={() => handleFeatureToggle(feature)}
                        className={`px-3 py-2 rounded-lg text-sm transition-all ${
                          features.includes(feature)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {feature}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Custom Requirements (Optional)
                  </label>
                  <textarea
                    value={customRequirements}
                    onChange={(e) => setCustomRequirements(e.target.value)}
                    placeholder="Include user authentication with OAuth, integrate Stripe for payments, use PostgreSQL database..."
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Output Path *
                  </label>
                  <input
                    type="text"
                    value={outputPath}
                    onChange={(e) => setOutputPath(e.target.value)}
                    placeholder="C:/Users/YourName/projects/my-awesome-app"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <button
                  onClick={generateCustomProject}
                  disabled={isLoading || !projectName || !description || !outputPath}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      AI is generating your project...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Project with AI
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-900/20 border border-green-500/50 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-300">{success}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
