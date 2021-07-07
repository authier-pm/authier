'use strict';
import React, { useContext } from 'react';

import { AppRegistry, StyleSheet, Text, TouchableOpacity } from 'react-native';

import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
import { AuthsContext } from '../Providers';
import { useAddDeviceMutation } from './Scan.codegen';
import { NetworkInfo } from 'react-native-network-info';

const Scan = ({ navigation }) => {
  const [addDevice, { data, error }] = useAddDeviceMutation();
  const { setAuths, auths } = useContext(AuthsContext);

  if (error) console.log(`Error! ${error}`);

  const onSuccess = async (e: { data: string }) => {
    if (e.data.search('secret')) {
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
      navigation.navigate('Home');
    } else {
      let ip = await NetworkInfo.getIPV4Address().then((ipv4Address) => {
        return ipv4Address;
      });
      // Save ID to storage
      await addDevice({
        variables: {
          userId: e.data,
          name: 'test',
          firstIpAdress: ip as string,
        },
      });
      console.log(data);
      navigation.navigate('Home');
    }

    console.log(e);
  };

  return (
    <QRCodeScanner
      showMarker={true}
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
