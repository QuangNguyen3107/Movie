// This file manages the ad-related API calls and logic

const SAMPLE_ADS = [
  {
    id: 1,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    advertiser: 'Sample Advertiser 1',
    duration: 15
  },
  {
    id: 2,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    advertiser: 'Sample Advertiser 2',
    duration: 15
  },
  {
    id: 3,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    advertiser: 'Sample Advertiser 3',
    duration: 15
  }
];

const adService = {
  // Get a random ad to display
  getRandomAd: async () => {
    try {
      // In a real implementation, you would fetch this from your backend
      // const response = await fetch(`${API_URL}/ads/random`);
      // return await response.json();
      
      // For demo purposes, return a random sample ad
      const randomIndex = Math.floor(Math.random() * SAMPLE_ADS.length);
      return SAMPLE_ADS[randomIndex];
    } catch (error) {
      console.error('Error fetching ad:', error);
      // Fallback to a default ad if there's an error
      return SAMPLE_ADS[0];
    }
  },
  
  // Log that an ad was viewed (for analytics)
  logAdView: async (adId) => {
    try {
      // In a real implementation, you would post this to your backend
      // await fetch(`${API_URL}/ads/view`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ adId })
      // });
      console.log(`Ad view logged for ad ID: ${adId}`);
      return true;
    } catch (error) {
      console.error('Error logging ad view:', error);
      return false;
    }
  },
  
  // Log that an ad was skipped (for analytics)
  logAdSkip: async (adId, skipTime) => {
    try {
      // In a real implementation, you would post this to your backend
      // await fetch(`${API_URL}/ads/skip`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ adId, skipTime })
      // });
      console.log(`Ad skip logged for ad ID: ${adId} at ${skipTime}s`);
      return true;
    } catch (error) {
      console.error('Error logging ad skip:', error);
      return false;
    }
  }
};

export default adService;
