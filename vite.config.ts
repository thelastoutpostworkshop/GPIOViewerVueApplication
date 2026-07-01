import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
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

