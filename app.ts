import { App, Stack } from 'aws-cdk-lib'
import { Api } from './api/cdk'
import { DynamoTable } from './database/cdk'
import { Monitoring } from './monitoring/cdk'
import { DeploymentPipeline } from './pipeline/pipeline'
import { getAwsAccount, getAwsRegion } from './utils'

const app = new App() // CDK App

// Get AWS account and region
const awsEnv = { account: getAwsAccount(), region: getAwsRegion() }

// Props
const appName = 'Python-Serverless-API'
const tableName = `${appName}-Table`

// Dynamo Table Stack
const tableStack = new Stack(app, `${tableName}-Stack`, {
  description: 'Table Stack',
  env: awsEnv
})
new DynamoTable(tableStack, 'Table', {
  tableName
})

// Http Api
const httpApiStack = new Stack(app, `${appName}-Stack`, {
  description: 'API Stack',
  env: awsEnv
})
new Api(httpApiStack, 'Api', {
  apiName: appName,
  tableName
})

// Monitoring Stack
const monitoringStack = new Stack(app, `${appName}-Monitoring-Stack`, {
  description: 'Monitoring Stack',
  env: awsEnv
})
monitoringStack.addDependency(httpApiStack)
new Monitoring(monitoringStack, 'Monitoring', {
  tableName,
  apiName: appName
})

// Define Deployment Pipeline
new DeploymentPipeline(app, `${appName}-Pipeline-Stack`, {
  awsEnv,
  pipelineName: `${appName}-Pipeline`,
  stackNames: [`${tableName}-Stack`, `${appName}-Stack`, `${appName}-Monitoring-Stack`]
})