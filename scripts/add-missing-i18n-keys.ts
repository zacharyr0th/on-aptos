import fs from 'fs';
import path from 'path';

const localesPath = path.join(process.cwd(), 'public', 'locales');

// New keys to add for all languages
const newWalletKeys: Record<string, any> = {
  en: {
    "error_empty_input": "Please enter an address or ANS name",
    "error_invalid_format": "Invalid address format or ANS name", 
    "error_empty_address": "Please enter an address",
    "search_ans_placeholder": "Search any wallet or ANS"
  },
  es: {
    "error_empty_input": "Por favor ingresa una dirección o nombre ANS",
    "error_invalid_format": "Formato de dirección o nombre ANS inválido",
    "error_empty_address": "Por favor ingresa una dirección", 
    "search_ans_placeholder": "Buscar cualquier billetera o ANS"
  },
  ar: {
    "error_empty_input": "يرجى إدخال عنوان أو اسم ANS",
    "error_invalid_format": "تنسيق عنوان أو اسم ANS غير صحيح",
    "error_empty_address": "يرجى إدخال عنوان",
    "search_ans_placeholder": "البحث عن أي محفظة أو ANS"
  },
  de: {
    "error_empty_input": "Bitte geben Sie eine Adresse oder einen ANS-Namen ein",
    "error_invalid_format": "Ungültiges Adressformat oder ANS-Name",
    "error_empty_address": "Bitte geben Sie eine Adresse ein",
    "search_ans_placeholder": "Beliebige Wallet oder ANS suchen"
  },
  fil: {
    "error_empty_input": "Pakisuyo lagyan ng address o ANS na pangalan",
    "error_invalid_format": "Hindi tamang format ng address o ANS na pangalan",
    "error_empty_address": "Pakisuyo lagyan ng address",
    "search_ans_placeholder": "Hanapin ang anumang wallet o ANS"
  },
  fr: {
    "error_empty_input": "Veuillez saisir une adresse ou un nom ANS",
    "error_invalid_format": "Format d'adresse ou nom ANS invalide",
    "error_empty_address": "Veuillez saisir une adresse",
    "search_ans_placeholder": "Rechercher n'importe quel portefeuille ou ANS"
  },
  ha: {
    "error_empty_input": "Da fatan za a shigar da adireshi ko sunan ANS",
    "error_invalid_format": "Tsarin adireshi mara daidaituwa ko sunan ANS",
    "error_empty_address": "Da fatan za a shigar da adireshi",
    "search_ans_placeholder": "Nemo kowane walat ko ANS"
  },
  hi: {
    "error_empty_input": "कृपया एक पता या ANS नाम दर्ज करें",
    "error_invalid_format": "अमान्य पता प्रारूप या ANS नाम",
    "error_empty_address": "कृपया एक पता दर्ज करें",
    "search_ans_placeholder": "कोई भी वॉलेट या ANS खोजें"
  },
  ja: {
    "error_empty_input": "アドレスまたはANS名を入力してください",
    "error_invalid_format": "無効なアドレス形式またはANS名",
    "error_empty_address": "アドレスを入力してください",
    "search_ans_placeholder": "任意のウォレットまたはANSを検索"
  },
  ko: {
    "error_empty_input": "주소 또는 ANS 이름을 입력하세요",
    "error_invalid_format": "유효하지 않은 주소 형식 또는 ANS 이름",
    "error_empty_address": "주소를 입력하세요",
    "search_ans_placeholder": "임의의 지갑 또는 ANS 검색"
  },
  pcm: {
    "error_empty_input": "Abeg enter address or ANS name",
    "error_invalid_format": "Bad address format or ANS name",
    "error_empty_address": "Abeg enter address",
    "search_ans_placeholder": "Find any wallet or ANS"
  },
  pl: {
    "error_empty_input": "Wprowadź adres lub nazwę ANS",
    "error_invalid_format": "Nieprawidłowy format adresu lub nazwa ANS",
    "error_empty_address": "Wprowadź adres",
    "search_ans_placeholder": "Szukaj dowolnego portfela lub ANS"
  },
  pt: {
    "error_empty_input": "Por favor insira um endereço ou nome ANS",
    "error_invalid_format": "Formato de endereço inválido ou nome ANS",
    "error_empty_address": "Por favor insira um endereço",
    "search_ans_placeholder": "Pesquisar qualquer carteira ou ANS"
  },
  ru: {
    "error_empty_input": "Пожалуйста, введите адрес или имя ANS",
    "error_invalid_format": "Неверный формат адреса или имя ANS",
    "error_empty_address": "Пожалуйста, введите адрес",
    "search_ans_placeholder": "Поиск любого кошелька или ANS"
  },
  sw: {
    "error_empty_input": "Tafadhali ingiza anwani au jina la ANS",
    "error_invalid_format": "Umbizo batili wa anwani au jina la ANS",
    "error_empty_address": "Tafadhali ingiza anwani",
    "search_ans_placeholder": "Tafuta mkoba wowote au ANS"
  },
  vi: {
    "error_empty_input": "Vui lòng nhập địa chỉ hoặc tên ANS",
    "error_invalid_format": "Định dạng địa chỉ không hợp lệ hoặc tên ANS",
    "error_empty_address": "Vui lòng nhập địa chỉ",
    "search_ans_placeholder": "Tìm kiếm bất kỳ ví hoặc ANS nào"
  },
  yo: {
    "error_empty_input": "Jọ̀wọ́ tẹ àdírẹ́sì tàbí orúkọ ANS",
    "error_invalid_format": "Ọ̀nà àdírẹ́sì tàbí orúkọ ANS kò tọ́",
    "error_empty_address": "Jọ̀wọ́ tẹ àdírẹ́sì",
    "search_ans_placeholder": "Wá àpò-owó tàbí ANS èyíkéyìí"
  },
  "zh-CN": {
    "error_empty_input": "请输入地址或ANS名称",
    "error_invalid_format": "无效的地址格式或ANS名称",
    "error_empty_address": "请输入地址",
    "search_ans_placeholder": "搜索任意钱包或ANS"
  }
};

const newPortfolioLandingKeys: Record<string, any> = {
  en: {
    "complete": "A Complete",
    "subtitle_desc": "Track all your assets, DeFi positions, and NFTs in real-time across the Aptos ecosystem"
  },
  es: {
    "complete": "Un Completo",
    "subtitle_desc": "Rastrea todos tus activos, posiciones DeFi y NFTs en tiempo real en todo el ecosistema Aptos"
  },
  ar: {
    "complete": "نظرة شاملة",
    "subtitle_desc": "تتبع جميع أصولك ومراكز DeFi و NFTs في الوقت الفعلي عبر نظام Aptos البيئي"
  },
  de: {
    "complete": "Ein Vollständiger",
    "subtitle_desc": "Verfolgen Sie alle Ihre Vermögenswerte, DeFi-Positionen und NFTs in Echtzeit im gesamten Aptos-Ökosystem"
  },
  fil: {
    "complete": "Isang Kumpletong",
    "subtitle_desc": "Subaybayan ang lahat ng iyong mga assets, DeFi positions, at NFTs sa real-time sa buong Aptos ecosystem"
  },
  fr: {
    "complete": "Un Aperçu Complet",
    "subtitle_desc": "Suivez tous vos actifs, positions DeFi et NFTs en temps réel dans tout l'écosystème Aptos"
  },
  ha: {
    "complete": "Cikakkiyar",
    "subtitle_desc": "Kula duk kadarorinka, matsayinka na DeFi, da NFTs a lokaci gaskiya a cikin tsarin Aptos"
  },
  hi: {
    "complete": "एक पूर्ण",
    "subtitle_desc": "Aptos पारिस्थितिकी तंत्र में अपनी सभी संपत्तियों, DeFi पोजीशन और NFTs को रियल-टाइम में ट्रैक करें"
  },
  ja: {
    "complete": "完全な",
    "subtitle_desc": "Aptosエコシステム全体で、すべての資産、DeFiポジション、NFTをリアルタイムで追跡します"
  },
  ko: {
    "complete": "완전한",
    "subtitle_desc": "Aptos 생태계 전체에서 모든 자산, DeFi 포지션 및 NFT를 실시간으로 추적하세요"
  },
  pcm: {
    "complete": "One Complete",
    "subtitle_desc": "Track all your assets, DeFi positions, and NFTs for real-time inside di Aptos ecosystem"
  },
  pl: {
    "complete": "Kompletny",
    "subtitle_desc": "Śledź wszystkie swoje aktywa, pozycje DeFi i NFT w czasie rzeczywistym w całym ekosystemie Aptos"
  },
  pt: {
    "complete": "Uma Visão Completa",
    "subtitle_desc": "Acompanhe todos os seus ativos, posições DeFi e NFTs em tempo real em todo o ecossistema Aptos"
  },
  ru: {
    "complete": "Полный",
    "subtitle_desc": "Отслеживайте все свои активы, позиции DeFi и NFT в реальном времени во всей экосистеме Aptos"
  },
  sw: {
    "complete": "Mkamilifu",
    "subtitle_desc": "Fuatilia mali zako zote, nafasi za DeFi, na NFTs kwa wakati halisi katika mfumo mzima wa Aptos"
  },
  vi: {
    "complete": "Một Cái Nhìn Hoàn Chỉnh",
    "subtitle_desc": "Theo dõi tất cả tài sản, vị thế DeFi và NFT của bạn theo thời gian thực trên toàn bộ hệ sinh thái Aptos"
  },
  yo: {
    "complete": "Ọ̀pẹ́ Pípé",
    "subtitle_desc": "Tọpinpin gbogbo awọn ohun-ini rẹ, awọn ipo DeFi, ati NFTs ni akoko gidi kakiri eto Aptos"
  },
  "zh-CN": {
    "complete": "完整的",
    "subtitle_desc": "在整个 Aptos 生态系统中实时跟踪您的所有资产、DeFi 头寸和 NFT"
  }
};

console.log('🔧 Adding missing i18n keys to all languages...\n');

let updatedCount = 0;
let errorCount = 0;

// Add wallet keys
Object.entries(newWalletKeys).forEach(([lang, walletKeys]) => {
  const filePath = path.join(localesPath, lang, 'common.json');
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Add new wallet keys
    if (data.wallet) {
      let hasChanges = false;
      Object.entries(walletKeys).forEach(([key, value]) => {
        if (!data.wallet[key]) {
          data.wallet[key] = value;
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        // Write back the file
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
        console.log(`✅ ${lang}: Added missing wallet keys`);
        updatedCount++;
      }
    }
  } catch (error) {
    console.error(`❌ ${lang}: Error updating wallet keys - ${error}`);
    errorCount++;
  }
});

// Add portfolio landing keys
Object.entries(newPortfolioLandingKeys).forEach(([lang, landingKeys]) => {
  const filePath = path.join(localesPath, lang, 'common.json');
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Add new portfolio landing keys
    if (data.portfolio?.landing) {
      let hasChanges = false;
      Object.entries(landingKeys).forEach(([key, value]) => {
        if (!data.portfolio.landing[key]) {
          data.portfolio.landing[key] = value;
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        // Write back the file
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
        console.log(`✅ ${lang}: Added missing portfolio.landing keys`);
        updatedCount++;
      }
    }
  } catch (error) {
    console.error(`❌ ${lang}: Error updating portfolio.landing keys - ${error}`);
    errorCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Updated: ${updatedCount} files`);
console.log(`   Errors: ${errorCount}`);
console.log(`\n✨ Missing i18n keys added!`);