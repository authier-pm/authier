// Custom password strength function
export const evaluatePasswordStrength = (password: string) => {
  if (!password) return { id: 0, value: 'Too weak' }

  const length = password.length
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password)

  const variationCount = [hasLower, hasUpper, hasNumber, hasSpecialChar].filter(
    Boolean
  ).length

  if (length > 14) {
    return { id: 3, value: 'Very strong', color: 'green' }
  }

  if (length < 8) {
    return { id: 0, value: 'Too weak', color: 'red' }
  } else if (length < 10 || variationCount < 2) {
    return { id: 1, value: 'Weak', color: 'orange' }
  } else if (length < 12 || variationCount < 3) {
    return { id: 2, value: 'Medium', color: 'yellow' }
  } else {
    return { id: 3, value: 'Strong', color: 'green' }
  }
}
