import { createTheme, defaultSideNavs } from 'vite-pages-theme-doc';

import Component404 from './404';
import logo from './logo.png';

export default createTheme({
  logo: (
    <div style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <img src={logo} alt='BoxyHQ logo' width='40' height='40' />
      BoxyHQ React SDK
    </div>
  ),
  topNavs: [
    {
      label: 'SDK',
      path: '/',
      activeIfMatch: {
        // match all first-level paths
        path: '/:foo',
      },
    },
    {
      label: 'Components',
      path: '/components/demos/Login',
      activeIfMatch: '/components',
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
