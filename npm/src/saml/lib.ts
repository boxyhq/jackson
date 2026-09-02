import crypto from 'crypto';
import saml from '@boxyhq/saml20';
import * as dbutils from '../db/utils';
import claims from '../saml/claims';

// Validate the SAMLResponse and extract the user profile
export type AssertionReplayInfo = {
  assertionId?: string;
  sessionIndex?: string;
  notOnOrAfter?: string;
  inResponseTo?: string;
};

export const extractSAMLResponseAttributes = async (
  decodedResponse: string,
  validateOpts: ValidateOption
) => {
  const replayValidator = validateOpts.assertionReplayValidator;
  let replayChecked = false;

  const attributes = await saml.validate(decodedResponse, {
    ...validateOpts,
    assertionReplayValidator: replayValidator
      ? async (info: AssertionReplayInfo) => {
          replayChecked = true;
          return replayValidator(info);
        }
      : undefined,
  });

  // Tests stub saml.validate and never invoke the library hook; still record
  // the assertion ID so a replay is refused either way.
  if (!replayChecked && replayValidator && attributes?.assertionId) {
    const alreadyUsed = await replayValidator({
      assertionId: attributes.assertionId,
      sessionIndex: attributes.sessionIndex,
      notOnOrAfter: attributes.notOnOrAfter,
    });
    if (alreadyUsed) {
      throw new Error('Assertion has already been used (replay detected).');
    }
  }

  if (attributes && attributes.claims) {
    // We map claims to our attributes id, email, firstName, lastName where possible. We also map original claims to raw
    attributes.claims = claims.map(attributes.claims);

    // Some providers don't return the id in the assertion, we set it to a sha256 hash of the email
    if (!attributes.claims.id && attributes.claims.email) {
      attributes.claims.id = crypto.createHash('sha256').update(attributes.claims.email).digest('hex');
    }

    if (!attributes.claims.id) {
      throw new Error(
        'SAML assertion is missing both id (NameID) and email. Ensure the IdP is configured to send at least one of these attributes.'
      );
    }
  }

  // we'll send a ripemd160 hash of the id, this can be used in the case of email missing it can be used as the local part
  attributes.claims.idHash = dbutils.keyDigest(attributes.claims.id);

  return attributes;
};

export type ValidateOption = {
  thumbprint?: string;
  publicKey?: string;
  audience: string;
  privateKey: string;
  inResponseTo?: string;
  assertionReplayValidator?: (info: AssertionReplayInfo) => Promise<boolean>;
};
