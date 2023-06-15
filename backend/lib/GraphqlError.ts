export class GraphqlError extends Error {
  statusCode: number
  constructor(message: string) {
    super(message)
    this.statusCode = 200
  }
}

export class GraphqlErrorUnauthorized extends GraphqlError {
  constructor(message: string) {
    super(message)
    this.statusCode = 401
  }
}
