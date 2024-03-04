import { Stack } from 'aws-cdk-lib';
import { Fail } from 'aws-cdk-lib/aws-stepfunctions';

export const FailedJob = (stack: Stack) => {
  return new Fail(stack, 'FailedJob', {
    cause: 'Job Failed',
    error: 'Job Failed',
  });
};

// "FailedJob" is what we see in the diagram
