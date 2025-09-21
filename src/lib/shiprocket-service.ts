import { Order } from '@/features/orders/utils/form-schema';
import { database } from './firebase';
import { ref, get } from 'firebase/database';

export interface ShiprocketOrderData {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_phone?: string;
  order_items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount?: number;
    tax?: number;
    hsn?: number;
  }>;
  payment_method: string;
  shipping_charges: number;
  giftwrap_charges: number;
  transaction_charges: number;
  total_discount: number;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

export interface ShiprocketResponse {
  order_id: string;
  shipment_id: string;
  status: string;
  status_code: number;
  onboarding_completed_now: number;
  awb_code?: string;
  courier_company_id?: number;
  courier_name?: string;
}

export interface ShiprocketError {
  message: string;
  errors?: Record<string, string[]>;
  status_code?: number;
}

interface ProductDimensions {
  length: number;
  breadth: number;
  height: number;
  weight: number;
  deadWeight: number;
}

interface OrderDimensions {
  totalLength: number;
  totalBreadth: number;
  totalHeight: number;
  totalWeight: number;
}

export class ShiprocketService {
  private static baseUrl = 'https://apiv2.shiprocket.in/v1/external';
  private static token: string | null = null;
  private static tokenExpiry: number = 0;

  // Validate required environment variables
  private static validateConfig(): void {
    if (!process.env.SHIPROCKET_EMAIL && !process.env.SHIPROCKET_USERNAME) {
      throw new Error('SHIPROCKET_EMAIL or SHIPROCKET_USERNAME environment variable is required');
    }
    if (!process.env.SHIPROCKET_PASSWORD) {
      throw new Error('SHIPROCKET_PASSWORD environment variable is required');
    }
  }

  // Validate phone number format for Shiprocket
  private static validatePhoneNumber(phone: string): string {
    if (!phone) {
      return '9999999999';
    }
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Shiprocket expects exactly 10 digits for Indian numbers
    if (cleaned.length === 10 && cleaned.match(/^[6-9]\d{9}$/)) {
      return cleaned;
    }
    
    // If it has country code (91), remove it
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      const withoutCountryCode = cleaned.substring(2);
      if (withoutCountryCode.match(/^[6-9]\d{9}$/)) {
        return withoutCountryCode;
      }
    }
    
    // If it has +91 or other formats, try to extract 10 digits
    if (cleaned.length > 10) {
      const last10 = cleaned.slice(-10);
      if (last10.match(/^[6-9]\d{9}$/)) {
        return last10;
      }
    }
    
    // Return a default valid number if validation fails
    return '9999999999';
  }

  // Validate pincode format
  private static validatePincode(pincode: string): string {
    const cleaned = pincode.replace(/\D/g, '');
    if (cleaned.length === 6) {
      return cleaned;
    }
    return '682001'; // Default Kochi pincode
  }

  // Validate email format
  private static validateEmail(email: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      return email;
    }
    return 'noreply@example.com';
  }

  // Format date to YYYY-MM-DD HH:MM:SS
  private static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return date.toISOString().slice(0, 19).replace('T', ' ');
    } catch (error) {
      return new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
  }

  // Fetch product dimensions from database
  private static async fetchProductDimensions(productId: string): Promise<ProductDimensions> {
    try {
      const productRef = ref(database, `products/${productId}`);
      const snapshot = await get(productRef);
      
      if (snapshot.exists()) {
        const product = snapshot.val();
        
        // Parse dimensions string (format: "H 29 x W 20 x D 21" or "120 x 80 x 75")
        let length = 10, breadth = 10, height = 10;
        if (product.dimensions && typeof product.dimensions === 'string') {
          const dimensionStr = product.dimensions.trim();
          
          // Check if it's in "H x x W x x D x" format
          if (dimensionStr.includes('H ') && dimensionStr.includes('W ') && dimensionStr.includes('D ')) {
            // Parse format like "H 29 x W 20 x D 21"
            const heightMatch = dimensionStr.match(/H\s*(\d+(?:\.\d+)?)/i);
            const widthMatch = dimensionStr.match(/W\s*(\d+(?:\.\d+)?)/i);
            const depthMatch = dimensionStr.match(/D\s*(\d+(?:\.\d+)?)/i);
            
            if (heightMatch) height = Math.max(parseFloat(heightMatch[1]) || 10, 1);
            if (widthMatch) breadth = Math.max(parseFloat(widthMatch[1]) || 10, 1);
            if (depthMatch) length = Math.max(parseFloat(depthMatch[1]) || 10, 1);
            
            console.log(`✓ Parsed dimensions for product ${productId}:`, {
              original: dimensionStr,
              parsed: { height: height + 'cm', width: breadth + 'cm', depth: length + 'cm' }
            });
          } else {
            // Parse simple format like "120 x 80 x 75" or "120x80x75"
            const dimensionParts = dimensionStr.split(/\s*[x×]\s*/i);
            if (dimensionParts.length >= 3) {
              length = Math.max(parseFloat(dimensionParts[0]) || 10, 1);
              breadth = Math.max(parseFloat(dimensionParts[1]) || 10, 1);
              height = Math.max(parseFloat(dimensionParts[2]) || 10, 1);
            }
          }
        }
        
        // Parse weight (convert grams to kg)
        const weight = product.weight ? Math.max((parseFloat(product.weight) || 500) / 1000, 0.1) : 0.5;
        const deadWeight = product.deadWeight ? Math.max(parseFloat(product.deadWeight) || 0.5, 0.1) : weight;
        
        return {
          length,
          breadth,
          height,
          weight,
          deadWeight
        };
      }
    } catch (error) {
      console.error(`Error fetching dimensions for product ${productId}:`, error);
    }
    
    // Return default dimensions if product not found or error
    return {
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
      deadWeight: 0.5
    };
  }

  // Calculate combined dimensions for all products in order
  private static async calculateOrderDimensions(order: Order): Promise<OrderDimensions> {
    let totalWeight = 0;
    let totalVolume = 0;
    const productDimensions: ProductDimensions[] = [];

    // Fetch dimensions for all unique products
    const uniqueProductIds = Array.from(new Set(order.items.map(item => item.id)));
    
    for (const productId of uniqueProductIds) {
      const dimensions = await this.fetchProductDimensions(productId);
      productDimensions.push(dimensions);
      
      // Find all items with this product ID
      const itemsWithThisProduct = order.items.filter(item => item.id === productId);
      const totalQuantity = itemsWithThisProduct.reduce((sum, item) => sum + item.quantity, 0);
      
      // Add to total weight (use deadWeight if available, otherwise use weight)
      const itemWeight = Math.max(dimensions.deadWeight, dimensions.weight);
      totalWeight += itemWeight * totalQuantity;
      
      // Add to total volume
      const itemVolume = dimensions.length * dimensions.breadth * dimensions.height;
      totalVolume += itemVolume * totalQuantity;
    }

    // Calculate combined dimensions
    // For simplicity, we'll assume a box-like packing
    // This is a rough approximation - in reality, you'd use more sophisticated packing algorithms
    const cubicRoot = Math.cbrt(totalVolume);
    
    // Ensure minimum dimensions and reasonable proportions
    const totalLength = Math.max(Math.ceil(cubicRoot * 1.2), 10);
    const totalBreadth = Math.max(Math.ceil(cubicRoot * 1.0), 10);
    const totalHeight = Math.max(Math.ceil(cubicRoot * 0.8), 10);
    
    // Ensure minimum weight
    totalWeight = Math.max(totalWeight, 0.1);

    console.log('=== Order Dimensions Calculation ===');
    console.log('Order ID:', order.orderId);
    console.log('Total unique products:', uniqueProductIds.length);
    console.log('Total items:', order.items.reduce((sum, item) => sum + item.quantity, 0));
    console.log('Product dimensions fetched:', productDimensions.length);
    console.log('Total volume (cm³):', totalVolume.toFixed(2));
    console.log('Calculated package dimensions (cm):', { 
      length: totalLength, 
      breadth: totalBreadth, 
      height: totalHeight, 
      weight: totalWeight + 'kg' 
    });
    console.log('====================================');

    return {
      totalLength,
      totalBreadth,
      totalHeight,
      totalWeight
    };
  }

  // Get authentication token
  private static async authenticate(): Promise<string> {
    try {
      // Check if we have a valid token
      if (this.token && Date.now() < this.tokenExpiry) {
        return this.token;
      }

        const email = process.env.SHIPROCKET_EMAIL || process.env.SHIPROCKET_USERNAME || 'hexenwebcreators@gmail.com';
        const password = process.env.SHIPROCKET_PASSWORD || '9qjGFe7u^hGlqii%';
        
        const loginPayload = {
          email,
          password,
        };

      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Shiprocket authentication failed: ${response.status} - ${JSON.stringify(data)}`);
      }

      if (!data.token) {
        throw new Error('No token received from Shiprocket authentication');
      }

      this.token = data.token;
      // Token expires in 10 days, but we'll refresh it after 9 days
      this.tokenExpiry = Date.now() + (9 * 24 * 60 * 60 * 1000);
      
      return data.token;
    } catch (error) {
      console.error('Shiprocket authentication error:', error);
      throw error;
    }
  }

  // Create order in Shiprocket
  static async createOrder(order: Order): Promise<ShiprocketResponse> {
    try {
      const token = await this.authenticate();

      // Validate required order data
      if (!order.orderId) {
        throw new Error('Order ID is required');
      }
      if (!order.items || order.items.length === 0) {
        throw new Error('Order items are required');
      }
      if (!order.userEmail) {
        throw new Error('User email is required');
      }

      // Debug: Log the address data
      // console.log('Order address data:', JSON.stringify(order.address, null, 2));

      // Ensure we have valid address data with robust fallbacks
      const address = order.address || {};
      const firstName = address.firstName || address.addressName || 'Customer';
      const lastName = address.lastName || 'Name';
      
      // Ensure names are not empty and within length limits
      const customerName = firstName.trim().substring(0, 50) || 'Customer';
      const customerLastName = lastName.trim().substring(0, 50) || 'Name';
      
      const streetAddress = (address.streetAddress || address.street || 'Address Required').substring(0, 120);
      const city = (address.city || 'Kochi').substring(0, 50);
      const state = (address.state || 'Kerala').substring(0, 50);
      const country = (address.country || 'India').substring(0, 50);
      
      const pincode = this.validatePincode(address.zip || address.postalCode || '682001');
      const phone = this.validatePhoneNumber(address.phone || '9999999999');
      const email = this.validateEmail(order.userEmail);
      
      // Debug: Log the validated data
      // console.log('Validated data:', { customerName, customerLastName, streetAddress, city, state, country, pincode, phone, email });

      // Calculate order totals
      let calculatedSubtotal = 0;
      const orderItems = order.items.map((item) => {
        const originalPrice = Number(item.price || 0);
        const salePrice = Number(item.salePrice || 0);
        const quantity = Number(item.quantity || 1);
        
        // Determine the actual selling price (use sale price if available and valid, otherwise original price)
        const sellingPrice = (salePrice > 0 && salePrice <= originalPrice) ? salePrice : originalPrice;
        
        // Ensure prices are valid numbers
        if (isNaN(sellingPrice) || sellingPrice <= 0) {
          throw new Error(`Invalid selling price for item: ${item.name}`);
        }
        
        // Calculate discount per unit - CRITICAL: discount must be <= selling price
        // If there's a sale, discount = original - sale, but never more than selling price
        let discountPerUnit = 0;
        if (salePrice > 0 && salePrice < originalPrice) {
          discountPerUnit = Math.min(originalPrice - salePrice, sellingPrice);
        }
        
        calculatedSubtotal += sellingPrice * quantity;
        
        return {
          name: (item.name || 'Product').substring(0, 50),
          sku: (item.id || `item-${Date.now()}`).substring(0, 50),
          units: quantity,
          selling_price: sellingPrice,
          discount: discountPerUnit,
          tax: 0, // You can calculate tax if needed
          hsn: 441122, // Default HSN code, you can make this dynamic
        };
      });

      // Validate numeric fields
      const shippingCharges = Number(order.shipping || 0);
      const totalDiscount = Number(order.discount || 0);
      const subtotal = Number(order.subtotal || calculatedSubtotal);

      // Calculate actual dimensions based on products in the order
      // This replaces the previous hardcoded default dimensions with real product dimensions
      // Dimensions are parsed from database format "H 29 x W 20 x D 21" (cm) and sent to Shiprocket
      const orderDimensions = await this.calculateOrderDimensions(order);

      // Convert our order format to Shiprocket format with guaranteed valid data
      const shiprocketOrder: ShiprocketOrderData = {
        order_id: order.orderId.toString(),
        order_date: this.formatDate(order.createdAt || new Date().toISOString()),
        pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Home',
        billing_customer_name: customerName,
        billing_last_name: customerLastName,
        billing_address: streetAddress,
        billing_city: city,
        billing_pincode: pincode,
        billing_state: state,
        billing_country: country,
        billing_email: email,
        billing_phone: phone,
        shipping_is_billing: true, // Using same address for shipping
        order_items: orderItems,
         payment_method: order.paymentMethod === 'razorpay' ? 'Prepaid' : 'COD',
        shipping_charges: shippingCharges,
        giftwrap_charges: 0,
        transaction_charges: 0,
        total_discount: totalDiscount,
        sub_total: subtotal,
        length: orderDimensions.totalLength,
        breadth: orderDimensions.totalBreadth,
        height: orderDimensions.totalHeight,
        weight: orderDimensions.totalWeight,
      };

      // Debug: Log the Shiprocket payload
      // console.log('Shiprocket payload:', JSON.stringify(shiprocketOrder, null, 2));

      const response = await fetch(`${this.baseUrl}/orders/create/adhoc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(shiprocketOrder),
      });

      const result = await response.json();

      if (!response.ok) {
        const error: ShiprocketError = {
          message: `Shiprocket order creation failed: ${response.status}`,
          errors: result.errors || result.message || result,
          status_code: response.status
        };
        console.error('Shiprocket API error:', error);
        throw new Error(JSON.stringify(error));
      }

      // Log the actual response to understand what Shiprocket is returning (only for debugging)
      // console.error('Shiprocket API Response:', JSON.stringify(result, null, 2));
      
      // Return the result regardless - let the calling code handle the response
      return result;
    } catch (error) {
      console.error('Shiprocket order creation error:', error);
      throw error;
    }
  }

  // Get order tracking information
  static async getTracking(shipmentId: string): Promise<any> {
    try {
      if (!shipmentId) {
        throw new Error('Shipment ID is required for tracking');
      }

      const token = await this.authenticate();

      const response = await fetch(`${this.baseUrl}/courier/track/shipment/${shipmentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Shiprocket tracking failed: ${response.status} - ${JSON.stringify(result)}`);
      }

      return result;
    } catch (error) {
      console.error('Shiprocket tracking error:', error);
      throw error;
    }
  }

  // Cancel shipment
  static async cancelShipment(awbCodes: string | string[]): Promise<any> {
    try {
      const awbArray = Array.isArray(awbCodes) ? awbCodes : [awbCodes];
      
      if (awbArray.length === 0 || awbArray.some(code => !code)) {
        throw new Error('Valid AWB codes are required for cancellation');
      }

      const token = await this.authenticate();

      const response = await fetch(`${this.baseUrl}/orders/cancel/shipment/awbs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          awbs: awbArray,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Shiprocket cancellation failed: ${response.status} - ${JSON.stringify(result)}`);
      }

      return result;
    } catch (error) {
      console.error('Shiprocket cancellation error:', error);
      throw error;
    }
  }

  // Get available courier services for an order
  static async getCourierServices(
    pickupPostcode: string, 
    deliveryPostcode: string, 
    weight: number,
    cod: boolean = false
  ): Promise<any> {
    try {
      if (!pickupPostcode || !deliveryPostcode) {
        throw new Error('Both pickup and delivery postcodes are required');
      }

      const validatedPickupPostcode = this.validatePincode(pickupPostcode);
      const validatedDeliveryPostcode = this.validatePincode(deliveryPostcode);
      const validatedWeight = Math.max(0.1, Number(weight) || 0.5);

      const token = await this.authenticate();

      const codParam = cod ? 1 : 0;
      const url = `${this.baseUrl}/courier/serviceability/?pickup_postcode=${validatedPickupPostcode}&delivery_postcode=${validatedDeliveryPostcode}&weight=${validatedWeight}&cod=${codParam}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Shiprocket serviceability check failed: ${response.status} - ${JSON.stringify(result)}`);
      }

      return result;
    } catch (error) {
      console.error('Shiprocket serviceability error:', error);
      throw error;
    }
  }

  // Helper method to check if token is valid
  static isAuthenticated(): boolean {
    return this.token !== null && Date.now() < this.tokenExpiry;
  }

  // Helper method to clear token (useful for logout or reset)
  static clearAuthentication(): void {
    this.token = null;
    this.tokenExpiry = 0;
  }

  // Get order details by order ID
  static async getOrderDetails(orderId: string): Promise<any> {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const token = await this.authenticate();

      const response = await fetch(`${this.baseUrl}/orders/show/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Failed to fetch order details: ${response.status} - ${JSON.stringify(result)}`);
      }

      return result;
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
  }
}