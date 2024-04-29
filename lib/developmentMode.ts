import jackson from './jackson';
import { IndexNames } from 'npm/src/controller/utils';

export const validateDevelopmentModeLimits = async (
  productId: string,
  type: 'sso' | 'dsync',
  message: string
) => {
  const { connectionAPIController, directorySyncController, productController } = await jackson();
  if (productId) {
    const product = await productController.get(productId);
    if (product?.development) {
      const count = await (
        type === 'sso' ? connectionAPIController : directorySyncController.directories
      ).getCount({
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
