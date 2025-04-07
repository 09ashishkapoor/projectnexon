const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin with credentials from environment variables
// For production: Use environment variables set in Netlify dashboard
// For local development: Use service account JSON file
let serviceAccount;
try {
  // In production, use environment variables
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Local development fallback - you'll need to provide your own service account file
    console.warn('Warning: Using local service account - not for production use');
    serviceAccount = require('../firebase-service-account.json');
  }
} catch (error) {
  console.error('Error initializing Firebase credentials:', error);
  throw new Error('Failed to initialize Firebase. Check your credentials.');
}

// Initialize Firebase Admin SDK if not already initialized
let app;
if (!admin.apps.length) {
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  app = admin.apps[0];
}

// Get Firestore instance
const db = getFirestore(app);

// Collection name for subscriptions - mimicking the store name from Netlify Blobs
const SUBSCRIPTION_COLLECTION = 'subscriptions';

/**
 * Firebase adapter for subscription operations
 * This provides similar functionality to Netlify Blobs but uses Firestore
 */
const subscriptionStore = {
  // Save subscription data
  set: async (key, value) => {
    try {
      await db.collection(SUBSCRIPTION_COLLECTION).doc(key).set({
        tithis: value,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Firebase set error:', error);
      throw error;
    }
  },
  
  // Get subscription data
  get: async (key) => {
    try {
      const doc = await db.collection(SUBSCRIPTION_COLLECTION).doc(key).get();
      if (doc.exists) {
        return doc.data().tithis;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Firebase get error:', error);
      throw error;
    }
  },
  
  // Delete subscription data
  delete: async (key) => {
    try {
      await db.collection(SUBSCRIPTION_COLLECTION).doc(key).delete();
      return true;
    } catch (error) {
      console.error('Firebase delete error:', error);
      throw error;
    }
  },
  
  // List all subscribers
  list: async () => {
    try {
      const snapshot = await db.collection(SUBSCRIPTION_COLLECTION).get();
      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('Firebase list error:', error);
      throw error;
    }
  }
};

module.exports = {
  admin,
  db,
  subscriptionStore
};