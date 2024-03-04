import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandOutput,
  UpdateCommand,
  UpdateCommandOutput,
} from '@aws-sdk/lib-dynamodb';

import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';

import { v4 as uuidv4 } from 'uuid';
import { IFinalizeEvent } from '../../bin/types';

import { createPutCommand } from './utils/put-order-command';
import { createUpdateCommand } from './utils/update-account-command';
import { cloudwatchEvent } from './utils/handle-cw-event';

let dynamoDBClient: DynamoDBDocumentClient;
let cloudWatchClient: CloudWatchClient;

export const finalizeHandler = async (event: IFinalizeEvent) => {
  try {
    if (!dynamoDBClient)
      dynamoDBClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

    if (!cloudWatchClient) cloudWatchClient = new CloudWatchClient({});

    const orderId = uuidv4();
    const orderDate = new Date().toISOString();

    // deconstructure
    const {
      pid,
      validatedPrice,
      identity,
      receiptEmail,
      products,
      shipping,
      user,
    } = event;

    const putCommand: PutCommand = createPutCommand({
      pid,
      validatedPrice,
      identity,
      receiptEmail,
      products,
      shipping,
      //
      orderId,
      orderDate,
    });

    const putCommandOutput: PutCommandOutput = await dynamoDBClient.send(
      putCommand
    );

    // we only have a user when we have a Cognito user (not IAM = guest)
    if (user) {
      const updateCommand: UpdateCommand = createUpdateCommand({
        // no pid,
        validatedPrice,
        identity,
        // no receiptEmail
        products,
        //
        orderId,
        orderDate,
      });

      const updateCommandOutput: UpdateCommandOutput =
        await dynamoDBClient.send(updateCommand);
    }
  } catch (err) {
    console.error(err);

    // send to CloudWatch
    cloudwatchEvent({
      metricName: 'FailedPaymentFinalizationMetrics',
      pid: event.pid,
      cloudWatchClient,
    });
  }
};
