import axiosInstance from '../config/axiosConfig';

const getAuthToken = () => {
  // Check if we're in the browser environment
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token') || localStorage.getItem('token');
  }
  return null;
};

const historyService = {
  // Add movie to user's history
  addToHistory: async (movieData) => {
    try {
        console.log("Adding to history:", movieData);
      // Ensure the token is included in the request
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token available for history request");
        throw new Error("Bạn cần đăng nhập để lưu lịch sử xem phim");
      }

      const response = await axiosInstance.post('/history', movieData);
      console.log("History add response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding movie to history:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Add movie to history by ID
  addToHistoryById: async (movieId, additionalData = {}) => {
    try {
      console.log(`Adding movie ID ${movieId} to history with additional data:`, additionalData);
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token available for history request");
        throw new Error("Bạn cần đăng nhập để lưu lịch sử xem phim");
      }

      const response = await axiosInstance.post(`/history/${movieId}`, additionalData);
      console.log("History add by ID response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding movie to history by ID:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get user's history
  getUserHistory: async (limit = 10, page = 1, filter = 'all', sort = 'newest', searchQuery = '') => {
    try {
      // Check authentication status
      const token = getAuthToken();
      if (!token) {
        console.warn('No authentication token found');
        return { total: 0, page: 1, pages: 0, histories: [] };
      }

      console.log(`Fetching history with params: limit=${limit}, page=${page}, filter=${filter}, sort=${sort}`);

      // Build query params
      let url = `/history?limit=${limit}&page=${page}`;
      
      // Add filter for movie type if not 'all'
      if (filter !== 'all') {
        url += `&filter=${filter}`;
      }
      
      // Add sorting
      url += `&sort=${sort}`;
      
      // Add search query if provided
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      console.log("Requesting URL:", url);
      const response = await axiosInstance.get(url);
      console.log("History response data:", response.data);
      
      // Handle different response formats
      if (response.data && response.data.data) {
        // For the responseHelper format
        const historyData = response.data.data;
        console.log("History items received:", historyData.histories?.length || 0);
        return {
          total: historyData.total || 0,
          page: historyData.page || page,
          pages: historyData.pages || 1,
          histories: historyData.histories || []
        };
      } else if (response.data && response.data.histories) {
        // Support original format
        const historyData = response.data;
        console.log("History items received:", historyData.histories?.length || 0);
        return {
          total: historyData.total || 0,
          page: historyData.page || page,
          pages: historyData.pages || 1,
          histories: historyData.histories || []
        };
      } else if (response.data && response.data.success && response.data.message === "Lấy lịch sử xem phim thành công") {
        // Support another response format where histories may be directly in the response
        console.log("Direct history format detected");
        const histories = response.data.histories || [];
        console.log("Direct history items received:", histories.length);
        return {
          total: response.data.total || histories.length,
          page: response.data.page || page,
          pages: response.data.pages || 1,
          histories: histories
        };
      }
      
      console.warn("Unexpected response format:", response.data);
      // Fallback to empty structure
      return {
        total: 0,
        page: page,
        pages: 1,
        histories: []
      };
    } catch (error) {
      console.error('Error fetching user history:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        console.warn('Authentication required for history');
      }
      return { total: 0, page: 1, pages: 0, histories: [] };
    }
  },

  // Get history for a specific user (admin function)
  getUserHistoryById: async (userId, limit = 10, page = 1, filter = 'all', sort = 'newest') => {
    try {
      // Check authentication status
      const token = getAuthToken();
      if (!token) {
        console.warn('No authentication token found');
        return { total: 0, page: 1, pages: 0, histories: [] };
      }
      
      const url = `/history/users/${userId}?limit=${limit}&page=${page}&filter=${filter}&sort=${sort}`;
      console.log("Requesting URL:", url);
      const response = await axiosInstance.get(url);
      console.log("User history response:", response.data);
      
      // Handle different response formats
      if (response.data && response.data.data) {
        // For the responseHelper format
        const historyData = response.data.data;
        return {
          total: historyData.total || 0,
          page: historyData.page || page,
          pages: historyData.pages || 1,
          histories: historyData.histories || []
        };
      } else if (response.data) {
        const historyData = response.data;
        return {
          total: historyData.total || 0,
          page: historyData.page || page,
          pages: historyData.pages || 1,
          histories: historyData.histories || []
        };
      }
      
      console.warn("Unexpected response format:", response.data);
      return {
        total: 0,
        page: page,
        pages: 1,
        histories: []
      };
    } catch (error) {
      console.error('Error fetching user history by ID:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        console.warn('Authentication required for history');
      }
      return { total: 0, page: 1, pages: 0, histories: [] };
    }
  },

  // Delete history entry
  deleteHistory: async (historyId) => {
    try {
      console.log(`Deleting history item: ${historyId}`);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Bạn cần đăng nhập để xóa lịch sử");
      }

      const response = await axiosInstance.delete(`/history/${historyId}`);
      console.log("Delete history response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error deleting history:', error.response?.data || error.message);
      throw error;
    }
  },

  // Clear all history
  clearAllHistory: async () => {
    try {
      console.log("Clearing all history");
      const token = getAuthToken();
      if (!token) {
        throw new Error("Bạn cần đăng nhập để xóa lịch sử");
      }

      const response = await axiosInstance.delete('/history/clear');
      console.log("Clear history response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error clearing history:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Bắt đầu phiên xem phim mới
   * @param {Object} data - Dữ liệu phiên xem
   * @param {string} data.movieId - ID của phim
   * @param {string} data.movieSlug - Slug của phim (tùy chọn)
   * @param {number} data.currentTime - Vị trí hiện tại (giây) của video
   * @param {number} data.episode - Tập phim (cho phim bộ)
   */
  startWatchSession: async (data) => {
    try {
      console.log("Starting watch session:", data);
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token available");
        throw new Error("Bạn cần đăng nhập để theo dõi thời gian xem phim");
      }

      const response = await axiosInstance.post('/history/watch-session/start', data);
      console.log("Watch session start response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error starting watch session:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Kết thúc phiên xem phim
   * @param {Object} data - Dữ liệu phiên xem
   * @param {string} data.movieId - ID của phim
   * @param {number} data.currentTime - Vị trí hiện tại (giây) của video
   * @param {number} data.duration - Tổng thời lượng (giây) của video
   * @param {boolean} data.completed - Đánh dấu đã xem xong video
   * @param {number} data.episode - Tập phim (cho phim bộ)
   */
  endWatchSession: async (data) => {
    try {
      console.log("Ending watch session:", data);
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token available");
        throw new Error("Bạn cần đăng nhập để lưu thời gian xem phim");
      }

      const response = await axiosInstance.post('/history/watch-session/end', data);
      console.log("Watch session end response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error ending watch session:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Cập nhật vị trí xem hiện tại
   * @param {Object} data - Dữ liệu vị trí
   * @param {string} data.movieId - ID của phim
   * @param {number} data.currentTime - Vị trí hiện tại (giây) của video
   * @param {number} data.episode - Tập phim (cho phim bộ)
   */
  updateWatchPosition: async (data) => {
    try {
      console.log("Updating watch position:", data);
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token available");
        throw new Error("Bạn cần đăng nhập để lưu vị trí xem phim");
      }

      const response = await axiosInstance.put('/history/watch-session/update', data);
      console.log("Watch position update response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating watch position:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Lấy tổng thời gian xem phim của người dùng
   */
  getTotalWatchTime: async () => {
    try {
      console.log("Getting total watch time");
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token available");
        throw new Error("Bạn cần đăng nhập để xem thống kê");
      }

      const response = await axiosInstance.get('/history/total-watch-time');
      console.log("Total watch time response:", response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error getting total watch time:', error.response?.data || error.message);
      // Return default values on error
      return {
        totalWatchTimeSeconds: 0,
        totalWatchTimeFormatted: "0 giờ 0 phút 0 giây",
        totalWatchTimeHours: 0,
        totalWatchTimeMinutes: 0,
        totalMoviesWatched: 0,
        totalSeriesWatched: 0,
        totalMoviesCompleted: 0
      };
    }
  }
};

export default historyService;