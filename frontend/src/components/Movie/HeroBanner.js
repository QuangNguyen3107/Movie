import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../../styles/HeroBanner.module.css';

const HeroBanner = () => {
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    const fetchFeaturedMovie = async () => {
      try {
        if (!isMounted) return;
        
        const response = await fetch('https://ophim1.com/danh-sach/phim-moi-cap-nhat?page=1', {
          signal: controller.signal
        });
        
        if (!isMounted) return;
        
        const data = await response.json();
        if (data.items && data.items.length > 0 && isMounted) {
          // Get first item with a poster
          const movie = data.items.find(m => m.poster_url || m.thumb_url);
          setFeaturedMovie(movie);
        }
      } catch (error) {
        if (!controller.signal.aborted && isMounted) {
          console.error('Error fetching featured movie:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFeaturedMovie();
    
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

 
};

export default HeroBanner;
