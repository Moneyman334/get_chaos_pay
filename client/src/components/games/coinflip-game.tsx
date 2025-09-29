import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useWeb3 } from "@/hooks/use-web3";
import { useToast } from "@/hooks/use-toast";
import { Coins, Zap, TrendingUp } from "lucide-react";

export default function CoinFlipGame() {
  const [betAmount, setBetAmount] = useState("0.01");
  const [selectedSide, setSelectedSide] = useState<'heads' | 'tails'>('heads');
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [history, setHistory] = useState<Array<{result: string, won: boolean, profit: number}>>([]);
  
  const { isConnected, balance } = useWeb3();
  const { toast } = useToast();

  const flip = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to play",
        variant: "destructive"
      });
      return;
    }

    if (parseFloat(betAmount) <= 0) {
      toast({
        title: "Invalid Bet",
        description: "Please enter a valid bet amount",
        variant: "destructive"
      });
      return;
    }

    setFlipping(true);
    setResult(null);
    setLastWin(null);

    // Flipping animation
    const flipDuration = 2000;
    const flipInterval = 100;
    
    const flipAnimation = setInterval(() => {
      setResult(Math.random() > 0.5 ? 'heads' : 'tails');
    }, flipInterval);

    await new Promise(resolve => setTimeout(resolve, flipDuration));
    clearInterval(flipAnimation);

    // Final result
    const finalResult = Math.random() > 0.5 ? 'heads' : 'tails';
    setResult(finalResult);
    setFlipping(false);

    const won = finalResult === selectedSide;
    const profit = won ? parseFloat(betAmount) : -parseFloat(betAmount);
    
    setLastWin(profit);
    setHistory(prev => [{result: finalResult, won, profit}, ...prev.slice(0, 9)]);

    if (won) {
      setWins(prev => prev + 1);
      toast({
        title: "🎉 You Won!",
        description: `It's ${finalResult}! Won ${(parseFloat(betAmount) * 2).toFixed(4)} ETH (2x)`,
      });
    } else {
      setLosses(prev => prev + 1);
      toast({
        title: "Better Luck Next Time",
        description: `It's ${finalResult}. Lost ${betAmount} ETH`,
        variant: "destructive"
      });
    }
  };

  const winRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : '0.0';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
          🪙 Crypto Coin Flip
        </h1>
        <p className="text-muted-foreground">
          50/50 odds. Double or nothing. Pure adrenaline.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
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
              {balance && (
                <p className="text-xs text-muted-foreground mt-1">
                  Balance: {balance} ETH
                </p>
              )}
            </div>

            <div>
              <Label className="mb-3 block">Choose Side</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={selectedSide === 'heads' ? "default" : "outline"}
                  className="h-24 flex-col"
                  onClick={() => setSelectedSide('heads')}
                  data-testid="button-heads"
                >
                  <span className="text-3xl mb-2">👑</span>
                  Heads
                </Button>
                <Button
                  variant={selectedSide === 'tails' ? "default" : "outline"}
                  className="h-24 flex-col"
                  onClick={() => setSelectedSide('tails')}
                  data-testid="button-tails"
                >
                  <span className="text-3xl mb-2">🦅</span>
                  Tails
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Win Chance</span>
                <span className="font-medium">50%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Multiplier</span>
                <span className="font-medium">2.00x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Potential Win</span>
                <span className="font-medium text-green-500">
                  {(parseFloat(betAmount) * 2).toFixed(4)} ETH
                </span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={flip}
              disabled={flipping || !isConnected}
              data-testid="button-flip"
            >
              {flipping ? (
                <>
                  <Zap className="mr-2 h-4 w-4 animate-spin" />
                  Flipping...
                </>
              ) : (
                <>
                  <Coins className="mr-2 h-4 w-4" />
                  Flip Coin
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Coin Display */}
        <Card>
          <CardHeader>
            <CardTitle>Coin Result</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
            <div className={`transition-all duration-300 ${flipping ? 'animate-spin' : ''}`}>
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-8xl shadow-2xl">
                {result === 'heads' ? '👑' : result === 'tails' ? '🦅' : '🪙'}
              </div>
            </div>

            {result && !flipping && (
              <div className="text-center space-y-3">
                <div className="text-3xl font-bold text-primary capitalize">
                  {result}!
                </div>
                
                {lastWin !== null && (
                  <Badge
                    className={`text-lg px-4 py-2 ${
                      lastWin > 0
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {lastWin > 0 ? '+' : ''}{lastWin.toFixed(4)} ETH
                  </Badge>
                )}
              </div>
            )}

            {!result && !flipping && (
              <p className="text-muted-foreground text-center">
                Choose your side and flip the coin!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-500">{wins}</div>
            <p className="text-sm text-muted-foreground mt-1">Wins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-red-500">{losses}</div>
            <p className="text-sm text-muted-foreground mt-1">Losses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-primary">{winRate}%</div>
            <p className="text-sm text-muted-foreground mt-1">Win Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Flips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {history.map((item, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className={`text-lg ${
                    item.won ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'
                  }`}
                  data-testid={`history-${idx}`}
                >
                  {item.result === 'heads' ? '👑' : '🦅'} ({item.won ? '+' : ''}{item.profit.toFixed(3)} ETH)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
