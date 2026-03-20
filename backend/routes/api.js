'use strict';
/**
 * backend/routes/api.js
 * Routes API REST — /api/*
 */

const groqService = require('../services/groq');
const storage     = require('../services/storage');
const { readBody, json, error } = require('../services/http');
const config      = require('../config/env');
const fs          = require('fs');
const path        = require('path');

const MIME_EXPORT = {
  '.pdf':  'application/pdf',
  '.json': 'application/json',
  '.txt':  'text/plain; charset=utf-8',
  '.md':   'text/markdown',
};

async function handle(req, res, pathname, method) {

  // ── GET /api/health ──────────────────────────────────────
  if (pathname === '/api/health' && method === 'GET') {
    return json(res, {
      status:  'ok',
      version: '5.0.0',
      ia:      !!config.GROQ_API_KEY,
      model:   config.GROQ_MODEL,
      uptime:  Math.floor(process.uptime()),
    });
  }

  // ── GET /api/key-status ──────────────────────────────────
  if (pathname === '/api/key-status' && method === 'GET') {
    return json(res, { configured: !!config.GROQ_API_KEY });
  }

  // ── POST /api/groq ───────────────────────────────────────
  if (pathname === '/api/groq' && method === 'POST') {
    if (!config.GROQ_API_KEY) {
      return error(res, 'Clé API Groq non configurée. Ajoutez GROQ_API_KEY dans Render → Environment.', 503);
    }
    const b = await readBody(req);
    if (!b.messages || !Array.isArray(b.messages) || b.messages.length === 0) {
      return error(res, 'Paramètre "messages" manquant ou vide', 400);
    }
    try {
      const text = await groqService.chat(b.messages, b.system || null);
      return json(res, { text });
    } catch (e) {
      return error(res, 'Erreur Groq : ' + e.message, 502);
    }
  }

  // ── POST /api/save-export ────────────────────────────────
  if (pathname === '/api/save-export' && method === 'POST') {
    const b = await readBody(req);
    if (!b.name || !b.content) return error(res, '"name" et "content" requis', 400);
    try {
      const filename = storage.saveExport(b.name, b.content);
      return json(res, { ok: true, filename });
    } catch (e) { return error(res, e.message, 500); }
  }

  // ── GET /api/list-exports ────────────────────────────────
  if (pathname === '/api/list-exports' && method === 'GET') {
    return json(res, storage.listExports());
  }

  // ── GET /api/download-export ─────────────────────────────
  if (pathname.startsWith('/api/download-export') && method === 'GET') {
    const qs       = req.url.split('?')[1] || '';
    const params   = new URLSearchParams(qs);
    const filename = params.get('file');
    if (!filename) return error(res, '"file" requis', 400);
    const filePath = storage.getExportPath(filename);
    if (!filePath) return error(res, 'Fichier introuvable', 404);
    const ext  = path.extname(filename).toLowerCase();
    const mime = MIME_EXPORT[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type':        mime,
      'Content-Disposition': `attachment; filename="${path.basename(filename)}"`,
    });
    return fs.createReadStream(filePath).pipe(res);
  }

  // ── POST /api/delete-export ──────────────────────────────
  if (pathname === '/api/delete-export' && method === 'POST') {
    const b = await readBody(req);
    if (!b.filename) return error(res, '"filename" requis', 400);
    try {
      storage.deleteExport(b.filename);
      return json(res, { ok: true });
    } catch (e) { return error(res, e.message, 404); }
  }

  return null; // Route non trouvée dans /api
}

module.exports = { handle };
