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
import { useSaveAuthsMutation } from '../popup/Popup.codegen'
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
  const [saveAuthsMutation] = useSaveAuthsMutation()
  const { saveAuthsToBg } = useBackground()

  return (
    <PasswContext.Provider
      value={{
        passwords,
        // Split saving to DB, local storage and background script
        setPasswords: async (value) => {
          // console.log('saving', value)
          // //@ts-expect-error
          // saveAuthsToBg(value)
          // const encrypted = cryptoJS.AES.encrypt(
          //   JSON.stringify(value),
          //   password
          // ).toString()
          // if (isAuth) {
          //   console.log('saving with', password, 'userId: ', userId)
          //   await saveAuthsMutation({
          //     variables: {
          //       payload: encrypted,
          //       userId: userId as string
          //     }
          //   })
          // }
          // await browser.storage.local.set({
          //   encryptedAuthsMasterPassword: encrypted
          // })
          // setPasswords(value)
        }
      }}
    >
      {children}
    </PasswContext.Provider>
  )
}
