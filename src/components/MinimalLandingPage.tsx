import { ArrowRight, Sparkles } from 'lucide-react'
import PawaIcon from './PawaIcon'

interface MinimalLandingPageProps {
  onStartChat: () => void
}

export default function MinimalLandingPage({ onStartChat }: MinimalLandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <PawaIcon size={36} />
          <span className="text-xl font-bold text-white">Pawa AI</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Hero Section */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Powered by Advanced AI</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold text-white leading-tight">
              Your AI-powered
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                coding assistant
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto">
              Build faster, code smarter. Get instant help with your projects, from idea to deployment.
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <button
              onClick={onStartChat}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
            >
              Start coding with AI
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Simple Stats */}
          <div className="pt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-white">100K+</div>
              <div className="text-sm text-gray-400">Lines of code generated</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-sm text-gray-400">Available</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-white">10x</div>
              <div className="text-sm text-gray-400">Faster development</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-gray-500 text-sm">
        <p>© 2025 Pawa AI. Built with intelligence.</p>
      </footer>
    </div>
  )
}
