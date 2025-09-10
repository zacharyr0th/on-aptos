/**
 * Advanced Aptos Analytics Query Collection
 * Production-ready SQL queries for deep blockchain analysis
 */

export class AdvancedAptosQueries {
  /**
   * MEV Detection and Analysis
   * Identifies potential MEV opportunities and sandwich attacks
   */
  static getMEVAnalysisQuery(): string {
    return `
-- MEV Detection and Sandwich Attack Analysis
WITH gas_price_analysis AS (
    SELECT 
        block_height,
        transaction_index,
        sender_address,
        gas_unit_price,
        gas_used,
        success,
        block_time,
        LAG(gas_unit_price) OVER (PARTITION BY block_height ORDER BY transaction_index) as prev_gas_price,
        LEAD(gas_unit_price) OVER (PARTITION BY block_height ORDER BY transaction_index) as next_gas_price,
        AVG(gas_unit_price) OVER (PARTITION BY block_height) as block_avg_gas_price
    FROM aptos.user_transactions
    WHERE block_time >= CURRENT_DATE - INTERVAL '7' day
        AND success = true
),
potential_mev AS (
    SELECT 
        block_height,
        sender_address,
        gas_unit_price,
        block_avg_gas_price,
        transaction_index,
        CASE 
            WHEN gas_unit_price > block_avg_gas_price * 2 THEN 'High Gas Front-run'
            WHEN prev_gas_price IS NOT NULL 
                 AND next_gas_price IS NOT NULL 
                 AND gas_unit_price > prev_gas_price * 1.5 
                 AND gas_unit_price > next_gas_price * 1.5 THEN 'Potential Sandwich'
            WHEN gas_unit_price > block_avg_gas_price * 1.5 THEN 'Potential Arbitrage'
            ELSE 'Normal'
        END as mev_type,
        gas_unit_price - block_avg_gas_price as gas_premium
    FROM gas_price_analysis
    WHERE gas_unit_price > block_avg_gas_price * 1.2
),
mev_summary AS (
    SELECT 
        DATE_TRUNC('day', block_time) as date,
        mev_type,
        COUNT(*) as transaction_count,
        COUNT(DISTINCT sender_address) as unique_addresses,
        AVG(gas_unit_price) as avg_gas_price,
        AVG(gas_premium) as avg_gas_premium,
        SUM(gas_used * gas_unit_price) / 1e8 as total_gas_apt
    FROM potential_mev pm
    JOIN aptos.user_transactions ut ON pm.block_height = ut.block_height 
        AND pm.sender_address = ut.sender_address
        AND pm.transaction_index = ut.transaction_index
    WHERE mev_type != 'Normal'
    GROUP BY 1, 2
)
SELECT 
    date,
    mev_type,
    transaction_count,
    unique_addresses,
    ROUND(avg_gas_price, 2) as avg_gas_price,
    ROUND(avg_gas_premium, 2) as avg_gas_premium,
    ROUND(total_gas_apt, 4) as total_gas_apt,
    ROUND(transaction_count::float / SUM(transaction_count) OVER (PARTITION BY date) * 100, 2) as mev_percentage_of_daily_txs
FROM mev_summary
ORDER BY date DESC, transaction_count DESC;
`;
  }

  /**
   * Whale Movement Tracking
   * Tracks large APT movements and whale behavior
   */
  static getWhaleTrackingQuery(): string {
    return `
-- Whale Movement and Large Transaction Analysis
WITH large_transfers AS (
    SELECT 
        block_time,
        sender_address,
        recipient_address,
        amount / 1e8 as amount_apt,
        transaction_version,
        CASE 
            WHEN amount / 1e8 >= 1000000 THEN 'Mega Whale (>1M APT)'
            WHEN amount / 1e8 >= 500000 THEN 'Large Whale (500K-1M APT)'
            WHEN amount / 1e8 >= 100000 THEN 'Whale (100K-500K APT)'
            WHEN amount / 1e8 >= 10000 THEN 'Large Holder (10K-100K APT)'
            ELSE 'Regular'
        END as whale_category
    FROM aptos.coin_activities
    WHERE coin_type = '0x1::aptos_coin::AptosCoin'
        AND activity_type = 'withdraw'
        AND block_time >= CURRENT_DATE - INTERVAL '30' day
        AND amount / 1e8 >= 10000  -- Only track 10K+ APT movements
),
whale_behavior AS (
    SELECT 
        sender_address,
        whale_category,
        COUNT(*) as transaction_count,
        SUM(amount_apt) as total_volume_apt,
        AVG(amount_apt) as avg_transaction_apt,
        MIN(amount_apt) as min_transaction_apt,
        MAX(amount_apt) as max_transaction_apt,
        COUNT(DISTINCT recipient_address) as unique_recipients,
        COUNT(DISTINCT DATE_TRUNC('day', block_time)) as active_days,
        MIN(block_time) as first_large_tx,
        MAX(block_time) as last_large_tx
    FROM large_transfers
    GROUP BY 1, 2
),
whale_network_analysis AS (
    SELECT 
        wb.*,
        -- Calculate activity frequency
        ROUND(wb.transaction_count::float / NULLIF(wb.active_days, 0), 2) as avg_transactions_per_day,
        -- Calculate distribution pattern
        ROUND(wb.unique_recipients::float / wb.transaction_count, 2) as distribution_ratio,
        -- Calculate consistency
        ROUND(wb.avg_transaction_apt / NULLIF(wb.max_transaction_apt, 0), 3) as consistency_ratio
    FROM whale_behavior wb
)
SELECT 
    sender_address as whale_address,
    whale_category,
    transaction_count,
    ROUND(total_volume_apt, 2) as total_volume_apt,
    ROUND(avg_transaction_apt, 2) as avg_transaction_apt,
    unique_recipients,
    active_days,
    avg_transactions_per_day,
    distribution_ratio,
    consistency_ratio,
    CASE 
        WHEN distribution_ratio > 0.8 THEN 'High Distribution'
        WHEN distribution_ratio > 0.5 THEN 'Moderate Distribution'
        ELSE 'Concentrated Trading'
    END as behavior_pattern,
    first_large_tx,
    last_large_tx
FROM whale_network_analysis
WHERE total_volume_apt >= 50000  -- Focus on most significant whales
ORDER BY total_volume_apt DESC
LIMIT 100;
`;
  }

  /**
   * Protocol Adoption and Growth Analysis
   * Tracks protocol growth, user acquisition, and retention
   */
  static getProtocolGrowthQuery(): string {
    return `
-- Protocol Adoption and Growth Analysis
WITH protocol_daily_metrics AS (
    SELECT 
        DATE_TRUNC('day', block_time) as date,
        entry_function_module_address as protocol_address,
        COUNT(DISTINCT sender_address) as daily_active_users,
        COUNT(*) as daily_transactions,
        SUM(gas_used * gas_unit_price) / 1e8 as daily_gas_apt,
        COUNT(*) FILTER (WHERE success = true) as successful_transactions,
        COUNT(DISTINCT entry_function_identifier) as unique_functions_used
    FROM aptos.user_transactions
    WHERE block_time >= CURRENT_DATE - INTERVAL '60' day
        AND entry_function_module_address IS NOT NULL
    GROUP BY 1, 2
),
new_user_acquisition AS (
    SELECT 
        DATE_TRUNC('day', first_tx_time) as acquisition_date,
        protocol_address,
        COUNT(*) as new_users
    FROM (
        SELECT 
            sender_address,
            entry_function_module_address as protocol_address,
            MIN(block_time) as first_tx_time
        FROM aptos.user_transactions
        WHERE block_time >= CURRENT_DATE - INTERVAL '60' day
            AND entry_function_module_address IS NOT NULL
        GROUP BY 1, 2
    ) first_interactions
    GROUP BY 1, 2
),
protocol_growth_analysis AS (
    SELECT 
        pdm.protocol_address,
        pdm.date,
        pdm.daily_active_users,
        pdm.daily_transactions,
        pdm.daily_gas_apt,
        pdm.successful_transactions::float / NULLIF(pdm.daily_transactions, 0) * 100 as success_rate,
        pdm.unique_functions_used,
        COALESCE(nua.new_users, 0) as new_users_acquired,
        
        -- Growth calculations
        LAG(pdm.daily_active_users, 7) OVER (
            PARTITION BY pdm.protocol_address 
            ORDER BY pdm.date
        ) as users_week_ago,
        
        LAG(pdm.daily_transactions, 7) OVER (
            PARTITION BY pdm.protocol_address 
            ORDER BY pdm.date
        ) as transactions_week_ago,
        
        -- Moving averages
        AVG(pdm.daily_active_users) OVER (
            PARTITION BY pdm.protocol_address 
            ORDER BY pdm.date 
            ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        ) as ma7_users,
        
        AVG(pdm.daily_transactions) OVER (
            PARTITION BY pdm.protocol_address 
            ORDER BY pdm.date 
            ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        ) as ma7_transactions
        
    FROM protocol_daily_metrics pdm
    LEFT JOIN new_user_acquisition nua ON pdm.protocol_address = nua.protocol_address 
        AND pdm.date = nua.acquisition_date
),
final_metrics AS (
    SELECT 
        protocol_address,
        date,
        daily_active_users,
        daily_transactions,
        ROUND(daily_gas_apt, 4) as daily_gas_apt,
        ROUND(success_rate, 2) as success_rate_pct,
        unique_functions_used,
        new_users_acquired,
        ROUND(ma7_users, 0) as ma7_avg_users,
        ROUND(ma7_transactions, 0) as ma7_avg_transactions,
        
        -- Growth rates
        CASE 
            WHEN users_week_ago > 0 THEN 
                ROUND((daily_active_users - users_week_ago)::float / users_week_ago * 100, 2)
            ELSE NULL
        END as user_growth_wow_pct,
        
        CASE 
            WHEN transactions_week_ago > 0 THEN 
                ROUND((daily_transactions - transactions_week_ago)::float / transactions_week_ago * 100, 2)
            ELSE NULL
        END as tx_growth_wow_pct,
        
        -- Health indicators
        CASE 
            WHEN daily_active_users > ma7_users * 1.2 THEN 'Growing Fast'
            WHEN daily_active_users > ma7_users * 1.1 THEN 'Growing'
            WHEN daily_active_users > ma7_users * 0.9 THEN 'Stable'
            ELSE 'Declining'
        END as trend_status
        
    FROM protocol_growth_analysis
    WHERE date >= CURRENT_DATE - INTERVAL '30' day
)
SELECT *
FROM final_metrics
WHERE protocol_address IN (
    -- Focus on top protocols by recent activity
    SELECT protocol_address
    FROM final_metrics
    WHERE date >= CURRENT_DATE - INTERVAL '7' day
    GROUP BY protocol_address
    HAVING AVG(daily_active_users) >= 10
    ORDER BY AVG(daily_active_users) DESC
    LIMIT 20
)
ORDER BY protocol_address, date;
`;
  }

  /**
   * DeFi Yield Farming Analysis
   * Analyzes yield farming opportunities and APY trends
   */
  static getYieldAnalysisQuery(): string {
    return `
-- DeFi Yield Farming and Liquidity Analysis
WITH liquidity_events AS (
    SELECT 
        block_time,
        sender_address as liquidity_provider,
        JSON_EXTRACT_SCALAR(data, '$.type') as event_type,
        JSON_EXTRACT_SCALAR(data, '$.pool_address') as pool_address,
        CAST(JSON_EXTRACT_SCALAR(data, '$.amount_x') AS BIGINT) as amount_x,
        CAST(JSON_EXTRACT_SCALAR(data, '$.amount_y') AS BIGINT) as amount_y,
        type as full_event_type
    FROM aptos.events
    WHERE type LIKE '%liquidity%' 
        OR type LIKE '%swap%'
        OR type LIKE '%pool%'
        AND block_time >= CURRENT_DATE - INTERVAL '30' day
),
pool_activity AS (
    SELECT 
        DATE_TRUNC('day', block_time) as date,
        pool_address,
        COUNT(DISTINCT liquidity_provider) as unique_lps,
        COUNT(*) FILTER (WHERE event_type = 'add_liquidity') as add_liquidity_events,
        COUNT(*) FILTER (WHERE event_type = 'remove_liquidity') as remove_liquidity_events,
        COUNT(*) FILTER (WHERE event_type = 'swap') as swap_events,
        SUM(CASE WHEN amount_x > 0 THEN amount_x ELSE 0 END) / 1e8 as total_amount_x,
        SUM(CASE WHEN amount_y > 0 THEN amount_y ELSE 0 END) / 1e8 as total_amount_y
    FROM liquidity_events
    WHERE pool_address IS NOT NULL
    GROUP BY 1, 2
),
liquidity_provider_analysis AS (
    SELECT 
        liquidity_provider,
        COUNT(DISTINCT pool_address) as pools_participated,
        COUNT(*) as total_interactions,
        COUNT(*) FILTER (WHERE event_type = 'add_liquidity') as add_events,
        COUNT(*) FILTER (WHERE event_type = 'remove_liquidity') as remove_events,
        COUNT(DISTINCT DATE_TRUNC('day', block_time)) as active_days,
        MIN(block_time) as first_interaction,
        MAX(block_time) as last_interaction
    FROM liquidity_events
    WHERE liquidity_provider IS NOT NULL
    GROUP BY 1
),
yield_farming_metrics AS (
    SELECT 
        pa.date,
        pa.pool_address,
        pa.unique_lps,
        pa.add_liquidity_events,
        pa.remove_liquidity_events,
        pa.swap_events,
        ROUND(pa.total_amount_x, 4) as total_amount_x,
        ROUND(pa.total_amount_y, 4) as total_amount_y,
        
        -- Liquidity stability metrics
        CASE 
            WHEN pa.remove_liquidity_events > 0 THEN
                ROUND(pa.add_liquidity_events::float / pa.remove_liquidity_events, 2)
            ELSE pa.add_liquidity_events
        END as liquidity_stability_ratio,
        
        -- Activity intensity
        ROUND(pa.swap_events::float / NULLIF(pa.unique_lps, 0), 2) as avg_swaps_per_lp,
        
        -- Pool health indicators
        CASE 
            WHEN pa.unique_lps >= 50 AND pa.swap_events >= 100 THEN 'High Activity'
            WHEN pa.unique_lps >= 10 AND pa.swap_events >= 20 THEN 'Moderate Activity'
            WHEN pa.unique_lps >= 5 THEN 'Low Activity'
            ELSE 'Inactive'
        END as pool_health_status
        
    FROM pool_activity pa
),
top_liquidity_providers AS (
    SELECT 
        lpa.liquidity_provider,
        lpa.pools_participated,
        lpa.total_interactions,
        lpa.active_days,
        ROUND(lpa.total_interactions::float / lpa.active_days, 2) as avg_interactions_per_day,
        
        -- LP behavior classification
        CASE 
            WHEN lpa.pools_participated >= 5 THEN 'Diversified LP'
            WHEN lpa.total_interactions >= 100 THEN 'Active LP'
            WHEN lpa.active_days >= 20 THEN 'Consistent LP'
            ELSE 'Casual LP'
        END as lp_type,
        
        DATE_DIFF(lpa.last_interaction, lpa.first_interaction, day) as lp_lifetime_days
        
    FROM liquidity_provider_analysis lpa
    WHERE lpa.total_interactions >= 5
)
SELECT 
    yfm.*,
    -- Add pool ranking
    ROW_NUMBER() OVER (PARTITION BY yfm.date ORDER BY yfm.swap_events DESC) as daily_pool_rank
FROM yield_farming_metrics yfm
WHERE yfm.date >= CURRENT_DATE - INTERVAL '7' day
    AND yfm.pool_health_status != 'Inactive'
ORDER BY yfm.date DESC, yfm.swap_events DESC
LIMIT 200;
`;
  }

  /**
   * Gas Optimization and Network Congestion Analysis
   */
  static getGasOptimizationQuery(): string {
    return `
-- Gas Optimization and Network Congestion Analysis
WITH hourly_gas_metrics AS (
    SELECT 
        DATE_TRUNC('hour', block_time) as hour,
        COUNT(*) as total_transactions,
        COUNT(*) FILTER (WHERE success = true) as successful_transactions,
        AVG(gas_unit_price) as avg_gas_price,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY gas_unit_price) as median_gas_price,
        PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY gas_unit_price) as p90_gas_price,
        AVG(gas_used) as avg_gas_used,
        SUM(gas_used * gas_unit_price) / 1e8 as total_gas_fees_apt,
        MAX(gas_unit_price) as max_gas_price,
        MIN(gas_unit_price) as min_gas_price
    FROM aptos.user_transactions
    WHERE block_time >= CURRENT_DATE - INTERVAL '7' day
    GROUP BY 1
),
gas_optimization_opportunities AS (
    SELECT 
        entry_function_identifier as function_name,
        entry_function_module_address as protocol,
        COUNT(*) as call_count,
        AVG(gas_used) as avg_gas_per_call,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY gas_used) as median_gas_per_call,
        MIN(gas_used) as min_gas_per_call,
        MAX(gas_used) as max_gas_per_call,
        STDDEV(gas_used) as gas_usage_variance,
        COUNT(*) FILTER (WHERE success = false) as failed_calls,
        AVG(gas_unit_price) as avg_gas_price_paid
    FROM aptos.user_transactions
    WHERE block_time >= CURRENT_DATE - INTERVAL '7' day
        AND entry_function_identifier IS NOT NULL
        AND gas_used > 0
    GROUP BY 1, 2
    HAVING COUNT(*) >= 10  -- Focus on frequently called functions
),
congestion_analysis AS (
    SELECT 
        hgm.hour,
        hgm.total_transactions,
        hgm.successful_transactions,
        ROUND(hgm.avg_gas_price, 2) as avg_gas_price,
        ROUND(hgm.median_gas_price, 2) as median_gas_price,
        ROUND(hgm.p90_gas_price, 2) as p90_gas_price,
        ROUND(hgm.avg_gas_used, 0) as avg_gas_used,
        ROUND(hgm.total_gas_fees_apt, 4) as total_gas_fees_apt,
        
        -- Congestion indicators
        CASE 
            WHEN hgm.avg_gas_price > LAG(hgm.avg_gas_price, 1) OVER (ORDER BY hgm.hour) * 1.5 THEN 'High Congestion'
            WHEN hgm.avg_gas_price > LAG(hgm.avg_gas_price, 1) OVER (ORDER BY hgm.hour) * 1.2 THEN 'Moderate Congestion'
            ELSE 'Normal'
        END as congestion_level,
        
        -- Success rate
        ROUND(hgm.successful_transactions::float / hgm.total_transactions * 100, 2) as success_rate_pct,
        
        -- Gas price spread (indicator of bidding competition)
        ROUND(hgm.max_gas_price - hgm.min_gas_price, 2) as gas_price_spread,
        ROUND((hgm.max_gas_price - hgm.min_gas_price)::float / NULLIF(hgm.avg_gas_price, 0) * 100, 2) as gas_spread_pct
        
    FROM hourly_gas_metrics hgm
),
optimization_recommendations AS (
    SELECT 
        goo.function_name,
        goo.protocol,
        goo.call_count,
        ROUND(goo.avg_gas_per_call, 0) as avg_gas_per_call,
        ROUND(goo.median_gas_per_call, 0) as median_gas_per_call,
        ROUND(goo.gas_usage_variance, 2) as gas_usage_variance,
        ROUND(goo.failed_calls::float / goo.call_count * 100, 2) as failure_rate_pct,
        
        -- Optimization potential
        CASE 
            WHEN goo.gas_usage_variance > goo.avg_gas_per_call * 0.5 THEN 'High Variance - Optimization Needed'
            WHEN goo.failed_calls::float / goo.call_count > 0.05 THEN 'High Failure Rate - Review Logic'
            WHEN goo.avg_gas_per_call > 10000 THEN 'High Gas Usage - Optimize Algorithm'
            ELSE 'Well Optimized'
        END as optimization_recommendation,
        
        -- Potential savings
        ROUND((goo.avg_gas_per_call - goo.median_gas_per_call) * goo.call_count, 0) as potential_gas_savings
        
    FROM gas_optimization_opportunities goo
)
SELECT 
    'Congestion Analysis' as analysis_type,
    ca.hour::text as identifier,
    ca.total_transactions,
    ca.avg_gas_price,
    ca.congestion_level as status,
    ca.success_rate_pct as metric_value,
    NULL as optimization_potential
FROM congestion_analysis ca
WHERE ca.hour >= CURRENT_DATE - INTERVAL '24' hour

UNION ALL

SELECT 
    'Optimization Opportunities' as analysis_type,
    CONCAT(or_table.function_name, ' (', LEFT(or_table.protocol, 8), '...)') as identifier,
    or_table.call_count as total_transactions,
    or_table.avg_gas_per_call as avg_gas_price,
    or_table.optimization_recommendation as status,
    or_table.failure_rate_pct as metric_value,
    or_table.potential_gas_savings as optimization_potential
FROM optimization_recommendations or_table
WHERE or_table.optimization_recommendation != 'Well Optimized'

ORDER BY analysis_type, metric_value DESC;
`;
  }

  /**
   * Cross-Chain Bridge Activity Analysis
   */
  static getBridgeAnalysisQuery(): string {
    return `
-- Cross-Chain Bridge Activity and Flow Analysis
WITH bridge_transactions AS (
    SELECT 
        block_time,
        sender_address,
        entry_function_module_address as bridge_protocol,
        entry_function_identifier as bridge_function,
        gas_used,
        gas_unit_price,
        success,
        CASE 
            WHEN entry_function_module_address LIKE '%wormhole%' 
                 OR entry_function_identifier LIKE '%wormhole%' THEN 'Wormhole'
            WHEN entry_function_module_address LIKE '%celer%'
                 OR entry_function_identifier LIKE '%celer%' THEN 'Celer'
            WHEN entry_function_module_address LIKE '%layerzero%'
                 OR entry_function_identifier LIKE '%layerzero%' THEN 'LayerZero'
            WHEN entry_function_identifier LIKE '%bridge%' THEN 'Generic Bridge'
            ELSE 'Other'
        END as bridge_type
    FROM aptos.user_transactions
    WHERE block_time >= CURRENT_DATE - INTERVAL '30' day
        AND (
            entry_function_identifier LIKE '%bridge%'
            OR entry_function_identifier LIKE '%wormhole%'
            OR entry_function_identifier LIKE '%celer%'
            OR entry_function_identifier LIKE '%layerzero%'
            OR entry_function_module_address IN (
                '0x8d87a65ba30e09357fa2dadd94df2f4af5379d08e15b4a90c4b9b9e0ef334871',
                '0xc6bc659f1649553c1a3fa05d9727433dc03843b4f11073447cc6b7bb72b5ec0e'
            )
        )
),
bridge_daily_metrics AS (
    SELECT 
        DATE_TRUNC('day', block_time) as date,
        bridge_type,
        bridge_protocol,
        COUNT(DISTINCT sender_address) as unique_users,
        COUNT(*) as total_transactions,
        COUNT(*) FILTER (WHERE success = true) as successful_transactions,
        AVG(gas_used * gas_unit_price) / 1e8 as avg_gas_cost_apt,
        SUM(gas_used * gas_unit_price) / 1e8 as total_gas_cost_apt
    FROM bridge_transactions
    WHERE bridge_type != 'Other'
    GROUP BY 1, 2, 3
),
bridge_user_analysis AS (
    SELECT 
        sender_address as bridge_user,
        COUNT(DISTINCT bridge_type) as bridges_used,
        COUNT(DISTINCT bridge_protocol) as protocols_used,
        COUNT(*) as total_bridge_transactions,
        MIN(block_time) as first_bridge_tx,
        MAX(block_time) as last_bridge_tx,
        AVG(gas_used * gas_unit_price) / 1e8 as avg_gas_per_bridge,
        STRING_AGG(DISTINCT bridge_type, ', ') as bridge_types_used
    FROM bridge_transactions
    WHERE bridge_type != 'Other'
    GROUP BY 1
    HAVING COUNT(*) >= 2  -- Focus on active bridge users
),
bridge_flow_analysis AS (
    SELECT 
        bdm.date,
        bdm.bridge_type,
        bdm.unique_users,
        bdm.total_transactions,
        bdm.successful_transactions,
        ROUND(bdm.successful_transactions::float / bdm.total_transactions * 100, 2) as success_rate_pct,
        ROUND(bdm.avg_gas_cost_apt, 6) as avg_gas_cost_apt,
        ROUND(bdm.total_gas_cost_apt, 4) as total_gas_cost_apt,
        
        -- Growth metrics
        LAG(bdm.unique_users, 1) OVER (
            PARTITION BY bdm.bridge_type 
            ORDER BY bdm.date
        ) as prev_day_users,
        
        LAG(bdm.total_transactions, 7) OVER (
            PARTITION BY bdm.bridge_type 
            ORDER BY bdm.date
        ) as transactions_week_ago
    FROM bridge_daily_metrics bdm
),
cross_bridge_users AS (
    SELECT 
        bua.bridge_user,
        bua.bridges_used,
        bua.protocols_used,
        bua.total_bridge_transactions,
        bua.bridge_types_used,
        ROUND(bua.avg_gas_per_bridge, 6) as avg_gas_per_bridge,
        DATE_DIFF(bua.last_bridge_tx, bua.first_bridge_tx, day) as bridge_user_lifetime_days,
        
        -- User classification
        CASE 
            WHEN bua.bridges_used >= 3 THEN 'Multi-Bridge Power User'
            WHEN bua.bridges_used = 2 THEN 'Cross-Bridge User'
            WHEN bua.total_bridge_transactions >= 10 THEN 'Single-Bridge Heavy User'
            ELSE 'Casual Bridge User'
        END as user_type
    FROM bridge_user_analysis bua
)
SELECT 
    'Daily Bridge Activity' as analysis_category,
    bfa.date::text as time_period,
    bfa.bridge_type,
    bfa.unique_users,
    bfa.total_transactions,
    bfa.success_rate_pct,
    bfa.total_gas_cost_apt,
    CASE 
        WHEN bfa.prev_day_users > 0 THEN
            ROUND((bfa.unique_users - bfa.prev_day_users)::float / bfa.prev_day_users * 100, 2)
        ELSE NULL
    END as user_growth_pct
FROM bridge_flow_analysis bfa
WHERE bfa.date >= CURRENT_DATE - INTERVAL '14' day

UNION ALL

SELECT 
    'Cross-Bridge User Analysis' as analysis_category,
    cbu.user_type as time_period,
    'All Bridges' as bridge_type,
    COUNT(*)::bigint as unique_users,
    SUM(cbu.total_bridge_transactions)::bigint as total_transactions,
    AVG(cbu.avg_gas_per_bridge) as success_rate_pct,
    SUM(cbu.avg_gas_per_bridge * cbu.total_bridge_transactions) as total_gas_cost_apt,
    AVG(cbu.bridge_user_lifetime_days) as user_growth_pct
FROM cross_bridge_users cbu
GROUP BY cbu.user_type

ORDER BY analysis_category, time_period DESC, total_transactions DESC;
`;
  }
}
