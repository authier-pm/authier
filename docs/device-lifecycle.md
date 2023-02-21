# Non master device

1. GQL `{login}`
   - API token created
2. GQL `mutation userAddDevice { user { addDevice(deviceId: $deviceId) } }`
   - returns all of the secrets
3. GQL `device($deviceId) {encryptedSecretsToSync}` (in regular intervals or on user button click)
   - syncs only changed secrets from the date of last sync, not all
4. GQL `logout`
   - device is kept as archived. User can log in again, but they will have to approve on master again. If they try to log in with another username within 24 hours of the logout and they are not on paid account, error is thrown telling them we do not allow multiple accounts for unpaid users on the same device.
