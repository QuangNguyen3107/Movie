// src/pages/admin/movies/add.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaPlus, FaTimes, FaUpload, FaSave, FaImage } from 'react-icons/fa';
import { useRouter } from 'next/router';
import axios from '@/API/config/axiosConfig';
import { toast } from 'react-toastify';
import Link from 'next/link';
import AdminLayout from '@/components/Layout/AdminLayout';
import Image from 'next/image';

// Interface cho danh mục phim
interface Category {
  id: string;
  name: string;
  slug: string;
}

// Interface cho server_data
interface Episode {
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
}

// Interface cho episodes
interface Server {
  server_name: string;
  server_data: Episode[];
}

const AddMovie = () => {
  const router = useRouter();
  const [movie, setMovie] = useState({
    name: '',
    origin_name: '',
    slug: '',
    year: new Date().getFullYear(),
    thumb_url: '',
    poster_url: '',
    backdrop_url: '',
    trailer_url: '',
    category: [] as string[],
    type: 'movie', // Phù hợp với backend
    status: 'completed', // Phù hợp với backend
    quality: 'HD',
    lang: 'Vietsub',
    director: [] as string[],
    actor: [] as string[],
    content: '',
    time: '60 phút/tập',
    episode_current: 'Hoàn Tất (1/1)',
    episode_total: '1 Tập',
    is_copyright: false,
    chieurap: false,
    sub_docquyen: false,
    notify: '',
    showtimes: '',
    country: [] as string[],
    episodes: [
      {
        server_name: "Vietsub #1",
        server_data: [
          {
            name: "Tập 1",
            slug: "tap-1",
            filename: "tap-1",
            link_embed: "",
            link_m3u8: ""
          }
        ]
      }
    ],
    // TMDB fields
    tmdb: {
      type: '',
      id: '',
      season: 1,
      vote_average: 0,
      vote_count: 0
    },
    // IMDB field
    imdb: {
      id: ''
    }
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [newCategory, setNewCategory] = useState('');  // State cho input thể loại mới
  const [countries, setCountries] = useState([
    { id: 'vi', name: 'Việt Nam' },
    { id: 'us', name: 'Mỹ' },
    { id: 'kr', name: 'Hàn Quốc' },
    { id: 'cn', name: 'Trung Quốc' },
    { id: 'jp', name: 'Nhật Bản' },
    { id: 'hk', name: 'Hồng Kông' },
    { id: 'tw', name: 'Đài Loan' },
    { id: 'th', name: 'Thái Lan' },
    { id: 'in', name: 'Ấn Độ' },
    { id: 'ph', name: 'Philippines' },
    { id: 'id', name: 'Indonesia' },
    { id: 'uk', name: 'Anh' },
    { id: 'fr', name: 'Pháp' },
    { id: 'de', name: 'Đức' },
    { id: 'it', name: 'Ý' },
    { id: 'es', name: 'Tây Ban Nha' },
    { id: 'ca', name: 'Canada' },
    { id: 'au', name: 'Úc' },
    { id: 'ru', name: 'Nga' },
    { id: 'br', name: 'Brazil' },
    { id: 'mx', name: 'Mexico' },
    { id: 'se', name: 'Thụy Điển' },
    { id: 'no', name: 'Na Uy' },
    { id: 'other', name: 'Khác' }
  ]);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [backDropFile, setBackDropFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Thêm hàm xử lý nhập mảng (categories và countries) ngăn cách bởi dấu phẩy
  const handleArrayTextInput = (field: string, value: string) => {
    // Chuyển đổi chuỗi thành mảng bằng cách tách theo dấu phẩy
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
    setMovie(prev => ({
      ...prev,
      [field]: arrayValue
    }));
    
    // Xóa lỗi nếu đã nhập dữ liệu
    if (arrayValue.length > 0 && validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Hàm định dạng mảng thành chuỗi
  const getArrayAsString = (array: any[] | string) => {
    if (Array.isArray(array)) {
      return array.join(', ');
    } 
    return array || '';
  };

  // Lấy danh sách danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/categories');
        if (response.data && response.data.data) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Không thể tải danh sách thể loại phim');
      }
    };

    fetchCategories();
  }, []);

  // Xử lý tạo slug tự động từ tên phim
  const generateSlug = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    return slug;
  };

  // Xử lý thay đổi tên phim và tạo slug tự động
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setMovie(prev => ({ 
      ...prev, 
      name: name,
      slug: generateSlug(name)
    }));
    // Xóa lỗi nếu trường đã được điền
    if (name) {
      setValidationErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  // Xử lý thay đổi giá trị form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMovie(prev => ({ ...prev, [name]: value }));
    
    // Xóa lỗi nếu trường đã được điền
    if (value && validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Xử lý upload hình ảnh thumb
  const handleThumbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Tạo preview cho hình ảnh đã chọn
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Lưu file để upload sau
    setThumbFile(file);
  };

  // Xử lý upload hình ảnh poster
  const handlePosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterFile(file);
  };

  // Xử lý upload hình ảnh backdrop
  const handleBackdropUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackDropFile(file);
  };

  // Hàm upload các file ảnh
  const uploadImages = async () => {
    const uploadedUrls: Record<string, string> = {};
    
    // Upload thumb_url
    if (thumbFile) {
      const formData = new FormData();
      formData.append('image', thumbFile);
      try {
        const response = await axios.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data && response.data.url) {
          uploadedUrls.thumb_url = response.data.url;
        }
      } catch (error) {
        console.error('Error uploading thumb image:', error);
        throw new Error('Không thể tải hình thumbnail lên server');
      }
    }
    
    // Upload poster_url
    if (posterFile) {
      const formData = new FormData();
      formData.append('image', posterFile);
      try {
        const response = await axios.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data && response.data.url) {
          uploadedUrls.poster_url = response.data.url;
        }
      } catch (error) {
        console.error('Error uploading poster image:', error);
        throw new Error('Không thể tải hình poster lên server');
      }
    }
    
    // Upload backdrop_url
    if (backDropFile) {
      const formData = new FormData();
      formData.append('image', backDropFile);
      try {
        const response = await axios.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data && response.data.url) {
          uploadedUrls.backdrop_url = response.data.url;
        }
      } catch (error) {
        console.error('Error uploading backdrop image:', error);
        throw new Error('Không thể tải hình backdrop lên server');
      }
    }
    
    return uploadedUrls;
  };

  // Kiểm tra tính hợp lệ của form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Danh sách trường bắt buộc theo controller backend
    const requiredFields = [
      { field: 'name', label: 'Tên phim' },
      { field: 'origin_name', label: 'Tên gốc' },
      { field: 'slug', label: 'Slug URL' },
      { field: 'content', label: 'Nội dung phim' },
      { field: 'year', label: 'Năm sản xuất' }
    ];
    
    // Kiểm tra các trường bắt buộc
    requiredFields.forEach(({ field, label }) => {
      if (!movie[field as keyof typeof movie]) {
        errors[field] = `${label} là trường bắt buộc`;
      }
    });
    
    // Kiểm tra thể loại
    if (!movie.category.length) {
      errors.category = 'Vui lòng chọn ít nhất một thể loại';
    }
    
    // Kiểm tra quốc gia
    if (!movie.country.length) {
      errors.country = 'Vui lòng chọn ít nhất một quốc gia';
    }
    
    // Kiểm tra năm sản xuất
    const year = parseInt(String(movie.year));
    if (isNaN(year) || year < 1900 || year > 2100) {
      errors.year = 'Năm sản xuất không hợp lệ (1900-2100)';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra tính hợp lệ của form
    if (!validateForm()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setLoading(true);
      
      // Upload các file ảnh
      const uploadedUrls = await uploadImages();
      
      // Chuẩn bị dữ liệu gửi đi
      const directorValue = typeof movie.director === 'string' 
        ? movie.director.split(',').map(item => item.trim())
        : Array.isArray(movie.director) && movie.director.length > 0 
          ? movie.director 
          : [];
        
      const actorValue = typeof movie.actor === 'string'
        ? movie.actor.split(',').map(item => item.trim())
        : Array.isArray(movie.actor) && movie.actor.length > 0 
          ? movie.actor 
          : [];
      
      // Định dạng category cho đúng với schema - mỗi phần tử phải là object có id, name và slug
      const categoryValue = Array.isArray(movie.category) 
        ? movie.category.map(categoryId => {
            // Tìm thông tin category từ danh sách có sẵn
            const categoryInfo = categories.find(c => c.id === categoryId);
            if (categoryInfo) {
              return {
                id: categoryInfo.id,
                name: categoryInfo.name,
                slug: categoryInfo.slug
              };
            }
            // Fallback nếu không tìm thấy
            return {
              id: categoryId,
              name: categoryId,
              slug: generateSlug(categoryId)
            };
          })
        : [];
      
      // Định dạng country cho đúng với schema - mỗi phần tử phải là object có id, name và slug
      const countryValue = Array.isArray(movie.country) 
        ? movie.country.map(countryId => {
            // Tìm thông tin country từ danh sách có sẵn
            const countryInfo = countries.find(c => c.id === countryId);
            if (countryInfo) {
              return {
                id: countryInfo.id,
                name: countryInfo.name,
                slug: generateSlug(countryInfo.name)
              };
            }
            // Fallback nếu không tìm thấy
            return {
              id: countryId,
              name: countryId,
              slug: generateSlug(countryId)
            };
          })
        : [];
      
      // Đảm bảo các trường dữ liệu đúng định dạng
      const formattedMovie = {
        ...movie,
        director: directorValue,
        actor: actorValue,
        year: Number(movie.year),
        category: categoryValue, // Sử dụng category đã định dạng đúng
        country: countryValue, // Sử dụng country đã định dạng đúng
        thumb_url: uploadedUrls.thumb_url || movie.thumb_url,
        poster_url: uploadedUrls.poster_url || movie.poster_url,
        backdrop_url: uploadedUrls.backdrop_url || movie.backdrop_url
      };

      // Ghi log dữ liệu gửi đi để debug
      console.log('Sending movie data:', formattedMovie);

      // Gửi request đến API backend
      const response = await axios.post('/movies', formattedMovie);
      
      if (response.data) {
        toast.success('Thêm phim mới thành công');
        console.log('Movie added successfully:', response.data);
        router.push('/admin/movies');
      }
    } catch (error: any) {
      console.error('Error adding movie:', error);
      
      // Hiển thị thông báo lỗi chi tiết hơn
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        
        if (error.response.data && error.response.data.message) {
          toast.error(`Lỗi: ${error.response.data.message}`);
        } else if (error.response.data && error.response.data.error) {
          toast.error(`Lỗi: ${error.response.data.error}`);
        } else {
          toast.error(`Lỗi ${error.response.status}: Không thể thêm phim mới`);
        }
      } else if (error.request) {
        // Yêu cầu đã được gửi nhưng không nhận được phản hồi
        console.error('Error request:', error.request);
        toast.error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        // Có lỗi khi thiết lập request
        toast.error(`Lỗi: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thêm thể loại mới
  const handleAddCustomCategory = () => {
    if (!newCategory.trim()) {
      toast.error('Vui lòng nhập tên thể loại');
      return;
    }
    
    // Tạo ID tạm thời cho thể loại mới
    const tempId = `custom-${Date.now()}`;
    
    // Thêm vào danh sách category đã chọn
    setMovie(prev => ({
      ...prev,
      category: [...prev.category, tempId]
    }));
    
    // Thêm vào danh sách categories để hiển thị trong UI
    setCategories(prev => [
      ...prev,
      { id: tempId, name: newCategory.trim(), slug: generateSlug(newCategory) }
    ]);
    
    // Reset input
    setNewCategory('');
    toast.success(`Đã thêm thể loại "${newCategory.trim()}"`);
    
    // Xóa lỗi thể loại nếu có
    if (validationErrors.category) {
      setValidationErrors(prev => ({ ...prev, category: undefined }));
    }
  };

  // Xử lý thêm server mới
  const handleAddServer = () => {
    setMovie(prev => ({
      ...prev,
      episodes: [
        ...prev.episodes,
        {
          server_name: `Server #${prev.episodes.length + 1}`,
          server_data: [
            {
              name: "Tập 1",
              slug: "tap-1",
              filename: "tap-1",
              link_embed: "",
              link_m3u8: ""
            }
          ]
        }
      ]
    }));
  };

  // Xử lý xóa server
  const handleRemoveServer = (serverIndex: number) => {
    setMovie(prev => ({
      ...prev,
      episodes: prev.episodes.filter((_, index) => index !== serverIndex)
    }));
  };

  // Xử lý thay đổi tên server
  const handleServerNameChange = (serverIndex: number, newName: string) => {
    const updatedEpisodes = [...movie.episodes];
    updatedEpisodes[serverIndex].server_name = newName;
    
    setMovie(prev => ({
      ...prev,
      episodes: updatedEpisodes
    }));
  };

  // Xử lý thêm tập mới vào server
  const handleAddEpisode = (serverIndex: number) => {
    const updatedEpisodes = [...movie.episodes];
    const episodeCount = updatedEpisodes[serverIndex].server_data.length + 1;
    
    updatedEpisodes[serverIndex].server_data.push({
      name: `Tập ${episodeCount}`,
      slug: `tap-${episodeCount}`,
      filename: `tap-${episodeCount}`,
      link_embed: "",
      link_m3u8: ""
    });
    
    setMovie(prev => ({
      ...prev,
      episodes: updatedEpisodes
    }));
  };

  // Xử lý xóa tập khỏi server
  const handleRemoveEpisode = (serverIndex: number, episodeIndex: number) => {
    const updatedEpisodes = [...movie.episodes];
    updatedEpisodes[serverIndex].server_data = updatedEpisodes[serverIndex].server_data.filter(
      (_, index) => index !== episodeIndex
    );
    
    setMovie(prev => ({
      ...prev,
      episodes: updatedEpisodes
    }));
  };

  // Xử lý cập nhật thông tin tập phim
  const handleUpdateEpisode = (serverIndex: number, episodeIndex: number, field: keyof Episode, value: string) => {
    const updatedEpisodes = [...movie.episodes];
    updatedEpisodes[serverIndex].server_data[episodeIndex][field] = value;
    
    setMovie(prev => ({
      ...prev,
      episodes: updatedEpisodes
    }));
  };

  return (
    <AdminLayout>
      <div className="wrapper">
        {/* Content Header */}
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="m-0">Thêm Phim Mới</h1>
              </div>
              <div className="col-sm-6">
                <ol className="breadcrumb float-sm-right">
                  <li className="breadcrumb-item"><Link href="/admin">Dashboard</Link></li>
                  <li className="breadcrumb-item"><Link href="/admin/movies">Quản lý phim</Link></li>
                  <li className="breadcrumb-item active">Thêm phim mới</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Main content */}
        <section className="content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-12">
                <div className="card card-primary card-outline">
                  <div className="card-header">
                    <h3 className="card-title">
                      <i className="fas fa-film mr-1"></i>
                      Thông tin phim
                    </h3>
                  </div>
                  <form onSubmit={handleSubmit}>
                    <div className="card-body">
                      <div className="row">
                        {/* Cột trái */}
                        <div className="col-md-8">
                          <div className="card card-primary">
                            <div className="card-header">
                              <h3 className="card-title">Thông tin cơ bản</h3>
                            </div>
                            <div className="card-body">
                              <div className="form-group">
                                <label htmlFor="name">Tên phim (Tiếng Việt) <span className="text-danger">*</span></label>
                                <input
                                  type="text"
                                  id="name"
                                  name="name"
                                  value={movie.name}
                                  onChange={handleNameChange}
                                  className={`form-control ${validationErrors.name ? 'is-invalid' : ''}`}
                                  placeholder="Nhập tên phim"
                                  required
                                />
                                {validationErrors.name && <div className="invalid-feedback">{validationErrors.name}</div>}
                              </div>

                              <div className="form-group">
                                <label htmlFor="origin_name">Tên gốc <span className="text-danger">*</span></label>
                                <input
                                  type="text"
                                  id="origin_name"
                                  name="origin_name"
                                  value={movie.origin_name}
                                  onChange={handleChange}
                                  className={`form-control ${validationErrors.origin_name ? 'is-invalid' : ''}`}
                                  placeholder="Nhập tên gốc của phim"
                                  required
                                />
                                {validationErrors.origin_name && <div className="invalid-feedback">{validationErrors.origin_name}</div>}
                              </div>

                              <div className="row">
                                <div className="col-md-6">
                                  <div className="form-group">
                                    <label htmlFor="slug">Slug URL <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                      <input
                                        type="text"
                                        id="slug"
                                        name="slug"
                                        value={movie.slug}
                                        onChange={handleChange}
                                        className={`form-control ${validationErrors.slug ? 'is-invalid' : ''}`}
                                        placeholder="Slug sẽ được tạo tự động từ tên phim"
                                        required
                                      />
                                      <div className="input-group-append">
                                        <button 
                                          type="button"
                                          className="btn btn-info"
                                          onClick={() => setMovie(prev => ({ ...prev, slug: generateSlug(movie.name) }))}
                                        >
                                          Tạo lại
                                        </button>
                                      </div>
                                    </div>
                                    {validationErrors.slug && <div className="invalid-feedback d-block">{validationErrors.slug}</div>}
                                    <small className="form-text text-muted">Slug được tạo tự động từ tên phim, bạn có thể chỉnh sửa nếu cần</small>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-group">
                                    <label htmlFor="year">Năm sản xuất <span className="text-danger">*</span></label>
                                    <input
                                      type="number"
                                      id="year"
                                      name="year"
                                      min="1900"
                                      max={new Date().getFullYear() + 10}
                                      value={movie.year}
                                      onChange={handleChange}
                                      className={`form-control ${validationErrors.year ? 'is-invalid' : ''}`}
                                      required
                                    />
                                    {validationErrors.year && <div className="invalid-feedback">{validationErrors.year}</div>}
                                  </div>
                                </div>
                              </div>

                              <div className="row">
                                <div className="col-md-4">
                                  <div className="form-group">
                                    <label htmlFor="type">Loại phim <span className="text-danger">*</span></label>
                                    <select
                                      id="type"
                                      name="type"
                                      value={movie.type}
                                      onChange={handleChange}
                                      className={`form-control ${validationErrors.type ? 'is-invalid' : ''}`}
                                      required
                                    >
                                      <option value="movie">Phim lẻ</option>
                                      <option value="series">Phim bộ</option>
                                      <option value="tv">TV Shows</option>
                                    </select>
                                    {validationErrors.type && <div className="invalid-feedback">{validationErrors.type}</div>}
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="form-group">
                                    <label htmlFor="quality">Chất lượng <span className="text-danger">*</span></label>
                                    <select
                                      id="quality"
                                      name="quality"
                                      value={movie.quality}
                                      onChange={handleChange}
                                      className={`form-control ${validationErrors.quality ? 'is-invalid' : ''}`}
                                      required
                                    >
                                      <option value="HD">HD</option>
                                      <option value="FHD">FHD</option>
                                      <option value="SD">SD</option>
                                    </select>
                                    {validationErrors.quality && <div className="invalid-feedback">{validationErrors.quality}</div>}
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="form-group">
                                    <label htmlFor="lang">Ngôn ngữ <span className="text-danger">*</span></label>
                                    <select
                                      id="lang"
                                      name="lang"
                                      value={movie.lang}
                                      onChange={handleChange}
                                      className={`form-control ${validationErrors.lang ? 'is-invalid' : ''}`}
                                      required
                                    >
                                      <option value="Vietsub">Vietsub</option>
                                      <option value="Thuyết minh">Thuyết minh</option>
                                    </select>
                                    {validationErrors.lang && <div className="invalid-feedback">{validationErrors.lang}</div>}
                                  </div>
                                </div>
                              </div>

                              <div className="form-group">
                                <label htmlFor="content">Nội dung phim <span className="text-danger">*</span></label>
                                <textarea
                                  id="content"
                                  name="content"
                                  value={movie.content}
                                  onChange={handleChange}
                                  className={`form-control ${validationErrors.content ? 'is-invalid' : ''}`}
                                  placeholder="Nhập nội dung, cốt truyện của phim"
                                  rows={5}
                                  required
                                />
                                {validationErrors.content && <div className="invalid-feedback">{validationErrors.content}</div>}
                              </div>
                            </div>
                          </div>

                          <div className="card card-info">
                            <div className="card-header">
                              <h3 className="card-title">Thông tin tập phim</h3>
                              <div className="card-tools">
                                <button type="button" className="btn btn-tool" data-card-widget="collapse">
                                  <i className="fas fa-minus"></i>
                                </button>
                              </div>
                            </div>
                            <div className="card-body">
                              <div className="row">
                                <div className="col-md-4">
                                  <div className="form-group">
                                    <label htmlFor="time">Thời lượng</label>
                                    <input
                                      type="text"
                                      id="time"
                                      name="time"
                                      value={movie.time}
                                      onChange={handleChange}
                                      className="form-control"
                                      placeholder="VD: 60 phút/tập, 120 phút"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="form-group">
                                    <label htmlFor="episode_current">Trạng thái tập hiện tại</label>
                                    <input
                                      type="text"
                                      id="episode_current"
                                      name="episode_current"
                                      value={movie.episode_current}
                                      onChange={handleChange}
                                      className="form-control"
                                      placeholder="VD: Hoàn Tất (12/12)"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="form-group">
                                    <label htmlFor="episode_total">Tổng số tập</label>
                                    <input
                                      type="text"
                                      id="episode_total"
                                      name="episode_total"
                                      value={movie.episode_total}
                                      onChange={handleChange}
                                      className="form-control"
                                      placeholder="VD: 12 Tập"
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <div className="row">
                                <div className="col-md-6">
                                  <div className="form-group">
                                    <label htmlFor="status">Tình trạng <span className="text-danger">*</span></label>
                                    <select
                                      id="status"
                                      name="status"
                                      value={movie.status}
                                      onChange={handleChange}
                                      className={`form-control ${validationErrors.status ? 'is-invalid' : ''}`}
                                      required
                                    >
                                      <option value="completed">Hoàn thành</option>
                                      <option value="updating">Đang cập nhật</option>
                                    </select>
                                    {validationErrors.status && <div className="invalid-feedback">{validationErrors.status}</div>}
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-group">
                                    <label htmlFor="showtimes">Lịch chiếu</label>
                                    <input
                                      type="text"
                                      id="showtimes"
                                      name="showtimes"
                                      value={movie.showtimes}
                                      onChange={handleChange}
                                      className="form-control"
                                      placeholder="VD: Thứ 2, 3, 4 hàng tuần"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="card card-success">
                            <div className="card-header">
                              <h3 className="card-title">Quản lý tập phim</h3>
                              <div className="card-tools">
                                <button type="button" className="btn btn-tool" data-card-widget="collapse">
                                  <i className="fas fa-minus"></i>
                                </button>
                              </div>
                            </div>
                            <div className="card-body p-0">
                              <div className="p-3">
                                {movie.episodes.map((server, serverIndex) => (
                                  <div key={serverIndex} className="card card-outline card-info mb-3">
                                    <div className="card-header">
                                      <div className="card-title w-75">
                                        <div className="input-group">
                                          <div className="input-group-prepend">
                                            <span className="input-group-text">Server:</span>
                                          </div>
                                          <input
                                            type="text"
                                            value={server.server_name}
                                            onChange={(e) => handleServerNameChange(serverIndex, e.target.value)}
                                            className="form-control"
                                            placeholder="VD: Vietsub #1, Thuyết minh, v.v..."
                                          />
                                        </div>
                                      </div>
                                      <div className="card-tools">
                                        <button
                                          type="button"
                                          className="btn btn-danger btn-sm"
                                          onClick={() => handleRemoveServer(serverIndex)}
                                          disabled={movie.episodes.length === 1}
                                        >
                                          <i className="fas fa-trash mr-1"></i>
                                          Xóa server
                                        </button>
                                      </div>
                                    </div>
                                    <div className="card-body p-0">
                                      <div className="table-responsive">
                                        <table className="table table-striped mb-0">
                                          <thead>
                                            <tr>
                                              <th style={{width: '30px'}}>#</th>
                                              <th>Tên tập</th>
                                              <th>Slug</th>
                                              <th>Link nhúng</th>
                                              <th style={{width: '80px'}}>Thao tác</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {server.server_data.map((episode, episodeIndex) => (
                                              <tr key={episodeIndex}>
                                                <td>{episodeIndex + 1}</td>
                                                <td>
                                                  <input
                                                    type="text"
                                                    value={episode.name}
                                                    onChange={(e) => handleUpdateEpisode(serverIndex, episodeIndex, 'name', e.target.value)}
                                                    className="form-control form-control-sm"
                                                    placeholder="Tên tập"
                                                  />
                                                </td>
                                                <td>
                                                  <input
                                                    type="text"
                                                    value={episode.slug}
                                                    onChange={(e) => handleUpdateEpisode(serverIndex, episodeIndex, 'slug', e.target.value)}
                                                    className="form-control form-control-sm"
                                                    placeholder="Slug tập"
                                                  />
                                                </td>
                                                <td>
                                                  <input
                                                    type="text"
                                                    value={episode.link_embed}
                                                    onChange={(e) => handleUpdateEpisode(serverIndex, episodeIndex, 'link_embed', e.target.value)}
                                                    className="form-control form-control-sm"
                                                    placeholder="Link nhúng"
                                                  />
                                                  <input
                                                    type="text"
                                                    value={episode.link_m3u8}
                                                    onChange={(e) => handleUpdateEpisode(serverIndex, episodeIndex, 'link_m3u8', e.target.value)}
                                                    className="form-control form-control-sm mt-1"
                                                    placeholder="Link m3u8 (nếu có)"
                                                  />
                                                </td>
                                                <td>
                                                  <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleRemoveEpisode(serverIndex, episodeIndex)}
                                                    disabled={server.server_data.length === 1}
                                                  >
                                                    <i className="fas fa-trash"></i>
                                                  </button>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                      <div className="card-footer">
                                        <button
                                          type="button"
                                          className="btn btn-info btn-sm"
                                          onClick={() => handleAddEpisode(serverIndex)}
                                        >
                                          <i className="fas fa-plus mr-1"></i>
                                          Thêm tập mới
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  className="btn btn-success"
                                  onClick={handleAddServer}
                                >
                                  <i className="fas fa-plus mr-1"></i>
                                  Thêm server mới
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cột phải */}
                        <div className="col-md-4">
                          <div className="card card-secondary">
                            <div className="card-header">
                              <h3 className="card-title">Hình ảnh & Media</h3>
                            </div>
                            <div className="card-body">
                              <div className="form-group">
                                <label>Thumbnail <span className="text-danger">*</span></label>
                                <div className="input-group mb-3">
                                  <div className="custom-file">
                                    <input
                                      type="file"
                                      className="custom-file-input"
                                      id="thumbImage"
                                      accept="image/*"
                                      onChange={handleThumbUpload}
                                    />
                                    <label className="custom-file-label" htmlFor="thumbImage">
                                      {thumbFile ? thumbFile.name : 'Chọn hình ảnh thumbnail'}
                                    </label>
                                  </div>
                                </div>
                                {preview && (
                                  <div className="mt-2 text-center">
                                    <img 
                                      src={preview} 
                                      alt="Preview" 
                                      className="img-thumbnail" 
                                      style={{ maxHeight: '200px' }} 
                                    />
                                  </div>
                                )}
                                {!preview && movie.thumb_url && (
                                  <div className="mt-2 text-center">
                                    <img 
                                      src={movie.thumb_url} 
                                      alt="Current Thumbnail" 
                                      className="img-thumbnail" 
                                      style={{ maxHeight: '200px' }} 
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="form-group">
                                <label>Poster</label>
                                <div className="input-group mb-3">
                                  <div className="custom-file">
                                    <input
                                      type="file"
                                      className="custom-file-input"
                                      id="posterImage"
                                      accept="image/*"
                                      onChange={handlePosterUpload}
                                    />
                                    <label className="custom-file-label" htmlFor="posterImage">
                                      {posterFile ? posterFile.name : 'Chọn hình ảnh poster'}
                                    </label>
                                  </div>
                                </div>

                                <label htmlFor="poster_url">hoặc URL Poster</label>
                                <input
                                  type="url"
                                  id="poster_url"
                                  name="poster_url"
                                  value={movie.poster_url}
                                  onChange={handleChange}
                                  className="form-control"
                                  placeholder="Nhập URL hình poster phim"
                                />
                              </div>

                              <div className="form-group">
                                <label>Backdrop</label>
                                <div className="input-group mb-3">
                                  <div className="custom-file">
                                    <input
                                      type="file"
                                      className="custom-file-input"
                                      id="backdropImage"
                                      accept="image/*"
                                      onChange={handleBackdropUpload}
                                    />
                                    <label className="custom-file-label" htmlFor="backdropImage">
                                      {backDropFile ? backDropFile.name : 'Chọn hình ảnh backdrop'}
                                    </label>
                                  </div>
                                </div>

                                <label htmlFor="backdrop_url">hoặc URL Backdrop</label>
                                <input
                                  type="url"
                                  id="backdrop_url"
                                  name="backdrop_url"
                                  value={movie.backdrop_url}
                                  onChange={handleChange}
                                  className="form-control"
                                  placeholder="Nhập URL hình backdrop phim"
                                />
                              </div>

                              <div className="form-group">
                                <label htmlFor="trailer_url">URL Trailer</label>
                                <input
                                  type="url"
                                  id="trailer_url"
                                  name="trailer_url"
                                  value={movie.trailer_url}
                                  onChange={handleChange}
                                  className="form-control"
                                  placeholder="Nhập URL video trailer (YouTube)"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="card card-warning">
                            <div className="card-header">
                              <h3 className="card-title">Thể loại & Phân loại</h3>
                            </div>
                            <div className="card-body">
                              <div className="form-group">
                                <label>Thể loại <span className="text-danger">*</span></label>
                                <textarea
                                  id="category"
                                  name="category"
                                  value={getArrayAsString(movie.category)}
                                  onChange={(e) => handleArrayTextInput('category', e.target.value)}
                                  className={`form-control ${validationErrors.category ? 'is-invalid' : ''}`}
                                  placeholder="Nhập các thể loại, phân cách bằng dấu phẩy"
                                  rows={3}
                                  required
                                />
                                {validationErrors.category && <div className="text-danger">{validationErrors.category}</div>}
                              </div>

                              <div className="form-group mt-4">
                                <label>Quốc gia <span className="text-danger">*</span></label>
                                <textarea
                                  id="country"
                                  name="country"
                                  value={getArrayAsString(movie.country)}
                                  onChange={(e) => handleArrayTextInput('country', e.target.value)}
                                  className={`form-control ${validationErrors.country ? 'is-invalid' : ''}`}
                                  placeholder="Nhập các quốc gia, phân cách bằng dấu phẩy"
                                  rows={3}
                                  required
                                />
                                {validationErrors.country && <div className="text-danger">{validationErrors.country}</div>}
                              </div>
                            </div>
                          </div>

                          <div className="card card-secondary">
                            <div className="card-header">
                              <h3 className="card-title">Diễn viên & Đạo diễn</h3>
                            </div>
                            <div className="card-body">
                              <div className="form-group">
                                <label htmlFor="director">Đạo diễn</label>
                                <input
                                  type="text"
                                  id="director"
                                  name="director"
                                  value={movie.director}
                                  onChange={handleChange}
                                  className="form-control"
                                  placeholder="Nhập tên đạo diễn, phân cách bằng dấu phẩy"
                                />
                                <small className="form-text text-muted">Phân cách bằng dấu phẩy, ví dụ: James Cameron, Christopher Nolan</small>
                              </div>

                              <div className="form-group">
                                <label htmlFor="actor">Diễn viên</label>
                                <textarea
                                  id="actor"
                                  name="actor"
                                  value={movie.actor}
                                  onChange={handleChange}
                                  className="form-control"
                                  placeholder="Nhập tên diễn viên, phân cách bằng dấu phẩy"
                                  rows={3}
                                />
                                <small className="form-text text-muted">Phân cách bằng dấu phẩy, ví dụ: Tom Hanks, Leonardo DiCaprio</small>
                              </div>
                            </div>
                          </div>

                          <div className="card card-danger">
                            <div className="card-header">
                              <h3 className="card-title">Tùy chọn bổ sung</h3>
                            </div>
                            <div className="card-body">
                              <div className="custom-control custom-switch mb-3">
                                <input 
                                  type="checkbox" 
                                  className="custom-control-input" 
                                  id="is_copyright"
                                  checked={movie.is_copyright}
                                  onChange={(e) => setMovie({ ...movie, is_copyright: e.target.checked })}
                                />
                                <label className="custom-control-label" htmlFor="is_copyright">Có bản quyền</label>
                              </div>
                              
                              <div className="custom-control custom-switch mb-3">
                                <input 
                                  type="checkbox" 
                                  className="custom-control-input" 
                                  id="chieurap"
                                  checked={movie.chieurap}
                                  onChange={(e) => setMovie({ ...movie, chieurap: e.target.checked })}
                                />
                                <label className="custom-control-label" htmlFor="chieurap">Phim chiếu rạp</label>
                              </div>
                              
                              <div className="custom-control custom-switch mb-3">
                                <input 
                                  type="checkbox" 
                                  className="custom-control-input" 
                                  id="sub_docquyen"
                                  checked={movie.sub_docquyen}
                                  onChange={(e) => setMovie({ ...movie, sub_docquyen: e.target.checked })}
                                />
                                <label className="custom-control-label" htmlFor="sub_docquyen">Sub độc quyền</label>
                              </div>

                              <div className="form-group">
                                <label htmlFor="notify">Thông báo</label>
                                <input
                                  type="text"
                                  id="notify"
                                  name="notify"
                                  value={movie.notify}
                                  onChange={handleChange}
                                  className="form-control"
                                  placeholder="Thông báo hiển thị kèm phim"
                                />
                              </div>

                              <div className="form-group">
                                <label htmlFor="tmdb_id">ID TMDB (nếu có)</label>
                                <input
                                  type="text"
                                  id="tmdb_id"
                                  name="tmdb.id"
                                  value={movie.tmdb.id}
                                  onChange={(e) => setMovie({ 
                                    ...movie, 
                                    tmdb: { 
                                      ...movie.tmdb, 
                                      id: e.target.value 
                                    } 
                                  })}
                                  className="form-control"
                                  placeholder="ID phim trên TMDB"
                                />
                              </div>

                              <div className="form-group">
                                <label htmlFor="imdb_id">ID IMDB (nếu có)</label>
                                <input
                                  type="text"
                                  id="imdb_id"
                                  name="imdb.id"
                                  value={movie.imdb.id}
                                  onChange={(e) => setMovie({ 
                                    ...movie, 
                                    imdb: { 
                                      ...movie.imdb, 
                                      id: e.target.value 
                                    } 
                                  })}
                                  className="form-control"
                                  placeholder="ID phim trên IMDB"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card-footer">
                      <div className="d-flex justify-content-between">
                        <button type="button" className="btn btn-default" onClick={() => router.push('/admin/movies')}>
                          <i className="fas fa-arrow-left mr-1"></i>
                          Quay lại
                        </button>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                          {loading ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-1"></i>
                              Đang lưu...
                            </>
                          ) : (
                            <>
                              <FaSave className="mr-1" />
                              Lưu phim
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AddMovie;