import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Bot, Zap, TrendingUp, Shield, CheckCircle2, Sparkles, DollarSign } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function SentinelBot() {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['/api/bot/plans'],
  });

  const { data: strategies = [], isLoading: strategiesLoading } = useQuery({
    queryKey: ['/api/bot/strategies'],
  });

  const subscribeMutation = useMutation({
    mutationFn: async (planType: string) => {
      const mockUserId = 'user_' + Math.random().toString(36).substr(2, 9);
      const plan = plans.find((p: any) => p.id === planType);
      
      return await apiRequest('/api/bot/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          userId: mockUserId,
          planType,
          price: plan.price,
          currency: 'USD'
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Subscription Activated!",
        description: "Your Sentinel Bot subscription is now active. Configure your bot to start trading.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bot/subscription'] });
    },
    onError: () => {
      toast({
        title: "Subscription Failed",
        description: "Failed to activate subscription. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubscribe = (planId: string) => {
    setSelectedPlan(planId);
    subscribeMutation.mutate(planId);
  };

  if (plansLoading || strategiesLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading Sentinel Bot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Trading</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              Sentinel Auto Trading Bot
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              The first and best crypto trading bot of the century. Automate your Coinbase trading with advanced AI signals and professional strategies.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm">24/7 Automated Trading</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm">Advanced Risk Management</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm">Real-Time Performance Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <Tabs defaultValue="pricing" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="pricing" data-testid="tab-pricing">Pricing Plans</TabsTrigger>
            <TabsTrigger value="strategies" data-testid="tab-strategies">Trading Strategies</TabsTrigger>
          </TabsList>

          {/* Pricing Plans */}
          <TabsContent value="pricing" className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Choose Your Plan</h2>
              <p className="text-muted-foreground">Start trading automatically with the power of AI</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan: any) => (
                <Card 
                  key={plan.id}
                  className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
                  data-testid={`plan-card-${plan.id}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {plan.name}
                      <Bot className="h-6 w-6 text-primary" />
                    </CardTitle>
                    <CardDescription>
                      <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className="w-full"
                      size="lg"
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={subscribeMutation.isPending && selectedPlan === plan.id}
                      data-testid={`button-subscribe-${plan.id}`}
                    >
                      {subscribeMutation.isPending && selectedPlan === plan.id ? (
                        "Processing..."
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Get Started
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Trading Strategies */}
          <TabsContent value="strategies" className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Powerful Trading Strategies</h2>
              <p className="text-muted-foreground">Choose from proven strategies or combine multiple for maximum profits</p>
            </div>

            {strategies.length === 0 ? (
              <Card className="p-12">
                <div className="text-center space-y-4">
                  <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Strategies Coming Soon</h3>
                    <p className="text-muted-foreground">
                      Our team is preparing advanced trading strategies. Subscribe now to get early access!
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {strategies.map((strategy: any) => (
                  <Card key={strategy.id} data-testid={`strategy-card-${strategy.strategyType}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-3xl">{strategy.icon}</div>
                          <div>
                            <CardTitle>{strategy.name}</CardTitle>
                            <Badge variant="outline" className="mt-1">
                              {strategy.riskLevel} Risk
                            </Badge>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {strategy.expectedReturn}% Expected
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{strategy.description}</p>
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>Min: ${strategy.minInvestment}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Shield className="h-4 w-4 text-green-500" />
                          <span>Auto Stop-Loss</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Features Section */}
        <section className="mt-20 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Why Sentinel Bot?</h2>
            <p className="text-muted-foreground">The most advanced crypto trading automation on the market</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Bot className="h-10 w-10 text-primary mb-2" />
                <CardTitle>AI-Powered Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Advanced machine learning algorithms analyze market data 24/7 to identify profitable trading opportunities.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Risk Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Automatic stop-loss and take-profit orders protect your capital while maximizing gains.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Real-Time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track every trade, monitor performance metrics, and optimize your strategies with detailed analytics.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
