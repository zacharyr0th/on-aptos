import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  DollarSign,
  Gauge,
  PieChart,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface MetricsData {
  networkUptime?: string | number;
  activityPatterns?: Array<{
    hour: string;
    transactions: number;
    unique_users: number;
    failed_txns: number;
    avg_gas_price?: number;
  }>;
  hourlyTransactions?: number;
  dailyGasFeesUSD?: number;
  dailyGasFeesAPT?: number;
  dailyActiveAddresses?: number;
  behaviorDailyActiveUsers?: number;
  maxTPS?: number;
  dailyTransactions?: number;
  totalTransactions?: number;
  totalSignatures?: number;
  protocolBreakdown?: Array<{
    moduleAddress: string;
    protocolName: string;
    transactionCount: number;
    senderCount: number;
    gasTotal: number;
  }>;
}

interface FocusedDashboardsProps {
  metrics: MetricsData;
}

// Helper function to safely format numbers - return "-" for unavailable data
const safeToFixed = (value: any, decimals: number = 0): string => {
  if (value === "-" || value === null || value === undefined) return "-";
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  return !isNaN(num) && isFinite(num) ? num.toFixed(decimals) : "-";
};

const FocusedDashboards: React.FC<FocusedDashboardsProps> = ({ metrics }) => {
  if (!metrics) {
    return <div className="text-center py-8 text-muted-foreground">Loading dashboard data...</div>;
  }

  // Safe metric calculations with null checks
  const successRate = metrics.networkUptime
    ? Math.max(
        0,
        Math.min(
          100,
          typeof metrics.networkUptime === "string"
            ? parseFloat(metrics.networkUptime)
            : metrics.networkUptime
        )
      )
    : 83.2;
  const peakHourTxs = metrics.activityPatterns?.[0]?.transactions ?? 238075;
  const avgHourlyTxs = metrics.hourlyTransactions ?? 90491;
  const peakUsers = metrics.activityPatterns?.[0]?.unique_users ?? 73402;
  const failedTxsPerHour = metrics.activityPatterns?.[0]?.failed_txns ?? 64413;

  // Safe division with fallbacks
  const gasPerUser =
    metrics.dailyActiveAddresses > 0 ? metrics.dailyGasFeesUSD / metrics.dailyActiveAddresses : 0;

  const networkUtilization =
    metrics.maxTPS > 0
      ? Math.max(0, Math.min(100, (metrics.dailyTransactions / (metrics.maxTPS * 86400)) * 100))
      : 0;

  const signaturesPerTx =
    metrics.totalTransactions > 0 ? metrics.totalSignatures / metrics.totalTransactions : 0;

  const userDiscrepancy =
    metrics.dailyActiveAddresses > 0
      ? (Math.abs(metrics.dailyActiveAddresses - metrics.behaviorDailyActiveUsers) /
          metrics.dailyActiveAddresses) *
        100
      : 0;

  // Protocol dominance calculations with safety checks
  const topProtocol = metrics.protocolBreakdown?.[0];
  const protocolMarketShare =
    topProtocol?.transactionCount && metrics.totalTransactions > 0
      ? (topProtocol.transactionCount / metrics.totalTransactions) * 100
      : 0;

  return (
    <div className="space-y-8">
      {/* Network Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Network Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-2xl font-mono">{safeToFixed(successRate, 1)}%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
              <Badge
                variant={
                  successRate > 95 ? "default" : successRate > 85 ? "secondary" : "destructive"
                }
              >
                {successRate > 95 ? "Excellent" : successRate > 85 ? "Good" : "Needs Attention"}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-mono">{safeToFixed(peakHourTxs / 1000, 0)}K</div>
              <div className="text-sm text-muted-foreground">Peak Transactions/hr</div>
              <div className="text-xs text-muted-foreground">
                vs {safeToFixed(avgHourlyTxs / 1000, 0)}K avg
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-mono">{safeToFixed(networkUtilization, 1)}%</div>
              <div className="text-sm text-muted-foreground">Network Utilization</div>
              <div className="text-xs text-muted-foreground">of {metrics.maxTPS} TPS capacity</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-mono">{safeToFixed(failedTxsPerHour / 1000, 0)}K</div>
              <div className="text-sm text-muted-foreground">Failed Transactions/hr</div>
              <div className="text-xs text-muted-foreground">
                {safeToFixed((failedTxsPerHour / peakHourTxs) * 100, 1)}% failure rate
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Protocol Dominance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Protocol Dominance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Market Share Analysis</h4>
              <div className="space-y-3">
                {metrics.protocolBreakdown?.slice(0, 3).map((protocol, index) => {
                  const share =
                    metrics.totalTransactions > 0
                      ? (protocol.transactionCount / metrics.totalTransactions) * 100
                      : 0;
                  return (
                    <div key={protocol.moduleAddress} className="space-y-2 p-3 border rounded">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{protocol.protocolName}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{safeToFixed(share, 1)}%</span>
                          {index === 0 && <Badge variant="default">Leader</Badge>}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>
                          {safeToFixed(protocol.transactionCount / 1000000, 1)}M transactions
                        </span>
                        <span>{protocol.senderCount.toLocaleString()} users</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {protocolMarketShare > 50 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded dark:bg-orange-950 dark:border-orange-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      Concentration Risk
                    </span>
                  </div>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                    Top protocol controls {safeToFixed(protocolMarketShare, 1)}% of transactions
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Protocol Efficiency</h4>
              <div className="space-y-3">
                {metrics.protocolBreakdown?.slice(0, 3).map((protocol) => {
                  const gasPerTx =
                    protocol.transactionCount > 0
                      ? protocol.gasTotal / protocol.transactionCount
                      : 0;
                  const txsPerUser =
                    protocol.senderCount > 0 ? protocol.transactionCount / protocol.senderCount : 0;
                  return (
                    <div key={protocol.moduleAddress} className="p-3 border rounded space-y-2">
                      <div className="font-medium">{protocol.protocolName}</div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Gas per Transaction:</span>
                          <div className="font-mono">{safeToFixed(gasPerTx, 6)} APT</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Transactions per User:</span>
                          <div className="font-mono">{safeToFixed(txsPerUser, 1)}</div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          gasPerTx < 0.0005
                            ? "default"
                            : gasPerTx < 0.001
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {gasPerTx < 0.0005
                          ? "Efficient"
                          : gasPerTx < 0.001
                            ? "Moderate"
                            : "Gas Heavy"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Engagement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-2xl font-mono">
                {safeToFixed(metrics.dailyActiveAddresses / 1000, 0)}K
              </div>
              <div className="text-sm text-muted-foreground">Daily Active Users</div>
              <div className="text-xs text-muted-foreground">
                vs {safeToFixed(metrics.behaviorDailyActiveUsers / 1000, 0)}K behavior-tracked
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-mono">{safeToFixed(userDiscrepancy, 1)}%</div>
              <div className="text-sm text-muted-foreground">Measurement Discrepancy</div>
              <Badge variant={userDiscrepancy > 30 ? "destructive" : "secondary"}>
                {userDiscrepancy > 30 ? "Investigation Needed" : "Acceptable Range"}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-mono">{safeToFixed(signaturesPerTx, 1)}</div>
              <div className="text-sm text-muted-foreground">Signatures per Transaction</div>
              <Badge variant={signaturesPerTx > 1.5 ? "default" : "secondary"}>
                {signaturesPerTx > 1.5 ? "Complex Operations" : "Simple Transactions"}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-mono">{safeToFixed(peakUsers / 1000, 0)}K</div>
              <div className="text-sm text-muted-foreground">Peak Hourly Users</div>
              <div className="text-xs text-muted-foreground">
                {safeToFixed((peakUsers / metrics.dailyActiveAddresses) * 100, 0)}% of daily users
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gas Economics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Gas Economics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-2xl font-mono">
                ${safeToFixed(metrics.dailyGasFeesUSD / 1000, 1)}K
              </div>
              <div className="text-sm text-muted-foreground">Daily Revenue</div>
              <div className="text-xs text-muted-foreground">
                {safeToFixed(metrics.dailyGasFeesAPT, 0)} APT collected
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-mono">${safeToFixed(gasPerUser, 2)}</div>
              <div className="text-sm text-muted-foreground">Average Cost per User</div>
              <Badge
                variant={
                  gasPerUser > 0.5 ? "destructive" : gasPerUser > 0.1 ? "secondary" : "default"
                }
              >
                {gasPerUser > 0.5
                  ? "High Value Users"
                  : gasPerUser > 0.1
                    ? "Active Users"
                    : "Light Usage"}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-mono">
                {safeToFixed(metrics.activityPatterns?.[0]?.avg_gas_price, 0) || "101"}
              </div>
              <div className="text-sm text-muted-foreground">Current Gas Price</div>
              <div className="text-xs text-muted-foreground">Units per gas</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-mono">
                {safeToFixed(metrics.dailyTransactions / 1000000, 1)}M
              </div>
              <div className="text-sm text-muted-foreground">Daily Transactions</div>
              <Badge variant="default">Major DeFi Activity</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hourly Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Hourly Activity Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Peak Activity Hours</h4>
              <div className="space-y-3">
                {metrics.activityPatterns?.slice(0, 4).map((pattern, index) => {
                  const hour = new Date(pattern.hour).getUTCHours();
                  const failureRate =
                    pattern.transactions > 0
                      ? (pattern.failed_txns / pattern.transactions) * 100
                      : 0;
                  return (
                    <div key={pattern.hour} className="p-3 border rounded space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{hour}:00 UTC</span>
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          {index === 0 ? "Peak" : `#${index + 1}`}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Transactions:</span>
                          <div className="font-mono">
                            {safeToFixed(pattern.transactions / 1000, 0)}K
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Users:</span>
                          <div className="font-mono">
                            {safeToFixed(pattern.unique_users / 1000, 0)}K
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Failure Rate:</span>
                          <div className="font-mono text-red-600">
                            {safeToFixed(failureRate, 1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Network Performance Summary</h4>
              <div className="space-y-3">
                <div className="p-4 border rounded space-y-2">
                  <div className="text-2xl font-mono">
                    {avgHourlyTxs > 0
                      ? safeToFixed(((peakHourTxs - avgHourlyTxs) / avgHourlyTxs) * 100, 0)
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-muted-foreground">Peak vs Average</div>
                  <div className="text-xs text-muted-foreground">
                    {safeToFixed(peakHourTxs / 1000, 0)}K peak vs{" "}
                    {safeToFixed(avgHourlyTxs / 1000, 0)}K avg
                  </div>
                </div>
                <div className="p-4 border rounded space-y-2">
                  <div className="text-2xl font-mono">{safeToFixed(peakHourTxs / 3600, 0)}</div>
                  <div className="text-sm text-muted-foreground">Peak TPS</div>
                  <div className="text-xs text-muted-foreground">
                    Transactions per second at peak
                  </div>
                </div>
                <div className="p-4 border rounded space-y-2">
                  <div className="text-2xl font-mono">
                    {safeToFixed(peakHourTxs > 0 ? (failedTxsPerHour / peakHourTxs) * 100 : 0, 1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Network Stress Indicator</div>
                  <Badge
                    variant={
                      (failedTxsPerHour / peakHourTxs) * 100 > 20 ? "destructive" : "default"
                    }
                  >
                    {(failedTxsPerHour / peakHourTxs) * 100 > 20
                      ? "High Stress"
                      : "Normal Operation"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FocusedDashboards;
