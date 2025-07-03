#!/usr/bin/env python3
"""
Script to add Spanish translations to DeFi protocols.
This script will update the protocols.ts file to add Spanish translations for all protocol descriptions.
"""

import re
import os

# Spanish translations for protocol descriptions
PROTOCOL_TRANSLATIONS = {
    'Panora': 'Un "meta-DEX" que se conecta a un libro de órdenes en cadena y más de 10 AMMs, dividiendo órdenes entre pools mientras mantiene una lista canónica de tokens que se actualiza automáticamente en su interfaz.',
    'Kana': 'Enruta intercambios a través de nueve cadenas; un contrato Paymaster permite a los usuarios operar en Aptos sin poseer APT para gas; un motor de perpetuos basado en libro de órdenes.',
    'Thetis': 'Thetis agrupa un agregador de spot, perpetuos 50×, y pools de arranque de liquidez (LBPs) bajo un mismo techo.',
    'Anqa': 'Afirma tener 99% de cobertura de liquidez en más de 15 DEXes de Aptos; muestreo en tiempo real previsualiza el slippage antes de firmar y permite agrupar intercambios multi-token para ahorrar gas.',
    'Thala': 'Una suite de aplicaciones DeFi que incluye un AMM multi-pool, la stablecoin sobre-colateralizada MOD, y staking líquido vía sthAPT y thAPT.',
    'LiquidSwap': 'El AMM insignia de Pontem y el primer DEX en vivo en la mainnet de Aptos; ofrece pools clásicos Uniswap-V2, una curva de intercambio estable, y un diseño de liquidez concentrada formalmente verificado.',
    'Ichi': 'Las bóvedas de Gestor de Liquidez Automatizado permiten a los proyectos sembrar liquidez unilateral; rangos inteligentes se rebalancean para reducir pérdidas impermanentes mientras las tesorerías ganan comisiones de intercambio en su token nativo.',
    'Econia': 'Un libro de órdenes hiperparalelo en cadena optimizado para la concurrencia optimista de Aptos; procesa mercados en paralelo con finalidad subsegundo y expone un stack completo de datos REST/MQTT.',
    'Cellana': 'Un AMM ve(3,3) donde los votantes veNFT dirigen las emisiones y capturan 100% de las comisiones.',
    'PancakeSwap': 'El DEX insignia de Binance clonó su AMM V2 en Move y transfirió algo de liquidez CAKE a Aptos.',
    'SushiSwap': 'Sushi ejecutó su primera integración no-EVM, habilitando rutas cross-chain que se liquidan en Aptos mientras preservan la UX familiar del router Trident.',
    'Hyperion': 'Un híbrido Order-book + CL-AMM completamente en cadena que aprovecha el throughput de Aptos para trading estilo HFT.',
    'Merkle': 'Un DEX de perps gamificado con XP, loot-boxes, y apalancamiento 150×; más de $20b de volumen total.',
    'AGDEX': 'Ofrece perps cross-margin 1-100× con fills de oráculo de bajo impacto que mantienen el slippage ajustado para traders retail.',
    'Pump': 'Cualquiera puede crear tokens meme vía curvas de bonding; cada coin se lanza de forma justa sin preventa o asignación de equipo.',
    'Emojicoin': 'Permite a usuarios crear tokens mapeados 1-a-1 con emojis Unicode; cada lanzamiento usa la curva CL-AMM de Econia para descubrimiento instantáneo de precios y especulación.',
    'Aries': 'El primer mercado monetario estilo Compound en Aptos, actualizado con E-Mode 90%-LTV, bridging integrado, y spot trading en una interfaz.',
    'Superposition': 'Plataforma avanzada de gestión de riesgo inspirada en el FHS VaR del Banco de Inglaterra, ofreciendo oportunidades de rendimiento apalancado con monitoreo de riesgo en tiempo real y ajuste dinámico del factor de colateral.',
    'Joule': 'Combina pools de préstamos aislados con "Anclas de Liquidez" para farming apalancado.',
    'Echelon': 'Un hub de préstamos que soporta tanto E-Mode como mercados aislados.',
    'Aptin': 'Plataforma de préstamos centrada en seguridad que usa el Move Prover para verificación formal y controles de riesgo granulares de pools aislados.',
    'Meso': 'Préstamos capital-eficientes con límites de deuda configurables por usuario y un Módulo de Seguridad que respalda los déficits del protocolo.',
    'TruFin': 'Staking líquido de grado empresarial; los usuarios reciben TruAPT a cambio de hacer staking de APT.',
    'Amnis': 'Sistema de token dual emite stAPT (que genera rendimiento) y amAPT (estable), permitiendo a usuarios alternar entre rendimiento y estabilidad mientras redirige comisiones de validador de vuelta a los stakers.',
    'Tapp': 'El primer DEX estilo Uniswap V4 modular habilitado para hooks en testnet de Aptos; hooks de contratos inteligentes permiten a constructores componer pools personalizados mientras usuarios obtienen swaps programables.',
    'Kofi': 'Staking líquido mejorado por MEV con bóvedas LSD apalancadas.',
    'Vibrant X': 'Optimizador de rendimiento y dashboard de portafolio que reasigna depósitos a pools de Aptos con mayor APY.',
    'Moar': 'Construyendo una capa de farming apalancado con cuentas de crédito cross-protocolo habilitando a usuarios pedir prestado en un lugar y desplegar en otro.',
}

CATEGORY_BREAKDOWN_TRANSLATIONS = {
    'Trading • Yield • Credit': 'Trading • Rendimiento • Crédito',
}

def update_protocols_file(file_path):
    """Update the protocols.ts file with Spanish translations."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Pattern to match description objects
        desc_pattern = r"description: {\s*en: '([^']+)',?\s*},"
        
        def replace_description(match):
            en_description = match.group(1)
            
            # Find the corresponding Spanish translation
            for protocol_name, es_description in PROTOCOL_TRANSLATIONS.items():
                if protocol_name.lower() in en_description.lower() or any(word in en_description.lower() for word in protocol_name.lower().split()):
                    return f"""description: {{
      en: '{en_description}',
      es: '{es_description}',
    }},"""
            
            # If no specific translation found, return original
            return match.group(0)
        
        # Replace descriptions
        content = re.sub(desc_pattern, replace_description, content)
        
        # Pattern to match categoryBreakdown objects
        breakdown_pattern = r"categoryBreakdown: {\s*en: '([^']+)',?\s*},"
        
        def replace_breakdown(match):
            en_breakdown = match.group(1)
            es_breakdown = CATEGORY_BREAKDOWN_TRANSLATIONS.get(en_breakdown, en_breakdown)
            
            return f"""categoryBreakdown: {{
      en: '{en_breakdown}',
      es: '{es_breakdown}',
    }},"""
        
        # Replace category breakdowns
        content = re.sub(breakdown_pattern, replace_breakdown, content)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"Successfully updated {file_path}")
        
    except Exception as e:
        print(f"Error updating file: {e}")

def main():
    """Main function to run the translation update."""
    protocols_file = "components/pages/defi/data/protocols.ts"
    
    if not os.path.exists(protocols_file):
        print(f"Error: {protocols_file} not found")
        return
    
    print("Updating protocols.ts with Spanish translations...")
    update_protocols_file(protocols_file)
    print("Translation update complete!")

if __name__ == "__main__":
    main() 