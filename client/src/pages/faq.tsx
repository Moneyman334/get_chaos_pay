import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SEO from "@/components/seo";
import { HelpCircle, Search, Wallet, Bot, TrendingUp, ShoppingCart, Code, Shield } from "lucide-react";

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const faqCategories = [
    {
      category: "Getting Started",
      icon: <Wallet className="h-5 w-5" />,
      questions: [
        {
          question: "What is CODEX?",
          answer: "CODEX is the most comprehensive blockchain platform with 55+ production features. It combines AI trading bots, DeFi tools, NFT/token creators, crypto payments, staking, and much more in one unified interface."
        },
        {
          question: "How do I get started?",
          answer: "Simply connect your MetaMask wallet by clicking the 'Connect Wallet' button in the top right. No registration or personal information required. Once connected, you'll have immediate access to all platform features."
        },
        {
          question: "Do I need cryptocurrency to use CODEX?",
          answer: "You need a Web3 wallet (like MetaMask) to access the platform. Some features like browsing and exploring are free, but active trading, staking, and transactions require cryptocurrency for gas fees and platform operations."
        },
        {
          question: "Which wallets are supported?",
          answer: "CODEX currently supports MetaMask and any wallet compatible with the Ethereum Provider API. We support multiple chains including Ethereum, Base, Polygon, Arbitrum, Optimism, and BSC."
        }
      ]
    },
    {
      category: "Trading Bot",
      icon: <Bot className="h-5 w-5" />,
      questions: [
        {
          question: "How accurate is the Sentinel Trading Bot?",
          answer: "Our AI trading bot has achieved 89% accuracy in backtesting across multiple market conditions. However, past performance doesn't guarantee future results. The bot uses 5 different strategies and adapts to market conditions in real-time."
        },
        {
          question: "Can I lose money with the trading bot?",
          answer: "Yes, all trading involves risk. While the bot is designed to maximize profits and minimize losses, cryptocurrency markets are volatile. Always start with small amounts, use stop-losses, and never invest more than you can afford to lose."
        },
        {
          question: "How much do I need to start bot trading?",
          answer: "You can start with as little as $100, but we recommend $500+ for better strategy diversification. The bot works with your Coinbase Advanced Trade account for actual execution."
        },
        {
          question: "Does the bot trade 24/7?",
          answer: "Yes! Once activated, the Sentinel Bot monitors markets and executes trades 24/7 based on your configured strategy. You can pause or stop it anytime."
        }
      ]
    },
    {
      category: "Staking & DeFi",
      icon: <TrendingUp className="h-5 w-5" />,
      questions: [
        {
          question: "What is the APY on staking?",
          answer: "APY varies by pool, ranging from 15% to 45%. Our flagship pools offer auto-compounding every hour, maximizing your returns without manual intervention. Rates adjust based on pool TVL and market conditions."
        },
        {
          question: "Is my staked crypto locked?",
          answer: "It depends on the pool. Some pools offer flexible staking (withdraw anytime), while others have lock periods (7, 30, or 90 days) for higher APY. Check pool details before staking."
        },
        {
          question: "How does auto-compounding work?",
          answer: "Our smart contracts automatically reinvest your earned rewards every hour, compounding your gains without gas fees or manual work. This significantly increases your effective yield over time."
        },
        {
          question: "What are flash loans?",
          answer: "Flash loans let you borrow large amounts of crypto without collateral, as long as you repay within the same transaction. Used for arbitrage, liquidations, and advanced DeFi strategies. Available in our Supreme Command center."
        }
      ]
    },
    {
      category: "NFTs & Tokens",
      icon: <Code className="h-5 w-5" />,
      questions: [
        {
          question: "Can I create NFTs without coding?",
          answer: "Absolutely! Our NFT Creator lets you launch ERC-721 or ERC-1155 collections in just a few clicks. Upload your art to IPFS, configure settings, and deploy to any supported chain. No programming knowledge required."
        },
        {
          question: "How much does it cost to create a token?",
          answer: "The only cost is the blockchain gas fee for deploying the smart contract (typically $10-50 depending on network congestion). The CODEX platform doesn't charge creation fees."
        },
        {
          question: "What's the difference between ERC-721 and ERC-1155?",
          answer: "ERC-721 is for unique, individual NFTs (like art pieces). ERC-1155 supports both unique and fungible tokens in one contract, more gas-efficient for collections with multiple editions."
        },
        {
          question: "Can I sell my created NFTs?",
          answer: "Yes! NFTs created on CODEX are standard blockchain tokens that can be listed on any NFT marketplace like OpenSea, or traded on our built-in Marketplace feature."
        }
      ]
    },
    {
      category: "Payments & E-commerce",
      icon: <ShoppingCart className="h-5 w-5" />,
      questions: [
        {
          question: "How do crypto payments work?",
          answer: "CODEX supports 300+ cryptocurrencies through NOWPayments integration. Customers pay with their preferred crypto, funds are instantly settled to your wallet. No chargebacks, lower fees than credit cards."
        },
        {
          question: "Where do payment funds go?",
          answer: "All payments route directly to your configured MERCHANT_ADDRESS (your personal MetaMask wallet). You have immediate, full control over your funds - no middleman holding your money."
        },
        {
          question: "What about refunds?",
          answer: "While blockchain transactions are irreversible, CODEX includes a refund management system where you can manually process refunds by sending crypto back to customers when needed."
        },
        {
          question: "Can I accept both crypto and fiat?",
          answer: "CODEX specializes in cryptocurrency payments. For fiat integration, you can use services like Stripe separately. We focus on providing the best crypto payment experience."
        }
      ]
    },
    {
      category: "Security",
      icon: <Shield className="h-5 w-5" />,
      questions: [
        {
          question: "Is CODEX safe to use?",
          answer: "Yes. We use military-grade encryption, smart contract audits, and follow security best practices. However, you're responsible for your wallet security - never share private keys or seed phrases with anyone."
        },
        {
          question: "Does CODEX have access to my wallet?",
          answer: "No. CODEX never has access to your private keys. We only interact with your wallet through standard Web3 protocols that require your approval for every transaction."
        },
        {
          question: "What if I lose my private key?",
          answer: "Unfortunately, we cannot recover lost private keys - that's the nature of decentralized blockchain. Always backup your seed phrase securely and never lose it."
        },
        {
          question: "Are smart contracts audited?",
          answer: "Our core contracts follow industry-standard patterns and best practices. For production use with significant value, we recommend independent third-party audits for your peace of mind."
        }
      ]
    },
    {
      category: "Fees & Costs",
      icon: <TrendingUp className="h-5 w-5" />,
      questions: [
        {
          question: "What fees does CODEX charge?",
          answer: "Platform fees vary by feature: Trading bot (0.5% per trade), Cross-chain bridge (0.1% + gas), Payment processing (2%), Staking (0% - rewards are built-in). All fees are clearly displayed before transactions."
        },
        {
          question: "What are gas fees?",
          answer: "Gas fees are paid to blockchain validators to process your transactions. They're not controlled by CODEX. Fees vary by network - Layer 2 solutions like Arbitrum and Optimism offer much lower gas fees."
        },
        {
          question: "Why do gas fees fluctuate?",
          answer: "Gas fees depend on network congestion. When many people are using the blockchain, fees increase. Use our gas tracker to monitor fees and transact during low-traffic periods to save money."
        }
      ]
    }
  ];

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      searchQuery === "" ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <>
      <SEO 
        title="FAQ & Help Center | CODEX"
        description="Find answers to common questions about using CODEX blockchain platform. Learn about trading bots, staking, NFTs, payments, and more."
        canonicalUrl="/faq"
      />
      
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <HelpCircle className="h-16 w-16 mx-auto mb-4 text-purple-400" />
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find quick answers to common questions about CODEX features and functionality
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search FAQ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-faq"
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-400 mb-2">55+</div>
              <div className="text-sm text-muted-foreground">Features Covered</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-400 mb-2">6</div>
              <div className="text-sm text-muted-foreground">Main Categories</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-cyan-400 mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Support Available</div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Categories */}
        {filteredCategories.length > 0 ? (
          <div className="space-y-6">
            {filteredCategories.map((category, catIndex) => (
              <Card key={catIndex} data-testid={`faq-category-${catIndex}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                      {category.icon}
                    </div>
                    {category.category}
                    <Badge variant="outline" className="ml-auto">
                      {category.questions.length} {category.questions.length === 1 ? 'question' : 'questions'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((qa, qaIndex) => (
                      <AccordionItem key={qaIndex} value={`item-${qaIndex}`} data-testid={`faq-item-${catIndex}-${qaIndex}`}>
                        <AccordionTrigger className="text-left">
                          {qa.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-muted-foreground leading-relaxed">
                            {qa.answer}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-6">
                Try different keywords or browse all categories above
              </p>
              <Button onClick={() => setSearchQuery("")} data-testid="button-clear-search">
                Clear Search
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Still Need Help */}
        <Card className="mt-12 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
          <CardContent className="py-8 text-center">
            <h3 className="text-2xl font-bold mb-2">Still need help?</h3>
            <p className="text-muted-foreground mb-6">
              Can't find the answer you're looking for? Join our community or contact support
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="outline" data-testid="button-join-discord">
                Join Discord Community
              </Button>
              <Button data-testid="button-contact-support">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
