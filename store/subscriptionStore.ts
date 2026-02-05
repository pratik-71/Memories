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
  subscriptionType: 'Monthly' | 'Yearly' | 'Lifetime' | null;
  expirationDate: string | null;
  
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
      subscriptionType: null,
      expirationDate: null,
      offerings: null,
      isLoading: false,
      isRestoring: false,
      hasReviewed: false,

      setReviewed: () => set({ hasReviewed: true }),

      initialize: async () => {
        set({ isLoading: true });
        try {
            await RevenueCatService.init();
            
            // 1. Get offerings first so they show up immediately
            const offerings = await RevenueCatService.getOfferings();
            set({ offerings });
            
            // 2. Refresh customer info to get latest status (Entitlements)
            const customerInfo = await RevenueCatService.refreshCustomerInfo();
            if (customerInfo) {
                get().updateCustomerInfo(customerInfo);
            }
        } catch (e) {
            // Error silently ignored for production
        } finally {
            set({ isLoading: false });
        }
      },

      updateCustomerInfo: (customerInfo: CustomerInfo) => {
        // Check for "pro" entitlement (check all possible variations)
        const allActiveKeys = Object.keys(customerInfo.entitlements.active);
        const proEntitlementKey = allActiveKeys.find(key => 
          ['pro', 'premium', 'memories pro', 'memories_pro', 'memories-pro'].includes(key.toLowerCase())
        );
        
        const entitlement = proEntitlementKey ? customerInfo.entitlements.active[proEntitlementKey] : null;
        const isPro = !!entitlement;

        let type: 'Monthly' | 'Yearly' | 'Lifetime' | null = null;
        if (entitlement) {
          const id = entitlement.productIdentifier.toLowerCase();
          if (id.includes('lifetime')) type = 'Lifetime';
          else if (id.includes('yearly') || id.includes('annual')) type = 'Yearly';
          else type = 'Monthly';
        }

        set({ 
            isPro: isPro,
            activeProductId: entitlement?.productIdentifier ?? null,
            subscriptionType: type,
            expirationDate: entitlement?.expirationDate ?? null
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
