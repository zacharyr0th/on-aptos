const fs = require('fs');
const path = require('path');

// Note: translate-google has been removed due to security vulnerabilities
// This script now requires manual translation or integration with a secure translation API
function translate(text, options) {
  throw new Error(
    'Translation service has been disabled for security reasons. Please use a secure translation API or manual translation.'
  );
}

// Directory containing the locale folders
const LOCALES_DIR = path.join(__dirname, '..', 'public', 'locales');
// English is the source of truth
const BASE_LANG = 'en';

// Detect all language folders (excluding files)
const languages = fs
  .readdirSync(LOCALES_DIR)
  .filter(f => fs.statSync(path.join(LOCALES_DIR, f)).isDirectory());

/**
 * Recursively walk an object tree and translate all string leaf values that are
 * either missing or identical to the English source string.
 *
 * @param {object} targetObj   Destination object (will be mutated)
 * @param {object} baseObj     English reference object
 * @param {string} lang        Target language code (e.g. 'es', 'fr')
 * @returns {Promise<void>}
 */
async function translateObject(targetObj, baseObj, lang) {
  for (const key of Object.keys(baseObj)) {
    const baseVal = baseObj[key];
    const targetVal = targetObj[key];

    // If nested object, recurse
    if (baseVal && typeof baseVal === 'object') {
      // Ensure nested object exists on target
      if (!targetObj[key] || typeof targetObj[key] !== 'object') {
        targetObj[key] = {};
      }
      await translateObject(targetObj[key], baseVal, lang);
      continue;
    }

    // Only attempt to translate string values
    if (typeof baseVal !== 'string') continue;

    // Skip if target already has a non-English translation
    if (typeof targetVal === 'string' && targetVal !== baseVal) continue;

    // Preserve template placeholders like {{variable}}
    const placeholders = [];
    const textForTranslation = baseVal.replace(/{{[^}]+}}/g, match => {
      const token = `__PLACEHOLDER_${placeholders.length}__`;
      placeholders.push({ token, match });
      return token;
    });

    try {
      let translated = await translate(textForTranslation, { to: lang });
      // Restore placeholders
      for (const { token, match } of placeholders) {
        translated = translated.replace(token, match);
      }
      targetObj[key] = translated;
      console.log(`[${lang}] ${baseVal} -> ${translated}`);
    } catch (err) {
      console.error(
        `Failed to translate '${baseVal}' to '${lang}':`,
        err.message
      );
      targetObj[key] = baseVal; // fallback to English
    }
  }
}

(async () => {
  for (const lang of languages) {
    if (lang === BASE_LANG) continue; // skip English

    console.log(`\n=== Translating language: ${lang} ===`);
    const langDir = path.join(LOCALES_DIR, lang);
    const baseDir = path.join(LOCALES_DIR, BASE_LANG);

    // Iterate over each English JSON namespace file
    for (const fileName of fs
      .readdirSync(baseDir)
      .filter(f => f.endsWith('.json'))) {
      const basePath = path.join(baseDir, fileName);
      const targetPath = path.join(langDir, fileName);

      const baseJson = JSON.parse(fs.readFileSync(basePath, 'utf8'));
      let targetJson = {};

      if (fs.existsSync(targetPath)) {
        targetJson = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
      } else {
        console.log(`Creating missing file for ${lang}: ${fileName}`);
      }

      await translateObject(targetJson, baseJson, lang);

      // Pretty-print JSON with 2-space indentation
      fs.writeFileSync(
        targetPath,
        JSON.stringify(targetJson, null, 2) + '\n',
        'utf8'
      );
    }
  }

  console.log('\n✅ Translation pass complete');
})();
