import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Link from 'next/link';
import Navbar from "../../components/Layout/Navbar";
import styles from "../../styles/MovieDetail.module.css";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { RESTRICTED_WORDS, containsRestrictedWords } from "../../constants/inconsiderate";

// Add this constant at the top of your component
const MAX_COMMENTS_PER_DAY = 10000; // Maximum comments allowed per day

// Add this function to check daily comment limit
const checkCommentLimit = (username) => {
  const today = new Date().toLocaleDateString('vi-VN');
  const commentStats = JSON.parse(localStorage.getItem('commentStats') || '{}');
  
  if (!commentStats[today]) {
    commentStats[today] = {};
  }
  
  if (!commentStats[today][username]) {
    commentStats[today][username] = 0;
  }
  
  return {
    count: commentStats[today][username],
    updateCount: () => {
      commentStats[today][username]++;
      localStorage.setItem('commentStats', JSON.stringify(commentStats));
    },
    hasReachedLimit: commentStats[today][username] >= MAX_COMMENTS_PER_DAY
  };
};

const MovieDetail = () => {
  const router = useRouter();
  const { slug } = router.query;
  
  // Add the report reasons array
  const reportReasons = [
    "Phim không xem được",
    "Âm thanh không đồng bộ", 
    "Phụ đề không hiển thị",
    "Chất lượng phim kém",
    "Nội dung không phù hợp",
    "Lỗi máy chủ",
    "Lý do khác"
  ];
  const [guestName, setGuestName] = useState("");
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedServer, setSelectedServer] = useState(0);
  const [selectedEpisode, setSelectedEpisode] = useState(0);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [showQualitySettings, setShowQualitySettings] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [tempRating, setTempRating] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoRef, setVideoRef] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [aspectRatio, setAspectRatio] = useState('default');
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState([
    { label: 'Tự động', value: 'auto' },
    { label: '1080p', value: '1080' },
    { label: '720p', value: '720' },
    { label: '480p', value: '480' },
    { label: '360p', value: '360' }
  ]);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#000");
  const [videoLoading, setVideoLoading] = useState(true);
  const [contentLoaded, setContentLoaded] = useState(false);

  const scrollContainerRef = useRef(null);

  const [trailerUrl, setTrailerUrl] = useState('');
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  // Add this state to track dragging
  const [isDragging, setIsDragging] = useState(false);

  // Add these event handlers to the component
  const handleBeforeChange = () => {
    setIsDragging(true);
  };

  const handleAfterChange = () => {
    // Use a small timeout to prevent link activation right after drag
    setTimeout(() => {
      setIsDragging(false);
    }, 300);
  };

  // Custom arrow components for Slick
  const SlickArrowLeft = ({ currentSlide, slideCount, ...props }) => (
    <button
      {...props}
      className={`${styles.slickArrow} ${styles.slickPrev}`}
      aria-hidden="true"
      aria-disabled={currentSlide === 0 ? true : false}
      type="button"
    />
  );

  const SlickArrowRight = ({ currentSlide, slideCount, ...props }) => (
    <button
      {...props}
      className={`${styles.slickArrow} ${styles.slickNext}`}
      aria-hidden="true"
      aria-disabled={currentSlide === slideCount - 1 ? true : false}
      type="button"
    />
  );

  // Slick settings
  const sliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1, // Change to 1 for smoother scrolling
    initialSlide: 0,
    swipeToSlide: true,
    draggable: true,
    cssEase: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth easing
    useCSS: true,
    useTransform: true,
    variableWidth: false, // Set to false for consistent sizing
    touchThreshold: 8, // Make it easier to trigger swipe
    waitForAnimate: false, // Don't wait for animation to finish
    swipe: true,
    prevArrow: <SlickArrowLeft />,
    nextArrow: <SlickArrowRight />,
    beforeChange: handleBeforeChange,
    afterChange: handleAfterChange,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1, // Change to 1
        }
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1, // Change to 1
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      }
    ]
  };

  // Add this function to handle image loading completion
  const handleImageLoaded = () => {
    setImageLoaded(true);
    
    // If all primary content is loaded, mark as fully loaded
    if (!loading) {
      setContentLoaded(true);
    }
  };

  // Make sure to add a fallback in case images don't load
  useEffect(() => {
    if (!loading && !contentLoaded) {
      // If data is loaded but images aren't, set a timeout to remove blur anyway
      const timer = setTimeout(() => {
        setContentLoaded(true);
      }, 3000); // 3 seconds max wait for images
    
      return () => clearTimeout(timer);
    }
  }, [loading, contentLoaded]);

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.8; // Scroll 80% of visible width
      
      container.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.8; // Scroll 80% of visible width
      
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    // Auto scroll functionality (optional)
    let autoScrollInterval;
    
    const startAutoScroll = () => {
      autoScrollInterval = setInterval(() => {
        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 50) {
          // If at the end, scroll back to start
          container.scrollTo({
            left: 0,
            behavior: 'smooth'
          });
        } else {
          // Scroll right
          scrollRight();
        }
      }, 8000); // Auto scroll every 8 seconds
    };
    
    const stopAutoScroll = () => {
      if (autoScrollInterval) clearInterval(autoScrollInterval);
    };
    
    // Start auto scroll when component mounts
    if (relatedMovies.length > 0) {
      startAutoScroll();
    }
    
    // Pause on hover
    container.addEventListener('mouseenter', stopAutoScroll);
    container.addEventListener('mouseleave', startAutoScroll);
    
    return () => {
      stopAutoScroll();
      if (container) {
        container.removeEventListener('mouseenter', stopAutoScroll);
        container.removeEventListener('mouseleave', startAutoScroll);
      }
    };
  }, [relatedMovies, contentLoaded]);

  useEffect(() => {
    // Kiểm tra người dùng đã đăng nhập từ localStorage
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
  }, []);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        setContentLoaded(false);
        
        const response = await fetch(`https://ophim1.com/phim/${slug}`);
        const data = await response.json();

        if (data.status && data.movie) {
          console.log("Movie data:", data.movie);

          // Xử lý URL ảnh
          const processedMovie = {
            ...data.movie,
            episodes: data.episodes || [],
            thumb_url: data.movie.thumb_url?.startsWith('http')
              ? data.movie.thumb_url
              : `${data.pathImage}${data.movie.thumb_url}`,
            poster_url: data.movie.poster_url?.startsWith('http')
              ? data.movie.poster_url
              : `${data.pathImage}${data.movie.poster_url}`
          };

          setMovie(processedMovie);

          // Fetch related movies based on category
          if (data.movie.category && data.movie.category.length > 0) {
            try {
              // Xác định category name
              const categoryName = typeof data.movie.category[0] === 'object'
                ? data.movie.category[0].name
                : data.movie.category[0];

              console.log("Fetching related movies for category:", categoryName);

              // Fix API endpoint - change 'danh-sách' to 'danh-sach' (without accent)
              const relatedResponse = await fetch(`https://ophim1.com/danh-sach/phim-moi-cap-nhat?category=${encodeURIComponent(categoryName)}&limit=12`);

              if (!relatedResponse.ok) {
                throw new Error(`HTTP error! status: ${relatedResponse.status}`);
              }

              const relatedData = await relatedResponse.json();
              console.log("Related API response:", relatedData);

              if (relatedData.items && Array.isArray(relatedData.items)) {
                // Xử lý URL ảnh cho phim liên quan
                const processedRelatedMovies = relatedData.items
                  .filter(item => item.slug !== slug)
                  .map(movie => ({
                    ...movie,
                    thumb_url: movie.thumb_url?.startsWith('http')
                      ? movie.thumb_url
                      : `${relatedData.pathImage}${movie.thumb_url}`,
                    poster_url: movie.poster_url?.startsWith('http')
                      ? movie.poster_url
                      : `${relatedData.pathImage}${movie.poster_url}`
                  }));

                console.log("Processed related movies:", processedRelatedMovies.length);
                setRelatedMovies(processedRelatedMovies);
              } else {
                console.error("Related data format is incorrect:", relatedData);
              }
            } catch (relatedError) {
              console.error("Error fetching related movies:", relatedError);
            }
          }
          setLoading(false);
        } else {
          setError("Không tìm thấy phim");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching movie:", err);
        setError("Có lỗi xảy ra khi tải phim");
        setLoading(false);
      }
    };

    fetchMovie();
  }, [slug]);

  useEffect(() => {
    // Kiểm tra trạng thái yêu thích và xem sau từ localStorage
    const checkUserPreferences = () => {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const watchLater = JSON.parse(localStorage.getItem('watchLater') || '[]');
      const savedRating = localStorage.getItem(`rating_${slug}`);

      setIsFavorite(favorites.includes(slug));
      setIsWatchLater(watchLater.includes(slug));
      if (savedRating) setUserRating(parseInt(savedRating));
    };

    checkUserPreferences();
  }, [slug]);

  useEffect(() => {
    const iframe = document.querySelector('iframe');
    if (iframe) {
      setVideoRef(iframe);

      // Lắng nghe thông điệp từ iframe
      window.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'timeupdate') {
            setCurrentTime(data.time);
          }
        } catch (e) {
          // Bỏ qua lỗi parse JSON
        }
      });
    }
  }, [selectedServer, selectedEpisode]);

  useEffect(() => {
    if (movie?.poster_url || movie?.thumb_url) {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Thêm CORS
      img.src = movie.poster_url || movie.thumb_url;
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, 1, 1);
          const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
          setBackgroundColor(`rgb(${r}, ${g}, ${b})`);
        } catch (error) {
          console.error("Lỗi khi lấy màu từ hình ảnh:", error);
          setBackgroundColor("#000"); // Màu nền mặc định
        }
      };
      img.onerror = () => {
        console.error("Không thể tải hình ảnh.");
        setBackgroundColor("#000"); // Màu nền mặc định
      };
    }
  }, [movie]);

  const handleFavorite = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (isFavorite) {
      const newFavorites = favorites.filter(id => id !== slug);
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      setIsFavorite(false);
    } else {
      favorites.push(slug);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      setIsFavorite(true);
    }
  };

  const handleWatchLater = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const watchLater = JSON.parse(localStorage.getItem('watchLater') || '[]');
    if (isWatchLater) {
      const newWatchLater = watchLater.filter(id => id !== slug);
      localStorage.setItem('watchLater', JSON.stringify(newWatchLater));
      setIsWatchLater(false);
    } else {
      watchLater.push(slug);
      localStorage.setItem('watchLater', JSON.stringify(watchLater));
      setIsWatchLater(true);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleReport = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setShowReportModal(true);
  };

  const submitReport = () => {
    // Xử lý gửi báo cáo
    console.log('Báo cáo:', { movieSlug: slug, reason: reportReason });
    setShowReportModal(false);
    setReportReason('');
    // Hiển thị thông báo thành công
    alert('Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét và khắc phục sớm nhất!');
  };

  // Hàm xử lý đánh giá với cập nhật tổng đánh giá
  const handleRating = (value) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Lấy đánh giá cũ (nếu có)
    const oldRating = userRating;
    // Cập nhật đánh giá mới
    setUserRating(value);

    // Lưu đánh giá vào localStorage
    localStorage.setItem(`rating_${slug}`, value.toString());

    // Tính toán điểm đánh giá mới và số lượt đánh giá mới
    let newRating = movie.rating || 7; // Mặc định là 7 nếu không có rating
    let newRatingCount = movie.rating_count || 10; // Mặc định là 10 nếu không có rating_count

    if (oldRating > 0) {
      // Nếu đã đánh giá trước đó, cần loại bỏ đánh giá cũ trước
      newRating = ((newRating * newRatingCount) - oldRating) / (newRatingCount - 1);
      newRatingCount -= 1;
    }

    // Thêm đánh giá mới
    newRating = ((newRating * newRatingCount) + value) / (newRatingCount + 1);
    newRatingCount += 1;

    // Cập nhật state của movie với điểm đánh giá và số lượt đánh giá mới
    setMovie(prev => ({
      ...prev,
      rating: newRating,
      rating_count: newRatingCount
    }));

    // Đóng modal đánh giá
    setShowRatingModal(false);

    // Hiển thị thông báo cảm ơn
    toast.success('Cảm ơn bạn đã đánh giá phim!');
  };

  const handleShowRating = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setTempRating(userRating);
    setShowRatingModal(true);
  };

  const handleFullscreen = () => {
    const player = document.getElementById("video-player");
    if (player.requestFullscreen) {
      player.requestFullscreen();
    } else if (player.webkitRequestFullscreen) {
      player.webkitRequestFullscreen();
    } else if (player.msRequestFullscreen) {
      player.msRequestFullscreen();
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return "N/A";

    // Nếu là số, xử lý định dạng phút --> giờ:phút
    if (!isNaN(duration)) {
      const minutes = parseInt(duration);
      if (minutes < 60) return `${minutes} phút`;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
    }

    // Xử lý chuỗi thời lượng
    if (typeof duration === 'string') {
      // Nếu đã có định dạng như "45 phút" hoặc "1h30m"
      if (duration.includes('phút') || duration.includes('h') || duration.includes('m')) {
        return duration;
      }

      // Xử lý định dạng "45" hoặc "1:30:00"
      if (duration.includes(':')) {
        const parts = duration.split(':');
        if (parts.length === 3) {
          const hours = parseInt(parts[0]);
          const minutes = parseInt(parts[1]);
          return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
        } else if (parts.length === 2) {
          return `${parseInt(parts[0])}h${parseInt(parts[1]) > 0 ? ` ${parseInt(parts[1])}m` : ''}`;
        }
      }

      // Thử chuyển đổi sang số
      const numericDuration = parseInt(duration);
      if (!isNaN(numericDuration)) {
        if (numericDuration < 60) return `${numericDuration} phút`;
        const hours = Math.floor(numericDuration / 60);
        const remainingMinutes = numericDuration % 60;
        return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
      }

      // Trả về nguyên gốc nếu không xác định định dạng
      return duration;
    }

    // Trả về N/A nếu không xác định được
    return "N/A";
  };

  const handlePlayTrailer = () => {
    try {
      // Hiển thị modal trước, với trạng thái loading
      setShowTrailerModal(true);
      setTrailerUrl('');
      
      // Tạo query tìm kiếm tối ưu
      const searchQuery = encodeURIComponent(`${movie.name} ${movie.origin_name || ''} ${movie.year || ''} official trailer`);
      
      // Sử dụng Dailymotion API để tìm kiếm trailer
      fetch(`https://api.dailymotion.com/videos?fields=id,title,thumbnail_url&search=${searchQuery}&limit=1`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          if (data.list && data.list.length > 0) {
            // Lấy ID video đầu tiên từ kết quả tìm kiếm
            const videoId = data.list[0].id;
            
            // Tạo URL nhúng Dailymotion với autoplay
            const embedUrl = `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`;
            
            // Đặt URL sau một khoảng thời gian để đảm bảo modal đã hiển thị đầy đủ
            setTimeout(() => {
              setTrailerUrl(embedUrl);
            }, 500);
          } else {
            throw new Error('Không tìm thấy video trên Dailymotion');
          }
        })
        .catch(error => {
          console.error('Lỗi khi tìm kiếm trên Dailymotion:', error);
          
          // Thử với query đơn giản hơn nếu thất bại
          const fallbackQuery = encodeURIComponent(`${movie.name} trailer`);
          
          fetch(`https://api.dailymotion.com/videos?fields=id,title&search=${fallbackQuery}&limit=1`)
            .then(response => response.json())
            .then(data => {
              if (data.list && data.list.length > 0) {
                const videoId = data.list[0].id;
                const embedUrl = `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`;
                
                setTimeout(() => {
                  setTrailerUrl(embedUrl);
                }, 500);
              } else {
                throw new Error('Không tìm thấy video với tìm kiếm đơn giản hơn');
              }
            })
            .catch(innerError => {
              console.error('Lỗi với tìm kiếm đơn giản hơn:', innerError);
              
              // Phương án dự phòng cuối cùng - mở tab tìm kiếm Dailymotion
              window.open(`https://www.dailymotion.com/search/${searchQuery}`, '_blank');
              setShowTrailerModal(false);
            });
        });
      
    } catch (error) {
      console.error('Lỗi khi tải trailer:', error);
      
      // Phương án dự phòng cuối cùng - mở tab tìm kiếm Dailymotion
      const fallbackQuery = encodeURIComponent(`${movie.name} trailer`);
      window.open(`https://www.dailymotion.com/search/${fallbackQuery}`, '_blank');
      setShowTrailerModal(false);
    }
  };

  const selectEpisode = (index) => {
    setSelectedEpisode(index);
    setVideoLoading(true);
    setShowPlayer(true);
  };

  // Add this helper function right before your return statement
  const preventClickDuringDrag = (e) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleLike = (index) => {
    const updatedComments = [...comments];
    if (updatedComments[index].liked) {
        updatedComments[index].liked = false;
        updatedComments[index].likes = (updatedComments[index].likes || 0) - 1;
    } else {
        updatedComments[index].liked = true;
        updatedComments[index].disliked = false;
        updatedComments[index].likes = (updatedComments[index].likes || 0) + 1;
        if (updatedComments[index].dislikes > 0) {
            updatedComments[index].dislikes -= 1;
        }
    }
    setComments(updatedComments);
};

const handleDislike = (index) => {
    const updatedComments = [...comments];
    if (updatedComments[index].disliked) {
        updatedComments[index].disliked = false;
        updatedComments[index].dislikes = (updatedComments[index].dislikes || 0) - 1;
    } else {
        updatedComments[index].disliked = true;
        updatedComments[index].liked = false;
        updatedComments[index].dislikes = (updatedComments[index].dislikes || 0) + 1;
        if (updatedComments[index].likes > 0) {
            updatedComments[index].likes -= 1;
        }
    }
    setComments(updatedComments);
};

  const handleReply = (index) => {
    const updatedComments = [...comments];
    updatedComments[index].showReplyForm = !updatedComments[index].showReplyForm;
    setComments(updatedComments);
  };

  const handleReplyChange = (index, value) => {
    const updatedComments = [...comments];
    updatedComments[index].replyText = value;
    setComments(updatedComments);
  };

  const submitReply = (index) => {
    const updatedComments = [...comments];
    const replyText = updatedComments[index].replyText?.trim();
    
    if (!replyText) return;
    
    // Check for restricted words
    if (containsRestrictedWords(replyText)) {
      alert("Phản hồi của bạn chứa từ ngữ không phù hợp. Vui lòng chỉnh sửa lại.");
      return;
    }
    
    const username = user ? user.username : "Khách";
    
    // Check comment limit (replies count as comments too)
    const commentLimit = checkCommentLimit(username);
    if (commentLimit.hasReachedLimit) {
      alert(`Bạn đã đạt giới hạn ${MAX_COMMENTS_PER_DAY} bình luận trong ngày hôm nay. Vui lòng thử lại vào ngày mai.`);
      return;
    }
    
    const reply = {
      username: username,
      avatar: user ? user.avatar : "/img/guest-avatar.png",
      content: replyText,
      date: new Date().toLocaleDateString('vi-VN'),
    };
    
    // Update the comment count
    commentLimit.updateCount();
    
    if (!updatedComments[index].replies) {
      updatedComments[index].replies = [];
    }
    updatedComments[index].replies.push(reply);
    updatedComments[index].replyText = "";
    updatedComments[index].showReplyForm = false;
    setComments(updatedComments);
  };

  const handleNestedLike = (commentIndex, replyIndex) => {
    const updatedComments = [...comments];
    const reply = updatedComments[commentIndex].replies[replyIndex];
    
    if (reply.liked) {
      reply.liked = false;
      reply.likes = (reply.likes || 0) - 1;
    } else {
      reply.liked = true;
      reply.disliked = false;
      reply.likes = (reply.likes || 0) + 1;
      if (reply.dislikes > 0) {
        reply.dislikes -= 1;
      }
    }
    
    setComments(updatedComments);
  };

  const handleNestedDislike = (commentIndex, replyIndex) => {
    const updatedComments = [...comments];
    const reply = updatedComments[commentIndex].replies[replyIndex];
    
    if (reply.disliked) {
      reply.disliked = false;
      reply.dislikes = (reply.dislikes || 0) - 1;
    } else {
      reply.disliked = true;
      reply.liked = false;
      reply.dislikes = (reply.dislikes || 0) + 1;
      if (reply.likes > 0) {
        reply.likes -= 1;
      }
    }
    
    setComments(updatedComments);
  };

  const handleNestedReply = (commentIndex, replyIndex) => {
    const updatedComments = [...comments];
    const reply = updatedComments[commentIndex].replies[replyIndex];
    
    // Toggle reply form visibility
    reply.showReplyForm = !reply.showReplyForm;
    
    setComments(updatedComments);
  };

  const handleNestedReplyChange = (commentIndex, replyIndex, value) => {
    const updatedComments = [...comments];
    updatedComments[commentIndex].replies[replyIndex].replyText = value;
    setComments(updatedComments);
  };

  const submitNestedReply = (commentIndex, replyIndex) => {
    const updatedComments = [...comments];
    const originalReply = updatedComments[commentIndex].replies[replyIndex];
    const replyText = originalReply.replyText?.trim();
    
    if (!replyText) return;
    
    // Check for restricted words
    if (containsRestrictedWords(replyText)) {
      alert("Phản hồi của bạn chứa từ ngữ không phù hợp. Vui lòng chỉnh sửa lại.");
      return;
    }
    
    const username = user ? user.username : "Khách";
    
    // Check comment limit
    const commentLimit = checkCommentLimit(username);
    if (commentLimit.hasReachedLimit) {
      alert(`Bạn đã đạt giới hạn ${MAX_COMMENTS_PER_DAY} bình luận trong ngày hôm nay. Vui lòng thử lại vào ngày mai.`);
      return;
    }
    
    const newReply = {
      username: username,
      avatar: user ? user.avatar : "/img/guest-avatar.png",
      content: `@${originalReply.username} ${replyText}`,
      date: new Date().toLocaleDateString('vi-VN'),
    };
    
    // Update the comment count
    commentLimit.updateCount();
    
    // Add the new reply to the same level as the original reply
    updatedComments[commentIndex].replies.push(newReply);
    
    // Reset the reply form
    originalReply.replyText = "";
    originalReply.showReplyForm = false;
    
    setComments(updatedComments);
  };

  // Update the form submission handler
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    // Check for restricted words
    if (containsRestrictedWords(newComment)) {
      alert("Bình luận của bạn chứa từ ngữ không phù hợp. Vui lòng chỉnh sửa lại.");
      return;
    }
    
    const username = user ? user.username : "Khách";
    
    // Check comment limit
    const commentLimit = checkCommentLimit(username);
    if (commentLimit.hasReachedLimit) {
      alert(`Bạn đã đạt giới hạn ${MAX_COMMENTS_PER_DAY} bình luận trong ngày hôm nay. Vui lòng thử lại vào ngày mai.`);
      return;
    }
    
    // Create and add the comment
    const commentObj = {
      username: username,
      avatar: user ? user.avatar : "/img/guest-avatar.png",
      content: newComment.trim(),
      date: new Date().toLocaleDateString('vi-VN'),
    };
    
    // Update the comment count
    commentLimit.updateCount();
    
    // Add comment to the list
    setComments([...comments, commentObj]);
    setNewComment("");
  };

  if (error || !movie) {
    return (
      <div className="bg-black min-vh-100">
        <Navbar />
        <div className={`container mt-5 text-white text-center ${styles.errorContainer}`}>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navbar />
      
      {!contentLoaded && (
        <div className={styles.banner}>
          <div className={styles.bannerBackground}>
            {/* Banner skeleton */}
            <div className={`${styles.skeleton} ${styles.bannerSkeleton}`}></div>
            <div className={styles.bannerGradient}></div>
            
            <div className={styles.contentContainer}>
              <div className={styles.bannerContent}>
                <div className={styles.leftSection}>
                  {/* Poster skeleton */}
                  <div className={`${styles.skeleton} ${styles.posterSkeleton}`}></div>
                </div>
                
                <div className={styles.rightSection}>
                  {/* Title skeletons */}
                  <div className={`${styles.skeleton} ${styles.titleSkeleton}`}></div>
                  <div className={`${styles.skeleton} ${styles.subtitleSkeleton}`}></div>
                  
                  {/* Rating skeleton */}
                  <div className={`${styles.skeleton} ${styles.ratingSkeleton}`}></div>
                  
                  {/* Metadata skeletons */}
                  <div className={styles.metaSkeleton}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`${styles.skeleton} ${styles.metaItemSkeleton}`}></div>
                    ))}
                  </div>
                  
                  {/* Actor badges skeleton */}
                  <div className={styles.badgesSkeleton}>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`${styles.skeleton} ${styles.badgeSkeleton}`}></div>
                    ))}
                  </div>
                  
                  {/* Genre badges skeleton */}
                  <div className={styles.badgesSkeleton}>
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={`${styles.skeleton} ${styles.badgeSkeleton}`}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Actual content - only shown when loaded */}
      <div className={contentLoaded ? '' : styles.hiddenContent}>
        <div className={styles.banner}>
          <div className={styles.bannerBackground}>
            {/* Skeleton cho hình nền khi đang tải */}
            {!imageLoaded && (
              <div className={`${styles.skeleton} ${styles.bannerImageSkeleton}`}></div>
            )}
            
            <img
              src={movie.poster_url || movie.thumb_url}
              alt={movie.name || "Movie Background"}
              className={`${styles.bannerImage} ${contentLoaded ? styles.contentLoaded : styles.contentLoading} ${!imageLoaded ? styles.hidden : ''}`}
              onLoad={handleImageLoaded}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/img/default-banner.jpg";
                handleImageLoaded();
              }}
            />
            <div className={styles.bannerGradient}></div>
            
            <div className={`${styles.contentContainer} ${contentLoaded ? styles.contentLoaded : styles.contentLoading}`}>
              <div className={`${styles.bannerContent} ${contentLoaded ? styles.contentLoaded : styles.contentLoading}`}>
                {/* Left section with poster */}
                <div className={styles.leftSection}>
                  <div className={styles.moviePoster}>
                    <img
                      src={movie.thumb_url || movie.poster_url || "/img/default-poster.jpg"}
                      alt={movie.name}
                      className={`${styles.posterImage} ${contentLoaded ? styles.contentLoaded : styles.contentLoading}`}
                      onLoad={handleImageLoaded}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/img/default-poster.jpg";
                        handleImageLoaded();
                      }}
                    />
                    
                    {/* Position report/share buttons inside the poster */}
                    <div className={styles.posterControls}>
                      <button
                        className={`${styles.posterControlButton} ${styles.reportButton}`}
                        onClick={handleReport}
                      >
                        <i className="fas fa-exclamation-triangle"></i>
                        <span>Báo lỗi</span>
                      </button>
                      <button
                        className={`${styles.posterControlButton} ${styles.shareButton}`}
                        onClick={handleShare}
                      >
                        <i className="fas fa-share-alt"></i>
                        <span>Chia sẻ</span>
                      </button>
                    </div>
                    
                    {/* Play button overlay */}
                    <div className={styles.posterOverlay}>
                      <button
                        className={styles.playButtonOverlay}
                        onClick={() => setShowPlayer(true)}
                      >
                        <div className={styles.playButtonContent}>
                          <img
                            src="/img/play.png"
                            alt="play"
                            className={styles.playIcon}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/img/default-poster.jpg";
                            }}
                          />
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  {/* Action buttons BELOW the poster - now in a single row */}
                  <div className={styles.posterActionButtonsRow}>
                    <button
                      className={`${styles.posterActionButton} ${isFavorite ? styles.active : ''}`}
                      onClick={handleFavorite}
                    >
                      <div className={styles.buttonIcon}>
                        <i className={`bi ${isFavorite ? 'bi-check-circle-fill' : 'bi-plus-circle'}`}></i>
                      </div>
                      <div className={styles.buttonText}>
                        <span className={styles.buttonLabel}>{isFavorite ? 'Đã lưu' : 'Lưu'}</span>
                      </div>
                    </button>
                    
                    <button
                      className={`${styles.posterActionButton} ${userRating > 0 ? styles.active : ''}`}
                      onClick={handleShowRating}
                    >
                      <div className={styles.buttonIcon}>
                        <i className="bi bi-star-fill"></i>
                      </div>
                      <div className={styles.buttonText}>
                        <span className={styles.buttonLabel}>
                          {userRating > 0 ? `Đánh giá: ${userRating}/10` : 'Đánh giá'}
                        </span>
                        <span className={styles.buttonDescription}>
                          {userRating > 0 ? 'Nhấn để thay đổi' : ''}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
                
                {/* Right section - Movie Info */}
                <div className={`${styles.rightSection} ${contentLoaded ? styles.contentLoaded : styles.contentLoading}`}>
                  {/* Movie title and rating */}
                  <h1 className={styles.movieTitle}>{movie.name}</h1>
                  {movie.origin_name && (
                    <h4 className={styles.originalTitle}>{movie.origin_name}</h4>
                  )}

                  {/* Đánh giá sao với thông tin từ API */}
                  <div className={styles.ratingContainer}>
                    <div className={styles.ratingStars}>
                      {[...Array(5)].map((_, i) => {
                        const apiRating = movie.rating || movie.tmdb?.vote_average || 0;
                        const starRating = apiRating / 2;
                        
                        let starType = '';
                        if (i < Math.floor(starRating)) {
                          starType = 'bi-star-fill';
                        } else if (i < starRating) {
                          starType = 'bi-star-half';
                        } else {
                          starType = 'bi-star';
                        }

                        return (
                          <i
                            key={i}
                            className={`bi ${starType} ${styles.starIcon} ${i < starRating ? styles.starActive : styles.starInactive}`}
                          ></i>
                        );
                      })}
                    </div>
                    <div className={styles.ratingInfo}>
                      <span className={styles.ratingValue}>
                        <strong>{((movie.rating || movie.tmdb?.vote_average || 0) / 2).toFixed(1)}</strong>
                        <span className={styles.ratingMax}>/5</span>
                      </span>
                      <div className={styles.ratingDetails}>
                        <span className={styles.ratingCount}>
                          <i className="bi bi-people-fill me-1"></i>
                          {movie.rating_count || movie.tmdb?.vote_count ?
                            `${movie.rating_count || movie.tmdb?.vote_count} lượt đánh giá` :
                            'Chưa có đánh giá'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Movie meta data */}
                  <div className={styles.movieMeta}>
                    <span className={styles.metaItem}>
                      <i className="bi bi-calendar-event"></i>
                      {movie.year}
                    </span>
                    <span className={styles.metaItem}>
                      <i className="bi bi-clock"></i>
                      {formatDuration(movie.time || movie.episode_current || movie.duration)}
                    </span>
                    {movie.episode_total && (
                      <span className={styles.metaItem}>
                        <i className="bi bi-collection-play"></i>
                        {movie.episode_current || "1"}/{movie.episode_total} tập
                      </span>
                    )}
                    {movie.lang && (
                      <span className={styles.metaItem}>
                        <i className="bi bi-translate"></i>
                        {movie.lang === 'VietSub' ? 'Vietsub' : movie.lang}
                      </span>
                    )}
                    {movie.quality && (
                      <span className={`${styles.metaItem} ${styles.qualityBadge}`}>
                        <i className="bi bi-badge-hd"></i>
                        {movie.quality}
                      </span>
                    )}
                  </div>

                  {/* Diễn viên */}
                  <h3 className={styles.sectionTitle}>Diễn Viên</h3>
                  <div className={styles.actorsContainer}>
                    {movie.actor?.map((actor, index) => (
                      <span key={index} className={styles.actorBadge}>
                        {typeof actor === 'object' ? actor.name : actor}
                      </span>
                    ))}
                  </div>

                  {/* Thể loại */}
                  <h3 className={styles.sectionTitle}>Thể Loại</h3>
                  <div className={styles.genresContainer}>
                    {movie.category?.map((cat, index) => (
                      <span key={index} className={styles.genreBadge}>
                        {typeof cat === 'object' ? cat.name : cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Trailer button in bottom action container */}
              <div className={styles.bottomActionContainer}>
                <button
                  className={styles.trailerButton}
                  onClick={handlePlayTrailer}
                >
                  <i className="bi bi-youtube"></i>
                  Xem Trailer
                </button>
              </div>
              
              {/* Share/Report buttons */}
              <div className={styles.headerButtons}>
                <button
                  className={`${styles.actionButton} ${styles.reportButton}`}
                  onClick={handleReport}
                >
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>Báo lỗi</span>
                </button>
                <button
                  className={`${styles.actionButton} ${styles.shareButton}`}
                  onClick={handleShare}
                >
                  <i className="fas fa-share-alt"></i>
                  <span>Chia sẻ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.container}>
        {!contentLoaded && (
          <>
            {/* Description skeleton */}
            <div className={`${styles.skeleton} ${styles.descriptionSkeleton}`}></div>
            
            {/* Related movies skeleton */}
            <div className={styles.relatedMoviesSkeleton}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={styles.relatedMovieCardSkeleton}>
                  <div className={`${styles.skeleton} ${styles.relatedMoviePosterSkeleton}`}></div>
                  <div className={`${styles.skeleton} ${styles.relatedMovieTitleSkeleton}`}></div>
                  <div className={`${styles.skeleton} ${styles.relatedMovieSubtitleSkeleton}`}></div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {/* Actual content - only shown when loaded */}
        <div className={contentLoaded ? '' : styles.hiddenContent}>
          <div className={`container text-white mt-5 ${contentLoaded ? styles.contentLoaded : styles.contentLoading}`}>
            {/* Video Player */}
            {showPlayer && (
              <div
                className={styles.videoPlayerOverlay}
                onClick={(e) => {
                  if (e.target.classList.contains(styles.videoPlayerOverlay)) {
                    setShowPlayer(false);
                    setVideoLoading(true); // Reset loading state when closing
                  }
                }}
              >
                <div id="video-player" className={styles.videoPlayerContainer}>
                  {videoLoading && (
                    <div className={styles.videoLoading}>
                      <div className={styles.videoLoadingSpinner}></div>
                      <div className={styles.videoLoadingText}>Đang tải phim...</div>
                    </div>
                  )}
                  <div className="ratio ratio-16x9">
                    <iframe
                      src={`${movie.episodes[selectedServer]?.server_data[selectedEpisode]?.link_embed}`}
                      allowFullScreen
                      className="rounded"
                      onLoad={() => setVideoLoading(false)}
                    ></iframe>
                  </div>
                </div>
              </div>
            )}

            {/* Danh sách các tập phim - Hiển thị trên phần mô tả */}
            {movie.episodes && movie.episodes.length > 0 && (
              <div className={styles.episodeList}>
                <h3 className={styles.episodeTitle}>Danh Sách Tập Phim</h3>
                <div className="d-flex flex-wrap gap-2">
                  {movie.episodes[selectedServer]?.server_data.map((episode, index) => (
                    <button
                      key={index}
                      className={`btn btn-outline-light ${styles.episodeBtn} ${selectedEpisode === index ? styles.episodeBtnActive : ''}`}
                      onClick={() => selectEpisode(index)}
                    >
                      Tập {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mô tả phim - Đã chuyển xuống dưới danh sách tập */}
            <div className={styles.describe}>
              <h5>Nội Dung Phim</h5>
              <p>{movie.content || movie.description}</p>
            </div>

             {/* Phim cùng thể loại */}
             {Array.isArray(relatedMovies) && relatedMovies.length > 0 ? (
              <div className={`mt-5 mb-5 ${contentLoaded ? styles.contentLoaded : styles.contentLoading}`}>
                <h3 className={styles.relatedMoviesTitle}>Phim Cùng Thể Loại ({relatedMovies.length})</h3>
                <div className={styles.relatedMoviesContainer}>
                  <Slider {...sliderSettings} className={styles.slickSlider}>
                    {relatedMovies.map((movie) => (
                      <div key={movie.slug} className={styles.slickSlide}>
                        <div className={styles.relatedMovieCard}>
                          <Link
                            href={`/movie/${movie.slug}`}
                            className={styles.movieLink}
                            onClick={preventClickDuringDrag}
                            draggable={false}
                          >
                            <div className={styles.relatedMoviePoster} draggable={false}>
                              <img
                                src={movie.thumb_url || movie.poster_url || "/placeholder.jpg"}
                                alt={movie.name}
                                className={styles.relatedMovieImage}
                                draggable={false}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "/placeholder.jpg";
                                }}
                              />
                              <div className={styles.relatedMovieBadges}>
                                <span className={styles.relatedMovieBadge}>
                                  {movie.year || "2023"}
                                </span>
                                {movie.quality && (
                                  <span className={`${styles.relatedMovieBadge} ${styles.quality}`}>
                                    {movie.quality}
                                  </span>
                                )}
                              </div>
                              <div className={styles.relatedMovieOverlay}>
                                <button className={styles.watchButton}>
                                  <i className="bi bi-play-circle"></i>
                                </button>
                              </div>
                            </div>
                            <div className={styles.relatedMovieInfo}>
                              <h5 className={styles.relatedMovieTitle}>{movie.name}</h5>
                              {movie.origin_name && (
                                <div className={styles.relatedMovieSubtitle}>
                                  {movie.origin_name}
                                </div>
                              )}
                            </div>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </Slider>
                </div>
              </div>
            ) : (
              <div className="mt-5 mb-5">
                <h3 className={styles.relatedMoviesTitle}>Phim Cùng Thể Loại</h3>
                <p className="text-muted">Không tìm thấy phim cùng thể loại</p>
              </div>
            )}

            {/* Phần bình luận */}
            <div className={styles.commentsSection}>
              <h5 className={styles.sectionTitle}>Bình luận</h5>

              {/* Form thêm bình luận */}
              <div className={styles.addCommentForm}>
                <form onSubmit={handleCommentSubmit}>
                  <div className="form-group mb-3 d-flex align-items-center">
                    <textarea
                      className="form-control bg-dark text-white me-2"
                      rows="1"
                      placeholder="Viết bình luận của bạn..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleCommentSubmit(e);
                        }
                      }}
                      required
                    ></textarea>
                    <button type="submit" className="btn btn-danger">
                      <i className="bi bi-send"></i>
                    </button>
                  </div>
                </form>
              </div>

              {/* Danh sách bình luận */}
              <div className={styles.commentsList}>
                {comments.length > 0 ? (
                  comments.map((comment, index) => (
                    <div key={index} className={styles.commentItem}>
                      <div className={styles.commentHeader}>
                        <img
                          src={comment.avatar || "/img/user-avatar.png"}
                          alt={comment.username}
                          className={styles.commentAvatar}
                          onError={(e) => {
                            e.target.src = "/img/user-avatar.png"; // Fallback avatar
                          }}
                        />
                        <div className={styles.commentDetails}>
                          <span className={styles.commentUsername}>@{comment.username}</span>
                          <span className={styles.commentDate}>{comment.date}</span>
                        </div>
                      </div>
                      <p className={styles.commentContent}>{comment.content}</p>
                      <div className={styles.commentActions}>
                        <button
                          className={`${styles.actionButton} ${comment.liked ? styles.liked : ''}`}
                          onClick={() => handleLike(index)}
                        >
                          <i className="bi bi-hand-thumbs-up"></i> {comment.likes || 0}
                        </button>
                        <button
                          className={`${styles.actionButton} ${comment.disliked ? styles.disliked : ''}`}
                          onClick={() => handleDislike(index)}
                        >
                          <i className="bi bi-hand-thumbs-down"></i> {comment.dislikes || 0}
                        </button>
                        <button
                          className={styles.actionButton}
                          onClick={() => handleReply(index)}
                        >
                          Phản hồi
                        </button>
                      </div>
                      {comment.showReplyForm && (
                        <div className={styles.replyForm}>
                          <textarea
                            className="form-control bg-dark text-white mt-2"
                            rows="1"
                            placeholder="Viết phản hồi của bạn..."
                            value={comment.replyText || ""}
                            onChange={(e) => handleReplyChange(index, e.target.value)}
                          ></textarea>
                          <button
                            className="btn btn-danger mt-2"
                            onClick={() => submitReply(index)}
                          >
                            Gửi
                          </button>
                        </div>
                      )}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className={styles.repliesList}>
                          {comment.replies.map((reply, replyIndex) => (
                            <div key={replyIndex} className={styles.replyItem}>
                              <div className={styles.commentHeader}>
                                <img
                                  src={reply.avatar || "/img/user-avatar.png"}
                                  alt={reply.username}
                                  className={styles.commentAvatar}
                                  onError={(e) => {
                                    e.target.src = "/img/user-avatar.png"; // Fallback avatar
                                  }}
                                />
                                <div className={styles.commentDetails}>
                                  <span className={styles.commentUsername}>@{reply.username}</span>
                                  <span className={styles.commentDate}>{reply.date}</span>
                                </div>
                              </div>
                              <p className={styles.commentContent}>{reply.content}</p>
                              <div className={styles.commentActions}>
                                <button
                                  className={`${styles.actionButton} ${reply.liked ? styles.liked : ''}`}
                                  onClick={() => handleNestedLike(index, replyIndex)}
                                >
                                  <i className="bi bi-hand-thumbs-up"></i> {reply.likes || 0}
                                </button>
                                <button
                                  className={`${styles.actionButton} ${reply.disliked ? styles.disliked : ''}`}
                                  onClick={() => handleNestedDislike(index, replyIndex)}
                                >
                                  <i className="bi bi-hand-thumbs-down"></i> {reply.dislikes || 0}
                                </button>
                                <button
                                  className={styles.actionButton}
                                  onClick={() => handleNestedReply(index, replyIndex)}
                                >
                                  Phản hồi
                                </button>
                              </div>
                              {reply.showReplyForm && (
                                <div className={styles.replyForm}>
                                  <textarea
                                    className="form-control bg-dark text-white mt-2"
                                    rows="1"
                                    placeholder="Viết phản hồi của bạn..."
                                    value={reply.replyText || ""}
                                    onChange={(e) => handleNestedReplyChange(index, replyIndex, e.target.value)}
                                  ></textarea>
                                  <button
                                    className="btn btn-danger mt-2"
                                    onClick={() => submitNestedReply(index, replyIndex)}
                                  >
                                    Gửi
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h5>Báo cáo lỗi</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowReportModal(false)}
              ></button>
            </div>
            <div className={styles.modalBody}>
              <div className="form-group">
                <label className="mb-2">Chọn lý do:</label>
                <select
                  className="form-select bg-dark text-white border-secondary"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                >
                  <option value="">-- Chọn lý do --</option>
                  {reportReasons.map((reason, index) => (
                    <option key={index} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowReportModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={submitReport}
                disabled={!reportReason}
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h5>Chia sẻ phim</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowShareModal(false)}
              ></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.socialButtons}>
                <button className="btn btn-primary">
                  <i className="fab fa-facebook-f"></i>
                </button>
                <button className="btn btn-info">
                  <i className="fab fa-twitter"></i>
                </button>
                <button className="btn btn-danger">
                  <i className="fab fa-pinterest"></i>
                </button>
                <button className="btn btn-success">
                  <i className="fab fa-whatsapp"></i>
                </button>
              </div>
              <div className="mt-3">
                <label className="mb-2">Link chia sẻ:</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control bg-dark text-white border-secondary"
                    value={window.location.href}
                    readOnly
                  />
                  <button
                    className="btn btn-outline-light"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Đã sao chép link!');
                    }}
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowShareModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h5>Đánh giá</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowRatingModal(false)}
              ></button>
            </div>
            <div className={styles.modalBody}>
              <p>Bạn đánh giá phim này bao nhiêu điểm?</p>
              <div className={styles.ratingButtons}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    className={`${styles.ratingButton} ${tempRating === score ? styles.ratingActive : ''}`}
                    onClick={() => setTempRating(score)}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <div className={styles.ratingLabel}>
                {tempRating === 0 && "Chọn điểm"}
                {tempRating === 1 && "Quá tệ"}
                {tempRating === 2 && "Tệ"}
                {tempRating === 3 && "Không hay"}
                {tempRating === 4 && "Không tốt lắm"}
                {tempRating === 5 && "Bình thường"}
                {tempRating === 6 && "Xem được"}
                {tempRating === 7 && "Khá hay"}
                {tempRating === 8 && "Hay"}
                {tempRating === 9 && "Rất hay"}
                {tempRating === 10 && "Tuyệt vời"}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowRatingModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleRating(tempRating)}
                disabled={tempRating === 0}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trailer Modal */}
      {showTrailerModal && (
        <div className={styles.modalOverlay} onClick={(e) => {
          // Đóng modal nếu click vào phần nền
          if (e.target.classList.contains(styles.modalOverlay)) {
            setShowTrailerModal(false);
            setTimeout(() => setTrailerUrl(''), 100);
          }
        }}>
          <div className={styles.trailerModalContent}>
            <div className={styles.modalHeader}>
              <h5>Trailer: {movie.name}</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowTrailerModal(false);
                  setTimeout(() => setTrailerUrl(''), 100);
                }}
              ></button>
            </div>
            <div className={styles.trailerContainer}>
              {trailerUrl ? (
                <div className="ratio ratio-16x9">
                  <iframe
                    src={trailerUrl}
                    title={`Trailer phim ${movie.name}`}
                    frameBorder="0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    className="rounded"
                  ></iframe>
                </div>
              ) : (
                <div className={styles.trailerLoading}>
                  <div className={styles.videoLoadingSpinner}></div>
                  <div className={styles.videoLoadingText}>Đang tìm kiếm trailer trên Dailymotion...</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetail;