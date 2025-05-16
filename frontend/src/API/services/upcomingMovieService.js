// Upcoming Movie Service API functions

const API_URL = "http://localhost:5000/api"; // Update this with your actual API URL

const upcomingMovieService = {
  // Get upcoming movies with optional filters
  getUpcomingMovies: async (page = 1, limit = 10) => {
    try {
      const response = await fetch(
        `${API_URL}/upcoming-movies?page=${page}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch upcoming movies');
      }
      const data = await response.json();
      
      if (data.success && data.upcomingMovies) {        // Process movies to add additional info
        const processedMovies = data.upcomingMovies.map(movie => {
          // Format release date
          const releaseDate = new Date(movie.release_date);
          const formattedDate = releaseDate.toLocaleDateString('vi-VN');
          
          // Make sure URLs are absolute
          const thumb_url = movie.thumb_url?.startsWith('http') 
            ? movie.thumb_url 
            : `${movie.thumb_url}`;
            
          const poster_url = movie.poster_url?.startsWith('http')
            ? movie.poster_url
            : `${movie.poster_url}`;
          
          return {
            ...movie,
            thumb_url,
            poster_url,
            formattedReleaseDate: formattedDate,
            daysUntilRelease: Math.ceil((releaseDate - new Date()) / (1000 * 60 * 60 * 24)),
            countdownText: getCountdownText(releaseDate)
          };
        });
        
        // Sort by release date (closest first)
        const sortedMovies = processedMovies.sort((a, b) => {
          const dateA = new Date(a.release_date);
          const dateB = new Date(b.release_date);
          return dateA - dateB; // Sort by closest release date
        });
        
        return {
          success: true,
          upcomingMovies: sortedMovies,
          pagination: {
            currentPage: data.currentPage,
            totalPages: data.totalPages,
            totalCount: data.totalCount
          }
        };
      }
      
      return { success: false, upcomingMovies: [] };
    } catch (error) {
      console.error('Error fetching upcoming movies:', error);
      return { success: false, upcomingMovies: [], error: error.message };
    }
  },
  
  // Get upcoming movie details by ID
  getUpcomingMovieById: async (movieId) => {
    try {
      const response = await fetch(`${API_URL}/admin/upcoming-movies/${movieId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch upcoming movie details');
      }
      const data = await response.json();
      
      if (data.success && data.upcomingMovie) {
        const movie = data.upcomingMovie;
        const releaseDate = new Date(movie.release_date);
        
        return {
          success: true,
          upcomingMovie: {
            ...movie,
            formattedReleaseDate: releaseDate.toLocaleDateString('vi-VN'),
            daysUntilRelease: Math.ceil((releaseDate - new Date()) / (1000 * 60 * 60 * 24)),
            countdownText: getCountdownText(releaseDate)
          }
        };
      }
      
      return { success: false, upcomingMovie: null };
    } catch (error) {
      console.error('Error fetching upcoming movie details:', error);
      return { success: false, upcomingMovie: null, error: error.message };
    }
  },

  // Get upcoming movie by slug
  getUpcomingMovieBySlug: async (slug) => {
    try {
      const response = await fetch(`${API_URL}/upcoming-movies/${slug}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch upcoming movie');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in getUpcomingMovieBySlug:', error);
      return { success: false, error: error.message };
    }
  },

  // Get upcoming movies by category
  getUpcomingMoviesByCategory: async (categorySlug, page = 1, limit = 10) => {
    try {
      const response = await fetch(
        `${API_URL}/upcoming-movies/category/${categorySlug}?page=${page}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch upcoming movies by category');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in getUpcomingMoviesByCategory:', error);
      return { success: false, error: error.message };
    }
  }
};

// Helper function to generate countdown text
function getCountdownText(releaseDate) {
  const now = new Date();
  const timeDiff = releaseDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 0) {
    return "Đã ra mắt";
  } else if (daysDiff === 1) {
    return "Ra mắt ngày mai";
  } else if (daysDiff <= 7) {
    return `Ra mắt sau ${daysDiff} ngày`;
  } else if (daysDiff <= 30) {
    const weeks = Math.ceil(daysDiff / 7);
    return `Ra mắt sau ${weeks} tuần`;
  } else {
    const months = Math.ceil(daysDiff / 30);
    return `Ra mắt sau ${months} tháng`;
  }
}

export default upcomingMovieService;
