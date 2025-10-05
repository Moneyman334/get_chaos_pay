import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, ShoppingCart, Heart, Star, Filter, Grid3x3, List } from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";
import { Link } from "wouter";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string | null;
  stock: string;
  isActive: string;
}

export default function Products() {
  const { toast } = useToast();
  const { account } = useWeb3();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Filter and sort products
  const filteredProducts = products
    ?.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      const price = parseFloat(product.price);
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
      const isActive = product.isActive === "true";
      
      return matchesSearch && matchesCategory && matchesPrice && isActive;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return parseFloat(a.price) - parseFloat(b.price);
        case "price-high":
          return parseFloat(b.price) - parseFloat(a.price);
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    }) || [];

  // Get unique categories
  const categories = Array.from(new Set(products?.map(p => p.category) || []));

  const handleAddToWishlist = async (productId: string) => {
    if (!account) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to add items to wishlist",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest('POST', '/api/wishlists', {
        customerWallet: account,
        productId,
      });
      toast({
        title: "Added to Wishlist",
        description: "Product has been added to your wishlist",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Add",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, customerWallet }: { productId: string; customerWallet: string }) => {
      const response = await apiRequest('POST', '/api/cart/add', {
        customerWallet,
        productId,
        quantity: 1,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Added to Cart",
        description: "Product has been added to your cart",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add",
        description: error.message || "Could not add item to cart",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (productId: string) => {
    if (!account) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to add items to cart",
        variant: "destructive",
      });
      return;
    }

    addToCartMutation.mutate({ productId, customerWallet: account });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Product Catalog</h1>
        <p className="text-muted-foreground">
          Browse our blockchain-powered marketplace
        </p>
      </div>

      {/* Search and Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              data-testid="button-grid-view"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              data-testid="button-list-view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Price Range: ${priceRange[0]} - ${priceRange[1]}
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  min={0}
                  max={1000}
                  step={10}
                  className="mb-2"
                  data-testid="slider-price-range"
                />
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setCategoryFilter("all");
                  setPriceRange([0, 1000]);
                  setSearchQuery("");
                }}
                className="w-full"
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
        </p>
      </div>

      {/* Products Grid/List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-muted" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-6 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search query
            </p>
            <Button onClick={() => {
              setSearchQuery("");
              setCategoryFilter("all");
              setPriceRange([0, 1000]);
            }}>
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToWishlist={handleAddToWishlist}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <ProductListItem
              key={product.id}
              product={product}
              onAddToWishlist={handleAddToWishlist}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onAddToWishlist: (productId: string) => void;
  onAddToCart: (productId: string) => void;
}

function ProductCard({ product, onAddToWishlist, onAddToCart }: ProductCardProps) {
  const inStock = product.stock && parseInt(product.stock) > 0;

  return (
    <Card
      className="group hover:shadow-lg transition-shadow overflow-hidden"
      data-testid={`product-card-${product.id}`}
    >
      <Link href={`/product/${product.id}`}>
        <div className="aspect-square relative overflow-hidden bg-muted cursor-pointer">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          {!inStock && (
            <Badge className="absolute top-2 right-2 bg-red-500">
              Out of Stock
            </Badge>
          )}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              onAddToWishlist(product.id);
            }}
            data-testid={`button-wishlist-${product.id}`}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/product/${product.id}`}>
          <div className="cursor-pointer">
            <Badge variant="secondary" className="mb-2 text-xs">
              {product.category}
            </Badge>
            <h3 className="font-semibold mb-1 line-clamp-2 hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {product.description}
            </p>
          </div>
        </Link>

        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold">${product.price}</span>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            <span className="text-sm">4.5</span>
          </div>
        </div>

        <Button
          className="w-full"
          disabled={!inStock}
          onClick={() => onAddToCart(product.id)}
          data-testid={`button-add-cart-${product.id}`}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {inStock ? "Add to Cart" : "Out of Stock"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ProductListItem({ product, onAddToWishlist, onAddToCart }: ProductCardProps) {
  const inStock = product.stock && parseInt(product.stock) > 0;

  return (
    <Card data-testid={`product-list-${product.id}`}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Link href={`/product/${product.id}`}>
            <div className="w-32 h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0 cursor-pointer">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <Badge variant="secondary" className="mb-2">
                  {product.category}
                </Badge>
                <Link href={`/product/${product.id}`}>
                  <h3 className="font-bold text-xl mb-1 hover:text-primary transition-colors cursor-pointer">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onAddToWishlist(product.id)}
                data-testid={`button-wishlist-list-${product.id}`}
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold">${product.price}</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span>4.5</span>
                  <span className="text-sm text-muted-foreground">(120 reviews)</span>
                </div>
                {!inStock && (
                  <Badge variant="outline" className="text-red-500 border-red-500">
                    Out of Stock
                  </Badge>
                )}
              </div>

              <Button
                disabled={!inStock}
                onClick={() => onAddToCart(product.id)}
                data-testid={`button-add-cart-list-${product.id}`}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {inStock ? "Add to Cart" : "Out of Stock"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
