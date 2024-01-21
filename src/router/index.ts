import { createRouter, createWebHistory,createMemoryHistory } from 'vue-router'
import GPIOView from '@/views/GPIOViewer.vue'
import GPIOViewBar from '@/components/BoardImageBar.vue'
import GPIOViewBottomBar from '@/components/BoardImageBottomBar.vue'

const router = createRouter({
  
  history: createMemoryHistory(),
  routes: [
     {
      path: '/',
      components: {
        default: GPIOView,
        "AppBar": GPIOViewBar,
        "BottomBar": GPIOViewBottomBar
      }
    },
     {
      path: '/espinfo',
      components: {
        default: GPIOView,
        "AppBar": GPIOViewBar,
        "BottomBar": GPIOViewBottomBar
      }
    },
  ]
})

export default router
