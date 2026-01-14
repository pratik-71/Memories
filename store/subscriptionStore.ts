import RevenueCatService from '@/lib/revenuecat';
import { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { create } from 'zustand';

interface SubscriptionState {
  isPro: boolean;
  offerings: PurchasesOffering | null;
  isLoading: boolean;
  isRestoring: boolean;
  
  initialize: () => Promise<void>;
  updateCustomerInfo: (customerInfo: CustomerInfo) => void;
  purchasePackage: (pack: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isPro: true, // Default to true for everyone
  offerings: null,
  isLoading: false,
  isRestoring: false,

  initialize: async () => {
    set({ isLoading: true });
    try {
        // Init happens in _layout, but we can double check or get offerings here
        // const offerings = await RevenueCatService.getOfferings();
        // const customerInfo = await RevenueCatService.getCustomerInfo();
        
        // if (customerInfo) {
        //     get().updateCustomerInfo(customerInfo);
        // }
        
        // set({ offerings });
    } catch (e) {
        console.error("Subscription store init error", e);
    } finally {
        set({ isLoading: false });
    }
  },

  updateCustomerInfo: (customerInfo: CustomerInfo) => {
    // Check for "pro" entitlement. Replace "pro" with your actual entitlement ID from RevenueCat
    const entitlement = customerInfo.entitlements.active['pro']; 
    // set({ isPro: !!entitlement });
    set({ isPro: true }); // Forced Pro for everyone
  },

  purchasePackage: async (pack: PurchasesPackage) => {
    set({ isLoading: true });
    try {
      const customerInfo = await RevenueCatService.purchasePackage(pack);
      if (customerInfo) {
        get().updateCustomerInfo(customerInfo);
        return true;
      }
      return false;
    } catch (error) {
        console.error("Purchase error", error);
        return false;
    } finally {
      set({ isLoading: false });
    }
  },

  restorePurchases: async () => {
    set({ isRestoring: true });
    try {
      const customerInfo = await RevenueCatService.restorePurchases();
      if (customerInfo) {
        get().updateCustomerInfo(customerInfo);
        return true;
      }
      return false;
    } catch (error) {
        console.error("Restore error", error);
        return false;
    } finally {
      set({ isRestoring: false });
    }
  },
}));
