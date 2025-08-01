import fs from 'fs';
import path from 'path';

const localesPath = path.join(process.cwd(), 'public', 'locales');

// New description for all languages
const translations: Record<string, string> = {
  en: "Track all your assets, DeFi positions, and NFTs in real-time across the Aptos ecosystem.",
  es: "Rastrea todos tus activos, posiciones DeFi y NFTs en tiempo real en todo el ecosistema Aptos.",
  ar: "تتبع جميع أصولك ومراكز DeFi و NFTs في الوقت الفعلي عبر نظام Aptos البيئي.",
  de: "Verfolgen Sie alle Ihre Vermögenswerte, DeFi-Positionen und NFTs in Echtzeit im gesamten Aptos-Ökosystem.",
  fil: "Subaybayan ang lahat ng iyong mga assets, DeFi positions, at NFTs sa real-time sa buong Aptos ecosystem.",
  fr: "Suivez tous vos actifs, positions DeFi et NFTs en temps réel dans tout l'écosystème Aptos.",
  ha: "Kula duk kadarorinka, matsayinka na DeFi, da NFTs a lokaci gaskiya a cikin tsarin Aptos.",
  hi: "Aptos पारिस्थितिकी तंत्र में अपनी सभी संपत्तियों, DeFi पोजीशन और NFTs को रियल-टाइम में ट्रैक करें।",
  ja: "Aptosエコシステム全体で、すべての資産、DeFiポジション、NFTをリアルタイムで追跡します。",
  ko: "Aptos 생태계 전체에서 모든 자산, DeFi 포지션 및 NFT를 실시간으로 추적하세요.",
  pcm: "Track all your assets, DeFi positions, and NFTs for real-time inside di Aptos ecosystem.",
  pl: "Śledź wszystkie swoje aktywa, pozycje DeFi i NFT w czasie rzeczywistym w całym ekosystemie Aptos.",
  pt: "Acompanhe todos os seus ativos, posições DeFi e NFTs em tempo real em todo o ecossistema Aptos.",
  ru: "Отслеживайте все свои активы, позиции DeFi и NFT в реальном времени во всей экосистеме Aptos.",
  sw: "Fuatilia mali zako zote, nafasi za DeFi, na NFTs kwa wakati halisi katika mfumo mzima wa Aptos.",
  vi: "Theo dõi tất cả tài sản, vị thế DeFi và NFT của bạn theo thời gian thực trên toàn bộ hệ sinh thái Aptos.",
  yo: "Tọpinpin gbogbo awọn ohun-ini rẹ, awọn ipo DeFi, ati NFTs ni akoko gidi kakiri eto Aptos.",
  "zh-CN": "在整个 Aptos 生态系统中实时跟踪您的所有资产、DeFi 头寸和 NFT。"
};

console.log('🔄 Updating portfolio descriptions in all languages...\n');

let updatedCount = 0;
let errorCount = 0;

Object.entries(translations).forEach(([lang, newDescription]) => {
  const filePath = path.join(localesPath, lang, 'common.json');
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Update portfolio.landing.description if it exists
    if (data.portfolio?.landing?.description) {
      const oldDescription = data.portfolio.landing.description;
      data.portfolio.landing.description = newDescription;
      
      // Write back the file
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      
      console.log(`✅ ${lang}: Updated portfolio description`);
      console.log(`   Old: "${oldDescription}"`);
      console.log(`   New: "${newDescription}"\n`);
      updatedCount++;
    } else {
      console.log(`⚠️  ${lang}: portfolio.landing.description not found\n`);
    }
  } catch (error) {
    console.error(`❌ ${lang}: Error updating file - ${error}\n`);
    errorCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Updated: ${updatedCount} files`);
console.log(`   Errors: ${errorCount}`);
console.log(`\n✨ Portfolio descriptions updated!`);