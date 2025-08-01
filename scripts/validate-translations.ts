#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { supportedLanguages } from '../lib/i18n';

interface ValidationResult {
  language: string;
  namespace: string;
  missingKeys: string[];
  extraKeys: string[];
  errors: string[];
}

// Get all keys from an object recursively
function getKeys(obj: any, prefix: string = ''): string[] {
  const keys: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

// Load JSON file safely
function loadJsonFile(filePath: string): any {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

// Validate a single language/namespace combination
function validateTranslation(
  language: string,
  namespace: string,
  englishKeys: Set<string>,
  targetData: any
): ValidationResult {
  const result: ValidationResult = {
    language,
    namespace,
    missingKeys: [],
    extraKeys: [],
    errors: []
  };

  if (!targetData) {
    result.errors.push(`Failed to load ${namespace}.json`);
    return result;
  }

  const targetKeys = new Set(getKeys(targetData));
  
  // Find missing keys (in English but not in target)
  for (const key of englishKeys) {
    if (!targetKeys.has(key)) {
      result.missingKeys.push(key);
    }
  }
  
  // Find extra keys (in target but not in English)
  for (const key of targetKeys) {
    if (!englishKeys.has(key)) {
      result.extraKeys.push(key);
    }
  }
  
  return result;
}

// Main validation function
async function validateAllTranslations() {
  const localesDir = path.join(__dirname, '..', 'public', 'locales');
  const namespaces = ['common', 'btc', 'defi', 'rwas', 'stables', 'lst'];
  
  console.log('🌍 Validating translations...\n');
  console.log(`📋 Languages to check: ${supportedLanguages.join(', ')}`);
  console.log(`📁 Namespaces to check: ${namespaces.join(', ')}\n`);
  
  const allResults: ValidationResult[] = [];
  let hasErrors = false;
  
  // Process each namespace
  for (const namespace of namespaces) {
    const englishPath = path.join(localesDir, 'en', `${namespace}.json`);
    const englishData = loadJsonFile(englishPath);
    
    if (!englishData) {
      console.error(`❌ Failed to load English ${namespace}.json - skipping namespace`);
      continue;
    }
    
    const englishKeys = new Set(getKeys(englishData));
    console.log(`\n📄 Checking ${namespace}.json (${englishKeys.size} keys in English)`);
    
    // Check each language
    for (const language of supportedLanguages) {
      if (language === 'en') continue; // Skip English
      
      const targetPath = path.join(localesDir, language, `${namespace}.json`);
      const targetData = loadJsonFile(targetPath);
      
      const result = validateTranslation(language, namespace, englishKeys, targetData);
      allResults.push(result);
      
      // Print results for this language/namespace
      if (result.errors.length > 0) {
        console.log(`  ❌ ${language}: ${result.errors.join(', ')}`);
        hasErrors = true;
      } else if (result.missingKeys.length > 0 || result.extraKeys.length > 0) {
        console.log(`  ⚠️  ${language}: ${result.missingKeys.length} missing, ${result.extraKeys.length} extra`);
        hasErrors = true;
      } else {
        console.log(`  ✅ ${language}: Complete`);
      }
    }
  }
  
  // Print detailed report
  console.log('\n📊 Detailed Report:\n');
  
  const problemResults = allResults.filter(r => 
    r.errors.length > 0 || r.missingKeys.length > 0 || r.extraKeys.length > 0
  );
  
  if (problemResults.length === 0) {
    console.log('✅ All translations are complete and consistent!');
  } else {
    for (const result of problemResults) {
      console.log(`\n${result.language}/${result.namespace}.json:`);
      
      if (result.errors.length > 0) {
        console.log(`  🔴 Errors:`);
        result.errors.forEach(error => console.log(`     - ${error}`));
      }
      
      if (result.missingKeys.length > 0) {
        console.log(`  🟡 Missing ${result.missingKeys.length} keys:`);
        result.missingKeys.slice(0, 10).forEach(key => console.log(`     - ${key}`));
        if (result.missingKeys.length > 10) {
          console.log(`     ... and ${result.missingKeys.length - 10} more`);
        }
      }
      
      if (result.extraKeys.length > 0) {
        console.log(`  🟢 Extra ${result.extraKeys.length} keys:`);
        result.extraKeys.slice(0, 10).forEach(key => console.log(`     - ${key}`));
        if (result.extraKeys.length > 10) {
          console.log(`     ... and ${result.extraKeys.length - 10} more`);
        }
      }
    }
  }
  
  // Summary
  console.log('\n📈 Summary:');
  const totalLanguages = supportedLanguages.length - 1; // Exclude English
  const totalChecks = totalLanguages * namespaces.length;
  const failedChecks = problemResults.length;
  const successRate = ((totalChecks - failedChecks) / totalChecks * 100).toFixed(1);
  
  console.log(`  Total checks: ${totalChecks}`);
  console.log(`  Passed: ${totalChecks - failedChecks}`);
  console.log(`  Failed: ${failedChecks}`);
  console.log(`  Success rate: ${successRate}%`);
  
  // Exit with error code if there are issues
  if (hasErrors) {
    console.log('\n❌ Translation validation failed. Please fix the issues above.');
    process.exit(1);
  } else {
    console.log('\n✅ All translations validated successfully!');
  }
}

// Run the validation
validateAllTranslations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});