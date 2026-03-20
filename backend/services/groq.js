'use strict';
/**
 * backend/services/groq.js
 * Service Groq API — Llama 3.3 70B
 * Format OpenAI-compatible
 */

const https  = require('https');
const config = require('../config/env');

/**
 * Appel principal à l'API Groq
 * @param {Array}  messages  — [{role, content}]
 * @param {string} system    — Prompt système optionnel
 * @returns {Promise<string>} — Texte généré
 */
async function chat(messages, system = null) {
  const key = config.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY non configurée');

  const msgs = [];
  if (system) msgs.push({ role: 'system', content: system });
  messages.forEach(m => msgs.push({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || '')
  }));

  const payload = JSON.stringify({
    model:       config.GROQ_MODEL,
    messages:    msgs,
    temperature: config.GROQ_TEMPERATURE,
    max_tokens:  config.GROQ_MAX_TOKENS,
  });

  const result = await _request(key, payload);

  // Format réponse OpenAI-compatible (Groq)
  const text = result?.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('Réponse vide de Groq — vérifiez votre clé API');
  return text;
}

/**
 * Requête HTTPS vers l'API Groq
 */
function _request(apiKey, payload) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.groq.com',
      path:     '/openai/v1/chat/completions',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
          else resolve(parsed);
        } catch {
          reject(new Error('Erreur parsing réponse Groq'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(new Error('Timeout 60s — Groq')); });
    req.write(payload);
    req.end();
  });
}

module.exports = { chat };
