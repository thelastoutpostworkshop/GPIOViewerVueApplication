import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  experimental: {
    renderBuiltUrl(filename: string, {type }: { type: 'public' | 'asset' }) {
      if (type === 'asset'  || type === 'public' ) {
        return 'https://thelastoutpostworkshop.github.io/microcontroller_devkit/gpio_viewer_1_5/' + filename
      } else {
        return { relative: true }
      }
    }
  },
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    cssCodeSplit:false,
    rollupOptions: {
      output: {
        entryFileNames: "GPIOViewerVue.js",
        chunkFileNames: "chunk.js",
      }
    },
  }
})

