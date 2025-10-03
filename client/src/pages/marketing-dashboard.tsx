import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TrendingUp, DollarSign, Target, BarChart3, Calendar, Plus, Eye, Trash2, Activity } from "lucide-react";
import type { MarketingCampaign } from "@shared/schema";

export default function MarketingDashboard() {
  const { toast } = useToast();
  const [userId] = useState("default-user");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery<MarketingCampaign[]>({
    queryKey: ['/api/marketing/campaigns', userId],
  });

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery<{
    campaign: MarketingCampaign;
    totalImpressions: string;
    totalClicks: string;
    totalConversions: string;
    totalRevenue: string;
    avgCtr: string;
    avgConversionRate: string;
    roi: string;
    metricsHistory: any[];
  }>({
    queryKey: ['/api/marketing/campaign', selectedCampaign, 'analytics'],
    enabled: !!selectedCampaign,
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/marketing/campaigns', { ...data, userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/campaigns'] });
      setIsCreateDialogOpen(false);
      toast({ title: "Campaign created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create campaign", variant: "destructive" });
    }
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/marketing/campaign/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/campaigns'] });
      toast({ title: "Campaign deleted successfully" });
    }
  });

  const handleCreateCampaign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const channels = formData.get('channels') as string;
    
    createCampaignMutation.mutate({
      name: formData.get('name'),
      description: formData.get('description'),
      type: formData.get('type'),
      budget: formData.get('budget') || '0',
      spent: '0',
      status: 'active',
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      targetAudience: formData.get('targetAudience'),
      channels: channels.split(',').map(c => c.trim()).filter(Boolean),
      goals: {}
    });
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (activeTab === 'all') return true;
    return c.status === activeTab;
  });

  const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.budget || 0), 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + Number(c.spent || 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-background to-blue-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent mb-3">
            📊 Marketing Command Center
          </h1>
          <p className="text-lg text-muted-foreground">
            Strategic campaign management for CODEX ecosystem dominance
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-950/50 to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-300">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-100" data-testid="text-total-budget">
                ${totalBudget.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Allocated across all campaigns</p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-950/50 to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-300">Total Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-100" data-testid="text-total-spent">
                ${totalSpent.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}% of budget` : '0%'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-pink-500/20 bg-gradient-to-br from-pink-950/50 to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-pink-300">Active Campaigns</CardTitle>
              <Target className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-100" data-testid="text-active-campaigns">
                {activeCampaigns}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Currently running</p>
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-950/50 to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-cyan-300">Total Campaigns</CardTitle>
              <BarChart3 className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-100" data-testid="text-total-campaigns">
                {campaigns.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Tabs and List */}
        <Card className="border-purple-500/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Campaigns</CardTitle>
                <CardDescription>Manage and track your marketing campaigns</CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600" data-testid="button-create-campaign">
                    <Plus className="h-4 w-4 mr-2" />
                    New Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <form onSubmit={handleCreateCampaign}>
                    <DialogHeader>
                      <DialogTitle>Create New Campaign</DialogTitle>
                      <DialogDescription>
                        Set up a new marketing campaign to promote CODEX
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Campaign Name</Label>
                        <Input id="name" name="name" placeholder="Q1 2025 User Acquisition" required data-testid="input-campaign-name" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea 
                          id="description" 
                          name="description" 
                          placeholder="Campaign objectives and strategy..."
                          data-testid="input-campaign-description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="type">Campaign Type</Label>
                          <Select name="type" required>
                            <SelectTrigger data-testid="select-campaign-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="social">Social Media</SelectItem>
                              <SelectItem value="content">Content Marketing</SelectItem>
                              <SelectItem value="email">Email Marketing</SelectItem>
                              <SelectItem value="paid">Paid Advertising</SelectItem>
                              <SelectItem value="influencer">Influencer Marketing</SelectItem>
                              <SelectItem value="community">Community Growth</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="budget">Budget ($)</Label>
                          <Input 
                            id="budget" 
                            name="budget" 
                            type="number" 
                            placeholder="10000"
                            data-testid="input-campaign-budget"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="startDate">Start Date</Label>
                          <Input id="startDate" name="startDate" type="date" data-testid="input-campaign-start-date" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="endDate">End Date</Label>
                          <Input id="endDate" name="endDate" type="date" data-testid="input-campaign-end-date" />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="targetAudience">Target Audience</Label>
                        <Input 
                          id="targetAudience" 
                          name="targetAudience" 
                          placeholder="Crypto traders, DeFi enthusiasts, Web3 developers"
                          data-testid="input-campaign-target-audience"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="channels">Channels (comma-separated)</Label>
                        <Input 
                          id="channels" 
                          name="channels" 
                          placeholder="Twitter, Discord, Telegram, Medium"
                          data-testid="input-campaign-channels"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createCampaignMutation.isPending} data-testid="button-submit-campaign">
                        {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" data-testid="tab-all-campaigns">All</TabsTrigger>
                <TabsTrigger value="active" data-testid="tab-active-campaigns">Active</TabsTrigger>
                <TabsTrigger value="paused" data-testid="tab-paused-campaigns">Paused</TabsTrigger>
                <TabsTrigger value="completed" data-testid="tab-completed-campaigns">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab} className="mt-4">
                {isLoadingCampaigns ? (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-purple-500" />
                    <p className="text-muted-foreground">Loading campaigns...</p>
                  </div>
                ) : filteredCampaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No campaigns found</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">Create your first campaign to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCampaigns.map((campaign) => (
                      <Card 
                        key={campaign.id} 
                        className="border-purple-500/20 hover:border-purple-500/40 transition-colors"
                        data-testid={`card-campaign-${campaign.id}`}
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <CardTitle className="text-xl" data-testid={`text-campaign-name-${campaign.id}`}>
                                  {campaign.name}
                                </CardTitle>
                                <Badge 
                                  variant={campaign.status === 'active' ? 'default' : 'secondary'}
                                  className={
                                    campaign.status === 'active' 
                                      ? 'bg-green-600/20 text-green-400 border-green-500/50'
                                      : campaign.status === 'paused'
                                      ? 'bg-yellow-600/20 text-yellow-400 border-yellow-500/50'
                                      : 'bg-gray-600/20 text-gray-400 border-gray-500/50'
                                  }
                                  data-testid={`badge-campaign-status-${campaign.id}`}
                                >
                                  {campaign.status}
                                </Badge>
                                <Badge variant="outline" className="border-purple-500/50 text-purple-300">
                                  {campaign.type}
                                </Badge>
                              </div>
                              {campaign.description && (
                                <CardDescription className="text-base" data-testid={`text-campaign-description-${campaign.id}`}>
                                  {campaign.description}
                                </CardDescription>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedCampaign(campaign.id)}
                                data-testid={`button-view-analytics-${campaign.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                                data-testid={`button-delete-campaign-${campaign.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Budget</p>
                              <p className="font-semibold text-lg" data-testid={`text-campaign-budget-${campaign.id}`}>
                                ${Number(campaign.budget || 0).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Spent</p>
                              <p className="font-semibold text-lg text-blue-400" data-testid={`text-campaign-spent-${campaign.id}`}>
                                ${Number(campaign.spent || 0).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Start Date</p>
                              <p className="font-medium flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'Not set'}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">End Date</p>
                              <p className="font-medium flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Ongoing'}
                              </p>
                            </div>
                          </div>
                          {campaign.channels && campaign.channels.length > 0 && (
                            <div className="mt-4 flex gap-2 flex-wrap">
                              {campaign.channels.map((channel, idx) => (
                                <Badge key={idx} variant="outline" className="border-blue-500/50 text-blue-300">
                                  {channel}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Analytics Dialog */}
        {selectedCampaign && (
          <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Campaign Analytics</DialogTitle>
                <DialogDescription>
                  Performance metrics and insights
                </DialogDescription>
              </DialogHeader>
              {isLoadingAnalytics ? (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-purple-500" />
                  <p className="text-muted-foreground">Loading analytics...</p>
                </div>
              ) : analytics ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-purple-500/20">
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm text-muted-foreground">Impressions</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold" data-testid="text-analytics-impressions">
                          {Number(analytics.totalImpressions || 0).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-blue-500/20">
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm text-muted-foreground">Clicks</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold" data-testid="text-analytics-clicks">
                          {Number(analytics.totalClicks || 0).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-pink-500/20">
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm text-muted-foreground">CTR</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold text-pink-400" data-testid="text-analytics-ctr">
                          {analytics.avgCtr}%
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-green-500/20">
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm text-muted-foreground">ROI</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold text-green-400" data-testid="text-analytics-roi">
                          {analytics.roi}%
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  <Card className="border-purple-500/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Conversions:</span>
                          <span className="font-semibold">{analytics.totalConversions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Revenue:</span>
                          <span className="font-semibold text-green-400">${Number(analytics.totalRevenue || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Conversion Rate:</span>
                          <span className="font-semibold text-blue-400">{analytics.avgConversionRate}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No analytics data available</p>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
