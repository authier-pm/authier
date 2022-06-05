export async function main(event: any): Promise<any> {
  console.log('event 👉', event)

  return {
    body: JSON.stringify({ message: 'Successful lambda invocation' }),
    statusCode: 200
  }
}
