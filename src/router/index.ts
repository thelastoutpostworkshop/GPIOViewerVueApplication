import { createRouter, createWebHistory } from 'vue-router'
import GPIOView from '@/views/GPIOViewer.vue'
import GPIOViewBar from '@/components/BoardImageBar.vue'
import GPIOViewBottomBar from '@/components/BoardImageBottomBar.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      components:{
        default: GPIOView,
        "AppBar":GPIOViewBar,
        "BottomBar":GPIOViewBottomBar
      }
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
