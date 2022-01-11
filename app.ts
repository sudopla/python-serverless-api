import { App, Stack } from 'aws-cdk-lib'
import { Api } from './api/cdk'
import { DynamoTable } from './database/cdk'
import { DeploymentPipeline } from './pipeline/pipeline'
import { getAwsAccount, getAwsRegion } from './utils'

const app = new App() // CDK App

// Get AWS account and region
const awsEnv = { account: getAwsAccount(), region: getAwsRegion() }

// Props
const tableName = 'app_name_table'
const apiName = 'app_name_api'

// Dynamo Table Stack
const tableStack = new Stack(app, 'TableStack', {
  description: 'Table Stack',
  env: awsEnv
})
new DynamoTable(tableStack, 'Table', {
  tableName
})

// Http Api Stack
const httpApiStack = new Stack(app, 'ApiStack', {
  description: 'API Stack',
  env: awsEnv
})
new Api(httpApiStack, 'Api', {
  apiName,
  tableName
})

// Define Deployment Pipeline
new DeploymentPipeline(app, 'PipelineStack', {
  awsEnv,
  pipelineName: `${apiName}-Pipeline`,
  stackNames: ['TableStack', 'ApiStack']
})