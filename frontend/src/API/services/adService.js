// This file manages the ad-related API calls and logic

// Import our API configuration
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Default fallback ads in case of network issues
const FALLBACK_ADS = [
  {
    id: 'fallback1',
    content: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    advertiser: 'Sample Advertiser 1',
    duration: 15,
    type: 'video',
    link: 'https://example.com'
  }
];

const adService = {
  // Get a random video ad to display before content
  getRandomVideoAd: async () => {
    try {
      const response = await axios.get(`${API_URL}/advertisements/random?type=video`);
      if (response.data.success && response.data.advertisement) {
        return response.data.advertisement;
      }
      throw new Error('No ad returned from the server');
    } catch (error) {
      console.error('Error fetching video ad:', error);
      // Fallback to a default ad if there's an error
      return FALLBACK_ADS[0];
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
    // Log that an ad was viewed (for analytics)
  trackAdImpression: async (adId) => {
    try {
      const response = await axios.post(`${API_URL}/advertisements/${adId}/impression`);
      return response.data.success;
    } catch (error) {
      console.error('Error tracking ad impression:', error);
      return false;
    }
  },
  
  // Log that an ad was clicked (for analytics)
  trackAdClick: async (adId) => {
    try {
      const response = await axios.post(`${API_URL}/advertisements/${adId}/click`);
      return response.data.success;
    } catch (error) {
      console.error('Error tracking ad click:', error);
      return false;
    }
  },
  
  // Log that an ad was skipped (for analytics)
  trackAdSkip: async (adId) => {
    try {
      const response = await axios.post(`${API_URL}/advertisements/${adId}/skip`);
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
    }
  },
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
  }
};

export default adService;
