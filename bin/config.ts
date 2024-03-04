import { IStackProps } from './types';

export const stackProps: IStackProps = {
  ordersKeyArn: 'arn',
  usersKeyArn: 'arn',
  // lambdas
  submit: {
    name: 'submitJob',
    entry: 'src/submit/index.ts',
    env: { WAIT_SECONDS: '150' },
  },
  status: {
    name: 'statusJob',
    entry: 'src/status/index.ts',
    env: {
      STRIPE_SECRET_KEY: 'stripeSecretKey',
    },
  },
  finalize: {
    name: 'finalizeJob',
    entry: 'src/finalize/index.ts',
    env: {
      ORDERS_TABLE_NAME: 'ph-orders-table',
      CUSTOMER_TABLE_NAME: 'ph-users-table',
      STOCK_TABLE_NAME: 'ph-stock-table',
    },
  },
};
