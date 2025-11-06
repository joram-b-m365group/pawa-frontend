import { useState, useEffect } from 'react'
import { Sparkles, Zap, DollarSign, Clock, CheckCircle, X, Info } from 'lucide-react'

const API_URL = 'http://localhost:8000'

interface ModelInfo {
  provider: string
  model_id: string
  display_name: string
  description: string
  context_window: number
  cost_per_1k_tokens: {
    input: number
    output: number
  }
  features: string[]
  available: boolean
}

interface ModelSelectorProps {
  onModelSelect: (provider: string, modelId: string) => void
  currentModel?: { provider: string; model_id: string }
  onClose?: () => void
}

export default function ModelSelector({ onModelSelect, currentModel, onClose }: ModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<string>('groq')
  const [providerStatus, setProviderStatus] = useState<any>(null)

  useEffect(() => {
    loadModels()
    loadProviderStatus()
  }, [])

  const loadModels = async () => {
    try {
      const response = await fetch(`${API_URL}/ai-models/list`)
      const data = await response.json()
      setModels(data)
    } catch (error) {
      console.error('Failed to load models:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadProviderStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/ai-models/status`)
      const data = await response.json()
      setProviderStatus(data)
    } catch (error) {
      console.error('Failed to load provider status:', error)
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'groq':
        return '⚡'
      case 'openai':
        return '🤖'
      case 'anthropic':
        return '🧠'
      default:
        return '🔮'
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'groq':
        return 'from-orange-600 to-orange-700'
      case 'openai':
        return 'from-green-600 to-green-700'
      case 'anthropic':
        return 'from-purple-600 to-purple-700'
      default:
        return 'from-gray-600 to-gray-700'
    }
  }

  const formatCost = (cost: number) => {
    if (cost < 0.001) return '<$0.001'
    return `$${cost.toFixed(4)}`
  }

  const formatContextWindow = (tokens: number) => {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}k`
    }
    return tokens.toString()
  }

  const providers = [...new Set(models.map(m => m.provider))]
  const filteredModels = models.filter(m => m.provider === selectedProvider)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-auto border border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">AI Model Selection</h2>
              <p className="text-sm text-gray-400">Choose the best model for your task</p>
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

        {/* Provider Status Banner */}
        {providerStatus && (
          <div className="px-6 py-3 bg-gray-800/30 border-b border-gray-800">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-gray-400">Providers:</span>
              <div className="flex gap-3">
                <div className={`flex items-center gap-1 ${providerStatus.groq.available ? 'text-green-400' : 'text-gray-500'}`}>
                  {providerStatus.groq.available ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  Groq ({providerStatus.groq.models_count} models)
                </div>
                <div className={`flex items-center gap-1 ${providerStatus.openai.available ? 'text-green-400' : 'text-gray-500'}`}>
                  {providerStatus.openai.available ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  OpenAI ({providerStatus.openai.models_count} models)
                </div>
                <div className={`flex items-center gap-1 ${providerStatus.anthropic.available ? 'text-green-400' : 'text-gray-500'}`}>
                  {providerStatus.anthropic.available ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  Anthropic ({providerStatus.anthropic.models_count} models)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Provider Tabs */}
          <div className="flex gap-2 mb-6">
            {providers.map((provider) => (
              <button
                key={provider}
                onClick={() => setSelectedProvider(provider)}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                  selectedProvider === provider
                    ? `bg-gradient-to-r ${getProviderColor(provider)} text-white shadow-lg`
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">{getProviderIcon(provider)}</span>
                  <span className="capitalize">{provider}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Models Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-700 border-t-purple-500" />
              <p className="text-gray-400 mt-3">Loading models...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredModels.map((model) => {
                const isSelected = currentModel?.provider === model.provider && currentModel?.model_id === model.model_id
                const isAvailable = model.available

                return (
                  <button
                    key={`${model.provider}-${model.model_id}`}
                    onClick={() => {
                      if (isAvailable) {
                        onModelSelect(model.provider, model.model_id)
                        if (onClose) onClose()
                      }
                    }}
                    disabled={!isAvailable}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-900/20 ring-2 ring-purple-500/50'
                        : isAvailable
                        ? 'border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-750'
                        : 'border-gray-800 bg-gray-900 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {/* Model Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white text-sm">{model.display_name}</h3>
                          {isSelected && (
                            <CheckCircle className="w-4 h-4 text-purple-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2">{model.description}</p>
                      </div>
                    </div>

                    {/* Model Stats */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-xs">
                        <Zap className="w-3 h-3 text-blue-400" />
                        <span className="text-gray-400">Context:</span>
                        <span className="text-white font-medium">{formatContextWindow(model.context_window)} tokens</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <DollarSign className="w-3 h-3 text-green-400" />
                        <span className="text-gray-400">Cost:</span>
                        <span className="text-white font-medium">
                          {formatCost(model.cost_per_1k_tokens.input)} / {formatCost(model.cost_per_1k_tokens.output)} per 1k
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1">
                      {model.features.slice(0, 3).map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded text-[10px]"
                        >
                          {feature}
                        </span>
                      ))}
                      {model.features.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-700/50 text-gray-400 rounded text-[10px]">
                          +{model.features.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Availability Badge */}
                    {!isAvailable && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="flex items-center gap-1 text-xs text-yellow-400">
                          <Info className="w-3 h-3" />
                          <span>API key required</span>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Info Banner */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="text-blue-300 mb-2">
                  <strong>Model Selection Tips:</strong>
                </p>
                <ul className="space-y-1 text-xs text-blue-200">
                  <li>• <strong>Groq (Llama)</strong> - Best for speed and cost-effectiveness, great for most tasks</li>
                  <li>• <strong>OpenAI (GPT-4)</strong> - Best for complex reasoning and high-quality outputs</li>
                  <li>• <strong>Anthropic (Claude)</strong> - Best for very long contexts and nuanced understanding</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
