#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

class TranslationAnalyzer {
  constructor() {
    this.localesPath = path.join(process.cwd(), 'public', 'locales');
    this.baseLanguage = 'en';
    this.languages = ['ar', 'de', 'es', 'fr', 'ha', 'hi', 'ja', 'ko', 'pt', 'ru', 'vi', 'yo', 'zh-CN'];
    this.filesToAnalyze = ['common.json', 'defi.json'];
    this.baselineData = {};
  }

  async analyze() {
    console.log(`${colors.bright}${colors.blue}🔍 Translation Analysis Report${colors.reset}\n`);
    console.log(`Analyzing translations in: ${this.localesPath}\n`);

    // Load baseline (English) files
    this.loadBaseline();

    // Analyze each language
    const analyses = [];
    for (const lang of this.languages) {
      const analysis = this.analyzeLanguage(lang);
      analyses.push(analysis);
      this.printLanguageReport(analysis);
    }

    // Print summary
    this.printOverallSummary(analyses);
  }

  loadBaseline() {
    console.log(`${colors.gray}Loading English baseline files...${colors.reset}`);
    
    for (const filename of this.filesToAnalyze) {
      const filePath = path.join(this.localesPath, this.baseLanguage, filename);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        this.baselineData[filename] = JSON.parse(content);
        const keyCount = this.countKeys(this.baselineData[filename]);
        console.log(`${colors.green}✓${colors.reset} ${filename}: ${keyCount} keys`);
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} ${filename}: Failed to load`);
      }
    }
    console.log('');
  }

  analyzeLanguage(language) {
    const analysis = {
      language,
      files: {},
      summary: {
        totalFiles: this.filesToAnalyze.length,
        existingFiles: 0,
        totalKeys: 0,
        missingKeys: 0,
        extraKeys: 0,
        emptyValues: 0,
        placeholderMismatches: 0,
        completeness: 0,
      },
    };

    for (const filename of this.filesToAnalyze) {
      const fileAnalysis = this.analyzeFile(language, filename);
      analysis.files[filename] = fileAnalysis;

      if (fileAnalysis.exists) {
        analysis.summary.existingFiles++;
        analysis.summary.totalKeys += fileAnalysis.totalKeys;
        analysis.summary.missingKeys += fileAnalysis.missingKeys.length;
        analysis.summary.extraKeys += fileAnalysis.extraKeys.length;
        analysis.summary.emptyValues += fileAnalysis.emptyValues.length;
        analysis.summary.placeholderMismatches += fileAnalysis.placeholderMismatches.length;
      }
    }

    // Calculate completeness
    const baselineKeyCount = Object.values(this.baselineData)
      .reduce((sum, data) => sum + this.countKeys(data), 0);
    
    if (baselineKeyCount > 0) {
      const translatedKeys = analysis.summary.totalKeys - analysis.summary.missingKeys;
      analysis.summary.completeness = Math.round((translatedKeys / baselineKeyCount) * 100);
    }

    return analysis;
  }

  analyzeFile(language, filename) {
    const filePath = path.join(this.localesPath, language, filename);
    const analysis = {
      exists: false,
      totalKeys: 0,
      missingKeys: [],
      extraKeys: [],
      emptyValues: [],
      placeholderMismatches: [],
      structuralDifferences: [],
    };

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const translationData = JSON.parse(content);
      analysis.exists = true;

      // Get baseline data
      const baseline = this.baselineData[filename];
      if (!baseline) return analysis;

      // Analyze keys
      const baselineKeys = this.flattenKeys(baseline);
      const translationKeys = this.flattenKeys(translationData);

      analysis.totalKeys = translationKeys.size;
      
      // Find missing keys
      for (const key of baselineKeys.keys()) {
        if (!translationKeys.has(key)) {
          analysis.missingKeys.push(key);
        }
      }

      // Find extra keys
      for (const key of translationKeys.keys()) {
        if (!baselineKeys.has(key)) {
          analysis.extraKeys.push(key);
        }
      }

      // Check for empty values and placeholder mismatches
      for (const [key, value] of translationKeys.entries()) {
        if (typeof value === 'string') {
          if (value.trim() === '') {
            analysis.emptyValues.push(key);
          }

          // Check placeholder consistency
          const baselineValue = baselineKeys.get(key);
          if (typeof baselineValue === 'string') {
            const basePlaceholders = this.extractPlaceholders(baselineValue);
            const transPlaceholders = this.extractPlaceholders(value);
            
            if (!this.arraysEqual(basePlaceholders, transPlaceholders)) {
              analysis.placeholderMismatches.push({
                key,
                expected: basePlaceholders,
                actual: transPlaceholders,
              });
            }
          }
        }
      }

    } catch (error) {
      // File doesn't exist or is invalid
    }

    return analysis;
  }

  flattenKeys(obj, prefix = '') {
    const keys = new Map();

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const nested = this.flattenKeys(value, fullKey);
        for (const [nestedKey, nestedValue] of nested.entries()) {
          keys.set(nestedKey, nestedValue);
        }
      } else {
        keys.set(fullKey, value);
      }
    }

    return keys;
  }

  countKeys(obj) {
    return this.flattenKeys(obj).size;
  }

  extractPlaceholders(str) {
    const regex = /\{\{([^}]+)\}\}/g;
    const placeholders = [];
    let match;
    
    while ((match = regex.exec(str)) !== null) {
      placeholders.push(match[1].trim());
    }
    
    return placeholders.sort();
  }

  arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  printLanguageReport(analysis) {
    const { language, summary } = analysis;
    const hasIssues = summary.missingKeys > 0 || summary.extraKeys > 0 || 
                     summary.emptyValues > 0 || summary.placeholderMismatches > 0;

    // Language header
    console.log(`${colors.bright}${colors.cyan}═══ ${language.toUpperCase()} ═══${colors.reset}`);
    console.log(`Completeness: ${this.getCompletionColor(summary.completeness)}${summary.completeness}%${colors.reset}`);
    console.log(`Files: ${summary.existingFiles}/${summary.totalFiles}`);
    
    // File details
    for (const [filename, fileAnalysis] of Object.entries(analysis.files)) {
      if (!fileAnalysis.exists) {
        console.log(`\n  ${colors.red}✗ ${filename}${colors.reset} - File not found`);
        continue;
      }

      const fileHasIssues = fileAnalysis.missingKeys.length > 0 || 
                           fileAnalysis.extraKeys.length > 0 ||
                           fileAnalysis.emptyValues.length > 0 ||
                           fileAnalysis.placeholderMismatches.length > 0;

      console.log(`\n  ${fileHasIssues ? colors.yellow : colors.green}${fileHasIssues ? '⚠' : '✓'} ${filename}${colors.reset}`);
      console.log(`    Total keys: ${fileAnalysis.totalKeys}`);

      if (fileAnalysis.missingKeys.length > 0) {
        console.log(`    ${colors.red}Missing keys: ${fileAnalysis.missingKeys.length}${colors.reset}`);
        if (fileAnalysis.missingKeys.length <= 10) {
          fileAnalysis.missingKeys.forEach(key => {
            console.log(`      • ${key}`);
          });
        } else {
          fileAnalysis.missingKeys.slice(0, 5).forEach(key => {
            console.log(`      • ${key}`);
          });
          console.log(`      ... and ${fileAnalysis.missingKeys.length - 5} more`);
        }
      }

      if (fileAnalysis.extraKeys.length > 0) {
        console.log(`    ${colors.yellow}Extra keys: ${fileAnalysis.extraKeys.length}${colors.reset}`);
        if (fileAnalysis.extraKeys.length <= 5) {
          fileAnalysis.extraKeys.forEach(key => {
            console.log(`      • ${key}`);
          });
        } else {
          console.log(`      • ${fileAnalysis.extraKeys.slice(0, 3).join(', ')} ... and ${fileAnalysis.extraKeys.length - 3} more`);
        }
      }

      if (fileAnalysis.emptyValues.length > 0) {
        console.log(`    ${colors.magenta}Empty values: ${fileAnalysis.emptyValues.length}${colors.reset}`);
      }

      if (fileAnalysis.placeholderMismatches.length > 0) {
        console.log(`    ${colors.yellow}Placeholder mismatches: ${fileAnalysis.placeholderMismatches.length}${colors.reset}`);
        fileAnalysis.placeholderMismatches.slice(0, 3).forEach(mismatch => {
          console.log(`      • ${mismatch.key}: expected [${mismatch.expected.join(', ')}], got [${mismatch.actual.join(', ')}]`);
        });
      }
    }

    console.log('');
  }

  getCompletionColor(percentage) {
    if (percentage >= 95) return colors.green;
    if (percentage >= 80) return colors.yellow;
    return colors.red;
  }

  printOverallSummary(analyses) {
    console.log(`${colors.bright}${colors.blue}═══ OVERALL SUMMARY ═══${colors.reset}\n`);

    // Sort by completeness
    const sorted = [...analyses].sort((a, b) => b.summary.completeness - a.summary.completeness);

    console.log('Translation Completeness:');
    sorted.forEach(analysis => {
      const color = this.getCompletionColor(analysis.summary.completeness);
      const bar = this.createProgressBar(analysis.summary.completeness);
      console.log(`  ${analysis.language.padEnd(6)} ${bar} ${color}${analysis.summary.completeness}%${colors.reset}`);
    });

    console.log('\nKey Statistics:');
    const totalBaselineKeys = Object.values(this.baselineData)
      .reduce((sum, data) => sum + this.countKeys(data), 0);
    console.log(`  Total keys in English: ${totalBaselineKeys}`);

    console.log('\nLanguages needing attention:');
    const needsAttention = sorted.filter(a => a.summary.completeness < 95);
    if (needsAttention.length === 0) {
      console.log(`  ${colors.green}All languages are well-maintained!${colors.reset}`);
    } else {
      needsAttention.forEach(analysis => {
        const issues = analysis.summary.missingKeys + analysis.summary.extraKeys + 
                      analysis.summary.emptyValues + analysis.summary.placeholderMismatches;
        console.log(`  ${colors.yellow}${analysis.language}${colors.reset}: ${issues} total issues`);
      });
    }

    // Export option hint
    console.log(`\n${colors.gray}Tip: Run with --json flag to export detailed results${colors.reset}`);
  }

  createProgressBar(percentage, width = 20) {
    const filled = Math.max(0, Math.min(width, Math.round((percentage / 100) * width)));
    const empty = Math.max(0, width - filled);
    const color = this.getCompletionColor(percentage);
    return `${color}${'█'.repeat(filled)}${colors.gray}${'░'.repeat(empty)}${colors.reset}`;
  }
}

// Main execution
async function main() {
  const analyzer = new TranslationAnalyzer();
  
  try {
    await analyzer.analyze();
  } catch (error) {
    console.error(`${colors.red}Error during analysis:${colors.reset}`, error);
    process.exit(1);
  }
}

// Execute
main();

module.exports = { TranslationAnalyzer };