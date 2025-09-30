import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Crown, Star, Sparkles } from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";
import { cn } from "@/lib/utils";

interface CustomerTier {
  id: string;
  walletAddress: string;
  tier: string;
  discount: string;
}

interface CustomerTierBadgeProps {
  className?: string;
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
}

const TIER_CONFIG = {
  vip: {
    label: "VIP",
    color: "bg-gradient-to-r from-purple-600 to-pink-600",
    icon: Crown,
    description: "VIP customers get exclusive benefits and priority support",
  },
  wholesale: {
    label: "Wholesale",
    color: "bg-gradient-to-r from-blue-600 to-cyan-600",
    icon: Sparkles,
    description: "Wholesale customers get bulk pricing and special terms",
  },
  preferred: {
    label: "Preferred",
    color: "bg-gradient-to-r from-green-600 to-emerald-600",
    icon: Star,
    description: "Preferred customers get enhanced benefits",
  },
};

export function CustomerTierBadge({
  className,
  showTooltip = true,
  size = "md",
}: CustomerTierBadgeProps) {
  const { account } = useWeb3();

  const { data: tierData } = useQuery<CustomerTier>({
    queryKey: ['/api/customer-tiers/wallet', account],
    enabled: !!account,
  });

  if (!tierData || tierData.tier === "standard") {
    return null;
  }

  const tierKey = tierData.tier.toLowerCase() as keyof typeof TIER_CONFIG;
  const config = TIER_CONFIG[tierKey];

  if (!config) {
    return null;
  }

  const Icon = config.icon;
  const discount = parseFloat(tierData.discount);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const badge = (
    <Badge
      className={cn(
        config.color,
        "text-white font-semibold border-0",
        sizeClasses[size],
        className
      )}
      data-testid={`tier-badge-${tierKey}`}
    >
      <Icon className={cn(iconSizes[size], "mr-1")} />
      {config.label}
      {discount > 0 && (
        <span className="ml-1 opacity-90">
          ({discount}% off)
        </span>
      )}
    </Badge>
  );

  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">{config.label} Customer</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              {config.description}
            </p>
            {discount > 0 && (
              <p className="text-sm text-green-400">
                Automatic {discount}% discount on all purchases
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
