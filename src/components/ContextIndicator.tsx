import { useState, useEffect } from 'react'
import { FolderOpen, MessageSquare, FileCode, Brain, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

const API_URL = 'http://localhost:8000'

interface ContextIndicatorProps {
  projectPath?: string
  conversationId?: string
  currentModel?: string
  filesInContext?: string[]
}

interface ProjectContext {
  indexed: boolean
  total_files: number
  total_symbols: number
  symbol_breakdown: Record<string, number>
}

interface ConversationInfo {
  conversation_id: string
  title: string
  message_count: number
  updated_at: string
}

export default function ContextIndicator({
  projectPath,
  conversationId,
  currentModel = 'llama-3.3-70b-versatile',
  filesInContext = []
}: ContextIndicatorProps) {
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(null)
  const [conversationInfo, setConversationInfo] = useState<ConversationInfo | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (projectPath) {
      loadProjectContext()
    }
  }, [projectPath])

  useEffect(() => {
    if (conversationId) {
      loadConversationInfo()
    }
  }, [conversationId])

  const loadProjectContext = async () => {
    if (!projectPath) return

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/codebase/project-context?project_path=${encodeURIComponent(projectPath)}`)
      if (response.ok) {
        const data = await response.json()
        setProjectContext({
          indexed: data.indexed,
          total_files: data.statistics.total_files,
          total_symbols: data.statistics.total_symbols,
          symbol_breakdown: data.statistics.symbol_breakdown
        })
      }
    } catch (error) {
      console.error('Failed to load project context:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadConversationInfo = async () => {
    if (!conversationId) return

    try {
      const response = await fetch(`${API_URL}/memory/conversations/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setConversationInfo({
          conversation_id: data.conversation_id,
          title: data.title,
          message_count: data.messages.length,
          updated_at: data.updated_at
        })
      }
    } catch (error) {
      console.error('Failed to load conversation info:', error)
    }
  }

  const getModelDisplayName = (modelId: string) => {
    const modelNames: Record<string, string> = {
      'llama-3.3-70b-versatile': 'Llama 3.3',
      'mixtral-8x7b-32768': 'Mixtral',
      'llama-3.1-8b-instant': 'Llama 3.1',
      'gpt-4-turbo-preview': 'GPT-4 Turbo',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'claude-3-opus-20240229': 'Claude 3 Opus',
      'claude-3-sonnet-20240229': 'Claude 3 Sonnet'
    }
    return modelNames[modelId] || 'AI Model'
  }

  const getProjectName = () => {
    if (!projectPath) return 'No Project'
    const parts = projectPath.replace(/\\/g, '/').split('/')
    return parts[parts.length - 1] || parts[parts.length - 2] || 'Unknown'
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      {/* Compact Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-4 text-sm">
          {/* Project Status */}
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-blue-400" />
            <span className="text-gray-300 font-medium">{getProjectName()}</span>
            {projectContext?.indexed ? (
              <CheckCircle className="w-3 h-3 text-green-400" />
            ) : (
              <AlertCircle className="w-3 h-3 text-yellow-400" />
            )}
          </div>

          {/* Files in Context */}
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-purple-400" />
            <span className="text-gray-400">{filesInContext.length} files</span>
          </div>

          {/* Conversation */}
          {conversationInfo && (
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-green-400" />
              <span className="text-gray-400">{conversationInfo.message_count} messages</span>
            </div>
          )}

          {/* Model */}
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-pink-400" />
            <span className="text-gray-400">{getModelDisplayName(currentModel)}</span>
          </div>
        </div>

        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 py-3 border-t border-gray-800 space-y-4">
          {/* Project Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Project Context</h4>
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : projectContext ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/50 rounded p-3">
                  <div className="text-xs text-gray-400 mb-1">Status</div>
                  <div className="flex items-center gap-2">
                    {projectContext.indexed ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-300 font-medium">Indexed</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-yellow-300 font-medium">Not Indexed</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded p-3">
                  <div className="text-xs text-gray-400 mb-1">Files</div>
                  <div className="text-lg font-bold text-blue-400">{projectContext.total_files}</div>
                </div>

                <div className="bg-gray-800/50 rounded p-3">
                  <div className="text-xs text-gray-400 mb-1">Symbols</div>
                  <div className="text-lg font-bold text-purple-400">{projectContext.total_symbols}</div>
                </div>

                <div className="bg-gray-800/50 rounded p-3">
                  <div className="text-xs text-gray-400 mb-1">Functions</div>
                  <div className="text-lg font-bold text-green-400">
                    {projectContext.symbol_breakdown.function || 0}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                {projectPath ? 'Project not indexed' : 'No project selected'}
              </div>
            )}

            {projectPath && (
              <div className="text-xs text-gray-500 font-mono bg-gray-800/30 rounded px-2 py-1 overflow-x-auto">
                {projectPath}
              </div>
            )}
          </div>

          {/* Files in Context */}
          {filesInContext.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Files in Context ({filesInContext.length})
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {filesInContext.map((file, index) => (
                  <div
                    key={index}
                    className="text-xs font-mono bg-gray-800/30 rounded px-2 py-1 text-gray-300 flex items-center gap-2"
                  >
                    <FileCode className="w-3 h-3 text-blue-400 flex-shrink-0" />
                    <span className="truncate">{file}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversation Details */}
          {conversationInfo && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Conversation</h4>
              <div className="bg-gray-800/50 rounded p-3 space-y-2">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Title</div>
                  <div className="text-sm text-white font-medium">{conversationInfo.title}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Messages</div>
                    <div className="text-sm text-green-400 font-medium">{conversationInfo.message_count}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Last Updated</div>
                    <div className="text-sm text-gray-300">
                      {new Date(conversationInfo.updated_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Model Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">AI Model</h4>
            <div className="bg-gray-800/50 rounded p-3">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-pink-400" />
                <div>
                  <div className="text-sm text-white font-medium">{getModelDisplayName(currentModel)}</div>
                  <div className="text-xs text-gray-400 font-mono">{currentModel}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            {!projectContext?.indexed && projectPath && (
              <button
                onClick={loadProjectContext}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
              >
                Refresh Context
              </button>
            )}
            <button
              onClick={() => setIsExpanded(false)}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded transition-colors"
            >
              Collapse
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
