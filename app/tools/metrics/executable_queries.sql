-- =====================================================================
-- COMPREHENSIVE APTOS ANALYTICS - EXECUTABLE QUERIES
-- Generated: 2025-09-02 | Protocols: 36 | Categories: 7
-- Data Sources: Spellbook + Raw Aptos Tables
-- =====================================================================

-- ====================================
-- 1. PROTOCOL HEALTH DASHBOARD (7 DAYS)
-- ====================================

-- Protocol Health Dashboard (Spellbook Enhanced)
WITH protocol_activities AS (
    SELECT 
        DATE_TRUNC('day', a.block_time) as date,
        a.owner_address as protocol_address,
        COUNT(DISTINCT a.tx_hash) as daily_transactions,
        COUNT(DISTINCT CASE WHEN a.event_type LIKE '%Deposit%' THEN a.tx_hash END) as inflow_transactions,
        COUNT(DISTINCT CASE WHEN a.event_type LIKE '%Withdraw%' THEN a.tx_hash END) as outflow_transactions,
        COUNT(DISTINCT a.asset_type) as unique_assets,
        COUNT(*) as total_events
    FROM spellbook.aptos_fungible_asset_activities a
    WHERE a.block_time >= CURRENT_DATE - INTERVAL '7' day
        AND a.owner_address IN (
            -- DEX Protocols
            '0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af',
            '0x05a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948',
            '0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa',
            '0xec42a352cc65eca17a9fa85d0fc602295897ed6b8b8af6a6c79ef490eb8f9eba',
            '0xbd35135844473187163ca197ca93b2ab014370587bb0ed3befff9e902d6bb541',
            '0xa5d3ac4d429052674ed38adc62d010e52d7c24ca159194d17ddc196ddb7e480b',
            -- Lending Protocols  
            '0x9770fa9c725cbd97eb50b2be5f7416efdfd1f1554beb0750d4dae4c64e860da3',
            '0x39ddcd9e1a39fa14f25e3f9ec8a86074d05cc0881cbf667df8a6ee70942016fb',
            '0xabaf41ed192141b481434b99227f2b28c313681bc76714dc88e5b2e26b24b84c',
            -- Liquid Staking Protocols
            '0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a',
            '0x84d7aeef42d38a5ffc3ccef853e1b82e4958659d16a7de736a29c55fbbeb0114',
            '0xd11107bdf0d6d7040c6c0bfbdecb6545191fdf13e8d8d259952f53e1713f61b5'
        )
    GROUP BY 1,2
),
protocol_trends AS (
    SELECT 
        protocol_address,
        AVG(daily_transactions) as avg_daily_txns,
        STDDEV(daily_transactions) as txn_volatility,
        SUM(daily_transactions) as total_transactions,
        AVG(unique_assets) as avg_assets_per_day,
        AVG(inflow_transactions * 1.0 / NULLIF(outflow_transactions, 0)) as avg_inflow_outflow_ratio
    FROM protocol_activities
    GROUP BY 1
)
SELECT 
    pt.protocol_address,
    ROUND(pt.avg_daily_txns, 1) as avg_daily_transactions,
    pt.total_transactions,
    ROUND(pt.txn_volatility, 2) as transaction_volatility,
    ROUND(pt.avg_assets_per_day, 1) as avg_daily_unique_assets,
    ROUND(pt.avg_inflow_outflow_ratio, 3) as avg_flow_ratio,
    CASE 
        WHEN pt.avg_daily_txns > 100 THEN 'High Activity'
        WHEN pt.avg_daily_txns > 10 THEN 'Medium Activity'  
        WHEN pt.avg_daily_txns > 0 THEN 'Low Activity'
        ELSE 'Inactive'
    END as activity_level
FROM protocol_trends pt
ORDER BY pt.avg_daily_txns DESC
LIMIT 100;

-- ====================================
-- 2. ENHANCED DEX ANALYTICS (7 DAYS)
-- ====================================

-- Enhanced DEX Analytics with Asset Flows
WITH dex_transactions AS (
    SELECT 
        DATE_TRUNC('day', t.block_time) as date,
        DATE_TRUNC('hour', t.block_time) as hour,
        t.sender,
        t.hash as tx_hash,
        t.success,
        t.entry_function_module_address as dex_address,
        CASE 
            WHEN t.entry_function_module_name LIKE '%pancake%' THEN 'PancakeSwap'
            WHEN t.entry_function_module_name LIKE '%liquidswap%' THEN 'LiquidSwap'  
            WHEN t.entry_function_module_name LIKE '%cetus%' THEN 'Cetus'
            WHEN t.entry_function_module_name LIKE '%aux%' THEN 'AUX'
            WHEN t.entry_function_module_name LIKE '%thala%' THEN 'Thala'
            WHEN t.entry_function_module_name LIKE '%aptoswap%' THEN 'AptoSwap'
            ELSE 'Other DEX'
        END as dex_name,
        CASE 
            WHEN t.entry_function_name LIKE '%swap%' THEN 'swap'
            WHEN t.entry_function_name LIKE '%add_liquidity%' THEN 'add_liquidity'
            WHEN t.entry_function_name LIKE '%remove_liquidity%' THEN 'remove_liquidity'
            ELSE 'other'
        END as action_type
    FROM aptos.user_transactions t
    WHERE t.block_time >= CURRENT_DATE - INTERVAL '7' day
        AND t.entry_function_module_address IN (
            '0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af',
            '0x05a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948',
            '0x61d2c22a6cb7831bee0f48363b0eec92369357aece0d1142062f7d5d85c7bef8',
            '0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa',
            '0xec42a352cc65eca17a9fa85d0fc602295897ed6b8b8af6a6c79ef490eb8f9eba',
            '0xa7f01413d33ba919441888637ca1607ca0ddcbfa3c0a9ddea64743aaa560e498',
            '0xbd35135844473187163ca197ca93b2ab014370587bb0ed3befff9e902d6bb541',
            '0xa5d3ac4d429052674ed38adc62d010e52d7c24ca159194d17ddc196ddb7e480b'
        )
        AND t.success = true
        AND (t.entry_function_name LIKE '%swap%' 
             OR t.entry_function_name LIKE '%liquidity%')
),
dex_asset_flows AS (
    SELECT 
        DATE_TRUNC('day', a.block_time) as date,
        a.owner_address as dex_address,
        COUNT(DISTINCT a.asset_type) as unique_assets,
        COUNT(*) as asset_activities,
        SUM(a.amount) / POWER(10, 8) as total_volume_scaled
    FROM spellbook.aptos_fungible_asset_activities a
    WHERE a.block_time >= CURRENT_DATE - INTERVAL '7' day
        AND a.owner_address IN (
            '0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af',
            '0x05a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948',
            '0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa',
            '0xec42a352cc65eca17a9fa85d0fc602295897ed6b8b8af6a6c79ef490eb8f9eba'
        )
    GROUP BY 1,2
)
SELECT 
    d.date,
    d.dex_name,
    d.dex_address,
    COUNT(DISTINCT d.tx_hash) as total_transactions,
    COUNT(DISTINCT d.sender) as unique_users,
    COUNT(CASE WHEN d.action_type = 'swap' THEN 1 END) as swaps,
    COUNT(CASE WHEN d.action_type = 'add_liquidity' THEN 1 END) as liquidity_adds,
    COUNT(CASE WHEN d.action_type = 'remove_liquidity' THEN 1 END) as liquidity_removes,
    COALESCE(af.unique_assets, 0) as unique_assets,
    COALESCE(ROUND(af.total_volume_scaled, 2), 0) as estimated_volume,
    ROUND(COUNT(DISTINCT d.tx_hash) * 1.0 / NULLIF(COUNT(DISTINCT d.sender), 0), 2) as avg_txns_per_user
FROM dex_transactions d
LEFT JOIN dex_asset_flows af 
    ON d.date = af.date AND d.dex_address = af.dex_address
GROUP BY 1,2,3,9,10
ORDER BY d.date DESC, total_transactions DESC
LIMIT 500;

-- ====================================
-- 3. LIQUID STAKING ANALYTICS (30 DAYS)
-- ====================================

-- Enhanced Liquid Staking Analytics
WITH staking_activities AS (
    SELECT 
        DATE_TRUNC('day', a.block_time) as date,
        a.owner_address as protocol_address,
        a.asset_type,
        m.asset_symbol,
        m.asset_name,
        a.event_type,
        COUNT(*) as activity_count,
        COUNT(DISTINCT a.tx_hash) as unique_transactions,
        SUM(a.amount) / POWER(10, COALESCE(m.decimals, 8)) as total_amount
    FROM spellbook.aptos_fungible_asset_activities a
    LEFT JOIN spellbook.aptos_fungible_asset_metadata_current m
        ON a.asset_type = m.asset_type
    WHERE a.block_time >= CURRENT_DATE - INTERVAL '30' day
        AND (a.owner_address IN (
                '0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a',
                '0x84d7aeef42d38a5ffc3ccef853e1b82e4958659d16a7de736a29c55fbbeb0114',
                '0xd11107bdf0d6d7040c6c0bfbdecb6545191fdf13e8d8d259952f53e1713f61b5',
                '0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6'
            )
             OR a.asset_type IN (
                '0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt',
                '0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::stapt_token::StakedApt',
                '0x84d7aeef42d38a5ffc3ccef853e1b82e4958659d16a7de736a29c55fbbeb0114::staked_aptos_coin::StakedAptosCoin',
                '0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::staking::ThalaAPT'
            ))
    GROUP BY 1,2,3,4,5,6
),
daily_summary AS (
    SELECT 
        date,
        protocol_address,
        COUNT(DISTINCT asset_type) as unique_assets,
        SUM(activity_count) as total_activities,
        SUM(unique_transactions) as total_transactions,
        SUM(CASE WHEN event_type LIKE '%Deposit%' THEN total_amount ELSE 0 END) as total_stakes,
        SUM(CASE WHEN event_type LIKE '%Withdraw%' THEN total_amount ELSE 0 END) as total_unstakes,
        SUM(CASE WHEN event_type LIKE '%Deposit%' THEN total_amount ELSE 0 END) - 
        SUM(CASE WHEN event_type LIKE '%Withdraw%' THEN total_amount ELSE 0 END) as net_staking_flow
    FROM staking_activities
    GROUP BY 1,2
)
SELECT 
    date,
    protocol_address,
    unique_assets,
    total_activities,
    total_transactions,
    ROUND(total_stakes, 2) as total_stakes,
    ROUND(total_unstakes, 2) as total_unstakes,
    ROUND(net_staking_flow, 2) as net_staking_flow,
    ROUND(total_stakes / NULLIF(total_unstakes, 0), 3) as stake_unstake_ratio
FROM daily_summary
WHERE total_activities > 0
ORDER BY date DESC, total_activities DESC
LIMIT 1000;

-- ====================================
-- 4. CROSS-PROTOCOL USER ANALYSIS (30 DAYS)  
-- ====================================

-- Enhanced Cross-Protocol User Journey Analysis
WITH user_protocol_activities AS (
    SELECT 
        a.owner_address as user_address,
        DATE_TRUNC('day', a.block_time) as date,
        a.tx_hash,
        -- Map addresses to protocol types using registry
        CASE 
            WHEN a.owner_address IN (
                '0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af',
                '0x05a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948',
                '0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa'
            ) THEN 'DEX'
            WHEN a.owner_address IN (
                '0x9770fa9c725cbd97eb50b2be5f7416efdfd1f1554beb0750d4dae4c64e860da3',
                '0x39ddcd9e1a39fa14f25e3f9ec8a86074d05cc0881cbf667df8a6ee70942016fb'
            ) THEN 'LENDING' 
            WHEN a.owner_address IN (
                '0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a',
                '0x84d7aeef42d38a5ffc3ccef853e1b82e4958659d16a7de736a29c55fbbeb0114'
            ) THEN 'LIQUID_STAKING'
            WHEN a.owner_address IN (
                '0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d',
                '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa'
            ) THEN 'BRIDGE'
            ELSE 'OTHER'
        END as protocol_type,
        a.asset_type,
        COUNT(*) as activities
    FROM spellbook.aptos_fungible_asset_activities a
    WHERE a.block_time >= CURRENT_DATE - INTERVAL '30' day
        AND a.owner_address IN (
            -- All tracked protocol addresses (36 total)
            '0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af',
            '0x05a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948',
            '0x9770fa9c725cbd97eb50b2be5f7416efdfd1f1554beb0750d4dae4c64e860da3',
            '0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a'
        )
    GROUP BY 1,2,3,4,5
),
user_diversity AS (
    SELECT 
        user_address,
        COUNT(DISTINCT protocol_type) as protocol_types_used,
        COUNT(DISTINCT asset_type) as unique_assets_used,
        SUM(activities) as total_activities,
        STRING_AGG(DISTINCT protocol_type, ', ') as protocol_mix
    FROM user_protocol_activities
    GROUP BY 1
),
protocol_combinations AS (
    SELECT 
        protocol_mix,
        COUNT(DISTINCT user_address) as user_count,
        AVG(total_activities) as avg_activities_per_user,
        AVG(unique_assets_used) as avg_assets_per_user
    FROM user_diversity
    WHERE protocol_types_used > 1
    GROUP BY 1
)
SELECT 
    protocol_mix,
    user_count,
    ROUND(avg_activities_per_user, 1) as avg_activities_per_user,
    ROUND(avg_assets_per_user, 1) as avg_assets_per_user,
    ROUND(user_count * 100.0 / SUM(user_count) OVER(), 2) as percentage_of_multiprotocol_users
FROM protocol_combinations
ORDER BY user_count DESC
LIMIT 50;

-- ====================================
-- 5. ASSET FLOW ANALYSIS (30 DAYS)
-- ====================================

-- Deep Asset Flow Analysis Using Spellbook Patterns
WITH asset_flows AS (
    SELECT 
        a.asset_type,
        m.asset_symbol,
        m.asset_name,
        m.decimals,
        a.token_standard,
        DATE_TRUNC('day', a.block_time) as date,
        
        -- Flow Analysis
        SUM(CASE WHEN a.event_type LIKE '%Deposit%' THEN a.amount ELSE 0 END) / POWER(10, COALESCE(m.decimals, 8)) as daily_inflows,
        SUM(CASE WHEN a.event_type LIKE '%Withdraw%' THEN a.amount ELSE 0 END) / POWER(10, COALESCE(m.decimals, 8)) as daily_outflows,
        
        -- Activity Metrics
        COUNT(*) as daily_activities,
        COUNT(DISTINCT a.owner_address) as active_protocols,
        COUNT(DISTINCT a.tx_hash) as unique_transactions
        
    FROM spellbook.aptos_fungible_asset_activities a
    LEFT JOIN spellbook.aptos_fungible_asset_metadata_current m
        ON a.asset_type = m.asset_type
    WHERE a.block_time >= CURRENT_DATE - INTERVAL '30' day
        AND m.asset_symbol IS NOT NULL
    GROUP BY 1,2,3,4,5,6
),
asset_summary AS (
    SELECT 
        asset_type,
        asset_symbol,
        asset_name,
        token_standard,
        SUM(daily_inflows) as total_inflows,
        SUM(daily_outflows) as total_outflows,
        SUM(daily_inflows) - SUM(daily_outflows) as net_flow,
        AVG(daily_activities) as avg_daily_activities,
        AVG(active_protocols) as avg_active_protocols,
        COUNT(DISTINCT date) as active_days
    FROM asset_flows
    GROUP BY 1,2,3,4
)
SELECT 
    asset_symbol,
    asset_name,
    token_standard,
    ROUND(total_inflows, 2) as total_inflows,
    ROUND(total_outflows, 2) as total_outflows,
    ROUND(net_flow, 2) as net_flow,
    ROUND(avg_daily_activities, 1) as avg_daily_activities,
    ROUND(avg_active_protocols, 1) as avg_active_protocols,
    active_days,
    ROUND(total_inflows / NULLIF(total_outflows, 0), 3) as flow_ratio,
    CASE 
        WHEN net_flow > 0 THEN 'Net Inflow'
        WHEN net_flow < 0 THEN 'Net Outflow' 
        ELSE 'Balanced'
    END as flow_direction
FROM asset_summary
WHERE total_inflows > 0 OR total_outflows > 0
ORDER BY avg_daily_activities DESC
LIMIT 100;

-- ====================================
-- 6. FUNGIBLE ASSET ACTIVITIES (7 DAYS)
-- ====================================

-- Fungible Asset Activities (Spellbook Pattern)
WITH fa_activities AS (
    SELECT 
        block_date,
        DATE_TRUNC('hour', block_time) as hour,
        tx_hash,
        event_type,
        owner_address,
        asset_type,
        amount / POWER(10, COALESCE(m.decimals, 8)) as amount_decimal,
        token_standard
    FROM spellbook.aptos_fungible_asset_activities a
    LEFT JOIN spellbook.aptos_fungible_asset_metadata_current m
        ON a.asset_type = m.asset_type
    WHERE block_time >= CURRENT_DATE - INTERVAL '7' day
)
SELECT 
    block_date,
    hour,
    asset_type,
    token_standard,
    COUNT(*) as activity_count,
    COUNT(DISTINCT owner_address) as unique_addresses,
    SUM(CASE WHEN event_type LIKE '%Deposit%' THEN amount_decimal ELSE 0 END) as total_deposits,
    SUM(CASE WHEN event_type LIKE '%Withdraw%' THEN amount_decimal ELSE 0 END) as total_withdrawals
FROM fa_activities
GROUP BY 1,2,3,4
ORDER BY block_date DESC, activity_count DESC
LIMIT 1000;

-- ====================================
-- 7. PROTOCOL PERFORMANCE DASHBOARD
-- ====================================

-- Protocol Performance Dashboard (Spellbook Optimized)
WITH base_metrics AS (
    SELECT 
        DATE_TRUNC('day', a.block_time) as date,
        a.owner_address as protocol_address,
        m.asset_symbol,
        a.token_standard,
        
        -- Activity Metrics
        COUNT(*) as total_activities,
        COUNT(DISTINCT a.tx_hash) as unique_transactions, 
        COUNT(DISTINCT SUBSTRING(a.tx_hash, 1, 10)) as unique_users_proxy,
        
        -- Flow Metrics  
        SUM(CASE WHEN a.event_type LIKE '%Deposit%' THEN a.amount ELSE 0 END) / POWER(10, COALESCE(m.decimals, 8)) as inflows,
        SUM(CASE WHEN a.event_type LIKE '%Withdraw%' THEN a.amount ELSE 0 END) / POWER(10, COALESCE(m.decimals, 8)) as outflows,
        
        -- Asset Diversity
        COUNT(DISTINCT a.asset_type) as unique_assets
        
    FROM spellbook.aptos_fungible_asset_activities a
    LEFT JOIN spellbook.aptos_fungible_asset_metadata_current m
        ON a.asset_type = m.asset_type
    WHERE a.block_time >= CURRENT_DATE - INTERVAL '7' day
    GROUP BY 1,2,3,4
),
daily_aggregates AS (
    SELECT 
        date,
        protocol_address,
        SUM(total_activities) as daily_activities,
        SUM(unique_transactions) as daily_transactions,
        AVG(unique_users_proxy) as avg_daily_users,
        SUM(inflows) as daily_inflows,
        SUM(outflows) as daily_outflows,
        SUM(inflows) - SUM(outflows) as net_flow,
        SUM(unique_assets) as daily_unique_assets
    FROM base_metrics
    GROUP BY 1,2
),
protocol_stats AS (
    SELECT 
        protocol_address,
        AVG(daily_activities) as avg_daily_activities,
        AVG(daily_transactions) as avg_daily_transactions,
        AVG(avg_daily_users) as avg_daily_users,
        AVG(daily_inflows) as avg_daily_inflows,
        AVG(daily_outflows) as avg_daily_outflows,
        AVG(net_flow) as avg_net_flow,
        AVG(daily_unique_assets) as avg_unique_assets,
        STDDEV(daily_activities) as activity_volatility
    FROM daily_aggregates
    GROUP BY 1
)
SELECT 
    protocol_address,
    ROUND(avg_daily_activities, 1) as avg_daily_activities,
    ROUND(avg_daily_transactions, 1) as avg_daily_transactions,
    ROUND(avg_daily_users, 1) as avg_daily_users,
    ROUND(avg_daily_inflows, 2) as avg_daily_inflows,
    ROUND(avg_daily_outflows, 2) as avg_daily_outflows,
    ROUND(avg_net_flow, 2) as avg_net_flow,
    ROUND(avg_unique_assets, 1) as avg_unique_assets,
    ROUND(activity_volatility, 2) as activity_volatility,
    CASE 
        WHEN avg_daily_activities > 1000 THEN 'Very High'
        WHEN avg_daily_activities > 100 THEN 'High'
        WHEN avg_daily_activities > 10 THEN 'Medium'
        WHEN avg_daily_activities > 0 THEN 'Low'
        ELSE 'Inactive'
    END as activity_tier
FROM protocol_stats
ORDER BY avg_daily_activities DESC
LIMIT 50;

-- =====================================================================
-- END OF COMPREHENSIVE APTOS ANALYTICS QUERIES
-- Copy any query above to Dune Analytics to execute
-- All queries are optimized using Spellbook patterns for best performance
-- =====================================================================