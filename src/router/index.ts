import { createRouter, createWebHistory } from 'vue-router'
import GPIOView from '@/views/GPIOViewer.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'gpioview',
      component: GPIOView,
      props: route => ({ ...route.query }) // maps all query parameters as props
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    }
  ]
})

export default router
