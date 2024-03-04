import { Stack } from 'aws-cdk-lib';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Choice, Condition, Wait, Fail } from 'aws-cdk-lib/aws-stepfunctions';

interface IDefenitionProps {
  submitTask: LambdaInvoke;
  waitJob: Wait;
  statusTask: LambdaInvoke;
  failedJob: Fail;
  finalizeTask: LambdaInvoke;
}

export const Definition = (stack: Stack, props: IDefenitionProps) => {
  //
  return props.submitTask
    .next(props.waitJob)
    .next(props.statusTask)
    .next(
      new Choice(stack, 'Job Complete?')
        .when(Condition.stringEquals('$.status', 'CANCELED'), props.failedJob)
        .when(
          Condition.stringEquals('$.status', 'SUCCEEDED'),
          props.finalizeTask
        )
    );
};

/*
    We check what we get from the StatusJobTask what do we find inside the "status"
   
    inside "status" we can find: 
    1) CANCELED
    2) SUCCEEDED
    3) PROCESSING
    
    .when(sfn.Condition.stringEquals('$.status', 'CANCELED'), props.failedJob)

    .when(
      sfn.Condition.stringEquals('$.status', 'SUCCEEDED'),
      props.finalizeTask
    )
    // otherwise is PROCESSING
    .otherwise(props.waitJob);

*/
