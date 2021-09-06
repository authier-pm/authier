# Basic rules of centralized vault

- authier never stores unencrypted data in the cloud-your data is always encrypted using your master password
- your master password is only stored in your master device, never anywhere else.
- master device is the only one capable of editing your stored items without entering master password directly(you can edit it in your vault, but only after entering master password)

## Slave Devices

- each slave device generates it's own password for encrypting data-this is used when you are adding/removing items from your vault
- slave's password is stored in 2 places-on the device itself and on the master device

## When adding passwords or 2fa

- add action item is encrypted with the device password and sent to our cloud
- master device pops up a notification: "Please confirm addition of new password/2fa". It decrypts the message using it's copy of the device password
- after confirmation master device edits the JSON data, encrypts them and backs up on authier cloud

## When removing passwords or 2fa

- item removal action is encrypted and sent to our cloud
- master device pops up a notification: "Please confirm removal of password/2fa". It decrypts the message using it's copy of the device password
- after confirmation master device edits the JSON data, encrypts them and backs up on authier cloud
