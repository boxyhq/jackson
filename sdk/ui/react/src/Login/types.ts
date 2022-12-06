import type { FC } from 'react';

export interface LoginProps {
  /**
   * Handler that takes in the tenant and initiates the login flow
   * @param {string} tenant The value for tenant input from the user
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
