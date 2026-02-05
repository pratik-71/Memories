import { Platform } from 'react-native';
import Purchases, {
    CustomerInfo,
    PurchasesOffering,
    PurchasesPackage
} from 'react-native-purchases';

const API_KEYS = {
  apple: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY || 'appl_placeholder',
  google: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY || 'goog_placeholder',
};

class RevenueCatService {
  /**
   * Initialize RevenueCat SDK
   */
  static async init() {
    // Purchases.setLogLevel(LOG_LEVEL.DEBUG);

    if (Platform.OS === 'ios') {
       if (API_KEYS.apple) Purchases.configure({ apiKey: API_KEYS.apple });
    } else if (Platform.OS === 'android') {
       if (API_KEYS.google) Purchases.configure({ apiKey: API_KEYS.google });
    }
  }

  /**
   * Get the current offerings configured in RevenueCat
   */
  static async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      console.log("📦 [RevenueCat] ALL Offerings fetched:", JSON.stringify(offerings, null, 2));
      
      if (offerings.current !== null) {
        console.log("✅ [RevenueCat] Current Offering found:", offerings.current.identifier);
        return offerings.current;
      } else {
        console.warn("⚠️ [RevenueCat] No 'current' offering configured in RevenueCat dashboard.");
      }
      return null;
    } catch (e) {
      console.error('Error getting offerings', e);
      return null;
    }
  }

  /**
   * Purchase a specific package
   */
  static async purchasePackage(pack: PurchasesPackage): Promise<CustomerInfo | null> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pack);
      return customerInfo;
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('Error purchasing package', e);
      }
      return null;
    }
  }

  /**
   * Restore previous purchases
   */
  static async restorePurchases(): Promise<CustomerInfo | null> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (e) {
      console.error('Error restoring purchases', e);
      return null;
    }
  }
  
  /**
   * Get current customer info
   */
  static async getCustomerInfo(): Promise<CustomerInfo | null> {
      try {
          const customerInfo = await Purchases.getCustomerInfo();
          return customerInfo;
      } catch (e) {
          console.error("Error getting customer info", e)
          return null;
      }
  }
  /**
   * Log in a user with a specific App User ID (Supabase ID)
   */
  static async logIn(userId: string, email?: string): Promise<CustomerInfo | null> {
      try {
          const { customerInfo } = await Purchases.logIn(userId);
          if (email) {
              await Purchases.setEmail(email);
          }
          console.log("✅ [RevenueCat] Logged in as:", userId, email ? `(${email})` : "");
          return customerInfo;
      } catch (e) {
          console.error("❌ [RevenueCat] Error logging in:", e);
          return null;
      }
  }

  /**
   * Log out the current user
   */
  static async logOut(): Promise<CustomerInfo | null> {
      try {
          const customerInfo = await Purchases.logOut();
          console.log("👋 [RevenueCat] Logged out");
          return customerInfo;
      } catch (e) {
          console.error("❌ [RevenueCat] Error logging out:", e);
          return null;
      }
  }
}

export default RevenueCatService;
