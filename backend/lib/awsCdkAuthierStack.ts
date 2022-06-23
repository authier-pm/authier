import { Stack, StackProps } from 'aws-cdk-lib'

import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as path from 'path'
import * as cdk from 'aws-cdk-lib'
import dotenv from 'dotenv'
import { Architecture } from 'aws-cdk-lib/aws-lambda'

const { parsed: parsedDotenv } = dotenv.config({
  path: '.env.production'
})

export class AwsCdkAuthierStack extends Stack {
  constructor(scope: cdk.App, id: string, props?: StackProps) {
    super(scope, id, props)

    const backendApi = new lambda.Function(this, 'backend-api', {
      memorySize: 512,
      timeout: cdk.Duration.seconds(40),
      runtime: lambda.Runtime.NODEJS_16_X,
      architecture: Architecture.ARM_64,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist')),
      environment: {
        ...parsedDotenv
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
