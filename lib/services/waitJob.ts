import { Stack } from 'aws-cdk-lib';
import { Wait, WaitTime } from 'aws-cdk-lib/aws-stepfunctions';

export const WaitJob = (stack: Stack) => {
  return new Wait(stack, 'Wait X Seconds', {
    time: WaitTime.secondsPath('$.waitSeconds'),
  });
};

/*

"Wait X Seconds" is what we see in the diagram
we can find the number of seconds inside the "waitSeconds"
the waitSeconds-key is inside the {} we receive from the previous Task which is the submitTask

The waitJob is triggered by the submitTask. A task is always connected to a lambda. The submitTask passes down: 

return {
    pid, // payment intender id
    user, // is the user logged in boolean (otherwise we have iam user = guest user)
    identity, // sub of the user = kinda like uuid or anonymous when we have guest user --> type = string
    validatePrice, // price of the products
    products, // array with all the products
    //
    // add 2 extra fields
    retries: 0,
    waitSeconds: Number(process.env.WAIT_SECONDS), // process.env is always string so convert to Number
  };

*/
