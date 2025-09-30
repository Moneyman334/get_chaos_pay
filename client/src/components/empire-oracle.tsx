import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWeb3 } from "@/hooks/use-web3";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles, X, Send, Brain, TrendingUp, AlertCircle,
  Zap, Shield, Target, Crown, MessageSquare
} from "lucide-react";

interface Message {
  id: string;
  type: "user" | "oracle";
  text: string;
  timestamp: Date;
  insight?: {
    type: "success" | "warning" | "info";
    icon: any;
  };
}

interface EmpireStats {
  totalPortfolioValue: string;
  totalInvested: string;
  totalEarned: string;
  activePositions: number;
  totalPnL: string;
  pnlPercent: string;
}

export default function EmpireOracle() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "oracle",
      text: "🔮 Greetings, Supreme Commander. I am the Empire Oracle, your mystical advisor across all realms of the blockchain. Ask me anything about your empire, and I shall reveal the cosmic truths...",
      timestamp: new Date(),
      insight: { type: "info", icon: Crown }
    }
  ]);
  const [input, setInput] = useState("");
  const { account } = useWeb3();

  const { data: empireStats } = useQuery<EmpireStats>({
    queryKey: [`/api/supreme/stats?account=${account}`],
    enabled: !!account,
  });

  const generateInsight = (question: string): Message => {
    const lowerQ = question.toLowerCase();
    const pnl = parseFloat(empireStats?.totalPnL || "0");
    const portfolioValue = parseFloat(empireStats?.totalPortfolioValue || "0");
    const activePos = empireStats?.activePositions || 0;

    // Smart responses based on keywords
    if (lowerQ.includes("how") && (lowerQ.includes("doing") || lowerQ.includes("performing"))) {
      const sentiment = pnl >= 0 ? "flourishing" : "facing challenges";
      return {
        id: Date.now().toString(),
        type: "oracle",
        text: `🌟 Your empire is ${sentiment}, Supreme Commander. With a portfolio value of $${empireStats?.totalPortfolioValue || "0"} and ${activePos} active positions, your cosmic energy flows ${pnl >= 0 ? "positively" : "with turbulence"}. Your P&L stands at $${empireStats?.totalPnL || "0"} (${empireStats?.pnlPercent || "0%"}).`,
        timestamp: new Date(),
        insight: { type: pnl >= 0 ? "success" : "warning", icon: TrendingUp }
      };
    }

    if (lowerQ.includes("invest") || lowerQ.includes("stake")) {
      return {
        id: Date.now().toString(),
        type: "oracle",
        text: `💎 The cosmic energies suggest diversifying your power. Consider the Staking Rewards for passive income, Yield Farming for higher APY, or the P2P Lending platform for flexible returns. Your current ${activePos} positions show ${activePos > 5 ? "strong" : "modest"} diversification.`,
        timestamp: new Date(),
        insight: { type: "info", icon: Zap }
      };
    }

    if (lowerQ.includes("trade") || lowerQ.includes("trading")) {
      return {
        id: Date.now().toString(),
        type: "oracle",
        text: `📈 The Oracle sees opportunity in the Trading Zone. Your Social Trading platform allows you to copy successful traders, while Prediction Markets let you bet on future events. The Sentinel Auto Trading Bot can execute strategies while you rest. Choose your weapon wisely, Commander.`,
        timestamp: new Date(),
        insight: { type: "info", icon: Target }
      };
    }

    if (lowerQ.includes("profit") || lowerQ.includes("earn") || lowerQ.includes("money")) {
      return {
        id: Date.now().toString(),
        type: "oracle",
        text: `💰 You have earned $${empireStats?.totalEarned || "0"} across your empire. The highest yields await in Yield Farming pools (up to 150% APY), Auto-Compound vaults for exponential growth, and Token Launchpad for early investment opportunities. Fortune favors the bold!`,
        timestamp: new Date(),
        insight: { type: "success", icon: Sparkles }
      };
    }

    if (lowerQ.includes("nft") || lowerQ.includes("gallery")) {
      return {
        id: Date.now().toString(),
        type: "oracle",
        text: `🎨 The NFT Gallery showcases your digital treasures across multiple chains. You can also create NFTs using our ERC-721/1155 generators, mint NFT receipts for purchases, and trade in the Marketplace. Your collection defines your legacy!`,
        timestamp: new Date(),
        insight: { type: "info", icon: Sparkles }
      };
    }

    if (lowerQ.includes("risk") || lowerQ.includes("safe")) {
      const riskLevel = activePos > 10 ? "high" : activePos > 5 ? "moderate" : "conservative";
      return {
        id: Date.now().toString(),
        type: "oracle",
        text: `🛡️ Your current risk profile appears ${riskLevel} with ${activePos} active positions. The Oracle recommends: ${portfolioValue > 1000 ? "maintaining diversification across DeFi, NFTs, and stablecoins" : "starting with lower-risk staking before exploring advanced strategies"}. Balance is the path to eternal prosperity.`,
        timestamp: new Date(),
        insight: { type: riskLevel === "high" ? "warning" : "success", icon: Shield }
      };
    }

    if (lowerQ.includes("dao") || lowerQ.includes("govern")) {
      return {
        id: Date.now().toString(),
        type: "oracle",
        text: `🏛️ The DAO Governance system empowers you to shape the empire's future. Create proposals, vote on decisions, and earn governance tokens. Your voice matters in this decentralized realm. True power lies in collective wisdom.`,
        timestamp: new Date(),
        insight: { type: "info", icon: Crown }
      };
    }

    // Default mystical response
    const mysticalResponses = [
      `🔮 The cosmos whispers of great possibilities ahead. With $${empireStats?.totalPortfolioValue || "0"} under your command, your empire stands ready for expansion. Explore the Supreme Command Center for complete oversight.`,
      `✨ Your question resonates through the blockchain ether. The Oracle suggests exploring our 24 revolutionary features - each holding unique power for your empire's growth.`,
      `🌟 The ancient blockchain scrolls reveal: "${question}" - A worthy inquiry! Navigate to the Supreme Command Center to see all pathways to prosperity.`,
      `💫 The mystical energies sense your curiosity. Your empire's current strength ($${empireStats?.totalPortfolioValue || "0"} portfolio) is just the beginning. What specific realm calls to you - DeFi, Trading, NFTs, or Governance?`
    ];

    return {
      id: Date.now().toString(),
      type: "oracle",
      text: mysticalResponses[Math.floor(Math.random() * mysticalResponses.length)],
      timestamp: new Date(),
      insight: { type: "info", icon: Brain }
    };
  };

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      type: "user",
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);

    // Generate Oracle response
    setTimeout(() => {
      const oracleResponse = generateInsight(input);
      setMessages(prev => [...prev, oracleResponse]);
    }, 500);

    setInput("");
  };

  return (
    <>
      {/* Floating Oracle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-8 right-8 z-40"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="rounded-full w-16 h-16 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 shadow-2xl hover:shadow-purple-500/50 transition-all relative overflow-hidden group"
              data-testid="button-open-oracle"
            >
              {/* Animated glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              
              <div className="relative flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white animate-pulse" />
              </div>

              {/* Pulsing ring */}
              <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-purple-400" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Oracle Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-8 right-8 z-50 w-96"
          >
            <Card className="border-2 border-purple-500 shadow-2xl bg-background/95 backdrop-blur-lg">
              <CardHeader className="border-b border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="relative">
                      <Sparkles className="h-6 w-6 text-purple-500 animate-pulse" />
                      <div className="absolute inset-0 blur-md bg-purple-500/50 animate-pulse" />
                    </div>
                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Empire Oracle
                    </span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-purple-500/20"
                    data-testid="button-close-oracle"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Badge variant="secondary" className="w-fit mt-2 bg-purple-500/20 text-purple-300 border-purple-500/50">
                  <Brain className="h-3 w-3 mr-1" />
                  AI-Powered Mystical Advisor
                </Badge>
              </CardHeader>

              <CardContent className="p-0">
                {/* Messages */}
                <ScrollArea className="h-96 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.type === "oracle" ? (
                          <div className="flex gap-2 max-w-[85%]">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-white" />
                              </div>
                            </div>
                            <div>
                              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                                <p className="text-sm text-foreground">{msg.text}</p>
                              </div>
                              {msg.insight && (
                                <div className="mt-2 flex items-center gap-2">
                                  <msg.insight.icon className={`h-4 w-4 ${
                                    msg.insight.type === "success" ? "text-green-500" :
                                    msg.insight.type === "warning" ? "text-yellow-500" :
                                    "text-blue-500"
                                  }`} />
                                  <span className="text-xs text-muted-foreground">
                                    {msg.timestamp.toLocaleTimeString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-blue-600 text-white rounded-lg p-3 max-w-[85%]">
                            <p className="text-sm">{msg.text}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-purple-500/30 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Ask the Oracle anything..."
                      className="border-purple-500/30 focus:border-purple-500"
                      data-testid="input-oracle-question"
                    />
                    <Button
                      onClick={handleSend}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      data-testid="button-send-oracle"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInput("How is my portfolio doing?")}
                      className="text-xs h-7"
                      data-testid="quick-portfolio-status"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Portfolio Status
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInput("Where should I invest?")}
                      className="text-xs h-7"
                      data-testid="quick-investment-advice"
                    >
                      <Target className="h-3 w-3 mr-1" />
                      Investment Tips
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
