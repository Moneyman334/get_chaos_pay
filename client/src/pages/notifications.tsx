import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWeb3 } from "@/hooks/use-web3";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bell, Package, DollarSign, Gift, Award, TrendingUp, CheckCircle, Trash2, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: 'order' | 'payment' | 'achievement' | 'reward' | 'general';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}

export default function NotificationsPage() {
  const { account } = useWeb3();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', account],
    enabled: !!account,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest('PATCH', `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', account] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/notifications/mark-all-read', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', account] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest('DELETE', `/api/notifications/${notificationId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', account] });
    },
  });

  const filteredNotifications = notifications?.filter(n => 
    filter === 'all' ? true : !n.read
  ) || [];

  const unreadCount = notifications?.filter(n => !n.read).length || 0;
  const totalCount = notifications?.length || 0;

  const notificationsByType = {
    order: notifications?.filter(n => n.type === 'order').length || 0,
    payment: notifications?.filter(n => n.type === 'payment').length || 0,
    achievement: notifications?.filter(n => n.type === 'achievement').length || 0,
    reward: notifications?.filter(n => n.type === 'reward').length || 0,
    general: notifications?.filter(n => n.type === 'general').length || 0,
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="h-6 w-6 text-blue-500" />;
      case 'payment':
        return <DollarSign className="h-6 w-6 text-green-500" />;
      case 'achievement':
        return <Award className="h-6 w-6 text-purple-500" />;
      case 'reward':
        return <Gift className="h-6 w-6 text-pink-500" />;
      default:
        return <TrendingUp className="h-6 w-6 text-gray-500" />;
    }
  };

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Connect your wallet to view notifications</CardDescription>
          </CardHeader>
          <CardContent className="py-12 text-center">
            <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-4">
              Please connect your wallet to view your notifications
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Notifications</h1>
        <p className="text-muted-foreground">Stay updated with your blockchain activities</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Bell className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{notificationsByType.order}</p>
              <p className="text-sm text-muted-foreground">Orders</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{notificationsByType.payment}</p>
              <p className="text-sm text-muted-foreground">Payments</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{notificationsByType.achievement}</p>
              <p className="text-sm text-muted-foreground">Achievements</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Gift className="h-8 w-8 mx-auto mb-2 text-pink-500" />
              <p className="text-2xl font-bold">{notificationsByType.reward}</p>
              <p className="text-sm text-muted-foreground">Rewards</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>{unreadCount} unread notifications</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
                data-testid="button-filter"
              >
                <Filter className="h-4 w-4 mr-2" />
                {filter === 'all' ? 'Show Unread' : 'Show All'}
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  data-testid="button-mark-all-read"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark all as read
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-lg text-muted-foreground">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : ''
                  }`}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{notification.title}</h4>
                            {!notification.read && (
                              <Badge variant="default" className="text-xs">New</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                              data-testid={`button-mark-read-${notification.id}`}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotificationMutation.mutate(notification.id)}
                            data-testid={`button-delete-${notification.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      {notification.actionUrl && (
                        <Button
                          variant="link"
                          size="sm"
                          className="mt-2 p-0 h-auto"
                          onClick={() => window.location.href = notification.actionUrl || ''}
                        >
                          View Details →
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
