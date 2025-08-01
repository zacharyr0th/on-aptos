#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { supportedLanguages } from '../lib/i18n';

// Get all keys from an object recursively
function getKeys(obj: any, prefix: string = ''): Set<string> {
  const keys = new Set<string>();
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const subKeys = getKeys(value, fullKey);
      subKeys.forEach(k => keys.add(k));
    } else {
      keys.add(fullKey);
    }
  }
  
  return keys;
}

// Get value from nested object using dot notation
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Set value in nested object using dot notation
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

// Delete key from nested object using dot notation
function deleteNestedKey(obj: any, path: string): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => current?.[key], obj);
  if (target && lastKey in target) {
    delete target[lastKey];
  }
}

// Create a new object with only the keys that exist in English
function alignWithEnglish(englishData: any, targetData: any): any {
  const aligned: any = {};
  
  function copyStructure(enObj: any, targetObj: any, resultObj: any) {
    for (const [key, enValue] of Object.entries(enObj)) {
      if (enValue && typeof enValue === 'object' && !Array.isArray(enValue)) {
        // It's an object, recurse
        resultObj[key] = {};
        copyStructure(enValue, targetObj?.[key] || {}, resultObj[key]);
      } else {
        // It's a leaf value
        if (targetObj && key in targetObj) {
          resultObj[key] = targetObj[key];
        } else {
          // Missing translation, use English as fallback
          resultObj[key] = enValue;
        }
      }
    }
  }
  
  copyStructure(englishData, targetData, aligned);
  return aligned;
}

async function alignAllTranslations() {
  const localesDir = path.join(__dirname, '..', 'public', 'locales');
  const namespaces = ['common', 'btc', 'defi', 'rwas', 'stables', 'lst'];
  
  console.log('🔧 Aligning all translations with English structure...\n');
  
  let totalFixed = 0;
  let totalErrors = 0;
  
  for (const namespace of namespaces) {
    const englishPath = path.join(localesDir, 'en', `${namespace}.json`);
    
    // Check if English file exists
    if (!fs.existsSync(englishPath)) {
      console.log(`⚠️  Skipping ${namespace} - English file not found`);
      continue;
    }
    
    let englishData;
    try {
      const content = fs.readFileSync(englishPath, 'utf-8');
      englishData = JSON.parse(content);
    } catch (error) {
      console.error(`❌ Error reading English ${namespace}.json:`, error);
      totalErrors++;
      continue;
    }
    
    console.log(`\n📄 Processing ${namespace}.json:`);
    
    for (const language of supportedLanguages) {
      if (language === 'en') continue;
      
      const targetPath = path.join(localesDir, language, `${namespace}.json`);
      
      // Check if target file exists
      if (!fs.existsSync(targetPath)) {
        console.log(`  ⚠️  ${language}: File not found, creating from English`);
        fs.writeFileSync(targetPath, JSON.stringify(englishData, null, 2) + '\n');
        totalFixed++;
        continue;
      }
      
      try {
        const content = fs.readFileSync(targetPath, 'utf-8');
        const targetData = JSON.parse(content);
        
        // Get keys from both
        const englishKeys = getKeys(englishData);
        const targetKeys = getKeys(targetData);
        
        // Calculate differences
        const extraKeys = Array.from(targetKeys).filter(k => !englishKeys.has(k));
        const missingKeys = Array.from(englishKeys).filter(k => !targetKeys.has(k));
        
        if (extraKeys.length === 0 && missingKeys.length === 0) {
          console.log(`  ✅ ${language}: Already aligned`);
          continue;
        }
        
        // Align the data
        const alignedData = alignWithEnglish(englishData, targetData);
        
        // Write back
        fs.writeFileSync(targetPath, JSON.stringify(alignedData, null, 2) + '\n');
        
        console.log(`  ✅ ${language}: Fixed (${extraKeys.length} removed, ${missingKeys.length} added)`);
        totalFixed++;
        
      } catch (error) {
        console.error(`  ❌ ${language}: Error processing:`, error);
        totalErrors++;
      }
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`  Files fixed: ${totalFixed}`);
  console.log(`  Errors: ${totalErrors}`);
  
  if (totalErrors > 0) {
    console.log('\n❌ Some files could not be processed');
    process.exit(1);
  } else {
    console.log('\n✅ All translations aligned with English structure!');
  }
}

// Run the alignment
alignAllTranslations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});