import { Stack, StackProps } from 'aws-cdk-lib'

import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as path from 'path'
import * as cdk from 'aws-cdk-lib'
import dotenv from 'dotenv'
import { Architecture } from 'aws-cdk-lib/aws-lambda'

export class AwsCdkAuthierStack extends Stack {
  constructor(scope: cdk.App, id: string, props?: StackProps) {
    super(scope, id, props)
    dotenv.config()

    const backendApi = new lambda.Function(this, 'backend-api', {
      memorySize: 512,
      timeout: cdk.Duration.seconds(40),
      runtime: lambda.Runtime.NODEJS_16_X,
      architecture: Architecture.ARM_64,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist')),
      environment: {
        NODE_ENV: 'production',
        FRONTEND_URL: 'https://www.authier.pm',
        // DEBUG: 'au:*',
        ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
        REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
        COOKIE_SECRET: process.env.COOKIE_SECRET as string,
        DATABASE_URL: process.env.DATABASE_URL as string,
        FREE_GEOIP_API_KEY: process.env.FREE_GEOIP_API_KEY as string,
        SENTRY_DSN: process.env.SENTRY_DSN as string,
        MJ_APIKEY_PUBLIC: process.env.MJ_APIKEY_PUBLIC as string,
        MJ_APIKEY_PRIVATE: process.env.MJ_APIKEY_PRIVATE as string
      }
    })

    backendApi.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,

      cors: {
        // Allow this to be called from websites on https://example.com.
        // Can also be ['*'] to allow all domain.
        allowedOrigins: ['*']
      }
    })
  }
}
