import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Global cache for related movies to share between components
const relatedMoviesCache = new Map();

const useRelatedMoviesCache = (movieSlug, movieCategory) => {
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [similarNameMovies, setSimilarNameMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchRelatedMovies = async () => {
      if (!movieSlug || movieSlug.trim() === '') {
        setLoading(false);
        return;
      }
      
      const cacheKey = `related_${movieSlug}`;
      
      // Check cache first
      if (relatedMoviesCache.has(cacheKey)) {
        const cachedData = relatedMoviesCache.get(cacheKey);
        if (isMounted) {
          setRelatedMovies(cachedData.relatedMovies || []);
          setSimilarNameMovies(cachedData.similarNameMovies || []);
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
        setError(null);        // Fetch related movies in parallel for better performance
        const [relatedResponse, similarResponse] = await Promise.all([
          // Related movies by category
          movieCategory && movieCategory.length > 0 
            ? axios.get(`${API_URL}/search`, {
                params: {
                  q: `category:${movieCategory[0]?.name || ''}`,
                  size: 10
                },
                signal: abortControllerRef.current.signal,
                timeout: 6000
              })
            : Promise.resolve({ data: { hits: [] } }),
          
          // Similar name movies - search by partial movie name
          axios.get(`${API_URL}/search`, {
            params: { 
              q: movieSlug.replace(/-/g, ' '), // Convert slug to searchable text
              size: 8 
            },
            signal: abortControllerRef.current.signal,
            timeout: 6000
          }).catch(() => ({ data: { hits: [] } })) // Graceful fallback
        ]);
          if (isMounted) {
          const relatedData = {
            relatedMovies: relatedResponse.data.hits || [],
            similarNameMovies: similarResponse.data.hits || []
          };
          
          // Filter out the current movie from results
          relatedData.relatedMovies = relatedData.relatedMovies.filter(movie => movie.slug !== movieSlug);
          relatedData.similarNameMovies = relatedData.similarNameMovies.filter(movie => movie.slug !== movieSlug);
          
          // Cache the processed data
          relatedMoviesCache.set(cacheKey, relatedData);
          
          setRelatedMovies(relatedData.relatedMovies);
          setSimilarNameMovies(relatedData.similarNameMovies);
          setError(null);
        }
      } catch (error) {
        if (!axios.isCancel(error) && isMounted) {
          console.error("Error fetching related movies:", error);
          setError(error.message || 'Failed to fetch related movies');
          // Set empty arrays on error
          setRelatedMovies([]);
          setSimilarNameMovies([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRelatedMovies();
    
    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [movieSlug, movieCategory, API_URL]);

  // Function to clear cache for a specific movie
  const clearRelatedMoviesCache = () => {
    const cacheKey = `related_${movieSlug}`;
    relatedMoviesCache.delete(cacheKey);
  };

  // Function to prefetch related movies for better performance
  const prefetchRelatedMovies = async (targetSlug, targetCategory) => {
    const cacheKey = `related_${targetSlug}`;
    
    // Don't prefetch if already cached
    if (relatedMoviesCache.has(cacheKey)) {
      return;
    }
      try {
      const [relatedResponse, similarResponse] = await Promise.all([
        targetCategory && targetCategory.length > 0 
          ? axios.get(`${API_URL}/search`, {
              params: {
                category: targetCategory[0]?.name || '',
                size: 10
              },
              timeout: 4000
            })
          : Promise.resolve({ data: { hits: [] } }),
        
        axios.get(`${API_URL}/search`, {
          params: { 
            q: targetSlug.replace(/-/g, ' '), 
            size: 8 
          },
          timeout: 4000
        }).catch(() => ({ data: { hits: [] } }))
      ]);
      
      const relatedData = {
        relatedMovies: (relatedResponse.data.hits || []).filter(movie => movie.slug !== targetSlug),
        similarNameMovies: (similarResponse.data.hits || []).filter(movie => movie.slug !== targetSlug)
      };
      
      // Cache the prefetched data
      relatedMoviesCache.set(cacheKey, relatedData);
    } catch (error) {
      console.warn("Prefetch failed for related movies:", error);
    }
  };

  return {
    relatedMovies,
    similarNameMovies,
    loading,
    error,
    clearRelatedMoviesCache,
    prefetchRelatedMovies
  };
};

export default useRelatedMoviesCache;
