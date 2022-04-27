import { JacksonError } from './error';

export enum IndexNames {
  EntityID = 'entityID',
  TenantProduct = 'tenantProduct',
}

export const relayStatePrefix = 'boxyhq_jackson_';

export const forwardToAppSelection = (path, samlResponse, appList) => {
  const formElements = [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    '<meta http-equiv="x-ua-compatible" content="ie=edge">',
    '</head>',
    '<body onload="document.forms[0].submit()">',
    '<noscript>',
    '<p>Note: Since your browser does not support JavaScript, you must press the Continue button once to proceed.</p>',
    '</noscript>',
    '<form method="post" action="' + encodeURI(path) + '">',
    '<input type="hidden" name="SAMLResponse" value="' + samlResponse + '"/>',
    '<input type="hidden" name="app" value="' + encodeURIComponent(JSON.stringify(appList)) + '"/>',
    '<input type="submit" value="Continue" />',
    '</form>',
    '<script>document.forms[0].style.display="none";</script>',
    '</body>',
    '</html>',
  ];

  return formElements.join('');
};

export const validateAbsoluteUrl = (url, message) => {
  try {
    new URL(url);
  } catch (err) {
    throw new JacksonError(message ? message : 'Invalid url', 400);
  }
};
