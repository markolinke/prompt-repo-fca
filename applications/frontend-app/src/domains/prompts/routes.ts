import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/prompts',
    name: 'prompts-list',
    component: () => import('@/domains/prompts/pages/PromptsPage.vue'),
  },
]

export default routes