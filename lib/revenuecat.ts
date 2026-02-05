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
  private static isInitialized = false;

  /**
   * Initialize RevenueCat SDK
   */
  static async init() {
    if (this.isInitialized) return;

    // Purchases.setLogLevel(LOG_LEVEL.DEBUG);

    if (Platform.OS === 'ios') {
       if (API_KEYS.apple && API_KEYS.apple !== 'appl_placeholder') {
         Purchases.configure({ apiKey: API_KEYS.apple });
         this.isInitialized = true;
       }
    } else if (Platform.OS === 'android') {
       if (API_KEYS.google && API_KEYS.google !== 'goog_placeholder') {
         Purchases.configure({ apiKey: API_KEYS.google });
         this.isInitialized = true;
       }
    }
  }

  /**
   * Get the current offerings configured in RevenueCat
   */
  static async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null) {
        return offerings.current;
      }
      return null;
    } catch (e) {
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
          return null;
      }
  }

  /**
   * Force refresh customer info from server
   */
  static async refreshCustomerInfo(): Promise<CustomerInfo | null> {
      try {
          await Purchases.invalidateCustomerInfoCache();
          return await this.getCustomerInfo();
      } catch (e) {
          return await this.getCustomerInfo();
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
          return customerInfo;
      } catch (e) {
          return null;
      }
  }

  /**
   * Log out the current user
   */
  static async logOut(): Promise<CustomerInfo | null> {
      try {
          const customerInfo = await Purchases.logOut();
          return customerInfo;
      } catch (e) {
          return null;
      }
  }

  /**
   * Get current App User ID
   */
  static async getAppUserId(): Promise<string> {
      try {
          const appUserId = await Purchases.getAppUserID();
          return appUserId;
      } catch (e) {
          return "unknown";
      }
  }
}

export default RevenueCatService;
