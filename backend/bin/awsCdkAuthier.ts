#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { AwsCdkAuthierStack } from '../cdk/awsCdkAuthierStack'

const app = new cdk.App()
new AwsCdkAuthierStack(app, 'AuthierBackendStack')
