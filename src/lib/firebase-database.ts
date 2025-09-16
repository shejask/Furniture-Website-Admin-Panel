import { 
  ref, 
  set, 
  get, 
  push, 
  update, 
  remove, 
  onValue, 
  off, 
  query, 
  orderByChild, 
  equalTo,
  limitToFirst,
  startAt,
  endAt,
  type DatabaseReference,
  type Query
} from 'firebase/database';
import { database } from './firebase';

// Types for database operations
export interface DatabaseNode {
  [key: string]: any;
}

// Create or update a record
export const setData = async (path: string, data: any): Promise<void> => {
  try {
    const dbRef = ref(database, path);
    await set(dbRef, data);
  } catch (error) {
    // Log error for debugging but don't expose to client
    throw error;
  }
};

// Get a single record
export const getData = async (path: string): Promise<any> => {
  try {
    const dbRef = ref(database, path);
    const snapshot = await get(dbRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    // Log error for debugging but don't expose to client
    throw error;
  }
};

// Add a new record with auto-generated key
export const pushData = async (path: string, data: any): Promise<string> => {
  try {
    const dbRef = ref(database, path);
    const newRef = push(dbRef);
    await set(newRef, data);
    return newRef.key!;
  } catch (error) {
    // Log error for debugging but don't expose to client
    throw error;
  }
};

// Update specific fields
export const updateData = async (path: string, updates: any): Promise<void> => {
  try {
    const dbRef = ref(database, path);
    await update(dbRef, updates);
  } catch (error) {
    // Log error for debugging but don't expose to client
    throw error;
  }
};

// Delete a record
export const deleteData = async (path: string): Promise<void> => {
  try {
    console.log('deleteData called with path:', path);
    const dbRef = ref(database, path);
    console.log('Database reference created:', dbRef.toString());
    await remove(dbRef);
    console.log('Data successfully deleted from path:', path);
  } catch (error) {
    console.error('Error in deleteData for path:', path, error);
    // Log error for debugging but don't expose to client
    throw error;
  }
};

// Listen to real-time changes
export const subscribeToData = (
  path: string, 
  callback: (data: any) => void,
  errorCallback?: (error: any) => void
): (() => void) => {
  const dbRef = ref(database, path);
  
  const unsubscribe = onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  }, errorCallback);

  // Return unsubscribe function
  return () => {
    off(dbRef, 'value', unsubscribe);
  };
};

// Query data with filters
export const queryData = async (
  path: string,
  options?: {
    orderBy?: string;
    equalTo?: any;
    limit?: number;
    startAt?: any;
    endAt?: any;
  }
): Promise<any[]> => {
  try {
    let dbRef: DatabaseReference | Query = ref(database, path);
    
    if (options) {
      let queryRef = query(dbRef);
      
      if (options.orderBy) {
        queryRef = query(queryRef, orderByChild(options.orderBy));
      }
      
      if (options.equalTo !== undefined) {
        queryRef = query(queryRef, equalTo(options.equalTo));
      }
      
      if (options.limit) {
        queryRef = query(queryRef, limitToFirst(options.limit));
      }
      
      if (options.startAt !== undefined) {
        queryRef = query(queryRef, startAt(options.startAt));
      }
      
      if (options.endAt !== undefined) {
        queryRef = query(queryRef, endAt(options.endAt));
      }
      
      dbRef = queryRef;
    }
    
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Convert object to array if it's an object
      return Array.isArray(data) ? data : Object.values(data);
    }
    return [];
  } catch (error) {
    // Log error for debugging but don't expose to client
    throw error;
  }
};

// Batch operations
export const batchUpdate = async (updates: { [path: string]: any }): Promise<void> => {
  try {
    await update(ref(database), updates);
  } catch (error) {
    // Log error for debugging but don't expose to client
    throw error;
  }
}; 