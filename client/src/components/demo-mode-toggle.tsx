import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { useWeb3 } from "@/hooks/use-web3";
import { FlaskConical, Sparkles } from "lucide-react";

export default function DemoModeToggle() {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <Card className="border-purple-500/30 bg-gradient-to-br from-purple-900/10 to-blue-900/10" data-testid="demo-mode-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-base">Demo Mode</CardTitle>
          </div>
          <Badge variant={isDemoMode ? "default" : "outline"} className={isDemoMode ? "bg-purple-500" : ""}>
            {isDemoMode ? "Active" : "Inactive"}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Explore the platform with sample data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Label htmlFor="demo-mode" className="text-sm cursor-pointer flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            Enable Demo Data
          </Label>
          <Switch
            id="demo-mode"
            checked={isDemoMode}
            onCheckedChange={toggleDemoMode}
            data-testid="switch-demo-mode"
          />
        </div>
        {isDemoMode && (
          <p className="text-xs text-muted-foreground mt-3">
            You're viewing sample data. Connect your wallet to use real features.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
