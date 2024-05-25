import type { Directory } from '@boxyhq/saml-jackson';

export function scimOpUrl(directory: Directory, opPath: string) {
  let endpoint = `${directory.scim.endpoint}/${opPath}`;
  if (directory.type === 'azure-scim-v2') {
    const [_main, aadOpts] = directory.scim.endpoint!.split('?');
    endpoint = `${_main}${opPath}?${aadOpts}`;
  }
  return endpoint;
}
