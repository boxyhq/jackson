import jackson, { IAPIController, IOAuthController } from '@boxyhq/saml-jackson';
import env from '@lib/env';

let apiController: IAPIController;
let oauthController: IOAuthController;

const g = global as any;

export default async function init() {
  if (!g.apiController || !g.oauthController) {
    const ret = await jackson(env);
    apiController = ret.apiController;
    oauthController = ret.oauthController;
    g.apiController = apiController;
    g.oauthController = oauthController;
  } else {
    apiController = g.apiController;
    oauthController = g.oauthController;
  }

  return {
    apiController,
    oauthController,
  };
}
