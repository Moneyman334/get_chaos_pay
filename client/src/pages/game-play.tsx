import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import DiceGame from "@/components/games/dice-game";
import SlotsGame from "@/components/games/slots-game";
import CoinFlipGame from "@/components/games/coinflip-game";

export default function GamePlayPage() {
  const [location, setLocation] = useLocation();
  const gameType = new URLSearchParams(window.location.search).get('type');

  const renderGame = () => {
    switch (gameType) {
      case 'dice':
        return <DiceGame />;
      case 'slots':
        return <SlotsGame />;
      case 'coinflip':
        return <CoinFlipGame />;
      default:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Game Not Found</h1>
              <Button onClick={() => setLocation('/games')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Games
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/games')}
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Games
          </Button>
        </div>
      </div>
      {renderGame()}
    </div>
  );
}
