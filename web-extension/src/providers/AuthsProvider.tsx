import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  Dispatch,
  SetStateAction,
  FunctionComponent
} from 'react'
import { browser } from 'webextension-polyfill-ts'
import cryptoJS from 'crypto-js'
import { UserContext } from './UserProvider'
import {
  useIsLoggedInQuery,
  useSaveAuthsMutation
} from '../popup/Popup.codegen'

export const AuthsContext = createContext<{
  auths: Array<IAuth>
  setAuths: Dispatch<SetStateAction<IAuth[]>>
}>({ auths: [] } as any)

export interface IAuth {
  secret: string
  label: string
  icon: string | undefined
  lastUsed?: Date | null
  originalUrl: string | undefined
}

export const AuthsProvider: FunctionComponent = ({ children }) => {
  const [auths, setAuths] = useState<IAuth[]>([])
  const { password, isAuth, userId } = useContext(UserContext)
  const [saveAuthsMutation] = useSaveAuthsMutation()

  return (
    <AuthsContext.Provider
      value={{
        auths,
        // Split saving to DB, local storage and background script
        setAuths: async (value) => {
          console.log('saving with', password, 'userId: ', userId)
          await chrome.runtime.sendMessage({
            auths: value,
            lockTime: 28800000
          })

          const encrypted = cryptoJS.AES.encrypt(
            JSON.stringify(value),
            password
          ).toString()

          if (isAuth) {
            await saveAuthsMutation({
              variables: {
                payload: encrypted,
                userId: userId as string
              }
            })
          }

          await browser.storage.local.set({
            encryptedAuthsMasterPassword: encrypted
          })

          setAuths(value)
        }
      }}
    >
      {children}
    </AuthsContext.Provider>
  )
}
