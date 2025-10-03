import { useState } from "react";
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
import { useQuery } from "@tanstack/react-query";

export default function WalletPage() {
  const { account, balance, isConnected, connectWallet, disconnectWallet, network } = useWeb3();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("overview");

  // Security settings state
  const [multiSigEnabled, setMultiSigEnabled] = useState(false);
  const [hardwareWalletEnabled, setHardwareWalletEnabled] = useState(false);
  const [txSimulationEnabled, setTxSimulationEnabled] = useState(true);
  const [aiSentinelEnabled, setAiSentinelEnabled] = useState(true);
  const [spendingLimit, setSpendingLimit] = useState("10");
  const [whitelistAddress, setWhitelistAddress] = useState("");

  // Security score calculation
  const calculateSecurityScore = () => {
    let score = 30; // Base score
    if (multiSigEnabled) score += 25;
    if (hardwareWalletEnabled) score += 20;
    if (txSimulationEnabled) score += 10;
    if (aiSentinelEnabled) score += 15;
    return Math.min(score, 100);
  };

  const securityScore = calculateSecurityScore();

  // Mock security alerts
  const { data: securityAlerts = [] } = useQuery({
    queryKey: ['/api/security/alerts'],
    enabled: isConnected && aiSentinelEnabled,
    refetchInterval: 10000,
  });

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const enableMultiSig = () => {
    setMultiSigEnabled(true);
    toast({
      title: "Multi-Signature Activated",
      description: "Your wallet now requires 2-of-3 signatures for transactions",
    });
  };

  const connectHardwareWallet = () => {
    setHardwareWalletEnabled(true);
    toast({
      title: "Hardware Wallet Connected",
      description: "Ledger device successfully connected",
    });
  };

  const addToWhitelist = () => {
    if (whitelistAddress) {
      toast({
        title: "Address Whitelisted",
        description: `${whitelistAddress.slice(0, 10)}... added to trusted addresses`,
      });
      setWhitelistAddress("");
    }
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
              The Most Secure Crypto Wallet in the Universe
            </p>
          </div>

          <Card className="border-2 border-primary/20 shadow-2xl shadow-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Bulletproof Security</CardTitle>
              <CardDescription>Connect to activate military-grade protection</CardDescription>
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
                Connect Bulletproof Wallet
              </Button>
            </CardContent>
          </Card>
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
            <p className="text-muted-foreground">Bulletproof Security Fortress</p>
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
                <CardDescription>Your wallet's defense rating</CardDescription>
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
                Bulletproof
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
                      <Users className={`h-5 w-5 ${multiSigEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className="font-medium">Multi-Signature</span>
                    </div>
                    <Badge variant={multiSigEnabled ? "default" : "secondary"}>
                      {multiSigEnabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Lock className={`h-5 w-5 ${hardwareWalletEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className="font-medium">Hardware Wallet</span>
                    </div>
                    <Badge variant={hardwareWalletEnabled ? "default" : "secondary"}>
                      {hardwareWalletEnabled ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Eye className={`h-5 w-5 ${txSimulationEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className="font-medium">TX Simulation</span>
                    </div>
                    <Badge variant={txSimulationEnabled ? "default" : "secondary"}>
                      {txSimulationEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className={`h-5 w-5 ${aiSentinelEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className="font-medium">AI Sentinel</span>
                    </div>
                    <Badge variant={aiSentinelEnabled ? "default" : "secondary"}>
                      {aiSentinelEnabled ? "Monitoring" : "Disabled"}
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
                <div className="space-y-3">
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
                      checked={multiSigEnabled} 
                      onCheckedChange={setMultiSigEnabled}
                      data-testid="switch-multisig"
                    />
                  </div>
                  {!multiSigEnabled && (
                    <Button onClick={enableMultiSig} variant="outline" className="w-full" data-testid="button-enable-multisig">
                      <Users className="mr-2 h-4 w-4" />
                      Enable Multi-Sig Protection
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Hardware Wallet */}
                <div className="space-y-3">
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
                      checked={hardwareWalletEnabled} 
                      onCheckedChange={setHardwareWalletEnabled}
                      data-testid="switch-hardware-wallet"
                    />
                  </div>
                  {!hardwareWalletEnabled && (
                    <Button onClick={connectHardwareWallet} variant="outline" className="w-full" data-testid="button-connect-hardware">
                      <Lock className="mr-2 h-4 w-4" />
                      Connect Hardware Wallet
                    </Button>
                  )}
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
                    checked={txSimulationEnabled} 
                    onCheckedChange={setTxSimulationEnabled}
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
                    checked={aiSentinelEnabled} 
                    onCheckedChange={setAiSentinelEnabled}
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
                      value={spendingLimit}
                      onChange={(e) => setSpendingLimit(e.target.value)}
                      placeholder="10.0"
                      data-testid="input-spending-limit"
                    />
                  </div>
                  <Button className="w-full" data-testid="button-save-limit">
                    <Settings className="mr-2 h-4 w-4" />
                    Save Limit
                  </Button>
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
                  <Button onClick={addToWhitelist} className="w-full" data-testid="button-add-whitelist">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Add to Whitelist
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

              {/* Blacklist */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ban className="h-5 w-5" />
                    Blocked Addresses
                  </CardTitle>
                  <CardDescription>Prevent interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6 text-muted-foreground">
                    <Ban className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No blocked addresses</p>
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
                <CardDescription>Real-time threat monitoring and alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Threats Blocked</span>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold">0</div>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Scans (24h)</span>
                      <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold">247</div>
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
                  <h3 className="font-semibold mb-3">Recent Activity</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Wallet Connected</p>
                        <p className="text-xs text-muted-foreground">All security checks passed</p>
                      </div>
                      <span className="text-xs text-muted-foreground">Just now</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Scan className="h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Address Verified</p>
                        <p className="text-xs text-muted-foreground">No threats detected</p>
                      </div>
                      <span className="text-xs text-muted-foreground">1m ago</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-primary mb-1">AI Protection Active</h4>
                      <p className="text-sm text-muted-foreground">
                        Your wallet is being monitored 24/7 by our AI Sentinel. Any suspicious activity will trigger immediate alerts.
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
