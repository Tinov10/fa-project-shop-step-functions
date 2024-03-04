import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';

// import { NagSuppressions } from 'cdk-nag';

import { IStackProps } from '../bin/types';

import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Key } from 'aws-cdk-lib/aws-kms';

import {
  Lambda,
  Task,
  FailedJob,
  WaitJob,
  Definition,
  StateMachine,
} from './services';

export class StepFunctionsStack extends Stack {
  constructor(scope: Construct, id: string, props: IStackProps) {
    super(scope, id, props);

    const ordersTable = Table.fromTableName(
      this,
      'OrdersTable',
      props.finalize.env.ORDERS_TABLE_NAME
    );

    const usersTable = Table.fromTableName(
      this,
      'CustomerTable',
      props.finalize.env.CUSTOMER_TABLE_NAME
    );

    const ordersKey = Key.fromKeyArn(this, 'OrdersKey', props.ordersKeyArn);
    const usersKey = Key.fromKeyArn(this, 'UsersKey', props.usersKeyArn);

    // create lambdas

    const submitLambda = Lambda(this, {
      name: props.submit.name,
      entry: props.submit.entry, // passing down the general stack props
      env: props.submit.env,
    });

    const statusLambda = Lambda(this, {
      name: props.status.name,
      entry: props.status.entry, // passing down the general stack props
      env: props.status.env,
    });

    const finalizeLambda = Lambda(this, {
      name: props.finalize.name,
      entry: props.finalize.entry, // passing down the general stack props
      env: props.finalize.env,
    });

    //

    ordersTable.grantWriteData(finalizeLambda);
    usersTable.grantWriteData(finalizeLambda);

    ordersKey.grantEncryptDecrypt(finalizeLambda);
    usersKey.grantEncryptDecrypt(finalizeLambda);

    //

    const submitTask = Task(this, {
      name: 'SubmitTask',
      lambdaFunction: submitLambda,
    });

    const statusTask = Task(this, {
      name: 'StatusTask',
      lambdaFunction: statusLambda,
    });

    const finalizeTask = Task(this, {
      name: 'FinalizeTask',
      lambdaFunction: finalizeLambda,
    });

    //

    const waitJob = WaitJob(this);

    const failedJob = FailedJob(this);

    //

    const definition = Definition(this, {
      submitTask,
      waitJob,
      statusTask,
      failedJob,
      finalizeTask,
    });

    StateMachine(this, { definition });
  }
}
