'use strict';
/**
 * backend/services/storage.js
 * Service de stockage local — exports et fichiers générés
 */

const fs   = require('fs');
const path = require('path');
const config = require('../config/env');

const EXPORTS_DIR = path.join(config.DATA_DIR, 'exports');

/**
 * Initialise les répertoires nécessaires
 */
function initDirs() {
  [config.DATA_DIR, EXPORTS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[Storage] Répertoire créé : ${dir}`);
    }
  });
}

/**
 * Sauvegarde un fichier export
 * @param {string} name    — Nom du fichier
 * @param {string} content — Contenu
 * @returns {string} filename
 */
function saveExport(name, content) {
  const ts       = Date.now();
  const safe     = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${ts}_${safe}`;
  const filePath = path.join(EXPORTS_DIR, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  return filename;
}

/**
 * Liste les exports disponibles
 * @returns {Array} Liste triée par date décroissante
 */
function listExports() {
  try {
    return fs.readdirSync(EXPORTS_DIR)
      .map(f => {
        try {
          const stat = fs.statSync(path.join(EXPORTS_DIR, f));
          return { filename: f, size: stat.size, date: stat.mtimeMs };
        } catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => b.date - a.date);
  } catch { return []; }
}

/**
 * Chemin complet vers un export (vérifié)
 * @param {string} filename
 * @returns {string|null}
 */
function getExportPath(filename) {
  const safe = path.basename(filename); // Sécurité path traversal
  const full = path.join(EXPORTS_DIR, safe);
  return fs.existsSync(full) ? full : null;
}

/**
 * Supprime un export
 * @param {string} filename
 */
function deleteExport(filename) {
  const p = getExportPath(filename);
  if (!p) throw new Error('Fichier introuvable');
  fs.unlinkSync(p);
}

module.exports = { initDirs, saveExport, listExports, getExportPath, deleteExport };
