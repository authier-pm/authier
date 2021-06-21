'use strict';
import React, { useContext } from 'react';

import { AppRegistry, StyleSheet, Text, TouchableOpacity } from 'react-native';

import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
import { AuthsContext } from '../Providers';

const Scan = ({ navigation }) => {
  const { setAuths, auths } = useContext(AuthsContext);

  const onSuccess = (e: { data: string }) => {
    const qrDataParts = e.data.split('?secret=');
    setAuths([
      {
        secret: qrDataParts[1],
        icon: 'test',
        label: decodeURIComponent(
          qrDataParts[0].replace('otpauth://totp/', '')
        ),
      },
      ...auths,
    ]);
    navigation.navigate('AuthList');
    console.log(e);
  };

  return (
    <QRCodeScanner
      onRead={onSuccess}
      //@ts-ignore
      flashMode={RNCamera.Constants.FlashMode.auto}
      topContent={
        <Text style={styles.centerText}>
          Go to <Text style={styles.textBold}>wikipedia.org/wiki/QR_code</Text>{' '}
          on your computer and scan the QR code.
        </Text>
      }
      bottomContent={
        <TouchableOpacity style={styles.buttonTouchable}>
          <Text style={styles.buttonText}>OK. Got it!</Text>
        </TouchableOpacity>
      }
    />
  );
};

const styles = StyleSheet.create({
  centerText: {
    flex: 1,
    fontSize: 18,
    padding: 32,
    color: '#777',
  },
  textBold: {
    fontWeight: '500',
    color: '#000',
  },
  buttonText: {
    fontSize: 21,
    color: 'rgb(0,122,255)',
  },
  buttonTouchable: {
    padding: 16,
  },
});

export default Scan;
AppRegistry.registerComponent('default', () => Scan);
