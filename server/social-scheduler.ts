import cron from 'node-cron';
import { TwitterApi } from 'twitter-api-v2';
import { storage } from './storage';

interface TwitterCredentials {
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
}

class SocialMediaScheduler {
  private isRunning: boolean = false;

  async postToTwitter(credentials: TwitterCredentials, content: string, accountUsername: string): Promise<{ success: boolean; postUrl?: string; externalPostId?: string; error?: string }> {
    try {
      const client = new TwitterApi({
        appKey: credentials.appKey,
        appSecret: credentials.appSecret,
        accessToken: credentials.accessToken,
        accessSecret: credentials.accessSecret,
      });

      const tweet = await client.v2.tweet(content);
      
      if (tweet.data?.id) {
        const username = accountUsername.startsWith('@') ? accountUsername.slice(1) : accountUsername;
        const postUrl = `https://twitter.com/${username}/status/${tweet.data.id}`;
        return { success: true, postUrl, externalPostId: tweet.data.id };
      }
      
      return { success: false, error: 'Failed to get tweet ID' };
    } catch (error: any) {
      console.error('Twitter posting error:', error);
      return { 
        success: false, 
        error: error?.message || 'Unknown error occurred' 
      };
    }
  }

  async processScheduledPosts() {
    if (this.isRunning) {
      console.log('⏭️  Skipping post processing - already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Processing scheduled posts...');

    try {
      const now = new Date();
      const duePosts = await storage.getPostsDueForPublish(now);

      console.log(`📋 Found ${duePosts.length} posts due for publishing`);

      for (const post of duePosts) {
        try {
          const account = await storage.getSocialAccount(post.accountId);
          
          if (!account || account.isActive !== 'true') {
            console.log(`⚠️  Skipping post ${post.id} - account inactive or not found`);
            await storage.updateScheduledPost(post.id, { status: 'failed' });
            continue;
          }

          if (account.platform === 'twitter' || account.platform === 'x') {
            if (!account.apiKey || !account.apiSecret || !account.accessToken || !account.accessTokenSecret) {
              console.log(`⚠️  Skipping post ${post.id} - missing Twitter credentials`);
              await storage.updateScheduledPost(post.id, { status: 'failed' });
              await storage.createPostHistory({
                userId: post.userId,
                accountId: post.accountId,
                scheduledPostId: post.id,
                content: post.content,
                platform: account.platform,
                status: 'failed',
                error: 'Missing Twitter API credentials'
              });
              continue;
            }

            const result = await this.postToTwitter(
              {
                appKey: account.apiKey,
                appSecret: account.apiSecret,
                accessToken: account.accessToken,
                accessSecret: account.accessTokenSecret
              },
              post.content,
              account.accountName
            );

            if (result.success) {
              console.log(`✅ Successfully posted to Twitter: ${post.id}`);
              
              await storage.updateScheduledPost(post.id, { status: 'published' });
              
              await storage.createPostHistory({
                userId: post.userId,
                accountId: post.accountId,
                scheduledPostId: post.id,
                content: post.content,
                platform: account.platform,
                postUrl: result.postUrl,
                externalPostId: result.externalPostId,
                status: 'success'
              });
              
              await storage.updateSocialAccount(account.id, {
                lastPostedAt: new Date()
              });
            } else {
              console.log(`❌ Failed to post to Twitter: ${post.id} - ${result.error}`);
              
              await storage.updateScheduledPost(post.id, { status: 'failed' });
              
              await storage.createPostHistory({
                userId: post.userId,
                accountId: post.accountId,
                scheduledPostId: post.id,
                content: post.content,
                platform: account.platform,
                status: 'failed',
                error: result.error
              });
            }
          } else {
            console.log(`⚠️  Unsupported platform: ${account.platform}`);
            await storage.updateScheduledPost(post.id, { status: 'failed' });
          }
        } catch (error) {
          console.error(`Error processing post ${post.id}:`, error);
          await storage.updateScheduledPost(post.id, { status: 'failed' });
        }
      }

      console.log('✨ Finished processing scheduled posts');
    } catch (error) {
      console.error('Error in processScheduledPosts:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async createAutoScheduledPost(accountId: string, userId: string) {
    try {
      const account = await storage.getSocialAccount(accountId);
      if (!account || account.isActive !== 'true') {
        return;
      }

      const messages = [
        '🚀 Building the future of Web3 with Chaos Empire! Join us on this cosmic journey. #Web3 #Crypto #Blockchain',
        '💎 Experience the divine power of our Auto-Compound system. Your investments working 24/7! #DeFi #CryptoInvesting',
        '🎮 House Vaults are live! Become the house and earn from casino profits. #CryptoGaming #PassiveIncome',
        '⚡ Sentinel Auto Trading Bot: AI-powered strategies for maximum returns. #CryptoTrading #AutomatedTrading',
        '🌟 Divine visual experience meets cutting-edge blockchain technology. #NFT #CryptoArt',
        '🔥 Multi-chain wallet integration: ETH, BTC, SOL, and more! #MultiChain #CryptoWallet',
        '💫 Create your own tokens and NFTs with our smart contract generators. #TokenCreator #NFTCreator',
        '🎯 Join thousands of traders in the Chaos Empire ecosystem. #CryptoCommunity #Web3Gaming'
      ];

      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      const scheduledFor = new Date();
      scheduledFor.setHours(scheduledFor.getHours() + 3);

      await storage.createScheduledPost({
        userId,
        accountId,
        content: randomMessage,
        scheduledFor,
        status: 'pending',
        postType: 'auto'
      });

      console.log(`📅 Created auto-scheduled post for ${scheduledFor.toISOString()}`);
    } catch (error) {
      console.error('Error creating auto-scheduled post:', error);
    }
  }

  start() {
    console.log('🎬 Starting Social Media Scheduler...');
    
    cron.schedule('0 */3 * * *', async () => {
      console.log('⏰ 3-hour cron job triggered');
      await this.processScheduledPosts();
    });

    cron.schedule('*/5 * * * *', async () => {
      await this.processScheduledPosts();
    });

    console.log('✅ Social Media Scheduler started successfully');
    console.log('📅 Will post every 3 hours at: 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00');
    console.log('🔍 Checking for due posts every 5 minutes');
  }
}

export const socialScheduler = new SocialMediaScheduler();
