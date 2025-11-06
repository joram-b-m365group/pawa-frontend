import { useState, useEffect } from 'react'
import { FolderOpen, Sparkles, CheckCircle, Loader2, AlertCircle, Zap, Brain, Code } from 'lucide-react'

const API_URL = 'http://localhost:8000'

interface ProjectSetupWizardProps {
  onComplete: (projectPath: string) => void
  onSkip?: () => void
}

export default function ProjectSetupWizard({ onComplete, onSkip }: ProjectSetupWizardProps) {
  const [step, setStep] = useState(1)
  const [projectPath, setProjectPath] = useState('')
  const [projectName, setProjectName] = useState('')
  const [isIndexing, setIsIndexing] = useState(false)
  const [indexProgress, setIndexProgress] = useState(0)
  const [indexStatus, setIndexStatus] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [indexResult, setIndexResult] = useState<any>(null)

  // Auto-detect project name from path
  useEffect(() => {
    if (projectPath) {
      const parts = projectPath.replace(/\\/g, '/').split('/')
      const name = parts[parts.length - 1] || parts[parts.length - 2]
      setProjectName(name)
    }
  }, [projectPath])

  const handleBrowseFolder = async () => {
    // In a real app, use Electron or File System Access API
    // For web, we'll use a prompt
    const path = prompt('Enter your project path:\n\nExample:\nC:/Users/YourName/projects/my-app\n/home/user/projects/my-app')
    if (path) {
      setProjectPath(path)
      setError(null)
    }
  }

  const handleIndexCodebase = async () => {
    if (!projectPath) {
      setError('Please select a project folder first')
      return
    }

    setIsIndexing(true)
    setError(null)
    setIndexProgress(0)
    setIndexStatus('Starting codebase indexing...')

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setIndexProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const response = await fetch(`${API_URL}/codebase/index`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_path: projectPath,
          file_patterns: ['*.py', '*.js', '*.ts', '*.tsx', '*.jsx', '*.java', '*.cpp', '*.go'],
          exclude_patterns: ['node_modules/**', 'venv/**', '*.min.js', 'dist/**', 'build/**', '__pycache__/**']
        })
      })

      clearInterval(progressInterval)
      setIndexProgress(100)

      if (!response.ok) {
        throw new Error(`Failed to index codebase: ${response.status}`)
      }

      const data = await response.json()
      setIndexResult(data)
      setIndexStatus(`Indexed ${data.files_indexed} files with ${data.total_symbols} symbols`)

      // Move to next step
      setTimeout(() => {
        setStep(3)
      }, 1500)

    } catch (error) {
      console.error('Error indexing codebase:', error)
      setError(error instanceof Error ? error.message : 'Failed to index codebase')
      setIndexProgress(0)
    } finally {
      setIsIndexing(false)
    }
  }

  const handleComplete = () => {
    if (projectPath) {
      // Save to localStorage for future sessions
      localStorage.setItem('lastProjectPath', projectPath)
      localStorage.setItem('lastProjectName', projectName)
      onComplete(projectPath)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-800 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-800">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Step 1: Welcome & Project Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to Pawa AI</h2>
                <p className="text-gray-400">Let's set up your intelligent coding assistant</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-300 mb-2 block">
                    Select Your Project Folder
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={projectPath}
                      onChange={(e) => setProjectPath(e.target.value)}
                      placeholder="C:/Users/YourName/projects/my-app"
                      className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={handleBrowseFolder}
                      className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <FolderOpen className="w-5 h-5" />
                      Browse
                    </button>
                  </div>
                </label>

                {projectName && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Project: {projectName}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Skip for now
                  </button>
                )}
                <button
                  onClick={() => projectPath && setStep(2)}
                  disabled={!projectPath}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Indexing */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Index Your Codebase</h2>
                <p className="text-gray-400">This enables semantic search and intelligent code understanding</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Project: {projectName}</span>
                  <span className="text-gray-400">Path: {projectPath}</span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <Code className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-xs text-gray-400">Code Analysis</div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <Zap className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-xs text-gray-400">Fast Search</div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <Brain className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                    <div className="text-xs text-gray-400">AI Understanding</div>
                  </div>
                </div>

                {isIndexing && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{indexStatus}</span>
                      <span className="text-purple-400">{indexProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                        style={{ width: `${indexProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {indexResult && (
                  <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-green-300">
                        <p className="font-semibold mb-1">Indexing Complete!</p>
                        <p className="text-green-400">{indexResult.message}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  disabled={isIndexing}
                  className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleIndexCodebase}
                  disabled={isIndexing}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {isIndexing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Indexing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      Start Indexing
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">All Set!</h2>
                <p className="text-gray-400">Your AI coding assistant is ready to help</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 mb-1">Project</div>
                    <div className="text-white font-medium">{projectName}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Files Indexed</div>
                    <div className="text-white font-medium">{indexResult?.files_indexed || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Symbols Found</div>
                    <div className="text-white font-medium">{indexResult?.total_symbols || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Status</div>
                    <div className="text-green-400 font-medium flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Ready
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  <strong>Pro Tips:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Ask me to help with your code using natural language</li>
                    <li>I can read, write, and edit files automatically</li>
                    <li>Use voice coding by clicking the mic icon</li>
                    <li>Press Cmd/Ctrl+K for quick commands</li>
                  </ul>
                </p>
              </div>

              <button
                onClick={handleComplete}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all"
              >
                Start Coding with AI
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-800/30 border-t border-gray-800 text-center text-xs text-gray-500">
          Step {step} of 3 • You can change these settings later
        </div>
      </div>
    </div>
  )
}
