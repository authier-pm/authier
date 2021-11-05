import AsyncStorage from '@react-native-async-storage/async-storage'
import React, {
  createContext,
  useState,
  useEffect,
  Dispatch,
  SetStateAction
} from 'react'

export const NotifyContext = createContext<{
  notifies: Array<Notifi>
  setNotifies: Dispatch<SetStateAction<Notifi[]>>
}>({} as any)

export interface Notifi {
  pageName: string
  device: string
  icon: string
  location: string
  time: string
}

export default function NotifyProvider({ children }) {
  const [notifies, setNotifies] = useState<Notifi[]>([])

  useEffect(() => {
    const getData = async () => {
      const jsonValue = await AsyncStorage.getItem('notifies', (e) => {
        if (e) console.log(e)
      })

      if (jsonValue) {
        let data = JSON.parse(jsonValue as string)
        setNotifies([data.data])
      } else {
        setNotifies([])
      }
    }

    getData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <NotifyContext.Provider value={{ notifies, setNotifies }}>
      {children}
    </NotifyContext.Provider>
  )
}
