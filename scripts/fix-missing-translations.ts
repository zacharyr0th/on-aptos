#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { supportedLanguages } from '../lib/i18n';

// Translations for "Hausa" in different languages
const hausaTranslations: Record<string, string> = {
  'en': 'Hausa',
  'es': 'Hausa',
  'ar': 'الهوسا',
  'de': 'Hausa',
  'fil': 'Hausa',
  'fr': 'Haoussa',
  'ha': 'Hausa',
  'hi': 'हौसा',
  'ja': 'ハウサ語',
  'ko': '하우사어',
  'pcm': 'Hausa',
  'pl': 'Hausa',
  'pt': 'Hauçá',
  'ru': 'Хауса',
  'sw': 'Kihausa',
  'vi': 'Tiếng Hausa',
  'yo': 'Hausa',
  'zh-CN': '豪萨语'
};

// Get a value from nested object using dot notation
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Set a value in nested object using dot notation
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

function fixMissingTranslations() {
  const localesDir = path.join(__dirname, '..', 'public', 'locales');
  
  console.log('🔧 Fixing missing translations...\n');
  
  // Fix missing language.hausa in common.json files
  for (const language of supportedLanguages) {
    const commonPath = path.join(localesDir, language, 'common.json');
    
    try {
      const content = fs.readFileSync(commonPath, 'utf-8');
      const data = JSON.parse(content);
      
      // Check if language.hausa is missing
      if (!getNestedValue(data, 'language.hausa') && hausaTranslations[language]) {
        console.log(`✅ Adding language.hausa to ${language}/common.json`);
        setNestedValue(data, 'language.hausa', hausaTranslations[language]);
        
        // Write back with proper formatting
        fs.writeFileSync(commonPath, JSON.stringify(data, null, 2) + '\n');
      }
    } catch (error) {
      console.error(`❌ Error processing ${language}/common.json:`, error);
    }
  }
  
  console.log('\n✅ Finished fixing missing translations!');
}

// Run the fix
fixMissingTranslations();