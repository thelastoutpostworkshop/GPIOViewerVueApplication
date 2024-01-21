import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import GPIOView from '@/views/GPIOViewer.vue'
import ESPInfo from '@/views/ESPInfo.vue'
import About from '@/views/About.vue'
import Memory from '@/views/MemoryMap.vue'
import AboutBar from '@/components/AboutBar.vue'
import MemoryBar from '@/components/MemoryMapBar.vue'
import AboutBottomBar from '@/components/AboutBottomBar.vue'
import MemoryBottomBar from '@/components/MemoryMapBottomBar.vue'
import GPIOViewBar from '@/components/BoardImageBar.vue'
import GPIOViewBottomBar from '@/components/BoardImageBottomBar.vue'
import ESPInfoBar from '@/components/ESPInfoBar.vue'
import ESPInfoBottomBar from '@/components/ESP32InfoBottomBar.vue'

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
        "BottomBar": ESPInfoBottomBar
      }
    },
    {
      path: '/about',
      name: "about",
      components: {
        default: About,
        "AppBar": AboutBar,
        "BottomBar": AboutBottomBar
      }
    },
    {
      path: '/memorymap',
      name: "memorymap",
      components: {
        default: Memory,
        "AppBar": MemoryBar,
        "BottomBar": MemoryBottomBar
      }
    },
  ]
})

export default router
