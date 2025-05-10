import React, { useState } from 'react'
import { Modal, Button, Icon, Input, FormControl } from 'native-base'
import Ionicons from 'react-native-vector-icons/Ionicons'
import SInfo from 'react-native-sensitive-info'
import { useDeviceStateStore } from '../utils/deviceStateStore'
import {
  base64ToBuffer,
  dec,
  generateEncryptionKey
} from '../utils/generateEncryptionKey'

import { Formik, FormikHelpers } from 'formik'

interface Values {
  password: string
}
export function PasswordReEnter({
  modalVisible,
  setModalVisible
}: {
  modalVisible: boolean
  setModalVisible: (visible: boolean) => void
}) {
  const [showPassword, setShowPassword] = useState(false)
  const deviceState = useDeviceStateStore((state) => state)

  return (
    <>
      <Modal
        isOpen={modalVisible}
        onClose={() => setModalVisible(false)}
        size="md"
      >
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Re-enter master password</Modal.Header>
          <Formik
            initialValues={{ password: '' }}
            onSubmit={async (
              values: Values,
              { setSubmitting, setFieldError }: FormikHelpers<Values>
            ) => {
              try {
                const masterEncryptionKey = await generateEncryptionKey(
                  values.password,
                  base64ToBuffer(deviceState.encryptionSalt)
                )

                const encryptedDataBuff = base64ToBuffer(
                  deviceState.authSecretEncrypted
                )
                if (encryptedDataBuff.length < 29) {
                  throw new Error('encryptedDataBuff is too small')
                }
                const iv = encryptedDataBuff.slice(16, 16 + 12)
                const data = encryptedDataBuff.slice(16 + 12)

                const decryptedContent = await self.crypto.subtle.decrypt(
                  { name: 'AES-GCM', iv },
                  masterEncryptionKey,
                  data
                )

                const currentAddDeviceSecret = dec.decode(decryptedContent)

                if (currentAddDeviceSecret !== deviceState.authSecret) {
                  throw new Error(`Incorrect password`)
                }
                await SInfo.setItem('psw', values.password, {
                  sharedPreferencesName: 'authierShared',
                  keychainService: 'authierKCH',
                  touchID: true,
                  showModal: true,
                  kSecAccessControl: 'kSecAccessControlBiometryAny'
                })
                deviceState.changeBiometricsEnabled(true)
                setModalVisible(false)
                setSubmitting(false)
              } catch (error: any) {
                setFieldError('password', 'Wrong password, try again.')
              }
            }}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              isSubmitting,
              errors
            }) => (
              <>
                <Modal.Body>
                  <FormControl isRequired isInvalid={'password' in errors}>
                    <Input
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                      InputRightElement={
                        <Icon
                          as={
                            <Ionicons
                              name={
                                showPassword ? 'eye-outline' : 'eye-off-outline'
                              }
                              color="grey"
                            />
                          }
                          size={5}
                          mr="2"
                          color="muted.400"
                          onPress={() => setShowPassword(!showPassword)}
                        />
                      }
                      type={showPassword ? 'text' : 'password'}
                    />

                    <FormControl.ErrorMessage>
                      {errors.password}
                    </FormControl.ErrorMessage>
                  </FormControl>
                </Modal.Body>
                <Modal.Footer>
                  <Button.Group space={2}>
                    <Button
                      variant="ghost"
                      colorScheme="blueGray"
                      onPress={() => {
                        setModalVisible(false)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      isLoading={isSubmitting}
                      onPress={handleSubmit as (values: any) => void}
                    >
                      Save
                    </Button>
                  </Button.Group>
                </Modal.Footer>
              </>
            )}
          </Formik>
        </Modal.Content>
      </Modal>
    </>
  )
}
