import { useEffect } from 'react'
import { useStage } from './store'

export const STAGE_DEFAULTS = { view: 'hero', detail: null, open: false, inset: {}, zone: null, chapter: 0, profile: 'balanced' }

// A page declares what the persistent stage should show; the camera rig animates there.
export function useStagePage(patch, deps = []) {
  const { patch: set } = useStage()
  useEffect(() => { set({ ...STAGE_DEFAULTS, ...patch }) }, deps) // eslint-disable-line react-hooks/exhaustive-deps
}
