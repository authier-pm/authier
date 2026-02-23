import type React from 'react'

export type LocalPackage = {
  label?: string
}

type CodePushOptions = {
  checkFrequency?: number
  mandatoryInstallMode?: number
  updateDialog?: {
    appendReleaseDescription?: boolean
    title?: string
  }
}

type CodePushEnhancer = {
  <P>(options?: CodePushOptions): (Component: React.ComponentType<P>) => React.ComponentType<P>
  CheckFrequency: {
    MANUAL: number
    ON_APP_RESUME: number
  }
  InstallMode: {
    IMMEDIATE: number
  }
  getUpdateMetadata: () => Promise<LocalPackage | null>
}

const codePush = ((() => {
  const enhancer = (<P,>(_options?: CodePushOptions) => {
    return (Component: React.ComponentType<P>) => Component
  }) as CodePushEnhancer

  enhancer.CheckFrequency = {
    MANUAL: 0,
    ON_APP_RESUME: 1
  }
  enhancer.InstallMode = {
    IMMEDIATE: 0
  }
  enhancer.getUpdateMetadata = async () => null

  return enhancer
})()) as CodePushEnhancer

export default codePush
