// Banner advertisement component that can be displayed at the top or bottom of the page
import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import adService from '@/API/services/adService';
import styles from '@/styles/Advertisement.module.css';
import { useAdContext } from '@/context/AdContext';

/**
 * Displays multiple banner advertisements in a fixed layout
 * @param {Object} props
 * @param {string} props.position - Position of the banner (top or bottom)
 * @param {number} props.maxAds - Maximum number of ads to display (default: 3)
 */
const BannerAd = ({ position = 'top', maxAds = 3 }) => {
  const [ads, setAds] = useState([]);
  const [closed, setClosed] = useState(false);
  const [adsTracked, setAdsTracked] = useState({});
  const { hideHomepageAds, isLoading } = useAdContext();
  
  // Log when ad visibility changes
  useEffect(() => {
    console.log(`%c[BannerAd ${position}] Ad visibility status:`, 'color: blue; font-weight: bold', { 
      hideHomepageAds, 
      isLoading 
    });
  }, [hideHomepageAds, isLoading, position]);

  // Fetch the appropriate ads based on position
  useEffect(() => {
    const fetchAds = async () => {
      // Always log the current position and ad visibility at the beginning
      console.log(`%c[BannerAd ${position}] Starting ad fetch with hideHomepageAds=${hideHomepageAds}`, 'color: purple; font-weight: bold');
      
      // First, wait if the AdContext is still loading its settings
      if (isLoading) {
        console.log(`%c[BannerAd ${position}] AdContext is loading. Waiting to fetch ad...`, 'color: orange; font-weight: bold');
        setAds([]); // Clear any existing ads while context loads
        return;
      }

      // Now, AdContext is loaded, check if ads should be hidden for ANY position
      // Force both top AND bottom banner ads to be hidden if user is premium
      if (hideHomepageAds) {
        console.log(`%c[BannerAd ${position}] Homepage ads hidden due to premium subscription (position: ${position}).`, 'color: green; font-weight: bold');
        setAds([]); // Ensure ads are cleared if they were previously shown
        return;
      }

      // If AdContext is loaded and ads are not hidden, proceed to fetch
      console.log(`%c[BannerAd ${position}] AdContext loaded, fetching ads...`, 'color: blue; font-weight: bold');
      try {
        // Double check that we still want to show ads based on premium status
        if (hideHomepageAds) {
          console.log(`%c[BannerAd ${position}] Premium user detected, not fetching ads`, 'color: red; font-weight: bold');
          return;  
        }
        
        console.log(`%c[BannerAd ${position}] Getting multiple ${position.toUpperCase()} banner ads...`, 'color: blue;');
        const adsData = await adService.getMultipleBannerAds(position, maxAds);
        
        console.log(`%c[BannerAd ${position}] Ads data received:`, 'color: blue;', adsData ? `${adsData.length} ads exist` : 'No ads available');
        
        if (adsData && adsData.length > 0) {
          console.log(`%c[BannerAd ${position}] Setting ads data`, 'color: green;');
          setAds(adsData);
        } else {
          console.log(`%c[BannerAd ${position}] No ads to set`, 'color: orange;');
        }
      } catch (error) {
        console.error(`Error fetching ${position} banner ads:`, error);
      }
    };    
    fetchAds();
  }, [position, hideHomepageAds, isLoading, maxAds]);

  // Track impression when ads are viewed
  useEffect(() => {
    const trackImpressions = async () => {
      for (const ad of ads) {
        if (!adsTracked[ad._id]) {
          try {
            await adService.trackAdImpression(ad._id);
            setAdsTracked(prev => ({ ...prev, [ad._id]: true }));
          } catch (error) {
            console.error('Error tracking ad impression:', error);
          }
        }
      }
    };

    if (ads.length > 0) {
      trackImpressions();
    }
  }, [ads, adsTracked]);

  // Handle ad click for a specific ad
  const handleAdClick = async (adId) => {
    const ad = ads.find(a => a._id === adId);
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

  // Handle closing the ads
  const handleClose = () => {
    setClosed(true);
  };
  // Determine whether to render the ad
  const shouldRender = ads.length > 0 && !closed;

  // Don't render if there are no ads or it's been closed
  if (!shouldRender) {
    return null;
  }

  return (
    <div className={`${styles.bannerContainer} ${styles[position]} ${styles.fadeIn}`}>
      <div className={styles.bannerContent}>
        <div className={styles.multiAdContainer}>
          {ads.map(ad => (
            <div 
              key={ad._id} 
              className={styles.bannerImage} 
              onClick={() => handleAdClick(ad._id)}
            >
              <img src={ad.content} alt={ad.name} />
              <div className={styles.adOverlay}>
                <span className={styles.adLabel}>Quảng cáo</span>
                <span className={styles.advertiserName}>{ad.advertiser}</span>
              </div>
            </div>
          ))}
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
