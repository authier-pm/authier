/** Keep form values available and show a failure instead of navigating away. */
export async function submitVaultForm(
  action: () => Promise<unknown>,
  setStatus: (message: string | undefined) => void
) {
  setStatus(undefined)
  return action().then(
    () => true,
    (error: unknown) => {
      setStatus(
        error instanceof Error
          ? error.message
          : 'The item could not be saved. Please try again.'
      )
      return false
    }
  )
}
