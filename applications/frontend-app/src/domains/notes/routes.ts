import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/notes',
    name: 'notes-list',
    component: () => import('@/domains/notes/pages/NotesPage.vue'),
  },
]

export default routes