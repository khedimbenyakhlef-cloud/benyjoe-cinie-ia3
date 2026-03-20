'use strict';
/**
 * backend/middleware/rateLimiter.js
 * Rate limiting simple en mémoire
 */

const config  = require('../config/env');
const { error } = require('../services/http');

const store = new Map(); // ip → {count, resetAt}

function rateLimiter(req, res) {
  const ip      = req.socket.remoteAddress || 'unknown';
  const now     = Date.now();
  const entry   = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + config.RATE_LIMIT_WINDOW_MS });
    return false; // pas limité
  }

  entry.count++;
  if (entry.count > config.RATE_LIMIT_MAX) {
    error(res, 'Trop de requêtes. Réessayez dans quelques minutes.', 429);
    return true; // limité
  }
  return false;
}

// Nettoyage mémoire toutes les 30 min
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(ip);
  }
}, 30 * 60 * 1000);

module.exports = { rateLimiter };
