import type { FC } from 'react';

export interface LoginProps {
  /**
   * Handler to be passed into the component, you might have to validate tenant inside this and initiate login if all good.
   * Should return an error with message in case of failure. The application can also chose not to return an error message and
   * handle it by showing a toast or similar UI component.
   * @param {string} tenant Value for tenant.
   * @returns {Promise} Error from the application
   */
  forwardTenant: (tenant: string) => Promise<{ error: { message: string } }>;
  /**
   * Label for the tenant input
   * @defaultValue Tenant
   */
  label: string;
  /**
   * Custom component that would be rendered below the tenant input to display error
   */
  ErrorDisplayComponent?: FC;
}
