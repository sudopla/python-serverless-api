/**
 * This dashboard is inspired from https://github.com/cdk-patterns/serverless/tree/main/the-cloudwatch-dashboard
 */

import {
  aws_cloudwatch as cloudwatch,
  Duration,
  aws_sns as sns,
  aws_cloudwatch_actions as cloudwatch_actions,
  aws_ssm as ssm
} from 'aws-cdk-lib'
import { Construct } from 'constructs'

export interface MonitoringProps {
  tableName: string,
  apiName: string
}

export class Monitoring extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringProps) {
    super(scope, id)

    // Required SSM parameters
    const apiId = ssm.StringParameter.valueForStringParameter(this, `/${props.apiName}/API_ID`)

    // Util functions
    const createMetric = (
      namespace: string,
      metricName: string,
      dimensionsMap: {[key: string]: string},
      label: string,
      statistic: string = 'sum',
      period: Duration = Duration.seconds(180)
    ): cloudwatch.Metric => {
      return new cloudwatch.Metric({
        namespace: namespace,
        metricName: metricName,
        dimensionsMap,
        label,
        statistic,
        period
      })
    }

    /**
     * Define Metrics
     */
    const apiRequestsMetric = createMetric('AWS/ApiGateway', 'Count', { ApiId: apiId }, '# Requests')
    const apiClientErrorsMetric = createMetric('AWS/ApiGateway', '4XXError', { ApiId: apiId }, '4XX Errors')
    const apiServerErrorsMetric = createMetric('AWS/ApiGateway', '5XXError', { ApiId: apiId }, '5XX Errors')
    const apiLatencyP50 = createMetric('AWS/ApiGateway', 'Latency', { ApiId: apiId }, 'API GW Latency', 'p50')
    const apiLatencyP90 = createMetric('AWS/ApiGateway', 'Latency', { ApiId: apiId }, 'API GW Latency', 'p90')
    const apiLatencyP99 = createMetric('AWS/ApiGateway', 'Latency', { ApiId: apiId }, 'API GW Latency', 'p90')
    const apiGateway4xxErrorPercentage = new cloudwatch.MathExpression({
      expression: 'm1/m2*100',
      label: '% API Gateway 4xx Errors',
      usingMetrics: {
        m1: apiClientErrorsMetric,
        m2: apiRequestsMetric
      },
      period: Duration.minutes(3)
    })

    const dynamoWriteThrottle = createMetric('AWS/DynamoDB', 'WriteThrottleEvents', { TableName: props.tableName }, 'DynamoDB Write  Throttles')
    const dynamoReadThorttle = createMetric('AWS/DynamoDB', 'ReadThrottleEvents', { TableName: props.tableName }, 'DynamoDB Write  Throttles')
    const dynamoDBTotalThrottles = new cloudwatch.MathExpression({
      expression: 'm1 + m2',
      label: 'DynamoDB Throttles',
      usingMetrics: {
        m1: dynamoWriteThrottle,
        m2: dynamoReadThorttle
      },
      period: Duration.minutes(3)
    })
    const dynamoTotalErrors = new cloudwatch.MathExpression({
      expression: 'm1 + m2',
      label: 'DynamoDB Errors',
      usingMetrics: {
        m1: createMetric('AWS/DynamoDB', 'UserErrors', { TableName: props.tableName }, 'DynamoDB User Errors'),
        m2: createMetric('AWS/DynamoDB', 'SystemErrors', { TableName: props.tableName }, 'DynamoDB System Errors')
      }
    })
    const dynamoConsumedReadCapacity = createMetric('AWS/DynamoDB', 'ConsumedReadCapacityUnits', { TableName: props.tableName }, 'DynamoDB Consumed Read Capacity Units')
    const dynamoConsumedWriteCapacity = createMetric('AWS/DynamoDB', 'ConsumedWriteCapacityUnits', { TableName: props.tableName }, 'DynamoDB Consumed Write Capacity Units')

    /**
     * Alarms
     */
    const alarmTopic = new sns.Topic(this, 'AlarmTopic')

    // API
    new cloudwatch.Alarm(this, 'API Gateway 4XX Errors > 1%', {
      metric: apiGateway4xxErrorPercentage,
      threshold: 1,
      evaluationPeriods: 5,
      datapointsToAlarm: 1
    }).addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic))

    new cloudwatch.Alarm(this, 'API Gateway 5XX Errors > 0', {
      metric: apiServerErrorsMetric,
      threshold: 0,
      evaluationPeriods: 5,
      datapointsToAlarm: 1
    }).addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic))

    new cloudwatch.Alarm(this, 'API p99 latency alarm >= 1s', {
      metric: apiLatencyP99,
      threshold: 1000,
      evaluationPeriods: 5,
      datapointsToAlarm: 1
    }).addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic))

    // DynamoDB
    new cloudwatch.Alarm(this, 'DynamoDB Table Reads/Writes Throttled', {
      metric: dynamoDBTotalThrottles,
      threshold: 1,
      evaluationPeriods: 5,
      datapointsToAlarm: 1
    }).addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic))

    new cloudwatch.Alarm(this, 'DynamoDB Errors', {
      metric: dynamoTotalErrors,
      threshold: 1,
      evaluationPeriods: 5,
      datapointsToAlarm: 1
    }).addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic))


    /**
     * CloudWatch Dashboard
     */
    new cloudwatch.Dashboard(this, 'ApiDashboard', {
      dashboardName: `${props.apiName}-Dashboard`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Requests',
            left: [apiRequestsMetric],
            width: 8
          }),
          new cloudwatch.GraphWidget({
            title: 'API GW Errors',
            left: [apiClientErrorsMetric, apiServerErrorsMetric],
            stacked: true
          }),
          new cloudwatch.GraphWidget({
            title: 'API GW Latency',
            left: [apiLatencyP50, apiLatencyP90, apiLatencyP99],
            stacked: true
          }),
          new cloudwatch.GraphWidget({
            title: 'DynamoDB Throttle',
            left: [dynamoWriteThrottle, dynamoReadThorttle]
          }),
          new cloudwatch.GraphWidget({
            title: 'DynamoDB Consumed Read/Write Units',
            left: [dynamoConsumedWriteCapacity, dynamoConsumedReadCapacity]
          })
        ]
      ]
    })

  }
}
