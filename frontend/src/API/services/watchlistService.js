import authService from './authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const watchlistService = {
  // Get watchlist for current user
  getWatchlist: async () => {
    try {
      // Get auth headers with token refresh if needed
      const headers = await authService.getAuthHeader();
      
      console.log("Fetching watchlist from API...");
      
      const response = await fetch(`${API_URL}/watchlist`, {
        headers: {
          ...headers,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error in watchlist response:", errorData);
        throw new Error(errorData.message || 'Không thể lấy danh sách xem sau');
      }
      
      const responseData = await response.json();
      console.log("Watchlist response data:", responseData);
      
      // Improved data handling for backend structure
      // Check for movies in responseData.data (from responseHelper)
      if (responseData.data && responseData.data.movies) {
        console.log("Returning watchlist movies from data.movies:", responseData.data.movies);
        return responseData.data.movies;
      }
      // Then check for movies directly in responseData
      else if (responseData.movies) {
        console.log("Returning watchlist movies from root:", responseData.movies);
        return responseData.movies;
      }
      // If neither exists, log and return empty array
      else {
        console.log('Unexpected response format, could not find movies array:', responseData);
        return [];
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      return [];
    }
  },
  
  // Add movie to watchlist
  addToWatchlist: async (movieData) => {
    try {
      // Get auth headers with token refresh if needed
      const headers = await authService.getAuthHeader();
      
      const response = await fetch(`${API_URL}/watchlist/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...headers
        },
        body: JSON.stringify(movieData)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error("Error adding to watchlist:", responseData);
        return {
          success: false,
          message: responseData.message || 'Không thể thêm vào danh sách xem sau'
        };
      }
      
      // Access data through proper path which may be in responseData.data
      const data = responseData.data || responseData;
      
      return {
        success: true,
        message: responseData.message || 'Đã thêm vào danh sách xem sau',
        alreadyExists: data.alreadyExists || false
      };
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      return {
        success: false,
        message: error.message || 'Có lỗi xảy ra. Vui lòng thử lại sau'
      };
    }
  },
  
  // Check if movie is in watchlist
  isInWatchlist: async (movieId) => {
    try {
      // Get auth headers with token refresh if needed
      const headers = await authService.getAuthHeader();
      
      const response = await fetch(`${API_URL}/watchlist/check/${movieId}`, {
        headers: {
          ...headers,
          'Accept': 'application/json'
        }
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error("Error checking watchlist:", responseData);
        return false;
      }
      
      // Access data through proper path which may be in responseData.data
      const data = responseData.data || responseData;
      return data.isInWatchlist || false;
    } catch (error) {
      console.error('Error checking watchlist:', error);
      return false;
    }
  },
  
  // Remove movie from watchlist
  removeFromWatchlist: async (movieId) => {
    try {
      // Get auth headers with token refresh if needed
      const headers = await authService.getAuthHeader();
      
      const response = await fetch(`${API_URL}/watchlist/remove/${movieId}`, {
        method: 'DELETE',
        headers: {
          ...headers,
          'Accept': 'application/json'
        }
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error("Error removing from watchlist:", responseData);
        return {
          success: false,
          message: responseData.message || 'Không thể xóa khỏi danh sách xem sau'
        };
      }
      
      return {
        success: true,
        message: responseData.message || 'Đã xóa khỏi danh sách xem sau'
      };
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      return {
        success: false,
        message: error.message || 'Có lỗi xảy ra. Vui lòng thử lại sau'
      };
    }
  },
  
  // Clear watchlist
  clearWatchlist: async () => {
    try {
      // Get auth headers with token refresh if needed
      const headers = await authService.getAuthHeader();
      
      const response = await fetch(`${API_URL}/watchlist/clear`, {
        method: 'DELETE',
        headers: {
          ...headers,
          'Accept': 'application/json'
        }
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error("Error clearing watchlist:", responseData);
        return {
          success: false,
          message: responseData.message || 'Không thể xóa danh sách xem sau'
        };
      }
      
      return {
        success: true,
        message: responseData.message || 'Đã xóa tất cả phim trong danh sách xem sau'
      };
    } catch (error) {
      console.error('Error clearing watchlist:', error);
      return {
        success: false,
        message: error.message || 'Có lỗi xảy ra. Vui lòng thử lại sau'
      };
    }
  }
};

export default watchlistService;