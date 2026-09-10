import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const appEntry = new URL(
  './index.html',
  import.meta.url,
).pathname

const editorEntry = new URL(
  './editor.html',
  import.meta.url,
).pathname

export default defineConfig({
  plugins: [react()],

  base: '/',

  build: {
    outDir: 'dist',

    rollupOptions: {
      input: {
        app: appEntry,
        editor: editorEntry,
      },
    },
  },
})
