export enum BackgroundMessageType {
  getBackgroundState = 'getBackgroundState',
  setBackgroundState = 'setBackgroundState',
  getFirebaseToken = 'getFirebaseToken',
  wasClosed = 'wasClosed',
  setUserIdAndMasterPassword = 'setUserIdAndMasterPassword',
  startCount = 'startCount',
  loggedIn = 'loggedIn',
  clear = 'clear',
  passwords = 'passwords',
  securitySettings = 'securitySettings',
  giveSecuritySettings = 'giveSecuritySettings',
  giveUISettings = 'giveUISettings',
  UISettings = 'UISettings',
  saveLoginCredentials = 'saveLoginCredentials',
  getLoginCredentialsModalState = 'getLoginCredentialsModalState',
  hideLoginCredentialsModal = 'hideLoginCredentialsModal',
  saveLoginCredentialsModalShown = 'saveLoginCredentialsModalShown'
}
