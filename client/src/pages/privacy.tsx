import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/seo";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <>
      <SEO 
        title="Privacy Policy | CODEX"
        description="Learn how CODEX protects your privacy and handles your data on our blockchain platform."
        canonicalUrl="/privacy"
      />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 mx-auto mb-4 text-purple-400" />
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <Badge variant="outline">Last Updated: October 2025</Badge>
        </div>

        <Card className="mb-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
          <CardHeader>
            <CardTitle>Our Privacy Commitment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              CODEX is built with privacy at its core. As a decentralized platform, we minimize data collection 
              and maximize user privacy. This policy explains what information we collect, how we use it, and your rights.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>1. Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <h4 className="font-semibold mb-2">Information You Provide:</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Wallet addresses when you connect to the Platform</li>
              <li>Transaction data visible on public blockchains</li>
              <li>Optional profile information if you create an account</li>
              <li>Communications when you contact support</li>
            </ul>

            <h4 className="font-semibold mb-2">Automatically Collected Information:</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>Browser type and version</li>
              <li>Device information and IP address</li>
              <li>Usage data and analytics</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>2. How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="mb-4">We use collected information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and improve the Platform's services</li>
              <li>Process your blockchain transactions</li>
              <li>Communicate important updates and notifications</li>
              <li>Detect and prevent fraud or security threats</li>
              <li>Comply with legal obligations</li>
              <li>Analyze usage patterns to enhance user experience</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>3. Blockchain Transparency</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              All blockchain transactions are publicly visible and permanently recorded on public ledgers. 
              This includes wallet addresses, transaction amounts, smart contract interactions, and timestamps. 
              CODEX has no control over this public blockchain data.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>4. Data Sharing & Disclosure</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="mb-4">We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> Third-party services that help operate the Platform (hosting, analytics)</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulations</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>5. Cookies & Tracking</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="mb-4">We use cookies and similar technologies to:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Remember your preferences and settings</li>
              <li>Understand how you interact with the Platform</li>
              <li>Improve security and prevent fraud</li>
              <li>Analyze traffic and usage patterns</li>
            </ul>
            <p>
              You can control cookies through your browser settings. Note that disabling cookies may limit 
              some Platform functionality.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>6. Data Security</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="mb-4">We implement industry-standard security measures:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and authentication</li>
              <li>Monitoring for suspicious activity</li>
            </ul>
            <p className="mt-4">
              However, no system is completely secure. You are responsible for maintaining the security of 
              your wallet and private keys.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>7. Your Privacy Rights</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="mb-4">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
              <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Object:</strong> Object to certain data processing activities</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>8. Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              We retain your information only as long as necessary to provide services and comply with legal obligations. 
              Blockchain transactions are permanent and cannot be deleted. Account data may be retained for legal and 
              compliance purposes even after account closure.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>9. International Data Transfers</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              CODEX operates globally, and your data may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>10. Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              The Platform is not intended for users under 18 years of age. We do not knowingly collect information 
              from children. If we discover we have collected data from a child, we will delete it promptly.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>11. Third-Party Services</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              The Platform may integrate with third-party services (wallets, blockchain networks, APIs). 
              These services have their own privacy policies. We are not responsible for third-party privacy practices.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>12. Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              We may update this Privacy Policy periodically. Material changes will be notified through the Platform 
              or via email. Continued use after changes constitutes acceptance of the updated policy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>13. Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              For privacy-related questions, requests to exercise your rights, or concerns, please contact us 
              through the Platform's support system. We will respond to all legitimate requests within 30 days.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
