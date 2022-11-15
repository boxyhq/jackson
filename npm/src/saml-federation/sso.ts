import { decodeBase64, extractSAMLRequestAttributes } from './utils';
import { App } from './app';

export class SAMLHandler {
  private app: App;

  constructor({ app }: { app: App }) {
    this.app = app;
  }

  public handleSAMLRequest = async ({
    appId,
    request,
    relayState,
  }: {
    appId: string;
    request: string;
    relayState: string;
  }) => {
    const { data: app } = await this.app.get(appId);

    const attributes = await extractSAMLRequestAttributes(await decodeBase64(request, true));

    console.log(attributes);
    console.log(app);
    console.log(relayState);
  };
}

// Validate the app exists
// Check SAMLRequest, RelayState exists
// Validate the SAMLRequest is valid
// Call the SAMLRequest handler to handle the SAMLRequest
// Find the tenant and product from the appId
// Store the SAMLRequest, RelayState  in the session
// Create a new SAMLRequest and send it to the IdP

// {
//   attributes: {
//     'xmlns:samlp': 'urn:oasis:names:tc:SAML:2.0:protocol',
//     'xmlns:saml': 'urn:oasis:names:tc:SAML:2.0:assertion',
//     ID: 'ONELOGIN_0bc9161a-e8df-48d3-a29f-00b508eb0690',
//     Version: '2.0',
//     IssueInstant: '2022-11-15T15:30:36Z',
//     ProviderName: 'Twilio',
//     Destination: 'https://f4d4-103-147-208-109.in.ngrok.io/api/saml-federation/2e247ed39186826963a01b5f9125afbb1c364df5/sso',
//     ProtocolBinding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
//     AssertionConsumerServiceURL: 'https://iam.twilio.com/v1/Accounts/ACa574654c16b12309d0964fa1a9f4b997/saml2'
//   },
//   issuer: [
//     'https://iam.twilio.com/v1/Accounts/ACa574654c16b12309d0964fa1a9f4b997/saml2/metadata'
//   ]
// }
