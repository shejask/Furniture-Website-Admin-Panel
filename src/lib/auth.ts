import { ref, get } from 'firebase/database';
import { database } from './firebase';

// Static credentials - these will be overridden by database check
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = '12345678';

// Vendor credentials - these will be overridden by database check
const VENDOR_EMAIL = 'vendor@shoppinglala.com';
const VENDOR_PASSWORD = '12345678';

// Database credentials removed - now using Firebase database directly

// Local storage keys
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';
const AUTH_EXPIRY_KEY = 'auth_expiry';

// Storage duration (20 days in milliseconds)
const STORAGE_DURATION = 20 * 24 * 60 * 60 * 1000; // 20 days

export interface User {
  id: string;
  email: string;
  username?: string;
  name: string;
  role: 'admin' | 'vendor' | 'user';
  uniqueId?: string;
  password?: string;
  status?: string;
  storeName?: string;
  phone?: string;
  // Additional vendor fields from database
  storeDescription?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankIfscCode?: string;
  ownerName?: string;
  whatsappNumber?: string;
  facebook?: string;
  pinterest?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}

// Generate a simple token
const generateToken = (): string => {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Check if storage has expired
const isStorageExpired = (): boolean => {
  if (typeof window === 'undefined') return true;
  const expiry = localStorage.getItem(AUTH_EXPIRY_KEY);
  if (!expiry) return true;
  return Date.now() > parseInt(expiry);
};

// Suspension checking is now handled in checkVendorCredentials function

// Check vendor credentials in Firebase database
const checkVendorCredentials = async (email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> => {
  try {
    // Get all vendors from Firebase database
    const vendorsRef = ref(database, 'vendors');
    const allVendorsSnapshot = await get(vendorsRef);
    
    if (!allVendorsSnapshot.exists()) {
      return { success: false, error: 'No vendors found in database' };
    }
    
    const allVendors = allVendorsSnapshot.val();
    
    // Find the vendor with matching email and password
    let foundVendor: any = null;
    let vendorId: string | null = null;
    
    for (const [id, vendor] of Object.entries(allVendors)) {
      const vendorData = vendor as any;
      
      if (vendorData.email === email && vendorData.password === password) {
        foundVendor = vendorData;
        vendorId = id;
        break;
      }
    }
    
    if (!foundVendor) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    // Check if vendor is suspended
    if (foundVendor.status === 'suspended') {
      return { success: false, error: 'Your account has been suspended. Please contact support.' };
    }
    
    return {
      success: true,
      user: {
        id: vendorId,
        email: foundVendor.email,
        name: foundVendor.name,
        role: foundVendor.role,
        status: foundVendor.status,
        storeName: foundVendor.storeName,
        phone: foundVendor.phone,
        // Include all additional vendor fields
        storeDescription: foundVendor.storeDescription,
        country: foundVendor.country,
        state: foundVendor.state,
        city: foundVendor.city,
        address: foundVendor.address,
        pincode: foundVendor.pincode,
        gstNumber: foundVendor.gstNumber,
        panNumber: foundVendor.panNumber,
        bankAccountNumber: foundVendor.bankAccountNumber,
        bankName: foundVendor.bankName,
        bankIfscCode: foundVendor.bankIfscCode,
        ownerName: foundVendor.ownerName,
        whatsappNumber: foundVendor.whatsappNumber,
        facebook: foundVendor.facebook,
        pinterest: foundVendor.pinterest,
        instagram: foundVendor.instagram,
        twitter: foundVendor.twitter,
        youtube: foundVendor.youtube,
        createdAt: foundVendor.createdAt,
        updatedAt: foundVendor.updatedAt
      }
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Database connection error: ${errorMessage}` };
  }
};

// Set storage with expiration
const setStorageWithExpiry = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
};

// Set expiration for all auth storage
const setAuthExpiry = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_EXPIRY_KEY, (Date.now() + STORAGE_DURATION).toString());
};

// Clear expired storage
const clearExpiredStorage = (): void => {
  if (typeof window === 'undefined') return;
  if (isStorageExpired()) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  clearExpiredStorage(); // Clear expired storage first
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return !!token && !isStorageExpired();
};

// Get current user
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  clearExpiredStorage(); // Clear expired storage first
  if (isStorageExpired()) return null;
  const userData = localStorage.getItem(USER_DATA_KEY);
  return userData ? JSON.parse(userData) : null;
};

// Sign in function
export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  // First, check Firebase database for vendor credentials
  const dbResult = await checkVendorCredentials(email, password);
  
  if (dbResult.success && dbResult.user) {
    const user: User = {
      id: dbResult.user.id,
      email: dbResult.user.email,
      name: dbResult.user.name,
      role: dbResult.user.role as 'admin' | 'vendor',
      uniqueId: dbResult.user.id,
      password: password,
      status: dbResult.user.status,
      storeName: dbResult.user.storeName,
      phone: dbResult.user.phone,
      // Include all additional vendor fields
      storeDescription: dbResult.user.storeDescription,
      country: dbResult.user.country,
      state: dbResult.user.state,
      city: dbResult.user.city,
      address: dbResult.user.address,
      pincode: dbResult.user.pincode,
      gstNumber: dbResult.user.gstNumber,
      panNumber: dbResult.user.panNumber,
      bankAccountNumber: dbResult.user.bankAccountNumber,
      bankName: dbResult.user.bankName,
      bankIfscCode: dbResult.user.bankIfscCode,
      ownerName: dbResult.user.ownerName,
      whatsappNumber: dbResult.user.whatsappNumber,
      facebook: dbResult.user.facebook,
      pinterest: dbResult.user.pinterest,
      instagram: dbResult.user.instagram,
      twitter: dbResult.user.twitter,
      youtube: dbResult.user.youtube,
      createdAt: dbResult.user.createdAt,
      updatedAt: dbResult.user.updatedAt
    };

    const token = generateToken();
    
    // Store in localStorage with expiration - including all required data
    setStorageWithExpiry(AUTH_TOKEN_KEY, token);
    setStorageWithExpiry(USER_DATA_KEY, JSON.stringify(user));
    setAuthExpiry();

    return {
      success: true,
      user
    };
  }
  
  if (dbResult.error) {
    // If it's a connection error, try fallback credentials
    if (dbResult.error.includes('Database connection error')) {
      // Fallback: Accept any email with correct password for testing
      if (password === '12345678') {
        const user: User = {
          id: 'fallback_admin',
          email: email,
          name: 'Jazeem Alayan',
          role: 'admin',
          uniqueId: 'fallback_admin',
          password: password,
          status: 'active',
          storeName: 'Shopping Lala',
          phone: '1234567890',
          // Include sample data for all fields
          storeDescription: 'SHOPPING LALA IS A GOOD STORE',
          country: 'India',
          state: 'Kerala',
          city: 'Kochi',
          address: '123 Main Street',
          pincode: '682001',
          gstNumber: '111',
          panNumber: '1121',
          bankAccountNumber: '1234567890',
          bankName: 'State Bank of India',
          bankIfscCode: 'SBIN0001234',
          ownerName: 'Mishab',
          whatsappNumber: '7510202251',
          facebook: '',
          pinterest: '',
          instagram: '',
          twitter: '',
          youtube: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const token = generateToken();
        
        setStorageWithExpiry(AUTH_TOKEN_KEY, token);
        setStorageWithExpiry(USER_DATA_KEY, JSON.stringify(user));
        setAuthExpiry();

        return {
          success: true,
          user
        };
      }
    }
    
    return {
      success: false,
      message: dbResult.error
    };
  }

  // Fallback to static credentials if Firebase fails
  // Check static admin credentials
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const user: User = {
      id: '1',
      email: ADMIN_EMAIL,
      name: 'Admin User',
      role: 'admin',
      uniqueId: '1',
      password: password,
      status: 'active',
      storeName: 'Admin Store',
      phone: '1234567890',
      // Include sample data for all fields
      storeDescription: 'Admin Store Description',
      country: 'India',
      state: 'Delhi',
      city: 'New Delhi',
      address: 'Admin Address',
      pincode: '110001',
      gstNumber: 'ADMIN123',
      panNumber: 'ADMINPAN',
      bankAccountNumber: '1111111111',
      bankName: 'Admin Bank',
      bankIfscCode: 'ADMIN0001',
      ownerName: 'Admin Owner',
      whatsappNumber: '9999999999',
      facebook: '',
      pinterest: '',
      instagram: '',
      twitter: '',
      youtube: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const token = generateToken();
    
    setStorageWithExpiry(AUTH_TOKEN_KEY, token);
    setStorageWithExpiry(USER_DATA_KEY, JSON.stringify(user));
    setAuthExpiry();

    return {
      success: true,
      user
    };
  }

  // Check static vendor credentials
  if (email === VENDOR_EMAIL && password === VENDOR_PASSWORD) {
    const user: User = {
      id: '2',
      email: VENDOR_EMAIL,
      name: 'Vendor Demo',
      role: 'vendor',
      uniqueId: '2',
      password: password,
      status: 'active',
      storeName: 'Demo Store',
      phone: '1234567890',
      // Include sample data for all fields
      storeDescription: 'Demo Store Description',
      country: 'India',
      state: 'Maharashtra',
      city: 'Mumbai',
      address: 'Demo Address',
      pincode: '400001',
      gstNumber: 'DEMO123',
      panNumber: 'DEMOPAN',
      bankAccountNumber: '2222222222',
      bankName: 'Demo Bank',
      bankIfscCode: 'DEMO0002',
      ownerName: 'Demo Owner',
      whatsappNumber: '8888888888',
      facebook: '',
      pinterest: '',
      instagram: '',
      twitter: '',
      youtube: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const token = generateToken();
    
    setStorageWithExpiry(AUTH_TOKEN_KEY, token);
    setStorageWithExpiry(USER_DATA_KEY, JSON.stringify(user));
    setAuthExpiry();

    return {
      success: true,
      user
    };
  }

  return {
    success: false,
    message: 'Invalid credentials'
  };
};

// Sign out function
export const signOut = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  localStorage.removeItem(AUTH_EXPIRY_KEY);
};

// Get auth token
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  clearExpiredStorage(); // Clear expired storage first
  if (isStorageExpired()) return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

// Check if user has admin role
export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};

// Check if user has vendor role
export const isVendor = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'vendor';
};

// Manual cleanup function for expired storage
export const cleanupExpiredStorage = (): void => {
  clearExpiredStorage();
};

// Get storage expiry date (for debugging)
export const getStorageExpiryDate = (): Date | null => {
  if (typeof window === 'undefined') return null;
  const expiry = localStorage.getItem(AUTH_EXPIRY_KEY);
  return expiry ? new Date(parseInt(expiry)) : null;
};

// Manual function to set vendor data in localStorage (for testing)
export const setVendorData = (vendorData: Partial<User>): void => {
  if (typeof window === 'undefined') return;
  
  const user: User = {
    id: vendorData.id || 'test_vendor',
    email: vendorData.email || 'test@example.com',
    name: vendorData.name || 'Test Vendor',
    role: vendorData.role || 'vendor',
    uniqueId: vendorData.uniqueId || 'test_vendor',
    password: vendorData.password || '12345678',
    status: vendorData.status || 'active',
    storeName: vendorData.storeName || 'Test Store',
    phone: vendorData.phone || '1234567890'
  };

  const token = generateToken();
  
  setStorageWithExpiry(AUTH_TOKEN_KEY, token);
  setStorageWithExpiry(USER_DATA_KEY, JSON.stringify(user));
  setAuthExpiry();
}; 