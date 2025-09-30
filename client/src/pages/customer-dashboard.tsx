import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, ShoppingBag, Heart, Star, TrendingUp, DollarSign,
  Gift, CreditCard, Award, Package, Crown
} from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";
import { Link } from "wouter";

export default function CustomerDashboard() {
  const { account, chainId } = useWeb3();

  const { data: loyaltyData } = useQuery<any>({
    queryKey: ['/api/loyalty', account],
    enabled: !!account,
  });

  const { data: subscriptions } = useQuery<any[]>({
    queryKey: ['/api/subscriptions/wallet', account],
    enabled: !!account,
  });

  const { data: wishlistItems } = useQuery<any[]>({
    queryKey: ['/api/wishlists/wallet', account],
    enabled: !!account,
  });

  const { data: orders } = useQuery<any[]>({
    queryKey: ['/api/orders/wallet', account],
    enabled: !!account,
  });

  const { data: tierData } = useQuery<any>({
    queryKey: ['/api/customer-tiers/wallet', account],
    enabled: !!account,
  });

  const { data: giftCards } = useQuery<any[]>({
    queryKey: ['/api/giftcards/wallet', account],
    enabled: !!account,
  });

  const { data: affiliateData } = useQuery<any>({
    queryKey: ['/api/affiliates/wallet', account],
    enabled: !!account,
  });

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Customer Dashboard</h2>
            <p className="text-muted-foreground mb-4">
              Connect your wallet to view your account dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const points = parseInt(loyaltyData?.points || "0");
  const tier = loyaltyData?.tier || "Bronze";
  const activeSubscriptions = subscriptions?.filter(s => s.status === "active").length || 0;
  const totalOrders = orders?.length || 0;
  const wishlistCount = wishlistItems?.length || 0;
  const totalSpent = orders?.reduce((sum, order) => sum + parseFloat(order.totalAmount || "0"), 0) || 0;

  const tierProgress = Math.min((points / 1000) * 100, 100);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your account overview
        </p>
      </div>

      {/* Account Info Card */}
      <Card className="mb-8 border-primary/50">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <User className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </h2>
                <p className="text-sm text-muted-foreground mb-2">
                  Network: {chainId === 1 ? "Ethereum" : chainId === 137 ? "Polygon" : `Chain ${chainId}`}
                </p>
                {tierData && tierData.tier !== "standard" && (
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600">
                    <Crown className="h-3 w-3 mr-1" />
                    {tierData.tier.toUpperCase()} Customer
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Loyalty Tier</p>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {tier}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Loyalty Points"
          value={points.toLocaleString()}
          change={`${tier} Tier`}
          iconColor="bg-green-500/10 text-green-500"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Total Spent"
          value={`$${totalSpent.toFixed(2)}`}
          change={`${totalOrders} orders`}
          iconColor="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          icon={<Package className="h-5 w-5" />}
          label="Active Subscriptions"
          value={activeSubscriptions.toString()}
          change={activeSubscriptions > 0 ? "Active" : "None"}
          iconColor="bg-purple-500/10 text-purple-500"
        />
        <StatCard
          icon={<Heart className="h-5 w-5" />}
          label="Wishlist Items"
          value={wishlistCount.toString()}
          change={wishlistCount > 0 ? "Saved" : "Empty"}
          iconColor="bg-pink-500/10 text-pink-500"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Loyalty Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Loyalty Progress</CardTitle>
              <CardDescription>
                You're {1000 - points} points away from {tier === "Bronze" ? "Silver" : tier === "Silver" ? "Gold" : "Platinum"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{points} / 1000 points</span>
                  <span className="text-muted-foreground">{tierProgress.toFixed(0)}%</span>
                </div>
                <Progress value={tierProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickActionCard
              icon={<ShoppingBag className="h-6 w-6" />}
              title="Shop Products"
              description="Browse our catalog"
              href="/products"
            />
            <QuickActionCard
              icon={<Heart className="h-6 w-6" />}
              title="My Wishlist"
              description={`${wishlistCount} saved items`}
              href="/wishlist"
            />
            <QuickActionCard
              icon={<Package className="h-6 w-6" />}
              title="My Orders"
              description={`${totalOrders} orders`}
              href="/orders"
            />
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gift Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Gift Cards
                </CardTitle>
              </CardHeader>
              <CardContent>
                {giftCards && giftCards.length > 0 ? (
                  <div className="space-y-2">
                    {giftCards.slice(0, 3).map((card) => (
                      <div key={card.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm font-mono">{card.code}</span>
                        <Badge variant="secondary">${card.currentBalance}</Badge>
                      </div>
                    ))}
                    <Link href="/gift-cards">
                      <Button variant="link" className="w-full">View All</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">No gift cards yet</p>
                    <Link href="/gift-cards">
                      <Button size="sm">Purchase Gift Card</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Affiliate Earnings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Affiliate Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {affiliateData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Earned</span>
                      <span className="text-2xl font-bold text-green-500">
                        ${affiliateData.totalEarned}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Pending</span>
                      <span className="font-semibold">${affiliateData.pendingEarnings}</span>
                    </div>
                    <Link href="/affiliate">
                      <Button variant="outline" className="w-full">View Dashboard</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">Not enrolled yet</p>
                    <Link href="/affiliate">
                      <Button size="sm">Join Affiliate Program</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Subscriptions</CardTitle>
              <CardDescription>Manage your recurring subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptions && subscriptions.length > 0 ? (
                <div className="space-y-3">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">Subscription #{sub.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          Status: <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                            {sub.status}
                          </Badge>
                        </p>
                      </div>
                      <Link href="/subscriptions">
                        <Button variant="outline" size="sm">Manage</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No active subscriptions</p>
                  <Link href="/subscriptions">
                    <Button>Browse Plans</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest transactions and actions</CardDescription>
            </CardHeader>
            <CardContent>
              {orders && orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${order.totalAmount}</p>
                        <Badge variant="secondary" className="text-xs">{order.status}</Badge>
                      </div>
                    </div>
                  ))}
                  <Link href="/orders">
                    <Button variant="link" className="w-full">View All Orders</Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  iconColor: string;
}

function StatCard({ icon, label, value, change, iconColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2 rounded-lg ${iconColor}`}>
            {icon}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className="text-3xl font-bold mb-1">{value}</p>
        <p className="text-xs text-muted-foreground">{change}</p>
      </CardContent>
    </Card>
  );
}

interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

function QuickActionCard({ icon, title, description, href }: QuickActionCardProps) {
  return (
    <Link href={href}>
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
