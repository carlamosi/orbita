import { useState, useEffect } from 'react'

export default function CircleTimer({ durationSeconds, onComplete, isRunning }) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds)

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (timeLeft === 0 && isRunning) onComplete?.()
      return
    }

    const intervalId = setInterval(() => {
      setTimeLeft(t => t - 1)
    }, 1000)

    return () => clearInterval(intervalId)
  }, [isRunning, timeLeft, onComplete])

  const size = 120
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (timeLeft / durationSeconds) * circumference
  const isDanger = timeLeft <= 10

  return (
    <div className="relative flex items-center justify-center font-mono" style={{ width: size, height: size }}>
      
      {/* SVG Circular Track Background */}
      <svg className="absolute inset-0 rotate-[-90deg]" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />

        {/* Animated Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDanger ? '#FF6B6B' : '#6C63FF'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      
      {/* Number Text */}
      <span 
        className={`text-[36px] font-bold z-10 ${
          isDanger ? 'text-[#FF6B6B] animate-pulse drop-shadow-[0_0_10px_rgba(255,107,107,0.8)]' : 'text-white'
        }`}
      >
        {timeLeft}
      </span>
    </div>
  )
}
