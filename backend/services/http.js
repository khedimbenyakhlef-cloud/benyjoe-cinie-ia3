'use strict';
/**
 * backend/services/http.js
 * Utilitaires HTTP — parsing, réponses
 */

/**
 * Lit et parse le body JSON d'une requête
 */
function readBody(req) {
  return new Promise(resolve => {
    let s = '';
    const t = setTimeout(() => resolve({}), 30000);
    req.on('data', c => s += c);
    req.on('end', () => {
      clearTimeout(t);
      try { resolve(JSON.parse(s)); } catch { resolve({}); }
    });
    req.on('error', () => { clearTimeout(t); resolve({}); });
  });
}

/**
 * Envoie une réponse JSON
 */
function json(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type':                'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Content-Length':              Buffer.byteLength(body),
  });
  res.end(body);
}

/**
 * Envoie une réponse erreur JSON
 */
function error(res, message, status = 400) {
  return json(res, { error: message }, status);
}

/**
 * Sert un fichier statique
 */
function serveFile(res, filePath, contentType) {
  const fs = require('fs');
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type':   contentType,
      'Cache-Control':  'no-cache',
      'Content-Length': data.length,
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('404 Not Found');
  }
}

module.exports = { readBody, json, error, serveFile };
