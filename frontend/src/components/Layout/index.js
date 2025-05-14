import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from 'next/router';
import { useAuth } from '../../utils/auth';
import authService from '../../API/services/authService';
import AccountLockedBanner from '../Alert/AccountLockedBanner';

export default function Layout({ children }) {
  const router = useRouter();
  const { isAuthenticated, isAccountLocked, showAccountLockedBanner } = useAuth();
  
  // Check if current path is an auth page (login or signup)
  const isAuthPage = router.pathname.startsWith('/auth/');
  
  // Track scrolling to adjust for fixed-position banner
  useEffect(() => {
    if (showAccountLockedBanner && !isAuthPage) {
      // Add padding to the top of the body to prevent content from hiding under the banner
      document.body.style.paddingTop = '120px';
      return () => {
        document.body.style.paddingTop = '0';
      };
    }
  }, [showAccountLockedBanner, isAuthPage]);
  
  return (
    <>
      {!isAuthPage && <Navbar />}
      
      {showAccountLockedBanner && !isAuthPage && <AccountLockedBanner />}
      
      <main>{children}</main>
      
      {!isAuthPage && <Footer />}
    </>
  );
}