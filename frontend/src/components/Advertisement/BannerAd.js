// Banner advertisement component that can be displayed at the top or bottom of the page
import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import adService from '@/API/services/adService';
import styles from '@/styles/Advertisement.module.css';

/**
 * Displays a banner advertisement
 * @param {Object} props
 * @param {string} props.position - Position of the banner (top or bottom)
 */
const BannerAd = ({ position = 'top' }) => {
  const [ad, setAd] = useState(null);
  const [closed, setClosed] = useState(false);
  const [adTracked, setAdTracked] = useState(false);

  // Fetch the appropriate ad based on position
  useEffect(() => {
    const fetchAd = async () => {
      try {
        let adData;
        if (position === 'top') {
          adData = await adService.getTopBannerAd();
        } else {
          adData = await adService.getBottomBannerAd();
        }
        
        if (adData) {
          setAd(adData);
        }
      } catch (error) {
        console.error(`Error fetching ${position} banner ad:`, error);
      }
    };

    fetchAd();
  }, [position]);

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

  // Handle ad click
  const handleAdClick = async () => {
    if (!ad) return;
    
    try {
      await adService.trackAdClick(ad._id);
      window.open(ad.link, '_blank');
    } catch (error) {
      console.error('Error tracking ad click:', error);
      // Still open the link even if tracking fails
      window.open(ad.link, '_blank');
    }
  };

  // Handle closing the ad
  const handleClose = () => {
    setClosed(true);
  };

  // Don't render if there's no ad or it's been closed
  if (!ad || closed) {
    return null;
  }
  return (
    <div className={`${styles.bannerContainer} ${styles[position]} ${styles.fadeIn}`}>
      <div className={styles.bannerContent}>
        <div className={styles.bannerImage} onClick={handleAdClick}>
          <img src={ad.content} alt={ad.name} />
          <div className={styles.adOverlay}>
            <span className={styles.adLabel}>Quảng cáo</span>
            <span className={styles.advertiserName}>{ad.advertiser}</span>
          </div>
        </div>
        <button 
          className={styles.closeButton} 
          onClick={handleClose}
          aria-label="Close advertisement"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

export default BannerAd;
