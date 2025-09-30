import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FileText, Plus, Copy, Check, ExternalLink, DollarSign, Clock, Link2 } from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerEmail: string | null;
  customerWallet: string | null;
  amount: string;
  currency: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  paymentLink: string;
  createdAt: string;
}

export default function Invoices() {
  const { toast } = useToast();
  const { account } = useWeb3();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerEmail: "",
    amount: "",
    currency: "USD",
    description: "",
    dueDate: "",
  });

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error("Enter a valid amount");
      }

      return apiRequest('POST', '/api/invoices', {
        customerEmail: formData.customerEmail || null,
        customerWallet: account || null,
        amount: formData.amount,
        currency: formData.currency,
        description: formData.description || null,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Invoice Created!",
        description: "Payment link is ready to share",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      setShowCreateForm(false);
      setFormData({
        customerEmail: "",
        amount: "",
        currency: "USD",
        description: "",
        dueDate: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyPaymentLink = (invoice: Invoice) => {
    const link = `${window.location.origin}/pay/${invoice.id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(invoice.id);
    toast({
      title: "Link Copied!",
      description: "Payment link has been copied to clipboard",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'overdue':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const myInvoices = invoices?.filter(inv => 
    inv.customerWallet === account
  ) || [];

  const allInvoices = invoices || [];

  // Calculate stats
  const totalInvoices = allInvoices.length;
  const paidInvoices = allInvoices.filter(i => i.status === 'paid').length;
  const pendingInvoices = allInvoices.filter(i => i.status === 'pending').length;
  const totalRevenue = allInvoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + parseFloat(i.amount), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Invoices & Payment Links</h1>
          <p className="text-muted-foreground">
            Create and manage payment invoices with shareable links
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} data-testid="button-create-invoice">
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-3xl font-bold">{totalInvoices}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-3xl font-bold">{paidInvoices}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <Check className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold">{pendingInvoices}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <DollarSign className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="mb-6 border-primary">
          <CardHeader>
            <CardTitle>Create Invoice</CardTitle>
            <CardDescription>
              Generate a payment link to share with customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer Email</Label>
                <Input
                  type="email"
                  placeholder="customer@example.com"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  data-testid="input-customer-email"
                />
              </div>

              <div>
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  data-testid="input-amount"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Currency</Label>
                <Input
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                  placeholder="USD"
                  data-testid="input-currency"
                />
              </div>

              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  data-testid="input-due-date"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Invoice description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                data-testid="textarea-description"
              />
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm">
                <strong>Payment Link:</strong> A unique, shareable URL will be generated that allows anyone to pay this invoice using crypto or other payment methods.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createInvoiceMutation.mutate()}
                disabled={createInvoiceMutation.isPending || !formData.amount}
                className="flex-1"
                data-testid="button-create"
              >
                {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Invoices</TabsTrigger>
          <TabsTrigger value="my">My Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6 space-y-3">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : allInvoices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Invoices</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first invoice to get started
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </CardContent>
            </Card>
          ) : (
            allInvoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onCopyLink={copyPaymentLink}
                copied={copiedId === invoice.id}
                getStatusColor={getStatusColor}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="my" className="space-y-4 mt-6">
          {myInvoices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Invoices</h3>
                <p className="text-muted-foreground">
                  {account ? "You don't have any invoices yet" : "Connect your wallet to view your invoices"}
                </p>
              </CardContent>
            </Card>
          ) : (
            myInvoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onCopyLink={copyPaymentLink}
                copied={copiedId === invoice.id}
                getStatusColor={getStatusColor}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface InvoiceCardProps {
  invoice: Invoice;
  onCopyLink: (invoice: Invoice) => void;
  copied: boolean;
  getStatusColor: (status: string) => string;
}

function InvoiceCard({ invoice, onCopyLink, copied, getStatusColor }: InvoiceCardProps) {
  const daysUntilDue = invoice.dueDate
    ? Math.ceil((new Date(invoice.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card data-testid={`invoice-${invoice.id}`}>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold">Invoice #{invoice.invoiceNumber}</h3>
              <Badge className={getStatusColor(invoice.status)}>
                {invoice.status.toUpperCase()}
              </Badge>
            </div>

            {invoice.description && (
              <p className="text-sm text-muted-foreground mb-3">{invoice.description}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-semibold">{invoice.amount} {invoice.currency}</p>
              </div>

              {invoice.customerEmail && (
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="text-sm font-mono">{invoice.customerEmail}</p>
                </div>
              )}

              {invoice.dueDate && (
                <div>
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="text-sm">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                    {daysUntilDue !== null && (
                      <span className={`ml-1 ${daysUntilDue < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        ({daysUntilDue < 0 ? 'Overdue' : `${daysUntilDue}d`})
                      </span>
                    )}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm">
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => onCopyLink(invoice)}
              data-testid={`button-copy-${invoice.id}`}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`/pay/${invoice.id}`, '_blank')}
              data-testid={`button-view-${invoice.id}`}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
