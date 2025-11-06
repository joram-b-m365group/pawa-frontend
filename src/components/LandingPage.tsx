import { useState, useRef, useEffect } from 'react'
import {
  Zap, Image as ImageIcon, Mic, Code, FileText,
  Share2, Download, Cpu, Globe, Lock, TrendingUp, ArrowRight,
  Play, Pause, Upload, X, Check, Brain, Rocket, Star, LogIn, UserPlus, User
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import AuthModal from './AuthModal'
import PawaIcon from './PawaIcon'

interface LandingPageProps {
  onStartChat: () => void
}

export default function LandingPage({ onStartChat }: LandingPageProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  const { user, isAuthenticated } = useAuthStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
        toast.success('Image uploaded! Click Start Chat to analyze')
      }
      reader.readAsDataURL(file)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach(track => track.stop())
        toast.success('Recording saved! Click Start Chat to transcribe')
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      toast.success('Recording started...')
    } catch (error) {
      toast.error('Microphone access denied')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const features = [
    {
      icon: Brain,
      title: '70B Parameter AI',
      description: 'State-of-the-art language model with human-level understanding',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: ImageIcon,
      title: 'Vision AI',
      description: 'Analyze images, detect objects, read text, and understand visual content',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Mic,
      title: 'Voice Input',
      description: 'Speak naturally and get instant AI responses',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Code,
      title: 'Code Master',
      description: 'Generate, debug, and explain code in 100+ programming languages',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: FileText,
      title: 'Document Analysis',
      description: 'Process PDFs, analyze contracts, summarize research papers',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Sub-second response times with optimized AI inference',
      color: 'from-indigo-500 to-purple-500'
    }
  ]

  const stats = [
    { label: 'AI Models', value: '5+', icon: Cpu },
    { label: 'Languages', value: '100+', icon: Globe },
    { label: 'Uptime', value: '99.9%', icon: TrendingUp },
    { label: 'Secure', value: '100%', icon: Lock }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      <Toaster position="top-right" />

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      {/* Header with Auth Buttons */}
      <div className="relative z-20 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PawaIcon size={40} />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Pawa AI
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold">{user.username}</span>
                </div>
                <button
                  onClick={onStartChat}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold transition-all"
                >
                  Go to Chat
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthMode('login')
                    setShowAuthModal(true)
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600/50 rounded-xl font-semibold transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup')
                    setShowAuthModal(true)
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20"
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-20">
          <div className="text-center space-y-8 max-w-5xl mx-auto">
            {/* Logo Animation */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity animate-pulse" />
                <div className="relative transform group-hover:scale-110 transition-transform">
                  <PawaIcon size={80} />
                </div>
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-7xl md:text-8xl font-black">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                Pawa AI
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-2xl md:text-3xl text-gray-300 font-light max-w-3xl mx-auto">
              The most powerful AI assistant you'll ever use.
              <br />
              <span className="text-blue-400 font-semibold">100% Free.</span> No limits.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 justify-center items-center">
              {['70B AI Brain', 'Vision Analysis', 'Voice Input', 'Code Generation', 'Lightning Fast'].map((feature, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2 bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-full text-sm backdrop-blur-sm hover:border-blue-500/50 transition-all hover:scale-105"
                >
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Interactive Upload Section */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12">
              {/* Image Upload */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
                <div className="relative p-8 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl backdrop-blur-xl hover:border-blue-500/50 transition-all">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {selectedImage ? (
                    <div className="space-y-4">
                      <img
                        src={selectedImage}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-xl border-2 border-green-500/50"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-all"
                        >
                          Change Image
                        </button>
                        <button
                          onClick={() => setSelectedImage(null)}
                          className="p-3 bg-red-600/20 hover:bg-red-600/30 rounded-xl transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <Check className="w-4 h-4" />
                        Image ready for analysis!
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full space-y-4 text-center"
                    >
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">Upload Image</h3>
                        <p className="text-gray-400 text-sm">
                          Drag & drop or click to upload
                          <br />
                          AI will analyze it instantly
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Audio Recording */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
                <div className="relative p-8 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl backdrop-blur-xl hover:border-green-500/50 transition-all">
                  {audioBlob ? (
                    <div className="space-y-4">
                      <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-xl">
                        <div className="flex items-center justify-center gap-3 text-green-400">
                          <Check className="w-6 h-6" />
                          <span className="font-semibold">Recording Saved!</span>
                        </div>
                        <p className="text-center text-gray-400 text-sm mt-2">
                          Duration: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setAudioBlob(null)
                            setRecordingTime(0)
                          }}
                          className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-semibold transition-all"
                        >
                          Record Again
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className="w-full space-y-4 text-center"
                    >
                      <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                        isRecording
                          ? 'bg-red-600 animate-pulse'
                          : 'bg-gradient-to-br from-green-500 to-emerald-500'
                      }`}>
                        {isRecording ? (
                          <Pause className="w-8 h-8" />
                        ) : (
                          <Mic className="w-8 h-8" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">
                          {isRecording ? 'Recording...' : 'Record Voice'}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {isRecording ? (
                            <>
                              Time: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                              <br />
                              Click to stop recording
                            </>
                          ) : (
                            <>
                              Click to start recording
                              <br />
                              AI will transcribe & respond
                            </>
                          )}
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={onStartChat}
              className="group relative mt-12 px-12 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 rounded-2xl font-bold text-xl transition-all shadow-2xl shadow-purple-500/50 hover:scale-105 hover:shadow-purple-500/75"
            >
              <span className="flex items-center gap-3">
                Start Chatting Now
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-pink-400 rounded-2xl blur-xl opacity-50 -z-10 group-hover:opacity-75 transition-opacity" />
            </button>

            <p className="text-gray-500 text-sm">
              No credit card required • Sign up optional • Unlimited usage
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl backdrop-blur-sm text-center hover:scale-105 transition-transform"
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-blue-400" />
                <div className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Superhuman Capabilities
              </span>
            </h2>
            <p className="text-gray-400 text-xl">
              Everything you need in one powerful AI assistant
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {features.map((feature, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredFeature(idx)}
                onMouseLeave={() => setHoveredFeature(null)}
                className="group relative p-8 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl backdrop-blur-sm hover:border-gray-600/50 transition-all hover:scale-105"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity`} />

                <div className="relative">
                  <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>

                  {hoveredFeature === idx && (
                    <div className="mt-4 flex items-center gap-2 text-blue-400 font-semibold">
                      <span>Try it now</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8 p-12 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-3xl backdrop-blur-xl">
            <Rocket className="w-16 h-16 mx-auto text-blue-400" />
            <h2 className="text-5xl font-black">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Ready to Experience the Future?
              </span>
            </h2>
            <p className="text-xl text-gray-300">
              Join thousands of users already using Pawa AI for work, learning, and creativity
            </p>
            <button
              onClick={onStartChat}
              className="group px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-2xl font-bold text-xl transition-all shadow-2xl hover:scale-105"
            >
              <span className="flex items-center gap-3">
                Get Started Free
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="container mx-auto px-4 py-8 border-t border-gray-800/50">
          <div className="text-center text-gray-500 text-sm">
            <p>Pawa AI - Powered by Advanced Language Models</p>
            <p className="mt-2">Built with love for the AI community</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
      `}</style>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </div>
  )
}
