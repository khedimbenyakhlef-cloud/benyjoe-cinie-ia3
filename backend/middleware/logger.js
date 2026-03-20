'use strict';
/**
 * backend/middleware/logger.js
 * Logger HTTP — format professionnel
 */

const COLORS = {
  GET:    '\x1b[32m',
  POST:   '\x1b[34m',
  DELETE: '\x1b[31m',
  PUT:    '\x1b[33m',
  RESET:  '\x1b[0m',
};

function log(req) {
  const color = COLORS[req.method] || '';
  const time  = new Date().toISOString().substring(11, 19);
  console.log(`  [${time}] ${color}${req.method}${COLORS.RESET} ${req.url}`);
}

module.exports = { log };
