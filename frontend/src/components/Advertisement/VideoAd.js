// Video advertisement component that plays before movie content
import React, { useState, useEffect, useRef } from 'react';
import { FaForward } from 'react-icons/fa';
import adService from '@/API/services/adService';
import styles from '@/styles/Advertisement.module.css';
import { useAdContext } from '@/context/AdContext';

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
  
  // Use refs to avoid re-renders and useEffect dependencies
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const skipTimeoutRef = useRef(null);
  const playAttemptedRef = useRef(false);
  const isInitializedRef = useRef(false);
  
  const { hideVideoAds, isLoading: isAdContextLoading } = useAdContext();
  
  // Single effect to handle premium users (hideVideoAds=true)
  useEffect(() => {
    if (hideVideoAds === true) {
      console.log('%c[VideoAd] PREMIUM USER DETECTED - SKIPPING AD!', 'color: #00FF00; font-weight: bold; font-size: 14px');
      
      // Clean up video if it exists
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = ""; // Xóa nguồn video
      }
      
      // Clear any running timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Reset state and skip ad
      setAd(null);
      setLoading(false);
      onComplete();
      return;
    }
  }, [hideVideoAds, onComplete]);
  // Effect to fetch ad only when necessary - reduced dependencies to avoid re-fetching
  useEffect(() => {
    // Use ref to track if we've already initiated a fetch
    const hasInitiatedFetch = useRef(false);
    
    // Exit early if user is premium or context is still loading
    if (hideVideoAds || isAdContextLoading) {
      return;
    }
    
    // Exit if we've already started fetching to prevent duplicate requests
    if (hasInitiatedFetch.current) {
      console.log('%c[VideoAd] Fetch already initiated, skipping duplicate fetch', 'color: #7700FF; font-weight: bold');
      return;
    }
    
    // Mark that we've initiated a fetch
    hasInitiatedFetch.current = true;

    // Track if component is mounted to prevent state updates after unmount
    let isMounted = true;
    
    const fetchAdInternal = async () => {
      console.log('%c[VideoAd] Fetching video ad...', 'color: #0000ff; font-weight: bold');
      
      if (isMounted) {
        setLoading(true);
      }
      
      try {
        // Add a brief delay to avoid race conditions with other state changes
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const adData = await adService.getRandomVideoAd();
        
        // Check if component is still mounted and user is not premium
        if (!isMounted || hideVideoAds) {
          return;
        }
          if (adData) {
          console.log('%c[VideoAd] Ad fetched successfully:', 'color: #00AA00; font-weight: bold', adData.name);
          // Chỉ đặt ad, time remaining sẽ được đặt trong useEffect khác
          setAd(adData);
          // Không set time remaining ở đây nữa
        } else {
          console.log('%c[VideoAd] No ad data returned from service. Completing.', 'color: #ffa500; font-weight: bold');
          onComplete();
        }
      } catch (error) {
        console.error('Error fetching video ad:', error);
        if (isMounted) {
          onComplete();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAdInternal();

    // Cleanup function
    return () => {
      console.log('%c[VideoAd] Cleaning up ad fetch effect', 'color: #FF9900;');
      isMounted = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [hideVideoAds, isAdContextLoading, onComplete]);

  // Track impression when ad is viewed - only run once when ad loads
  useEffect(() => {
    if (!ad || adTracked) return;
    
    const trackImpression = async () => {
      try {
        await adService.trackAdImpression(ad._id);
        setAdTracked(true);
      } catch (error) {
        console.error('Error tracking ad impression:', error);
      }
    };

    trackImpression();
  }, [ad, adTracked]);  // Setup video event listeners once per ad - with event flags to prevent duplicates
  useEffect(() => {
    if (!ad || !videoRef.current) return;
    
    // Create a unique ID for this effect instance to track events
    const effectInstanceId = Math.random().toString(36).substring(2, 9);
    console.log(`%c[VideoAd:${effectInstanceId}] Setting up video event listeners`, 'color: #00AAFF;');
    
    const videoElement = videoRef.current;
    let playAttempts = 0;
    const maxPlayAttempts = 3;
    
    // Flag to track if we've already set up listeners for this video element
    // This helps avoid duplicate event registrations
    if (videoElement._hasAdEventListeners) {
      console.log(`%c[VideoAd:${effectInstanceId}] Event listeners already attached, skipping`, 'color: #AAFFAA;');
      return;
    }
    
    videoElement._hasAdEventListeners = true;
    
    // Use mutable refs instead of state dependencies to avoid re-renders
    const stateRefs = {
      videoReady: videoReady,
      videoStarted: videoStarted,
      adRef: ad
    };
    
    const handleCanPlay = () => {
      console.log(`%c[VideoAd:${effectInstanceId}] Video can play now`, 'color: #00AAFF;');
      if (!stateRefs.videoReady) {
        setVideoReady(true);
      }
    };
    
    const handlePlay = () => {
      console.log(`%c[VideoAd:${effectInstanceId}] Video playback started`, 'color: #00AAFF;');
      if (!stateRefs.videoStarted) {
        setVideoStarted(true);
      }
    };

    const handleEnded = () => {
      console.log(`%c[VideoAd:${effectInstanceId}] Video playback ended normally`, 'color: #00AAFF;');
      onComplete();
    };
    
    const handleError = (event) => {
      console.error(`[VideoAd:${effectInstanceId}] Video ad playback error:`, event);
      
      // Only try to recover if we haven't exceeded max attempts
      if (playAttempts < maxPlayAttempts) {
        playAttempts++;
        console.log(`%c[VideoAd:${effectInstanceId}] Attempting to recover from error (${playAttempts}/${maxPlayAttempts})`, 'color: #FFAA00;');
        
        // Give a short delay before retrying
        setTimeout(() => {
          if (videoElement && videoElement.src) {
            // Try just restarting playback first
            videoElement.currentTime = 0;
            videoElement.load();
          }
        }, 1000);
      } else {
        console.error(`%c[VideoAd:${effectInstanceId}] Failed to play video after maximum attempts`, 'color: #FF0000;');
        onComplete(); // Skip after max retries
      }
    };
    
    // Listening for stalled and waiting events to better handle buffering
    const handleStalled = () => {
      console.log(`%c[VideoAd:${effectInstanceId}] Video has stalled`, 'color: #FFAAFF;');
    };
    
    const handleWaiting = () => {
      console.log(`%c[VideoAd:${effectInstanceId}] Video is waiting/buffering`, 'color: #AAAAFF;');
    };
    
    // Handle video completion through time update as a backup
    const handleTimeUpdate = () => {
      if (videoElement.currentTime > 0 && 
          videoElement.currentTime >= (videoElement.duration - 0.5) && 
          videoElement.duration > 0) {
        console.log(`%c[VideoAd:${effectInstanceId}] Video completed via time update`, 'color: #AAAAAA;');
        // No need to call onComplete - the ended event should fire
      }
    };

    // Add video event listeners
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('stalled', handleStalled);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);

    // Cleanup
    return () => {
      console.log(`%c[VideoAd:${effectInstanceId}] Cleaning up video event listeners`, 'color: #FF9900;');
      if (videoElement) {
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('ended', handleEnded);
        videoElement.removeEventListener('error', handleError);
        videoElement.removeEventListener('stalled', handleStalled);
        videoElement.removeEventListener('waiting', handleWaiting);
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        delete videoElement._hasAdEventListeners;
      }
    };
  }, [ad, onComplete, videoReady, videoStarted]);
    // Handle video playback when ready - with debounce protection and one-time trigger
  useEffect(() => {
    if (!videoReady || !videoRef.current || videoStarted || !ad) return;
    
    // Store a flag to prevent multiple play attempts
    const playAttemptedRef = useRef(false);
    
    // Only attempt to play if we haven't already tried
    if (playAttemptedRef.current) {
      return;
    }
    
    playAttemptedRef.current = true;
    
    // Use a timeout to avoid race conditions, with a longer delay
    const playTimeoutId = setTimeout(() => {
      console.log('%c[VideoAd] Attempting to play video', 'color: #00AAFF;');
      
      if (videoRef.current) {
        // Try to play the video once it's ready
        videoRef.current.play().catch(err => {
          console.error('Error playing video ad:', err);
          // We'll let the error handler in the event listeners deal with recovery
          playAttemptedRef.current = false; // Reset flag to allow retry
        });
      }
    }, 500); // Longer delay for better reliability
    
    return () => {
      clearTimeout(playTimeoutId);
    };
  }, [videoReady, videoStarted, ad]);// Separate effect just for handling skip functionality
  useEffect(() => {
    if (!ad || !videoReady || !allowSkip || canSkip) return;
    
    const skipTime = ad.duration - skipDelay;
    
    // Set up a one-time timeout instead of checking in the interval
    const skipTimeoutId = setTimeout(() => {
      console.log('%c[VideoAd] Skip delay reached - enabling skip button', 'color: #00FF00;');
      setCanSkip(true);
    }, skipDelay * 1000);
    
    return () => {
      clearTimeout(skipTimeoutId);
    };
  }, [ad, videoReady, allowSkip, skipDelay, canSkip]);
  
  // Setup timer separately from skip functionality
  useEffect(() => {
    if (!ad || !videoReady || hideVideoAds) return;
    
    // Use both refs to avoid dependency issues
    const adRef = useRef(ad);
    adRef.current = ad;
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    console.log('%c[VideoAd] Starting countdown timer', 'color: #9900FF;');
    
    // Initial setup - only once
    if (timeRemaining === 0 && adRef.current.duration) {
      setTimeRemaining(adRef.current.duration);
    }
    
    // Setup countdown timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        // Simple countdown without side effects
        const newValue = prev <= 1 ? 0 : prev - 1;
        
        // Clear interval if we're done
        if (newValue <= 0 && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        return newValue;
      });
    }, 1000);

    return () => {
      console.log('%c[VideoAd] Cleaning up timer', 'color: #FF9900;');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [ad, videoReady, hideVideoAds]);

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
          poster={ad.thumbnail || undefined}
          onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
          controlsList="nodownload" // Disable download option
          disablePictureInPicture // Disable picture-in-picture
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

          {allowSkip && (            <button
              className={`${styles.skipButton} ${canSkip ? styles.canSkip : ''}`}
              onClick={handleSkip}
              disabled={!canSkip}
              aria-label="Skip advertisement"
            >
              <FaForward className={styles.skipIcon} />
              <span>
                {canSkip 
                  ? 'Skip Ad' 
                  : `Skip in ${Math.max(0, skipDelay)}s`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoAd;
