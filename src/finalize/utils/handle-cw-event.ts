import {
  CloudWatchClient,
  PutMetricDataCommand,
  PutMetricDataCommandInput,
} from '@aws-sdk/client-cloudwatch';

interface ICloudWatchEvent {
  metricName: string;
  pid: string;
  cloudWatchClient: CloudWatchClient;
}

export const cloudwatchEvent = async (props: ICloudWatchEvent) => {
  const input: PutMetricDataCommandInput = {
    MetricData: [
      {
        MetricName: props.metricName,
        Unit: 'Count',
        Value: 1,
        Timestamp: new Date(),
        Dimensions: [
          {
            Name: props.metricName,
            Value: props.pid,
          },
        ],
      },
    ],
    Namespace: 'PrintHelix',
  };

  const command: PutMetricDataCommand = new PutMetricDataCommand(input);

  await props.cloudWatchClient.send(command);
};
