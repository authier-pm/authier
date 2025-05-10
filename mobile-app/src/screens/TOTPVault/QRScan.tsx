import { useNavigation } from '@react-navigation/native'
import { Loading } from '../components/Loading'
import { TOTPStackScreenProps } from '../navigation/types'
import * as React from 'react'
import { useEffect } from 'react'
import queryString from 'query-string'
import { StyleSheet } from 'react-native'
import Svg, { Defs, Mask, Rect } from 'react-native-svg'
import { useCameraDevices } from 'react-native-vision-camera'
import { Camera } from 'react-native-vision-camera'
import { useScanBarcodes, BarcodeFormat } from 'vision-camera-code-scanner'

import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { useDeviceStateStore } from '../utils/deviceStateStore'

function CameraFrame() {
  return (
    <Svg height="100%" width="100%">
      <Defs>
        <Mask id="mask" x="0" y="0" height="100%" width="100%">
          <Rect height="100%" width="100%" fill="white" opacity="0" />
          <Rect x="18%" y="30%" height="250" width="250" />
        </Mask>
      </Defs>

      {/* Frame Border */}
      <Rect
        x="18%"
        y="30%"
        height="250"
        width="250"
        stroke="white"
        strokeWidth="5"
        fill="transparent" // Add this line to make the rectangle transparent
      />
    </Svg>
  )
}

export const QRScan = () => {
  const navigation =
    useNavigation<TOTPStackScreenProps<'QRScan'>['navigation']>()
  const deviceState = useDeviceStateStore((state) => state)
  const [hasPermission, setHasPermission] = React.useState(false)
  const devices = useCameraDevices()
  const cameraDevice = devices.back

  const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.QR_CODE], {
    checkInverted: true
  })

  useEffect(() => {
    if (barcodes && barcodes.length > 0) {
      //FIX: we should have here some kind of validation, that the scanned code is a valid TOTP code
      if (barcodes[0].rawValue?.includes('otpauth://totp/')) {
        const barcode = barcodes[0]
        const parsedQuery = queryString.parseUrl(barcode.rawValue as string)
        const secret = parsedQuery.query.secret as string

        const unencryptedData = {
          secret: secret,
          url: '',
          label:
            (parsedQuery.query.issuer as string) ??
            decodeURIComponent(parsedQuery.url.replace('otpauth://totp/', '')),
          iconUrl: '',
          digits: 6,
          period: 30
        }

        ;(async () => {
          await deviceState.addSecrets([
            {
              kind: EncryptedSecretType.TOTP,
              totp: unencryptedData,
              encrypted: await deviceState.encrypt(
                JSON.stringify(unencryptedData)
              ),
              createdAt: new Date().toJSON()
            }
          ])
        })()

        navigation.navigate('TOTPVault')
      }
    }
  }, [barcodes])

  useEffect(() => {
    ;(async () => {
      const status = await Camera.requestCameraPermission()
      setHasPermission(status === 'authorized')
    })()
  }, [])

  if (cameraDevice == null || !hasPermission) return <Loading />

  return (
    <>
      <Camera
        style={StyleSheet.absoluteFill}
        device={cameraDevice}
        isActive={true}
        frameProcessor={frameProcessor}
        frameProcessorFps={5}
        audio={false}
      />
      <CameraFrame />
    </>
  )
}
