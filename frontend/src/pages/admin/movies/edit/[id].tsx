// src/pages/admin/movies/edit/[id].tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '../../../../components/Layout/AdminLayout';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaSave, 
  FaTrash, 
  FaPlus, 
  FaFilm,

  FaServer,

  FaArrowUp // Thêm icon mũi tên lên
} from 'react-icons/fa';
import axiosInstance from '../../../../API/config/axiosConfig';
import { endpoints } from '../../../../config/API';
import styles from '../../../../styles/MovieEditPage.module.css';

// Interface cho tập phim
interface Episode {
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
}

// Interface cho danh mục
interface Category {
  id: string;
  name: string;
  slug?: string;
}

// Interface cho quốc gia
interface Country {
  id: string;
  name: string;
  slug?: string;
}

// Interface cho server phim
interface ServerData {
  server_name: string;
  server_data: Episode[];
}

// Interface cho phim
interface Movie {
  _id: string;
  name?: string;
  origin_name?: string;
  category?: Array<Category | string>;
  country?: Array<Country | string> | string;
  thumb_url: string;
  poster_url?: string;
  trailer_url?: string;
  slug: string;
  year: number;
  type: 'series' | 'single';
  status: 'active' | 'inactive';
  quality: string;
  lang: string;
  time?: string;
  episode_current?: string;
  episode_total?: string;

  content?: string;
  director?: string[] | string;
  actor?: string[] | string;
  episodes?: ServerData[];
  createdAt: string;
  updatedAt: string;
  tmdb?: {
    type?: string;
    id?: string;
    season?: number;
    vote_average?: number;
    vote_count?: number;
  };
  imdb?: {
    id?: string;
  };
  is_copyright?: boolean;
  chieurap?: boolean;
  sub_docquyen?: boolean;
  notify?: string;
  showtimes?: string;
}

// Component chính
const MovieEditPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  
  // State cho thông tin phim
  const [formData, setFormData] = useState<Partial<Movie>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);

  // State cho episodes
  const [episodes, setEpisodes] = useState<ServerData[]>([]);
  const [newServerName, setNewServerName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  // State để kiểm soát hiển thị nút back to top
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Fetch movie data and categories
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Lấy thông tin phim từ API
        const movieUrl = endpoints.admin.movies.getById(id as string);
        const movieResponse = await axiosInstance.get(movieUrl);
        
        if (movieResponse.data && movieResponse.data.movie) {
          const movieData = movieResponse.data.movie;
          setMovie(movieData);
          setFormData(movieData);
          
          // Khởi tạo episodes từ dữ liệu movie
          if (movieData.episodes && Array.isArray(movieData.episodes)) {
            setEpisodes(movieData.episodes);
          } else {
            // Nếu chưa có episodes, tạo mảng trống
            setEpisodes([]);
          }
        } else {
          toast.error('Không thể tải thông tin phim');
          router.push('/admin/movies');
        }
        
        // Lấy danh sách phim để trích xuất danh mục và quốc gia
        const moviesResponse = await axiosInstance.get('/api/admin/movies', {
          params: { limit: 100 } // Lấy đủ phim để trích xuất đầy đủ categories và countries
        });
        
        if (moviesResponse.data && moviesResponse.data.movies && Array.isArray(moviesResponse.data.movies)) {
          // Tạo map để lưu trữ danh mục và quốc gia duy nhất
          const categoriesMap = new Map();
          const countriesMap = new Map();
            // Trích xuất danh mục và quốc gia từ danh sách phim
          moviesResponse.data.movies.forEach((movie: Movie) => {
            // Xử lý Categories
            if (movie.category && Array.isArray(movie.category)) {
              movie.category.forEach((cat: Category | string) => {
                if (typeof cat === 'object' && cat !== null && cat.id) {
                  categoriesMap.set(cat.id, {
                    id: cat.id,
                    name: cat.name || cat.id,
                    slug: cat.slug || (cat.name ? cat.name.toLowerCase().replace(/\s+/g, '-') : '')
                  });
                } else if (typeof cat === 'string') {
                  if (!categoriesMap.has(cat)) {
                    categoriesMap.set(cat, {
                      id: cat,
                      name: cat,
                      slug: cat.toLowerCase().replace(/\s+/g, '-')
                    });
                  }
                }
              });
            }
              // Xử lý Countries
            if (movie.country && Array.isArray(movie.country)) {
              movie.country.forEach((country: Country | string) => {
                if (typeof country === 'object' && country !== null && country.id) {
                  countriesMap.set(country.id, {
                    id: country.id,
                    name: country.name || country.id,
                    slug: country.slug || (country.name ? country.name.toLowerCase().replace(/\s+/g, '-') : '')
                  });
                } else if (typeof country === 'string') {
                  if (!countriesMap.has(country)) {
                    countriesMap.set(country, {
                      id: country,
                      name: country,
                      slug: country.toLowerCase().replace(/\s+/g, '-')
                    });
                  }
                }
              });
            }
          });
          
          // Chuyển map thành mảng
          const extractedCategories = Array.from(categoriesMap.values());
          const extractedCountries = Array.from(countriesMap.values());
          
          console.log(`Extracted ${extractedCategories.length} categories and ${extractedCountries.length} countries from movies data`);
          
          setCategories(extractedCategories);
          setCountries(extractedCountries);
        } else {
          console.warn('Không thể trích xuất danh mục và quốc gia từ danh sách phim');
          setCategories([]);
          setCountries([]);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  // Hàm thêm server mới
  const handleAddServer = () => {
    if (!newServerName.trim()) {
      setErrorMessage('Vui lòng nhập tên server');
      return;
    }

    // Kiểm tra xem tên server đã tồn tại chưa
    const serverExists = episodes.some(
      server => server.server_name.toLowerCase() === newServerName.trim().toLowerCase()
    );

    if (serverExists) {
      setErrorMessage('Server này đã tồn tại');
      return;
    }

    // Thêm server mới
    const newServer = {
      server_name: newServerName.trim(),
      server_data: []
    };

    setEpisodes([...episodes, newServer]);
    setNewServerName('');
    setErrorMessage('');
  };

  // Hàm xóa server
  const handleDeleteServer = (index: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa server này?')) {
      const updatedEpisodes = [...episodes];
      updatedEpisodes.splice(index, 1);
      setEpisodes(updatedEpisodes);
    }
  };

  // Hàm thêm tập phim mới
  const handleAddEpisode = (serverIndex: number) => {
    const updatedEpisodes = [...episodes];
    const newEpisode: Episode = {
      name: `Tập ${updatedEpisodes[serverIndex].server_data.length + 1}`,
      slug: `tap-${updatedEpisodes[serverIndex].server_data.length + 1}`,
      filename: '',
      link_embed: '',
      link_m3u8: ''
    };
    
    updatedEpisodes[serverIndex].server_data.push(newEpisode);
    setEpisodes(updatedEpisodes);
  };

  // Hàm xóa tập phim
  const handleDeleteEpisode = (serverIndex: number, episodeIndex: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tập phim này?')) {
      const updatedEpisodes = [...episodes];
      updatedEpisodes[serverIndex].server_data.splice(episodeIndex, 1);
      setEpisodes(updatedEpisodes);
    }
  };

  // Hàm cập nhật thông tin tập phim
  const handleEpisodeChange = (serverIndex: number, episodeIndex: number, field: keyof Episode, value: string) => {
    const updatedEpisodes = [...episodes];
    updatedEpisodes[serverIndex].server_data[episodeIndex][field] = value;
    setEpisodes(updatedEpisodes);
  };

  // Hàm lưu thay đổi
  const handleSave = async () => {
    if (!movie || !id) return;
    
    try {
      setSaving(true);
      
      // Validate dữ liệu trước khi gửi
      if (!formData.name || !formData.origin_name || !formData.slug) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
        setSaving(false);
        return;
      }
      
      // Đảm bảo year là số
      const updatedFormData = {
        ...formData,
        year: typeof formData.year === 'string' ? parseInt(formData.year) : formData.year,
        episodes: episodes // Đảm bảo gửi cả thông tin episodes
      };
      
      // Gọi API để cập nhật
      const url = endpoints.admin.movies.update(id as string);
      const response = await axiosInstance.put(url, updatedFormData);
      
      if (response.data && response.data.success) {
        toast.success('Lưu thông tin phim thành công');
        
        // Cập nhật lại dữ liệu movie hiện tại
        setMovie(response.data.movie);
        setFormData(response.data.movie);
        
        // Đánh dấu form là không còn thay đổi
        setIsDirty(false);      } else {
        throw new Error(response.data.message || 'Lỗi khi lưu dữ liệu phim');
      }
    } catch (error) {
      console.error('Error saving movie data:', error);
      // Kiểm tra kiểu của error trước khi truy cập thuộc tính
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object') {
        const errorResponse = error.response as { data?: { message?: string } };
        toast.error(errorResponse.data?.message || 'Lỗi khi lưu dữ liệu phim');
      } else {
        toast.error('Lỗi khi lưu dữ liệu phim');
      }
    } finally {
      setSaving(false);
    }
  };

  // Quay lại trang danh sách phim
  const handleBack = () => {
    router.push('/admin/movies');
  };

  // Các hàm xử lý form
  // Hàm xử lý thay đổi input thông thường
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Hàm xử lý thay đổi checkbox
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };
  
  // Hàm xử lý thay đổi mảng (diễn viên, đạo diễn)
  const handleArrayInputChange = (field: string, value: string) => {
    // Chuyển đổi chuỗi thành mảng bằng cách tách theo dấu phẩy
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData({
      ...formData,
      [field]: arrayValue
    });
  };
  
  // Hàm xử lý thay đổi đa lựa chọn (categories, countries)
  // const handleMultiSelectChange = (field: string, selectedValues: string[]) => {
  //   setFormData({
  //     ...formData,
  //     [field]: selectedValues
  //   });
  // };
  
  // Hàm xử lý thay đổi dữ liệu TMDB
  const handleTmdbChange = (field: string, value: string | number) => {
    setFormData({
      ...formData,
      tmdb: {
        ...formData.tmdb,
        [field]: value
      }
    });
  };
  
  // Hàm xử lý thay đổi dữ liệu IMDB
  const handleImdbChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      imdb: {
        ...formData.imdb,
        [field]: value
      }
    });
  };

  // Effect theo dõi thay đổi form
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(movie);
    setIsDirty(hasChanges);
  }, [formData, movie]);

  // Xử lý khi người dùng thoát trang khi có thay đổi chưa lưu
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        const message = 'Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời đi?';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // Kiểm tra cuộn trang để hiển thị nút back to top
  useEffect(() => {
    const handleScroll = () => {
      // Hiển thị nút khi cuộn xuống quá 300px
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Cleanup listener khi component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Hàm cuộn lên đầu trang
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    // Đã loại bỏ AdminLayout để tránh footer bị lặp lại
    <>
      <Head>
        <title>{movie?.name ? `Chỉnh sửa: ${movie.name}` : 'Chỉnh sửa phim'} | Movie Admin</title>
      </Head>
      
      <form ref={formRef} className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>
            {movie?.name ? movie.name : '[id]'}
          </h1>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              type="button"
              onClick={handleBack}
              className={styles.backButton}
            >
              <FaArrowLeft /> Quay lại
            </button>
            
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={styles.saveButton}
            >
              {saving ? 'Đang lưu...' : <><FaSave /> Lưu thay đổi</>}
            </button>
          </div>
        </div>
        
        {/* Basic movie info section */}
        {movie && (
          <div className={styles.movieBasicInfo}>
            <div className={styles.thumbnailPreview}>
              <img src={movie.thumb_url} alt={movie.name} />
            </div>
            
            <div className={styles.movieDetails}>
              <h2>{movie.name}</h2>
              <p className={styles.originalTitle}>{movie.origin_name}</p>
              <div className={styles.movieType}>
                <span><FaFilm /> {movie.type === 'series' ? 'Phim bộ' : 'Phim lẻ'}</span>
                {movie.quality && <span>• {movie.quality}</span>}
                {movie.lang && <span>• {movie.lang}</span>}
                {movie.year && <span>• {movie.year}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className={styles.tabsContainer}>
          <button 
            type="button"
            className={`${styles.tabButton} ${activeTab === 'basic' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            <span className={styles.tabIcon}>📋</span>
            Thông tin cơ bản
          </button>
          
          <button 
            type="button"
            className={`${styles.tabButton} ${activeTab === 'content' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('content')}
          >
            <span className={styles.tabIcon}>📝</span>
            Nội dung & diễn viên
          </button>
          
          <button 
            type="button"
            className={`${styles.tabButton} ${activeTab === 'episodes' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('episodes')}
          >
            <span className={styles.tabIcon}>🎬</span>
            Đường dẫn phim
          </button>
          
          <button 
            type="button"
            className={`${styles.tabButton} ${activeTab === 'links' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('links')}
          >
            <span className={styles.tabIcon}>🔗</span>
            Liên kết & ID
          </button>
        </div>

        {/* Tab Contents */}
        <div className={styles.tabContent}>
          {/* Tab Thông tin cơ bản */}
          {activeTab === 'basic' && (
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Thông tin cơ bản</h3>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Tên phim:</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="origin_name">Tên gốc:</label>
                  <input
                    type="text"
                    id="origin_name"
                    name="origin_name"
                    value={formData.origin_name || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="slug">Slug:</label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="year">Năm sản xuất:</label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={formData.year || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="type">Loại phim:</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type || 'series'}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="series">Phim bộ</option>
                    <option value="single">Phim lẻ</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="quality">Chất lượng:</label>
                  <select
                    id="quality"
                    name="quality"
                    value={formData.quality || 'HD'}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="HD">HD</option>
                    <option value="FHD">FHD</option>
                    <option value="SD">SD</option>
                    <option value="Trailer">Trailer</option>
                    <option value="CAM">CAM</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="lang">Ngôn ngữ:</label>
                  <select
                    id="lang"
                    name="lang"
                    value={formData.lang || 'Vietsub'}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="Vietsub">Vietsub</option>
                    <option value="Thuyết minh">Thuyết minh</option>
                    <option value="Lồng tiếng">Lồng tiếng</option>
                    <option value="Vietsub + Thuyết minh">Vietsub + Thuyết minh</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="status">Trạng thái:</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status || 'active'}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="active">Hiển thị</option>
                    <option value="inactive">Ẩn</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="time">Thời lượng:</label>
                  <input
                    type="text"
                    id="time"
                    name="time"
                    value={formData.time || ''}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: 45 phút/tập"
                    className={styles.input}
                  />
                </div>
                
                {formData.type === 'series' && (
                  <>
                    <div className={styles.formGroup}>
                      <label htmlFor="episode_current">Số tập hiện tại:</label>
                      <input
                        type="text"
                        id="episode_current"
                        name="episode_current"
                        value={formData.episode_current || ''}
                        onChange={handleInputChange}
                        placeholder="Ví dụ: Hoàn Tất (12/12)"
                        className={styles.input}
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="episode_total">Tổng số tập:</label>
                      <input
                        type="text"
                        id="episode_total"
                        name="episode_total"
                        value={formData.episode_total || ''}
                        onChange={handleInputChange}
                        placeholder="Ví dụ: 12 Tập"
                        className={styles.input}
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div className={styles.checkboxesSection}>
                <h4>Thuộc tính bổ sung</h4>
                <div className={styles.checkboxesGrid}>
                  <div className={styles.checkboxGroup}>
                    <input
                      type="checkbox"
                      id="is_copyright"
                      name="is_copyright"
                      checked={formData.is_copyright || false}
                      onChange={handleCheckboxChange}
                    />
                    <label htmlFor="is_copyright">Bản quyền</label>
                  </div>
                  
                  <div className={styles.checkboxGroup}>
                    <input
                      type="checkbox"
                      id="chieurap"
                      name="chieurap"
                      checked={formData.chieurap || false}
                      onChange={handleCheckboxChange}
                    />
                    <label htmlFor="chieurap">Chiếu rạp</label>
                  </div>
                  
                  <div className={styles.checkboxGroup}>
                    <input
                      type="checkbox"
                      id="sub_docquyen"
                      name="sub_docquyen"
                      checked={formData.sub_docquyen || false}
                      onChange={handleCheckboxChange}
                    />
                    <label htmlFor="sub_docquyen">Sub độc quyền</label>
                  </div>
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="showtimes">Lịch chiếu:</label>
                <input
                  type="text"
                  id="showtimes"
                  name="showtimes"
                  value={formData.showtimes || ''}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Thứ 7 hàng tuần"
                  className={styles.input}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="notify">Thông báo:</label>
                <input
                  type="text"
                  id="notify"
                  name="notify"
                  value={formData.notify || ''}
                  onChange={handleInputChange}
                  placeholder="Thông báo hiển thị trên phim"
                  className={styles.input}
                />
              </div>
            </div>
          )}
          
          {/* Tab Nội dung & diễn viên */}
          {activeTab === 'content' && (
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Nội dung phim</h3>
              
              <div className={styles.formGroup}>
                <label htmlFor="content">Nội dung phim:</label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content || ''}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  rows={8}
                  placeholder="Nhập nội dung mô tả phim..."
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="director">Đạo diễn:</label>
                <input
                  type="text"
                  id="director"
                  name="director_text"
                  value={Array.isArray(formData.director) ? formData.director.join(', ') : formData.director || ''}
                  onChange={(e) => handleArrayInputChange('director', e.target.value)}
                  placeholder="Nhập tên đạo diễn, cách nhau bởi dấu phẩy"
                  className={styles.input}
                />
                <small className={styles.inputHelp}>Nhập tên các đạo diễn, cách nhau bởi dấu phẩy.</small>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="actor">Diễn viên:</label>
                <input
                  type="text"
                  id="actor"
                  name="actor_text"
                  value={Array.isArray(formData.actor) ? formData.actor.join(', ') : formData.actor || ''}
                  onChange={(e) => handleArrayInputChange('actor', e.target.value)}
                  placeholder="Nhập tên diễn viên, cách nhau bởi dấu phẩy"
                  className={styles.input}
                />
                <small className={styles.inputHelp}>Nhập tên các diễn viên, cách nhau bởi dấu phẩy.</small>
              </div>
              
              <div className={styles.formGroup}>
                <label>Thể loại:</label>
                <input
                  type="text"
                  id="category_text"
                  name="category_text"
                  value={Array.isArray(formData.category) ? 
                    formData.category.map(cat => typeof cat === 'string' ? cat : cat.name).join(', ') : 
                    formData.category || ''}
                  onChange={(e) => handleArrayInputChange('category', e.target.value)}
                  placeholder="Nhập thể loại, cách nhau bởi dấu phẩy"
                  className={styles.input}
                />
                <small className={styles.inputHelp}>Nhập các thể loại, cách nhau bởi dấu phẩy. VD: Hành động, Phiêu lưu, Tình cảm</small>
              </div>
              
              <div className={styles.formGroup}>
                <label>Quốc gia:</label>
                <input
                  type="text"
                  id="country_text"
                  name="country_text"
                  value={Array.isArray(formData.country) ? 
                    formData.country.map(c => typeof c === 'string' ? c : c.name).join(', ') : 
                    formData.country || ''}
                  onChange={(e) => handleArrayInputChange('country', e.target.value)}
                  placeholder="Nhập quốc gia, cách nhau bởi dấu phẩy"
                  className={styles.input}
                />
                <small className={styles.inputHelp}>Nhập các quốc gia, cách nhau bởi dấu phẩy. VD: Việt Nam, Mỹ, Hàn Quốc</small>
              </div>
            </div>
          )}
          
          {/* Tab Đường dẫn phim */}
          {activeTab === 'episodes' && (
            <div className={styles.episodesList}>
              {/* Server List */}
              <div className={styles.serverListContainer}>
                <h3 className={styles.sectionTitle}>
                  <FaServer className={styles.sectionIcon} />
                  Danh sách Servers
                </h3>
                
                {/* Add new server form */}
                <div className={styles.addServerForm}>
                  <div className={styles.formGroup}>
                    <label htmlFor="serverName">Tên server mới:</label>
                    <div className={styles.inputWithButton}>
                      <input
                        type="text"
                        id="serverName"
                        value={newServerName}
                        onChange={(e) => setNewServerName(e.target.value)}
                        placeholder="Nhập tên server..."
                        className={styles.input}
                      />
                      <button 
                        className={styles.addButton}
                        onClick={handleAddServer}
                      >
                        <FaPlus /> Thêm server
                      </button>
                    </div>
                    {errorMessage && (
                      <p className={styles.errorText}>{errorMessage}</p>
                    )}
                  </div>
                </div>
                
                {/* Display servers and episodes */}
                {episodes.length === 0 ? (
                  <div className={styles.noServers}>
                    <p>Chưa có server nào. Vui lòng thêm server mới.</p>
                  </div>
                ) : (
                  episodes.map((server, serverIndex) => (
                    <div key={serverIndex} className={styles.serverBlock}>
                      <div className={styles.serverHeader}>
                        <h4 className={styles.serverTitle}>
                          <span className={styles.serverName}>{server.server_name}</span>
                          <span className={styles.episodeCount}>
                            {server.server_data.length} tập
                          </span>
                        </h4>
                        <div className={styles.serverActions}>
                          <button 
                            className={styles.addEpisodeButton}
                            onClick={() => handleAddEpisode(serverIndex)}
                          >
                            <FaPlus /> Thêm tập
                          </button>                          <button 
                            className={styles.deleteServerButton}
                            onClick={() => handleDeleteServer(serverIndex)}
                            aria-label="Xóa server"
                            title="Xóa server"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                      
                      {/* Episodes */}
                      <div className={styles.episodesContainer}>
                        {server.server_data.length === 0 ? (
                          <p className={styles.noEpisodes}>Chưa có tập phim nào.</p>
                        ) : (
                          server.server_data.map((episode, episodeIndex) => (
                            <div key={episodeIndex} className={styles.episodeItem}>
                              <div className={styles.episodeHeader}>
                                <h5 className={styles.episodeTitle}>
                                  {episode.name}
                                </h5>
                                <button 
                                  className={styles.deleteEpisodeButton}
                                  onClick={() => handleDeleteEpisode(serverIndex, episodeIndex)}
                                  aria-label="Xóa tập phim"
                                  title="Xóa tập phim"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                              
                              <div className={styles.episodeForm}>
                                <div className={styles.formGroup}>
                                  <label>Tên tập:</label>
                                  <input
                                    type="text"
                                    value={episode.name}
                                    onChange={(e) => handleEpisodeChange(serverIndex, episodeIndex, 'name', e.target.value)}
                                    placeholder="Ví dụ: Tập 1"
                                    className={styles.input}
                                  />
                                </div>
                                
                                <div className={styles.formGroup}>
                                  <label>Slug:</label>
                                  <input
                                    type="text"
                                    value={episode.slug}
                                    onChange={(e) => handleEpisodeChange(serverIndex, episodeIndex, 'slug', e.target.value)}
                                    placeholder="Ví dụ: tap-1"
                                    className={styles.input}
                                  />
                                </div>
                                
                                <div className={styles.formGroup}>
                                  <label>Link Embed:</label>
                                  <input
                                    type="text"
                                    value={episode.link_embed}
                                    onChange={(e) => handleEpisodeChange(serverIndex, episodeIndex, 'link_embed', e.target.value)}
                                    placeholder="Nhập đường dẫn embed..."
                                    className={styles.input}
                                  />
                                </div>
                                
                                <div className={styles.formGroup}>
                                  <label>Link M3U8:</label>
                                  <input
                                    type="text"
                                    value={episode.link_m3u8}
                                    onChange={(e) => handleEpisodeChange(serverIndex, episodeIndex, 'link_m3u8', e.target.value)}
                                    placeholder="Nhập đường dẫn m3u8..."
                                    className={styles.input}
                                  />                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {/* Tab Liên kết & ID */}
          {activeTab === 'links' && (
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Đường dẫn hình ảnh</h3>
              
              <div className={styles.imageLinksGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="thumb_url">Ảnh thumbnail:</label>
                  <input
                    type="text"
                    id="thumb_url"
                    name="thumb_url"
                    value={formData.thumb_url || ''}
                    onChange={handleInputChange}
                    placeholder="URL hình ảnh thumbnail"
                    className={styles.input}
                  />
                  {formData.thumb_url && (
                    <div className={styles.imagePreview}>
                      <img src={formData.thumb_url} alt="Thumbnail preview" />
                    </div>
                  )}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="poster_url">Ảnh poster:</label>
                  <input
                    type="text"
                    id="poster_url"
                    name="poster_url"
                    value={formData.poster_url || ''}
                    onChange={handleInputChange}
                    placeholder="URL hình ảnh poster"
                    className={styles.input}
                  />
                  {formData.poster_url && (
                    <div className={styles.imagePreview}>
                      <img src={formData.poster_url} alt="Poster preview" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="trailer_url">Trailer URL:</label>
                <input
                  type="text"
                  id="trailer_url"
                  name="trailer_url"
                  value={formData.trailer_url || ''}
                  onChange={handleInputChange}
                  placeholder="URL trailer (YouTube, Vimeo,...)"
                  className={styles.input}
                />
              </div>
              
              <h3 className={styles.sectionTitle}>Thông tin TMDB</h3>
              
              <div className={styles.externalInfoGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="tmdb_id">TMDB ID:</label>
                  <input
                    type="text"
                    id="tmdb_id"
                    value={formData.tmdb?.id || ''}
                    onChange={(e) => handleTmdbChange('id', e.target.value)}
                    placeholder="ID phim trên TMDB"
                    className={styles.input}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="tmdb_type">TMDB Type:</label>
                  <select
                    id="tmdb_type"
                    value={formData.tmdb?.type || ''}
                    onChange={(e) => handleTmdbChange('type', e.target.value)}
                    className={styles.select}
                  >
                    <option value="">-- Chọn loại --</option>
                    <option value="movie">movie</option>
                    <option value="tv">tv</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="tmdb_season">TMDB Season:</label>
                  <input
                    type="number"
                    id="tmdb_season"
                    value={formData.tmdb?.season || ''}
                    onChange={(e) => handleTmdbChange('season', Number(e.target.value))}
                    placeholder="Season (nếu là phim bộ)"
                    className={styles.input}
                  />
                </div>
              </div>
              
              <h3 className={styles.sectionTitle}>Thông tin IMDB</h3>
              
              <div className={styles.formGroup}>
                <label htmlFor="imdb_id">IMDB ID:</label>
                <input
                  type="text"
                  id="imdb_id"
                  value={formData.imdb?.id || ''}
                  onChange={(e) => handleImdbChange('id', e.target.value)}
                  placeholder="ID phim trên IMDB (ví dụ: tt0111161)"
                  className={styles.input}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Save button at bottom */}
        <div className={styles.bottomActions}>
          <button 
            className={styles.saveButtonLarge} 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : (
              <>
                <FaSave /> Lưu đường dẫn phim
              </>
            )}
          </button>
        </div>
      </form>
    
      {/* Back to Top Button with enhanced animation */}
      {showBackToTop && (
        <button
          className={styles.backToTopButton}
          onClick={scrollToTop}
          aria-label="Cuộn lên đầu trang"
          title="Cuộn lên đầu trang"
        >
          <FaArrowUp />
        </button>
      )}

      <style jsx>{`
        /* Responsive container */
        .container {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        /* Server and episode styling */
        .serverBlock {
          margin-bottom: 30px;
          border-radius: 8px;
          background-color: #f8f9fa;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          border: 1px solid #e9ecef;
        }
        
        .serverHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background-color: #e9ecef;
        }
        
        .serverTitle {
          margin: 0;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .serverName {
          font-weight: 600;
          color: #212529;
        }

        .episodeCount {
          margin-left: 8px;
          font-size: 0.85rem;
          color: #6c757d;
          font-weight: 400;
          background-color: #dee2e6;
          padding: 3px 8px;
          border-radius: 12px;
        }

        .serverActions {
          display: flex;
          gap: 10px;
        }

        .episodesContainer {
          padding: 20px;
        }

        .episodeItem {
          margin-bottom: 20px;
          padding: 16px;
          border-radius: 8px;
          background-color: #ffffff;
          border: 1px solid #dee2e6;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .episodeHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e9ecef;
        }

        .episodeTitle {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #212529;
        }

        .episodeForm {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
        }

        .noEpisodes {
          padding: 32px;
          text-align: center;
          background-color: #f8f9fa;
          border-radius: 8px;
          font-style: italic;
        }

        .addServerForm {
          background-color: #ffffff;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          border: 1px solid #e9ecef;
        }

        .inputWithButton {
          display: flex;
          gap: 12px;
        }

        .inputWithButton .input {
          flex: 1;
        }

        .addButton, 
        .deleteServerButton, 
        .addEpisodeButton, 
        .deleteEpisodeButton {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .addButton, 
        .addEpisodeButton {
          background-color: #007bff;
          color: white;
        }

        .addButton:hover, 
        .addEpisodeButton:hover {
          background-color: #0069d9;
        }

        .deleteServerButton, 
        .deleteEpisodeButton {
          background-color: #dc3545;
          color: white;
        }

        .deleteServerButton:hover, 
        .deleteEpisodeButton:hover {
          background-color: #c82333;
        }

        /* Success/Error Message */
        .messageContainer {
          padding: 12px 16px;
          margin-bottom: 20px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .successMessage {
          background-color: #d1e7dd;
          color: #0f5132;
          border: 1px solid #badbcc;
        }

        .errorMessage {
          background-color: #f8d7da;
          color: #842029;
          border: 1px solid #f5c2c7;
        }

        .messageIcon {
          font-size: 1.2rem;
        }

        .messageText {
          flex: 1;
        }

        /* Loading and error states */
        .loadingContainer, .errorContainer {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
        }

        .loadingSpinner {
          font-size: 1.2rem;
          color: #007bff;
          margin-bottom: 16px;
        }

        .errorIcon {
          font-size: 3rem;
          color: #dc3545;
          margin-bottom: 16px;
        }

        .bottomActions {
          display: flex;
          justify-content: flex-end;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #dee2e6;
        }

        /* Nút cuộn lên đầu trang */
        .backToTop {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: background-color 0.3s;
        }

        .backToTop:hover {
          background-color: #0056b3;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .formGrid,
          .imageLinksGrid,
          .externalInfoGrid,
          .episodeForm {
            grid-template-columns: 1fr;
          }

          .header {
            flex-direction: column;
            gap: 16px;
          }

          .headerTitle {
            text-align: center;
          }

          .movieBasicInfo {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .thumbnailPreview {
            margin-right: 0;
            margin-bottom: 16px;
          }

          .tabsContainer {
            justify-content: flex-start;
            overflow-x: auto;
          }

          .tabButton {
            padding: 12px 16px;
          }
        }
      `}</style>
    </>
  );
};

MovieEditPage.getLayout = (page: React.ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
};

export default MovieEditPage;