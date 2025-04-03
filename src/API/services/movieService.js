// Movie Service API functions

const API_URL = "http://localhost:5000/api"; // Update this with your actual API URL

const movieService = {
  // Get latest movies
  getLatestMovies: async () => {
    try {
      const response = await fetch(`${API_URL}/movies`);
      if (!response.ok) {
        throw new Error('Failed to fetch latest movies');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching latest movies:', error);
      return { movies: [] };
    }
  },

  // Get top rated movies
  getTopRatedMovies: async () => {
    try {
      const response = await fetch(`${API_URL}/movies/top-rated`);
      if (!response.ok) {
        throw new Error('Failed to fetch top rated movies');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
      return { movies: [] };
    }
  },

  // Get movies by category
  getMoviesByCategory: async (categoryId) => {
    try {
      const response = await fetch(`${API_URL}/movies/category/${categoryId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${categoryId} movies`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${categoryId} movies:`, error);
      return { movies: [] };
    }
  },

  // Get movie details by slug
  getMovieDetails: async (slug) => {
    try {
      const response = await fetch(`${API_URL}/movies/${slug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch movie details');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching movie details:', error);
      throw error;
    }
  }
};

export default movieService;