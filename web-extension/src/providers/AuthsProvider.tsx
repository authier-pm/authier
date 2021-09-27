import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  Dispatch,
  SetStateAction,
  FunctionComponent
} from 'react'
import browser from 'webextension-polyfill'
import cryptoJS from 'crypto-js'
import { UserContext } from './UserProvider'
import { useSaveAuthsMutation } from '../popup/Popup.codegen'
import { BackgroundContext } from './BackgroundProvider'

export const AuthsContext = createContext<{
  auths: Array<IAuth>
  setAuths: Dispatch<SetStateAction<IAuth[]>>
}>({ auths: undefined } as any)

export interface IAuth {
  secret: string
  label: string
  icon: string | undefined
  lastUsed?: Date | null
  originalUrl: string | undefined
}

export const AuthsProvider: FunctionComponent = ({ children }) => {
  const [auths, setAuths] = useState<IAuth[]>([])
  const { isApiLoggedIn: isAuth, userId } = useContext(UserContext)
  const [saveAuthsMutation] = useSaveAuthsMutation()
  const { saveAuthsToBg, masterPassword } = useContext(BackgroundContext)

  return (
    <AuthsContext.Provider
      value={{
        auths,
        // Split saving to DB, local storage and background script
        setAuths: async (value) => {
          console.log('saving', value)
          if (value.length > 0) {
            //@ts-expect-error
            saveAuthsToBg(value)
          }

          const encrypted = cryptoJS.AES.encrypt(
            JSON.stringify(value),
            masterPassword
          ).toString()

          if (isAuth) {
            console.log('saving with', masterPassword, 'userId: ', userId)

            await saveAuthsMutation({
              variables: {
                payload: encrypted
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
