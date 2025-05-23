// Banner advertisement component that can be displayed at the top or bottom of the page
import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import adService from '@/API/services/adService';
import styles from '@/styles/Advertisement.module.css';
import { useAdContext } from '@/context/AdContext';

/**
 * Displays a banner advertisement
 * @param {Object} props
 * @param {string} props.position - Position of the banner (top or bottom)
 */
const BannerAd = ({ position = 'top' }) => {
  const [ad, setAd] = useState(null);
  const [closed, setClosed] = useState(false);
  const [adTracked, setAdTracked] = useState(false);
  const { hideHomepageAds, isLoading } = useAdContext();
  
  // Log when ad visibility changes
  useEffect(() => {
    console.log(`%c[BannerAd ${position}] Ad visibility status:`, 'color: blue; font-weight: bold', { 
      hideHomepageAds, 
      isLoading 
    });
  }, [hideHomepageAds, isLoading, position]);
  // Fetch the appropriate ad based on position
  useEffect(() => {
    const fetchAd = async () => {      // Always log the current position and ad visibility at the beginning
      console.log(`%c[BannerAd ${position}] Starting ad fetch with hideHomepageAds=${hideHomepageAds}`, 'color: purple; font-weight: bold');
      
      // First, wait if the AdContext is still loading its settings
      if (isLoading) {
        console.log(`%c[BannerAd ${position}] AdContext is loading. Waiting to fetch ad...`, 'color: orange; font-weight: bold');
        setAd(null); // Clear any existing ad while context loads
        return;
      }

      // Now, AdContext is loaded, check if ads should be hidden for ANY position
      // Force both top AND bottom banner ads to be hidden if user is premium
      if (hideHomepageAds) {
        console.log(`%c[BannerAd ${position}] Homepage ads hidden due to premium subscription (position: ${position}).`, 'color: green; font-weight: bold');
        setAd(null); // Ensure ad is cleared if it was previously shown
        return;
      }// If AdContext is loaded and ads are not hidden, proceed to fetch
      console.log(`%c[BannerAd ${position}] AdContext loaded, fetching ad...`, 'color: blue; font-weight: bold');
      try {
        let adData;        // Double check that we still want to show ads based on premium status
        if (hideHomepageAds) {
          console.log(`%c[BannerAd ${position}] Premium user detected, not fetching ads`, 'color: red; font-weight: bold');
          return;  
        }
        
        if (position === 'top') {
          console.log(`%c[BannerAd ${position}] Getting TOP banner ad...`, 'color: blue;');
          adData = await adService.getTopBannerAd();
        } else {
          console.log(`%c[BannerAd ${position}] Getting BOTTOM banner ad...`, 'color: blue;');
          adData = await adService.getBottomBannerAd();
        }
        
        console.log(`%c[BannerAd ${position}] Ad data received:`, 'color: blue;', adData ? 'Ad exists' : 'No ad available');
        
        if (adData) {
          console.log(`%c[BannerAd ${position}] Setting ad data`, 'color: green;');
          setAd(adData);
        } else {
          console.log(`%c[BannerAd ${position}] No ad to set`, 'color: orange;');
        }
      } catch (error) {
        console.error(`Error fetching ${position} banner ad:`, error);
      }
    };    
    fetchAd();
  }, [position, hideHomepageAds, isLoading]);

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

  // Add more detailed logging before deciding whether to render
  const shouldRender = ad && !closed;
  console.log(`%c[BannerAd ${position}] Render decision:`, 'color: purple;', {
    hasAd: !!ad,
    isClosed: closed,
    willRender: shouldRender,
    position
  });

  // Don't render if there's no ad or it's been closed
  if (!shouldRender) {
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
