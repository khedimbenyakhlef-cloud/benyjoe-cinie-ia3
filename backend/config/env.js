'use strict';
/**
 * backend/config/env.js
 * Configuration centralisée — variables d'environnement
 */

const path = require('path');

const IS_RENDER = !!process.env.RENDER;

module.exports = {
  // Serveur
  PORT: parseInt(process.env.PORT) || 10000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_RENDER,

  // Groq IA
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL:   process.env.GROQ_MODEL   || 'llama-3.3-70b-versatile',
  GROQ_MAX_TOKENS: parseInt(process.env.GROQ_MAX_TOKENS) || 8000,
  GROQ_TEMPERATURE: parseFloat(process.env.GROQ_TEMPERATURE) || 0.82,

  // Stockage
  DATA_DIR: IS_RENDER
    ? '/opt/render/project/src/_data'
    : path.join(process.cwd(), '_data'),

  // Frontend
  FRONTEND_DIR: path.join(process.cwd(), 'frontend'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS:  15 * 60 * 1000, // 15 min
  RATE_LIMIT_MAX:        100,
};
