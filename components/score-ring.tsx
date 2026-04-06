'use client'

import { useEffect, useState } from 'react'

interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#C8FF3E'
  if (score >= 75) return '#3EFFC8'
  if (score >= 60) return '#FFB800'
  return '#FF4D4D'
}

export function ScoreRing({ score, size = 80, strokeWidth = 6 }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const targetOffset = circumference - (score / 100) * circumference
  const color = getScoreColor(score)

  // Animate from full offset (empty) to target on mount
  const [offset, setOffset] = useState(circumference)
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    // Small delay to ensure the initial state renders before animating
    const rafId = requestAnimationFrame(() => {
      setTimeout(() => {
        setOffset(targetOffset)
      }, 80)
    })

    // Animate score number
    let start = 0
    const duration = 700
    const step = score / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= score) {
        setDisplayScore(score)
        clearInterval(timer)
      } else {
        setDisplayScore(Math.floor(start))
      }
    }, 16)

    return () => {
      cancelAnimationFrame(rafId)
      clearInterval(timer)
    }
  }, [score, targetOffset])

  const isHigh = score >= 75

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        style={{
          transform: 'rotate(-90deg)',
          filter: isHigh ? `drop-shadow(0 0 6px ${color}60)` : 'none',
          transition: 'filter 0.4s ease',
        }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease' }}
        />
      </svg>
      {/* Score text */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{
          fontSize: size * 0.28,
          fontWeight: '700',
          color,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          transition: 'color 0.4s ease',
        }}>
          {displayScore}
        </span>
      </div>
    </div>
  )
}
