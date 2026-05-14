import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Global cache for ratings to share between components
const ratingsCache = new Map();

const useRatingsCache = (movieSlug) => {
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [userRatingsStats, setUserRatingsStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchRatings = async () => {
      if (!movieSlug || movieSlug.trim() === '') {
        setLoading(false);
        return;
      }
      
      const cacheKey = `ratings_${movieSlug}`;
      
      // Check cache first
      if (ratingsCache.has(cacheKey)) {
        const cachedRatings = ratingsCache.get(cacheKey);
        if (isMounted) {
          setAverageRating(cachedRatings.averageRating || 0);
          setRatingCount(cachedRatings.ratingCount || 0);
          setUserRatingsStats(cachedRatings.userRatingsStats || null);
          setLoading(false);
        }
        return;
      }
      
      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      try {
        setLoading(true);
        setError(null);
          const response = await axios.get(`${API_URL}/ratings/stats/${movieSlug}`, {
          signal: abortControllerRef.current.signal,
          timeout: 8000 // 8 second timeout
        });
        
        if (response.status === 200 && isMounted) {
          const ratingData = response.data.data || {};
          
          const ratingsInfo = {
            averageRating: ratingData.averageRating || 0,
            ratingCount: ratingData.ratingCount || 0,
            userRatingsStats: ratingData.userRatingsStats || null
          };
          
          // Cache the processed ratings
          ratingsCache.set(cacheKey, ratingsInfo);
          
          setAverageRating(ratingsInfo.averageRating);
          setRatingCount(ratingsInfo.ratingCount);
          setUserRatingsStats(ratingsInfo.userRatingsStats);
          setError(null);
        }
      } catch (error) {
        if (!axios.isCancel(error) && isMounted) {
          console.error("Error fetching ratings:", error);
          setError(error.message || 'Failed to fetch ratings');
          // Set default values on error
          setAverageRating(0);
          setRatingCount(0);
          setUserRatingsStats(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRatings();
    
    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [movieSlug, API_URL]);

  // Function to update ratings cache when new rating is added
  const updateRatingsCache = (newRatingData) => {
    const cacheKey = `ratings_${movieSlug}`;
    const updatedRatings = {
      averageRating: newRatingData.averageRating || averageRating,
      ratingCount: newRatingData.ratingCount || ratingCount,
      userRatingsStats: newRatingData.userRatingsStats || userRatingsStats
    };
    
    // Update cache
    ratingsCache.set(cacheKey, updatedRatings);
    
    // Update state
    setAverageRating(updatedRatings.averageRating);
    setRatingCount(updatedRatings.ratingCount);
    setUserRatingsStats(updatedRatings.userRatingsStats);
  };

  // Function to clear cache for a specific movie
  const clearRatingsCache = () => {
    const cacheKey = `ratings_${movieSlug}`;
    ratingsCache.delete(cacheKey);
  };

  return {
    averageRating,
    ratingCount,
    userRatingsStats,
    loading,
    error,
    updateRatingsCache,
    clearRatingsCache
  };
};

export default useRatingsCache;
