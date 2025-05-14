import { useState, useEffect } from 'react';
import Head from 'next/head';

// Hàm helper để thiết lập cookie
const setCookie = (name, value, days) => {
  if (typeof document === 'undefined') return;
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = `; expires=${date.toUTCString()}`;
  }
  document.cookie = `${name}=${value || ''}${expires}; path=/`;
};

// Hàm helper để xóa cookie
const deleteCookie = (name) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// This is a standalone page that doesn't depend on auth context to prevent rendering loops
export default function AccountLockedPage() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Đăng xuất người dùng khi nhấn nút quay lại trang đăng nhập
  const handleLogout = () => {
    console.log("Logout button clicked");
    if (isRedirecting) return;
    
    setIsRedirecting(true);
    
    try {
      // Xóa dữ liệu xác thực
      if (typeof window !== 'undefined') {
        // Xóa cờ tài khoản bị khóa để cho phép đăng nhập lại
        localStorage.removeItem('isAccountLocked');
        deleteCookie('isAccountLocked');
        
        // Xóa tất cả dữ liệu xác thực
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (window.sessionStorage) {
          sessionStorage.removeItem('backendToken');
          sessionStorage.removeItem('user');
        }
        
        // Xóa cookies
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          deleteCookie(name);
        });
        
        console.log("All authentication data cleared. Redirecting to login page...");
        
        // Sử dụng một phương thức khác để chuyển hướng nếu window.location không hoạt động
        setTimeout(() => {
          try {
            // Thử phương thức đầu tiên
            window.location.href = '/auth/login?locked=true';
          } catch (error) {
            console.error("Error redirecting with window.location:", error);
            
            // Thử phương thức thứ hai
            const loginUrl = '/auth/login?locked=true';
            const link = document.createElement('a');
            link.href = loginUrl;
            link.setAttribute('data-redirect', 'forced');
            document.body.appendChild(link);
            link.click();
          }
        }, 300);
      }
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Có lỗi xảy ra khi đăng xuất. Vui lòng tải lại trang.");
    }
  };
  
  // Ngăn chặn yêu cầu dữ liệu liên tục từ Next.js
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Đặt cờ trong localStorage và cookie để các trang khác biết tài khoản bị khóa
    localStorage.setItem('isAccountLocked', 'true');
    setCookie('isAccountLocked', 'true', 7); // Lưu cookie trong 7 ngày
    
    // Chặn điều hướng back
    const preventBackNavigation = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', preventBackNavigation);
    
    // Chặn các yêu cầu Next.js data
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      // Chặn các yêu cầu đến /_next/data
      if (typeof url === 'string' && url.includes('/_next/data')) {
        console.log('Chặn yêu cầu:', url);
        return Promise.resolve(new Response(JSON.stringify({ blocked: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      return originalFetch(url, options);
    };
    
    // Clean up
    return () => {
      window.removeEventListener('popstate', preventBackNavigation);
      window.fetch = originalFetch;
    };
  }, []);
  
  return (
    <>
      <Head>
        <title>Tài khoản đã bị khóa</title>
        <meta name="robots" content="noindex, nofollow" />
        {/* Ngăn chặn Next.js prefetch dữ liệu */}
        <meta name="next-head-count" content="3" />
      </Head>
      
      <div className="account-locked-container">
        <div className="account-locked-card">
          <h1>Tài khoản đã bị khóa</h1>
          
          <p className="locked-message">
            Tài khoản của bạn hiện đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.
          </p>
          
          <button 
            className="login-button" 
            onClick={handleLogout} 
            disabled={isRedirecting}
          >
            {isRedirecting ? 'Đang xử lý...' : 'Quay lại trang đăng nhập'}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .account-locked-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #000000;
          padding: 20px;
        }
        
        .account-locked-card {
          background-color: #e50914;
          padding: 2rem;
          border-radius: 4px;
          max-width: 500px;
          width: 100%;
          color: white;
          text-align: center;
        }
        
        h1 {
          font-size: 1.8rem;
          margin-bottom: 1.5rem;
          font-weight: 700;
        }
        
        .locked-message {
          margin-bottom: 1.5rem;
          font-size: 1rem;
        }
        
        .login-button {
          background-color: white;
          color: black;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .login-button:hover:not(:disabled) {
          background-color: #f8f8f8;
          transform: translateY(-2px);
        }
        
        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}

// Sử dụng getStaticProps thay vì getServerSideProps để tránh yêu cầu liên tục
export async function getStaticProps() {
  return {
    props: {},
  };
}

// Loại bỏ các phụ thuộc layout có thể gây ra việc tải dữ liệu
AccountLockedPage.getLayout = page => page;