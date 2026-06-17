import path from 'node:path';
import express, { Router } from 'express';
import config from 'config';

const ui_path = config.get<string>('ui.path');

// Serves the built UI (Vite) distribution under ui/dist
// Mounts at /app (adjust as needed) and also root fallthrough for SPA routing
export default function (router: Router) {

    if (process.env.NODE_ENV !== 'dev') {
        const distPath = path.resolve(ui_path);
        // Serve static assets (js, css, images)
        router.use('/', express.static(distPath, {
            maxAge: '1h',
            setHeaders: (res) => {
                // Basic security headers for static files
                res.setHeader('X-Content-Type-Options', 'nosniff');
            },
        }));

        // SPA fallback: any unmatched /* route returns index.html
        router.get(/^(?!\/api).*/, (req, res, next) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    } else {
        router.get('/', (req, res) => {
            res.send('OK');
        });
    }

}
