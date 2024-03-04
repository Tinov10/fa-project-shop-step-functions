#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StepFunctionsStack } from '../lib/fa-aws-step-functions-stack';
import { stackProps } from './config';
// import { AwsSolutionsChecks } from 'cdk-nag';

const app = new cdk.App();

new StepFunctionsStack(app, 'FaAwsStepFunctionsStack', stackProps);

// cdk.Aspects.of(app).add(new AwsSolutionsChecks());
