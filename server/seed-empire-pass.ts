import { db as dbClient } from './storage';
import { subscriptionPlans } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function seedEmpirePassPlans() {
  console.log('💎 Seeding Empire Pass subscription plans...');

  const empirePassPlans = [
    {
      id: 'empire-pass-free',
      name: 'Free Tier',
      description: 'Basic access to the Empire ecosystem',
      price: '0',
      currency: 'USD',
      billingInterval: 'monthly',
      trialDays: '0',
      features: [
        'Basic wallet management',
        'Limited NFT viewing',
        'Standard trading fees (0.5%)',
        'Payment processing (2%)',
        'Community access',
        'Email support'
      ],
      isActive: 'true',
      metadata: {
        tier: 'free',
        stakingRequired: '0',
        tradingFee: '0.5',
        paymentFee: '2.0',
        maxDailyTrades: '10',
        features: {
          botAccess: false,
          exclusiveRelics: false,
          zeroBridgeFees: false,
          prioritySupport: false,
          revenueShare: false
        }
      }
    },
    {
      id: 'empire-pass-ascend',
      name: 'Ascend Pass',
      description: 'Unlock advanced features and reduced fees',
      price: '29.99',
      currency: 'USD',
      billingInterval: 'monthly',
      trialDays: '7',
      features: [
        'Reduced trading fees (0.3%)',
        'Reduced payment fees (1.5%)',
        'AI Trading Bot (Basic)',
        'Exclusive Relic NFT airdrop',
        'Zero bridge fees',
        'Priority email support',
        'Analytics dashboard',
        'Up to 50 daily trades'
      ],
      isActive: 'true',
      metadata: {
        tier: 'ascend',
        stakingRequired: '1000',
        tradingFee: '0.3',
        paymentFee: '1.5',
        maxDailyTrades: '50',
        priceETH: '0.01',
        features: {
          botAccess: 'basic',
          exclusiveRelics: true,
          zeroBridgeFees: true,
          prioritySupport: true,
          revenueShare: false,
          analyticsAccess: true
        }
      }
    },
    {
      id: 'empire-pass-empire',
      name: 'Empire Pass',
      description: 'Full empire features with AI co-pilot',
      price: '79.99',
      currency: 'USD',
      billingInterval: 'monthly',
      trialDays: '14',
      features: [
        'Ultra-low trading fees (0.2%)',
        'Ultra-low payment fees (1%)',
        'AI Trading Bot (Pro + Co-Pilot)',
        'Exclusive Legendary Relic NFT',
        'Zero bridge fees',
        'VIP priority support (24/7)',
        'Advanced analytics & insights',
        'Revenue share program (0.5%)',
        'Unlimited daily trades',
        'Custom API access',
        'Early access to new features'
      ],
      isActive: 'true',
      metadata: {
        tier: 'empire',
        stakingRequired: '10000',
        tradingFee: '0.2',
        paymentFee: '1.0',
        maxDailyTrades: 'unlimited',
        priceETH: '0.03',
        features: {
          botAccess: 'pro',
          exclusiveRelics: true,
          zeroBridgeFees: true,
          prioritySupport: true,
          revenueShare: '0.5',
          analyticsAccess: true,
          apiAccess: true,
          earlyAccess: true
        }
      }
    },
    {
      id: 'empire-pass-whale',
      name: 'Whale Pass',
      description: 'Ultimate tier for high-volume traders',
      price: '299',
      currency: 'USD',
      billingInterval: 'monthly',
      trialDays: '30',
      features: [
        'Minimum trading fees (0.1%)',
        'Minimum payment fees (0.5%)',
        'AI Trading Bot (Whale + Custom Strategies)',
        'Mythic Relic NFT Collection',
        'Zero all platform fees',
        'Dedicated account manager',
        'White-glove support (24/7)',
        'Revenue share program (1%)',
        'Unlimited everything',
        'Custom API with higher limits',
        'Beta testing access',
        'Direct team communication',
        'Custom smart contract deployment',
        'Institutional desk access'
      ],
      isActive: 'true',
      metadata: {
        tier: 'whale',
        stakingRequired: '100000',
        tradingFee: '0.1',
        paymentFee: '0.5',
        maxDailyTrades: 'unlimited',
        priceETH: '0.1',
        features: {
          botAccess: 'whale',
          exclusiveRelics: true,
          zeroBridgeFees: true,
          prioritySupport: true,
          revenueShare: '1.0',
          analyticsAccess: true,
          apiAccess: true,
          earlyAccess: true,
          customStrategies: true,
          dedicatedManager: true,
          institutionalDesk: true
        }
      }
    }
  ];

  for (const plan of empirePassPlans) {
    try {
      // Check if plan exists
      const [existing] = await dbClient.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, plan.id))
        .limit(1);

      if (existing) {
        // Update existing plan
        await dbClient.update(subscriptionPlans)
          .set({
            ...plan,
            metadata: plan.metadata as any
          })
          .where(eq(subscriptionPlans.id, plan.id));
        console.log(`✅ Updated: ${plan.name} ($${plan.price}/mo)`);
      } else {
        // Create new plan
        await dbClient.insert(subscriptionPlans).values({
          ...plan,
          metadata: plan.metadata as any
        });
        console.log(`✅ Created: ${plan.name} ($${plan.price}/mo)`);
      }
    } catch (error) {
      console.error(`❌ Error seeding ${plan.name}:`, error);
    }
  }

  console.log('💎 Empire Pass plans seeded successfully!\n');
}
