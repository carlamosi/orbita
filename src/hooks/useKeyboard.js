import { useEffect } from 'react'

/**
 * useKeyboard
 * 
 * Central hook to handle global keyboard events for the app.
 * 
 * @param {Object} handlers - Map of keys to callback functions
 *   {
 *     '1': () => handleSelect(0),
 *     'Enter': () => handleSubmit(),
 *     'Escape': () => handleClose()
 *   }
 */
export function useKeyboard(handlers) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const handler = handlers[e.key]
      if (handler) {
        // Prevent default browser behavior if we have a handler
        // e.g. space bar scrolling page
        e.preventDefault()
        
        // Mark that user has used keyboard in localStorage
        if (['1', '2', '3', '4', 'Enter', 'ArrowUp', 'ArrowDown', 'h', 'H'].includes(e.key)) {
          localStorage.setItem('orbita-has-used-keyboard', 'true')
        }
        
        handler()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
