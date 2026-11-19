/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {createApi} from './server/api.mjs';

const api = {
  name: 'pfi-observatory-api',
  configureServer(s) { s.middlewares.use('/api', createApi()); },
  configurePreviewServer(s) { s.middlewares.use('/api', createApi()); },
};

const entryInject = () => {
  let isServe = false;
  return {
    name: 'pfi-entry-inject',
    configResolved(c) { isServe = c.command === 'serve'; },
    transformIndexHtml(html) {
      if (isServe) return html;
      return html.replace(/<script type="module" src="\/src\/main\.jsx"><\/script>/, '');
    },
    generateBundle(_, bundle) {
      if (isServe) return;
      const entry = Object.values(bundle).find(c => c.type === 'chunk' && c.facadeModuleId && c.facadeModuleId.endsWith('/src/main.jsx'));
      const html = bundle['index.html'];
      if (entry && html && html.type === 'asset') {
        const src = '/' + entry.fileName;
        html.source = html.source.toString().replace('</body>', `<script type="module" src="${src}"></script></body>`);
      }
    },
  };
};

export default defineConfig({
  plugins: [react(), api, entryInject()],
  server: { host: '0.0.0.0', allowedHosts: true },
  preview: { host: '0.0.0.0', allowedHosts: true },
  build: { chunkSizeWarningLimit: 800 },
  esbuild: { jsx: 'automatic', jsxImportSource: 'react', jsxDev: true },
});
