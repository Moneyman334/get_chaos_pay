import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, TrendingUp, Users, Zap, Database, DollarSign, BarChart3, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function CommandCenter() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/command-center/stats'],
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['/api/command-center/activity'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/command-center/health'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transaction': return <Database className="h-4 w-4" />;
      case 'trade': return <TrendingUp className="h-4 w-4" />;
      case 'stake': return <Zap className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'transaction': return 'bg-blue-500/10 text-blue-500';
      case 'trade': return 'bg-green-500/10 text-green-500';
      case 'stake': return 'bg-purple-500/10 text-purple-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'filled':
      case 'active':
      case 'completed':
        return 'bg-green-500/10 text-green-500';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'failed':
      case 'cancelled':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2" data-testid="text-command-center-title">
          ⚡ CODEX Command Center
        </h1>
        <p className="text-gray-400">Real-time platform monitoring and analytics</p>
      </div>

      {/* Platform Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsLoading ? (
          Array(8).fill(0).map((_, i) => (
            <Card key={i} className="bg-gray-800/50 border-purple-500/20">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24 bg-gray-700" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 bg-gray-700" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="bg-gray-800/50 border-purple-500/20 backdrop-blur-sm" data-testid="card-stat-tvl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Value Locked</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white" data-testid="text-tvl-value">
                  {formatAmount(stats?.tvl || '0')} ETH
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-purple-500/20 backdrop-blur-sm" data-testid="card-stat-revenue">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
                <BarChart3 className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white" data-testid="text-revenue-value">
                  ${formatAmount(stats?.totalRevenue || '0')}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-purple-500/20 backdrop-blur-sm" data-testid="card-stat-users">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Active Users</CardTitle>
                <Users className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white" data-testid="text-users-value">
                  {stats?.activeUsers || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-purple-500/20 backdrop-blur-sm" data-testid="card-stat-transactions">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Transactions</CardTitle>
                <Database className="h-4 w-4 text-cyan-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white" data-testid="text-transactions-value">
                  {stats?.totalTransactions || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-purple-500/20 backdrop-blur-sm" data-testid="card-stat-trades">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Bot Trades</CardTitle>
                <TrendingUp className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white" data-testid="text-trades-value">
                  {stats?.totalTrades || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-purple-500/20 backdrop-blur-sm" data-testid="card-stat-stakes">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Active Stakes</CardTitle>
                <Zap className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white" data-testid="text-stakes-value">
                  {stats?.totalStakes || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-purple-500/20 backdrop-blur-sm" data-testid="card-stat-orders">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Orders</CardTitle>
                <BarChart3 className="h-4 w-4 text-pink-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white" data-testid="text-orders-value">
                  {stats?.totalOrders || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-purple-500/20 backdrop-blur-sm" data-testid="card-stat-campaigns">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Marketing Campaigns</CardTitle>
                <Activity className="h-4 w-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white" data-testid="text-campaigns-value">
                  {stats?.totalCampaigns || 0}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Activity Feed */}
        <Card className="lg:col-span-2 bg-gray-800/50 border-purple-500/20 backdrop-blur-sm" data-testid="card-activity-feed">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Live Activity Feed</CardTitle>
                <CardDescription>Real-time platform activity</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">Live</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {activityLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30">
                    <Skeleton className="h-8 w-8 rounded-lg bg-gray-700" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-2 bg-gray-700" />
                      <Skeleton className="h-3 w-32 bg-gray-700" />
                    </div>
                  </div>
                ))
              ) : activity && activity.length > 0 ? (
                activity.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                    data-testid={`activity-item-${item.id}`}
                  >
                    <div className={`p-2 rounded-lg ${getActivityColor(item.type)}`}>
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{item.description}</p>
                      <p className="text-xs text-gray-400">
                        {item.timestamp ? formatDistanceToNow(new Date(item.timestamp), { addSuffix: true }) : 'Just now'}
                      </p>
                    </div>
                    <Badge className={getStatusColor(item.status)} data-testid={`badge-status-${item.id}`}>
                      {item.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="bg-gray-800/50 border-purple-500/20 backdrop-blur-sm" data-testid="card-system-health">
          <CardHeader>
            <CardTitle className="text-white">System Health</CardTitle>
            <CardDescription>Service monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="space-y-4">
                {Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-gray-700" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20" data-testid="health-overall">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-white">Overall Status</span>
                  </div>
                  <p className="text-sm text-green-400 capitalize">{health?.status || 'healthy'}</p>
                </div>

                {health?.services && Object.entries(health.services).map(([service, data]: [string, any]) => (
                  <div
                    key={service}
                    className="p-4 rounded-lg bg-gray-700/30"
                    data-testid={`health-service-${service}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white capitalize">{service}</span>
                      <Badge className="bg-green-500/10 text-green-500">
                        {data.status}
                      </Badge>
                    </div>
                    {data.recentActivity !== undefined && (
                      <p className="text-xs text-gray-400">
                        Recent activity (1h): {data.recentActivity}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
