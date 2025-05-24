// This file manages the ad-related API calls and logic

// Import our API configuration
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Cache to prevent multiple identical requests
const requestCache = {
  videoAd: null,
  videoAdTimestamp: 0,
  bannerTopAd: null,
  bannerTopTimestamp: 0,
  bannerBottomAd: null,
  bannerBottomTimestamp: 0,
  // Clear cache after 5 minutes (300000ms)
  cacheDuration: 300000
};

const adService = {  // Get a random video ad to display before content
  getRandomVideoAd: async () => {
    try {
      // Check if we have a cached video ad that's not expired
      const now = Date.now();
      if (requestCache.videoAd && 
          (now - requestCache.videoAdTimestamp) < requestCache.cacheDuration) {
        console.log('Using cached video ad to prevent switching during playback');
        return requestCache.videoAd;
      }
      
      console.log('Fetching new video ad from server...');
      const response = await axios.get(`${API_URL}/advertisements/random?type=video`);
      if (response.data.success && response.data.advertisement) {
        // Store in cache with timestamp
        requestCache.videoAd = response.data.advertisement;
        requestCache.videoAdTimestamp = now;
        return response.data.advertisement;
      }
      console.log('No video ad available from server');
      return null; // Return null instead of a fallback ad
    } catch (error) {
      console.error('Error fetching video ad:', error);
      return null; // Return null on error instead of using fallback ad
    }
  },
  
  // Get banner ads for the main screen (top position)
  getTopBannerAd: async () => {
    try {
      const response = await axios.get(`${API_URL}/advertisements/random?type=banner_top`);
      if (response.data.success && response.data.advertisement) {
        return response.data.advertisement;
      }
      return null; // No banner ad to show is fine
    } catch (error) {
      console.error('Error fetching top banner ad:', error);
      return null;
    }
  },
  
  // Get banner ads for the main screen (bottom position)
  getBottomBannerAd: async () => {
    try {
      const response = await axios.get(`${API_URL}/advertisements/random?type=banner_bottom`);
      if (response.data.success && response.data.advertisement) {
        return response.data.advertisement;
      }
      return null; // No banner ad to show is fine
    } catch (error) {
      console.error('Error fetching bottom banner ad:', error);
      return null;
    }
  },
  // Get multiple banner ads for a specific position
  getMultipleBannerAds: async (position = 'top', limit = 3) => {
    try {
      const type = position === 'top' ? 'banner_top' : 'banner_bottom';
      const response = await axios.get(`${API_URL}/advertisements/random?type=${type}&limit=${limit}`);
      if (response.data.success && response.data.advertisements && response.data.advertisements.length > 0) {
        return response.data.advertisements;
      }
      // Try to get at least one ad if multiple aren't available
      const singleAd = await (position === 'top' ? adService.getTopBannerAd() : adService.getBottomBannerAd());
      return singleAd ? [singleAd] : [];
    } catch (error) {
      console.error(`Error fetching multiple ${position} banner ads:`, error);
      return [];
    }
  },
    // Get multiple video ads (limit defaults to 1 to ensure only one ad at a time)
  getMultipleVideoAds: async (limit = 1) => {
    try {
      // Always use cache for first ad if available to prevent switching
      const now = Date.now();
      if (limit === 1 && requestCache.videoAd && 
          (now - requestCache.videoAdTimestamp) < requestCache.cacheDuration) {
        console.log('Using cached video ad in getMultipleVideoAds to prevent switching');
        return [requestCache.videoAd];
      }
      
      console.log('Fetching multiple video ads from server...');
      const response = await axios.get(`${API_URL}/advertisements/random?type=video&limit=${limit}`);
      if (response.data.success && response.data.advertisements && response.data.advertisements.length > 0) {
        // Store first ad in cache
        if (response.data.advertisements.length > 0) {
          requestCache.videoAd = response.data.advertisements[0];
          requestCache.videoAdTimestamp = now;
        }
        return response.data.advertisements;
      }
      
      // Fallback to single video ad if the multiple endpoint didn't return an array
      const singleAd = await adService.getRandomVideoAd();
      return singleAd ? [singleAd] : [];
    } catch (error) {
      console.error('Error fetching multiple video ads:', error);
      return [];
    }
  },
    // Log that an ad was viewed (for analytics)
  trackAdImpression: async (adId) => {
    try {
      const response = await axios.post(`${API_URL}/advertisements/view`, { adId });
      return response.data.success;
    } catch (error) {
      console.error('Error tracking ad impression:', error);
      return false;
    }
  },
  
  // Log that an ad was clicked (for analytics)
  trackAdClick: async (adId) => {
    try {
      const response = await axios.post(`${API_URL}/advertisements/click`, { adId });
      return response.data.success;
    } catch (error) {
      console.error('Error tracking ad click:', error);
      return false;
    }
  },
  
  // Log that an ad was skipped (for analytics)
  trackAdSkip: async (adId) => {
    try {
      const response = await axios.post(`${API_URL}/advertisements/skip`, { adId });
      return response.data.success;
    } catch (error) {
      console.error('Error tracking ad skip:', error);
      return false;
    }
  },
  // For Admin: Get all advertisements with optional filtering
  getAllAds: async (page = 1, limit = 10, type = null, active = null) => {
    try {
      let url = `${API_URL}/advertisements?page=${page}&limit=${limit}`;
      if (type) url += `&type=${type}`;
      if (active !== null) url += `&active=${active}`;
      
      // For development: add a small delay to simulate network latency and catch timeout issues
      // await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching all ads:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with an error status code
        console.log('Server error:', error.response.status, error.response.data);
      } else if (error.request) {
        // Request was made but no response was received
        console.log('Network error - no response received');
      } else {
        // Something else caused the error
        console.log('Error setting up request:', error.message);
      }
      
      // Return a structured error response instead of throwing
      return {
        success: false,
        advertisements: [],
        totalPages: 1,
        error: error.message || 'Network error when fetching advertisements'
      };
    }
  },
  
  // For Admin: Get a single advertisement by ID
  getAdById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/advertisements/${id}`);
      return response.data.advertisement;
    } catch (error) {
      console.error('Error fetching ad by ID:', error);
      throw error;
    }
  },
  // For Admin: Create a new advertisement
  createAd: async (adData) => {
    try {
      console.log('Creating ad with data:', adData);
      const response = await axios.post(`${API_URL}/advertisements`, adData);
      console.log('Create ad response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating ad:', error);
      
      // Enhanced error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log('Server error response:', error.response.status, error.response.data);
        return {
          success: false,
          error: error.response.data?.message || `Server error: ${error.response.status}`,
          details: error.response.data
        };
      } else if (error.request) {
        // The request was made but no response was received
        console.log('No response received:', error.request);
        return {
          success: false,
          error: 'No response received from server'
        };
      } else {
        // Something happened in setting up the request that triggered an Error
        return {
          success: false,
          error: error.message || 'Unknown error when creating advertisement'
        };
      }
    }
  },
  
  // For Admin: Update an existing advertisement
  updateAd: async (id, adData) => {
    try {
      const response = await axios.put(`${API_URL}/advertisements/${id}`, adData);
      return response.data;
    } catch (error) {
      console.error('Error updating ad:', error);
      // Return error response instead of throwing
      return {
        success: false,
        error: error.message || 'Network error when updating advertisement'
      };
    }  },
  
  // For Admin: Delete an advertisement
  deleteAd: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/advertisements/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting ad:', error);
      // Return error response instead of throwing
      return {
        success: false,
        error: error.message || 'Network error when deleting advertisement'
      };
    }
  },
  
  // Clear ad cache to force fresh ad fetch
  clearCache: () => {
    console.log('Clearing ad service cache');
    requestCache.videoAd = null;
    requestCache.videoAdTimestamp = 0;
    requestCache.bannerTopAd = null;
    requestCache.bannerTopTimestamp = 0;
    requestCache.bannerBottomAd = null;
    requestCache.bannerBottomTimestamp = 0;
    return true;
  }
};

export default adService;
