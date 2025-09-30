import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Zap, Plus, Edit, Trash2, Clock, DollarSign, Package, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface Product {
  id: string;
  name: string;
  price: string;
}

interface FlashSale {
  id: string;
  productId: string;
  salePrice: string;
  startTime: string;
  endTime: string;
  quantityLimit: string | null;
  quantitySold: string;
  isActive: string;
  product?: Product;
}

export default function AdminFlashSales() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    productId: "",
    salePrice: "",
    startTime: "",
    endTime: "",
    quantityLimit: "",
  });

  const { data: flashSales, isLoading } = useQuery<FlashSale[]>({
    queryKey: ['/api/flash-sales'],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const data = {
        productId: formData.productId,
        salePrice: formData.salePrice,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        quantityLimit: formData.quantityLimit || null,
      };

      if (editingId) {
        return apiRequest('PUT', `/api/flash-sales/${editingId}`, data);
      } else {
        return apiRequest('POST', '/api/flash-sales', data);
      }
    },
    onSuccess: () => {
      toast({
        title: editingId ? "Flash Sale Updated!" : "Flash Sale Created!",
        description: editingId 
          ? "Flash sale has been updated successfully" 
          : "New flash sale has been created",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/flash-sales'] });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Operation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/flash-sales/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Flash Sale Deleted",
        description: "Flash sale has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/flash-sales'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      productId: "",
      salePrice: "",
      startTime: "",
      endTime: "",
      quantityLimit: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (sale: FlashSale) => {
    setFormData({
      productId: sale.productId,
      salePrice: sale.salePrice,
      startTime: format(new Date(sale.startTime), "yyyy-MM-dd'T'HH:mm"),
      endTime: format(new Date(sale.endTime), "yyyy-MM-dd'T'HH:mm"),
      quantityLimit: sale.quantityLimit || "",
    });
    setEditingId(sale.id);
    setShowForm(true);
  };

  const calculateDiscount = (originalPrice: string, salePrice: string) => {
    const original = parseFloat(originalPrice);
    const sale = parseFloat(salePrice);
    const discount = ((original - sale) / original) * 100;
    return discount.toFixed(0);
  };

  const isActive = (sale: FlashSale) => {
    const now = new Date();
    const start = new Date(sale.startTime);
    const end = new Date(sale.endTime);
    return now >= start && now <= end && sale.isActive === "true";
  };

  const getStatus = (sale: FlashSale) => {
    const now = new Date();
    const start = new Date(sale.startTime);
    const end = new Date(sale.endTime);

    if (sale.isActive === "false") return { label: "Inactive", color: "secondary" };
    if (now < start) return { label: "Scheduled", color: "default" };
    if (now > end) return { label: "Ended", color: "secondary" };
    return { label: "Active", color: "default" };
  };

  // Calculate stats
  const activeCount = flashSales?.filter(s => isActive(s)).length || 0;
  const totalRevenue = flashSales?.reduce((sum, sale) => 
    sum + (parseFloat(sale.salePrice) * parseInt(sale.quantitySold || "0")), 0
  ) || 0;
  const totalSold = flashSales?.reduce((sum, sale) => 
    sum + parseInt(sale.quantitySold || "0"), 0
  ) || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Flash Sales Management</h1>
          <p className="text-muted-foreground">
            Create and manage time-limited promotional sales
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} data-testid="button-create-flash-sale">
          <Plus className="mr-2 h-4 w-4" />
          New Flash Sale
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Sales</p>
                <p className="text-3xl font-bold">{activeCount}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <Zap className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-3xl font-bold">{flashSales?.length || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Items Sold</p>
                <p className="text-3xl font-bold">{totalSold}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <TrendingUp className="h-6 w-6 text-purple-500" />
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
              <div className="p-3 rounded-full bg-yellow-500/10">
                <DollarSign className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card className="mb-6 border-primary">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Flash Sale" : "Create Flash Sale"}</CardTitle>
            <CardDescription>
              Set up a time-limited promotional sale
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Product *</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => setFormData({ ...formData, productId: value })}
              >
                <SelectTrigger data-testid="select-product">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} (${product.price})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sale Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="9.99"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  data-testid="input-sale-price"
                />
              </div>

              <div>
                <Label>Quantity Limit</Label>
                <Input
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={formData.quantityLimit}
                  onChange={(e) => setFormData({ ...formData, quantityLimit: e.target.value })}
                  data-testid="input-quantity-limit"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time *</Label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  data-testid="input-start-time"
                />
              </div>

              <div>
                <Label>End Time *</Label>
                <Input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  data-testid="input-end-time"
                />
              </div>
            </div>

            {formData.productId && formData.salePrice && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm font-semibold text-green-700">
                  {calculateDiscount(
                    products?.find(p => p.id === formData.productId)?.price || "0",
                    formData.salePrice
                  )}% OFF
                </p>
                <p className="text-xs text-muted-foreground">
                  Customers save $
                  {(parseFloat(products?.find(p => p.id === formData.productId)?.price || "0") - parseFloat(formData.salePrice)).toFixed(2)}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={resetForm}
                variant="outline"
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !formData.productId || !formData.salePrice || !formData.startTime || !formData.endTime}
                className="flex-1"
                data-testid="button-save"
              >
                {createMutation.isPending ? "Saving..." : editingId ? "Update" : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flash Sales List */}
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
      ) : flashSales && flashSales.length > 0 ? (
        <div className="space-y-4">
          {flashSales.map((sale) => {
            const status = getStatus(sale);
            const product = sale.product || products?.find(p => p.id === sale.productId);
            
            return (
              <Card key={sale.id} data-testid={`flash-sale-${sale.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">{product?.name}</h3>
                        <Badge variant={status.color as any}>
                          {status.label}
                        </Badge>
                        {isActive(sale) && (
                          <Badge className="bg-red-500">
                            <Zap className="h-3 w-3 mr-1" />
                            LIVE
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Original Price</p>
                          <p className="text-lg font-semibold line-through text-muted-foreground">
                            ${product?.price}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Sale Price</p>
                          <p className="text-lg font-semibold text-green-600">
                            ${sale.salePrice}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Discount</p>
                          <p className="text-lg font-semibold text-red-600">
                            {product && calculateDiscount(product.price, sale.salePrice)}% OFF
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Sold</p>
                          <p className="text-lg font-semibold">
                            {sale.quantitySold}
                            {sale.quantityLimit && ` / ${sale.quantityLimit}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(new Date(sale.startTime), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        <span>→</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(new Date(sale.endTime), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(sale)}
                        data-testid={`button-edit-${sale.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this flash sale?")) {
                            deleteMutation.mutate(sale.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${sale.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Flash Sales</h3>
            <p className="text-muted-foreground mb-4">
              Create your first flash sale to boost sales
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Flash Sale
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
