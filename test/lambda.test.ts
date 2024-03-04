/* eslint-disable max-lines */

// 1. import all the handlers from src/
import { submitHandler } from '../src/submit';
import { statusHandler } from '../src/status';
import { finalizeHandler } from '../src/finalize';

// 2. mock aws client
import { mockClient } from 'aws-sdk-client-mock'; // we can mock each of the aws services

// 3. get the dynamo client
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// 4. get the document client and the commands / inputs
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
  UpdateCommand,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';

// 5. get the cloudwatchclient and the putmetricdatacommand
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';

// 6. import the fixtures
import {
  submitEvent,
  statusEventRetries0,
  statusEventRetries4,
  finalizeEvent,
  finalizeUpdateInput,
} from './fixtures';

/*
submitEvent is send from the frontend
submitHandler sends statusEvent to the statusHandler
statusHandler checks the status of the payment and if SUCCESS send the finalizeEvent to the finalizeHandler 

*/

/*  Which aws services do we use and HOW do we need to mock? ---> very simple with MockClient()
1.  DynamoDBClient
2.  DynamoDBDocumentClient      what is the difference between the DB-Client and the DB-Document-Client?
3.  CloudWatchClient
*/

// 7. mock the aws services
const ddbMock = mockClient(DynamoDBClient);
const ddbMockClient = mockClient(DynamoDBDocumentClient);
const cwMockClient = mockClient(CloudWatchClient);

/* Which Stripe functions do we use and HOW do we need to mock? 
1.  paymentIntents      stripe.paymentIntents used inside the statusHandler
2.  paymentMethods      stripe.paymentMethods used inside the statusHandler 
*/

// 8. mock stripe
const stripePaymentIntentMock = jest.fn();
const stripePaymentMethodMock = jest.fn();

jest.mock('stripe', () => ({
  paymentIntents: {
    retrieve: stripePaymentIntentMock,
  },
  paymentMethods: {
    retrieve: stripePaymentMethodMock,
  },
}));

// 9. mock uuid
jest.mock('uuid', () => ({
  __esModule: true,
  v4: jest.fn().mockReturnValue('9890809-098989-78676-8787787'),
}));

// 10. Actual tests

describe('Lambda Functions', () => {
  beforeEach(() => {
    jest
      .spyOn(Date.prototype, 'toISOString')
      .mockImplementation(() => '2023-09-43595-45435');
    // add environment variables before each test
    process.env = Object.assign(process.env, {
      WAIT_SECONDS: '150',
      STRIPE_SECRET_KEY: '',
      ORDERS_TABLE_NAME: '',
      CUSTOMER_TABLE_NAME: '',
    });
  });

  afterEach(() => {
    jest.spyOn(Date.prototype, 'toISOString').mockRestore();
    stripePaymentIntentMock.mockReset();
    stripePaymentMethodMock.mockReset();
    ddbMock.reset();
    ddbMockClient.reset();
    cwMockClient.reset();
  });

  describe('Submit Function', () => {
    test.only('Should submit a new order', async () => {
      const result = await submitHandler(submitEvent);
      // the function does something and returns something
      // we expect something back from the functions that looks like:
      expect(result).toEqual({
        ...submitEvent,
        retries: 0,
        waitSeconds: 150,
      });
    });
  });

  describe('Status function', () => {
    [
      // payed
      {
        status: 'succeeded',
        expected: 'SUCCEEDED',
        receiptEmail: '',
        shipping: {},
      },
      // not yet paid
      {
        status: 'processing',
        expected: 'PROCESSING',
        receiptEmail: null,
        shipping: null,
      },
      {
        status: 'requires_action',
        expected: 'PROCESSING',
        receiptEmail: null,
        shipping: null,
      },
      {
        status: 'requires_capture',
        expected: 'PROCESSING',
        receiptEmail: null,
        shipping: null,
      },
      {
        status: 'requires_confirmation',
        expected: 'PROCESSING',
        receiptEmail: null,
        shipping: null,
      },
      {
        status: 'requires_payment_method',
        expected: 'PROCESSING',
        receiptEmail: null,
        shipping: null,
      },
      // something went wrong
      {
        status: 'canceled',
        expected: 'CANCELED',
        receiptEmail: null,
        shipping: null,
      },
    ].map((input) => {
      test(`stripe ${input.status} status`, async () => {
        stripePaymentIntentMock.mockResolvedValueOnce({
          status: input.status,
          shipping: input.shipping,
          paymentMethod: 'paymentMethod',
        });
      });
    });

    test('Should return cancelled status because of max retries', async () => {
      cwMockClient.on(PutMetricDataCommand).resolves({});
      // const result = await statusHandler(statusEvent(4));
      const result = await statusHandler(statusEventRetries4);

      expect(result).toEqual({
        status: 'CANCELLED',
      });
    });

    test('Should return cancelled status because of failed status attempt', async () => {
      stripePaymentIntentMock.mockRejectedValueOnce({});
      cwMockClient.on(PutMetricDataCommand).resolves({});

      // const result = await statusHandler(statusEvent(0));
      const result = await statusHandler(statusEventRetries0);

      expect(result).toEqual({
        status: 'CANCELLED',
      });
    });
  });

  // describe('Finalize function', () => {
  //   test('Should finalize a new order', async () => {
  //     ddbMockClient.on(PutCommand).resolves({});
  //     ddbMockClient.on(UpdateCommand).resolves({});

  //     await finalizeHandler(finalizeEvent());

  //     // check put command input
  //     const putCalls = ddbMockClient.commandCalls(PutCommand);
  //     expect(putCalls).toHaveLength(1);
  //     const putCallInput = putCalls[0].args[0].input as PutCommandInput;
  //     expect(putCallInput.TableName).toEqual('test-table-orders');

  //     // check update command input
  //     const updateCalls = ddbMockClient.commandCalls(UpdateCommand);
  //     expect(updateCalls).toHaveLength(1);
  //     const updateCallInput = updateCalls[0].args[0]
  //       .input as UpdateCommandInput;
  //     expect(updateCallInput.TableName).toEqual('test-table-customers');

  //     expect(updateCallInput.Key).toEqual({
  //       account_id: 'identity_1234567890',
  //     });
  //     expect(updateCallInput.UpdateExpression).toEqual(
  //       'SET orders = list_append(orders, :order)'
  //     );
  //     expect(updateCallInput.ExpressionAttributeValues).toEqual(
  //       finalizeUpdateInput
  //     );
  //   });
  // });
});
