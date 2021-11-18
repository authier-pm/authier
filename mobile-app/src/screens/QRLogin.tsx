'use strict'
import React, { useContext } from 'react'

import { AppRegistry } from 'react-native'
import QRCodeScanner from 'react-native-qrcode-scanner'
import { RNCamera } from 'react-native-camera'
import { AuthsContext } from '../Providers'
import { useAddNewDeviceForUserMutation } from '../../../shared/addNewDeviceForUser.codegen'

import { getDeviceNameSync } from 'react-native-device-info'
import { Pressable, Text } from 'native-base'
import { UserContext } from '../providers/UserProvider'

const QRLogin = ({ navigation }) => {
  const [addNewDevice, { data, error }] = useAddNewDeviceForUserMutation()
  const { setAuths, auths } = useContext(AuthsContext)
  const { token } = useContext(UserContext)

  if (error) {
    console.log(`Error! ${error}`)
  }

  const onSuccess = async (e: { data: string }) => {
    if (e.data.includes('secret')) {
      console.log('1')
      const qrDataParts = e.data.split('?secret=')
      setAuths([
        {
          secret: qrDataParts[1],
          icon: 'test',
          label: decodeURIComponent(
            qrDataParts[0].replace('otpauth://totp/', '')
          )
        },
        ...auths
      ])
      navigation.navigate('Home')
    } else {
      // Save ID to storage
      await addNewDevice({
        variables: {
          // @ts-expect-error TODO fix this-API changed
          userId: e.data,
          name: getDeviceNameSync(),
          firebaseToken: token as string
        }
      })
      console.log(data)
      navigation.navigate('Home')
    }

    console.log(e)
  }

  return (
    <QRCodeScanner
      showMarker={true}
      onRead={onSuccess}
      //@ts-ignore
      flashMode={RNCamera.Constants.FlashMode.auto}
      topContent={
        <Text flex={1} fontSize={18} p={32} color={'#777'}>
          Go to <Text fontWeight={500}>wikipedia.org/wiki/QR_code</Text> on your
          computer and scan the QR code.
        </Text>
      }
      bottomContent={
        <Pressable p={16}>
          <Text fontSize={21} color={'rgb(0,122,255)'}>
            OK. Got it!
          </Text>
        </Pressable>
      }
    />
  )
}

export default QRLogin
AppRegistry.registerComponent('default', () => QRLogin)
