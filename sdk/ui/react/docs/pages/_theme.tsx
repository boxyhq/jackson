import React from 'react';
import { createTheme, defaultSideNavs } from 'vite-pages-theme-doc';

import Component404 from './404';
import logo from './logo.png';

export default createTheme({
  logo: (
    <div style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <img src={logo} alt='BoxyHQ logo' width='40' height='40' />
      BoxyHQ SSO-React
    </div>
  ),
  topNavs: [
    {
      label: 'Index',
      path: '/',
      activeIfMatch: {
        // match all first-level paths
        path: '/:foo',
        exact: true,
      },
    },
    {
      label: 'Components',
      path: '/components/Login',
      activeIfMatch: '/components',
    },
    { label: 'Vite', href: 'https://github.com/vitejs/vite' },
    {
      label: 'Vite Pages',
      href: 'https://github.com/vitejs/vite-plugin-react-pages',
    },
  ],
  sideNavs: (ctx) => {
    return defaultSideNavs(ctx, {
      groupConfig: {
        components: {
          demos: {
            label: 'Demos (dev only)',
            order: -1,
          },
          sso: {
            label: 'SSO',
            order: 1,
          },
        },
      },
    });
  },
  Component404,
});
