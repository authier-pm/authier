import awsLambdaFastify from 'aws-lambda-fastify'
import { app } from './app'

export const handler = awsLambdaFastify(app)
