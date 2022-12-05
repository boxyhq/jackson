import React from 'react'
import { createTheme, defaultSideNavs } from 'vite-pages-theme-doc'

import Component404 from './404'

export default createTheme({
  logo: <div style={{ fontSize: '20px' }}>📘 Vite Pages</div>,
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
      path: '/components/Button',
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
          general: {
            label: 'General',
            order: 1,
          },
          'data-display': {
            label: 'Data Display',
            order: 2,
          },
        },
      },
    })
  },
  Component404,
})
