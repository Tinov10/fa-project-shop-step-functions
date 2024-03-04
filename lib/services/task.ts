import { Stack } from 'aws-cdk-lib';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { IFunction } from 'aws-cdk-lib/aws-lambda';

interface ITaskProps {
  name: string;
  lambdaFunction: IFunction;
}

export const Task = (stack: Stack, props: ITaskProps) => {
  //
  return new LambdaInvoke(stack, props.name, {
    lambdaFunction: props.lambdaFunction,
    outputPath: '$.Payload',
  });
};

// we define what we want to return to the stateMachine = only the return of the lambda which is in the Payload key
