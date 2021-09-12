import { useBackgroundState } from '@src/util/useBackgroundState'
import React, { createContext, FunctionComponent } from 'react'

export const BackgroundContext = createContext<
  ReturnType<typeof useBackgroundState>
>({} as any)

export const BackgroundProvider: FunctionComponent = ({ children }) => {
  const backgroundState = useBackgroundState()
  return (
    <BackgroundContext.Provider value={backgroundState}>
      {children}
    </BackgroundContext.Provider>
  )
}
