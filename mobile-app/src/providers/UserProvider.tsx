import React, {
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  useEffect
} from 'react'
import messaging from '@react-native-firebase/messaging'
import { useIsLoggedInQuery } from './UserProvider.codegen'
import {
  clearAccessToken,
  getAccessToken,
  userIdFromToken
} from '../../util/accessTokenUtilz'
import jwtDecode from 'jwt-decode'
import {
  EncryptedSecrets,
  EncryptedSecretsType
} from '../../../shared/generated/graphqlBaseTypes'
import * as Keychain from 'react-native-keychain'
import CryptoJS from 'react-native-crypto-js'

export interface ITOTPSecret {
  secret: string
  label: string
  icon: string | undefined
  lastUsed?: Date | null
  originalUrl: string | undefined
}

export interface ILoginCredentials {
  label: string
  favIconUrl: string | undefined
  lastUsed?: Date | null
  originalUrl: string
  password: string
  username: string
}

export const UserContext = createContext<{
  isLogged: boolean
  setIsLogged: Dispatch<SetStateAction<boolean>>
  token: string | null
  isApiLoggedIn: Boolean
  logout: () => void
  decryptAndSaveData: (
    secrets: Array<Pick<EncryptedSecrets, 'encrypted' | 'kind'>> | undefined
  ) => Promise<void>
  loginCredentials: ILoginCredentials[] | ITOTPSecret[] | null
  totpSecrets: ILoginCredentials[] | ITOTPSecret[] | null
}>({} as any)

export default function UserProvider({ children }) {
  // const [logout] = useLogoutMutation()
  const [isLogged, setIsLogged] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const { data, loading } = useIsLoggedInQuery()
  const [loginCredentials, setLoginCredentials] = useState<
    ILoginCredentials[] | ITOTPSecret[] | null
  >(null)
  const [totpSecrets, setTotpSecrets] = useState<
    ILoginCredentials[] | ITOTPSecret[] | null
  >(null)

  useEffect(() => {
    async function getFirebaseToken() {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      await messaging().onTokenRefresh(async (fcm) => {
        console.log('ressetting token')
        setToken(fcm)
        return
      })
      const Token = await messaging().getToken()
      setToken(Token)
    }

    //Check asyncStorage if is the accessToken valid
    //Remove token if is not valid???
    async function isAccessTokenValid() {
      const token = await getAccessToken()

      if (!token) {
        setIsLogged(false)
        return false
      }

      try {
        // @ts-expect-error
        const { exp } = jwtDecode(token)
        if (Date.now() >= exp * 1000) {
          setIsLogged(false)
          return false
        } else {
          setIsLogged(true)
          return true
        }
      } catch (error) {
        return false
      }
    }

    isAccessTokenValid()
    getFirebaseToken()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, loading])

  return (
    <UserContext.Provider
      value={{
        isLogged,
        setIsLogged,
        token,
        isApiLoggedIn: !!(data?.authenticated && !loading),
        logout: async () => {
          setIsLogged(false)
          clearAccessToken()
          // await logout()
        },
        decryptAndSaveData: async (
          secrets:
            | Array<Pick<EncryptedSecrets, 'encrypted' | 'kind'>>
            | undefined
        ) => {
          const decryptAndParse = (
            data: string,
            password: string
          ): ILoginCredentials[] | ITOTPSecret[] => {
            try {
              const decrypted = CryptoJS.AES.decrypt(data, password as string, {
                iv: CryptoJS.enc.Utf8.parse(userId as string)
              }).toString(CryptoJS.enc.Utf8)
              const parsed = JSON.parse(decrypted)

              return parsed
            } catch (err) {
              console.error(err)
              return []
            }
          }

          let userId = await userIdFromToken()
          const credentials = await Keychain.getGenericPassword()

          if (!credentials) {
            console.log('dont have credencials')
            return
          }

          let totpSecretsEncrypted
          let credentialsSecretsEncrypted

          if (secrets && secrets.length > 0) {
            totpSecretsEncrypted = secrets?.filter(
              ({ kind }) => kind === EncryptedSecretsType.TOTP
            )[0]?.encrypted

            credentialsSecretsEncrypted = secrets?.filter(
              ({ kind }) => kind === EncryptedSecretsType.LOGIN_CREDENTIALS
            )[0]?.encrypted
          }

          if (totpSecretsEncrypted) {
            let totps = decryptAndParse(
              totpSecretsEncrypted,
              credentials.password
            )
            setTotpSecrets(totps)
          } else {
            setTotpSecrets([])
          }

          if (credentialsSecretsEncrypted) {
            let credencials = decryptAndParse(
              credentialsSecretsEncrypted,
              credentials.password
            )
            setLoginCredentials(credencials)
          } else {
            setLoginCredentials([])
          }
        },
        loginCredentials,
        totpSecrets
      }}
    >
      {children}
    </UserContext.Provider>
  )
}
