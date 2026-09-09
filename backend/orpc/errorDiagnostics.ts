/** Log stack locations and error types without SQL parameters, inputs, or validation values. */
export const describeApiError = (error: unknown, depth = 0): unknown => {
  if (!(error instanceof Error)) return { name: 'UnknownError' }
  return {
    name: error.name,
    ...(error instanceof DOMException ? { message: error.message } : {}),
    stack: error.stack
      ?.split('\n')
      .filter((line) => /^\s+at /.test(line))
      .slice(0, 12),
    ...(error.cause && depth < 3
      ? { cause: describeApiError(error.cause, depth + 1) }
      : {})
  }
}
