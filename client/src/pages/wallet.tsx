import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWeb3 } from "@/hooks/use-web3";
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  Shield, 
  ShieldCheck, 
  AlertTriangle,
  Lock,
  Users,
  Zap,
  Activity,
  Eye,
  Settings,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  TrendingUp,
  Scan
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function WalletPage() {
  const { account, balance, isConnected, connectWallet, disconnectWallet, network } = useWeb3();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [whitelistAddress, setWhitelistAddress] = useState("");
  const [blocklistAddress, setBlocklistAddress] = useState("");

  // Load security policy from backend
  const { data: policy, isLoading } = useQuery<any>({
    queryKey: ['/api/security/policy', account],
    enabled: !!account,
    refetchInterval: 30000, // Refresh every 30s
  });

  // Load security alerts
  const { data: alerts = [] } = useQuery<any[]>({
    queryKey: ['/api/security/alerts', account],
    enabled: !!account && policy?.aiSentinelEnabled,
    refetchInterval: 10000, // Refresh every 10s
  });

  // Load whitelist
  const { data: whitelist = [] } = useQuery<string[]>({
    queryKey: ['/api/security/whitelist', account],
    enabled: !!account,
  });

  // Update security policy mutation
  const updatePolicyMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await fetch(`/api/security/policy/${account}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update policy');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/security/policy', account] });
      queryClient.invalidateQueries({ queryKey: ['/api/security/alerts', account] });
    },
  });

  // Add to whitelist mutation
  const addWhitelistMutation = useMutation({
    mutationFn: async (address: string) => {
      const response = await fetch(`/api/security/whitelist/${account}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      if (!response.ok) throw new Error('Failed to add to whitelist');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/security/whitelist', account] });
      queryClient.invalidateQueries({ queryKey: ['/api/security/alerts', account] });
      setWhitelistAddress("");
      toast({
        title: "Address Whitelisted",
        description: "Address added to trusted list",
      });
    },
  });

  // Add to blacklist mutation
  const addBlocklistMutation = useMutation({
    mutationFn: async ({ address, reason }: { address: string; reason?: string }) => {
      const response = await fetch(`/api/security/blacklist/${account}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, reason }),
      });
      if (!response.ok) throw new Error('Failed to block address');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/security/alerts', account] });
      setBlocklistAddress("");
      toast({
        title: "Address Blocked",
        description: "Address added to blocklist",
        variant: "destructive",
      });
    },
  });

  // Calculate security score
  const calculateSecurityScore = () => {
    if (!policy) return 30;
    let score = 30;
    if (policy.multiSigEnabled) score += 25;
    if (policy.hardwareWalletEnabled) score += 20;
    if (policy.txSimulationEnabled) score += 10;
    if (policy.aiSentinelEnabled) score += 15;
    return Math.min(score, 100);
  };

  const securityScore = calculateSecurityScore();

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const toggleFeature = (feature: string, value: boolean) => {
    updatePolicyMutation.mutate({ [feature]: value });
    toast({
      title: "Security Updated",
      description: `${feature} has been ${value ? 'enabled' : 'disabled'}`,
    });
  };

  const saveSpendingLimit = (limit: string) => {
    updatePolicyMutation.mutate({ dailySpendingLimit: limit });
    toast({
      title: "Limit Updated",
      description: `Daily spending limit set to ${limit} ETH`,
    });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full mb-4">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
              Empire Wallet
            </h1>
            <p className="text-muted-foreground text-lg">
              Advanced Security Protection System
            </p>
          </div>

          <Card className="border-2 border-primary/20 shadow-2xl shadow-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Military-Grade Security</CardTitle>
              <CardDescription>Connect to activate advanced protection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <Users className="h-6 w-6 text-primary mb-2" />
                  <p className="text-sm font-medium">Multi-Signature</p>
                  <p className="text-xs text-muted-foreground">2-of-3 Protection</p>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <Lock className="h-6 w-6 text-primary mb-2" />
                  <p className="text-sm font-medium">Hardware Wallet</p>
                  <p className="text-xs text-muted-foreground">Ledger/Trezor</p>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <Eye className="h-6 w-6 text-primary mb-2" />
                  <p className="text-sm font-medium">TX Simulation</p>
                  <p className="text-xs text-muted-foreground">Preview Before Sign</p>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <Activity className="h-6 w-6 text-primary mb-2" />
                  <p className="text-sm font-medium">AI Sentinel</p>
                  <p className="text-xs text-muted-foreground">Real-time Threats</p>
                </div>
              </div>

              <Button 
                onClick={() => connectWallet()} 
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90"
                data-testid="button-connect-wallet"
              >
                <Shield className="mr-2 h-5 w-5" />
                Connect Secure Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading security settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Empire Wallet
            </h1>
            <p className="text-muted-foreground">Advanced Security Fortress</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-4 py-2 text-sm border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
              Protected
            </Badge>
            <Button variant="outline" onClick={disconnectWallet} data-testid="button-disconnect">
              Disconnect
            </Button>
          </div>
        </div>

        {/* Security Score Card */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  Security Score
                </CardTitle>
                <CardDescription>Real-time wallet protection rating</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary">{securityScore}</div>
                <div className="text-sm text-muted-foreground">/ 100</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={securityScore} className="h-3 mb-4" />
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className={`text-center p-2 rounded ${securityScore >= 25 ? 'bg-green-500/20 text-green-500' : 'bg-muted'}`}>
                {securityScore >= 25 ? <CheckCircle2 className="h-4 w-4 mx-auto mb-1" /> : <XCircle className="h-4 w-4 mx-auto mb-1" />}
                Basic
              </div>
              <div className={`text-center p-2 rounded ${securityScore >= 50 ? 'bg-green-500/20 text-green-500' : 'bg-muted'}`}>
                {securityScore >= 50 ? <CheckCircle2 className="h-4 w-4 mx-auto mb-1" /> : <XCircle className="h-4 w-4 mx-auto mb-1" />}
                Enhanced
              </div>
              <div className={`text-center p-2 rounded ${securityScore >= 75 ? 'bg-green-500/20 text-green-500' : 'bg-muted'}`}>
                {securityScore >= 75 ? <CheckCircle2 className="h-4 w-4 mx-auto mb-1" /> : <XCircle className="h-4 w-4 mx-auto mb-1" />}
                Advanced
              </div>
              <div className={`text-center p-2 rounded ${securityScore === 100 ? 'bg-green-500/20 text-green-500' : 'bg-muted'}`}>
                {securityScore === 100 ? <CheckCircle2 className="h-4 w-4 mx-auto mb-1" /> : <XCircle className="h-4 w-4 mx-auto mb-1" />}
                Fortress
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
            <TabsTrigger value="policies" data-testid="tab-policies">Policies</TabsTrigger>
            <TabsTrigger value="monitoring" data-testid="tab-monitoring">AI Sentinel</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Wallet Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Wallet Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-muted p-2 rounded text-sm break-all" data-testid="text-wallet-address">
                        {account}
                      </code>
                      <Button variant="outline" size="sm" onClick={copyAddress} data-testid="button-copy-address">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" asChild data-testid="button-view-explorer">
                        <a href={`https://etherscan.io/address/${account}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Balance</label>
                    <p className="text-3xl font-bold mt-1" data-testid="text-balance">
                      {balance} ETH
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Network</label>
                    <p className="text-lg font-medium mt-1">{network?.name || "Unknown"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Active Protections */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Active Protections
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className={`h-5 w-5 ${policy?.multiSigEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className="font-medium">Multi-Signature</span>
                    </div>
                    <Badge variant={policy?.multiSigEnabled ? "default" : "secondary"}>
                      {policy?.multiSigEnabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Lock className={`h-5 w-5 ${policy?.hardwareWalletEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className="font-medium">Hardware Wallet</span>
                    </div>
                    <Badge variant={policy?.hardwareWalletEnabled ? "default" : "secondary"}>
                      {policy?.hardwareWalletEnabled ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Eye className={`h-5 w-5 ${policy?.txSimulationEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className="font-medium">TX Simulation</span>
                    </div>
                    <Badge variant={policy?.txSimulationEnabled ? "default" : "secondary"}>
                      {policy?.txSimulationEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className={`h-5 w-5 ${policy?.aiSentinelEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className="font-medium">AI Sentinel</span>
                    </div>
                    <Badge variant={policy?.aiSentinelEnabled ? "default" : "secondary"}>
                      {policy?.aiSentinelEnabled ? "Monitoring" : "Disabled"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Features</CardTitle>
                <CardDescription>Enable advanced security layers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Multi-Sig */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Multi-Signature Wallet</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Require 2-of-3 signatures for transactions
                    </p>
                  </div>
                  <Switch 
                    checked={policy?.multiSigEnabled || false} 
                    onCheckedChange={(val) => toggleFeature('multiSigEnabled', val)}
                    data-testid="switch-multisig"
                  />
                </div>

                <Separator />

                {/* Hardware Wallet */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Hardware Wallet</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Connect Ledger or Trezor device
                    </p>
                  </div>
                  <Switch 
                    checked={policy?.hardwareWalletEnabled || false} 
                    onCheckedChange={(val) => toggleFeature('hardwareWalletEnabled', val)}
                    data-testid="switch-hardware-wallet"
                  />
                </div>

                <Separator />

                {/* Transaction Simulation */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Transaction Simulation</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Preview transaction outcomes before signing
                    </p>
                  </div>
                  <Switch 
                    checked={policy?.txSimulationEnabled || false} 
                    onCheckedChange={(val) => toggleFeature('txSimulationEnabled', val)}
                    data-testid="switch-tx-simulation"
                  />
                </div>

                <Separator />

                {/* AI Sentinel */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">AI Security Sentinel</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Real-time threat detection and alerts
                    </p>
                  </div>
                  <Switch 
                    checked={policy?.aiSentinelEnabled || false} 
                    onCheckedChange={(val) => toggleFeature('aiSentinelEnabled', val)}
                    data-testid="switch-ai-sentinel"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Spending Limits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Spending Limits
                  </CardTitle>
                  <CardDescription>Set daily transaction limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="spending-limit">Daily Limit (ETH)</Label>
                    <Input 
                      id="spending-limit"
                      type="number" 
                      defaultValue={policy?.dailySpendingLimit || "10"}
                      placeholder="10.0"
                      onBlur={(e) => saveSpendingLimit(e.target.value)}
                      data-testid="input-spending-limit"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Current limit: {policy?.dailySpendingLimit || "10"} ETH per day
                  </p>
                </CardContent>
              </Card>

              {/* Whitelist */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Trusted Addresses
                  </CardTitle>
                  <CardDescription>Whitelist safe addresses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="whitelist-address">Address</Label>
                    <Input 
                      id="whitelist-address"
                      value={whitelistAddress}
                      onChange={(e) => setWhitelistAddress(e.target.value)}
                      placeholder="0x..."
                      data-testid="input-whitelist-address"
                    />
                  </div>
                  <Button 
                    onClick={() => addWhitelistMutation.mutate(whitelistAddress)} 
                    className="w-full"
                    disabled={!whitelistAddress || addWhitelistMutation.isPending}
                    data-testid="button-add-whitelist"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Add to Whitelist
                  </Button>
                  {whitelist.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Trusted ({whitelist.length})</p>
                      {whitelist.slice(0, 3).map((addr: string, i: number) => (
                        <div key={i} className="text-xs bg-muted p-2 rounded truncate">
                          {addr}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Blacklist */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ban className="h-5 w-5" />
                    Blocked Addresses
                  </CardTitle>
                  <CardDescription>Prevent interactions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="blocklist-address">Address</Label>
                    <Input 
                      id="blocklist-address"
                      value={blocklistAddress}
                      onChange={(e) => setBlocklistAddress(e.target.value)}
                      placeholder="0x..."
                      data-testid="input-blocklist-address"
                    />
                  </div>
                  <Button 
                    onClick={() => addBlocklistMutation.mutate({ address: blocklistAddress, reason: "Manual block" })} 
                    variant="destructive"
                    className="w-full"
                    disabled={!blocklistAddress || addBlocklistMutation.isPending}
                    data-testid="button-add-blocklist"
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Block Address
                  </Button>
                </CardContent>
              </Card>

              {/* Time Locks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Time-Locked Transfers
                  </CardTitle>
                  <CardDescription>Delay large transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm">Transactions &gt; 5 ETH</span>
                      <Badge>24h Delay</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm">Transactions &gt; 10 ETH</span>
                      <Badge>48h Delay</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  AI Security Sentinel
                </CardTitle>
                <CardDescription>Real-time threat monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Threats Blocked</span>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold">{alerts.filter((a: any) => a.type === 'blocked_transaction').length}</div>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Total Alerts</span>
                      <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold">{alerts.length}</div>
                  </div>
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Risk Score</span>
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div className="text-2xl font-bold">Low</div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Recent Alerts</h3>
                  <div className="space-y-2">
                    {alerts.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No threats detected</p>
                      </div>
                    ) : (
                      alerts.slice(0, 5).map((alert: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <div className={`p-2 rounded ${
                            alert.severity === 'critical' ? 'bg-red-500/20' :
                            alert.severity === 'high' ? 'bg-orange-500/20' :
                            alert.severity === 'medium' ? 'bg-yellow-500/20' :
                            'bg-blue-500/20'
                          }`}>
                            {alert.type === 'blocked_transaction' ? <Ban className="h-4 w-4" /> :
                             alert.type === 'spending_limit' ? <TrendingUp className="h-4 w-4" /> :
                             <Activity className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{alert.title}</p>
                            <p className="text-xs text-muted-foreground">{alert.description}</p>
                          </div>
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {alert.severity}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-primary mb-1">AI Protection Active</h4>
                      <p className="text-sm text-muted-foreground">
                        Your wallet is monitored 24/7. All transactions are validated against your security policies.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
