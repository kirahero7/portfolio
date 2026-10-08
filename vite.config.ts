import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function syncSourceDataPlugin(): Plugin {
  return {
    name: 'sync-source-data-plugin',
    configureServer(server) {
      server.middlewares.use('/api/sync-source-data', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              if (parsed && parsed.config && Array.isArray(parsed.projects)) {
                const targetPath = path.resolve(__dirname, 'src/data/initialData.ts');
                const fileContent = `import { PortfolioData } from '../types';\n\nexport const initialPortfolioData: PortfolioData = ${JSON.stringify(
                  parsed,
                  null,
                  2
                )};\n`;
                fs.writeFileSync(targetPath, fileContent, 'utf8');

                const backupPath = path.resolve(__dirname, 'src/data/backup-portfolio-data.json');
                fs.writeFileSync(backupPath, JSON.stringify(parsed, null, 2), 'utf8');

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, count: parsed.projects.length }));
                return;
              } else {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Invalid format' }));
                return;
              }
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err?.message || 'Server error' }));
              return;
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), syncSourceDataPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
