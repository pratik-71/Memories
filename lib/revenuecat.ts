import { Platform } from 'react-native';
import Purchases, {
    CustomerInfo,
    PurchasesOffering,
    PurchasesPackage
} from 'react-native-purchases';

// NOTE: Replace these with your actual RevenueCat API keys
const API_KEYS = {
  apple: 'test_kQJkXUqJprhvrJwTZHFYHQDWjUb', 
  google: 'test_kQJkXUqJprhvrJwTZHFYHQDWjUb',
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
      if (offerings.current !== null) {
        return offerings.current;
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
}

export default RevenueCatService;
