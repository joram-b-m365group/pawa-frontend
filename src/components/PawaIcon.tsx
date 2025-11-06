interface PawaIconProps {
  className?: string
  size?: number
}

export default function PawaIcon({ className = '', size = 40 }: PawaIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer glow ring */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="url(#outerGlow)"
        opacity="0.3"
      />

      {/* Main geometric shape - Lightning bolt merged with brain circuit */}
      <path
        d="M50 10 L65 35 L55 35 L70 60 L55 55 L60 90 L40 55 L30 60 L45 35 L35 35 Z"
        fill="url(#mainGradient)"
        stroke="url(#strokeGradient)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Neural network nodes - small circles representing AI */}
      <circle cx="30" cy="30" r="3" fill="url(#nodeGradient)" opacity="0.9">
        <animate
          attributeName="opacity"
          values="0.5;1;0.5"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="70" cy="30" r="3" fill="url(#nodeGradient)" opacity="0.9">
        <animate
          attributeName="opacity"
          values="0.5;1;0.5"
          dur="2s"
          begin="0.3s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="25" cy="50" r="3" fill="url(#nodeGradient)" opacity="0.9">
        <animate
          attributeName="opacity"
          values="0.5;1;0.5"
          dur="2s"
          begin="0.6s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="75" cy="50" r="3" fill="url(#nodeGradient)" opacity="0.9">
        <animate
          attributeName="opacity"
          values="0.5;1;0.5"
          dur="2s"
          begin="0.9s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="35" cy="70" r="3" fill="url(#nodeGradient)" opacity="0.9">
        <animate
          attributeName="opacity"
          values="0.5;1;0.5"
          dur="2s"
          begin="1.2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="65" cy="70" r="3" fill="url(#nodeGradient)" opacity="0.9">
        <animate
          attributeName="opacity"
          values="0.5;1;0.5"
          dur="2s"
          begin="1.5s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Connecting lines - subtle neural network effect */}
      <line x1="30" y1="30" x2="50" y2="40" stroke="url(#lineGradient)" strokeWidth="1" opacity="0.3" />
      <line x1="70" y1="30" x2="50" y2="40" stroke="url(#lineGradient)" strokeWidth="1" opacity="0.3" />
      <line x1="25" y1="50" x2="50" y2="50" stroke="url(#lineGradient)" strokeWidth="1" opacity="0.3" />
      <line x1="75" y1="50" x2="50" y2="50" stroke="url(#lineGradient)" strokeWidth="1" opacity="0.3" />

      {/* Center power core */}
      <circle cx="50" cy="50" r="8" fill="url(#coreGradient)" opacity="0.8">
        <animate
          attributeName="r"
          values="7;9;7"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Gradient definitions */}
      <defs>
        <radialGradient id="outerGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </radialGradient>

        <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>

        <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>

        <radialGradient id="nodeGradient">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </radialGradient>

        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>

        <radialGradient id="coreGradient">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
      </defs>
    </svg>
  )
}
