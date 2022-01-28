import jackson, { IAPIController, IOAuthController } from '@boxyhq/saml-jackson';
import env from '@lib/env';
import { meter } from './metrics';

let apiController: IAPIController;
let oauthController: IOAuthController;

const g = global as any;

const counter = meter.createCounter('nextjs.test.counter');
counter.add(10);

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
