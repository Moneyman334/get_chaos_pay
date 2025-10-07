interface MarketplaceFees {
  baseFee: number;
  instantSettlementFee: number;
  totalFee: number;
  sellerReceives: number;
  buyerPays: number;
  isInstantSettlement: boolean;
}

export class MarketplaceFeeService {
  private readonly BASE_FEE_PERCENTAGE = 2.5; // 2.5% base fee
  private readonly INSTANT_SETTLEMENT_FEE = 5.0; // 5% for instant settlement

  /**
   * Calculate marketplace fees for a sale
   */
  calculateFees(salePrice: number, instantSettlement: boolean = false): MarketplaceFees {
    const baseFee = (salePrice * this.BASE_FEE_PERCENTAGE) / 100;
    const instantSettlementFee = instantSettlement 
      ? (salePrice * this.INSTANT_SETTLEMENT_FEE) / 100 
      : 0;
    
    const totalFee = baseFee + instantSettlementFee;
    const sellerReceives = salePrice - totalFee;
    const buyerPays = salePrice;

    return {
      baseFee,
      instantSettlementFee,
      totalFee,
      sellerReceives,
      buyerPays,
      isInstantSettlement: instantSettlement
    };
  }

  /**
   * Get fee breakdown for display
   */
  getFeeBreakdown(salePrice: number, instantSettlement: boolean = false) {
    const fees = this.calculateFees(salePrice, instantSettlement);
    
    return {
      salePrice,
      fees: {
        base: {
          percentage: this.BASE_FEE_PERCENTAGE,
          amount: fees.baseFee
        },
        instantSettlement: instantSettlement ? {
          percentage: this.INSTANT_SETTLEMENT_FEE,
          amount: fees.instantSettlementFee
        } : null,
        total: {
          percentage: instantSettlement 
            ? this.BASE_FEE_PERCENTAGE + this.INSTANT_SETTLEMENT_FEE 
            : this.BASE_FEE_PERCENTAGE,
          amount: fees.totalFee
        }
      },
      sellerReceives: fees.sellerReceives,
      buyerPays: fees.buyerPays,
      instantSettlement
    };
  }

  /**
   * Calculate total platform revenue from marketplace for a period
   */
  calculateMarketplaceRevenue(sales: Array<{price: number, instantSettlement: boolean}>): number {
    return sales.reduce((total, sale) => {
      const fees = this.calculateFees(sale.price, sale.instantSettlement);
      return total + fees.totalFee;
    }, 0);
  }

  /**
   * Get instant settlement savings (what seller loses by choosing instant)
   */
  getInstantSettlementCost(salePrice: number): number {
    const normalFees = this.calculateFees(salePrice, false);
    const instantFees = this.calculateFees(salePrice, true);
    
    return instantFees.totalFee - normalFees.totalFee;
  }

  /**
   * Determine if instant settlement is recommended based on price
   */
  recommendInstantSettlement(salePrice: number): { recommended: boolean; reason: string } {
    const cost = this.getInstantSettlementCost(salePrice);
    const percentage = (cost / salePrice) * 100;

    // Recommend instant settlement for lower value items (< $100)
    // where the extra fee is minimal
    if (salePrice < 100 && cost < 5) {
      return {
        recommended: true,
        reason: `Only costs $${cost.toFixed(2)} extra (${percentage.toFixed(1)}%) for immediate settlement`
      };
    }

    // Not recommended for high value items
    if (salePrice >= 1000) {
      return {
        recommended: false,
        reason: `Save $${cost.toFixed(2)} (${percentage.toFixed(1)}%) with standard settlement`
      };
    }

    // Neutral for mid-range
    return {
      recommended: false,
      reason: `Standard settlement saves $${cost.toFixed(2)} (${percentage.toFixed(1)}%)`
    };
  }
}

export const marketplaceFeeService = new MarketplaceFeeService();
