import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { authorize } from 'passport';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import styles from '../MovieCategory.module.css'; 
import Skeleton from '../UI/Skeleton';

const MovieCategory = ({ title, endpoint, showTopMovies = true }) => {
  const [movies, setMovies] = useState([]);
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadedImages, setLoadedImages] = useState({});
  
  // Thêm cấu hình cho slider
  const topMoviesSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 2,
    swipeToSlide: true,
    draggable: true,
    centerPadding: '30px', // Thêm padding ở giữa các slide
    variableWidth: false,  // Giữ chiều rộng đồng nhất
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 4,
        }
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 3,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
        }
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1,
        }
      }
    ]
  };

  const handleImageLoad = (id) => {
    if (!loadedImages[id]) {  
      setTimeout(() => {
        setLoadedImages(prev => ({
          ...prev,
          [id]: true
        }));
      }, 300);
    }
  };

  const fetchMovies = async (pageNumber) => {
    try {
      setLoading(true);
      const response = await fetch(`https://ophim1.com/${endpoint}?page=${pageNumber}`);
      const data = await response.json();

      if (data.items) {
        const moviesWithDetails = await Promise.all(
          data.items.map(async (movie) => {
            try {
              const detailResponse = await fetch(`https://ophim1.com/phim/${movie.slug}`);
              const detailData = await detailResponse.json();
              return {
                ...movie,
                ...detailData.movie,
                episodes: detailData.episodes,
                
                thumb_url: movie.thumb_url.startsWith('http') 
                  ? movie.thumb_url 
                  : `${data.pathImage}${movie.thumb_url}`,
                poster_url: movie.poster_url.startsWith('http')
                  ? movie.poster_url
                  : `${data.pathImage}${movie.poster_url}`
              };
            } catch (error) {
              console.error(`Error fetching details for ${movie.slug}:`, error);
              return {
                ...movie,
                thumb_url: movie.thumb_url.startsWith('http') 
                  ? movie.thumb_url 
                  : `${data.pathImage}${movie.thumb_url}`,
                poster_url: movie.poster_url.startsWith('http')
                  ? movie.poster_url
                  : `${data.pathImage}${movie.poster_url}`
              };
            }
          })
        );

        if (pageNumber === 1) {
          setFeaturedMovies(moviesWithDetails.slice(0, 5));
          setTopMovies(moviesWithDetails.slice(5, 17));
          setMovies(moviesWithDetails);
        } else {
          setMovies(prevMovies => [...prevMovies, ...moviesWithDetails]);
        }
      }
    } catch (error) {
      console.error(`Lỗi khi tải phim cho ${title}:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies(1);
  }, [endpoint]);

  useEffect(() => {
    if (featuredMovies.length > 0) {
      featuredMovies.forEach(movie => {
        const img = new Image();
        img.src = movie.thumb_url || movie.poster_url || '/placeholder.jpg';
      });
    }
  }, [featuredMovies]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMovies(nextPage);
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setActiveIndex((prevIndex) => 
      prevIndex === 0 ? featuredMovies.length - 1 : prevIndex - 1
    );
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    const nextIndex = activeIndex === featuredMovies.length - 1 ? 0 : activeIndex + 1;
    const nextMovie = featuredMovies[nextIndex];
    const img = new Image();
    img.src = nextMovie.thumb_url || nextMovie.poster_url || '/placeholder.jpg';
    
    setActiveIndex(nextIndex);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  return (
    <div className="movie-section mb-5">
      {featuredMovies.length > 0 && (
        <div className="featured-movies mb-5">
          <div className="position-relative" style={{ 
            height: '800px',
            width:'100%',
            overflow: 'hidden',
            background: '#000'
          }}>
            {featuredMovies[activeIndex] && (
              <>
                <div 
                  className="position-absolute top-0 start-0 w-100 h-100"
                  style={{
                    backgroundImage: `url(${featuredMovies[activeIndex].backdrop_url || featuredMovies[activeIndex].poster_url || featuredMovies[activeIndex].thumb_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    filter: 'brightness(1)',
                    opacity: 1,
                    transition: 'all 0.7s ease-in-out',
                    zIndex: 1
                  }}
                />
                
                <div 
                  className="position-absolute top-0 start-0 w-100 h-100"
                  style={{
                    background: 'linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%)',
                    zIndex: 1
                  }}
                />
              </>
            )}
            
            <div 
              className="position-absolute top-0 start-0 w-100 h-100" 
              style={{
                background: 'radial-gradient(circle at center, rgba(255,0,0,0.07) 0%, rgba(0,0,0,0) 70%)',
                zIndex: 2
              }}
            />
            
            <div className="d-flex justify-content-center align-items-center h-100" style={{ zIndex: 3, position: 'relative' }}>
              {featuredMovies.map((movie, index) => {
                const totalItems = featuredMovies.length;
                let position = (index - activeIndex + totalItems) % totalItems;
                
                if (position > Math.floor(totalItems / 2)) {
                  position = position - totalItems;
                }
                
                let zIndex = 4 - Math.abs(position);
                let scale = position === 0 ? 1 : 1 - Math.abs(position) * 0.2;  
                let translateX = position * 250;
                let opacity = 1 - Math.abs(position) * 0.2;
                let visibility = Math.abs(position) <= 2 ? 'visible' : 'hidden';
                let rotation = position * -15;
                const imageId = `featured-${movie.slug}`;
                
                return (
                  <div 
                    key={imageId}
                    className="position-absolute"
                    style={{ 
                      width: '400px',
                      visibility,
                      zIndex,
                      transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotation}deg)`,
                      opacity,
                      transition: 'all 0.5s ease',
                      cursor: 'pointer',
                      transformStyle: 'preserve-3d',
                      perspective: '1000px'
                    }}
                    onMouseOver={(e) => {
                      // Chỉ áp dụng hiệu ứng cho các phim không ở giữa
                      if (position !== 0) {
                        e.currentTarget.style.transform = `translateX(${translateX}px) scale(${scale * 1.05}) rotateY(${rotation * 0.8}deg)`;
                      }
                    }}
                    onMouseOut={(e) => {
                      if (position !== 0) {
                        e.currentTarget.style.transform = `translateX(${translateX}px) scale(${scale}) rotateY(${rotation}deg)`;
                      }
                    }}
                    onClick={() => {
                      if (position !== 0 && !isTransitioning) {
                        setActiveIndex(index);
                      } else if (position === 0) {
                        window.location.href = `/movie/${movie.slug}`;
                      }
                    }}
                  >
                    <div className="card bg-dark border-0">
                      <div className={`position-relative ${styles.moviePoster}`}>
                        <div 
                          className={`blur-load ${loadedImages[imageId] ? 'loaded' : ''}`}
                          style={{ 
                            height: '600px',
                            backgroundImage: `url(${movie.thumb_url || movie.poster_url})`,
                            backgroundSize: 'cover',
                            filter: loadedImages[imageId] ? 'none' : 'blur(10px)',
                            transition: 'filter 0.3s ease-in-out',
                            borderRadius: '15px 15px 0 0'
                          }}
                        >
                          {!loadedImages[imageId] && (
                            <Skeleton height="600px" borderRadius="15px 15px 0 0" />
                          )}
                          <img
                            src={movie.thumb_url || movie.poster_url}
                            alt={movie.name}
                            className="card-img-top"
                            loading="lazy"
                            style={{ 
                              height: '600px',
                              objectFit: 'cover', 
                              borderRadius: '15px 15px 0 0',
                              boxShadow: position === 0 
                                ? '0 10px 30px rgba(255, 0, 0, 0.3)' 
                                : '0 5px 15px rgba(0, 0, 0, 0.5)'
                            }}
                            onLoad={() => handleImageLoad(imageId)}
                            onError={(e) => {
                              e.target.src = "/placeholder.jpg";
                              handleImageLoad(imageId);
                            }}
                          />
                        </div>
                        
                        {/* Overlay gradient */}
                        <div 
                          className="position-absolute top-0 start-0 w-100 h-100"
                          style={{
                            background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
                            borderRadius: '15px 15px 0 0',
                            opacity: 1, // Để hiển thị trên tất cả các phim, không chỉ phim ở giữa
                            transition: 'opacity 0.3s'
                          }}
                        />

                    
                        <Link 
                          href={`/movie/${movie.slug}`}
                          className={`btn btn-sm ${styles.watchButton}`}
                        >
                          <i className="bi bi-play-fill"></i>
                        </Link>
                        
                        {/* Badge thông tin phát hành: số tập & ngôn ngữ */}
                        <div className="position-absolute bottom-0 start-0 m-3" style={{ zIndex: 5 }}>
                          
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="position-absolute bottom-0 start-50 translate-middle-x mb-4" style={{ zIndex: 10 }}>
              <div className="d-flex gap-2">
                {featuredMovies.map((_, index) => (
                  <button
                    key={index}
                    className="p-0 border-0"
                    style={{
                      width: index === activeIndex ? '30px' : '10px',
                      height: '10px',
                      borderRadius: '5px',
                      background: index === activeIndex ? '#dc3545' : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => !isTransitioning && setActiveIndex(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showTopMovies && topMovies.length > 0 && (
        <div className="top-movies mb-5">
          <h3 className="text-white mb-3">Phim Đề Xuất</h3>
          <div className={styles.sliderContainer}>
            <Slider {...topMoviesSettings}>
              {topMovies.map((movie) => {
                const imageId = `top-${movie.slug}`;
                return (
                  <div key={imageId} className={styles.sliderItem}>
                    <div className={`card bg-dark border-0 ${styles.movieCard}`}>
                      <div className={`position-relative ${styles.moviePoster}`}>
                        <div 
                          className={`blur-load ${loadedImages[imageId] ? 'loaded' : ''}`} 
                          style={{ 
                            backgroundImage: `url(${movie.thumb_url})`,
                            backgroundSize: 'cover',
                            filter: loadedImages[imageId] ? 'none' : 'blur(10px)',
                            transition: 'filter 0.3s ease-in-out',
                            height: '300px',
                            borderRadius: '8px'
                          }}
                        >
                          {!loadedImages[imageId] && (
                            <Skeleton height="300px" borderRadius="8px" />
                          )}
                          <img
                            src={movie.thumb_url}
                            className={`card-img-top ${styles.movieImage}`}
                            alt={movie.name}
                            loading="lazy"
                            style={{ 
                              height: '300px', 
                              objectFit: 'cover', 
                              borderRadius: '8px' 
                            }}
                            onLoad={() => handleImageLoad(imageId)}
                            onError={(e) => {
                              e.target.src = "/placeholder.jpg";
                              handleImageLoad(imageId);
                            }}
                          />
                        </div>
                        
                        {/* Overlay gradient */}
                        <div className={styles.overlay}></div>
                        
                        {/* Nút xem phim không có icon */}
                        <Link 
                          href={`/movie/${movie.slug}`}
                          className={`btn btn-sm ${styles.watchButton}`}
                        >
                        <i className="bi bi-play-fill"></i>
                        </Link>
                        
                        {/* Badges năm & chất lượng */}
                        <div className={styles.yearQualityBadges}>
                          <span className="badge bg-danger">
                            {movie.year}
                          </span>
                          {movie.quality && (
                            <span className="badge bg-primary ms-1">
                              {movie.quality}
                            </span>
                          )}
                        </div>
                        
                        {/* Badge thông tin phát hành: số tập & ngôn ngữ */}
                        <div className={styles.episodeInfoBadge}>
                          {movie.episodes && movie.episodes[0] && (
                            <span className="badge bg-success me-1">
                              {movie.episodes[0].server_data.length} tập
                            </span>
                          )}
                          <span className="badge bg-info">
                            {movie.lang || 'Vietsub'}
                          </span>
                        </div>
                        
                        {/* Thêm badge loại phim ở góc trên trái */}
                        <div className={styles.categoryBadge}>
                          <span className="badge bg-secondary">
                            {movie.type === 'series' ? 'Phim bộ' : 'Phim lẻ'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="card-body">
                        <h6 className="card-title text-white mb-1 text-truncate">
                          {movie.name}
                        </h6>
                        <p className="card-text small text-muted text-truncate">
                          {movie.origin_name}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Slider>
          </div>
        </div>
      )}

      <h3 className="text-white mb-4">{title}</h3>
      <div className="row g-1"> {/* Changed from g-3 to g-1 for tighter spacing */}
        {loading && page === 1 
          ? [...Array(12)].map((_, i) => (
              <div key={`skeleton-${i}`} className="col-6 col-sm-4 col-md-3 col-lg-2 col-xl-1-7">
                <div className="card h-100 bg-dark border-0">
                  <Skeleton height="250px" />
                  <div className="card-body">
                    <Skeleton height="18px" width="85%" />
                    <div className="mt-1">
                      <Skeleton height="14px" width="65%" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          : movies.slice(0, page * 7).map((movie) => {
              const imageId = `grid-${movie.slug}`;
              return (
                <div key={movie.slug} className="col-6 col-sm-4 col-md-3 col-lg-2 col-xl-1-7">
                  <div className={`card h-100 bg-dark border-0 ${styles.movieCard}`}>
                    <div className={`position-relative ${styles.moviePoster}`}>
                      <div 
                        className={`blur-load ${loadedImages[imageId] ? 'loaded' : ''}`}
                        style={{ 
                          backgroundImage: `url(${movie.thumb_url}?blur=30)`,
                          height: '250px'
                        }}
                      >
                        {!loadedImages[imageId] && (
                          <Skeleton height="250px" />
                        )}
                        <img
                          src={movie.thumb_url}
                          className={`card-img-top ${styles.movieImage}`}
                          alt={movie.name}
                          loading="lazy"
                          style={{ 
                            height: '250px', 
                            objectFit: 'cover',
                            borderRadius: '4px' /* Added reduced border radius */
                          }}
                          onLoad={() => handleImageLoad(imageId)}
                          onError={(e) => {
                            e.target.src = "/placeholder.jpg";
                            handleImageLoad(imageId);
                          }}
                        />
                      </div>
                      
                      {/* Overlay gradient */}
                      <div className={styles.overlay}></div>
                      
                      {/* Nút xem phim không có icon */}
                      <Link 
                        href={`/movie/${movie.slug}`}
                        className={`btn btn-sm ${styles.watchButton}`}
                      >
                       <i className="bi bi-play-circle"></i>
                      </Link>
                      
                      {/* Badges năm & chất lượng */}
                      <div className={styles.yearQualityBadges}>
                        <span className="badge bg-danger">
                          {movie.year}
                        </span>
                        {movie.quality && (
                          <span className="badge bg-primary ms-1">
                            {movie.quality}
                          </span>
                        )}
                      </div>
                      
                      {/* Badge thông tin phát hành: số tập & ngôn ngữ */}
                      <div className={styles.episodeInfoBadge}>
                        {movie.episodes && movie.episodes[0] && (
                          <span className="badge bg-success me-1">
                            {movie.episodes[0].server_data.length} tập
                          </span>
                        )}
                        <span className="badge bg-info">
                          {movie.lang || 'Vietsub'}
                        </span>
                      </div>
                      
                      {/* Thêm badge loại phim ở góc trên trái */}
                      <div className={styles.categoryBadge}>
                        <span className="badge bg-secondary">
                          {movie.type === 'series' ? 'Phim bộ' : 'Phim lẻ'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="card-body">
                      <h6 className="card-title text-white mb-1 text-truncate">
                        {movie.name}
                      </h6>
                      <p className="card-text small text-muted text-truncate mb-1">
                        {movie.origin_name}
                      </p>
                    
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
      <div className="text-center mt-4">
        <button 
          className="btn btn-outline-danger px-4"
          onClick={loadMore}
          disabled={loading}
        >
          {loading ? 'Đang tải...' : 'Xem thêm'}
        </button>
      </div>
    </div>
  );
};

export default MovieCategory;
