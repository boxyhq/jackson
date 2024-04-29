import jackson from './jackson';
import { IndexNames } from 'npm/src/controller/utils';

type ValidationModule = 'sso' | 'dsync' | 'samlFederation';

export const validateDevelopmentModeLimits = async (
  productId: string,
  type: ValidationModule,
  message: string = 'Maximum number of connections reached'
) => {
  if (productId) {
    const { productController, connectionAPIController, directorySyncController, samlFederatedController } =
      await jackson();

    const getController = async (type: ValidationModule) => {
      switch (type) {
        case 'sso':
          return connectionAPIController;
        case 'dsync':
          return directorySyncController.directories;
        case 'samlFederation':
          return samlFederatedController.app;
        default:
          return {
            getCount: () => null,
          };
      }
    };

    const product = await productController.get(productId);
    if (product?.development) {
      const controller = await getController(type);
      const count = await controller.getCount({
        name: IndexNames.Product,
        value: productId,
      });
      if (count) {
        if (count >= 3) {
          throw { message, statusCode: 400 };
        }
      }
    }
  }
};
