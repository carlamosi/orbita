import { useGameStore } from '../store/useGameStore'
import Button from './Button'
import { storageMessage } from './storageMessage'

// Tells the user when their progress is not being saved (or a newer tab took
// over). Renders nothing while storage is ok.
export default function StorageBanner() {
  const storageStatus = useGameStore((s) => s.storageStatus)
  const needsReload = useGameStore((s) => s.needsReload)
  const text = storageMessage(storageStatus, needsReload)
  if (!text) return null
  const reload = needsReload || storageStatus === 'needsReload'

  return (
    <div className="fixed top-[64px] inset-x-0 z-40 px-4 flex justify-center pointer-events-none">
      <div
        role="alert"
        className="glass-card pointer-events-auto max-w-2xl w-full px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-[#FF6B6B]/40 text-sm text-white"
      >
        <p className="font-inter">{text}</p>
        {reload && (
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
            Reload
          </Button>
        )}
      </div>
    </div>
  )
}
