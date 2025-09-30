import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useWeb3 } from "@/hooks/use-web3";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Rocket, TrendingUp, Users, DollarSign, Clock, CheckCircle, Zap, Target, Trophy } from "lucide-react";
import { format } from "date-fns";

interface LaunchProject {
  id: string;
  name: string;
  symbol: string;
  description: string;
  website?: string;
  twitter?: string;
  logo?: string;
  creator: string;
  tokenSupply: string;
  hardCap: string;
  softCap: string;
  price: string;
  raised: string;
  participants: number;
  startDate: string;
  endDate: string;
  vestingPeriod: number;
  vestingPercent: string;
  status: 'upcoming' | 'active' | 'ended' | 'cancelled';
  category: string;
}

interface Investment {
  id: string;
  projectId: string;
  investor: string;
  amount: string;
  tokensAllocated: string;
  claimed: string;
  status: 'pending' | 'vesting' | 'completed';
  investmentDate: string;
}

export default function TokenLaunchpadPage() {
  const { account } = useWeb3();
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<LaunchProject | null>(null);
  const [investAmount, setInvestAmount] = useState("");
  const [newLaunchOpen, setNewLaunchOpen] = useState(false);
  
  // New launch form
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [tokenSupply, setTokenSupply] = useState("");
  const [hardCap, setHardCap] = useState("");
  const [price, setPrice] = useState("");

  const { data: projects } = useQuery<LaunchProject[]>({
    queryKey: ['/api/launchpad/projects'],
  });

  const { data: myInvestments } = useQuery<Investment[]>({
    queryKey: ['/api/launchpad/investments', account],
    enabled: !!account,
  });

  const createLaunchMutation = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Connect wallet to create launch");
      return apiRequest('POST', '/api/launchpad/create', {
        creator: account,
        name,
        symbol,
        description,
        tokenSupply,
        hardCap,
        price,
      });
    },
    onSuccess: () => {
      toast({
        title: "Launch Created!",
        description: "Your token launch is now live",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/launchpad/projects'] });
      setNewLaunchOpen(false);
      setName("");
      setSymbol("");
      setDescription("");
    },
    onError: (error: Error) => {
      toast({
        title: "Launch Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const investMutation = useMutation({
    mutationFn: async ({ projectId, amount }: { projectId: string; amount: string }) => {
      if (!account) throw new Error("Connect wallet to invest");
      return apiRequest('POST', '/api/launchpad/invest', {
        projectId,
        investor: account,
        amount,
      });
    },
    onSuccess: () => {
      toast({
        title: "Investment Successful!",
        description: "Your tokens will be vested according to the schedule",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/launchpad/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/launchpad/investments', account] });
      setSelectedProject(null);
      setInvestAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Investment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const claimMutation = useMutation({
    mutationFn: async (investmentId: string) => {
      return apiRequest('POST', '/api/launchpad/claim', {
        investmentId,
        investor: account,
      });
    },
    onSuccess: () => {
      toast({
        title: "Tokens Claimed!",
        description: "Tokens have been sent to your wallet",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/launchpad/investments', account] });
    },
    onError: (error: Error) => {
      toast({
        title: "Claim Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500';
      case 'active': return 'bg-green-500';
      case 'ended': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      case 'vesting': return 'bg-purple-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateProgress = (raised: string, hardCap: string) => {
    return (parseFloat(raised) / parseFloat(hardCap)) * 100;
  };

  const activeProjects = projects?.filter(p => p.status === 'active') || [];
  const upcomingProjects = projects?.filter(p => p.status === 'upcoming') || [];
  
  const totalInvested = myInvestments?.reduce((sum, inv) => sum + parseFloat(inv.amount), 0) || 0;
  const totalAllocated = myInvestments?.reduce((sum, inv) => sum + parseFloat(inv.tokensAllocated), 0) || 0;
  const totalClaimed = myInvestments?.reduce((sum, inv) => sum + parseFloat(inv.claimed), 0) || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Rocket className="h-10 w-10 text-purple-500" />
          Token Launchpad
        </h1>
        <p className="text-muted-foreground">Invest in next-generation blockchain projects</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <p className="text-3xl font-bold" data-testid="text-total-invested">
                  ${totalInvested.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tokens Allocated</p>
                <p className="text-3xl font-bold" data-testid="text-total-allocated">
                  {totalAllocated.toLocaleString()}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tokens Claimed</p>
                <p className="text-3xl font-bold text-purple-600">
                  {totalClaimed.toLocaleString()}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Launches</p>
                <p className="text-3xl font-bold">{activeProjects.length}</p>
              </div>
              <Rocket className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {!account ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Rocket className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Token Launchpad</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to invest in upcoming projects
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex gap-4 mb-6">
            <Dialog open={newLaunchOpen} onOpenChange={setNewLaunchOpen}>
              <DialogTrigger asChild>
                <Button size="lg" data-testid="button-create-launch">
                  <Rocket className="h-4 w-4 mr-2" />
                  Create Token Launch
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Launch Your Token</DialogTitle>
                  <DialogDescription>
                    Raise funds for your project through a fair token sale
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="token-name">Token Name</Label>
                      <Input
                        id="token-name"
                        placeholder="My Token"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        data-testid="input-token-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="token-symbol">Symbol</Label>
                      <Input
                        id="token-symbol"
                        placeholder="MTK"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        data-testid="input-token-symbol"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your project..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      data-testid="input-description"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supply">Total Supply</Label>
                      <Input
                        id="supply"
                        type="number"
                        placeholder="1000000"
                        value={tokenSupply}
                        onChange={(e) => setTokenSupply(e.target.value)}
                        data-testid="input-supply"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hard-cap">Hard Cap ($)</Label>
                      <Input
                        id="hard-cap"
                        type="number"
                        placeholder="100000"
                        value={hardCap}
                        onChange={(e) => setHardCap(e.target.value)}
                        data-testid="input-hardcap"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price per Token</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.10"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        data-testid="input-price"
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => createLaunchMutation.mutate()}
                    disabled={!name || !symbol || !tokenSupply || createLaunchMutation.isPending}
                    data-testid="button-submit-launch"
                  >
                    {createLaunchMutation.isPending ? 'Creating...' : 'Create Launch'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active ({activeProjects.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({upcomingProjects.length})</TabsTrigger>
              <TabsTrigger value="investments">My Investments ({myInvestments?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeProjects.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Rocket className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-xl font-semibold mb-2">No Active Launches</h3>
                    <p className="text-muted-foreground">Check back soon for new opportunities</p>
                  </CardContent>
                </Card>
              ) : (
                activeProjects.map(project => {
                  const progress = calculateProgress(project.raised, project.hardCap);
                  const tokensForSale = parseFloat(project.tokenSupply) * 0.3;

                  return (
                    <Card key={project.id} data-testid={`project-${project.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-2xl">{project.name} (${project.symbol})</CardTitle>
                              <Badge className={getStatusColor(project.status)}>
                                {project.status}
                              </Badge>
                              <Badge variant="secondary">{project.category}</Badge>
                            </div>
                            <CardDescription>{project.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Price</p>
                            <p className="text-lg font-bold">${project.price}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Hard Cap</p>
                            <p className="text-lg font-bold">${parseFloat(project.hardCap).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Raised</p>
                            <p className="text-lg font-bold text-green-600">${parseFloat(project.raised).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Participants</p>
                            <p className="text-lg font-bold">{project.participants}</p>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Fundraising Progress</span>
                            <span>{progress.toFixed(1)}%</span>
                          </div>
                          <Progress value={progress} className="h-3" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                          <div>
                            <p className="text-sm text-muted-foreground">Ends In</p>
                            <p className="font-semibold">
                              {Math.max(0, Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Vesting</p>
                            <p className="font-semibold">{project.vestingPeriod} days ({project.vestingPercent}% TGE)</p>
                          </div>
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="w-full" onClick={() => setSelectedProject(project)} data-testid={`button-invest-${project.id}`}>
                              <Zap className="h-4 w-4 mr-2" />
                              Invest Now
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Invest in {project.name}</DialogTitle>
                              <DialogDescription>
                                Purchase {project.symbol} tokens at ${project.price} each
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 bg-muted rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Token Price:</span>
                                  <span className="font-semibold">${project.price}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">TGE Unlock:</span>
                                  <span className="font-semibold">{project.vestingPercent}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Vesting Period:</span>
                                  <span className="font-semibold">{project.vestingPeriod} days</span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="invest-amount">Investment Amount (USD)</Label>
                                <Input
                                  id="invest-amount"
                                  type="number"
                                  placeholder="1000"
                                  value={investAmount}
                                  onChange={(e) => setInvestAmount(e.target.value)}
                                  data-testid="input-invest-amount"
                                />
                              </div>

                              {investAmount && parseFloat(investAmount) > 0 && (
                                <div className="p-4 bg-muted rounded-lg space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Investment:</span>
                                    <span className="font-semibold">${investAmount}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Tokens Allocated:</span>
                                    <span className="font-semibold">
                                      {(parseFloat(investAmount) / parseFloat(project.price)).toLocaleString()} {project.symbol}
                                    </span>
                                  </div>
                                  <div className="flex justify-between border-t pt-2">
                                    <span className="font-semibold">Unlocked at TGE:</span>
                                    <span className="font-bold text-lg text-green-600">
                                      {((parseFloat(investAmount) / parseFloat(project.price)) * parseFloat(project.vestingPercent) / 100).toFixed(0)} {project.symbol}
                                    </span>
                                  </div>
                                </div>
                              )}

                              <Button
                                className="w-full"
                                onClick={() => investMutation.mutate({ projectId: project.id, amount: investAmount })}
                                disabled={!investAmount || parseFloat(investAmount) === 0 || investMutation.isPending}
                                data-testid="button-confirm-invest"
                              >
                                {investMutation.isPending ? 'Processing...' : 'Confirm Investment'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingProjects.map(project => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{project.name} (${project.symbol})</CardTitle>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    <CardDescription>{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Starts In</p>
                        <p className="font-semibold">
                          {Math.max(0, Math.ceil((new Date(project.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Hard Cap</p>
                        <p className="font-semibold">${parseFloat(project.hardCap).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="font-semibold">${project.price}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="investments" className="space-y-4">
              {!myInvestments || myInvestments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-xl font-semibold mb-2">No Investments Yet</h3>
                    <p className="text-muted-foreground mb-6">Start investing in promising projects</p>
                    <Button onClick={() => (document.querySelector('[value="active"]') as HTMLElement)?.click()}>
                      View Active Launches
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                myInvestments.map(investment => {
                  const project = projects?.find(p => p.id === investment.projectId);
                  const claimable = parseFloat(investment.tokensAllocated) - parseFloat(investment.claimed);

                  return (
                    <Card key={investment.id} data-testid={`investment-${investment.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{project?.name} (${project?.symbol})</h3>
                            <p className="text-sm text-muted-foreground">
                              Invested on {format(new Date(investment.investmentDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Badge className={getStatusColor(investment.status)}>
                            {investment.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Invested</p>
                            <p className="font-semibold">${investment.amount}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Tokens Allocated</p>
                            <p className="font-semibold">{investment.tokensAllocated}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Claimed</p>
                            <p className="font-semibold text-green-600">{investment.claimed}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Claimable</p>
                            <p className="font-semibold text-purple-600">{claimable.toFixed(2)}</p>
                          </div>
                        </div>

                        {claimable > 0 && (
                          <Button
                            className="w-full"
                            onClick={() => claimMutation.mutate(investment.id)}
                            disabled={claimMutation.isPending}
                            data-testid={`button-claim-${investment.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Claim {claimable.toFixed(2)} {project?.symbol}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
