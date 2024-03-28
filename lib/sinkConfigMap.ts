export type SinkConfigMapField = {
  index: number;
  label: string;
  name: string;
  type: string;
  placeholder: string;
};

export type SinkConfigMap = {
  [key: string]: {
    type: string;
    fields: SinkConfigMapField[];
  };
};

export const configMap = {
  Splunk: {
    type: 'splunk_hec_logs',
    fields: [
      {
        index: 1,
        label: 'splunk_event_collector_url',
        name: 'endpoint',
        type: 'string',
        placeholder: 'splunk_hec_endpoint_placeholder',
      },
      {
        index: 2,
        label: 'default_token',
        name: 'default_token',
        type: 'string',
        placeholder: 'default_token_placeholder',
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
