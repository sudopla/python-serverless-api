import { spawnSync } from 'child_process'
import * as path from 'path'
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha'
import * as apigatewayv2Integration from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import * as pythonLambda from '@aws-cdk/aws-lambda-python-alpha'
import { Stack, aws_lambda as lambda, aws_iam as iam, aws_apigatewayv2 as apigatewayv2Cfn, aws_ssm as ssm } from 'aws-cdk-lib'
import { Construct } from 'constructs'

export interface ApiProps {
  apiName: string,
  apiDescription?: string,
  tableName: string
}

export class Api extends Construct {
  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id)

    /**
     * Global variables for construct
     */
    const region = Stack.of(this).region
    const account = Stack.of(this).account
    const tableResources = [
      `arn:aws:dynamodb:${region}:${account}:table/${props.tableName}`,
      `arn:aws:dynamodb:${region}:${account}:table/${props.tableName}/index/*`
    ]

    /**
     * Utils Functions
     */
    // CDK currently does not support AWS_IAM Authentications in L2 construct
    const addRoute = (
      httpApi: apigatewayv2.HttpApi,
      route_path: string,
      lambdaTarget: lambda.Function,
      httpMethod: apigatewayv2.HttpMethod): void => {

      const lambdaIntegration = new apigatewayv2Integration.HttpLambdaIntegration('Integration', lambdaTarget)

      const route = httpApi.addRoutes({
        path: `/${route_path}`,
        methods: [httpMethod],
        integration: lambdaIntegration
      })
      const routeCfn = route[0].node.defaultChild as apigatewayv2Cfn.CfnRoute
      routeCfn.authorizationType = 'AWS_IAM'
    }

    /**
     * ApiGateway - HTTP API + Lambdas
     */
    const httpApi = new apigatewayv2.HttpApi(this, 'HttpApiGateway', {
      apiName: props.apiName,
      description: props.apiDescription,
      createDefaultStage: true // a default stage and deployment will be automatically created
    })

    // Store HTTP API ID and URL in SSM parameter (Used by other applications to connect to this API)
    new ssm.StringParameter(this, 'API-URL-Parameter', {
      parameterName: `/${props.apiName}/API_URL`,
      stringValue: httpApi.url || '',
      description: `${props.apiName} API URL`
    })
    new ssm.StringParameter(this, 'API-ID-Parameter', {
      parameterName: `/${props.apiName}/API_ID`,
      stringValue: httpApi.apiId,
      description: `${props.apiName} API ID`
    })

    // Lambda Layer for API utils. Create folder with proper layer structure first
    const utilsDir = path.join(__dirname, 'utils_layer')
    const utilsLayerDir = path.join(__dirname, '..', 'tmp', 'utils_layer', 'python')
    spawnSync('mkdir', ['-p', utilsLayerDir])
    spawnSync('cp', ['-r', utilsDir, utilsLayerDir])

    const lambdaLayer = new lambda.LayerVersion(this, 'LambdaUtilsLayer', {
      layerVersionName: 'CSILayer',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'tmp', 'utils_layer')),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_9]
    })

    // Endpoints for Resource item
    const createItemLambda = new pythonLambda.PythonFunction(this, 'CreateItemLambda', {
      functionName: 'CreateItemLambda',
      entry: path.join(__dirname, 'Item', 'CreateItem'),
      index: 'lambda_handler.py',
      runtime: lambda.Runtime.PYTHON_3_9,
      layers: [lambdaLayer],
      environment: {
        TABLE_NAME: props.tableName
      }
    })
    createItemLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:PutItem'],
      resources: tableResources
    }))
    addRoute(httpApi, 'item', createItemLambda, apigatewayv2.HttpMethod.POST)

    const updateItemLambda = new pythonLambda.PythonFunction(this, 'UpdateItemLambda', {
      functionName: 'UpdateItemLambda',
      entry: path.join(__dirname, 'Item', 'UpdateItem'),
      index: 'lambda_handler.py',
      runtime: lambda.Runtime.PYTHON_3_9,
      layers: [lambdaLayer],
      environment: {
        TABLE_NAME: props.tableName
      }
    })
    updateItemLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:UpdateItem'],
      resources: tableResources
    }))
    addRoute(httpApi, 'item', updateItemLambda, apigatewayv2.HttpMethod.PATCH)

    const getItemLambda = new pythonLambda.PythonFunction(this, 'GetItemLambda', {
      functionName: 'GetItemLambda',
      entry: path.join(__dirname, 'Item', 'GetItem'),
      index: 'lambda_handler.py',
      runtime: lambda.Runtime.PYTHON_3_9,
      layers: [lambdaLayer],
      environment: {
        TABLE_NAME: props.tableName
      }
    })
    getItemLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:GetItem', 'dynamodb:Query'],
      resources: tableResources
    }))
    addRoute(httpApi, 'item/{album_name}', getItemLambda, apigatewayv2.HttpMethod.GET)

    const deleteItemLambda = new pythonLambda.PythonFunction(this, 'DeleteItemLambda', {
      functionName: 'DeleteItemLambda',
      entry: path.join(__dirname, 'Item', 'DeleteItem'),
      index: 'lambda_handler.py',
      runtime: lambda.Runtime.PYTHON_3_9,
      layers: [lambdaLayer],
      environment: {
        TABLE_NAME: props.tableName
      }
    })
    deleteItemLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:DeleteItem'],
      resources: tableResources
    }))
    addRoute(httpApi, 'item/{album_name}', deleteItemLambda, apigatewayv2.HttpMethod.DELETE)

  }
}
