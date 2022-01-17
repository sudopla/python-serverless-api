import {
  Stack,
  aws_codepipeline as codepipeline,
  aws_codepipeline_actions as codepipeline_actions,
  aws_codebuild as codebuild,
  aws_iam as iam,
  aws_ssm as ssm
} from 'aws-cdk-lib'
import { Construct } from 'constructs'

export interface DeploymentPipelineProps {
  awsEnv: { account: string, region: string },
  repoOwner: string,
  repoName: string,
  pipelineName: string,
  stackNames: string[]
}

export class DeploymentPipeline extends Stack {
  constructor(scope: Construct, id: string, props: DeploymentPipelineProps) {
    super(scope, id, {
      env: props.awsEnv,
      description: `${props.pipelineName} Deployment Pipeline`
    })

    const sourceArtifact = new codepipeline.Artifact()

    // CodeBuild role to deploy CDK stacks
    const codeBuildRole = new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com')
    })
    // Restrict these policies later
    codeBuildRole.addToPolicy(new iam.PolicyStatement({
      resources: ['*'],
      actions: ['*']
    }))

    new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: props.pipelineName,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeStarConnectionsSourceAction({
              actionName: 'GithubSource',
              owner: props.repoOwner,
              repo: props.repoName,
              branch: 'main',
              connectionArn: ssm.StringParameter.valueForStringParameter(this, 'Github-Connection'),
              output: sourceArtifact
            })
          ]
        },
        {
          stageName: 'DeployApp',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'DeployCdkStacks',
              input: sourceArtifact,
              project: new codebuild.PipelineProject(this, 'CodeBuildDeployProject', {
                role: codeBuildRole,
                environment: {
                  buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
                  privileged: true, // true to enable docker,
                  environmentVariables: {
                    AWS_ACCOUNT: {
                      value: props.awsEnv.account
                    },
                    AWS_REGIONS: {
                      value: props.awsEnv.region
                    }
                  }
                },
                buildSpec: codebuild.BuildSpec.fromObject({
                  version: '0.2',
                  phases: {
                    install: {
                      commands: [
                        'npm install'
                      ]
                    },
                    build: {
                      commands: [
                        `npm run cdk -- deploy ${props.stackNames.join(' ')} --require-approval never`
                      ]
                    }
                  }
                })
              }),
              runOrder: 1
            }),
            new codepipeline_actions.CodeBuildAction({
              actionName: 'RunIntegrationTests',
              input: sourceArtifact,
              project: new codebuild.PipelineProject(this, 'CodeBuildTestsProject', {
                role: codeBuildRole,
                environment: {
                  buildImage: codebuild.LinuxBuildImage.STANDARD_5_0
                },
                buildSpec: codebuild.BuildSpec.fromObject({
                  version: '0.2',
                  phases: {
                    install: {
                      'runtime-versions': { python: 3.9 },
                      'commands': [
                        'apt-get update -y',
                        'pip install --no-cache-dir -r requirements.txt'
                      ]
                    },
                    build: {
                      commands: [
                        'python -m pytest tests/integration'
                      ]
                    }
                  }
                })
              }),
              type: codepipeline_actions.CodeBuildActionType.TEST,
              runOrder: 2
            })
          ]
        }
      ]
    })
  }
}