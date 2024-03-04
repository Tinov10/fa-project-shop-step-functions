/* eslint-disable complexity, max-statements */

import Stripe from 'stripe';
import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';
import { cloudwatchEvent } from '../finalize/utils/handle-cw-event';
import { IStatusEvent } from '../../bin/types';

// export interface IStatusEvent {
//   pid: string;
//   user: boolean;
//   identity: string;
//   validatePrice: string;
//   products: IProduct[];
//
//   retries: number;
//   waitSeconds: number;
// }

let stripeClient: Stripe;
let cloudWatchClient: CloudWatchClient;

export const statusHandler = async (
  event: IStatusEvent
): Promise<IStatusEvent | { status: 'CANCELED' }> => {
  try {
    if (!stripeClient)
      stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2023-10-16',
      });

    if (!cloudWatchClient) cloudWatchClient = new CloudWatchClient({});

    const { pid, user, identity, validatedPrice, products, retries } = event;

    if (retries > 3) {
      cloudwatchEvent({
        metricName: 'CanceledPaymentStatusMetrics',
        pid: pid,
        cloudWatchClient,
      });
      return { status: 'CANCELED' };
    }

    const retryCount = retries + 1;
    const waitTimeInSeconds = retryCount * 150; // 2,5 / 5 / 7,5 / 10 Total 25 min

    // 1 Based on the pid we get the paymentIntents
    const paymentIntents: Stripe.PaymentIntent =
      await stripeClient.paymentIntents.retrieve(pid);

    // check the status of the payment intent
    const status: Stripe.PaymentIntent.Status = paymentIntents.status; // status can have numerous values

    let shipping: Stripe.PaymentIntent.Shipping | null = null;
    let paymentMethode: string | Stripe.PaymentMethod | null = null;
    let receiptEmail: string | null = null;

    // 2 only when status is "succeeded"
    // Get the shipping and payment method if intent is successfull
    if (status === 'succeeded') {
      shipping = paymentIntents.shipping;
      paymentMethode = paymentIntents.payment_method;

      // get the receipt email
      // we fetch the email from stripe because we can have guest users which are not logged in therefore we haven't a email but when they pay they are obliged to give there email
      // when the payment was successfull we can get the email via the payment_method
      const retrievedPayment: Stripe.PaymentMethod =
        await stripeClient.paymentMethods.retrieve(paymentMethode as string);

      receiptEmail = retrievedPayment.billing_details.email;
    }

    // when the status is "succeeded" OR when all the other values appear:
    // create the return statement function
    const returnStatement = (result: string) => ({
      pid,
      user,
      identity,
      validatedPrice,
      products,
      //
      status: result,
      //
      retries: retryCount,
      waitSeconds: waitTimeInSeconds,
      // only when payment was successfull otherwise null
      shipping,
      receiptEmail,
    });

    const success = () => returnStatement('SUCCEEDED');
    const processing = () => returnStatement('PROCESSING');
    const canceled = () => returnStatement('CANCELED');

    const statusMatrix = {
      succeeded: () => success(),
      processing: () => processing(),
      requires_action: () => processing(),
      requires_capture: () => processing(),
      requires_confirmation: () => processing(),
      requires_payment_method: () => processing(),
      canceled: () => canceled(),
    };

    return statusMatrix[status]() as IStatusEvent;
  } catch (err) {
    console.log(err);

    await cloudwatchEvent({
      metricName: 'FailedPaymentStatusMetrics',
      pid: event.pid,
      cloudWatchClient,
    });
    return { status: 'CANCELED' };
  }
};
