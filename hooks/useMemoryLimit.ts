import { useSubscriptionStore } from '@/store/subscriptionStore';

export const useMemoryLimit = () => {
    const { isPro, hasReviewed } = useSubscriptionStore();
    const limit = isPro ? 9999 : (hasReviewed ? 2 : 1);
    
    return limit;
};
