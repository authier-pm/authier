export const ToastType = {
  NetworkError: {
    title: 'Something went wrong',
    variant: 'subtle',
    description: 'Please create a support ticket from the support page',
    status: 'warning'
  },
  UsernamePasswordError: {
    title: 'Login failed',
    description: 'login failed, check your username and password',
    variant: 'subtle',
    status: 'warning'
  },
  DecryptionChallengeError: {
    title: 'Login failed',
    description: 'failed to create decryption challenge',
    variant: 'subtle',
    status: 'warning'
  },
  EmailPasswordError: {
    title: 'Login failed',
    description: 'wrong password or email',
    variant: 'subtle',
    status: 'warning'
  },
  LoginFailed: {
    title: 'Login failed',
    description: 'login failed, check your password',
    variant: 'subtle',
    status: 'warning'
  }
}
