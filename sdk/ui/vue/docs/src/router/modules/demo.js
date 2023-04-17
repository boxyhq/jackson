export default [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/Sdk.vue'),
  },
  {
    path: '/components',
    name: 'components',
    component: () => import('@/views/Components.vue'),
  },
];
