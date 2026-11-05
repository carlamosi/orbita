import { useMemo, useState } from 'react'
import { useGameStore } from '../store/useGameStore'
import { localDayKey } from '../srs/dayKey'

// dailyActivity counts reviews per day: 0, 1-9, 10-24, 25-49, 50+
function shade(count) {
  if (count >= 50) return '#6C63FF' // intense violet
  if (count >= 25) return '#5048b6'
  if (count >= 10) return '#4038a0'
  if (count >= 1) return '#342f7c' // light violet
  return '#0d0d1a' // empty
}

export default function ActivityGrid({ now = Date.now }) {
  const dailyActivity = useGameStore(s => s.dailyActivity)
  const [hovered, setHovered] = useState(null)

  const days = useMemo(() => {
    // Day keys are local calendar days; walk back from today's key in UTC date math so
    // DST shifts never skip or repeat a day.
    const todayMs = Date.parse(`${localDayKey(now())}T00:00:00Z`)
    const elements = []
    const activity = dailyActivity || {}

    // 52 weeks * 7 days = 364 days.
    for (let i = 363; i >= 0; i--) {
      const dateStr = new Date(todayMs - i * 86400000).toISOString().split('T')[0]
      const count = activity[dateStr] || 0
      elements.push({ date: dateStr, count, bg: shade(count) })
    }
    return elements
  }, [dailyActivity, now])

  return (
    <div className="w-full flex justify-center py-4 relative group/grid">
      <div className="flex gap-[2px]">
        {/* We want to flow in columns (top-to-bottom, left-to-right) like GitHub grid.
            Grid template helps formatting. 364 items / 7 days = 52 cols.
         */}
        <div 
          className="grid gap-[2px]" 
          style={{ 
            gridTemplateColumns: 'repeat(52, 1fr)',
            gridTemplateRows: 'repeat(7, 1fr)' 
          }}
        >
          {days.map((day, i) => (
            <div
              key={i}
              data-day={day.date}
              data-count={day.count}
              className="w-3 h-3 transition-colors hover:ring-1 ring-white/50"
              style={{ backgroundColor: day.bg, borderRadius: '3px' }}
              onMouseEnter={() => setHovered(day)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </div>
      </div>

      {hovered && (
        <div className="absolute top-[-30px] bg-[#222233] text-white text-xs px-3 py-1.5 rounded-md pointer-events-none drop-shadow-lg z-50 whitespace-nowrap">
           <strong className="text-violet">{hovered.count} reviews</strong> on {new Date(`${hovered.date}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
        </div>
      )}
    </div>
  )
}
