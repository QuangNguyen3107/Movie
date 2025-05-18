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
  const [loading, setLoading] = useState(true); // Local loading state for the ad fetching itself
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [adTracked, setAdTracked] = useState(false);
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const { hideVideoAds, isLoading: isAdContextLoading } = useAdContext(); // Renamed isLoading to avoid conflict
  // QUAN TRỌNG: Effect này sẽ chạy NẾU hideVideoAds thay đổi vào BẤT KỲ LÚC NÀO
  useEffect(() => {
    // Logic đặc biệt chỉ cho hideVideoAds
    if (hideVideoAds === true) {
      console.log('%c[VideoAd] PREMIUM USER DETECTED - SKIPPING AD!', 'color: #00FF00; font-weight: bold; font-size: 14px');
      // Đảm bảo video được tải đang pause
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = ""; // Xóa nguồn video
      }
      
      // Xóa mọi timer đang chạy
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Xóa state ad và gọi onComplete ngay lập tức
      setAd(null);
      setLoading(false);
      onComplete(); // Quan trọng: Gọi onComplete() để bỏ qua quảng cáo
      
      return; // Thoát effect ngay lập tức
    }
  }, [hideVideoAds, onComplete]); // Chỉ phụ thuộc vào hideVideoAds và onComplete
  
  // Thêm effect mới đảm bảo không hiển thị quảng cáo ngay khi component mount nếu là premium
  useEffect(() => {
    // Chạy ngay khi component mount
    console.log('%c[VideoAd] INITIAL CHECK - hideVideoAds:', 'color: #9900FF; font-weight: bold', hideVideoAds);
    
    if (hideVideoAds === true) {
      console.log('%c[VideoAd] PREMIUM USER DETECTED AT MOUNT - SKIPPING AD!', 'color: #FF00FF; font-weight: bold; font-size: 14px');
      onComplete(); // Bỏ qua quảng cáo ngay lập tức
    }
  }, []); // Chỉ chạy một lần khi component mount

  // Effect to decide if an ad should be fetched/played
  useEffect(() => {
    // Kiểm tra nếu người dùng premium thì thoát ngay - đã được xử lý bởi effect riêng ở trên
    if (hideVideoAds) {
      console.log('%c[VideoAd] Premium user detected in main effect - exiting', 'color: #00FF00;');
      return;
    }

    // If AdContext is still loading its settings, wait.
    if (isAdContextLoading) {
      console.log('%c[VideoAd] AdContext is loading. Waiting...', 'color: #ffa500; font-weight: bold');
      return; // Exit and wait for isAdContextLoading to become false
    }

    // At this point, hideVideoAds is false AND isAdContextLoading is false.
    // Proceed to fetch an ad.
    const fetchAdInternal = async () => {
      console.log('%c[VideoAd] Fetching video ad...', 'color: #0000ff; font-weight: bold');
      setLoading(true); // Set local loading true for the ad fetch
      try {
        const adData = await adService.getRandomVideoAd();
        
        // Kiểm tra lại hideVideoAds sau khi fetch hoàn thành (có thể đã thay đổi)
        if (hideVideoAds) {
          console.log('%c[VideoAd] Premium status changed during fetch - skipping ad', 'color: #00FF00;');
          onComplete();
          return;
        }
        
        if (adData) {
          setAd(adData);
          setTimeRemaining(adData.duration || 15);
        } else {
          console.log('%c[VideoAd] No ad data returned from service. Completing.', 'color: #ffa500; font-weight: bold');
          onComplete(); // No ad to play
        }
      } catch (error) {
        console.error('Error fetching video ad:', error);
        onComplete(); // Skip on error
      } finally {
        setLoading(false); // Done with local loading
      }
    };

    fetchAdInternal();

    // Cleanup for this effect
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [hideVideoAds, isAdContextLoading, onComplete]); // Dependencies for this effect

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
