import { useRef } from 'react'
import Editor from '@monaco-editor/react'
import {
  Save, X, Sparkles, Loader2, Code, Bot, PanelRightClose, PanelRightOpen
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useCodeStore } from '../store/codeStore'
import { useState } from 'react'
import AICodeChat from './AICodeChat'

const API_URL = 'http://localhost:8001'

export default function CodeEditor() {
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
  const editorRef = useRef<any>(null)

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

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()
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

  const getFileType = (path: string): 'code' | 'image' | 'pdf' | 'unknown' => {
    const ext = path.split('.').pop()?.toLowerCase()
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico']
    const pdfExts = ['pdf']

    if (imageExts.includes(ext || '')) return 'image'
    if (pdfExts.includes(ext || '')) return 'pdf'
    return 'code'
  }

  const handleCloseFile = (path: string) => {
    closeFile(path)
    if (currentFile === path) {
      const remainingFiles = Array.from(openFiles.keys()).filter(p => p !== path)
      setCurrentFile(remainingFiles.length > 0 ? remainingFiles[0] : null)
    }
  }

  const handleAIFileChange = async (filePath: string) => {
    // Reload the file content from the server
    try {
      const response = await fetch(`${API_URL}/files/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      })
      const data = await response.json()
      if (data.success) {
        updateFileContent(filePath, data.content)
        toast.success(`File updated by AI: ${filePath.split('/').pop()}`)
      }
    } catch (error) {
      console.error('Failed to reload file:', error)
    }
  }

  return (
    <div className="flex h-full bg-gray-900 text-white">
      {/* Main Editor Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Tab Bar with AI Chat Toggle */}
        <div className="flex items-center bg-gray-800/50 border-b border-gray-700/50 overflow-x-auto">
          <div className="flex items-center flex-1 px-2 py-1 overflow-x-auto">
        {Array.from(openFiles.keys()).map(path => (
          <div
            key={path}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t cursor-pointer flex-shrink-0 transition-all ${
              currentFile === path
                ? 'bg-gray-900 border-t-2 border-t-blue-500'
                : 'hover:bg-gray-700/50'
            }`}
            onClick={() => setCurrentFile(path)}
          >
            <span className="text-sm">{path.split('/').pop()}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCloseFile(path)
              }}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {openFiles.size === 0 && (
          <div className="px-4 py-2 text-sm text-gray-500">
            No files open - select a file from the sidebar
          </div>
        )}
          </div>
          {/* AI Chat Toggle Button */}
          <button
            onClick={() => setShowAIChat(!showAIChat)}
            className={`px-4 py-2 border-l border-gray-700 hover:bg-gray-700/50 transition-colors flex items-center gap-2 ${
              showAIChat ? 'bg-purple-900/30 text-purple-400' : 'text-gray-400'
            }`}
            title="Toggle AI Code Agent"
          >
            {showAIChat ? <PanelRightClose className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            <span className="text-sm font-medium">{showAIChat ? 'Hide' : 'AI Agent'}</span>
          </button>
        </div>

      {/* Editor */}
      {currentFile ? (
        <div className="flex-1 flex flex-col">
          {/* AI Assistant Bar - Only show for code files */}
          {getFileType(currentFile) === 'code' && (
            <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b border-purple-500/30 p-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <input
                type="text"
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiEdit()}
                placeholder="Ask AI to edit this file... (e.g., 'Add error handling', 'Refactor this function')"
                disabled={isAiProcessing}
                className="flex-1 bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 disabled:opacity-50 transition-all placeholder-gray-500"
              />
              <button
                onClick={handleAiEdit}
                disabled={isAiProcessing || !aiInstruction.trim()}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
              >
                {isAiProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Apply AI Edit'
                )}
              </button>
            </div>
          )}

          {/* Content Area - Code/Image/PDF */}
          {getFileType(currentFile) === 'image' ? (
            <div className="flex-1 flex items-center justify-center bg-gray-900 p-8 overflow-auto">
              <img
                src={`http://localhost:8001/files/serve?path=${encodeURIComponent(currentFile)}`}
                alt={currentFile.split('/').pop()}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  // Fallback: try to display using file:// protocol for local files
                  const img = e.target as HTMLImageElement
                  img.src = `file:///${currentFile.replace(/\\/g, '/')}`
                }}
              />
            </div>
          ) : getFileType(currentFile) === 'pdf' ? (
            <div className="flex-1 bg-gray-900 overflow-auto">
              <iframe
                src={`http://localhost:8001/files/serve?path=${encodeURIComponent(currentFile)}`}
                className="w-full h-full border-0"
                title={currentFile.split('/').pop()}
              />
            </div>
          ) : (
            /* Monaco Editor for code files */
            <Editor
              height="100%"
              defaultLanguage={getLanguageFromPath(currentFile)}
              language={getLanguageFromPath(currentFile)}
              value={openFiles.get(currentFile) || ''}
              onChange={handleEditorChange}
              onMount={(editor) => {
                editorRef.current = editor
              }}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: true },
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                readOnly: false,
                automaticLayout: true,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', monospace",
                fontLigatures: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
              }}
            />
          )}

          {/* Bottom Status Bar */}
          <div className="bg-gray-800/50 border-t border-gray-700/50 px-4 py-2 flex items-center justify-between">
            <div className="text-sm text-gray-400 flex items-center gap-4">
              <span className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                {currentFile}
              </span>
              <span className="text-gray-600">•</span>
              <span className="capitalize">
                {getFileType(currentFile) === 'code'
                  ? getLanguageFromPath(currentFile)
                  : getFileType(currentFile)}
              </span>
            </div>
            {getFileType(currentFile) === 'code' && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg transition-all text-sm font-medium shadow-lg shadow-blue-500/20"
              >
                <Save className="w-4 h-4" />
                Save (Ctrl+S)
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Code className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No file selected</p>
            <p className="text-sm mt-2">Open a file from the sidebar to start editing</p>
          </div>
        </div>
      )}
      </div>

      {/* AI Code Chat Panel */}
      {showAIChat && currentProject && (
        <div className="w-[400px] border-l border-gray-800 flex-shrink-0">
          <AICodeChat
            projectPath={currentProject}
            onFileChange={handleAIFileChange}
            onFileTreeRefresh={refreshFileTree}
          />
        </div>
      )}
    </div>
  )
}
