import { Stack, StackProps } from 'aws-cdk-lib'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as path from 'path'
import * as cdk from 'aws-cdk-lib'
import dotenv from 'dotenv'

const { parsed: parsedDotenv } = dotenv.config({
  path: '.env.production'
})

export class AwsCdkAuthierStack extends Stack {
  constructor(scope: cdk.App, id: string, props?: StackProps) {
    super(scope, id, props)

    const backendApi = new NodejsFunction(this, 'backend-api', {
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'main',
      entry: path.join(__dirname, `../lambda.ts`),
      bundling: {
        minify: false,
        externalModules: ['aws-sdk']
      },
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
