import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from 'next/router';
import { useAuth } from '../../utils/auth';
import AccountLockedBanner from '../Alert/AccountLockedBanner';
import { BannerAd } from '../Advertisement';
import { useAdContext } from '../../context/AdContext';

export default function Layout({ children }) {
  const router = useRouter();
  const {  showAccountLockedBanner } = useAuth();
  const { hideHomepageAds } = useAdContext();
  const [showAds, setShowAds] = useState(true);
  
  // Check if current path is an auth page (login or signup)
  const isAuthPage = router.pathname.startsWith('/auth/');
  const isAdminPage = router.pathname.startsWith('/admin/');
  const isMoviePage = router.pathname.startsWith('/movie/');
  // Only show ads on specific pages and if the user is not premium
  useEffect(() => {
    // Don't show ads on auth, admin, account, payment, or noaccess pages
    // Also don't show ads if user has premium benefits
    const shouldShowAds = !isAuthPage && 
                          !isAdminPage && 
                          !router.pathname.startsWith('/account/') &&
                          !router.pathname.startsWith('/payment/') &&
                          router.pathname !== '/noaccess' &&
                          router.pathname !== '/profile' &&
                           router.pathname !== '/premium' &&
                            router.pathname !== '/search' &&
                          !hideHomepageAds;
    console.log('[Layout] Should show ads:', shouldShowAds, 'hideHomepageAds:', hideHomepageAds, 'pathname:', router.pathname);
    setShowAds(shouldShowAds);
  }, [router.pathname, isAuthPage, isAdminPage, hideHomepageAds]);
    // Track scrolling to adjust for fixed-position banner and ads
  useEffect(() => {
    const updateBodyPadding = () => {
      let paddingTop = 0;
      let paddingBottom = 0;
      
      // Account for locked banner
      if (showAccountLockedBanner && !isAuthPage) {
        paddingTop += 120;
      }
      
      // Account for top ad banner if showing
      if (showAds && !isMoviePage) {
        paddingTop += 20; // Just a little spacing, not full height since we want overlay effect
      }
      
      // Account for bottom ad banner if showing
      if (showAds) {
        paddingBottom += 20; // Just a little spacing for bottom content
      }
      
      document.body.style.paddingTop = `${paddingTop}px`;
      document.body.style.paddingBottom = `${paddingBottom}px`;
    };
    
    updateBodyPadding();
    
    return () => {
      document.body.style.paddingTop = '0';
      document.body.style.paddingBottom = '0';
    };
  }, [showAccountLockedBanner, isAuthPage, showAds, isMoviePage]);
  
  return (
    <>
      {!isAuthPage && <Navbar />}
      
      {showAccountLockedBanner && !isAuthPage && <AccountLockedBanner />}
      
      {/* Top banner ad */}
      {showAds && !isMoviePage && <BannerAd position="top" />}
      
      <main>{children}</main>
      
      {/* Bottom banner ad */}
      {showAds && <BannerAd position="bottom" />}
      
      {!isAuthPage && <Footer />}
    </>
  );
}