import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

export type AnnouncePoliteness = 'polite' | 'assertive'
export type Announce = (message: string, politeness?: AnnouncePoliteness) => void

const LiveAnnouncerContext = createContext<Announce>(() => undefined)

export function LiveAnnouncerProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState('')
  const [assertive, setAssertive] = useState('')
  const frames = useRef({ polite: 0, assertive: 0 })

  useEffect(() => {
    const current = frames.current
    return () => {
      cancelAnimationFrame(current.polite)
      cancelAnimationFrame(current.assertive)
    }
  }, [])

  const announce = useCallback<Announce>((message, politeness = 'polite') => {
    const set = politeness === 'assertive' ? setAssertive : setPolite
    cancelAnimationFrame(frames.current[politeness])
    set('')
    frames.current[politeness] = requestAnimationFrame(() => set(message))
  }, [])

  return (
    <LiveAnnouncerContext value={announce}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {polite}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
        {assertive}
      </div>
    </LiveAnnouncerContext>
  )
}

export function useAnnounce(): Announce {
  return useContext(LiveAnnouncerContext)
}
