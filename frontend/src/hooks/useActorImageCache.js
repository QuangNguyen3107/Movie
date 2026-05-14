import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Global cache để share giữa các components
const actorImageCache = new Map();

const useActorImageCache = (actorName) => {
  const [actorImage, setActorImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef(null);
  
  const imageBaseUrl = process.env.NEXT_PUBLIC_TMDB_IMAGE_URL || 'https://image.tmdb.org/t/p/w500';
  const profilePlaceholder = '/img/user-avatar.png';
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchActorImage = async () => {
      if (!actorName || actorName.trim() === '' || actorName.length < 2) {
        setLoading(false);
        return;
      }
      
      const normalizedName = actorName.toLowerCase().trim();
      
      // Kiểm tra cache trước
      if (actorImageCache.has(normalizedName)) {
        const cachedResult = actorImageCache.get(normalizedName);
        if (isMounted) {
          setActorImage(cachedResult === 'notfound' ? null : cachedResult);
          setLoading(false);
        }
        return;
      }
      
      // Kiểm tra session storage
      try {
        const sessionCache = JSON.parse(sessionStorage.getItem('actorImageCache') || '{}');
        if (sessionCache[normalizedName]) {
          const cachedPath = sessionCache[normalizedName];
          if (cachedPath === 'notfound') {
            actorImageCache.set(normalizedName, 'notfound');
            if (isMounted) {
              setActorImage(null);
              setLoading(false);
            }
            return;
          } else {
            const fullImageUrl = `${imageBaseUrl}${cachedPath}`;
            actorImageCache.set(normalizedName, fullImageUrl);
            if (isMounted) {
              setActorImage(fullImageUrl);
              setLoading(false);
            }
            return;
          }
        }
      } catch (error) {
        console.error('Error reading from session storage:', error);
      }
      
      // Fetch từ API
      try {
        // Cancel previous request if exists
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        abortControllerRef.current = new AbortController();
        
        const tmdbApiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        const tmdbBaseUrl = process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
        
        if (!tmdbApiKey) {
          console.warn('TMDB API key not found');
          if (isMounted) {
            setActorImage(null);
            setLoading(false);
          }
          return;
        }
        
        const searchUrl = `${tmdbBaseUrl}/search/person?api_key=${tmdbApiKey}&query=${encodeURIComponent(actorName)}`;
        
        const response = await axios.get(searchUrl, {
          signal: abortControllerRef.current.signal,
          timeout: 5000 // 5 second timeout
        });
        
        if (response.data && response.data.results && response.data.results.length > 0) {
          const actor = response.data.results[0];
          if (actor.profile_path && isMounted) {
            const imagePath = actor.profile_path;
            const fullImageUrl = `${imageBaseUrl}${imagePath}`;
            
            // Cache in memory
            actorImageCache.set(normalizedName, fullImageUrl);
            
            // Cache in session storage
            try {
              const sessionCache = JSON.parse(sessionStorage.getItem('actorImageCache') || '{}');
              sessionCache[normalizedName] = imagePath;
              sessionStorage.setItem('actorImageCache', JSON.stringify(sessionCache));
            } catch (error) {
              console.error('Error writing to session storage:', error);
            }
            
            setActorImage(fullImageUrl);
          } else if (isMounted) {
            // Mark as not found
            actorImageCache.set(normalizedName, 'notfound');
            try {
              const sessionCache = JSON.parse(sessionStorage.getItem('actorImageCache') || '{}');
              sessionCache[normalizedName] = 'notfound';
              sessionStorage.setItem('actorImageCache', JSON.stringify(sessionCache));
            } catch (error) {
              console.error('Error writing to session storage:', error);
            }
            setActorImage(null);
          }
        } else if (isMounted) {
          // Mark as not found
          actorImageCache.set(normalizedName, 'notfound');
          try {
            const sessionCache = JSON.parse(sessionStorage.getItem('actorImageCache') || '{}');
            sessionCache[normalizedName] = 'notfound';
            sessionStorage.setItem('actorImageCache', JSON.stringify(sessionCache));
          } catch (error) {
            console.error('Error writing to session storage:', error);
          }
          setActorImage(null);
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error(`Error fetching actor image for ${actorName}:`, error);
          // Don't cache errors (network issues, etc.)
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchActorImage();
    
    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [actorName, imageBaseUrl]);
  
  return { actorImage, loading, profilePlaceholder };
};

export default useActorImageCache;
