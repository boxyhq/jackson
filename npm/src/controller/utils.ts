export enum IndexNames {
  EntityID = 'entityID',
  TenantProduct = 'tenantProduct',
}

export const createAuthorizeForm = (RelayState: string, SAMLRequest: string, postUrl: string) => {
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
    '<form method="post" action="' + encodeURI(postUrl) + '">',
    '<input type="hidden" name="RelayState" value="' + RelayState + '"/>',
    '<input type="hidden" name="SAMLRequest" value="' + SAMLRequest + '"/>',
    '<input type="submit" value="Continue" />',
    '</form>',
    '<script>document.forms[0].style.display="none";</script>',
    '</body>',
    '</html>',
  ];

  return formElements.join('');
};
