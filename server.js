'use strict';
/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║      BENY-JOE CINIE IA — STUDIO CINÉMATOGRAPHIQUE IA        ║
 * ║      Fondé par KHEDIM BENYAKHLEF dit BENY-JOE               ║
 * ║      Architecture Professionnelle v5.0                      ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Stack    : Node.js (zéro dépendance) + Groq Llama 3.3 70B  ║
 * ║  Hosting  : Render.com (plan gratuit)                       ║
 * ║  IA       : Groq API — 14 400 req/jour GRATUIT              ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const http = require('http');
const path = require('path');

const config  = require('./backend/config/env');
const router  = require('./backend/routes/index');
const logger  = require('./backend/middleware/logger');
const { initDirs } = require('./backend/services/storage');

// ── Initialisation ───────────────────────────────────────────
initDirs();

// ── Serveur principal ────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  logger.log(req);
  await router.handle(req, res);
});

server.listen(config.PORT, '0.0.0.0', () => {
  console.log('\n  ╔══════════════════════════════════════════════════════════════╗');
  console.log('  ║      🎬  BENY-JOE CINIE IA — STUDIO ULTIME v5               ║');
  console.log('  ║      Fondé par KHEDIM BENYAKHLEF dit BENY-JOE               ║');
  console.log('  ╠══════════════════════════════════════════════════════════════╣');
  console.log(`  ║  🌐 URL     : http://localhost:${config.PORT}                          ║`);
  console.log(`  ║  🤖 Groq IA : ${config.GROQ_API_KEY ? '✅ GROQ_API_KEY configurée         ' : '❌ GROQ_API_KEY manquante (Render Env)'}   ║`);
  console.log(`  ║  📁 Data    : ${config.DATA_DIR.substring(0, 40).padEnd(40)} ║`);
  console.log('  ╚══════════════════════════════════════════════════════════════╝\n');
});

// ── Gestion erreurs ──────────────────────────────────────────
process.on('unhandledRejection', err => console.error('[ERROR] Unhandled:', err.message));
process.on('uncaughtException',  err => console.error('[ERROR] Uncaught:', err.message));
process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
