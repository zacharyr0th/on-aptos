# Locales Directory

This directory contains translation files for internationalization (i18n) support.

## Supported Languages

The following languages are supported, representing the top 11 most spoken languages globally:

| Language             | Code  | Directory | Status      |
| -------------------- | ----- | --------- | ----------- |
| English              | en    | `/en/`    | ✅ Complete |
| Spanish              | es    | `/es/`    | ✅ Complete |
| Chinese (Simplified) | zh-CN | `/zh-CN/` | ✅ Complete |
| French               | fr    | `/fr/`    | ✅ Complete |
| Portuguese           | pt    | `/pt/`    | ✅ Complete |
| Arabic               | ar    | `/ar/`    | ✅ Complete |
| Russian              | ru    | `/ru/`    | ✅ Complete |
| Japanese             | ja    | `/ja/`    | ✅ Complete |
| German               | de    | `/de/`    | ✅ Complete |
| Hindi                | hi    | `/hi/`    | ✅ Complete |
| Korean               | ko    | `/ko/`    | ✅ Complete |

## Translation Files

Each locale directory contains the following JSON files:

- `common.json` - Common UI elements, navigation, actions, labels, messages
- `defi.json` - DeFi-related terms and content
- `btc.json` - Bitcoin-related content and terminology
- `stables.json` - Stablecoin-related content
- `rwas.json` - Real World Assets content
- `lst.json` - Liquid Staking Token content

## Adding Translations

To translate the content:

1. Navigate to the specific language directory (e.g., `/zh-CN/` for Chinese)
2. Edit each JSON file to translate the English text to the target language
3. Keep the JSON structure and keys unchanged - only translate the values
4. Maintain any placeholder variables like `{{variableName}}`

## Adding New Languages

To add a new language:

1. Create a new directory with the appropriate language code
2. Copy all JSON files from the English (`/en/`) directory
3. Translate the content in each file
4. Update the `language` section in `common.json` to include the new language
5. Add the language to the `SupportedLanguage` type in `components/pages/defi/data/types.ts`
6. Update the i18n configuration in `lib/i18n.ts` to include the new language
7. Add the language to the language toggle component in `components/ui/language-toggle.tsx`

## Language Code Standards

This project uses standard language codes:

- Two-letter ISO 639-1 codes for most languages (e.g., `en`, `es`, `fr`)
- Extended codes for regional variants (e.g., `zh-CN` for Simplified Chinese)
