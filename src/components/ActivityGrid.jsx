import { useMemo, useState } from 'react'
import { useGameStore } from '../store/useGameStore'

export default function ActivityGrid() {
  const dailyActivity = useGameStore(s => s.dailyActivity) || {}
  const [hovered, setHovered] = useState(null)

  const days = useMemo(() => {
    const today = new Date()
    today.setHours(0,0,0,0) // Normalize to midnight
    const elements = []
    
    // We want 52 weeks * 7 days = 364 days.
    for (let i = 363; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const count = dailyActivity[dateStr] || 0
      
      // Determine shade of violet based on count
      let bg = '#0d0d1a' // empty
      if (count > 0 && count <= 2) bg = '#342f7c' // light violet
      if (count >= 3 && count <= 5) bg = '#5048b6' // mid
      if (count > 5) bg = '#6C63FF' // intense violet

      elements.push({
        date: dateStr,
        count,
        bg,
        dateObj: d
      })
    }
    return elements
  }, [dailyActivity])

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
           <strong className="text-violet">{hovered.count} questions</strong> on {new Date(hovered.dateObj).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )}
    </div>
  )
}
