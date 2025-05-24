import React, { useState, useEffect, useRef } from 'react';
import { FaForward } from 'react-icons/fa';
import adService from '@/API/services/adService';
import styles from '../../styles/AdPlayer.module.css';
import { useAdContext } from '@/context/AdContext'; // Import AdContext

const AdPlayerFixed = ({ onAdComplete, allowSkip = true, skipDelay = 5 }) => {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [adTracked, setAdTracked] = useState(false);
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const skipCountdownRef = useRef(skipDelay);
  const { hideVideoAds, isLoading: isAdContextLoading } = useAdContext(); // Use AdContext

  // Kiểm tra người dùng Premium để bỏ qua quảng cáo
  useEffect(() => {
    // Nếu người dùng là Premium và có quyền ẩn quảng cáo
    if (hideVideoAds === true) {
      console.log('%c[AdPlayer] PREMIUM USER DETECTED - SKIPPING AD!', 'color: #00FF00; font-weight: bold; font-size: 14px');
      // Dừng video nếu đang chạy
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = ""; // Xóa nguồn video
      }
      
      // Xóa timer nếu có
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Gọi onComplete để bỏ qua quảng cáo
      onAdComplete();
    }
  }, [hideVideoAds, onAdComplete]);

  // Fetch a random video ad - chỉ khi người dùng không phải Premium
  useEffect(() => {
    // Nếu là người dùng Premium, bỏ qua việc tải quảng cáo
    if (hideVideoAds === true) {
      return;
    }

    // Nếu AdContext đang tải, đợi
    if (isAdContextLoading) {
      console.log('%c[AdPlayer] AdContext đang tải, đợi...', 'color: #FFA500; font-weight: bold');
      return;
    }

    const fetchRandomAd = async () => {
      try {
        setLoading(true);
        // Lấy quảng cáo video ngẫu nhiên
        const adData = await adService.getRandomAd('video');
        console.log('[AdPlayer] Đã nhận quảng cáo:', adData);
        setAd(adData);
      } catch (error) {
        console.error('[AdPlayer] Lỗi khi tải quảng cáo:', error);
        // Nếu lỗi, bỏ qua và chuyển đến nội dung
        onAdComplete();
      } finally {
        setLoading(false);
      }
    };

    fetchRandomAd();
  }, [hideVideoAds, isAdContextLoading, onAdComplete]);

  useEffect(() => {
    if (!ad || hideVideoAds === true) return;

    // Khởi tạo bộ đếm thời gian cho quảng cáo
    const adDuration = videoRef.current?.duration || 30;
    setTimeRemaining(Math.ceil(adDuration));

    // Theo dõi tiến trình của video
    const handleTimeUpdate = () => {
      if (!videoRef.current) return;
      
      const remaining = Math.ceil(videoRef.current.duration - videoRef.current.currentTime);
      setTimeRemaining(remaining);

      // Nếu còn 75% thời gian video và chưa được theo dõi, ghi lại lượt xem
      if (!adTracked && videoRef.current.currentTime > videoRef.current.duration * 0.25) {
        try {
          // Ghi lại lượt xem quảng cáo
          adService.trackAdView(ad._id);
          setAdTracked(true);
          console.log('[AdPlayer] Đã ghi lại lượt xem quảng cáo');
        } catch (error) {
          console.error('[AdPlayer] Lỗi khi ghi lượt xem:', error);
        }
      }
    };

    // Khi video kết thúc
    const handleVideoEnded = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      onAdComplete();
    };

    // Bắt đầu bộ đếm cho nút bỏ qua
    if (allowSkip && skipDelay > 0) {
      skipCountdownRef.current = skipDelay;
      timerRef.current = setInterval(() => {
        skipCountdownRef.current -= 1;
        if (skipCountdownRef.current <= 0) {
          setCanSkip(true);
          clearInterval(timerRef.current);
        }
      }, 1000);
    } else if (allowSkip && skipDelay === 0) {
      setCanSkip(true);
    }

    // Thêm các event listeners
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      videoElement.addEventListener('ended', handleVideoEnded);
    }

    // Clean up
    return () => {
      if (videoElement) {
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement.removeEventListener('ended', handleVideoEnded);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [ad, allowSkip, hideVideoAds, onAdComplete, skipDelay]);

  // Xử lý khi user bỏ qua quảng cáo
  const handleSkip = () => {
    if (canSkip) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      onAdComplete();
    }
  };

  // Nếu người dùng là Premium hoặc quảng cáo đang tải
  if (hideVideoAds === true || isAdContextLoading) {
    return null; // Không hiển thị gì cả
  }

  if (loading && !ad) {
    return (
      <div className={styles.adPlayerContainer}>
        <div className={styles.adLoading}>
          <div className={styles.spinner}></div>
          <p>Đang tải quảng cáo...</p>
        </div>
      </div>
    );
  }

  if (!ad) {
    // Nếu không có quảng cáo, chuyển đến nội dung chính
    onAdComplete();
    return null;
  }

  return (
    <div className={styles.adPlayerContainer}>
      <div className={styles.adOverlay}>
        <span className={styles.adBadge}>
          Quảng cáo
        </span>
        
        {allowSkip && (
          <button 
            className={`${styles.skipButton} ${canSkip ? styles.skipButtonActive : styles.skipButtonDisabled}`}
            onClick={handleSkip}
            disabled={!canSkip}
          >
            <FaForward />
            <span>
              {canSkip ? 'Bỏ qua' : `Bỏ qua sau ${skipCountdownRef.current}s`}
            </span>
          </button>
        )}
        
        <div className={styles.adCountdown}>
          {timeRemaining > 0 && `Quảng cáo kết thúc sau: ${timeRemaining}s`}
        </div>
        
        <div className={styles.adInfoOverlay}>
          <h3>{ad.title}</h3>
          {ad.callToAction && (
            <a 
              href={ad.targetUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.adCTA}
              onClick={() => {
                try {
                  // Ghi lại lượt click quảng cáo
                  adService.trackAdClick(ad._id);
                  console.log('[AdPlayer] Đã ghi lại lượt click quảng cáo');
                } catch (error) {
                  console.error('[AdPlayer] Lỗi khi ghi lượt click:', error);
                }
              }}
            >
              {ad.callToAction}
            </a>
          )}
        </div>
      </div>
      
      <video 
        ref={videoRef}
        className={styles.adVideo}
        src={ad.mediaUrl}
        autoPlay
        muted={false}
        controls={false}
      />
    </div>
  );
};

export default AdPlayerFixed;
