import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Zap, Rocket } from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import SEO from "@/components/seo";

export default function EmpirePassPage() {
  const { account } = useWeb3();
  const { toast } = useToast();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["/api/subscriptions/plans"],
  });

  const { data: userSubscriptions } = useQuery({
    queryKey: ["/api/subscriptions/wallet", account],
    enabled: !!account,
  });

  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      return apiRequest("/api/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          planId,
          customerWallet: account,
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/wallet", account] });
      toast({
        title: "🎉 Subscription Activated!",
        description: "Welcome to your Empire Pass! Enjoy your benefits.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Subscription Failed",
        description: error.message || "Could not activate subscription",
      });
    },
  });

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free': return <Sparkles className="h-5 w-5" />;
      case 'ascend': return <Zap className="h-5 w-5" />;
      case 'empire': return <Crown className="h-5 w-5" />;
      case 'whale': return <Rocket className="h-5 w-5" />;
      default: return <Sparkles className="h-5 w-5" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-slate-500/20 border-slate-500/30';
      case 'ascend': return 'bg-blue-500/20 border-blue-500/30';
      case 'empire': return 'bg-purple-500/20 border-purple-500/30';
      case 'whale': return 'bg-gold-500/20 border-yellow-500/30';
      default: return 'bg-slate-500/20';
    }
  };

  const isSubscribed = (planId: string) => {
    return userSubscriptions?.some((sub: any) => sub.planId === planId && sub.status === 'active');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">Loading Empire Pass...</div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Empire Pass - Premium Subscriptions | Chaos Crypto Casino"
        description="Unlock exclusive benefits with Empire Pass. Choose from Ascend, Empire, or Whale tiers for reduced fees, AI trading bot access, and revenue sharing."
        canonicalUrl="/empire-pass"
      />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 mb-4">
            <Crown className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-semibold text-purple-400">EMPIRE PASS</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Unlock Your Empire
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose your path to greatness. Reduce fees, access AI trading bots, and earn revenue share.
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans?.map((plan: any) => {
            const metadata = plan.metadata || {};
            const tier = metadata.tier || 'free';
            const subscribed = isSubscribed(plan.id);

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden ${getTierColor(tier)} ${
                  tier === 'empire' ? 'ring-2 ring-purple-500' : ''
                }`}
                data-testid={`plan-${tier}`}
              >
                {tier === 'empire' && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-purple-500">
                      POPULAR
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {getTierIcon(tier)}
                    <CardTitle>{plan.name}</CardTitle>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">
                        ${parseFloat(plan.price).toFixed(plan.price === '0' ? 0 : 2)}
                      </span>
                      {plan.price !== '0' && (
                        <span className="text-muted-foreground">/month</span>
                      )}
                    </div>
                    {metadata.priceETH && (
                      <p className="text-sm text-muted-foreground mt-1">
                        ~{metadata.priceETH} ETH
                      </p>
                    )}
                  </div>

                  {/* Key Metrics */}
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Trading Fee</span>
                      <span className="font-semibold text-green-400">{metadata.tradingFee}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment Fee</span>
                      <span className="font-semibold text-green-400">{metadata.paymentFee}%</span>
                    </div>
                    {metadata.features?.revenueShare && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Revenue Share</span>
                        <span className="font-semibold text-purple-400">{metadata.features.revenueShare}%</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {plan.features?.slice(0, 6).map((feature: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    {plan.features?.length > 6 && (
                      <p className="text-sm text-muted-foreground">
                        +{plan.features.length - 6} more features
                      </p>
                    )}
                  </div>
                </CardContent>

                <CardFooter>
                  {!account ? (
                    <Button className="w-full" variant="outline" disabled data-testid={`button-connect-${tier}`}>
                      Connect Wallet
                    </Button>
                  ) : subscribed ? (
                    <Button className="w-full" variant="outline" disabled data-testid={`button-active-${tier}`}>
                      Active
                    </Button>
                  ) : plan.price === '0' ? (
                    <Button className="w-full" variant="outline" disabled data-testid={`button-free-${tier}`}>
                      Free Tier
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => subscribeMutation.mutate(plan.id)}
                      disabled={subscribeMutation.isPending}
                      data-testid={`button-subscribe-${tier}`}
                    >
                      {subscribeMutation.isPending ? 'Processing...' : `Subscribe ${plan.trialDays > 0 ? `(${plan.trialDays}d free)` : ''}`}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-400" />
                Reduced Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Save up to 80% on trading and payment fees with higher tiers. More you stake, less you pay.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-blue-400" />
                Exclusive NFTs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Receive exclusive Relic NFTs with real utility. Higher tiers get legendary and mythic relics.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-pink-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-pink-400" />
                Revenue Share
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Empire and Whale members earn passive income through our revenue share program.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
