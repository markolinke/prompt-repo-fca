import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/domains/auth/pages/LoginPage.vue'),
    meta: { isPublic: true },
  },
];

export default routes;

