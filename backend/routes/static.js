'use strict';
/**
 * backend/routes/static.js
 * Serveur de fichiers statiques — frontend/
 */

const fs     = require('fs');
const path   = require('path');
const config = require('../config/env');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
};

function handle(req, res, pathname) {
  // Route racine → index.html
  let filePath;
  if (pathname === '/' || pathname === '/index.html') {
    filePath = path.join(config.FRONTEND_DIR, 'index.html');
  } else {
    // Sécurité : empêcher path traversal
    const safe = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    filePath = path.join(config.FRONTEND_DIR, safe);
  }

  // Vérifier que le fichier existe et est un fichier
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    // SPA fallback → index.html
    filePath = path.join(config.FRONTEND_DIR, 'index.html');
  }

  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type':   mime,
      'Cache-Control':  ext === '.html' ? 'no-cache' : 'public, max-age=3600',
      'Content-Length': data.length,
    });
    res.end(data);
  } catch {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
}

module.exports = { handle };
