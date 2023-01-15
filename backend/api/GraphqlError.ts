export class GraphqlError extends Error {
  statusCode: number
  constructor(message: string) {
    super(message)
    this.statusCode = 200
  }
}
