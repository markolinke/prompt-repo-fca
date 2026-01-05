import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/app/HelloWorld.vue')
  },
  {
    path: '/prompts',
    name: 'prompts',
    component: () => import('@/domains/prompts/pages/PromptsPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
