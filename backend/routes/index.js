'use strict';
/**
 * backend/routes/index.js
 * Routeur principal — dispatch vers API ou fichiers statiques
 */

const url          = require('url');
const apiRoutes    = require('./api');
const staticRoutes = require('./static');
const { rateLimiter } = require('../middleware/rateLimiter');
const { error }    = require('../services/http');

async function handle(req, res) {
  const parsed   = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method   = req.method.toUpperCase();

  // ── CORS Preflight ────────────────────────────────────────
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    });
    return res.end();
  }

  // ── Rate limiting sur les routes API ─────────────────────
  if (pathname.startsWith('/api/') && rateLimiter(req, res)) return;

  // ── Routes API (/api/*) ───────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const handled = await apiRoutes.handle(req, res, pathname, method);
    if (handled === null) {
      return error(res, `Route API inconnue : ${pathname}`, 404);
    }
    return;
  }

  // ── Fichiers statiques ────────────────────────────────────
  staticRoutes.handle(req, res, pathname);
}

module.exports = { handle };
