// Video advertisement component that plays before movie content
import React, { useState, useEffect, useRef } from 'react';
import { FaForward } from 'react-icons/fa';
import adService from '@/API/services/adService';
import styles from '@/styles/Advertisement.module.css';

/**
 * Displays a video advertisement that plays before content
 * @param {Object} props
 * @param {Function} props.onComplete - Callback when ad completes or is skipped
 * @param {Boolean} props.allowSkip - Whether to allow skipping after a period
 * @param {Number} props.skipDelay - Seconds before skip button appears (default: 5)
 */
const VideoAd = ({ onComplete, allowSkip = true, skipDelay = 5 }) => {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [adTracked, setAdTracked] = useState(false);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  // Fetch a random video ad
  useEffect(() => {
    const fetchAd = async () => {
      try {
        setLoading(true);
        const adData = await adService.getRandomVideoAd();
        if (adData) {
          setAd(adData);
          setTimeRemaining(adData.duration || 15);
        } else {
          // If no ad, complete immediately
          onComplete();
        }
      } catch (error) {
        console.error('Error fetching video ad:', error);
        onComplete(); // Skip on error
      } finally {
        setLoading(false);
      }
    };

    fetchAd();

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [onComplete]);

  // Track impression when ad is viewed
  useEffect(() => {
    const trackImpression = async () => {
      if (ad && !adTracked) {
        try {
          await adService.trackAdImpression(ad._id);
          setAdTracked(true);
        } catch (error) {
          console.error('Error tracking ad impression:', error);
        }
      }
    };

    trackImpression();
  }, [ad, adTracked]);

  // Setup video event listeners and countdown timer
  useEffect(() => {
    if (!ad || !videoRef.current) return;

    const videoElement = videoRef.current;
    
    // Start the video when it's ready
    const handleCanPlay = () => {
      videoElement.play().catch(err => {
        console.error('Error playing video ad:', err);
        onComplete(); // Skip on error
      });
    };

    // Handle video completion
    const handleEnded = () => {
      onComplete();
    };

    // Setup countdown timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });

      // Enable skip after delay
      if (allowSkip && timeRemaining === skipDelay) {
        setCanSkip(true);
      }
    }, 1000);

    // Add video event listeners
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('ended', handleEnded);

    // Cleanup
    return () => {
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('ended', handleEnded);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [ad, onComplete, allowSkip, skipDelay, timeRemaining]);

  // Handle skipping the ad
  const handleSkip = async () => {
    if (!canSkip || !ad) return;
    
    try {
      // Track the skip
      await adService.trackAdSkip(ad._id);
    } catch (error) {
      console.error('Error tracking ad skip:', error);
    }
    
    // Complete and move to content
    onComplete();
  };

  // Handle clicking on the ad
  const handleAdClick = async () => {
    if (!ad) return;
    
    try {
      // Track the click
      await adService.trackAdClick(ad._id);
      
      // Open the link in a new tab
      window.open(ad.link, '_blank');
      
      // Pause the video when clicking through
      if (videoRef.current) {
        videoRef.current.pause();
      }
    } catch (error) {
      console.error('Error tracking ad click:', error);
      // Still open the link even if tracking fails
      window.open(ad.link, '_blank');
    }
  };

  if (loading) {
    return (
      <div className={styles.videoAdContainer}>
        <div className={styles.loadingSpinner}>
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!ad) {
    return null;
  }

  return (
    <div className={styles.videoAdContainer}>
      <div className={styles.videoWrapper} onClick={handleAdClick}>
        <video 
          ref={videoRef}
          className={styles.videoAd}
          src={ad.content}
          muted={false}
          playsInline
          preload="auto"
          aria-label={`Advertisement from ${ad.advertiser}`}
        />
        
        <div className={styles.adOverlay}>
          <div className={styles.adInfo}>
            <span className={styles.adLabel}>Quảng cáo</span>
            <span className={styles.adTimer}>{timeRemaining}s</span>
          </div>
          
          <div className={styles.adDetails}>
            <p className={styles.adTitle}>{ad.name}</p>
            <p className={styles.adAdvertiser}>{ad.advertiser}</p>
          </div>
          
          {allowSkip && (
            <button 
              className={`${styles.skipButton} ${canSkip ? styles.canSkip : ''}`}
              onClick={handleSkip}
              disabled={!canSkip}
              aria-label="Skip advertisement"
            >
              <FaForward className={styles.skipIcon} />
              <span>{canSkip ? 'Skip Ad' : `Skip in ${skipDelay - (ad.duration - timeRemaining)}s`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoAd;
