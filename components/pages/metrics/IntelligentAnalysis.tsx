import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  Code,
  Database,
  Lightbulb,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface QueryInfo {
  query: string;
  category?: string;
  description?: string;
  [key: string]: any;
}

interface IntelligentAnalysisProps {
  metrics: {
    ecosystemHealth?: any;
    advancedQueries?: Record<string, QueryInfo>;
    dataQuality?: any;
    recommendations?: any;
    [key: string]: any;
  };
}

const IntelligentAnalysis: React.FC<IntelligentAnalysisProps> = ({ metrics }) => {
  const { ecosystemHealth, advancedQueries, dataQuality, recommendations } = metrics;

  if (!ecosystemHealth) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Intelligent Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading intelligent analysis...</p>
        </CardContent>
      </Card>
    );
  }

  const getSeverityIcon = (significance: string) => {
    switch (significance) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "high":
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case "medium":
        return <Activity className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "bullish":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "bearish":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="space-y-8">
      {/* Ecosystem Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Intelligent Ecosystem Analysis
            <Badge variant={ecosystemHealth.score >= 70 ? "default" : "destructive"}>
              AI-Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Overall Health Score */}
            <Card>
              <CardContent className="text-center p-4">
                <div className={`text-3xl font-bold ${getScoreColor(ecosystemHealth.score)}`}>
                  {ecosystemHealth.score}
                </div>
                <div className="text-sm text-muted-foreground">Ecosystem Health</div>
                <Progress value={ecosystemHealth.score} className="mt-2" />
              </CardContent>
            </Card>

            {/* Individual Indicators */}
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {ecosystemHealth.indicators.userGrowth.toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">User Growth</div>
                <Progress value={ecosystemHealth.indicators.userGrowth} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {ecosystemHealth.indicators.protocolDiversity.toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">Protocol Diversity</div>
                <Progress value={ecosystemHealth.indicators.protocolDiversity} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {ecosystemHealth.indicators.economicActivity.toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">Economic Activity</div>
                <Progress value={ecosystemHealth.indicators.economicActivity} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Market Sentiment */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                {getTrendIcon(ecosystemHealth.trends.direction)}
                <span className="font-semibold capitalize">
                  {ecosystemHealth.trends.direction} Sentiment
                </span>
                <Badge variant={ecosystemHealth.trends.strength > 0.7 ? "default" : "secondary"}>
                  {(ecosystemHealth.trends.strength * 100).toFixed(0)}% Confidence
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{ecosystemHealth.trends.reasoning}</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Detailed Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Deep Network Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ecosystemHealth.insights.map((insight, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(insight.significance)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{insight.metric}</span>
                        <Badge variant="outline">{insight.value}</Badge>
                        <Badge
                          variant={
                            insight.significance === "critical"
                              ? "destructive"
                              : insight.significance === "high"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {insight.significance}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.interpretation}</p>
                      {insight.recommendation && (
                        <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
                          <CardContent className="pt-3 pb-3">
                            <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                              <Lightbulb className="h-3 w-3 inline mr-1" />
                              Recommendation: {insight.recommendation}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Context: {insight.context}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Query Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Advanced Analytics Queries
            <Badge variant="secondary">Copy & Run in Dune</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {advancedQueries && (
            <div className="space-y-6">
              {/* Query Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(
                  Object.entries(advancedQueries).reduce(
                    (acc, [key, queryInfo]) => {
                      const category = queryInfo.category || "Other";
                      if (!acc[category]) acc[category] = [];
                      acc[category].push({ key, ...queryInfo });
                      return acc;
                    },
                    {} as Record<string, QueryInfo[]>
                  )
                ).map(([category, queries]) => (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        {category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {queries.map((queryInfo) => (
                          <Card key={queryInfo.key} className="border">
                            <CardContent className="pt-3 pb-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">{queryInfo.key}</span>
                                <Badge
                                  variant="outline"
                                  className="cursor-pointer hover:bg-blue-50"
                                  onClick={() => navigator.clipboard.writeText(queryInfo.query)}
                                >
                                  Copy
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {queryInfo.description}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Featured Query Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Featured Query: Protocol Health Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Card className="bg-slate-900 text-green-400 border-slate-700 dark:bg-slate-950 dark:border-slate-800">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm text-green-300 dark:text-green-400">
                          Complete Protocol Health & Performance Analysis
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-green-800 dark:hover:bg-green-900 text-green-300 dark:text-green-400 border-green-600 dark:border-green-700"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                advancedQueries.protocolHealth?.query || ""
                              )
                            }
                          >
                            Copy SQL
                          </Badge>
                          <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-blue-800 dark:hover:bg-blue-900 text-blue-300 dark:text-blue-400 border-blue-600 dark:border-blue-700"
                            onClick={() => window.open("https://dune.com/queries", "_blank")}
                          >
                            Open Dune
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs overflow-x-auto text-green-400 dark:text-green-300">
                        <code>
                          {advancedQueries.protocolHealth?.query.slice(0, 600) || "Loading..."}...
                        </code>
                      </pre>
                    </CardContent>
                  </Card>
                  <div className="mt-4 space-y-2">
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">Purpose:</span>
                      <span>
                        {advancedQueries.protocolHealth?.description ||
                          "Advanced protocol analysis"}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">Category:</span>
                      <Badge variant="secondary">
                        {advancedQueries.protocolHealth?.category || "Analytics"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Query Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Query Library Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-blue-600">
                        {Object.keys(advancedQueries).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Queries</div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-green-600">
                        {new Set(Object.values(advancedQueries).map((q) => q.category)).size}
                      </div>
                      <div className="text-sm text-muted-foreground">Categories</div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-purple-600">
                        {Object.values(advancedQueries).reduce(
                          (sum, q) => sum + q.query.split("\n").length,
                          0
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">Lines of SQL</div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-orange-600">
                        {
                          Object.values(advancedQueries).filter((q) => q.query.includes("WITH "))
                            .length
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">Complex CTEs</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Quality Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Quality Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Consistency Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">User Activity Discrepancy:</span>
                    <Badge
                      variant={
                        dataQuality.consistency.userActivityDiscrepancy < 0.1
                          ? "default"
                          : "destructive"
                      }
                    >
                      {(dataQuality.consistency.userActivityDiscrepancy * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dataQuality.consistency.explanation}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Reliability Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate:</span>
                    <Badge
                      variant={dataQuality.reliability.successRate > 85 ? "default" : "destructive"}
                    >
                      {dataQuality.reliability.successRate}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Data Sources:</span>
                    <Badge variant="outline">
                      {dataQuality.reliability.dataCompleteness} Queries
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Actionable Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Actionable Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <Card key={index} className="border-l-4 border-l-orange-500">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={rec.priority === "critical" ? "destructive" : "default"}>
                          {rec.priority.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{rec.category}</span>
                      </div>
                      <p className="text-sm">{rec.action}</p>
                      <p className="text-xs text-muted-foreground">{rec.context}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IntelligentAnalysis;
