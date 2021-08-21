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
import { useSavePasswordsMutation } from '../popup/Popup.codegen'
import { useBackground } from '@src/util/useBackground'

export const PasswContext = createContext<{
  passwords: Array<Passwords> | undefined
  setPasswords: Dispatch<SetStateAction<Passwords[] | undefined>>
}>({ auths: undefined } as any)

export interface Passwords {
  label: string
  icon: string | undefined
  lastUsed?: Date | null
  originalUrl: string | undefined
  password: string
  username: string
}

export const PasswProvider: FunctionComponent = ({ children }) => {
  const [passwords, setPasswords] = useState<Passwords[]>()
  const { password, isApiLoggedIn: isAuth, userId } = useContext(UserContext)
  const [savePasswordsMutation] = useSavePasswordsMutation()
  const { savePasswodsToBg } = useBackground()

  return (
    <PasswContext.Provider
      value={{
        passwords,
        setPasswords: async (value) => {
          console.log('saving passwords', value)

          const encrypted = cryptoJS.AES.encrypt(
            JSON.stringify(value),
            password
          ).toString()

          console.log(isAuth)
          if (isAuth) {
            console.log('saving with', password, 'userId: ', userId)
            await savePasswordsMutation({
              variables: {
                payload: encrypted,
                userId: userId as string
              }
            })
          }
          await browser.storage.local.set({
            encryptedPswMasterPassword: encrypted
          })
          setPasswords(value)
        }
      }}
    >
      {children}
    </PasswContext.Provider>
  )
}
