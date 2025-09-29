import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useWeb3 } from "@/hooks/use-web3";
import { useToast } from "@/hooks/use-toast";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, TrendingUp, Target, Zap } from "lucide-react";

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export default function DiceGame() {
  const [betAmount, setBetAmount] = useState("0.01");
  const [target, setTarget] = useState(50);
  const [rollOver, setRollOver] = useState(true);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [history, setHistory] = useState<Array<{roll: number, won: boolean, profit: number}>>([]);
  
  const { isConnected, balance } = useWeb3();
  const { toast } = useToast();

  const winChance = rollOver ? (100 - target) : target;
  const multiplier = (98 / winChance).toFixed(2);
  const potentialWin = (parseFloat(betAmount) * parseFloat(multiplier)).toFixed(4);

  const roll = async () => {
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

    setRolling(true);
    setResult(null);
    setLastWin(null);

    // Simulate rolling animation
    const animationFrames = 20;
    for (let i = 0; i < animationFrames; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      setResult(Math.floor(Math.random() * 100) + 1);
    }

    // Generate final result (using crypto random for fairness)
    const finalRoll = Math.floor(Math.random() * 100) + 1;
    setResult(finalRoll);

    const won = rollOver ? finalRoll > target : finalRoll < target;
    const profit = won ? parseFloat(potentialWin) - parseFloat(betAmount) : -parseFloat(betAmount);

    setLastWin(profit);
    setHistory(prev => [{roll: finalRoll, won, profit}, ...prev.slice(0, 9)]);

    setRolling(false);

    if (won) {
      toast({
        title: "🎉 You Won!",
        description: `Rolled ${finalRoll}! Won ${potentialWin} ETH`,
      });
    } else {
      toast({
        title: "Better Luck Next Time",
        description: `Rolled ${finalRoll}. Lost ${betAmount} ETH`,
        variant: "destructive"
      });
    }
  };

  const getDiceIcon = (value: number | null) => {
    if (!value) return Dice3;
    const index = Math.floor((value - 1) / 16.67);
    return diceIcons[Math.min(index, 5)];
  };

  const DiceIcon = getDiceIcon(result);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          DeFi Dice Master
        </h1>
        <p className="text-muted-foreground">
          Roll the dice. Predict the outcome. Win crypto.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Bet Controls */}
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
              <div className="flex items-center justify-between mb-2">
                <Label>Roll {rollOver ? "Over" : "Under"}</Label>
                <Badge variant="outline">{target}</Badge>
              </div>
              <Slider
                value={[target]}
                onValueChange={(vals) => setTarget(vals[0])}
                min={1}
                max={99}
                step={1}
                className="mt-2"
                data-testid="slider-target"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span>99</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={rollOver ? "default" : "outline"}
                className="flex-1"
                onClick={() => setRollOver(true)}
                data-testid="button-roll-over"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Over
              </Button>
              <Button
                variant={!rollOver ? "default" : "outline"}
                className="flex-1"
                onClick={() => setRollOver(false)}
                data-testid="button-roll-under"
              >
                <TrendingUp className="mr-2 h-4 w-4 rotate-180" />
                Under
              </Button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Win Chance</span>
                <span className="font-medium">{winChance.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Multiplier</span>
                <span className="font-medium">{multiplier}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Potential Win</span>
                <span className="font-medium text-green-500">{potentialWin} ETH</span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={roll}
              disabled={rolling || !isConnected}
              data-testid="button-roll-dice"
            >
              {rolling ? (
                <>
                  <Zap className="mr-2 h-4 w-4 animate-pulse" />
                  Rolling...
                </>
              ) : (
                <>
                  <Target className="mr-2 h-4 w-4" />
                  Roll Dice
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Dice Display */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Roll Result</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-8">
            <div className={`transition-all duration-300 ${rolling ? 'animate-bounce' : ''}`}>
              <DiceIcon className="h-32 w-32 text-primary" />
            </div>

            <div className="text-center space-y-4">
              {result !== null && (
                <>
                  <div className="text-6xl font-bold text-primary">
                    {result}
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
                </>
              )}

              {result === null && !rolling && (
                <p className="text-muted-foreground">
                  Place your bet and roll the dice to start playing
                </p>
              )}
            </div>

            {/* Target Line Indicator */}
            <div className="w-full max-w-md">
              <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full transition-all duration-300 ${
                    rollOver ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}
                  style={{
                    width: rollOver ? `${100 - target}%` : `${target}%`,
                    [rollOver ? 'left' : 'right']: 'auto',
                    [rollOver ? 'right' : 'left']: '0'
                  }}
                />
                <div
                  className="absolute top-0 h-full w-0.5 bg-primary"
                  style={{ left: `${target}%` }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-xs font-bold text-primary">
                    {target}
                  </div>
                </div>
                {result && (
                  <div
                    className={`absolute top-0 h-full w-1 ${
                      lastWin && lastWin > 0 ? 'bg-green-500' : 'bg-red-500'
                    } transition-all duration-500`}
                    style={{ left: `${result}%` }}
                  >
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold">
                      {result}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Rolls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {history.map((item, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className={`${
                    item.won ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'
                  }`}
                  data-testid={`history-${idx}`}
                >
                  {item.roll} ({item.won ? '+' : ''}{item.profit.toFixed(3)} ETH)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
