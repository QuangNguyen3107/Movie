import React, { useState, useEffect, useRef } from 'react';
import styles from '../../styles/AdPlayer.module.css';

const AdPlayer = ({ onAdComplete, adUrl }) => {
  const [countdown, setCountdown] = useState(5);
  const [adEnded, setAdEnded] = useState(false);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // Reset state when ad URL changes
    setCountdown(5);
    setAdEnded(false);
    
    // Start countdown timer
    timerRef.current = setInterval(() => {
      setCountdown(prevCount => {
        if (prevCount <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [adUrl]);

  const handleAdEnded = () => {
    setAdEnded(true);
    onAdComplete();
  };

  const handleSkipAd = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onAdComplete();
  };

  return (
    <div className={styles.adPlayerContainer}>
      <video
        ref={videoRef}
        className={styles.adVideo}
        src={adUrl}
        autoPlay
        muted={false}
        onEnded={handleAdEnded}
      />
      
      <div className={styles.adOverlay}>
        <div className={styles.adLabel}>
          <span>Quảng cáo</span>
        </div>
        
        {!adEnded && (
          <button 
            className={styles.skipButton}
            onClick={handleSkipAd}
            disabled={countdown > 0}
          >
            {countdown > 0 ? `Bỏ qua sau ${countdown}s` : 'Bỏ qua quảng cáo'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AdPlayer;
