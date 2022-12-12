import type { CSSProperties } from 'react';

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
   * Styles for each inner components that Login is made up of.
   */
  styles?: { button?: CSSProperties; input?: CSSProperties; label?: CSSProperties };
  /**
   * Classnames for each inner components that Login is made up of.
   */
  classNames?: { container?: string; button?: string; input?: string; label?: string };
  /**
   * Boolean that disables all the default styling making it easier to style from scratch
   */
  unstyled?: boolean;
}
