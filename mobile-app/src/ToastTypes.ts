export const ToastType = {
  NetworkError: {
    title: 'Something went wrong',
    variant: 'subtle',
    description: 'Please create a support ticket from the support page',
    status: 'warning'
  },
  UsernamePasswordError: {
    title: 'Login failed',
    description: 'Login failed, check your email or password',
    variant: 'subtle',
    status: 'warning'
  },
  DecryptionChallengeError: {
    title: 'Login failed',
    description: 'Failed to create decryption challenge',
    variant: 'subtle',
    status: 'warning'
  },
  LoginFailed: {
    title: 'Login failed',
    description: 'Login failed, check your password',
    variant: 'subtle',
    status: 'warning'
  }
}
