import { useEffect, useState } from 'react'
import { elapsedSeconds } from '../lib/duration'

/** Segundos desde `fromIso`, actualizados una vez por segundo. */
export function useElapsedSeconds(fromIso: string): number {
  const [seconds, setSeconds] = useState(() => elapsedSeconds(fromIso))

  useEffect(() => {
    setSeconds(elapsedSeconds(fromIso))
    const id = setInterval(() => setSeconds(elapsedSeconds(fromIso)), 1000)
    return () => clearInterval(id)
  }, [fromIso])

  return seconds
}
