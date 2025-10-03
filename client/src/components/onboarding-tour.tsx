import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  X, ArrowRight, ArrowLeft, Rocket, Wallet, Bot, TrendingUp, 
  ShoppingCart, Sparkles, CheckCircle 
} from "lucide-react";
import { useLocation } from "wouter";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    path: string;
  };
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to CODEX! 🚀",
    description: "You're about to experience the most comprehensive blockchain platform ever built. With 55+ features, CODEX has everything you need for Web3 success.",
    icon: <Rocket className="h-12 w-12 text-purple-400" />
  },
  {
    title: "Connect Your Wallet",
    description: "Start by connecting your MetaMask wallet. This gives you access to all platform features - trading, staking, NFT creation, and more. No personal info required!",
    icon: <Wallet className="h-12 w-12 text-blue-400" />,
    action: {
      label: "Connect Wallet",
      path: "/wallet"
    }
  },
  {
    title: "AI Trading Bot",
    description: "Our Sentinel Bot trades for you 24/7 with 89% accuracy. Choose from 5 strategies, set your risk level, and let AI handle the rest while you sleep.",
    icon: <Bot className="h-12 w-12 text-green-400" />,
    action: {
      label: "Try Trading Bot",
      path: "/bot-dashboard"
    }
  },
  {
    title: "Earn Passive Income",
    description: "Stake your crypto and earn up to 45% APY with auto-compounding every hour. Your money works for you, completely automated.",
    icon: <TrendingUp className="h-12 w-12 text-yellow-400" />,
    action: {
      label: "Start Staking",
      path: "/yield-farming"
    }
  },
  {
    title: "Create & Sell",
    description: "Launch NFT collections, create tokens, accept crypto payments - all without writing code. Turn your ideas into reality in minutes.",
    icon: <ShoppingCart className="h-12 w-12 text-cyan-400" />,
    action: {
      label: "Explore Creators",
      path: "/nft-creator"
    }
  },
  {
    title: "You're All Set! 🎉",
    description: "That's it! You now know the basics. Explore 50+ more features at your own pace. Need help? Check out our FAQ or contact support anytime.",
    icon: <Sparkles className="h-12 w-12 text-purple-400" />,
    action: {
      label: "Enter CODEX",
      path: "/empire"
    }
  }
];

export default function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem("codex_tour_completed");
    
    if (!hasSeenTour) {
      // Show tour after 1 second delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("codex_tour_completed", "true");
  };

  const handleComplete = () => {
    localStorage.setItem("codex_tour_completed", "true");
    setIsOpen(false);
    
    const action = tourSteps[currentStep].action;
    if (action) {
      setLocation(action.path);
    }
  };

  const handleAction = () => {
    const action = tourSteps[currentStep].action;
    if (action) {
      setIsOpen(false);
      setLocation(action.path);
    }
  };

  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  const currentStepData = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" data-testid="onboarding-tour">
      <Card className="w-full max-w-2xl bg-background/95 backdrop-blur-md border-purple-500/30 shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-sm">
              Step {currentStep + 1} of {tourSteps.length}
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose}
              data-testid="button-close-tour"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Progress value={progress} className="h-2 mt-4" />
          
          <div className="flex justify-center mt-8">
            {currentStepData.icon}
          </div>
          
          <CardTitle className="text-3xl text-center mt-6">
            {currentStepData.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <p className="text-lg text-muted-foreground text-center mb-8">
            {currentStepData.description}
          </p>

          {/* Action Button */}
          {currentStepData.action && !isLastStep && (
            <div className="text-center mb-6">
              <Button 
                variant="outline" 
                onClick={handleAction}
                className="border-purple-500/50 hover:bg-purple-500/10"
                data-testid="button-tour-action"
              >
                {currentStepData.action.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              data-testid="button-previous"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentStep 
                      ? "bg-purple-500 w-8" 
                      : index < currentStep
                      ? "bg-purple-500/50"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>

            {isLastStep ? (
              <Button
                onClick={handleComplete}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                data-testid="button-complete"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Get Started
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                data-testid="button-next"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Skip Tour */}
          <div className="text-center mt-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-skip-tour"
            >
              Skip tour
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
