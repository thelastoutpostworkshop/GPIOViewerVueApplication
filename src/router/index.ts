import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import GPIOView from '@/views/GPIOViewer.vue'
import ESPInfo from '@/views/ESPInfo.vue'
import GPIOViewBar from '@/components/BoardImageBar.vue'
import GPIOViewBottomBar from '@/components/BoardImageBottomBar.vue'
import ESPInfoBar from '@/components/ESPInfoBar.vue'

const router = createRouter({

  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'gpioview',
      components: {
        default: GPIOView,
        "AppBar": GPIOViewBar,
        "BottomBar": GPIOViewBottomBar
      }
    },
    {
      path: '/espinfo',
      name: "espinfo",
      components: {
        default: ESPInfo,
        "AppBar": ESPInfoBar,

      }
    },
  ]
})

export default router
