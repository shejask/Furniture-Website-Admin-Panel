import { useState, useEffect } from 'react';
import { ref, get, child } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Review } from '@/features/reviews/utils/form-schema';

export function useProductReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAllReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, get all products
      const productsRef = ref(database, 'products');
      const productsSnapshot = await get(productsRef);
      
      if (!productsSnapshot.exists()) {
        setReviews([]);
        return;
      }
      
      const products = productsSnapshot.val();
      const allReviews: Review[] = [];
      
      // Iterate through each product to get its reviews
      for (const [productId, productData] of Object.entries(products)) {
        const product = productData as any;
        const reviewsRef = ref(database, `products/${productId}/reviews`);
        const reviewsSnapshot = await get(reviewsRef);
        
        console.log(`Checking product ${productId} for reviews:`, reviewsSnapshot.exists());
        
        if (reviewsSnapshot.exists()) {
          const productReviews = reviewsSnapshot.val();
          console.log(`Found reviews for product ${productId}:`, productReviews);
          
          // Convert each review to the expected format
          for (const [reviewId, reviewData] of Object.entries(productReviews)) {
            const review = reviewData as any;
            console.log(`Processing review ${reviewId}:`, review);
            allReviews.push({
              id: reviewId,
              productId: productId,
              productName: product.name || 'Unknown Product',
              productImage: product.images?.[0] || '',
              customerId: review.userId,
              customerName: review.userName,
              customerEmail: review.userEmail,
              rating: review.rating,
              title: review.title,
              description: review.message,
              status: 'approved', // Default status since it's not in your structure
              helpful: 0, // Default value
              notHelpful: 0, // Default value
              verified: true, // Default to verified since it's a real review
              featured: false, // Default value
              createdAt: review.createdAt,
              updatedAt: review.createdAt, // Use createdAt as updatedAt if not available
              images: review.images || [] // Store review images if available
            });
          }
        }
      }
      
      // Sort by creation date (newest first)
      allReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setReviews(allReviews);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch reviews'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReviews();
  }, []);

  const refetch = () => {
    fetchAllReviews();
  };

  return { reviews, loading, error, refetch };
}
