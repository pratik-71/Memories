import RevenueCatService from '@/lib/revenuecat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SubscriptionState {
  isPro: boolean;
  offerings: PurchasesOffering | null;
  isLoading: boolean;
  isRestoring: boolean;
  hasReviewed: boolean;
  
  activeProductId: string | null;
  
  initialize: () => Promise<void>;
  updateCustomerInfo: (customerInfo: CustomerInfo) => void;
  purchasePackage: (pack: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  setReviewed: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      isPro: false,
      activeProductId: null,
      offerings: null,
      isLoading: false,
      isRestoring: false,
      hasReviewed: false,

      setReviewed: () => set({ hasReviewed: true }),

      initialize: async () => {
        set({ isLoading: true });
        try {
            await RevenueCatService.init();
            const offerings = await RevenueCatService.getOfferings();
            const customerInfo = await RevenueCatService.getCustomerInfo();
            
            if (customerInfo) {
                get().updateCustomerInfo(customerInfo);
            }
            
            set({ offerings });
        } catch (e) {
            console.error("Subscription store init error", e);
        } finally {
            set({ isLoading: false });
        }
      },

      updateCustomerInfo: (customerInfo: CustomerInfo) => {
        // Check for "pro" entitlement.
        const entitlement = customerInfo.entitlements.active['Memories Pro']; 
        set({ 
            isPro: !!entitlement,
            activeProductId: entitlement?.productIdentifier ?? null
        });
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
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ hasReviewed: state.hasReviewed }), // Only persist hasReviewed
    }
  )
);
