// Auth Service API functions
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"; // Update với URL đầy đủ của API

// Thêm xử lý lỗi tốt hơn và kiểm tra API URL
const checkApiConnection = async () => {
  try {
    // Thay đổi từ health-check sang auth/ping vì health-check có thể không tồn tại trong backend
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'HEAD', // Chỉ kiểm tra kết nối, không thực sự gọi API
      headers: { 'Accept': 'application/json' },
      // Timeout sau 5 giây
      signal: AbortSignal.timeout(5000)
    });
    
    console.log('✅ API server response status:', response.status);
    // Kể cả khi status là 401 hoặc 403, điều đó vẫn có nghĩa API server đang chạy
    if (response.status < 500) {
      console.log('✅ API server is running and reachable');
      return true;
    } else {
      console.warn('⚠️ API server returned error:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ API connection failed:', error.message);
    return false;
  }
};

// Kiểm tra kết nối khi trang web được tải
if (typeof window !== 'undefined') {
  checkApiConnection().then(isConnected => {
    if (!isConnected) {
      console.warn('⚠️ API server is not available at:', API_URL);
      // Thông báo cho người dùng
      setTimeout(() => {
        if (document.querySelector('.api-error-warning')) return;
        const warning = document.createElement('div');
        warning.className = 'api-error-warning';
        warning.innerHTML = `
          <div style="position: fixed; bottom: 20px; right: 20px; background: #ff5252; color: white; 
                      padding: 15px; border-radius: 5px; z-index: 9999; max-width: 350px; box-shadow: 0 3px 10px rgba(0,0,0,0.2);">
            <div style="font-weight: bold; margin-bottom: 5px;">Lỗi kết nối máy chủ</div>
            <div>Không thể kết nối tới máy chủ API tại ${API_URL}.</div>
            <div style="margin-top: 10px; font-size: 13px;">
              Lưu ý: Nếu bạn đang chạy máy chủ cục bộ, hãy đảm bảo rằng nó đang chạy và lắng nghe cổng 5000.
            </div>
            <button onclick="this.parentNode.remove()" style="background: rgba(255,255,255,0.3); border: none; color: white; padding: 5px 10px; margin-top: 10px; border-radius: 3px; cursor: pointer;">
              Đóng
            </button>
          </div>
        `;
        document.body.appendChild(warning);
      }, 2000);
    }
  });
}

// Debug API configuration
console.log("Current API URL:", API_URL);
console.log("Environment variables:", {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NODE_ENV: process.env.NODE_ENV
});

const authService = {
  // User login
  login: async (credentials) => {
    try {
      console.group('===== Login Attempt Details =====');
      console.log("Login credentials:", credentials);
      console.log("API URL being used:", API_URL);
      
      // Thử kiểm tra xem backend có đang chạy không
      try {
        const pingResponse = await fetch(`${API_URL}/auth/login`, {
          method: 'HEAD',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(3000)
        });
        console.log("Server ping status:", pingResponse.status, pingResponse.ok ? "OK" : "Failed");
      } catch (pingError) {
        console.error("Server ping failed:", pingError.message);
        console.warn("⚠️ Backend server might not be running!");
      }
      
      // Thực hiện đăng nhập
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(credentials)
      });

      // Log chi tiết response
      console.log("Login response status:", response.status);
      console.log("Login response headers:", Object.fromEntries(response.headers.entries()));

      // First check if the response is ok
      if (!response.ok) {
        // Try to get the error message from the response
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Đăng nhập thất bại';
        let responseText = '';
        
        try {
          responseText = await response.text();
          console.log("Error response raw text:", responseText);
          
          if (contentType && contentType.includes('application/json')) {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorData.message || errorMessage;
            console.error("Error response JSON:", errorData);
          } else if (responseText.includes('<!DOCTYPE')) {
            errorMessage = 'Lỗi kết nối máy chủ. Vui lòng kiểm tra lại API URL.';
            console.error("Received HTML instead of JSON");
          }
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          console.error("Raw response text:", responseText);
        }
        
        console.groupEnd();
        throw new Error(errorMessage);
      }

      // If response is ok, try to parse JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      try {
        const responseText = await response.text();
        console.log("Success response raw text:", responseText);
        
        if (!contentType || !contentType.includes('application/json')) {
          console.error("Non-JSON content type:", contentType);
          throw new Error("Server trả về định dạng không phải JSON");
        }
        
        data = JSON.parse(responseText);
        console.log("Login response data:", data);
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        console.groupEnd();
        throw new Error("Lỗi xử lý dữ liệu từ server. Vui lòng thử lại.");
      }
      
      if (!data.token) {
        console.error("No token in response:", data);
        console.groupEnd();
        throw new Error("Không nhận được token từ server");
      }
      
      // Store auth token in localStorage
      localStorage.setItem("auth_token", data.token);
      
      // Store refresh token in localStorage if available
      if (data.refreshToken) {
        localStorage.setItem("refresh_token", data.refreshToken);
        console.log("Refresh token saved");
      }
      
      // Decode token to get user information
      try {
        const base64Url = data.token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decoded = JSON.parse(jsonPayload);
        console.log("Decoded token:", decoded);
        
        // Lập tức gọi API để lấy thông tin chi tiết của người dùng
        try {
          const userDetailResponse = await fetch(`${API_URL}/auth/user-detail`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${data.token}`,
              "Accept": "application/json",
            }
          });
          
          if (!userDetailResponse.ok) {
            console.warn("Could not fetch user detail information, using basic info from token");
            // Tạo đối tượng user từ thông tin trong token nếu không lấy được chi tiết
            const user = {
              _id: decoded.userId,
              email: decoded.email,
              role: decoded.role,
              accountType: decoded.accountType || 'Normal'
            };
            
            // Lưu thông tin cơ bản về người dùng vào localStorage
            localStorage.setItem("user", JSON.stringify(user));
            
            console.log("Basic user information saved to localStorage:", user);
            console.groupEnd();
            
            return {
              success: true,
              user: user,
              token: data.token
            };
          } else {
            const userDetailData = await userDetailResponse.json();
            console.log("User detail data:", userDetailData);
            
            // Tạo đối tượng user đầy đủ từ thông tin chi tiết
            const fullUser = {
              _id: decoded.userId,
              email: decoded.email,
              role: decoded.role,
              accountType: decoded.accountType || 'Normal',
              fullname: userDetailData.user?.fullname || '',
              address: userDetailData.user?.address || '',
              phone: userDetailData.user?.phone || '',
              date_of_birth: userDetailData.user?.date_of_birth || '',
              bio: userDetailData.user?.bio || '',
              avatar: userDetailData.user?.avatar || '',
              favoriteGenres: userDetailData.user?.favoriteGenres || []
            };
            
            // Lưu thông tin đầy đủ về người dùng vào localStorage
            localStorage.setItem("user", JSON.stringify(fullUser));
            
            console.log("Full user information saved to localStorage:", fullUser);
            console.groupEnd();
            
            return {
              success: true,
              user: fullUser,
              token: data.token
            };
          }
        } catch (userDetailError) {
          console.error("Error fetching user details:", userDetailError);
          
          // Fallback to basic user info if detail fetch fails
          const user = {
            _id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            accountType: decoded.accountType || 'Normal'
          };
          
          localStorage.setItem("user", JSON.stringify(user));
          
          console.log("Basic user information saved to localStorage:", user);
          console.groupEnd();
          
          return {
            success: true,
            user: user,
            token: data.token
          };
        }
      } catch (tokenError) {
        console.error("Error decoding token:", tokenError);
        console.error("Token value:", data.token);
        console.groupEnd();
        throw new Error("Lỗi xử lý token. Token không hợp lệ.");
      }
    } catch (error) {
      console.error("Login error:", error);
      console.groupEnd();
      throw error;
    }
  },
  
  // User registration
  register: async (userData) => {
    try {
      console.log("Registration attempt with:", userData);
      console.log("Using API URL:", API_URL);
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      // First check if the response is ok
      if (!response.ok) {
        // Try to get the error message from the response
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Đăng ký thất bại';
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } else {
          const textData = await response.text();
          console.error("Received non-JSON response:", textData);
          if (textData.includes('<!DOCTYPE')) {
            errorMessage = 'Lỗi kết nối máy chủ. Vui lòng kiểm tra lại API URL.';
          }
        }
        throw new Error(errorMessage);
      }

      // If response is ok, try to parse JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textData = await response.text();
        console.error("Received non-JSON response:", textData);
        throw new Error("Server trả về định dạng không phải JSON. Vui lòng kiểm tra log và cấu hình API.");
      }

      const data = await response.json();
      
      if (!data.message) {
        throw new Error("Không nhận được phản hồi từ server");
      }
      
      console.log("Registration successful:", data);
      return {
        success: true,
        message: data.message,
        data: data
      };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },
  
  // Logout user - updated to clear both localStorage and sessionStorage
  logout: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    
    // Also clear sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem("backendToken");
    }
  },
  
  // Refresh token when main token expires
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      
      const data = await response.json();
      
      if (!data.token) {
        throw new Error('No token in refresh response');
      }
      
      // Update token in localStorage
      localStorage.setItem('auth_token', data.token);
      
      return data.token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // Force logout on refresh token failure
      authService.logout();
      
      throw error;
    }
  },
  
  // Get authorization header with token
  getAuthHeader: async () => {
    try {
      // Try to get token from multiple possible sources
      // First check localStorage (regular login)
      let token = localStorage.getItem('auth_token');
      
      // Then check sessionStorage (Google login)
      if (!token && typeof window !== 'undefined' && window.sessionStorage) {
        token = sessionStorage.getItem('backendToken');
      }
      
      // Then check if user object in localStorage has a token
      if (!token) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user && user.backendToken) {
              token = user.backendToken;
            }
          } catch (e) {
            console.error('Error parsing user from localStorage:', e);
          }
        }
      }
      
      // Check if token is expired by decoding it
      if (token) {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const expiry = payload.exp * 1000; // Convert to milliseconds
          
          // If token is expired or about to expire in the next minute, try to refresh
          if (expiry < Date.now() + 60000) {
            console.log('Token expired or about to expire, refreshing...');
            try {
              token = await authService.refreshToken();
            } catch (refreshError) {
              console.error('Error refreshing token:', refreshError);
              throw new Error('Session expired. Please log in again.');
            }
          }
        }
      }
      
      return { 'Authorization': `Bearer ${token}` };
    } catch (error) {
      console.error('Error getting auth header:', error);
      throw error;
    }
  },
  
  // Check if user is logged in
  isLoggedIn: () => {
    // Check for token in multiple locations
    const token = localStorage.getItem("auth_token") || 
                 (typeof window !== 'undefined' && window.sessionStorage && window.sessionStorage.getItem('backendToken')) ||
                 (() => {
                   try {
                     const user = JSON.parse(localStorage.getItem('user') || '{}');
                     return user?.backendToken;
                   } catch (e) {
                     return null;
                   }
                 })();
    
    return !!token;
  },
  
  // Get current user
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
      return null;
    }
  },
  
  // Update user profile
  updateProfile: async (profileData) => {
    try {
      console.group('===== Profile Update =====');
      console.log("Update profile data:", profileData);

      // Get auth headers with token refresh if needed
      const headers = await authService.getAuthHeader();
      
      // Chuẩn bị dữ liệu cập nhật
      const updateData = {
        fullname: profileData.fullName, // Đổi từ fullName sang fullname để phù hợp với backend
        address: profileData.address,
        phone: profileData.phone,
        date_of_birth: profileData.dateOfBirth, // Đổi từ dateOfBirth sang date_of_birth
        bio: profileData.bio,
        favoriteGenres: profileData.favoriteGenres
      };
      
      console.log("Sending update data:", updateData);
      
      // Gửi request cập nhật thông tin người dùng
      const response = await fetch(`${API_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...headers
        },
        body: JSON.stringify(updateData)
      });
      
      console.log("Update profile response status:", response.status);

      if (!response.ok) {
        // Xử lý lỗi từ server
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Cập nhật thông tin thất bại';
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error("Error response:", errorData);
        } else {
          const textData = await response.text();
          console.error("Received non-JSON error response:", textData);
        }
        
        console.groupEnd();
        throw new Error(errorMessage);
      }

      // Xử lý phản hồi thành công
      const data = await response.json();
      console.log("Update profile success:", data);
      
      // Cập nhật thông tin người dùng trong localStorage với dữ liệu mới
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        fullname: data.user.fullname,
        email: data.user.email,
        phone: data.user.phone || '',
        address: data.user.address || '',
        date_of_birth: data.user.date_of_birth || '',
        bio: data.user.bio || '',
        avatar: data.user.avatar || currentUser.avatar || '',
        favoriteGenres: data.user.favoriteGenres || [],
        
        // Thêm các trường hiển thị cho frontend
        fullName: data.user.fullname,
        dateOfBirth: data.user.date_of_birth
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log("Updated user in localStorage:", updatedUser);
      console.groupEnd();
      
      return {
        success: true,
        message: data.message || 'Cập nhật thông tin thành công',
        user: updatedUser
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      console.groupEnd();
      throw error;
    }
  },

  // Upload avatar
  uploadAvatar: async (file) => {
    try {
      console.log('=== STARTING AVATAR UPLOAD ===');
      console.log('File to upload:', file?.name, file?.type, file?.size);
      
      // Get auth headers with token refresh if needed
      const headers = await authService.getAuthHeader();
      console.log('Auth headers:', headers);
      
      // Tạo FormData để gửi file
      const formData = new FormData();
      formData.append('avatar', file);
      
      // Log để debug
      console.log('FormData created, appended file with name "avatar"');
      
      // Gửi request tải avatar lên - đảm bảo endpoint đúng
      const response = await fetch(`${API_URL}/auth/upload-avatar`, {
        method: 'POST',
        headers: headers, // Chỉ gửi header xác thực, không gửi Content-Type
        body: formData
      });
      
      console.log('Upload response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Xử lý lỗi từ server
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Tải lên avatar thất bại';
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error('Error response:', errorData);
        } else {
          const textData = await response.text();
          console.error('Received non-JSON error response:', textData);
        }
        
        throw new Error(errorMessage);
      }

      // Xử lý phản hồi thành công
      const data = await response.json();
      console.log('Upload avatar success response:', data);
      
      // Cập nhật thông tin người dùng trong localStorage với URL avatar mới
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        avatar: data.avatarUrl || data.user?.avatar
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('Updated user in localStorage:', updatedUser);
      
      return {
        success: true,
        message: data.message || 'Cập nhật avatar thành công',
        avatarUrl: data.avatarUrl || data.user?.avatar,
        user: updatedUser
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  },

  // Get user profile from backend
  getProfile: async () => {
    try {
      // Get auth headers with token refresh if needed
      const headers = await authService.getAuthHeader();

      const response = await fetch(`${API_URL}/auth/user-detail`, {
        headers: headers
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Không thể lấy thông tin người dùng');
      }

      // Cập nhật localStorage với thông tin mới nhất
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data.user;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },
  
  // Change password
  changePassword: async (passwordData) => {
    try {
      console.group('===== Change Password =====');
      console.log("Attempting to change password");

      // Get auth headers with token refresh if needed
      const headers = await authService.getAuthHeader();
      
      // Chuẩn bị dữ liệu
      const dataToSend = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword || passwordData.newPassword
      };
      
      console.log("Sending password change request...");
      
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...headers
        },
        body: JSON.stringify(dataToSend)
      });
      
      console.log("Change password response status:", response.status);

      if (!response.ok) {
        // Xử lý lỗi từ server
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Đổi mật khẩu thất bại';
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error("Error response:", errorData);
        } else {
          const textData = await response.text();
          console.error("Received non-JSON error response:", textData);
        }
        
        console.groupEnd();
        throw new Error(errorMessage);
      }

      // Xử lý phản hồi thành công
      const data = await response.json();
      console.log("Password change successful:", data);
      console.groupEnd();
      
      return {
        success: true,
        message: data.message || 'Đổi mật khẩu thành công'
      };
    } catch (error) {
      console.error('Error changing password:', error);
      console.groupEnd();
      throw error;
    }
  },
  
  // Delete account
  deleteAccount: async () => {
    try {
      // Get auth headers with token refresh if needed
      const headers = await authService.getAuthHeader();
      
      const response = await fetch(`${API_URL}/auth/delete-account`, {
        method: 'DELETE',
        headers: headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Xóa tài khoản thất bại');
      }
      
      // Clear localStorage upon successful account deletion
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      return {
        success: true,
        message: data.message || 'Tài khoản đã được xóa thành công'
      };
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },
  
  // Get user activity history
  getActivityHistory: async () => {
    try {
      // Get auth headers with token refresh if needed
      const headers = await authService.getAuthHeader();
      
      const response = await fetch(`${API_URL}/auth/activity-history`, {
        headers: headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Không thể lấy lịch sử hoạt động');
      }
      
      return data.activities;
    } catch (error) {
      console.error('Error fetching activity history:', error);
      throw error;
    }
  },
  
  // Get user favorites list
  getFavorites: async () => {
    try {
      // Get auth headers with token refresh if needed
      const headers = await authService.getAuthHeader();
      
      const response = await fetch(`${API_URL}/auth/favorites`, {
        headers: headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Không thể lấy danh sách yêu thích');
      }
      
      return data.favorites;
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  },
  
  // Get user watchlist
  getWatchlist: async () => {
    try {
      // Import the watchlist service to use the dedicated service
      const watchlistService = require('./watchlistService').default;
      
      // Use the dedicated watchlist service instead
      return await watchlistService.getWatchlist();
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      throw error;
    }
  },
  
  // Add movie to watchlist
  addToWatchlist: async (movieData) => {
    try {
      // Import the watchlist service to use the dedicated service
      const watchlistService = require('./watchlistService').default;
      
      // Use the dedicated watchlist service instead
      return await watchlistService.addToWatchlist(movieData);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  },
  
  // Remove movie from watchlist
  removeFromWatchlist: async (movieId) => {
    try {
      // Import the watchlist service to use the dedicated service
      const watchlistService = require('./watchlistService').default;
      
      // Use the dedicated watchlist service instead
      return await watchlistService.removeFromWatchlist(movieId);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  },
  
  // Get user statistics
  getStats: async () => {
    try {
      // Get auth headers with token refresh if needed
      const headers = await authService.getAuthHeader();
      
      const response = await fetch(`${API_URL}/auth/stats`, {
        headers: headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Không thể lấy thống kê người dùng');
      }
      
      return data.stats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  },

  // Get user watch statistics
  getUserWatchStats: async () => {
    try {
      console.log('Fetching user watch stats...');
      
      // Get auth headers with token refresh if needed
      const headers = await authService.getAuthHeader();
      
      const response = await fetch(`${API_URL}/user-stats/watch-stats`, {
        headers: headers
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Error ${response.status}: Không thể lấy thống kê xem phim`);
      }
      
      const data = await response.json();
      console.log('User watch stats response:', data);
      
      // Return the data property from the response which contains the actual stats
      return data.data || {};
    } catch (error) {
      console.error('Error fetching user watch stats:', error);
      return {
        totalWatchedMovies: 0,
        totalWatchedSeries: 0,
        totalWatchTime: {
          hours: 0,
          minutes: 0,
          displayText: '0 giờ 0 phút'
        },
        favoriteGenres: []
      };
    }
  },

  // Get user weekly activity
  getUserWeeklyActivity: async () => {
    try {
      console.log('Fetching user weekly activity...');
      
      // Get auth headers with token refresh if needed
      const headers = await authService.getAuthHeader();
      
      const response = await fetch(`${API_URL}/user-stats/weekly-activity`, {
        headers: headers
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Error ${response.status}: Không thể lấy hoạt động hằng tuần`);
      }
      
      const data = await response.json();
      console.log('User weekly activity response:', data);
      
      // Return the data property from the response which contains the actual stats
      return data.data || [0, 0, 0, 0, 0, 0, 0];
    } catch (error) {
      console.error('Error fetching user weekly activity:', error);
      return [0, 0, 0, 0, 0, 0, 0];
    }
  },

  // Get user genre distribution
  getUserGenreDistribution: async () => {
    try {
      console.log('Fetching user genre distribution...');
      
      // Get auth headers with token refresh if needed
      const headers = await authService.getAuthHeader();
      
      const response = await fetch(`${API_URL}/user-stats/genre-distribution`, {
        headers: headers
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Error ${response.status}: Không thể lấy phân bố thể loại`);
      }
      
      const data = await response.json();
      console.log('User genre distribution response:', data);
      
      // Return the data property from the response which contains the actual stats
      return data.data || [];
    } catch (error) {
      console.error('Error fetching user genre distribution:', error);
      return [];
    }
  },

  // Get user achievements
  getUserAchievements: async () => {
    try {
      console.log('Fetching user achievements...');
      
      // Get auth headers with token refresh if needed
      const headers = await authService.getAuthHeader();
      
      const response = await fetch(`${API_URL}/user-stats/achievements`, {
        headers: headers
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Error ${response.status}: Không thể lấy thành tựu người dùng`);
      }
      
      const data = await response.json();
      console.log('User achievements response:', data);
      
      // Return the data property from the response which contains the actual stats
      return data.data || {
        achievements: [],
        stats: {
          moviesWatched: 0,
          seriesWatched: 0,
          userLevel: 'Người mới',
          levelProgress: 0,
          totalLikes: 0,
          totalComments: 0,
          viewCount: 0,
          completedWatchCount: 0
        }
      };
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return {
        achievements: [],
        stats: {
          moviesWatched: 0,
          seriesWatched: 0,
          userLevel: 'Người mới',
          levelProgress: 0,
          totalLikes: 0,
          totalComments: 0,
          viewCount: 0,
          completedWatchCount: 0
        }
      };
    }
  },

  // Check account status
  checkAccountStatus: async () => {
    try {
      console.log('Checking account status...');
      
      // Get auth headers with token refresh if needed
      const headers = await authService.getAuthHeader();
      
      const response = await fetch(`${API_URL}/users/account/status`, {
        method: 'GET',
        headers: headers
      });
      
      // Nếu tài khoản bị khóa, API trả về status 403 và isAccountLocked = true
      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData && errorData.isAccountLocked) {
          console.warn('Account is locked:', errorData);
          return { 
            isActive: false, 
            isAccountLocked: true,
            message: errorData.message || 'Tài khoản đã bị khóa'
          };
        }
      }
      
      if (!response.ok) {
        console.error('Error checking account status:', response.status);
        throw new Error('Không thể kiểm tra trạng thái tài khoản');
      }
      
      const data = await response.json();
      console.log('Account status response:', data);
      
      return { 
        isActive: true,
        isAccountLocked: false,
        message: data.message || 'Tài khoản đang hoạt động'
      };
    } catch (error) {
      console.error('Error checking account status:', error);
      throw error;
    }
  }
};

export default authService;