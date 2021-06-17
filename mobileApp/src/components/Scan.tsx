'use strict';
import React from 'react';

import {
  AppRegistry,
  StyleSheet,
  Text,
  TouchableOpacity,
  Linking,
} from 'react-native';

import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';

const Scan = ({ navigation }) => {
  const onSuccess = (e: { data: string }) => {
    navigation.navigate('Home');
    console.log(e);
    // Linking.openURL(e.data).catch((err) =>
    //   console.error('An error occured', err)
    // );
    console.log(decodeURIComponent(e.data.replace('otpauth://totp/', '')));
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
