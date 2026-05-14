import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Global cache for comments to share between components
const commentsCache = new Map();

const useCommentsCache = (movieSlug) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  // Helper function to get avatar URL with proper handling
  const getAvatarUrl = (avatar) => {
    if (!avatar || avatar === '/img/user-avatar.png') {
      return '/img/user-avatar.png';
    }
    
    let avatarUrl = avatar;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      avatarUrl = avatar;
    } else if (avatar.startsWith('/uploads/')) {
      avatarUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${avatar}`;
    } else {
      avatarUrl = `/img/${avatar}`;
    }
    
    // Add timestamp to force refresh of user-uploaded avatars
    if (avatar.includes('/uploads/')) {
      avatarUrl = `${avatarUrl}?t=${Date.now()}`;
    }
    
    return avatarUrl;
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchComments = async () => {
      if (!movieSlug || movieSlug.trim() === '') {
        setLoading(false);
        return;
      }
      
      const cacheKey = `comments_${movieSlug}`;
      
      // Check cache first
      if (commentsCache.has(cacheKey)) {
        const cachedComments = commentsCache.get(cacheKey);
        if (isMounted) {
          setComments(cachedComments);
          setLoading(false);
        }
        return;
      }
      
      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${API_URL}/comments?movieSlug=${movieSlug}`, {
          signal: abortControllerRef.current.signal,
          timeout: 8000 // 8 second timeout
        });
        
        if (response.status === 200 && isMounted) {
          // Process comments to apply consistent avatar handling
          const processedComments = (response.data.comments || []).map(comment => ({
            ...comment,
            avatar: getAvatarUrl(comment.avatar)
          }));
          
          // Cache the processed comments
          commentsCache.set(cacheKey, processedComments);
          
          setComments(processedComments);
          setError(null);
        }
      } catch (error) {
        if (!axios.isCancel(error) && isMounted) {
          console.error("Error fetching comments:", error);
          setError(error.message || 'Failed to fetch comments');
          setComments([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchComments();
    
    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [movieSlug, API_URL]);

  // Function to update comments cache when new comment is added
  const updateCommentsCache = (newComment) => {
    const cacheKey = `comments_${movieSlug}`;
    const processedComment = {
      ...newComment,
      avatar: getAvatarUrl(newComment.avatar)
    };
    
    const updatedComments = [processedComment, ...comments];
    
    // Update cache
    commentsCache.set(cacheKey, updatedComments);
    
    // Update state
    setComments(updatedComments);
  };

  // Function to remove comment from cache when deleted
  const removeCommentFromCache = (commentId) => {
    const cacheKey = `comments_${movieSlug}`;
    const updatedComments = comments.filter(comment => comment.id !== commentId);
    
    // Update cache
    commentsCache.set(cacheKey, updatedComments);
    
    // Update state
    setComments(updatedComments);
  };

  // Function to update specific comment in cache (for likes/dislikes)
  const updateCommentInCache = (commentId, updates) => {
    const cacheKey = `comments_${movieSlug}`;
    const updatedComments = comments.map(comment => 
      comment.id === commentId ? { ...comment, ...updates } : comment
    );
    
    // Update cache
    commentsCache.set(cacheKey, updatedComments);
    
    // Update state
    setComments(updatedComments);
  };

  // Function to clear cache for a specific movie
  const clearCommentsCache = () => {
    const cacheKey = `comments_${movieSlug}`;
    commentsCache.delete(cacheKey);
  };

  return {
    comments,
    loading,
    error,
    updateCommentsCache,
    removeCommentFromCache,
    updateCommentInCache,
    clearCommentsCache,
    setComments // Keep original setter for backward compatibility
  };
};

export default useCommentsCache;
