import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { canAccessAdmin, isAuthenticated } from '../../utils/adminUtils';

/**
 * Higher-Order Component to protect admin routes
 * Only allows access to users with admin role
 */
const AdminRoute = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = () => {
      // Check if user is authenticated
      if (!isAuthenticated()) {
        // Redirect to login if not authenticated
        router.push('/auth/login?returnUrl=' + encodeURIComponent(router.asPath));
        return;
      }      // Check if user has admin access
      if (!canAccessAdmin()) {
        // Redirect to no access page
        router.push('/noaccess');
        return;
      }

      // User has access
      setHasAccess(true);
      setIsLoading(false);
    };

    // Small delay to ensure localStorage is available
    const timer = setTimeout(checkAccess, 100);
    
    return () => clearTimeout(timer);
  }, [router]);

  // Show loading spinner while checking access
  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Checking access permissions...</p>
        </div>
        
        <style jsx>{`
          .admin-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0d111f;
            color: white;
          }
          
          .loading-container {
            text-align: center;
          }
          
          .spinner {
            border: 4px solid rgba(255, 255, 255, 0.1);
            border-left: 4px solid #4a5380;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          p {
            margin: 0;
            font-size: 16px;
            opacity: 0.8;
          }
        `}</style>
      </div>
    );
  }

  // Render children only if user has access
  return hasAccess ? children : null;
};

export default AdminRoute;
