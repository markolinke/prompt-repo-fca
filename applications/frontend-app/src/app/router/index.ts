import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/app/HomePage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
