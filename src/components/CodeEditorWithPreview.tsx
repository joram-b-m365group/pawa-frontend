import { useRef, useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import {
  Save, Play, X, Sparkles, Loader2, Code, Bot,
  PanelRightClose, PanelRightOpen, Eye, Terminal as TerminalIcon,
  RefreshCw, ExternalLink, Maximize2, Minimize2, Settings
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useCodeStore } from '../store/codeStore'
import AICodeChat from './AICodeChat'
import ArtifactViewer from './ArtifactViewer'

const API_URL = 'http://localhost:8001'

export default function CodeEditorWithPreview() {
  const {
    openFiles,
    currentFile,
    currentProject,
    setCurrentFile,
    updateFileContent,
    closeFile,
    refreshFileTree,
  } = useCodeStore()

  const [aiInstruction, setAiInstruction] = useState('')
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [showTerminal, setShowTerminal] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [terminalOutput, setTerminalOutput] = useState<string[]>([])
  const [previewUrl, setPreviewUrl] = useState('http://localhost:3001')
  const [previewMode, setPreviewMode] = useState<'iframe' | 'artifact'>('iframe')
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false)

  const editorRef = useRef<any>(null)
  const terminalEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [terminalOutput])

  const handleEditorChange = (value: string | undefined) => {
    if (currentFile && value !== undefined) {
      updateFileContent(currentFile, value)
    }
  }

  const handleSave = async () => {
    if (!currentFile) return

    const content = openFiles.get(currentFile) || ''
    try {
      const response = await fetch(`${API_URL}/files/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: currentFile, content })
      })
      const data = await response.json()

      if (data.success) {
        toast.success('File saved!')
      }
    } catch (error) {
      console.error('Failed to save file:', error)
      toast.error('Failed to save file')
    }
  }

  const handleRun = async () => {
    if (!currentFile) {
      toast.error('No file selected')
      return
    }

    const fileExt = currentFile.split('.').pop()?.toLowerCase()

    setIsRunning(true)
    setShowTerminal(true)
    setTerminalOutput([`> Running ${currentFile}...`, ''])

    try {
      // Determine how to run based on file type
      let command = ''

      if (fileExt === 'js' || fileExt === 'jsx') {
        command = `node "${currentFile}"`
      } else if (fileExt === 'ts' || fileExt === 'tsx') {
        command = `ts-node "${currentFile}"`
      } else if (fileExt === 'py') {
        command = `python "${currentFile}"`
      } else if (fileExt === 'html') {
        // For HTML, open in preview
        setPreviewMode('iframe')
        setShowPreview(true)
        toast.success('Opening in preview...')
        setIsRunning(false)
        return
      } else if (fileExt === 'jsx' || fileExt === 'tsx') {
        // For React files, show in artifact viewer
        setPreviewMode('artifact')
        setShowPreview(true)
        toast.success('Rendering React component...')
        setIsRunning(false)
        return
      } else {
        toast.error(`Don't know how to run .${fileExt} files`)
        setIsRunning(false)
        return
      }

      // Run the command via backend
      const response = await fetch(`${API_URL}/terminal/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          cwd: currentProject || undefined
        })
      })

      const data = await response.json()

      if (data.output) {
        setTerminalOutput(prev => [...prev, data.output])
      }

      if (data.error) {
        setTerminalOutput(prev => [...prev, `❌ Error: ${data.error}`])
        toast.error('Execution failed')
      } else {
        toast.success('Execution completed')
      }

    } catch (error: any) {
      setTerminalOutput(prev => [...prev, `❌ Error: ${error.message}`])
      toast.error('Failed to run file')
    } finally {
      setIsRunning(false)
    }
  }

  const handleAiEdit = async () => {
    if (!currentFile || !aiInstruction.trim()) {
      toast.error('Please enter an instruction')
      return
    }

    setIsAiProcessing(true)
    try {
      const response = await fetch(`${API_URL}/ai/edit-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_path: currentFile,
          instruction: aiInstruction
        })
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Code edited by AI!')
        updateFileContent(currentFile, data.new_code)
        setAiInstruction('')
        if (editorRef.current) {
          editorRef.current.setValue(data.new_code)
        }
      }
    } catch (error) {
      console.error('AI edit failed:', error)
      toast.error('AI edit failed')
    } finally {
      setIsAiProcessing(false)
    }
  }

  const getLanguage = () => {
    if (!currentFile) return 'javascript'
    const ext = currentFile.split('.').pop()?.toLowerCase()
    const langMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown'
    }
    return langMap[ext || ''] || 'plaintext'
  }

  const currentContent = currentFile ? openFiles.get(currentFile) || '' : ''

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Top Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto">
          {Array.from(openFiles.keys()).map((filePath) => {
            const fileName = filePath.split(/[/\\]/).pop() || filePath
            return (
              <button
                key={filePath}
                onClick={() => setCurrentFile(filePath)}
                className={`group relative px-4 py-2 rounded-t transition-all ${
                  currentFile === filePath
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600'
                }`}
              >
                <span className="text-sm">{fileName}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    closeFile(filePath)
                  }}
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* Run Button */}
          <button
            onClick={handleRun}
            disabled={!currentFile || isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Run code (Ctrl+Enter)"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!currentFile}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all disabled:opacity-50"
            title="Save (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
            Save
          </button>

          {/* Preview Toggle */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`p-2 rounded-lg transition-all ${
              showPreview
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:text-white'
            }`}
            title="Toggle preview"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Terminal Toggle */}
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className={`p-2 rounded-lg transition-all ${
              showTerminal
                ? 'bg-orange-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:text-white'
            }`}
            title="Toggle terminal"
          >
            <TerminalIcon className="w-4 h-4" />
          </button>

          {/* AI Chat Toggle */}
          <button
            onClick={() => setShowAIChat(!showAIChat)}
            className={`p-2 rounded-lg transition-all ${
              showAIChat
                ? 'bg-pink-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:text-white'
            }`}
            title="AI Assistant"
          >
            <Bot className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} flex flex-col border-r border-gray-700`}>
          {/* Editor Area */}
          <div className="flex-1">
            {currentFile ? (
              <Editor
                height="100%"
                language={getLanguage()}
                value={currentContent}
                onChange={handleEditorChange}
                onMount={(editor) => { editorRef.current = editor }}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Code className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No file open</p>
                  <p className="text-sm mt-2">Select a file from the sidebar to start coding</p>
                </div>
              </div>
            )}
          </div>

          {/* Terminal */}
          {showTerminal && (
            <div className="h-64 border-t border-gray-700 bg-black">
              <div className="h-full flex flex-col">
                <div className="bg-gray-900 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                  <span className="text-sm text-gray-400">Terminal</span>
                  <button
                    onClick={() => setTerminalOutput([])}
                    className="text-xs text-gray-500 hover:text-white"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 font-mono text-sm text-green-400">
                  {terminalOutput.map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className={`${isPreviewMaximized ? 'fixed inset-0 z-50' : 'w-1/2'} flex flex-col bg-gray-950`}>
            {/* Preview Header */}
            <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white">Live Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMode(previewMode === 'iframe' ? 'artifact' : 'iframe')}
                  className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
                >
                  {previewMode === 'iframe' ? 'Artifact' : 'iFrame'}
                </button>
                <button
                  onClick={() => window.open(previewUrl, '_blank')}
                  className="p-1 text-gray-400 hover:text-white"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPreviewMaximized(!isPreviewMaximized)}
                  className="p-1 text-gray-400 hover:text-white"
                  title="Maximize"
                >
                  {isPreviewMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-1 text-gray-400 hover:text-white"
                  title="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-hidden">
              {previewMode === 'artifact' ? (
                <ArtifactViewer
                  code={currentContent}
                  type={getLanguage() === 'typescript' ? 'react' : 'html'}
                  title={currentFile?.split(/[/\\]/).pop() || 'Preview'}
                />
              ) : (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0 bg-white"
                  title="Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              )}
            </div>
          </div>
        )}

        {/* AI Chat Panel */}
        {showAIChat && (
          <div className="w-96 border-l border-gray-700 bg-gray-900">
            <AICodeChat filePath={currentFile || ''} />
          </div>
        )}
      </div>
    </div>
  )
}
