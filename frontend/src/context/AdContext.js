// Ad Context to manage advertisement visibility based on user subscriptions
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import subscriptionService from '../API/services/subscriptionService';

// Create the context with default values
const AdContext = createContext({
  hideHomepageAds: false,
  hideVideoAds: false,
  isLoading: true,
  packageType: null,
  hasActiveSubscription: false,
});

// Export custom hook for easy access to the context
export const useAdContext = () => useContext(AdContext);

export const AdContextProvider = ({ children }) => {
  const router = useRouter();
  
  // State to track ad visibility settings with proper defaults
  const [adSettings, setAdSettings] = useState({
    hideHomepageAds: false,
    hideVideoAds: false,
    isLoading: true,
    packageType: null,
    hasActiveSubscription: false,
  });
  
  // Track authentication status
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Sử dụng ref để theo dõi việc fetch benefits
  const isFetchingRef = useRef(false);
  const benefitsTimeoutRef = useRef(null);

  // Check if current page should never show ads
  const isNoAccessPage = router.pathname === '/noaccess';

  // Check if user is authenticated - và chỉ chạy 1 lần khi mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('authToken');
      const isNowAuthenticated = !!token;
      
      setIsAuthenticated(prevState => {
        if (prevState !== isNowAuthenticated) {
          console.log(`[AdContext] Authentication status changed: ${prevState} → ${isNowAuthenticated}`);
          return isNowAuthenticated; // Chỉ cập nhật nếu trạng thái thay đổi
        }
        return prevState;
      });
    };
    
    // Initial check
    checkAuth();
    
    // Set up listener for storage changes (in case token is updated in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'auth_token' || e.key === 'token' || e.key === 'authToken') {
        console.log(`[AdContext] Storage event detected for ${e.key}`);
        checkAuth();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      // Xóa timeout khi unmount
      if (benefitsTimeoutRef.current) {
        clearTimeout(benefitsTimeoutRef.current);
      }
    };
  }, []); // Không phụ thuộc isAuthenticated để tránh render loop

  // Fetch subscription status and ad benefits on component mount or auth changes
  useEffect(() => {
    // Keep track of retry attempts
    let retryCount = 0;
    const MAX_RETRIES = 3;
    let isComponentMounted = true; // Theo dõi component có còn mounted không
    
    const fetchSubscriptionBenefits = async () => {
      // Tránh fetch đồng thời nhiều lần
      if (isFetchingRef.current) {
        console.log('[AdContext] Already fetching benefits, skipping duplicate request');
        return;
      }
      
      isFetchingRef.current = true;
      
      // Set loading state
      if (isComponentMounted) {
        setAdSettings(prev => ({ ...prev, isLoading: true }));
      }
      
      try {
        // Only attempt to fetch benefits if authenticated
        if (!isAuthenticated) {
          console.log('[AdContext] Not authenticated, skipping benefits check');
          if (isComponentMounted) {
            setAdSettings(prev => ({ 
              ...prev,
              hideHomepageAds: false,
              hideVideoAds: false, 
              isLoading: false,
              packageType: null,
              hasActiveSubscription: false
            }));
          }
          isFetchingRef.current = false;
          return;
        }
        
        console.log('[AdContext] Fetching ad benefits from API...', new Date().toISOString());
        
        // Get subscription benefits from API
        const benefits = await subscriptionService.getUserAdBenefits();
        
        // Check if component still mounted
        if (!isComponentMounted) {
          console.log('[AdContext] Component unmounted during API fetch, abandoning update');
          isFetchingRef.current = false;
          return;
        }
          // Check if we got an auth error
        if (benefits.authError) {
          console.warn('[AdContext] Authentication error detected');
          if (retryCount < MAX_RETRIES) {
            // Try again after a delay
            retryCount++;
            console.log(`[AdContext] Will retry in 2 seconds (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            benefitsTimeoutRef.current = setTimeout(fetchSubscriptionBenefits, 2000);
            return;
          } else {
            console.error('[AdContext] Max retries reached, giving up');
          }
        }
        
        // Kiểm tra đặc biệt cho gói premium 15k
        const isPremium15k = benefits.isPremium15k === true || benefits.packageType === '682f7d849c310399aa715c9d';
        
        if (isPremium15k) {
          console.log('%c[AdContext] PREMIUM 15K PACKAGE DETECTED!', 'color: #FF0000; font-size: 16px; font-weight: bold');
        }
        
        // Đảm bảo các giá trị boolean là đúng kiểu
        const hideHomepageAds = benefits.hideHomepageAds === true || isPremium15k;
        const hideVideoAds = benefits.hideVideoAds === true || isPremium15k;
        const hasActiveSubscription = benefits.hasActiveSubscription === true;
        
        // Log chi tiết về quyền lợi cho việc debug
        console.log(`[AdContext] ✅ Benefits received - hideHomepageAds: ${hideHomepageAds}, hideVideoAds: ${hideVideoAds}`);
        console.log(`[AdContext] 📦 Package type: ${benefits.packageType || 'None'}, Active sub: ${hasActiveSubscription}`);
        
        // Update state with benefits data
        if (isComponentMounted) {
          setAdSettings({
            hideHomepageAds: hideHomepageAds,
            hideVideoAds: hideVideoAds,
            packageType: benefits.packageType,
            hasActiveSubscription: hasActiveSubscription,
            isLoading: false,
            lastUpdated: new Date().toISOString()
          });
        }
        
        console.log('[AdContext] Ad settings updated successfully');
        // Reset retry counter upon success
        retryCount = 0;
      } catch (error) {
        console.error('[AdContext] Failed to fetch ad benefits:', error);
        
        // Retry logic for network errors
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          const delay = 1000 * Math.pow(2, retryCount); // Exponential backoff
          console.log(`[AdContext] Network error, retrying in ${delay/1000} seconds (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          
          if (isComponentMounted) {
            benefitsTimeoutRef.current = setTimeout(fetchSubscriptionBenefits, delay);
          }
        } else {
          // Set loading to false after max retries
          if (isComponentMounted) {
            setAdSettings(prev => ({ ...prev, isLoading: false }));
          }
        }
      } finally {
        isFetchingRef.current = false; // Reset fetching flag
      }
    };

    // Bắt đầu fetch quyền lợi
    fetchSubscriptionBenefits();
    
    // Refresh subscription benefits every 15 minutes (reduced from hourly)
    const refreshInterval = setInterval(fetchSubscriptionBenefits, 15 * 60 * 1000);
    
    // Cleanup function
    return () => {
      isComponentMounted = false; // Component đã unmount
      clearInterval(refreshInterval);
      if (benefitsTimeoutRef.current) {
        clearTimeout(benefitsTimeoutRef.current);
      }
    };
  }, [isAuthenticated]); // Phụ thuộc vào trạng thái xác thực  // Apply overrides for special pages that should never show ads
  const finalAdSettings = {
    ...adSettings,
    // Force hide all ads on noaccess page
    hideHomepageAds: isNoAccessPage ? true : adSettings.hideHomepageAds,
    hideVideoAds: isNoAccessPage ? true : adSettings.hideVideoAds,
  };

  return (
    <AdContext.Provider value={finalAdSettings}>
      {children}
    </AdContext.Provider>
  );
};

export default AdContextProvider;