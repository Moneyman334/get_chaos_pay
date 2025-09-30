import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, AlertCircle } from "lucide-react";

interface ProductVariant {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  priceAdjustment: string;
  stockQuantity: string;
  isActive: string;
}

interface ProductVariantsProps {
  productId: string;
  basePrice: number;
  onVariantSelect?: (variant: ProductVariant | null) => void;
  className?: string;
}

export function ProductVariants({
  productId,
  basePrice,
  onVariantSelect,
  className,
}: ProductVariantsProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  const { data: variants, isLoading } = useQuery<ProductVariant[]>({
    queryKey: ['/api/products', productId, '/variants'],
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
    );
  }

  if (!variants || variants.length === 0) {
    return null;
  }

  // Extract all unique attribute types and their values
  const attributeTypes = new Set<string>();
  const attributeValues: Record<string, Set<string>> = {};

  variants.forEach((variant) => {
    if (variant.attributes) {
      Object.entries(variant.attributes).forEach(([key, value]) => {
        attributeTypes.add(key);
        if (!attributeValues[key]) {
          attributeValues[key] = new Set();
        }
        attributeValues[key].add(value);
      });
    }
  });

  // Find the matching variant based on selected attributes
  const matchingVariant = variants.find((variant) => {
    if (!variant.attributes) return false;
    return Object.entries(selectedAttributes).every(
      ([key, value]) => variant.attributes[key] === value
    );
  });

  // Calculate final price
  const finalPrice = matchingVariant
    ? basePrice + parseFloat(matchingVariant.priceAdjustment)
    : basePrice;

  const handleAttributeSelect = (type: string, value: string) => {
    const newSelected = { ...selectedAttributes, [type]: value };
    setSelectedAttributes(newSelected);

    // Find matching variant
    const variant = variants.find((v) => {
      if (!v.attributes) return false;
      return Object.entries(newSelected).every(
        ([key, val]) => v.attributes[key] === val
      );
    });

    onVariantSelect?.(variant || null);
  };

  const isOptionAvailable = (type: string, value: string): boolean => {
    const testAttributes = { ...selectedAttributes, [type]: value };
    return variants.some((variant) => {
      if (!variant.attributes || variant.isActive !== "true") return false;
      if (parseInt(variant.stockQuantity) <= 0) return false;
      return Object.entries(testAttributes).every(
        ([key, val]) => variant.attributes[key] === val
      );
    });
  };

  return (
    <div className={cn("space-y-6", className)} data-testid="product-variants">
      {/* Variant Selectors */}
      {Array.from(attributeTypes).map((type) => {
        const values = Array.from(attributeValues[type]);
        
        return (
          <div key={type}>
            <Label className="text-base mb-3 block capitalize">
              {type}
              {selectedAttributes[type] && (
                <span className="ml-2 text-muted-foreground font-normal">
                  ({selectedAttributes[type]})
                </span>
              )}
            </Label>

            <div className="flex flex-wrap gap-2">
              {values.map((value) => {
                const isSelected = selectedAttributes[type] === value;
                const isAvailable = isOptionAvailable(type, value);
                
                return (
                  <button
                    key={value}
                    onClick={() => isAvailable && handleAttributeSelect(type, value)}
                    disabled={!isAvailable}
                    className={cn(
                      "relative px-4 py-2 rounded-lg border-2 transition-all",
                      "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary",
                      isSelected && "border-primary bg-primary/10",
                      !isSelected && isAvailable && "border-border hover:border-primary/50",
                      !isAvailable && "opacity-40 cursor-not-allowed"
                    )}
                    data-testid={`variant-option-${type}-${value}`}
                  >
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    <span className="font-medium">{value}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Variant Info */}
      {matchingVariant && (
        <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold">${finalPrice.toFixed(2)}</span>
              {parseFloat(matchingVariant.priceAdjustment) !== 0 && (
                <Badge variant="secondary">
                  {parseFloat(matchingVariant.priceAdjustment) > 0 ? "+" : ""}
                  ${matchingVariant.priceAdjustment}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              {parseInt(matchingVariant.stockQuantity) > 0 ? (
                <>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700">
                    In Stock
                  </Badge>
                  <span className="text-muted-foreground">
                    {matchingVariant.stockQuantity} available
                  </span>
                </>
              ) : (
                <Badge variant="outline" className="bg-red-500/10 text-red-700">
                  Out of Stock
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              SKU: {matchingVariant.sku}
            </p>
          </div>
        </div>
      )}

      {/* Selection Prompt */}
      {!matchingVariant && attributeTypes.size > 0 && (
        <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-600">
            Please select all options to see price and availability
          </p>
        </div>
      )}
    </div>
  );
}
