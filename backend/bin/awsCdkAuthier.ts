#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { AwsCdkAuthierStack } from '../lib/awsCdkAuthierStack'

const app = new cdk.App()
new AwsCdkAuthierStack(app, 'AuthierBackendStack')
