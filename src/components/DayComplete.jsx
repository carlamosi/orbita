import { Link } from 'react-router-dom'
import Button from './Button'

// Shown when today's FSRS session is empty: nothing due and no new cards left.
export default function DayComplete({ onPractice }) {
  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card max-w-sm w-full p-8 flex flex-col items-center text-center">
        <h2 className="font-grotesk font-bold text-3xl text-white mb-2">Day complete</h2>
        <p className="font-inter text-[#8B8FA8] mb-8">
          You've reviewed everything due today. Come back tomorrow or keep practicing.
        </p>
        <div className="flex w-full gap-4">
          <Button variant="primary" className="flex-1 justify-center" onClick={onPractice}>Free practice</Button>
          <Link to="/" className="flex-1"><Button variant="secondary" className="w-full justify-center">Home</Button></Link>
        </div>
      </div>
    </div>
  )
}
