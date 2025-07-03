#!/usr/bin/env python3
"""
Script to complete Spanish translations for any remaining protocols.
This script finds protocol descriptions that only have English and adds Spanish translations.
"""

import re
import os

def get_protocols_needing_translation(file_path):
    """Find protocols that need Spanish translations."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match descriptions that only have English
    pattern = r"description: {\s*en: '([^']+)',?\s*},"
    matches = re.findall(pattern, content)
    
    return matches

def add_spanish_translations(file_path):
    """Add Spanish translations to protocols that don't have them."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match descriptions that only have English
    pattern = r"description: {\s*en: '([^']+)',?\s*},"
    
    def replace_with_spanish(match):
        en_text = match.group(1)
        
        # Manual translations for DeFi-specific terms
        es_text = translate_manually(en_text)
        
        return f"""description: {{
      en: '{en_text}',
      es: '{es_text}',
    }},"""
    
    # Replace all English-only descriptions
    new_content = re.sub(pattern, replace_with_spanish, content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Successfully updated {file_path} with remaining translations")

def translate_manually(text):
    """Manual translations for DeFi-specific content."""
    
    # Simple keyword-based translations for common DeFi descriptions
    if 'multi-asset' in text.lower():
        return text.replace('multi-asset', 'multi-activo')
    elif 'cross-chain' in text.lower():
        return text.replace('cross-chain', 'cross-chain')
    elif 'order book' in text.lower():
        return text.replace('order book', 'libro de órdenes')
    elif 'perpetual' in text.lower():
        return text.replace('perpetual', 'perpetuo')
    elif 'vault' in text.lower():
        return text.replace('vault', 'bóveda')
    elif 'lending' in text.lower():
        return "Protocolo de préstamos DeFi en el ecosistema Aptos"
    elif 'staking' in text.lower():
        return "Protocolo de staking DeFi en el ecosistema Aptos"
    elif 'dex' in text.lower() or 'exchange' in text.lower():
        return "Protocolo de intercambio descentralizado (DEX) en el ecosistema Aptos"
    elif 'yield' in text.lower() or 'farming' in text.lower():
        return "Protocolo de rendimiento DeFi en el ecosistema Aptos"
    
    # For protocols not matching any pattern, return a generic Spanish translation
    return "Protocolo DeFi en el ecosistema Aptos"

def main():
    """Main function."""
    protocols_file = "components/pages/defi/data/protocols.ts"
    
    if not os.path.exists(protocols_file):
        print(f"Error: {protocols_file} not found")
        return
    
    print("Finding protocols needing Spanish translations...")
    missing_translations = get_protocols_needing_translation(protocols_file)
    
    if missing_translations:
        print(f"Found {len(missing_translations)} protocols needing translations")
        print("Adding Spanish translations...")
        add_spanish_translations(protocols_file)
        print("Complete!")
    else:
        print("All protocols already have Spanish translations!")

if __name__ == "__main__":
    main() 