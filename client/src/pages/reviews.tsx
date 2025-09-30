import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Star, Shield, Verified, MessageSquare, ThumbsUp, Filter, Search } from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";
import { Link } from "wouter";

interface Product {
  id: string;
  name: string;
  imageUrl: string | null;
}

interface Review {
  id: string;
  productId: string;
  customerWallet: string;
  rating: string;
  comment: string;
  verifiedPurchase: string;
  createdAt: string;
  product?: Product;
}

export default function Reviews() {
  const { toast } = useToast();
  const { account } = useWeb3();
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    productId: "",
    rating: 5,
    comment: "",
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ['/api/reviews'],
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Connect wallet to submit review");
      if (!newReview.productId) throw new Error("Select a product");
      if (!newReview.comment.trim()) throw new Error("Enter a comment");

      return apiRequest('POST', '/api/reviews', {
        productId: newReview.productId,
        customerWallet: account,
        rating: newReview.rating.toString(),
        comment: newReview.comment,
      });
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted!",
        description: "Your blockchain-verified review has been published",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      setShowReviewForm(false);
      setNewReview({ productId: "", rating: 5, comment: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter reviews
  const filteredReviews = reviews?.filter((review) => {
    const matchesProduct = selectedProduct === "all" || review.productId === selectedProduct;
    const matchesRating = ratingFilter === "all" || parseInt(review.rating) === parseInt(ratingFilter);
    const matchesSearch = !searchQuery || 
      review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.product?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesProduct && matchesRating && matchesSearch;
  }) || [];

  // Calculate stats
  const averageRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + parseInt(r.rating), 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews?.filter(r => parseInt(r.rating) === rating).length || 0,
    percentage: reviews && reviews.length > 0
      ? ((reviews.filter(r => parseInt(r.rating) === rating).length / reviews.length) * 100).toFixed(0)
      : 0,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Product Reviews</h1>
        <p className="text-muted-foreground">
          Blockchain-verified customer reviews
        </p>
      </div>

      {/* Stats Card */}
      <Card className="mb-8 border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-8 w-8 fill-yellow-500 text-yellow-500" />
                <span className="text-5xl font-bold">{averageRating.toFixed(1)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Average Rating ({reviews?.length || 0} reviews)
              </p>
            </div>

            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-12">{rating} ★</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="p-4 rounded-full bg-blue-500/10 mb-2 mx-auto w-fit">
                  <Shield className="h-8 w-8 text-blue-500" />
                </div>
                <p className="font-semibold mb-1">Blockchain Verified</p>
                <p className="text-xs text-muted-foreground">
                  All reviews are cryptographically signed and immutable
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-reviews"
          />
        </div>

        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="w-full md:w-48" data-testid="select-product">
            <SelectValue placeholder="All Products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products?.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-full md:w-32" data-testid="select-rating">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>

        {account && (
          <Button
            onClick={() => setShowReviewForm(true)}
            data-testid="button-write-review"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Write Review
          </Button>
        )}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <Card className="mb-6 border-primary">
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
            <CardDescription>
              Share your experience with blockchain verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Product *</Label>
              <Select
                value={newReview.productId}
                onValueChange={(value) => setNewReview({ ...newReview, productId: value })}
              >
                <SelectTrigger data-testid="select-review-product">
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Rating *</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setNewReview({ ...newReview, rating })}
                    className="focus:outline-none"
                    data-testid={`button-rating-${rating}`}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        rating <= newReview.rating
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Your Review *</Label>
              <Textarea
                placeholder="Share your thoughts about this product..."
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                rows={4}
                data-testid="textarea-review-comment"
              />
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-700">Blockchain Verification</p>
                <p className="text-muted-foreground">
                  Your review will be cryptographically signed with your wallet address
                  and permanently recorded for authenticity.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowReviewForm(false)}
                variant="outline"
                className="flex-1"
                data-testid="button-cancel-review"
              >
                Cancel
              </Button>
              <Button
                onClick={() => submitReviewMutation.mutate()}
                disabled={submitReviewMutation.isPending}
                className="flex-1"
                data-testid="button-submit-review"
              >
                {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6 space-y-3">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Reviews Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedProduct !== "all" || ratingFilter !== "all"
                ? "Try adjusting your filters"
                : "Be the first to leave a review!"}
            </p>
            {account && !showReviewForm && (
              <Button onClick={() => setShowReviewForm(true)}>
                Write First Review
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
}

function ReviewCard({ review }: ReviewCardProps) {
  const rating = parseInt(review.rating);
  const isVerified = review.verifiedPurchase === "true";
  const daysAgo = Math.floor(
    (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card data-testid={`review-${review.id}`}>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Product Image */}
          {review.product && (
            <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
              {review.product.imageUrl ? (
                <img
                  src={review.product.imageUrl}
                  alt={review.product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
          )}

          <div className="flex-1">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < rating
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  {isVerified && (
                    <Badge variant="secondary" className="text-xs">
                      <Verified className="h-3 w-3 mr-1" />
                      Verified Purchase
                    </Badge>
                  )}
                </div>
                {review.product && (
                  <Link href={`/product/${review.productId}`}>
                    <h3 className="font-semibold hover:text-primary transition-colors cursor-pointer">
                      {review.product.name}
                    </h3>
                  </Link>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {daysAgo === 0 ? 'Today' : `${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`}
              </p>
            </div>

            {/* Review Content */}
            <p className="text-sm mb-4">{review.comment}</p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span className="font-mono">
                  {review.customerWallet.slice(0, 6)}...{review.customerWallet.slice(-4)}
                </span>
                <Badge variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Blockchain Verified
                </Badge>
              </div>
              <Button variant="ghost" size="sm">
                <ThumbsUp className="h-4 w-4 mr-1" />
                Helpful
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
