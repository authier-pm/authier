import { useState } from 'react'

export function useForceUpdate() {
  //console.warn('useForceUpdate')
  const [value, setValue] = useState(0) // integer state
  return [() => setValue((value) => value + 1), value] as const // update the state to force render
}
