export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const endpoints = {
  movies: {
    detail: (slug) => `${API_URL}/movies/${slug}`,
    related: (category, limit) => `${API_URL}/movies?category=${category}&limit=${limit}`,
    search: (query) => `${API_URL}/movies/search?q=${query}`
  }
};