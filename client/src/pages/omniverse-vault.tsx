import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/hooks/useWeb3";
import { Lock, Unlock, Shield, Eye, EyeOff, AlertTriangle, Check, X, KeyRound, Database, Activity, Archive, Zap } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function OmniverseVault() {
  const { address } = useWeb3();
  const { toast } = useToast();
  const [masterPassword, setMasterPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [vaultId, setVaultId] = useState<string | null>(null);

  // Fetch vault data
  const { data: vault, isLoading: vaultLoading } = useQuery({
    queryKey: ['/api/vault', address],
    enabled: !!address,
  });

  // Fetch vault transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/vault', vaultId, 'transactions'],
    enabled: !!vaultId && isUnlocked,
  });

  // Fetch vault assets
  const { data: assets = [] } = useQuery({
    queryKey: ['/api/vault', vaultId, 'assets'],
    enabled: !!vaultId && isUnlocked,
  });

  // Fetch security logs
  const { data: securityLogs = [] } = useQuery({
    queryKey: ['/api/vault', vaultId, 'security-logs'],
    enabled: !!vaultId && isUnlocked,
  });

  useEffect(() => {
    if (vault?.id) {
      setVaultId(vault.id);
    }
  }, [vault]);

  // Create vault mutation
  const createVaultMutation = useMutation({
    mutationFn: async (password: string) => {
      return await apiRequest('POST', '/api/vault/create', {
        ownerAddress: address,
        masterPassword: password,
      });
    },
    onSuccess: () => {
      toast({
        title: "🔒 Vault Created!",
        description: "Your OMNIVERSE SYNDICATE vault is now active.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vault', address] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Vault",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unlock vault mutation
  const unlockVaultMutation = useMutation({
    mutationFn: async (password: string) => {
      return await apiRequest('POST', '/api/vault/unlock', {
        ownerAddress: address,
        masterPassword: password,
      });
    },
    onSuccess: () => {
      setIsUnlocked(true);
      toast({
        title: "🔓 Vault Unlocked",
        description: "Access granted to your secure vault.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vault', address] });
    },
    onError: (error: any) => {
      toast({
        title: "Access Denied",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateVault = () => {
    if (!masterPassword || masterPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    createVaultMutation.mutate(masterPassword);
  };

  const handleUnlockVault = () => {
    if (!masterPassword) {
      toast({
        title: "Enter Password",
        description: "Please enter your master password.",
        variant: "destructive",
      });
      return;
    }
    unlockVaultMutation.mutate(masterPassword);
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-slate-900/80 border-purple-500/30 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Connect Wallet
            </CardTitle>
            <CardDescription className="text-slate-300">
              Connect your wallet to access your OMNIVERSE SYNDICATE vault
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (vaultLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-purple-400 text-xl">Loading vault...</div>
      </div>
    );
  }

  // Vault Creation Screen
  if (!vault) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-slate-900/80 border-purple-500/30 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Create Your Vault
            </CardTitle>
            <CardDescription className="text-slate-300">
              Establish your impenetrable OMNIVERSE SYNDICATE vault
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-purple-300 flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Master Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="bg-slate-800/50 border-purple-500/30 text-white pr-10"
                  placeholder="Minimum 8 characters"
                  data-testid="input-master-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                This password protects all your vault assets. Keep it secure!
              </p>
            </div>

            <div className="bg-purple-950/30 border border-purple-500/20 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-purple-300">
                <Zap className="w-4 h-4" />
                <span className="font-semibold">SUPERMAN Security Level</span>
              </div>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>✓ Military-grade encryption</li>
                <li>✓ Auto-lockout after 3 failed attempts</li>
                <li>✓ Complete transaction audit logging</li>
                <li>✓ Multi-chain asset tracking</li>
              </ul>
            </div>

            <Button
              onClick={handleCreateVault}
              disabled={createVaultMutation.isPending || masterPassword.length < 8}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6"
              data-testid="button-create-vault"
            >
              <Shield className="w-5 h-5 mr-2" />
              {createVaultMutation.isPending ? "Creating Vault..." : "Create Vault"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vault Unlock Screen
  if (!isUnlocked && vault.isLocked === 'true') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-slate-900/80 border-red-500/30 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-red-400">
              Vault Locked
            </CardTitle>
            <CardDescription className="text-slate-300">
              {vault.lockoutUntil ? `Locked until ${new Date(vault.lockoutUntil).toLocaleString()}` : 'Multiple failed attempts detected'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-950/30 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-slate-300">
                Your vault has been locked for security. Please wait until the lockout period expires.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vault Unlock Screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-slate-900/80 border-purple-500/30 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Lock className="w-12 h-12 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Unlock Vault
            </CardTitle>
            <CardDescription className="text-slate-300">
              {vault.vaultName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-purple-950/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-400">{vault.accessCount}</div>
                <div className="text-xs text-slate-400">Accesses</div>
              </div>
              <div className="bg-purple-950/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-400">{vault.failedAttempts}</div>
                <div className="text-xs text-slate-400">Failed Attempts</div>
              </div>
              <div className="bg-purple-950/30 rounded-lg p-3">
                <Badge variant="outline" className="border-green-500 text-green-500">
                  {vault.securityLevel}
                </Badge>
                <div className="text-xs text-slate-400 mt-1">Security</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unlock-password" className="text-purple-300 flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Master Password
              </Label>
              <div className="relative">
                <Input
                  id="unlock-password"
                  type={showPassword ? "text" : "password"}
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="bg-slate-800/50 border-purple-500/30 text-white pr-10"
                  placeholder="Enter your master password"
                  data-testid="input-unlock-password"
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlockVault()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleUnlockVault}
              disabled={unlockVaultMutation.isPending || !masterPassword}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6"
              data-testid="button-unlock-vault"
            >
              <Unlock className="w-5 h-5 mr-2" />
              {unlockVaultMutation.isPending ? "Unlocking..." : "Unlock Vault"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Vault Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              OMNIVERSE SYNDICATE
            </h1>
            <p className="text-slate-400 mt-1">Personal Vault • {vault.vaultName}</p>
          </div>
          <Badge variant="outline" className="border-green-500 text-green-500 px-4 py-2">
            <Check className="w-4 h-4 mr-2" />
            Unlocked
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/80 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Balance</p>
                  <p className="text-2xl font-bold text-white">${vault.totalBalance}</p>
                </div>
                <Database className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Assets</p>
                  <p className="text-2xl font-bold text-white">{assets.length}</p>
                </div>
                <Activity className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Transactions</p>
                  <p className="text-2xl font-bold text-white">{transactions.length}</p>
                </div>
                <Zap className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Security Level</p>
                  <p className="text-2xl font-bold text-white">{vault.securityLevel}</p>
                </div>
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="assets" className="space-y-4">
          <TabsList className="bg-slate-900/80 border border-purple-500/30">
            <TabsTrigger value="assets" data-testid="tab-assets">Assets</TabsTrigger>
            <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">Security Logs</TabsTrigger>
            <TabsTrigger value="backup" data-testid="tab-backup">Backups</TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="space-y-4">
            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">Vault Assets</CardTitle>
              </CardHeader>
              <CardContent>
                {assets.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No assets in vault yet</p>
                ) : (
                  <div className="space-y-3">
                    {assets.map((asset: any) => (
                      <div key={asset.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <span className="text-lg">{asset.tokenSymbol.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-white">{asset.tokenName}</div>
                            <div className="text-sm text-slate-400">{asset.chain}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-white">{asset.balance} {asset.tokenSymbol}</div>
                          <div className="text-sm text-slate-400">${asset.usdValue}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx: any) => (
                      <div key={tx.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-4">
                        <div>
                          <div className="font-semibold text-white capitalize">{tx.type}</div>
                          <div className="text-sm text-slate-400">{new Date(tx.timestamp).toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-white">{tx.amount} {tx.currency}</div>
                          <Badge variant="outline" className={`text-xs ${
                            tx.status === 'completed' ? 'border-green-500 text-green-500' :
                            tx.status === 'pending' ? 'border-yellow-500 text-yellow-500' :
                            'border-red-500 text-red-500'
                          }`}>
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">Security Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {securityLogs.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No security logs</p>
                ) : (
                  <div className="space-y-3">
                    {securityLogs.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          {log.success === 'true' ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : (
                            <X className="w-5 h-5 text-red-500" />
                          )}
                          <div>
                            <div className="font-semibold text-white">{log.eventType.replace('_', ' ').toUpperCase()}</div>
                            <div className="text-sm text-slate-400">{log.actionTaken}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-400">{new Date(log.timestamp).toLocaleString()}</div>
                          <Badge variant="outline" className={`text-xs mt-1 ${
                            log.severity === 'critical' ? 'border-red-500 text-red-500' :
                            log.severity === 'warning' ? 'border-yellow-500 text-yellow-500' :
                            'border-green-500 text-green-500'
                          }`}>
                            {log.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup">
            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">Vault Backups</CardTitle>
                <CardDescription className="text-slate-400">
                  Encrypted backups of your vault for emergency recovery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Archive className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <p className="text-slate-400">Backup system initialized</p>
                  <p className="text-sm text-slate-500 mt-2">Auto-backup every 24 hours</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
