import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        projects: resolve(__dirname, 'projects.html'),
        contact: resolve(__dirname, 'contact.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true
  }
});
