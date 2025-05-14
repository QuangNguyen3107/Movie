import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "../components/Layout/Navbar";
import styles from "../styles/Movies.module.css";
import Skeleton from "../components/UI/Skeleton";
import { FaPlayCircle, FaStar, FaFilm, FaChevronDown } from "react-icons/fa";

// Series page component for "Phim Bộ" (TV series)
const Series = () => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadedImages, setLoadedImages] = useState({});
  const [totalSeries, setTotalSeries] = useState(0);
  
  // Bộ lọc phim
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [years, setYears] = useState([]);
  const [filters, setFilters] = useState({
    category: "",
    country: "",
    year: "",
    type: "series" // Default to type "series" for series page
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  
  const [sortOption, setSortOption] = useState("newest");
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Hàm sắp xếp phim theo tùy chọn đã chọn
  const sortSeriesData = (seriesList) => {
    if (!Array.isArray(seriesList)) return [];
    
    const seriesCopy = [...seriesList];
    
    switch (sortOption) {
      case 'a-z':
        return seriesCopy.sort((a, b) => a.name.localeCompare(b.name));
      case 'z-a':
        return seriesCopy.sort((a, b) => b.name.localeCompare(a.name));
      case 'highest-rating':
        return seriesCopy.sort((a, b) => b.rating - a.rating);
      case 'lowest-rating':
        return seriesCopy.sort((a, b) => a.rating - b.rating);
      case 'newest':
        return seriesCopy.sort((a, b) => new Date(b.modified?.time || b.modified || b.created_at || 0) - new Date(a.modified?.time || a.modified || a.created_at || 0));
      case 'oldest':
        return seriesCopy.sort((a, b) => new Date(a.modified?.time || a.modified || a.created_at || 0) - new Date(b.modified?.time || b.modified || b.created_at || 0));
      case 'year-desc':
        return seriesCopy.sort((a, b) => b.year - a.year);
      case 'year-asc':
        return seriesCopy.sort((a, b) => a.year - b.year);
      default:
        return seriesCopy;
    }
  };

  // Hàm xử lý thay đổi tùy chọn sắp xếp
  const handleSortChange = (option) => {
    setSortOption(option);
    setShowSortOptions(false);
  };

  // Lấy tên hiển thị của tùy chọn sắp xếp hiện tại
  const getSortOptionName = (option = sortOption) => {
    switch (option) {
      case 'a-z': return 'A-Z';
      case 'z-a': return 'Z-A';
      case 'highest-rating': return 'Đánh giá cao nhất';
      case 'lowest-rating': return 'Đánh giá thấp nhất';
      case 'newest': return 'Mới nhất';
      case 'oldest': return 'Cũ nhất';
      case 'year-desc': return 'Năm mới nhất';
      case 'year-asc': return 'Năm cũ nhất';
      default: return 'Mới nhất';
    }
  };

  // Tắt/mở dropdown sắp xếp
  const toggleSortDropdown = (e) => {
    e.stopPropagation();
    setShowSortOptions(!showSortOptions);
    setShowCategoryDropdown(false);
    setShowCountryDropdown(false);
    setShowYearDropdown(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (showCategoryDropdown || showCountryDropdown || showYearDropdown || showSortOptions) {
        setShowCategoryDropdown(false);
        setShowCountryDropdown(false);
        setShowYearDropdown(false);
        setShowSortOptions(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoryDropdown, showCountryDropdown, showYearDropdown, showSortOptions]);

  useEffect(() => {
    // Initial load of series
    fetchSeries(1);
    fetchFilters();
  }, []);
  
  // Fetch filters when any filter is changed
  useEffect(() => {
    setPage(1);
    fetchSeries(1);
  }, [filters, sortOption]);

  const fetchFilters = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      // Fetch categories
      const categoriesResponse = await fetch(`${apiUrl}/categories`);
      const categoriesData = await categoriesResponse.json();
      if (categoriesData.success && categoriesData.data) {
        setCategories(categoriesData.data);
      }
      
      // Fetch countries
      const countriesResponse = await fetch(`${apiUrl}/countries`);
      const countriesData = await countriesResponse.json();
      if (countriesData.success && countriesData.data) {
        setCountries(countriesData.data);
      }
      
      // Generate years for the filter (current year down to 2000)
      const currentYear = new Date().getFullYear();
      const yearsList = [];
      for (let year = currentYear; year >= 2000; year--) {
        yearsList.push(year);
      }
      setYears(yearsList);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };
  
  const handleCategoryToggle = (e) => {
    e.stopPropagation();
    setShowCategoryDropdown(!showCategoryDropdown);
    setShowCountryDropdown(false);
    setShowYearDropdown(false);
    setShowSortOptions(false);
  };
  
  const handleCountryToggle = (e) => {
    e.stopPropagation();
    setShowCountryDropdown(!showCountryDropdown);
    setShowCategoryDropdown(false);
    setShowYearDropdown(false);
    setShowSortOptions(false);
  };
  
  const handleYearToggle = (e) => {
    e.stopPropagation();
    setShowYearDropdown(!showYearDropdown);
    setShowCategoryDropdown(false);
    setShowCountryDropdown(false);
    setShowSortOptions(false);
  };
  
  const handleCategorySelect = (categoryId) => {
    setFilters(prev => ({ ...prev, category: categoryId }));
    setShowCategoryDropdown(false);
  };
  
  const handleCountrySelect = (countryCode) => {
    setFilters(prev => ({ ...prev, country: countryCode }));
    setShowCountryDropdown(false);
  };
  
  const handleYearSelect = (year) => {
    setFilters(prev => ({ ...prev, year }));
    setShowYearDropdown(false);
  };

  const fetchSeries = async (pageNumber) => {
    try {
      setLoading(true);
      
      // Tạo query parameters từ các bộ lọc
      let queryParams = `page=${pageNumber}&limit=24`;
      
      // Thêm các bộ lọc vào query parameters
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams += `&${key}=${filters[key]}`;
        }
      });
      
      // Log query parameters for debugging
      console.log('Fetching series with params:', queryParams);
      
      // Fetch TV series (Phim Bộ) using the backend API with appropriate type parameter
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(
        `${apiUrl}/movies?${queryParams}`
      );
      
      const result = await response.json();
      
      if (result.data && result.data.movies) {
        const { movies: newSeries, pagination } = result.data;
        
        // Process series for display
        const processedSeries = newSeries.map(series => ({
          ...series,
          thumb_url: series.thumb_url?.startsWith('http') 
            ? series.thumb_url 
            : `${series.thumb_url}`,
          poster_url: series.poster_url?.startsWith('http')
            ? series.poster_url
            : `${series.poster_url}`
        }));
        
        // Sort series based on selected sort option
        const sortedSeries = sortSeriesData(processedSeries);
        
        // If it's the first page, replace series; otherwise, append
        if (pageNumber === 1) {
          setSeries(sortedSeries);
        } else {
          setSeries(prev => [...prev, ...sortedSeries]);
        }
        
        // Update pagination information
        setTotalSeries(pagination?.totalItems || 0);
        setHasMore(pagination?.currentPage < pagination?.totalPages);
        
      } else {
        console.error('Error fetching series:', result.message || 'Unknown error');
        if (pageNumber === 1) {
          setSeries([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching series:', error);
      if (pageNumber === 1) {
        setSeries([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchSeries(nextPage);
    }
  };

  const handleImageLoad = (imageId) => {
    setLoadedImages(prev => ({
      ...prev,
      [imageId]: true
    }));
  };

  return (
    <>
      <Head>
        <title>Phim Bộ | Movie Streaming</title>
        <meta name="description" content="Xem phim bộ hay nhất và mới nhất trên Movie Streaming" />
      </Head>
      
      <div className={styles.container}> 
        <div className="container py-5 mt-5">
          <div className="row mb-4">
            <div className="col-12">
              <h1 className="text-white">Phim Bộ</h1>
              <p className="text-secondary">
                Tổng hợp các bộ phim truyền hình, phim bộ hay nhất, cập nhật nhanh nhất
                {totalSeries > 0 && ` (${totalSeries} phim)`}
              </p>
            </div>
          </div>
          
          <div className="row mb-4">
            <div className="col-12 d-flex flex-wrap gap-3">
              <div className="dropdown">
                <button 
                  className="btn btn-outline-secondary dropdown-toggle" 
                  onClick={handleCategoryToggle}
                >
                  {filters.category ? categories.find(c => c.id === filters.category)?.name : "Thể loại"} <FaChevronDown />
                </button>
                {showCategoryDropdown && (
                  <ul className="dropdown-menu show">
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => handleCategorySelect("")}
                      >
                        Tất cả thể loại
                      </button>
                    </li>
                    {categories.map(category => (
                      <li key={category.id}>
                        <button 
                          className="dropdown-item" 
                          onClick={() => handleCategorySelect(category.id)}
                        >
                          {category.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="dropdown">
                <button 
                  className="btn btn-outline-secondary dropdown-toggle" 
                  onClick={handleCountryToggle}
                >
                  {filters.country ? countries.find(c => c.code === filters.country)?.name : "Quốc gia"} <FaChevronDown />
                </button>
                {showCountryDropdown && (
                  <ul className="dropdown-menu show">
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => handleCountrySelect("")}
                      >
                        Tất cả quốc gia
                      </button>
                    </li>
                    {countries.map(country => (
                      <li key={country.code}>
                        <button 
                          className="dropdown-item" 
                          onClick={() => handleCountrySelect(country.code)}
                        >
                          {country.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="dropdown">
                <button 
                  className="btn btn-outline-secondary dropdown-toggle" 
                  onClick={handleYearToggle}
                >
                  {filters.year || "Năm"} <FaChevronDown />
                </button>
                {showYearDropdown && (
                  <ul className="dropdown-menu show">
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => handleYearSelect("")}
                      >
                        Tất cả năm
                      </button>
                    </li>
                    {years.map(year => (
                      <li key={year}>
                        <button 
                          className="dropdown-item" 
                          onClick={() => handleYearSelect(year)}
                        >
                          {year}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="dropdown">
                <button 
                  className="btn btn-outline-secondary dropdown-toggle" 
                  onClick={toggleSortDropdown}
                >
                  {getSortOptionName()} <FaChevronDown />
                </button>
                {showSortOptions && (
                  <ul className="dropdown-menu show" style={{backgroundColor: '#212529', minWidth: '200px'}}>
                    <li>
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleSortChange('newest')}
                      >
                        Mới nhất
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleSortChange('oldest')}
                      >
                        Cũ nhất
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleSortChange('a-z')}
                      >
                        A-Z
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleSortChange('z-a')}
                      >
                        Z-A
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleSortChange('highest-rating')}
                      >
                        Đánh giá cao nhất
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleSortChange('lowest-rating')}
                      >
                        Đánh giá thấp nhất
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleSortChange('year-desc')}
                      >
                        Năm mới nhất
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleSortChange('year-asc')}
                      >
                        Năm cũ nhất
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>
          
          <div className="row g-3 movie-grid">
            {loading && page === 1 
              ? [...Array(24)].map((_, i) => (
                  <div key={`skeleton-${i}`} className="col-6 col-sm-4 col-md-3 col-lg-3 col-xl-2 mb-4">
                    <div className="card h-100 bg-dark border-0">
                      <Skeleton height="300px" borderRadius="8px" />
                      <div className="card-body p-2">
                        <Skeleton height="18px" width="85%" />
                        <div className="mt-1">
                          <Skeleton height="14px" width="65%" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              : series.map((series) => {
                  const imageId = `series-${series.slug}`;
                  return (
                    <div 
                      key={series.slug} 
                      className="col-6 col-sm-4 col-md-3 col-lg-3 col-xl-2 mb-4"
                    >
                      <div className={`card h-100 bg-dark border-0 ${styles.movieCard}`}>
                        <div className={`position-relative ${styles.moviePoster}`}>
                          <div 
                            className={`blur-load ${loadedImages[imageId] ? 'loaded' : ''}`}
                            style={{ 
                              backgroundImage: `url(${series.thumb_url}?blur=30)`,
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
                              src={series.thumb_url || series.poster_url || "/placeholder.jpg"}
                              className={`card-img-top ${styles.movieImage}`}
                              alt={series.name}
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
                          
                          <div className={styles.overlay}>
                            <Link 
                              href={`/movie/${series.slug}`}
                              className={styles.playButton}
                            >
                              <FaPlayCircle size={48} />
                            </Link>
                          </div>
                          
                          <div className={styles.movieInfo}>
                            {series.year && (
                              <span className="badge bg-danger me-1">
                                {series.year}
                              </span>
                            )}
                            {series.quality && (
                              <span className="badge bg-primary me-1">
                                {series.quality}
                              </span>
                            )}
                            {series.lang && (
                              <span className="badge bg-info">
                                {series.lang || 'Vietsub'}
                              </span>
                            )}
                          </div>
                          
                          {series.rating > 0 && (
                            <div className={styles.ratingBadge}>
                              <FaStar /> {series.rating.toFixed(1)}
                            </div>
                          )}
                          
                          {series.episodes && series.episodes[0] && series.episodes[0].server_data && (
                            <div className={styles.episodeBadge}>
                              <FaFilm /> {series.episodes[0].server_data.length} tập
                            </div>
                          )}
                        </div>
                        
                        <div className="card-body p-2">
                          <h6 className="card-title text-white mb-1 text-truncate">
                            {series.name}
                          </h6>
                          <p className="card-text small text-muted text-truncate">
                            {series.origin_name}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
          
          {!loading && hasMore && (
            <div className="text-center mt-4 mb-5">
              <button 
                className="btn btn-outline-danger px-4 py-2"
                onClick={loadMore}
              >
                Xem thêm
              </button>
            </div>
          )}
          
          {loading && page > 1 && (
            <div className="text-center mt-4 mb-5">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-secondary mt-2">Đang tải thêm phim...</p>
            </div>
          )}
          
          {!loading && series.length === 0 && (
            <div className="text-center py-5">
              <div className="mb-3">
                <FaPlayCircle size={60} className="text-secondary" />
              </div>
              <h3 className="text-white">Không tìm thấy phim</h3>
              <p className="text-secondary">
                Hiện chưa có phim bộ nào trong hệ thống. Vui lòng quay lại sau.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .movie-grid {
          margin-right: -10px;
          margin-left: -10px;
        }
        
        .movie-grid > [class*="col-"] {
          padding-right: 10px;
          padding-left: 10px;
        }
        
        @media (max-width: 1200px) {
          .col-xl-2 {
            flex: 0 0 20%;
            max-width: 20%;
          }
        }
        
        @media (max-width: 992px) {
          .col-lg-3 {
            flex: 0 0 25%;
            max-width: 25%;
          }
        }
        
        @media (max-width: 768px) {
          .movie-grid {
            margin-right: -7px;
            margin-left: -7px;
          }
          
          .movie-grid > [class*="col-"] {
            padding-right: 7px;
            padding-left: 7px;
          }
        }
        
        @media (max-width: 576px) {
          .movie-grid {
            margin-right: -5px;
            margin-left: -5px;
          }
          
          .movie-grid > [class*="col-"] {
            padding-right: 5px;
            padding-left: 5px;
          }
        }

        .dropdown-menu {
          background-color: #212529;
          color: white;
          border: 1px solid rgba(255,255,255,0.15);
        }

        .dropdown-item {
          color: rgba(255,255,255,0.8);
        }

        .dropdown-item:hover {
          background-color: rgba(255,255,255,0.1);
          color: white;
        }
      `}</style>
    </>
  );
};

export default Series;