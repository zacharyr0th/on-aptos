/**
 * Intelligent Aptos Analytics Interpreter
 * Provides smart insights and explanations for blockchain data
 */

import { AdvancedAptosQueries } from "./advanced-queries";

export interface NetworkInsight {
  metric: string;
  value: number | string;
  interpretation: string;
  significance: "critical" | "high" | "medium" | "low";
  recommendation?: string;
  context: string;
}

export interface EcosystemHealth {
  score: number; // 0-100
  indicators: {
    userGrowth: number;
    protocolDiversity: number;
    economicActivity: number;
    networkStability: number;
  };
  insights: NetworkInsight[];
  trends: {
    direction: "bullish" | "bearish" | "neutral";
    strength: number; // 0-1
    reasoning: string;
  };
}

export class AptosIntelligentAnalyzer {
  /**
   * Analyzes network health and provides intelligent insights
   */
  analyzeNetworkHealth(metrics: any): EcosystemHealth {
    const insights: NetworkInsight[] = [];

    // User Activity Analysis
    const dailyActiveRatio = metrics.dailyActiveAddresses / metrics.totalAccounts;
    const userActivityInsight = this.analyzeUserActivity(
      metrics.dailyActiveAddresses,
      metrics.behaviorDailyActiveUsers,
      dailyActiveRatio
    );
    insights.push(userActivityInsight);

    // Transaction Efficiency Analysis
    const txEfficiency = metrics.totalSignatures / metrics.totalTransactions;
    const efficiencyInsight = this.analyzeTransactionEfficiency(
      txEfficiency,
      metrics.avgSuccessRate
    );
    insights.push(efficiencyInsight);

    // Economic Activity Analysis
    const gasPerUser = metrics.dailyGasFeesUSD / metrics.dailyActiveAddresses;
    const economicInsight = this.analyzeEconomicActivity(gasPerUser, metrics.dailyGasFeesUSD);
    insights.push(economicInsight);

    // Network Performance Analysis
    const networkUtilization = (metrics.dailyTransactions / (metrics.maxTPS * 86400)) * 100;
    const performanceInsight = this.analyzeNetworkPerformance(
      networkUtilization,
      metrics.maxTPS,
      metrics.networkUptime
    );
    insights.push(performanceInsight);

    // Protocol Ecosystem Analysis
    const protocolDominance = this.analyzeProtocolDominance(metrics.enhancedProtocolAnalytics);
    insights.push(protocolDominance);

    // Calculate overall ecosystem health
    const healthScore = this.calculateEcosystemHealthScore(metrics);
    const trends = this.analyzeTrends(metrics);

    return {
      score: healthScore,
      indicators: {
        userGrowth: this.calculateUserGrowthScore(metrics),
        protocolDiversity: this.calculateProtocolDiversityScore(metrics),
        economicActivity: this.calculateEconomicActivityScore(metrics),
        networkStability: this.calculateNetworkStabilityScore(metrics),
      },
      insights,
      trends,
    };
  }

  private analyzeUserActivity(
    dailyActive: number,
    behaviorActive: number,
    activeRatio: number
  ): NetworkInsight {
    const discrepancy = Math.abs(dailyActive - behaviorActive) / dailyActive;

    if (discrepancy > 0.3) {
      return {
        metric: "User Activity Consistency",
        value: `${((1 - discrepancy) * 100).toFixed(1)}%`,
        interpretation: `There's a ${(discrepancy * 100).toFixed(1)}% discrepancy between different user activity measurements. This suggests different queries are capturing different aspects of user behavior - likely due to varying time windows or activity definitions.`,
        significance: "medium",
        recommendation:
          "Standardize user activity definitions across all queries for consistent reporting.",
        context: `Daily active addresses (${dailyActive.toLocaleString()}) vs behavior-tracked users (${behaviorActive.toLocaleString()})`,
      };
    }

    const engagementLevel =
      activeRatio > 0.6
        ? "exceptional"
        : activeRatio > 0.4
          ? "strong"
          : activeRatio > 0.2
            ? "moderate"
            : "concerning";

    return {
      metric: "User Engagement Quality",
      value: `${(activeRatio * 100).toFixed(1)}%`,
      interpretation: `${engagementLevel.toUpperCase()} user engagement with ${(activeRatio * 100).toFixed(1)}% of all accounts being active daily. This indicates ${this.getEngagementExplanation(activeRatio)}.`,
      significance: activeRatio > 0.4 ? "high" : "medium",
      context: `${dailyActive.toLocaleString()} daily active users from ${(dailyActive / activeRatio).toLocaleString()} total accounts`,
    };
  }

  private analyzeTransactionEfficiency(txEfficiency: number, successRate: number): NetworkInsight {
    const efficiencyDescription =
      txEfficiency > 1.5
        ? "complex multi-signature operations"
        : txEfficiency > 1.2
          ? "moderate transaction complexity"
          : "simple transactions";

    const networkHealth =
      successRate > 95 ? "excellent" : successRate > 85 ? "good" : "needs attention";

    return {
      metric: "Transaction Complexity & Reliability",
      value: `${txEfficiency.toFixed(2)} sigs/tx`,
      interpretation: `The network processes ${efficiencyDescription} with ${txEfficiency.toFixed(2)} signatures per transaction on average. Combined with a ${successRate}% success rate, network health is ${networkHealth}.`,
      significance: successRate > 85 ? "high" : "critical",
      recommendation:
        successRate < 85
          ? "Investigate causes of transaction failures and optimize network stability."
          : undefined,
      context: `Network reliability indicates ${this.getNetworkStabilityContext(successRate)}`,
    };
  }

  private analyzeEconomicActivity(gasPerUser: number, totalGasUSD: number): NetworkInsight {
    const userSpendingLevel =
      gasPerUser > 0.5 ? "high-value" : gasPerUser > 0.1 ? "moderate" : "light";
    const ecosystemValue =
      totalGasUSD > 50000 ? "major" : totalGasUSD > 10000 ? "significant" : "emerging";

    return {
      metric: "Economic Activity Intensity",
      value: `$${gasPerUser.toFixed(2)}/user`,
      interpretation: `Users are conducting ${userSpendingLevel} economic activities, spending $${gasPerUser.toFixed(2)} in gas fees per person daily. The total daily economic activity of $${totalGasUSD.toLocaleString()} indicates a ${ecosystemValue} DeFi ecosystem.`,
      significance: gasPerUser > 0.1 ? "high" : "medium",
      context: `This suggests ${this.getEconomicActivityContext(gasPerUser)} usage patterns`,
    };
  }

  private analyzeNetworkPerformance(
    utilization: number,
    maxTPS: number,
    uptime: number
  ): NetworkInsight {
    const utilizationLevel =
      utilization > 80
        ? "near capacity"
        : utilization > 50
          ? "high utilization"
          : utilization > 20
            ? "moderate usage"
            : "low utilization";
    const performanceRating =
      maxTPS > 1000 ? "high-performance" : maxTPS > 100 ? "scalable" : "basic";

    return {
      metric: "Network Scalability",
      value: `${utilization.toFixed(1)}% utilized`,
      interpretation: `The network is operating at ${utilizationLevel} with ${utilization.toFixed(1)}% of theoretical capacity used. With ${maxTPS} TPS maximum throughput, Aptos demonstrates ${performanceRating} blockchain capabilities.`,
      significance: utilization > 80 ? "critical" : utilization > 50 ? "high" : "medium",
      recommendation:
        utilization > 80
          ? "Network approaching capacity limits. Consider optimization or scaling solutions."
          : undefined,
      context: `${uptime}% uptime indicates ${this.getUptimeContext(parseFloat(uptime.toString()))}`,
    };
  }

  private analyzeProtocolDominance(protocolAnalytics: any): NetworkInsight {
    if (!protocolAnalytics?.protocolDominance) {
      return {
        metric: "Protocol Ecosystem",
        value: "Analysis Pending",
        interpretation: "Protocol dominance analysis requires additional data processing.",
        significance: "low",
        context: "Protocol analytics being compiled",
      };
    }

    const { concentrationRatio, topProtocol } = protocolAnalytics.protocolDominance;
    const diversificationLevel =
      concentrationRatio > 80
        ? "highly concentrated"
        : concentrationRatio > 60
          ? "moderately concentrated"
          : "well diversified";

    return {
      metric: "Protocol Ecosystem Health",
      value: `${concentrationRatio.toFixed(1)}% concentrated`,
      interpretation: `The Aptos DeFi ecosystem is ${diversificationLevel} with the top protocol (${topProtocol}) commanding ${concentrationRatio.toFixed(1)}% market share. This ${this.getConcentrationImplication(concentrationRatio)}.`,
      significance: concentrationRatio > 80 ? "high" : "medium",
      recommendation:
        concentrationRatio > 80
          ? "High concentration risk. Encourage protocol diversity for ecosystem resilience."
          : undefined,
      context: `${diversificationLevel} ecosystem suggests ${this.getDiversificationContext(concentrationRatio)}`,
    };
  }

  private calculateEcosystemHealthScore(metrics: any): number {
    const userScore = Math.min((metrics.dailyActiveAddresses / metrics.totalAccounts) * 100, 100);
    const performanceScore = Math.min(parseFloat(metrics.networkUptime) || 0, 100);
    const economicScore = Math.min((metrics.dailyGasFeesUSD / 100000) * 100, 100);
    const utilizationScore = Math.min(
      (metrics.dailyTransactions / (metrics.maxTPS * 86400)) * 100 * 2,
      100
    );

    return Math.round(
      userScore * 0.3 + performanceScore * 0.3 + economicScore * 0.2 + utilizationScore * 0.2
    );
  }

  private calculateUserGrowthScore(metrics: any): number {
    // Based on user engagement ratio
    const engagementRatio = metrics.dailyActiveAddresses / metrics.totalAccounts;
    return Math.min(engagementRatio * 100, 100);
  }

  private calculateProtocolDiversityScore(metrics: any): number {
    if (!metrics.enhancedProtocolAnalytics?.protocolDominance?.concentrationRatio) return 50;
    // Inverse of concentration - higher diversity = lower concentration
    return Math.max(
      100 - metrics.enhancedProtocolAnalytics.protocolDominance.concentrationRatio,
      0
    );
  }

  private calculateEconomicActivityScore(metrics: any): number {
    const gasPerUser = metrics.dailyGasFeesUSD / metrics.dailyActiveAddresses;
    return Math.min(gasPerUser * 200, 100); // Scale where $0.5/user = 100 points
  }

  private calculateNetworkStabilityScore(metrics: any): number {
    const uptimeScore = parseFloat(metrics.networkUptime) || 0;
    const tpsUtilization = (metrics.dailyTransactions / (metrics.maxTPS * 86400)) * 100;
    const stabilityBuffer = Math.max(0, 100 - tpsUtilization * 2); // Penalty for being near capacity

    return Math.min(uptimeScore * 0.7 + stabilityBuffer * 0.3, 100);
  }

  private analyzeTrends(metrics: any): {
    direction: "bullish" | "bearish" | "neutral";
    strength: number;
    reasoning: string;
  } {
    const userEngagement = metrics.dailyActiveAddresses / metrics.totalAccounts;
    const networkUtilization = (metrics.dailyTransactions / (metrics.maxTPS * 86400)) * 100;
    const economicActivity = metrics.dailyGasFeesUSD / metrics.dailyActiveAddresses;

    let bullishFactors = 0;
    let bearishFactors = 0;
    const reasons: string[] = [];

    if (userEngagement > 0.4) {
      bullishFactors++;
      reasons.push("strong user engagement");
    } else if (userEngagement < 0.2) {
      bearishFactors++;
      reasons.push("low user engagement");
    }

    if (networkUtilization > 30 && networkUtilization < 80) {
      bullishFactors++;
      reasons.push("healthy network utilization");
    } else if (networkUtilization > 90) {
      bearishFactors++;
      reasons.push("network congestion risk");
    }

    if (economicActivity > 0.1) {
      bullishFactors++;
      reasons.push("significant economic activity");
    }

    const netSentiment = bullishFactors - bearishFactors;
    const strength = Math.abs(netSentiment) / Math.max(bullishFactors + bearishFactors, 1);

    return {
      direction: netSentiment > 0 ? "bullish" : netSentiment < 0 ? "bearish" : "neutral",
      strength,
      reasoning: reasons.length > 0 ? reasons.join(", ") : "balanced indicators",
    };
  }

  // Helper methods for contextual explanations
  private getEngagementExplanation(ratio: number): string {
    if (ratio > 0.6) return "exceptional user retention and platform stickiness";
    if (ratio > 0.4) return "strong daily engagement from the user base";
    if (ratio > 0.2) return "moderate user engagement with room for growth";
    return "concerning low daily engagement requiring investigation";
  }

  private getNetworkStabilityContext(successRate: number): string {
    if (successRate > 95)
      return "enterprise-grade reliability suitable for mission-critical applications";
    if (successRate > 85) return "good stability for most DeFi operations";
    return "stability issues that may impact user experience and protocol adoption";
  }

  private getEconomicActivityContext(gasPerUser: number): string {
    if (gasPerUser > 0.5) return "power user and institutional";
    if (gasPerUser > 0.1) return "active DeFi";
    return "casual and experimental";
  }

  private getUptimeContext(uptime: number): string {
    if (uptime > 99) return "exceptional network reliability";
    if (uptime > 95) return "production-ready stability";
    return "network reliability concerns";
  }

  private getConcentrationImplication(concentration: number): string {
    if (concentration > 80)
      return "creates single points of failure and reduces ecosystem resilience";
    if (concentration > 60) return "indicates healthy growth but with emerging market leaders";
    return "demonstrates a mature, diversified protocol landscape";
  }

  private getDiversificationContext(concentration: number): string {
    if (concentration > 80) return "high systemic risk and low innovation pressure";
    if (concentration > 60) return "balanced competition with clear market leaders";
    return "competitive landscape driving innovation and user choice";
  }
}

/**
 * Advanced Query Templates for deeper Aptos analysis
 */
export class AptosQueryBuilder {
  /**
   * Creates intelligent SQL queries for various Aptos analytics
   */
  static getProtocolHealthQuery(): string {
    return `
-- Protocol Health & Performance Analysis
WITH protocol_daily_metrics AS (
    SELECT 
        DATE_TRUNC('day', block_time) as date,
        entry_function_module_address as protocol,
        COUNT(DISTINCT sender_address) as unique_users,
        COUNT(*) as transaction_count,
        SUM(gas_used * gas_unit_price) / 1e8 as total_gas_apt,
        AVG(gas_used * gas_unit_price) / 1e8 as avg_gas_per_tx,
        COUNT(*) FILTER (WHERE success = true) as successful_txns
    FROM aptos.user_transactions
    WHERE block_time >= CURRENT_DATE - INTERVAL '30' day
        AND entry_function_module_address IS NOT NULL
    GROUP BY 1, 2
),
protocol_health AS (
    SELECT 
        protocol,
        COUNT(DISTINCT date) as active_days,
        AVG(unique_users) as avg_daily_users,
        AVG(transaction_count) as avg_daily_txns,
        AVG(total_gas_apt) as avg_daily_gas_apt,
        AVG(successful_txns::float / transaction_count) * 100 as success_rate,
        STDDEV(unique_users) / NULLIF(AVG(unique_users), 0) as user_volatility,
        SUM(transaction_count) as total_transactions
    FROM protocol_daily_metrics
    GROUP BY 1
)
SELECT 
    protocol,
    ROUND(avg_daily_users, 0) as avg_daily_users,
    ROUND(avg_daily_txns, 0) as avg_daily_transactions,
    ROUND(avg_daily_gas_apt, 4) as avg_daily_gas_apt,
    ROUND(success_rate, 2) as success_rate_pct,
    ROUND(user_volatility, 3) as user_consistency_score,
    total_transactions,
    CASE 
        WHEN success_rate >= 95 AND avg_daily_users >= 1000 THEN 'Excellent'
        WHEN success_rate >= 85 AND avg_daily_users >= 100 THEN 'Good'
        WHEN success_rate >= 75 THEN 'Fair'
        ELSE 'Poor'
    END as health_rating,
    active_days
FROM protocol_health
WHERE total_transactions >= 100
ORDER BY avg_daily_users DESC
LIMIT 50;
`;
  }

  static getUserBehaviorCohortQuery(): string {
    return `
-- User Behavior Cohort Analysis
WITH first_transaction AS (
    SELECT 
        sender_address,
        DATE_TRUNC('week', MIN(block_time)) as cohort_week,
        MIN(block_time) as first_tx_time
    FROM aptos.user_transactions
    WHERE block_time >= CURRENT_DATE - INTERVAL '90' day
    GROUP BY 1
),
user_activity AS (
    SELECT 
        ut.sender_address,
        ft.cohort_week,
        DATE_TRUNC('week', ut.block_time) as activity_week,
        COUNT(*) as transactions,
        COUNT(DISTINCT DATE_TRUNC('day', ut.block_time)) as active_days
    FROM aptos.user_transactions ut
    JOIN first_transaction ft ON ut.sender_address = ft.sender_address
    WHERE ut.block_time >= ft.first_tx_time
        AND ut.block_time >= CURRENT_DATE - INTERVAL '90' day
    GROUP BY 1, 2, 3
),
cohort_analysis AS (
    SELECT 
        cohort_week,
        activity_week,
        (activity_week - cohort_week) / INTERVAL '7' day as weeks_since_first,
        COUNT(DISTINCT sender_address) as active_users,
        AVG(transactions) as avg_transactions_per_user,
        AVG(active_days) as avg_active_days_per_week
    FROM user_activity
    GROUP BY 1, 2
),
cohort_size AS (
    SELECT 
        cohort_week,
        COUNT(DISTINCT sender_address) as cohort_size
    FROM first_transaction
    GROUP BY 1
)
SELECT 
    ca.cohort_week,
    ca.weeks_since_first,
    ca.active_users,
    cs.cohort_size,
    ROUND(ca.active_users::float / cs.cohort_size * 100, 2) as retention_rate_pct,
    ROUND(ca.avg_transactions_per_user, 1) as avg_transactions_per_user,
    ROUND(ca.avg_active_days_per_week, 1) as avg_active_days_per_week,
    CASE 
        WHEN ca.weeks_since_first = 0 THEN 'Week 0 - New Users'
        WHEN ca.weeks_since_first = 1 THEN 'Week 1 - Activation'
        WHEN ca.weeks_since_first BETWEEN 2 AND 4 THEN 'Weeks 2-4 - Early Retention'
        WHEN ca.weeks_since_first BETWEEN 5 AND 8 THEN 'Weeks 5-8 - Medium Retention'
        ELSE 'Week 9+ - Loyal Users'
    END as retention_stage
FROM cohort_analysis ca
JOIN cohort_size cs ON ca.cohort_week = cs.cohort_week
WHERE ca.weeks_since_first <= 12
ORDER BY ca.cohort_week DESC, ca.weeks_since_first;
`;
  }

  static getLiquidityFlowAnalysisQuery(): string {
    return `
-- Cross-Protocol Liquidity Flow Analysis
WITH protocol_flows AS (
    SELECT 
        sender_address as user_address,
        entry_function_module_address as protocol,
        DATE_TRUNC('hour', block_time) as hour,
        COUNT(*) as transaction_count,
        SUM(gas_used * gas_unit_price) / 1e8 as gas_spent_apt
    FROM aptos.user_transactions
    WHERE block_time >= CURRENT_DATE - INTERVAL '7' day
        AND entry_function_module_address IN (
            '0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa',
            '0x05a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948',
            '0x48271d39d0b05bd6efb09904bf196fcd8b181e83b4a4004926a5d8b81ee7a5ba'
        )
    GROUP BY 1, 2, 3
),
user_transitions AS (
    SELECT 
        pf1.user_address,
        pf1.protocol as from_protocol,
        pf2.protocol as to_protocol,
        pf2.hour - pf1.hour as time_diff,
        pf1.gas_spent_apt + pf2.gas_spent_apt as total_gas
    FROM protocol_flows pf1
    JOIN protocol_flows pf2 ON pf1.user_address = pf2.user_address
        AND pf1.protocol != pf2.protocol
        AND pf2.hour > pf1.hour
        AND pf2.hour <= pf1.hour + INTERVAL '24' hour
),
transition_analysis AS (
    SELECT 
        from_protocol,
        to_protocol,
        COUNT(DISTINCT user_address) as users_who_transitioned,
        AVG(total_gas) as avg_gas_per_transition,
        CASE 
            WHEN time_diff <= INTERVAL '1' hour THEN 'Immediate (<1h)'
            WHEN time_diff <= INTERVAL '6' hour THEN 'Same Session (<6h)'
            WHEN time_diff <= INTERVAL '24' hour THEN 'Same Day'
            ELSE 'Multi-Day'
        END as transition_timing
    FROM user_transitions
    GROUP BY 1, 2, 5
)
SELECT 
    from_protocol,
    to_protocol,
    users_who_transitioned,
    ROUND(avg_gas_per_transition, 4) as avg_gas_apt,
    transition_timing,
    ROW_NUMBER() OVER (ORDER BY users_who_transitioned DESC) as flow_rank
FROM transition_analysis
WHERE users_who_transitioned >= 5
ORDER BY users_who_transitioned DESC;
`;
  }

  static getAdvancedTokenAnalysisQuery(): string {
    return `
-- Advanced Token Distribution & Velocity Analysis
WITH token_holders AS (
    SELECT 
        asset_type,
        owner_address,
        amount::bigint as balance,
        last_transaction_version
    FROM aptos.current_fungible_asset_balances
    WHERE amount::bigint > 0
),
token_stats AS (
    SELECT 
        asset_type,
        COUNT(DISTINCT owner_address) as holder_count,
        SUM(balance) as total_supply,
        AVG(balance) as avg_balance,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY balance) as median_balance,
        PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY balance) as p90_balance,
        MAX(balance) as max_balance
    FROM token_holders
    GROUP BY 1
),
concentration_analysis AS (
    SELECT 
        th.asset_type,
        SUM(CASE WHEN balance >= ts.p90_balance THEN balance ELSE 0 END) as top10_pct_holdings,
        SUM(balance) as total_holdings,
        COUNT(CASE WHEN balance >= 1000000 THEN 1 END) as whale_count
    FROM token_holders th
    JOIN token_stats ts ON th.asset_type = ts.asset_type
    GROUP BY 1
)
SELECT 
    ts.asset_type,
    ts.holder_count,
    ts.total_supply / 1e8 as total_supply_formatted,
    ts.avg_balance / 1e8 as avg_balance_formatted,
    ts.median_balance / 1e8 as median_balance_formatted,
    ca.whale_count,
    ROUND(ca.top10_pct_holdings::float / ca.total_holdings * 100, 2) as top10_pct_concentration,
    CASE 
        WHEN ca.top10_pct_holdings::float / ca.total_holdings > 0.9 THEN 'Highly Concentrated'
        WHEN ca.top10_pct_holdings::float / ca.total_holdings > 0.7 THEN 'Concentrated'
        WHEN ca.top10_pct_holdings::float / ca.total_holdings > 0.5 THEN 'Moderately Distributed'
        ELSE 'Well Distributed'
    END as distribution_category,
    -- Gini coefficient approximation
    ROUND(1 - 2 * (ts.avg_balance / ts.max_balance), 3) as gini_coefficient
FROM token_stats ts
JOIN concentration_analysis ca ON ts.asset_type = ca.asset_type
WHERE ts.holder_count >= 10
ORDER BY ts.holder_count DESC
LIMIT 25;
`;
  }

  // Additional advanced queries from AdvancedAptosQueries
  static getMEVAnalysisQuery(): string {
    return AdvancedAptosQueries.getMEVAnalysisQuery();
  }

  static getWhaleTrackingQuery(): string {
    return AdvancedAptosQueries.getWhaleTrackingQuery();
  }

  static getProtocolGrowthQuery(): string {
    return AdvancedAptosQueries.getProtocolGrowthQuery();
  }

  static getYieldAnalysisQuery(): string {
    return AdvancedAptosQueries.getYieldAnalysisQuery();
  }

  static getGasOptimizationQuery(): string {
    return AdvancedAptosQueries.getGasOptimizationQuery();
  }

  static getBridgeAnalysisQuery(): string {
    return AdvancedAptosQueries.getBridgeAnalysisQuery();
  }

  /**
   * Get all available advanced queries with descriptions
   */
  static getAllAdvancedQueries(): Record<
    string,
    { query: string; description: string; category: string }
  > {
    return {
      protocolHealth: {
        query: AptosQueryBuilder.getProtocolHealthQuery(),
        description:
          "Analyze protocol health metrics, success rates, and user consistency over 30 days",
        category: "Protocol Analysis",
      },
      userCohortAnalysis: {
        query: AptosQueryBuilder.getUserBehaviorCohortQuery(),
        description: "Track user retention and engagement patterns by cohort",
        category: "User Analytics",
      },
      liquidityFlowAnalysis: {
        query: AptosQueryBuilder.getLiquidityFlowAnalysisQuery(),
        description: "Analyze how users move liquidity between different protocols",
        category: "DeFi Analytics",
      },
      tokenDistributionAnalysis: {
        query: AptosQueryBuilder.getAdvancedTokenAnalysisQuery(),
        description: "Deep analysis of token concentration and distribution patterns",
        category: "Token Economics",
      },
      mevAnalysis: {
        query: AptosQueryBuilder.getMEVAnalysisQuery(),
        description: "Identify potential MEV opportunities and sandwich attacks",
        category: "MEV & Trading",
      },
      whaleTracking: {
        query: AptosQueryBuilder.getWhaleTrackingQuery(),
        description: "Track large APT movements and whale behavior patterns",
        category: "Whale Analytics",
      },
      protocolGrowth: {
        query: AptosQueryBuilder.getProtocolGrowthQuery(),
        description: "Track protocol growth, user acquisition, and retention metrics",
        category: "Growth Analytics",
      },
      yieldAnalysis: {
        query: AptosQueryBuilder.getYieldAnalysisQuery(),
        description: "Analyze yield farming opportunities and liquidity provision",
        category: "DeFi Analytics",
      },
      gasOptimization: {
        query: AptosQueryBuilder.getGasOptimizationQuery(),
        description: "Network congestion analysis and gas optimization opportunities",
        category: "Network Performance",
      },
      bridgeAnalysis: {
        query: AptosQueryBuilder.getBridgeAnalysisQuery(),
        description: "Cross-chain bridge activity and flow analysis",
        category: "Cross-Chain Analytics",
      },
    };
  }
}
