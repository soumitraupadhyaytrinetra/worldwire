// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: "https://worldwire.app",

  vite: {
    build: {
      cssCodeSplit: true,
      minify: 'esbuild',
    },
    css: {
      transformer: 'lightningcss',
      lightningcss: {
        targets: {
          chrome: 110 << 16,
          firefox: 115 << 16,
          safari: 16 << 16,
        },
      },
    },
    plugins: [
      tailwindcss(),
    ],
  },

  build: {
    inlineStylesheets: 'auto',
    assets: '_astro',
  },

  output: 'static',
});
