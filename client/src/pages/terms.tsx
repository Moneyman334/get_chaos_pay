import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/seo";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <>
      <SEO 
        title="Terms of Service | CODEX"
        description="Read the terms and conditions for using the CODEX blockchain platform."
        canonicalUrl="/terms"
      />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <FileText className="h-16 w-16 mx-auto mb-4 text-purple-400" />
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <Badge variant="outline">Last Updated: October 2025</Badge>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>1. Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              By accessing and using CODEX ("the Platform"), you accept and agree to be bound by the terms and provisions of this agreement. 
              If you do not agree to these terms, please do not use the Platform.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>2. Use of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="mb-4">You agree to use the Platform for lawful purposes only. You are prohibited from:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violating any applicable laws or regulations</li>
              <li>Attempting to gain unauthorized access to any part of the Platform</li>
              <li>Using the Platform for any fraudulent or malicious activities</li>
              <li>Interfering with or disrupting the Platform's operation</li>
              <li>Transmitting viruses, malware, or other harmful code</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>3. Wallet Connection & Security</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="mb-4">
              You are solely responsible for maintaining the security of your cryptocurrency wallet and private keys. 
              CODEX does not store, have access to, or control your private keys.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Never share your private keys or seed phrases with anyone</li>
              <li>Verify all transaction details before confirming</li>
              <li>Be aware that blockchain transactions are irreversible</li>
              <li>Keep your wallet software updated and secure</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>4. Trading & Financial Risks</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="mb-4">
              Cryptocurrency trading involves substantial risk. You acknowledge and accept that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Past performance does not guarantee future results</li>
              <li>Trading bots and automated strategies may result in losses</li>
              <li>Cryptocurrency values can be highly volatile</li>
              <li>You may lose some or all of your invested capital</li>
              <li>CODEX does not provide financial advice</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>5. Smart Contracts & Blockchain</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              All blockchain transactions are executed through smart contracts on public blockchains. 
              Once a transaction is confirmed on the blockchain, it cannot be reversed by CODEX. 
              You are responsible for verifying all transaction details before execution.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>6. Fees & Payments</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              The Platform may charge fees for certain services. All fees are clearly disclosed before transaction execution. 
              Additionally, blockchain network fees (gas fees) apply to all on-chain transactions and are paid directly to network validators.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>7. Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              All content, features, and functionality of the Platform are owned by CODEX and are protected by international copyright, 
              trademark, and other intellectual property laws.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>8. Disclaimer of Warranties</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. 
              CODEX DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>9. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CODEX SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>10. NFT & Token Creation</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              When using CODEX's NFT and token creation tools, you are solely responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Ensuring you have rights to all content you upload</li>
              <li>Complying with applicable securities laws and regulations</li>
              <li>Not creating tokens that infringe on others' intellectual property</li>
              <li>Understanding that deployed smart contracts cannot be modified after deployment</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>11. Prohibited Activities</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="mb-4">You may not use the Platform for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Money laundering or terrorist financing</li>
              <li>Market manipulation or insider trading</li>
              <li>Creating or distributing securities without proper registration</li>
              <li>Violating sanctions or embargoes</li>
              <li>Any illegal activities under applicable laws</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>12. Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              CODEX reserves the right to modify these terms at any time. Continued use of the Platform after changes 
              constitutes acceptance of the modified terms. Material changes will be notified through the Platform.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>13. Termination</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              CODEX may terminate or suspend your access to the Platform at any time, without prior notice, for conduct 
              that violates these terms or is harmful to other users, CODEX, or third parties.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>14. Governing Law</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              These terms shall be governed by and construed in accordance with applicable laws, without regard to 
              conflict of law provisions. Any disputes shall be resolved through binding arbitration.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>15. Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              For questions about these Terms of Service, please contact us through the Platform's support system 
              or community channels.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
