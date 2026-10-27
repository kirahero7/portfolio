import { copyFileSync } from 'node:fs';

// GitHub Pages serves 404.html for deep links. Reusing the app entry lets
// the client-side router resolve category and project URLs after refresh.
copyFileSync('dist/index.html', 'dist/404.html');
