import fs from 'fs';
import path from 'path';

const localesPath = path.join(process.cwd(), 'public', 'locales');

// Portfolio wallet translations for all languages
const portfolioWalletTranslations: Record<string, any> = {
  en: {
    "connect_prompt": "Connect Your Wallet",
    "search_placeholder": "View any wallet address...",
    "search_ans_placeholder": "Search any wallet or ANS",
    "viewing_label": "Viewing",
    "portfolio_value": "Portfolio Value",
    "total_assets": "Total Assets",
    "collections": "Collections",
    "top_collection": "Top Collection",
    "collector_metrics": "Collector Metrics",
    "defi_positions": "DeFi Positions",
    "error_empty_input": "Please enter an address or ANS name",
    "error_invalid_format": "Invalid address format or ANS name",
    "error_empty_address": "Please enter an address"
  },
  es: {
    "connect_prompt": "Conecta tu Billetera",
    "search_placeholder": "Ver cualquier dirección de billetera...",
    "search_ans_placeholder": "Buscar cualquier billetera o ANS",
    "viewing_label": "Viendo",
    "portfolio_value": "Valor del Portfolio",
    "total_assets": "Total de Activos",
    "collections": "Colecciones",
    "top_collection": "Colección Principal",
    "collector_metrics": "Métricas del Coleccionista",
    "defi_positions": "Posiciones DeFi",
    "error_empty_input": "Por favor ingresa una dirección o nombre ANS",
    "error_invalid_format": "Formato de dirección o nombre ANS inválido",
    "error_empty_address": "Por favor ingresa una dirección"
  },
  ar: {
    "connect_prompt": "اربط محفظتك",
    "search_placeholder": "عرض أي عنوان محفظة...",
    "search_ans_placeholder": "البحث عن أي محفظة أو ANS",
    "viewing_label": "عرض",
    "portfolio_value": "قيمة المحفظة",
    "total_assets": "إجمالي الأصول",
    "collections": "المجموعات",
    "top_collection": "أفضل مجموعة",
    "collector_metrics": "مقاييس الجامع",
    "defi_positions": "مراكز DeFi",
    "error_empty_input": "يرجى إدخال عنوان أو اسم ANS",
    "error_invalid_format": "تنسيق عنوان أو اسم ANS غير صحيح",
    "error_empty_address": "يرجى إدخال عنوان"
  },
  de: {
    "connect_prompt": "Wallet verbinden",
    "search_placeholder": "Beliebige Wallet-Adresse anzeigen...",
    "search_ans_placeholder": "Beliebige Wallet oder ANS suchen",
    "viewing_label": "Anzeigen",
    "portfolio_value": "Portfolio-Wert",
    "total_assets": "Gesamte Vermögenswerte",
    "collections": "Sammlungen",
    "top_collection": "Top-Sammlung",
    "collector_metrics": "Sammler-Metriken",
    "defi_positions": "DeFi-Positionen",
    "error_empty_input": "Bitte geben Sie eine Adresse oder einen ANS-Namen ein",
    "error_invalid_format": "Ungültiges Adressformat oder ANS-Name",
    "error_empty_address": "Bitte geben Sie eine Adresse ein"
  },
  fil: {
    "connect_prompt": "Ikonekta ang Inyong Wallet",
    "search_placeholder": "Tingnan ang anumang wallet address...",
    "search_ans_placeholder": "Hanapin ang anumang wallet o ANS",
    "viewing_label": "Tinitingnan",
    "portfolio_value": "Halaga ng Portfolio",
    "total_assets": "Kabuuang Assets",
    "collections": "Mga Koleksyon",
    "top_collection": "Nangungunang Koleksyon",
    "collector_metrics": "Mga Sukatan ng Koleksyonista",
    "defi_positions": "Mga Posisyon sa DeFi",
    "error_empty_input": "Pakisuyo lagyan ng address o ANS na pangalan",
    "error_invalid_format": "Hindi tamang format ng address o ANS na pangalan",
    "error_empty_address": "Pakisuyo lagyan ng address"
  },
  fr: {
    "connect_prompt": "Connecter votre Portefeuille",
    "search_placeholder": "Voir n'importe quelle adresse de portefeuille...",
    "search_ans_placeholder": "Rechercher n'importe quel portefeuille ou ANS",
    "viewing_label": "Visualisation",
    "portfolio_value": "Valeur du Portfolio",
    "total_assets": "Total des Actifs",
    "collections": "Collections",
    "top_collection": "Collection Principale",
    "collector_metrics": "Métriques du Collectionneur",
    "defi_positions": "Positions DeFi",
    "error_empty_input": "Veuillez saisir une adresse ou un nom ANS",
    "error_invalid_format": "Format d'adresse ou nom ANS invalide",
    "error_empty_address": "Veuillez saisir une adresse"
  },
  ha: {
    "connect_prompt": "Haɗa Walat ɗin ku",
    "search_placeholder": "Duba kowane adireshin walat...",
    "search_ans_placeholder": "Nemo kowane walat ko ANS",
    "viewing_label": "Ana Kallo",
    "portfolio_value": "Darajar Portfolio",
    "total_assets": "Jimillar Kadarori",
    "collections": "Tarin",
    "top_collection": "Babban Tarin",
    "collector_metrics": "Ma'aunin Mai Tarawa",
    "defi_positions": "Matsayi na DeFi",
    "error_empty_input": "Da fatan za a shigar da adireshi ko sunan ANS",
    "error_invalid_format": "Tsarin adireshi mara daidaituwa ko sunan ANS",
    "error_empty_address": "Da fatan za a shigar da adireshi"
  },
  hi: {
    "connect_prompt": "अपना वॉलेट कनेक्ट करें",
    "search_placeholder": "कोई भी वॉलेट पता देखें...",
    "search_ans_placeholder": "कोई भी वॉलेट या ANS खोजें",
    "viewing_label": "देख रहे हैं",
    "portfolio_value": "पोर्टफोलियो मूल्य",
    "total_assets": "कुल संपत्ति",
    "collections": "संग्रह",
    "top_collection": "शीर्ष संग्रह",
    "collector_metrics": "संग्रहकर्ता मेट्रिक्स",
    "defi_positions": "DeFi पोजीशन",
    "error_empty_input": "कृपया एक पता या ANS नाम दर्ज करें",
    "error_invalid_format": "अमान्य पता प्रारूप या ANS नाम",
    "error_empty_address": "कृपया एक पता दर्ज करें"
  },
  ja: {
    "connect_prompt": "ウォレットを接続",
    "search_placeholder": "任意のウォレットアドレスを表示...",
    "search_ans_placeholder": "任意のウォレットまたはANSを検索",
    "viewing_label": "表示中",
    "portfolio_value": "ポートフォリオ価値",
    "total_assets": "総資産",
    "collections": "コレクション",
    "top_collection": "トップコレクション",
    "collector_metrics": "コレクターメトリクス",
    "defi_positions": "DeFiポジション",
    "error_empty_input": "アドレスまたはANS名を入力してください",
    "error_invalid_format": "無効なアドレス形式またはANS名",
    "error_empty_address": "アドレスを入力してください"
  },
  ko: {
    "connect_prompt": "지갑 연결",
    "search_placeholder": "임의의 지갑 주소 보기...",
    "search_ans_placeholder": "임의의 지갑 또는 ANS 검색",
    "viewing_label": "보기",
    "portfolio_value": "포트폴리오 가치",
    "total_assets": "총 자산",
    "collections": "컬렉션",
    "top_collection": "상위 컬렉션",
    "collector_metrics": "컬렉터 메트릭",
    "defi_positions": "DeFi 포지션",
    "error_empty_input": "주소 또는 ANS 이름을 입력하세요",
    "error_invalid_format": "유효하지 않은 주소 형식 또는 ANS 이름",
    "error_empty_address": "주소를 입력하세요"
  },
  pcm: {
    "connect_prompt": "Connect Your Wallet",
    "search_placeholder": "Check any wallet address...",
    "search_ans_placeholder": "Find any wallet or ANS",
    "viewing_label": "Dey Look",
    "portfolio_value": "Portfolio Value",
    "total_assets": "Total Assets",
    "collections": "Collections",
    "top_collection": "Top Collection",
    "collector_metrics": "Collector Metrics",
    "defi_positions": "DeFi Positions",
    "error_empty_input": "Abeg enter address or ANS name",
    "error_invalid_format": "Bad address format or ANS name",
    "error_empty_address": "Abeg enter address"
  },
  pl: {
    "connect_prompt": "Połącz swój portfel",
    "search_placeholder": "Zobacz dowolny adres portfela...",
    "search_ans_placeholder": "Szukaj dowolnego portfela lub ANS",
    "viewing_label": "Przeglądasz",
    "portfolio_value": "Wartość portfolio",
    "total_assets": "Łączne aktywa",
    "collections": "Kolekcje",
    "top_collection": "Najlepsza kolekcja",
    "collector_metrics": "Metryki kolekcjonera",
    "defi_positions": "Pozycje DeFi",
    "error_empty_input": "Wprowadź adres lub nazwę ANS",
    "error_invalid_format": "Nieprawidłowy format adresu lub nazwa ANS",
    "error_empty_address": "Wprowadź adres"
  },
  pt: {
    "connect_prompt": "Conectar sua Carteira",
    "search_placeholder": "Ver qualquer endereço de carteira...",
    "search_ans_placeholder": "Pesquisar qualquer carteira ou ANS",
    "viewing_label": "Visualizando",
    "portfolio_value": "Valor do Portfolio",
    "total_assets": "Total de Ativos",
    "collections": "Coleções",
    "top_collection": "Coleção Principal",
    "collector_metrics": "Métricas do Colecionador",
    "defi_positions": "Posições DeFi",
    "error_empty_input": "Por favor insira um endereço ou nome ANS",
    "error_invalid_format": "Formato de endereço inválido ou nome ANS",
    "error_empty_address": "Por favor insira um endereço"
  },
  ru: {
    "connect_prompt": "Подключить Кошелёк",
    "search_placeholder": "Посмотреть любой адрес кошелька...",
    "search_ans_placeholder": "Поиск любого кошелька или ANS",
    "viewing_label": "Просмотр",
    "portfolio_value": "Стоимость Портфеля",
    "total_assets": "Общие Активы",
    "collections": "Коллекции",
    "top_collection": "Топ Коллекция",
    "collector_metrics": "Метрики Коллекционера",
    "defi_positions": "DeFi Позиции",
    "error_empty_input": "Пожалуйста, введите адрес или имя ANS",
    "error_invalid_format": "Неверный формат адреса или имя ANS",
    "error_empty_address": "Пожалуйста, введите адрес"
  },
  sw: {
    "connect_prompt": "Unganisha Mkoba Wako",
    "search_placeholder": "Ona anwani yoyote ya mkoba...",
    "search_ans_placeholder": "Tafuta mkoba wowote au ANS",
    "viewing_label": "Inaangalia",
    "portfolio_value": "Thamani ya Kasha",
    "total_assets": "Jumla ya Mali",
    "collections": "Makusanyiko",
    "top_collection": "Mkusanyiko wa Juu",
    "collector_metrics": "Vipimo vya Mkusanyaji",
    "defi_positions": "Nafasi za DeFi",
    "error_empty_input": "Tafadhali ingiza anwani au jina la ANS",
    "error_invalid_format": "Umbizo batili wa anwani au jina la ANS",
    "error_empty_address": "Tafadhali ingiza anwani"
  },
  vi: {
    "connect_prompt": "Kết nối Ví của bạn",
    "search_placeholder": "Xem bất kỳ địa chỉ ví nào...",
    "search_ans_placeholder": "Tìm kiếm bất kỳ ví hoặc ANS nào",
    "viewing_label": "Đang xem",
    "portfolio_value": "Giá trị Danh mục",
    "total_assets": "Tổng Tài sản",
    "collections": "Bộ sưu tập",
    "top_collection": "Bộ sưu tập Hàng đầu",
    "collector_metrics": "Số liệu Người sưu tập",
    "defi_positions": "Vị thế DeFi",
    "error_empty_input": "Vui lòng nhập địa chỉ hoặc tên ANS",
    "error_invalid_format": "Định dạng địa chỉ không hợp lệ hoặc tên ANS",
    "error_empty_address": "Vui lòng nhập địa chỉ"
  },
  yo: {
    "connect_prompt": "So Àpò-owó Rẹ Pọ̀",
    "search_placeholder": "Wo àdírẹ́sì àpò-owó èyíkéyìí...",
    "search_ans_placeholder": "Wá àpò-owó tàbí ANS èyíkéyìí",
    "viewing_label": "Ń wò",
    "portfolio_value": "Iye Àpò-owó",
    "total_assets": "Àpapọ̀ Ohun-ìní",
    "collections": "Àkójọpọ̀",
    "top_collection": "Àkójọpọ̀ Gíga",
    "collector_metrics": "Ìwọ̀n Olùgbà",
    "defi_positions": "Àwọn Ipò DeFi",
    "error_empty_input": "Jọ̀wọ́ tẹ àdírẹ́sì tàbí orúkọ ANS",
    "error_invalid_format": "Ọ̀nà àdírẹ́sì tàbí orúkọ ANS kò tọ́",
    "error_empty_address": "Jọ̀wọ́ tẹ àdírẹ́sì"
  },
  "zh-CN": {
    "connect_prompt": "连接您的钱包",
    "search_placeholder": "查看任意钱包地址...",
    "search_ans_placeholder": "搜索任意钱包或ANS",
    "viewing_label": "查看中",
    "portfolio_value": "投资组合价值",
    "total_assets": "总资产",
    "collections": "收藏品",
    "top_collection": "顶级收藏品",
    "collector_metrics": "收藏家指标",
    "defi_positions": "DeFi头寸",
    "error_empty_input": "请输入地址或ANS名称",
    "error_invalid_format": "无效的地址格式或ANS名称",
    "error_empty_address": "请输入地址"
  }
};

console.log('🔧 Fixing portfolio.wallet translations in all languages...\n');

let updatedCount = 0;
let errorCount = 0;

Object.entries(portfolioWalletTranslations).forEach(([lang, walletTranslations]) => {
  const filePath = path.join(localesPath, lang, 'common.json');
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Update portfolio.wallet if it exists
    if (data.portfolio?.wallet) {
      const hasChanges = Object.keys(walletTranslations).some(key => 
        data.portfolio.wallet[key] !== walletTranslations[key]
      );
      
      if (hasChanges) {
        data.portfolio.wallet = walletTranslations;
        
        // Write back the file
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
        
        console.log(`✅ ${lang}: Updated portfolio.wallet translations`);
        updatedCount++;
      } else {
        console.log(`✅ ${lang}: Already up to date`);
      }
    } else {
      console.log(`⚠️  ${lang}: portfolio.wallet not found`);
    }
  } catch (error) {
    console.error(`❌ ${lang}: Error updating file - ${error}`);
    errorCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Updated: ${updatedCount} files`);
console.log(`   Errors: ${errorCount}`);
console.log(`\n✨ Portfolio wallet translations fixed!`);