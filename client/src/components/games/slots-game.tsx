import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useWeb3 } from "@/hooks/use-web3";
import { useToast } from "@/hooks/use-toast";
import { Coins, Zap, Crown, TrendingUp, Sparkles } from "lucide-react";

const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '👑'];
const symbolValues = {
  '🍒': 2,
  '🍋': 3,
  '🍊': 5,
  '🍇': 10,
  '💎': 25,
  '7️⃣': 50,
  '👑': 100
};

export default function SlotsGame() {
  const [betAmount, setBetAmount] = useState("0.01");
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState(['🍒', '🍒', '🍒']);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [totalWon, setTotalWon] = useState(0);
  const [totalSpins, setTotalSpins] = useState(0);
  const [history, setHistory] = useState<Array<{reels: string[], won: number}>>([]);
  
  const { isConnected, balance } = useWeb3();
  const { toast } = useToast();

  const spin = async () => {
    if (parseFloat(betAmount) <= 0) {
      toast({
        title: "Invalid Bet",
        description: "Please enter a valid bet amount",
        variant: "destructive"
      });
      return;
    }

    setSpinning(true);
    setLastWin(null);

    // Spinning animation
    const spinDuration = 2000;
    const spinInterval = 100;
    const startTime = Date.now();

    const spinAnimation = setInterval(() => {
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ]);
    }, spinInterval);

    await new Promise(resolve => setTimeout(resolve, spinDuration));
    clearInterval(spinAnimation);

    // Generate final result
    const finalReels = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)]
    ];

    setReels(finalReels);
    setSpinning(false);
    setTotalSpins(prev => prev + 1);

    // Calculate win
    let winAmount = 0;
    
    // Three of a kind
    if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
      const multiplier = symbolValues[finalReels[0] as keyof typeof symbolValues];
      winAmount = parseFloat(betAmount) * multiplier;
    }
    // Two matching symbols
    else if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2]) {
      const matchedSymbol = finalReels[0] === finalReels[1] ? finalReels[0] :
                           finalReels[1] === finalReels[2] ? finalReels[1] : finalReels[0];
      const multiplier = symbolValues[matchedSymbol as keyof typeof symbolValues] * 0.2;
      winAmount = parseFloat(betAmount) * multiplier;
    }

    setLastWin(winAmount);
    if (winAmount > 0) {
      setTotalWon(prev => prev + winAmount);
    }
    
    setHistory(prev => [{reels: finalReels, won: winAmount}, ...prev.slice(0, 9)]);

    if (winAmount > 0) {
      const multiplier = (winAmount / parseFloat(betAmount)).toFixed(2);
      toast({
        title: "🎰 JACKPOT!",
        description: `Won ${winAmount.toFixed(4)} ETH (${multiplier}x)`,
      });
    } else {
      toast({
        title: "Try Again!",
        description: `Lost ${betAmount} ETH - Spin again for a win!`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 bg-clip-text text-transparent">
          🎰 Crypto Slots Deluxe
        </h1>
        <p className="text-muted-foreground">
          Spin the reels and win big with crypto!
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Place Your Bet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Bet Amount (ETH)</Label>
              <Input
                type="number"
                step="0.001"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="0.01"
                className="mt-2"
                data-testid="input-bet-amount"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {isConnected && balance ? `Balance: ${balance} ETH` : 'Demo Mode: Unlimited Balance'}
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={spin}
              disabled={spinning}
              data-testid="button-spin"
            >
              {spinning ? (
                <>
                  <Zap className="mr-2 h-4 w-4 animate-spin" />
                  Spinning...
                </>
              ) : (
                <>
                  <Coins className="mr-2 h-4 w-4" />
                  Spin ({betAmount} ETH)
                </>
              )}
            </Button>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Spins</span>
                <span className="font-medium">{totalSpins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Won</span>
                <span className="font-medium text-green-500">{totalWon.toFixed(4)} ETH</span>
              </div>
              {lastWin !== null && lastWin > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Win</span>
                  <Badge className="bg-green-500 text-white">
                    +{lastWin.toFixed(4)} ETH
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Slot Machine */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Slot Machine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Reels */}
            <div className="flex justify-center gap-4">
              {reels.map((symbol, idx) => (
                <div
                  key={idx}
                  className={`w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl border-4 border-primary/50 flex items-center justify-center text-7xl transition-all duration-300 ${
                    spinning ? 'animate-bounce' : 'scale-100 hover:scale-105'
                  }`}
                  data-testid={`reel-${idx}`}
                >
                  {symbol}
                </div>
              ))}
            </div>

            {/* Win Animation */}
            {lastWin !== null && lastWin > 0 && (
              <div className="text-center space-y-2 animate-pulse">
                <p className="text-3xl font-bold text-green-500">
                  +{lastWin.toFixed(4)} ETH
                </p>
                <Badge className="text-lg bg-yellow-500 text-black">
                  <Crown className="mr-1 h-4 w-4" />
                  WIN!
                </Badge>
              </div>
            )}

            {/* Paytable */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <TrendingUp className="mr-2 h-4 w-4" />
                Paytable (3 Matching Symbols)
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(symbolValues).map(([symbol, multiplier]) => (
                  <div key={symbol} className="flex items-center justify-between">
                    <span className="text-2xl">{symbol} {symbol} {symbol}</span>
                    <Badge variant="outline">{multiplier}x</Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                2 matching symbols pay 20% of the multiplier
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Spins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`history-${idx}`}
                >
                  <div className="flex gap-2 text-3xl">
                    {item.reels.map((symbol, i) => (
                      <span key={i}>{symbol}</span>
                    ))}
                  </div>
                  <Badge variant={item.won > 0 ? "default" : "secondary"}>
                    {item.won > 0 ? `+${item.won.toFixed(4)} ETH` : 'No Win'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
