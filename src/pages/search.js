import React, { useState, useEffect } from "react";
import Navbar from "../components/Layout/Navbar";
import Link from "next/link";
import axios from 'axios';
import { useRouter } from 'next/router';

export default function SearchPage() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        category: '',
        country: '',
        year: ''
    });
    const [totalPages, setTotalPages] = useState(1);
    const [allMovies, setAllMovies] = useState([]);
    const MOVIES_PER_PAGE = 24;

    // Danh sách thể loại
    const categories = [
        "Hành Động",
        "Tình Cảm",
        "Hài Hước",
        "Cổ Trang",
        "Tâm Lý",
        "Hình Sự",
        "Chiến Tranh",
        "Thể Thao",
        "Võ Thuật",
        "Viễn Tưởng",
        "Phiêu Lưu",
        "Khoa Học",
        "Kinh Dị",
        "Âm Nhạc",
        "Thần Thoại",
        "Hoạt Hình"
    ];

    // Danh sách quốc gia
    const countries = [
        "Trung Quốc",
        "Hàn Quốc",
        "Nhật Bản",
        "Thái Lan",
        "Âu Mỹ",
        "Đài Loan",
        "Hồng Kông",
        "Ấn Độ",
        "Việt Nam"
    ];

    // Tạo danh sách năm từ 2024 đến 2010
    const years = Array.from({ length: 15 }, (_, i) => 2026- i);

    const fetchAllMoviesData = async (pageNumber = 1) => {
        try {
            let apiUrl = `https://ophim1.com/danh-sach/phim-moi-cap-nhat?page=${pageNumber}`;
            
            if (query) {
                apiUrl = `https://ophim1.com/tim-kiem?keyword=${encodeURIComponent(query)}&page=${pageNumber}`;
            }

            const response = await axios.get(apiUrl);
            return {
                movies: response.data.items || [],
                pagination: response.data.pagination,
                pathImage: response.data.pathImage
            };
        } catch (error) {
            console.error("Lỗi khi tải danh sách phim:", error);
            return { movies: [], pagination: null, pathImage: '' };
        }
    };

    const fetchMovies = async (pageNumber = 1) => {
        try {
            setLoading(true);

            // Fetch dữ liệu từ nhiều trang để có nhiều phim hơn
            const pagesToFetch = 15; // trang muốn fetch
            let allMovies = [];
            
            for (let i = 0; i < pagesToFetch; i++) {
                const currentPage = pageNumber + i;
                const { movies: currentPageMovies, pagination, pathImage } = await fetchAllMoviesData(currentPage);
                
                if (pagination) {
                    setTotalPages(pagination.totalPages);
                }

                allMovies = [...allMovies, ...currentPageMovies];
            }

            // Lọc theo năm
            let filteredMovies = allMovies;
            if (filters.year) {
                filteredMovies = filteredMovies.filter(movie => 
                    movie.year === parseInt(filters.year)
                );
            }

            // Lấy chi tiết cho từng phim
            const detailedMovies = await Promise.all(
                filteredMovies.map(async (movie) => {
                    try {
                        const detailResponse = await axios.get(`https://ophim1.com/phim/${movie.slug}`);
                        const movieData = detailResponse.data;
                        return {
                            ...movie,
                            ...movieData.movie,
                            episodes: movieData.episodes,
                            thumb_url: movieData.movie.thumb_url.startsWith('http') 
                                ? movieData.movie.thumb_url 
                                : `${pathImage}${movieData.movie.thumb_url}`,
                            poster_url: movieData.movie.poster_url.startsWith('http')
                                ? movieData.movie.poster_url
                                : `${pathImage}${movieData.movie.poster_url}`
                        };
                    } catch (error) {
                        console.error(`Error fetching details for ${movie.slug}:`, error);
                        return movie;
                    }
                })
            );

            // Lọc theo thể loại và quốc gia
            let finalFilteredMovies = detailedMovies;
            
            if (filters.category) {
                finalFilteredMovies = finalFilteredMovies.filter(movie => {
                    if (!movie.category) return false;
                    return movie.category.some(cat => {
                        const categoryName = typeof cat === 'string' ? cat : cat.name;
                        return categoryName.toLowerCase() === filters.category.toLowerCase();
                    });
                });
            }

            if (filters.country) {
                finalFilteredMovies = finalFilteredMovies.filter(movie => {
                    if (!movie.country) return false;
                    return movie.country.some(country => {
                        const countryName = typeof country === 'string' ? country : country.name;
                        return countryName.toLowerCase() === filters.country.toLowerCase();
                    });
                });
            }

            // Cập nhật state
            if (pageNumber === 1) {
                setMovies(finalFilteredMovies);
                setAllMovies(finalFilteredMovies);
            } else {
                const newMovies = [...allMovies, ...finalFilteredMovies];
                setAllMovies(newMovies);
                setMovies(newMovies);
            }
            
            setSearched(true);
        } catch (error) {
            console.error("Lỗi khi tìm kiếm phim:", error);
            setMovies([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchMovies(1);
    };

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
        setPage(1);
        fetchMovies(1);
    };

    const loadMore = async () => {
        if (page < totalPages) {
            try {
                setLoading(true);
                const nextPage = page + 1;
                
                // Fetch dữ liệu từ trang tiếp theo
                const { movies: newPageMovies, pagination, pathImage } = await fetchAllMoviesData(nextPage);
                
                // Lọc theo năm
                let filteredMovies = newPageMovies;
                if (filters.year) {
                    filteredMovies = filteredMovies.filter(movie => 
                        movie.year === parseInt(filters.year)
                    );
                }

                // Lấy chi tiết cho từng phim mới
                const detailedMovies = await Promise.all(
                    filteredMovies.map(async (movie) => {
                        try {
                            const detailResponse = await axios.get(`https://ophim1.com/phim/${movie.slug}`);
                            const movieData = detailResponse.data;
                            return {
                                ...movie,
                                ...movieData.movie,
                                episodes: movieData.episodes,
                                thumb_url: movieData.movie.thumb_url.startsWith('http') 
                                    ? movieData.movie.thumb_url 
                                    : `${pathImage}${movieData.movie.thumb_url}`,
                                poster_url: movieData.movie.poster_url.startsWith('http')
                                    ? movieData.movie.poster_url
                                    : `${pathImage}${movieData.movie.poster_url}`
                            };
                        } catch (error) {
                            console.error(`Error fetching details for ${movie.slug}:`, error);
                            return movie;
                        }
                    })
                );

                // Lọc theo thể loại và quốc gia
                let finalFilteredMovies = detailedMovies;
                
                if (filters.category) {
                    finalFilteredMovies = finalFilteredMovies.filter(movie => {
                        if (!movie.category) return false;
                        return movie.category.some(cat => {
                            const categoryName = typeof cat === 'string' ? cat : cat.name;
                            return categoryName.toLowerCase() === filters.category.toLowerCase();
                        });
                    });
                }

                if (filters.country) {
                    finalFilteredMovies = finalFilteredMovies.filter(movie => {
                        if (!movie.country) return false;
                        return movie.country.some(country => {
                            const countryName = typeof country === 'string' ? country : country.name;
                            return countryName.toLowerCase() === filters.country.toLowerCase();
                        });
                    });
                }

                // Cập nhật state
                setMovies(prevMovies => [...prevMovies, ...finalFilteredMovies]);
                setPage(nextPage);
            } catch (error) {
                console.error("Lỗi khi tải thêm phim:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searched) {
                fetchMovies(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [query, filters]);

    useEffect(() => {
        fetchMovies(1);
    }, []);

    // Sửa lại điều kiện hiển thị nút "Xem thêm"
    const showLoadMore = !loading && page < totalPages;

    return (
        <div className="bg-black min-vh-100 text-white">
            <Navbar />
            
            <div className="container py-5 mt-5">
                <h1 className="mb-4">Tìm kiếm phim</h1>
                
                {/* Search input */}
                <div className="input-group mb-4">
                    <input 
                        type="text" 
                        className="form-control bg-dark text-white border-dark" 
                        placeholder="Nhập tên phim cần tìm..." 
                        value={query} 
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button 
                        className="btn btn-danger" 
                        onClick={handleSearch} 
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        ) : null}
                        Tìm kiếm
                    </button>
                </div>

                {/* Filters */}
                <div className="row mb-4">
                    {/* Category Filter */}
                    <div className="col-md-4 mb-3">
                        <select 
                            className="form-select bg-dark text-white border-dark"
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                        >
                            <option value="">Tất cả thể loại</option>
                            {categories.map((category, index) => (
                                <option key={index} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>

                    {/* Country Filter */}
                    <div className="col-md-4 mb-3">
                        <select 
                            className="form-select bg-dark text-white border-dark"
                            value={filters.country}
                            onChange={(e) => handleFilterChange('country', e.target.value)}
                        >
                            <option value="">Tất cả quốc gia</option>
                            {countries.map((country, index) => (
                                <option key={index} value={country}>{country}</option>
                            ))}
                        </select>
                    </div>

                    {/* Year Filter */}
                    <div className="col-md-4 mb-3">
                        <select 
                            className="form-select bg-dark text-white border-dark"
                            value={filters.year}
                            onChange={(e) => handleFilterChange('year', e.target.value)}
                        >
                            <option value="">Tất cả năm</option>
                            {years.map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Results */}
                {loading && movies.length === 0 ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-danger" role="status">
                            <span className="visually-hidden">Đang tìm kiếm...</span>
                        </div>
                    </div>
                ) : (
                    <>
                        {searched && (
                            <>
                                <div className="mb-3 text-muted">
                                    Tìm thấy {movies.length} kết quả
                                </div>
                                {movies.length > 0 ? (
                                    <>
                                        <div className="row g-4">
                                            {movies.map((movie, index) => (
                                                <div key={index} className="col-6 col-sm-4 col-md-3 col-lg-2">
                                                    <div className="movie-card h-100" onClick={() => router.push(`/movie/${movie.slug}`)}>
                                                        <div className="position-relative">
                                                            <img
                                                                src={movie.thumb_url || movie.poster_url}
                                                                alt={movie.name}
                                                                className="w-100 rounded"
                                                                style={{ height: '250px', objectFit: 'cover' }}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = "/placeholder.jpg";
                                                                }}
                                                            />
                                                            <div className="overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                                                                <button className="btn btn-danger btn-sm">
                                                                    <i className="fas fa-play me-2"></i>
                                                                    Xem phim
                                                                </button>
                                                            </div>
                                                            <div className="position-absolute top-0 end-0 m-2">
                                                                <span className="badge bg-danger">{movie.year}</span>
                                                                {movie.quality && (
                                                                    <span className="badge bg-primary ms-1">{movie.quality}</span>
                                                                )}
                                                            </div>
                                                            {movie.episodes && movie.episodes.length > 0 && (
                                                                <div className="position-absolute bottom-0 start-0 m-2">
                                                                    <span className="badge bg-success">
                                                                        {movie.episodes[0].server_data.length} tập
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="movie-info p-2">
                                                            <h3 className="h6 mb-1 text-truncate">{movie.name}</h3>
                                                            <p className="small text-muted mb-0 text-truncate">
                                                                {movie.origin_name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {showLoadMore && (
                                            <div className="text-center mt-4">
                                                <button 
                                                    className="btn btn-outline-danger px-4"
                                                    onClick={loadMore}
                                                    disabled={loading}
                                                >
                                                    {loading ? 'Đang tải...' : 'Xem thêm'}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="alert alert-warning">
                                        Không tìm thấy phim phù hợp với tiêu chí tìm kiếm
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            <style jsx>{`
                .form-select {
                    cursor: pointer;
                }
                .form-select:focus {
                    border-color: #dc3545;
                    box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25);
                }
                .movie-card {
                    background: #1a1a1a;
                    border-radius: 10px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: transform 0.3s, box-shadow 0.3s;
                }
                .movie-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 5px 15px rgba(220, 53, 69, 0.3);
                }
                .overlay {
                    background: rgba(0, 0, 0, 0.7);
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                .movie-card:hover .overlay {
                    opacity: 1;
                }
                .movie-info {
                    background: #1a1a1a;
                }
            `}</style>
        </div>
    );
}