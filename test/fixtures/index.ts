import { IStatusEvent } from '../../bin/types';

export const submitEvent = {
  pid: '1234',
  user: true,
  identity: 'user identity',
  validatePrice: '10',
  products: [],
};

export const statusEventRetries0 = {
  pid: '1234',
  user: true,
  identity: 'user identity',
  products: [],
  retries: 0,
  waitSeconds: 10,
  validatedPrice: '10',
};

export const statusEventRetries4 = {
  pid: '1234',
  user: true,
  identity: 'user identity',
  products: [],
  retries: 4,
  waitSeconds: 10,
  validatedPrice: '10',
};

// export const statusEvent = (numberOfRetries: number) => {
//   return {
//     pid: '1234',
//     user: true,
//     identity: 'user identity',
//     products: [],
//     retries: numberOfRetries,
//     waitSeconds: 10,
//     validatePrice: '10',
//   };
// };

export const finalizeEvent = () => {
  return {};
};

export const finalizeUpdateInput = {
  ':order': [
    {
      order_id: 'PHO-5843985094385094',
      order_status: 'PENDING',
      order_date: '2023-09-23343455355',
      shipment_date: 'PENDING',
      price: '1000',
      products: [{}],
    },
  ],
};
