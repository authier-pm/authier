export enum BackgroundMessageType {
  getFallbackUsernames = 'getFallbackUsernames',
  rerenderViews = 'rerenderViews',
  wasClosed = 'wasClosed',
  startCount = 'startCount',
  loggedIn = 'loggedIn',
  passwords = 'passwords',
  securitySettings = 'securitySettings',
  giveSecuritySettings = 'giveSecuritySettings',
  giveUISettings = 'giveUISettings',
  UISettings = 'UISettings',
  addLoginCredentials = 'addLoginCredentials',
  addTOTPSecret = 'addTOTPSecret',
  getContentScriptInitialState = 'getContentScriptInitialState',
  hideLoginCredentialsModal = 'hideLoginCredentialsModal',
  saveLoginCredentialsModalShown = 'saveLoginCredentialsModalShown'
}
