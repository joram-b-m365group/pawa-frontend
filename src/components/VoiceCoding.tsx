import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface VoiceCodingProps {
  onCommand: (command: string) => void
  onTranscript: (text: string) => void
  isProcessing?: boolean
}

type RecognitionStatus = 'idle' | 'listening' | 'processing' | 'success' | 'error'

export default function VoiceCoding({ onCommand, onTranscript, isProcessing = false }: VoiceCodingProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [status, setStatus] = useState<RecognitionStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      setIsSupported(true)

      // Initialize recognition
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setStatus('listening')
        setError(null)
        console.log('Voice recognition started')
      }

      recognition.onresult = (event: any) => {
        let interim = ''
        let final = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const text = result[0].transcript

          if (result.isFinal) {
            final += text + ' '
          } else {
            interim += text
          }
        }

        if (interim) {
          setInterimTranscript(interim)
        }

        if (final) {
          const newTranscript = (transcript + final).trim()
          setTranscript(newTranscript)
          setInterimTranscript('')

          // Send to parent
          onTranscript(newTranscript)

          // Check for command keywords
          checkForCommand(final.toLowerCase())
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Voice recognition error:', event.error)
        setStatus('error')
        setError(getErrorMessage(event.error))

        // Auto-restart on some errors
        if (event.error === 'no-speech') {
          setTimeout(() => {
            if (recognitionRef.current && status === 'listening') {
              recognition.start()
            }
          }, 1000)
        }
      }

      recognition.onend = () => {
        if (status === 'listening') {
          // Auto-restart if we're still supposed to be listening
          try {
            recognition.start()
          } catch (e) {
            console.log('Recognition ended naturally')
          }
        } else {
          setStatus('idle')
        }
      }

      recognitionRef.current = recognition
    } else {
      setIsSupported(false)
      setError('Voice recognition not supported in this browser. Try Chrome or Edge.')
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const checkForCommand = (text: string) => {
    // Detect coding commands
    const commandPatterns = [
      /create (a|an)?\s*(new )?(file|component|function|class)/i,
      /add (a|an)?\s*(new )?(function|method|class|component)/i,
      /refactor (the|this)?/i,
      /fix (the|this)?\s*(bug|error|issue)/i,
      /delete|remove/i,
      /rename/i,
      /install|add package/i,
      /run (the|this)?\s*(test|command|script)/i
    ]

    for (const pattern of commandPatterns) {
      if (pattern.test(text)) {
        setStatus('processing')
        onCommand(text)
        setTimeout(() => setStatus('success'), 500)
        setTimeout(() => setStatus('listening'), 2000)
        return
      }
    }
  }

  const getErrorMessage = (errorType: string): string => {
    switch (errorType) {
      case 'no-speech':
        return 'No speech detected. Please try again.'
      case 'audio-capture':
        return 'Microphone not accessible. Check permissions.'
      case 'not-allowed':
        return 'Microphone permission denied.'
      case 'network':
        return 'Network error. Check your connection.'
      default:
        return `Error: ${errorType}`
    }
  }

  const startListening = () => {
    if (!recognitionRef.current) return

    try {
      setTranscript('')
      setInterimTranscript('')
      setError(null)
      recognitionRef.current.start()
    } catch (e: any) {
      if (e.message.includes('already started')) {
        // Already running, ignore
      } else {
        setError('Failed to start voice recognition')
      }
    }
  }

  const stopListening = () => {
    if (!recognitionRef.current) return

    try {
      setStatus('idle')
      recognitionRef.current.stop()
    } catch (e) {
      console.error('Error stopping recognition:', e)
    }
  }

  const clearTranscript = () => {
    setTranscript('')
    setInterimTranscript('')
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'listening':
        return <Volume2 className="w-5 h-5 animate-pulse text-red-500" />
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Mic className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'listening':
        return 'bg-red-500 animate-pulse'
      case 'processing':
        return 'bg-blue-500 animate-pulse'
      case 'success':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
        <MicOff className="w-4 h-4 text-yellow-400" />
        <span className="text-sm text-yellow-400">Voice coding not supported in this browser</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Voice Control Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={status === 'listening' ? stopListening : startListening}
          disabled={isProcessing}
          className={`relative p-4 rounded-full transition-all ${
            status === 'listening'
              ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/50'
              : 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={status === 'listening' ? 'Stop voice input' : 'Start voice input'}
        >
          {getStatusIcon()}

          {/* Pulse ring when listening */}
          {status === 'listening' && (
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
          )}
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <span className="text-sm font-medium text-white capitalize">{status}</span>
          </div>
          {status === 'listening' && (
            <p className="text-xs text-gray-400 mt-1">Speak naturally - I'm listening...</p>
          )}
          {error && (
            <p className="text-xs text-red-400 mt-1">{error}</p>
          )}
        </div>

        {transcript && (
          <button
            onClick={clearTranscript}
            className="px-3 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Transcript Display */}
      {(transcript || interimTranscript) && (
        <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
          <p className="text-sm text-white">
            {transcript}
            {interimTranscript && (
              <span className="text-gray-400 italic"> {interimTranscript}</span>
            )}
          </p>
        </div>
      )}

      {/* Command Examples */}
      {status === 'idle' && !transcript && (
        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-400">Try saying:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>"Create a new function called getUserData"</li>
            <li>"Add error handling to the login function"</li>
            <li>"Refactor this code to use async await"</li>
            <li>"Run the tests"</li>
          </ul>
        </div>
      )}
    </div>
  )
}
