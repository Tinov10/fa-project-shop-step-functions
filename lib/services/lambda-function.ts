import { Stack, Duration } from 'aws-cdk-lib';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

interface ILambdaProps {
  name: string;
  entry: string;
  env: { [key: string]: string };
}

export const Lambda = (stack: Stack, props: ILambdaProps) => {
  const lambda = new NodejsFunction(stack, props.name, {
    // bel
    bundling: {
      minify: true,
      sourceMap: true,
      target: 'es2020',
    },
    entry: props.entry,
    logRetention: RetentionDays.ONE_MONTH,
    // met
    memorySize: 1024,
    environment: props.env,
    timeout: Duration.seconds(60),
    // hr
    handler: 'index/handler',
    runtime: Runtime.NODEJS_18_X,
    // functionName :)
    functionName: props.name,
  });

  const cloudWatchPolicy = new PolicyStatement({
    actions: ['cloudwatch:PutMetricData'],
    effect: Effect.ALLOW,
    resources: ['*'],
  });

  lambda.addToRolePolicy(cloudWatchPolicy);

  return lambda;
};
