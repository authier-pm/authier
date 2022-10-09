import awsLambdaFastify from '@fastify/aws-lambda'
import { app } from './app'

export const handler = awsLambdaFastify(app)
