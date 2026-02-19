import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  const authTarget = env.VITE_API_AUTH_SERVICE_URL || 'http://localhost:3050';
  const projectTarget = env.VITE_API_PROJECT_SERVICE_URL || 'http://localhost:3051';
  const syncTarget = env.VITE_API_BASE_URL_DEV || 'http://localhost:4000';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/v1/auth': {
          target: authTarget,
          changeOrigin: true,
        },
        '/api/v1/accounts': {
          target: authTarget,
          changeOrigin: true,
        },
        '/api/v1': {
          target: projectTarget,
          changeOrigin: true,
        },
        '/ws': {
          target: syncTarget,
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});
