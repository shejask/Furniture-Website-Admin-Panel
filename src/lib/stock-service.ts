import { ref, get, update } from 'firebase/database';
import { database } from './firebase';
import { Order } from '@/features/orders/utils/form-schema';

export interface StockUpdateResult {
  success: boolean;
  updatedProducts: string[];
  errors: Array<{
    productId: string;
    error: string;
  }>;
  insufficientStock: Array<{
    productId: string;
    requested: number;
    available: number;
  }>;
}

export class StockService {
  // Check if an order can be fulfilled (sufficient stock for all items)
  static async checkOrderStock(order: Order): Promise<{
    canFulfill: boolean;
    insufficientStock: Array<{
      productId: string;
      requested: number;
      available: number;
    }>;
    errors: Array<{
      productId: string;
      error: string;
    }>;
  }> {
    const result = {
      canFulfill: true,
      insufficientStock: [] as Array<{
        productId: string;
        requested: number;
        available: number;
      }>,
      errors: [] as Array<{
        productId: string;
        error: string;
      }>,
    };

    try {
      // Check if all items have sufficient stock
      const stockCheckResults = await Promise.all(
        order.items.map(item => this.checkProductStock(item.id, item.quantity))
      );

      // Identify items with insufficient stock
      stockCheckResults.forEach((stockCheck, index) => {
        if (!stockCheck.sufficient) {
          result.insufficientStock.push({
            productId: order.items[index].id,
            requested: order.items[index].quantity,
            available: stockCheck.available,
          });
          result.canFulfill = false;
        }
      });

      return result;
    } catch (error) {
      // console.error('Error checking stock for order:', error);
      result.canFulfill = false;
      result.errors.push({
        productId: 'GENERAL',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return result;
    }
  }

  // Reduce stock for all items in an order
  static async reduceStockForOrder(order: Order): Promise<StockUpdateResult> {
    const result: StockUpdateResult = {
      success: true,
      updatedProducts: [],
      errors: [],
      insufficientStock: [],
    };

    try {
      // First, check if all items have sufficient stock
      const stockCheckResults = await Promise.all(
        order.items.map(item => this.checkProductStock(item.id, item.quantity))
      );

      // Identify items with insufficient stock
      stockCheckResults.forEach((stockCheck, index) => {
        if (!stockCheck.sufficient) {
          result.insufficientStock.push({
            productId: order.items[index].id,
            requested: order.items[index].quantity,
            available: stockCheck.available,
          });
        }
      });

      // If any item has insufficient stock, don't proceed
      if (result.insufficientStock.length > 0) {
        result.success = false;
        return result;
      }

      // Reduce stock for each item
      const updatePromises = order.items.map(item => 
        this.reduceProductStock(item.id, item.quantity)
      );

      const updateResults = await Promise.all(updatePromises);

      updateResults.forEach((updateResult, index) => {
        if (updateResult.success) {
          result.updatedProducts.push(order.items[index].id);
        } else {
          result.errors.push({
            productId: order.items[index].id,
            error: updateResult.error || 'Unknown error',
          });
          result.success = false;
        }
      });

      return result;
    } catch (error) {
      // console.error('Error reducing stock for order:', error);
      result.success = false;
      result.errors.push({
        productId: 'GENERAL',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return result;
    }
  }

  // Check if a product has sufficient stock
  private static async checkProductStock(productId: string, requestedQuantity: number): Promise<{
    sufficient: boolean;
    available: number;
  }> {
    try {
      const productRef = ref(database, `products/${productId}`);
      const snapshot = await get(productRef);

      if (!snapshot.exists()) {
        return { sufficient: false, available: 0 };
      }

      const product = snapshot.val();
      const currentStock = product.stockQuantity || product.stock || 0;

      return {
        sufficient: currentStock >= requestedQuantity,
        available: currentStock,
      };
    } catch (error) {
      // console.error(`Error checking stock for product ${productId}:`, error);
      return { sufficient: false, available: 0 };
    }
  }

  // Reduce stock for a single product
  private static async reduceProductStock(productId: string, quantity: number): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const productRef = ref(database, `products/${productId}`);
      const snapshot = await get(productRef);

      if (!snapshot.exists()) {
        return { success: false, error: 'Product not found' };
      }

      const product = snapshot.val();
      const currentStock = product.stockQuantity || product.stock || 0;

      if (currentStock < quantity) {
        return { 
          success: false, 
          error: `Insufficient stock. Available: ${currentStock}, Requested: ${quantity}` 
        };
      }

      const newStock = currentStock - quantity;

      // Update both stockQuantity and stock fields for compatibility
      const updates: {
        stockQuantity: number;
        stock: number;
        updatedAt: string;
        stockStatus?: string;
      } = {
        stockQuantity: newStock,
        stock: newStock,
        updatedAt: new Date().toISOString(),
      };

      // If stock becomes 0, update stock status
      if (newStock === 0) {
        updates.stockStatus = 'out_of_stock';
      }

      await update(productRef, updates);

      return { success: true };
    } catch (error) {
      // console.error(`Error reducing stock for product ${productId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Restore stock for an order (in case of cancellation)
  static async restoreStockForOrder(order: Order): Promise<StockUpdateResult> {
    const result: StockUpdateResult = {
      success: true,
      updatedProducts: [],
      errors: [],
      insufficientStock: [],
    };

    try {
      const updatePromises = order.items.map(item => 
        this.restoreProductStock(item.id, item.quantity)
      );

      const updateResults = await Promise.all(updatePromises);

      updateResults.forEach((updateResult, index) => {
        if (updateResult.success) {
          result.updatedProducts.push(order.items[index].id);
        } else {
          result.errors.push({
            productId: order.items[index].id,
            error: updateResult.error || 'Unknown error',
          });
          result.success = false;
        }
      });

      return result;
    } catch (error) {
      // console.error('Error restoring stock for order:', error);
      result.success = false;
      result.errors.push({
        productId: 'GENERAL',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return result;
    }
  }

  // Restore stock for a single product
  private static async restoreProductStock(productId: string, quantity: number): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const productRef = ref(database, `products/${productId}`);
      const snapshot = await get(productRef);

      if (!snapshot.exists()) {
        return { success: false, error: 'Product not found' };
      }

      const product = snapshot.val();
      const currentStock = product.stockQuantity || product.stock || 0;
      const newStock = currentStock + quantity;

      // Update both stockQuantity and stock fields for compatibility
      const updates: {
        stockQuantity: number;
        stock: number;
        updatedAt: string;
        stockStatus?: string;
      } = {
        stockQuantity: newStock,
        stock: newStock,
        updatedAt: new Date().toISOString(),
      };

      // If stock was 0 and now has stock, update status
      if (currentStock === 0 && newStock > 0) {
        updates.stockStatus = 'in_stock';
      }

      await update(productRef, updates);

      return { success: true };
    } catch (error) {
      // console.error(`Error restoring stock for product ${productId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get current stock level for a product
  static async getProductStock(productId: string): Promise<{
    stock: number;
    status: string;
    exists: boolean;
  }> {
    try {
      const productRef = ref(database, `products/${productId}`);
      const snapshot = await get(productRef);

      if (!snapshot.exists()) {
        return { stock: 0, status: 'not_found', exists: false };
      }

      const product = snapshot.val();
      const stock = product.stockQuantity || product.stock || 0;
      const status = product.stockStatus || (stock > 0 ? 'in_stock' : 'out_of_stock');

      return { stock, status, exists: true };
    } catch (error) {
      // console.error(`Error getting stock for product ${productId}:`, error);
      return { stock: 0, status: 'error', exists: false };
    }
  }
}
