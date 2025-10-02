import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  Key, 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Settings,
  Zap
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

const configSchema = z.object({
  coinbaseApiKey: z.string().min(1, "API Key is required"),
  coinbaseApiSecret: z.string().min(1, "API Secret is required"),
  coinbasePassphrase: z.string().min(1, "Passphrase is required"),
  maxDailyTrades: z.number().min(1).max(100),
  maxPositionSize: z.number().min(100).max(100000),
  stopLossPercentage: z.number().min(1).max(50),
  takeProfitPercentage: z.number().min(1).max(100),
  riskLevel: z.enum(['conservative', 'moderate', 'aggressive']),
  autoRestart: z.boolean(),
  enableNotifications: z.boolean(),
});

type ConfigFormData = z.infer<typeof configSchema>;

export default function BotConfig() {
  const { toast } = useToast();
  const [mockUserId] = useState('user_demo');
  const [showApiKeys, setShowApiKeys] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ['/api/bot/config', mockUserId],
  });

  const { data: strategies = [] } = useQuery({
    queryKey: ['/api/bot/strategies'],
  });

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      coinbaseApiKey: (config as any)?.coinbaseApiKey || '',
      coinbaseApiSecret: (config as any)?.coinbaseApiSecret || '',
      coinbasePassphrase: (config as any)?.coinbasePassphrase || '',
      maxDailyTrades: (config as any)?.maxDailyTrades || 20,
      maxPositionSize: (config as any)?.maxPositionSize || 5000,
      stopLossPercentage: (config as any)?.stopLossPercentage || 5,
      takeProfitPercentage: (config as any)?.takeProfitPercentage || 10,
      riskLevel: (config as any)?.riskLevel || 'moderate',
      autoRestart: (config as any)?.autoRestart || false,
      enableNotifications: (config as any)?.enableNotifications || true,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ConfigFormData) => {
      return await apiRequest('POST', '/api/bot/config', {
        userId: mockUserId,
        ...data
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuration Saved!",
        description: "Your Sentinel Bot configuration has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bot/config'] });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ConfigFormData) => {
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <Settings className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading Configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-3">
                <Settings className="h-8 w-8 text-primary" />
                <span>Bot Configuration</span>
              </h1>
              <p className="text-muted-foreground mt-1">Configure your Sentinel Bot trading parameters</p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Bot className="h-4 w-4 mr-2" />
              {config ? 'Configured' : 'Not Configured'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Coinbase API Connection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5 text-primary" />
                  <span>Coinbase Pro API Connection</span>
                </CardTitle>
                <CardDescription>
                  Connect your Coinbase Pro account to enable automated trading. 
                  <a href="https://pro.coinbase.com/profile/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                    Get your API keys here →
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-600 dark:text-yellow-400 mb-1">Security Notice</p>
                    <p className="text-muted-foreground">
                      Your API keys are encrypted and stored securely. Enable only "Trade" permissions when creating your API keys on Coinbase Pro. Never share your API secret.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <Label>Show API Keys</Label>
                  <Switch
                    checked={showApiKeys}
                    onCheckedChange={setShowApiKeys}
                    data-testid="switch-show-api-keys"
                  />
                </div>

                <FormField
                  control={form.control}
                  name="coinbaseApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input 
                          type={showApiKeys ? "text" : "password"}
                          placeholder="Enter your Coinbase Pro API Key"
                          data-testid="input-api-key"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coinbaseApiSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Secret</FormLabel>
                      <FormControl>
                        <Input 
                          type={showApiKeys ? "text" : "password"}
                          placeholder="Enter your Coinbase Pro API Secret"
                          data-testid="input-api-secret"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coinbasePassphrase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passphrase</FormLabel>
                      <FormControl>
                        <Input 
                          type={showApiKeys ? "text" : "password"}
                          placeholder="Enter your Coinbase Pro Passphrase"
                          data-testid="input-passphrase"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Risk Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Risk Management</span>
                </CardTitle>
                <CardDescription>
                  Set your risk parameters and position limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="riskLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-risk-level">
                            <SelectValue placeholder="Select risk level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="conservative">Conservative - Low risk, steady gains</SelectItem>
                          <SelectItem value="moderate">Moderate - Balanced approach</SelectItem>
                          <SelectItem value="aggressive">Aggressive - High risk, high reward</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="maxPositionSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Position Size: ${field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={100}
                          max={100000}
                          step={100}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          data-testid="slider-position-size"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum amount to invest in a single trade
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxDailyTrades"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Daily Trades: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={100}
                          step={1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          data-testid="slider-daily-trades"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of trades per day
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="stopLossPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stop Loss: {field.value}%</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={50}
                          step={0.5}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          data-testid="slider-stop-loss"
                        />
                      </FormControl>
                      <FormDescription>
                        Automatically close losing positions at this percentage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="takeProfitPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Take Profit: {field.value}%</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={100}
                          step={1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          data-testid="slider-take-profit"
                        />
                      </FormControl>
                      <FormDescription>
                        Automatically close winning positions at this percentage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Automation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <span>Automation Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure automation and notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="autoRestart"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto-Restart Strategy</FormLabel>
                        <FormDescription>
                          Automatically restart strategies after they complete
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-auto-restart"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enableNotifications"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Trade Notifications</FormLabel>
                        <FormDescription>
                          Get notified when trades are executed
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-notifications"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span>All settings are encrypted and secured</span>
              </div>
              <Button 
                type="submit" 
                size="lg"
                disabled={saveMutation.isPending}
                data-testid="button-save-config"
              >
                {saveMutation.isPending ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
