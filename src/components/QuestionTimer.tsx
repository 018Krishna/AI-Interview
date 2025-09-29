import { useEffect, useMemo, useRef, useState, CSSProperties } from 'react'
import { Progress, Typography, Tag } from 'antd'
import type { ActiveTimerState, QuestionDifficulty } from '@/types'
import { QUESTION_TIMINGS } from '@/utils/questionBank'

// --- INTERFACES & CONFIG ---

interface QuestionTimerProps {
  timer?: ActiveTimerState
  difficulty?: QuestionDifficulty
  onExpired: () => void
}

const difficultyConfig: Record<
  QuestionDifficulty,
  { color: string; name: string }
> = {
  easy: { color: '#22c55e', name: 'Easy' },
  medium: { color: '#f97316', name: 'Medium' },
  hard: { color: '#ef4444', name: 'Hard' },
}

// --- STYLES (as JavaScript Objects) ---

const styles: { [key: string]: CSSProperties } = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
    width: '220px',
    transition: 'box-shadow 0.3s ease',
  },
  cardHover: {
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  },
  timerDisplay: {
    position: 'relative',
    display: 'grid',
    placeItems: 'center',
  },
  timerTextContent: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    lineHeight: 1,
    userSelect: 'none',
  },
  timerSeconds: {
    fontSize: '48px',
    fontWeight: 600,
    color: '#1f2937',
    transition: 'color 0.3s ease',
  },
  lowTimeText: {
    color: '#ef4444', // Warning color
  },
  timerLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#6b7280',
    marginTop: '-4px',
  },
  timerStatus: {
    margin: 0,
    color: '#4b5563',
  },
  difficultyDisplay: {
    textAlign: 'center',
  },
  difficultyTag: {
    fontSize: '13px',
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: '9999px',
    border: 'none',
  },
}

// --- COMPONENT ---

export function QuestionTimer({
  timer,
  difficulty = 'easy',
  onExpired,
}: QuestionTimerProps) {
  const [remainingMs, setRemainingMs] = useState(() => timer?.durationMs ?? 0)
  const [isHovered, setIsHovered] = useState(false)
  const expiredRef = useRef(false)

  useEffect(() => {
    setRemainingMs(timer?.remainingMsOnPause ?? timer?.durationMs ?? 0)
    expiredRef.current = false
  }, [timer])

  useEffect(() => {
    if (!timer || timer.paused || !timer.startedAt) {
      return
    }
    const tick = () => {
      const elapsed = Date.now() - new Date(timer.startedAt!).getTime()
      const nextRemaining = Math.max(timer.durationMs - elapsed, 0)
      setRemainingMs(nextRemaining)

      if (nextRemaining <= 0 && !expiredRef.current) {
        expiredRef.current = true
        onExpired()
      }
    }
    tick()
    const interval = window.setInterval(tick, 250)
    return () => window.clearInterval(interval)
  }, [timer, onExpired])

  const total = timer?.durationMs ?? QUESTION_TIMINGS[difficulty]
  const percent = total > 0 ? Math.max(0, (remainingMs / total) * 100) : 0
  const seconds = Math.ceil(remainingMs / 1000)

  const isLowTime = timer && !timer.paused && remainingMs > 0 && remainingMs <= 10000;

  const statusText = useMemo(() => {
    if (!timer) return 'Ready'
    if (timer.paused) return 'Paused'
    return 'Remaining'
  }, [timer])

  // Combine base styles with conditional styles
  const combinedCardStyle = {
    ...styles.card,
    ...(isHovered && styles.cardHover),
  };
  const combinedSecondsStyle = {
    ...styles.timerSeconds,
    ...(isLowTime && styles.lowTimeText),
  };

  return (
    <div
      style={combinedCardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.timerDisplay}>
        <Progress
          type="circle"
          percent={percent}
          size={140}
          strokeWidth={8}
          strokeColor={difficultyConfig[difficulty].color}
          trailColor="#f0f2f5"
          format={() => null}
        />
        <div style={styles.timerTextContent}>
          {(!timer || timer.paused) ? (
            <Typography.Title level={3} style={styles.timerStatus}>
              {statusText}
            </Typography.Title>
          ) : (
            <>
              <span style={combinedSecondsStyle}>{seconds}</span>
              <span style={styles.timerLabel}>seconds</span>
            </>
          )}
        </div>
      </div>
      <div style={styles.difficultyDisplay}>
        <Tag
          color={difficultyConfig[difficulty].color}
          style={styles.difficultyTag}
        >
          {difficultyConfig[difficulty].name}
        </Tag>
      </div>
    </div>
  )
}

export default QuestionTimer