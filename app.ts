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

// Http Api + Monitoring Stack
const httpApiStack = new Stack(app, `${appName}-Stack`, {
  description: 'API Stack',
  env: awsEnv
})
const api = new Api(httpApiStack, 'Api', {
  apiName: appName,
  tableName
})
const monitoring = new Monitoring(httpApiStack, 'Monitoring', {
  tableName,
  apiName: appName
})
monitoring.node.addDependency(api)

// Define Deployment Pipeline
new DeploymentPipeline(app, `${appName}-Pipeline-Stack`, {
  awsEnv,
  pipelineName: `${appName}-Pipeline`,
  stackNames: ['TableStack', 'ApiStack']
})