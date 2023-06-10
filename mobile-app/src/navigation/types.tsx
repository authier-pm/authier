import type {
  CompositeScreenProps,
  NavigatorScreenParams
} from '@react-navigation/native'
import type { StackScreenProps } from '@react-navigation/stack'
import { ILoginSecret, ITOTPSecret } from '@utils/deviceStore'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { DeviceQuery, UserQuery } from '@shared/generated/graphqlBaseTypes'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs'

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

//ROOT
export type RootStackParamList = {
  Passwords: NavigatorScreenParams<PasswordsStackParamList>
  TOTP: NavigatorScreenParams<TOTPStackParamList>
  Devices: NavigatorScreenParams<DeviceStackParamList>
  User: NavigatorScreenParams<AccountStackParamList>
}

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  BottomTabScreenProps<RootStackParamList, T>

//PASSWORDS VAULT
export type PasswordStackScreenProps<T extends keyof PasswordsStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<PasswordsStackParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >

export type PasswordsStackParamList = {
  PasswordsVault: undefined
  AddPassword: undefined
  EditPassword: { loginSecret: ILoginSecret }
}

//TOTP VAULT
export type TOTPStackScreenProps<T extends keyof TOTPStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<TOTPStackParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >

export type TOTPStackParamList = {
  TOTPVault: undefined
  AddTOTP: undefined
  EditTOTP: { item: ITOTPSecret }
  QRScan: undefined
}

//DEVICES
export type DevicesStackScreenProps<T extends keyof DeviceStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<DeviceStackParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >

export type DeviceStackParamList = {
  DeviceList: undefined
  DeviceInfo: {
    device: Partial<DeviceQuery>
    masterDeviceId: UserQuery['masterDeviceId']
  }
}

//ACCOUNT
export type AccountStackScreenProps<T extends keyof AccountStackParamList> =
  CompositeScreenProps<
    StackScreenProps<AccountStackParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >

export type AccountStackParamList = {
  Account: undefined
  Settings: NavigatorScreenParams<SettingsTabParamList>
  ChangeMasterPassword: undefined
}

//SETTINGS
export type SettingsTabScreenProps<T extends keyof SettingsTabParamList> =
  CompositeScreenProps<
    MaterialTopTabScreenProps<SettingsTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >

export type SettingsTabParamList = {
  User: undefined
  Device: undefined
}
