import { Stack, StackProps } from 'aws-cdk-lib'

import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as path from 'path'
import * as cdk from 'aws-cdk-lib'

import dotenv from 'dotenv'
import { Architecture } from 'aws-cdk-lib/aws-lambda'
import { Topic } from 'aws-cdk-lib/aws-sns'

export class AwsCdkAuthierStack extends Stack {
  constructor(scope: cdk.App, id: string, props?: StackProps) {
    super(scope, id, props)
    dotenv.config()

    const backendApi = new lambda.Function(this, 'backend-api', {
      memorySize: 512,
      timeout: cdk.Duration.seconds(40),
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: Architecture.ARM_64,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist')),
      tracing: lambda.Tracing.DISABLED, // Xray tracing, useless and costs a lot of money per usage
      environment: {
        NODE_ENV: 'production',
        FRONTEND_URL: 'https://www.authier.pm',
        // DEBUG: 'au:*',
        ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
        REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
        COOKIE_SECRET: process.env.COOKIE_SECRET as string,
        DATABASE_URL: process.env.DATABASE_URL as string,
        SHADOW_DATABASE_URL: process.env.SHADOW_DATABASE_URL as string,
        DIRECT_URL: process.env.DIRECT_URL as string,
        SENTRY_DSN: process.env.SENTRY_DSN as string,
        MJ_APIKEY_PUBLIC: process.env.MJ_APIKEY_PUBLIC as string,
        MJ_APIKEY_PRIVATE: process.env.MJ_APIKEY_PRIVATE as string,
        STRIPE_ENDPOINT: process.env.STRIPE_ENDPOINT as string,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,
        REDIS_URL: process.env.REDIS_URL as string,
        FREE_GEOIP_API_KEY: process.env.FREE_GEOIP_API_KEY as string,
        IP_API_IO_API_KEY: process.env.IP_API_IO_API_KEY as string
      }
    })

    const topic = new Topic(this, 'Alarm topic', {
      displayName: 'Alarm topic'
    })

    if (process.env.AWS_SNS_SUBSCRIPTION_EMAILS) {
      topic.addSubscription(
        new cdk.aws_sns_subscriptions.EmailSubscription('capajj@gmail.com')
      )
    }

    const functionErrors = backendApi.metricErrors({
      period: cdk.Duration.minutes(1)
    })

    // 👇 define an alarm for the metric
    const errorsAlarm = new cdk.aws_cloudwatch.Alarm(this, 'ErrorsAlarm', {
      metric: functionErrors,
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator:
        cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
    })
    errorsAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(topic))

    backendApi.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,

      cors: {
        // Allow this to be called from websites on https://example.com.
        // Can also be ['*'] to allow all domain.
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
        allowCredentials: true
      }
    })
  }
}
