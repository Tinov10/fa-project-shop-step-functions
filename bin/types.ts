import { StackProps } from 'aws-cdk-lib';
import Stripe from 'stripe';
import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';

export interface IStackProps extends StackProps {
  ordersKeyArn: string;
  usersKeyArn: string;
  submit: {
    name: string;
    entry: string;
    env: { [key: string]: string };
  };
  status: {
    name: string;
    entry: string;
    env: { [key: string]: string };
  };
  finalize: {
    name: string;
    entry: string;
    env: { [key: string]: string };
  };
}

// Handlers

export interface ISubmitEvent {
  pid: string;
  user: boolean;
  identity: string; // sub of user or 'anonymous' (if we don't have IAM user)
  validatePrice: string; // total price of the products
  products: IProduct[];
}

export interface IProduct {
  id: number;
  price: number;
  quantity: number;
  color: String;
  size: String;
}

export interface IStatusEvent {
  pid: string;
  user: boolean;
  identity: string;
  validatedPrice: string;
  products: IProduct[];
  //
  retries: number;
  waitSeconds: number;
}

export interface IFinalizeEvent {
  //
  pid: string;
  user: boolean;
  identity: string;
  validatedPrice: string;
  products: IProduct[];
  //
  shipping: Stripe.PaymentIntent.Shipping;
  receiptEmail: string;
}

// interacting with the dbs

// create new order inside Orders table
export interface IPutCommand {
  // same as IFinalizeEvent
  orderId: string; // created inside handler
  orderDate: string; // created inside handler
  //
  pid: string;
  // no user
  identity: string;
  validatedPrice: string;
  products: IProduct[];
  //
  shipping: Stripe.PaymentIntent.Shipping;
  receiptEmail: string;
}

// add order to array inside Users table
export interface IUpdateCommand {
  orderId: string;
  orderDate: string;
  //
  // no pid
  // no user
  identity: string;
  validatedPrice: string;
  products: IProduct[];
  // no shipping
  // no receiptEmail
}
