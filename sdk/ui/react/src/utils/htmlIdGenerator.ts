const htmlIdGenerator = (id: string, elementType?: string) =>
  elementType ? `boxyhq-sso-${elementType}-${id}` : `boxyhq-sso-${id}`;

export default htmlIdGenerator;
