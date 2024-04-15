export type SecurityLogsType = 'splunk_hec_logs';

export type SinkConfigMapField = {
  index: number;
  label: string;
  name: string;
  type: string;
  placeholder: string;
};

export type SinkConfigMap = {
  [key: string]: {
    type: SecurityLogsType;
    fields: SinkConfigMapField[];
  };
};

export const configMap = {
  Splunk: {
    type: 'splunk_hec_logs',
    fields: [
      {
        index: 1,
        label: 'bui-splunk-collector-url',
        name: 'endpoint',
        type: 'string',
        placeholder: 'bui-splunk-hec-endpoint-placeholder',
      },
      {
        index: 2,
        label: 'bui-default-token',
        name: 'default_token',
        type: 'string',
        placeholder: 'bui-default-token-placeholder',
      },
    ],
  },
};

export const getDisplayTypeFromSinkType = (type: string): string | undefined => {
  return Object.keys(configMap).find((key) => configMap[key].type === type);
};

export const getFieldsFromSinkType = (type: string): SinkConfigMapField[] | undefined => {
  const key = getDisplayTypeFromSinkType(type);
  if (!key) {
    return undefined;
  }
  return configMap[key].fields;
};
