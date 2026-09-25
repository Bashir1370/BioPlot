import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig(({mode})=>{
  const env=loadEnv(mode,process.cwd(),'VITE_');
  return {
  plugins: [react()],
  server: {
    host: '0.0.0.0', allowedHosts: ['terminal.local'],
    proxy: {
      '/api/supabase': {
        target: env.VITE_SUPABASE_URL || 'https://bovvqelbnqocllsxssus.supabase.co',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/supabase/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        dashboard: resolve(__dirname, 'index.html'),
        templates: resolve(__dirname, 'templates.html'),
        editor: resolve(__dirname, 'editor.html')
      }
    }
  }
  };
});
