// src/components/Admin/UpcomingMovies/UpcomingMovieForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Row, Col, Card, Tab, Nav, Image, Alert } from 'react-bootstrap';
import { UpcomingMovie } from '@/services/admin/upcomingMovieService';
import BackToListButton from '../Common/BackToListButton';
import BackToTopButton from '../Common/BackToTopButton';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface UpcomingMovieFormProps {
  movie?: Partial<UpcomingMovie>;
  onSubmit: (movieData: Partial<UpcomingMovie>) => void;
  isSubmitting: boolean;
  onCancel?: () => void;
}

const UpcomingMovieForm: React.FC<UpcomingMovieFormProps> = ({ 
  movie, 
  onSubmit, 
  isSubmitting,
  onCancel 
}) => {
  const [formData, setFormData] = useState<Partial<UpcomingMovie>>(movie || {
    name: '',
    origin_name: '',
    content: '',
    year: new Date().getFullYear(),
    type: 'movie',
    status: 'upcoming',
    quality: '',
    lang: '',
    category: [],
    actor: [],
    director: [],
    country: [],
    release_date: new Date(),
    is_released: false,
    chieurap: true,
    isHidden: false
  });
  
  const [thumbnailPreview, setThumbnailPreview] = useState<string>(formData.thumb_url || '');
  const [posterPreview, setPosterPreview] = useState<string>(formData.poster_url || '');
  const [activeTab, setActiveTab] = useState('basic');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRefThumb = useRef<HTMLInputElement>(null);
  const fileInputRefPoster = useRef<HTMLInputElement>(null);
  const [releaseDate, setReleaseDate] = useState<Date | null>(
    movie?.release_date ? new Date(movie.release_date) : new Date()
  );

  useEffect(() => {
    if (movie) {
      setThumbnailPreview(movie.thumb_url || '');
      setPosterPreview(movie.poster_url || '');
      if (movie.release_date) {
        setReleaseDate(new Date(movie.release_date));
      }
    }
    
    // Check for authentication token
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      setErrorMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.');
      console.error('Authentication token missing. User might need to log in again.');
    }
  }, [movie]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleReleaseDateChange = (date: Date | null) => {
    setReleaseDate(date);
    if (date) {
      setFormData(prev => ({ ...prev, release_date: date }));
    }
  };

  const handleArrayInputChange = (field: string, value: string) => {
    if (field === 'actor' || field === 'director') {
      const items = value.split(',').map(item => item.trim());
      setFormData(prev => ({ ...prev, [field]: items }));
    } else {
      const items = value.split(',').map(item => ({
        id: Math.random().toString(36).substr(2, 9),
        name: item.trim(),
        slug: item.trim().toLowerCase().replace(/ /g, '-')
      }));
      setFormData(prev => ({ ...prev, [field]: items }));
    }
  };

  const handleFileChange = (field: 'thumb_url' | 'poster_url', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileUrl = URL.createObjectURL(file);
      
      // Here we would normally upload the file to a server,
      // but for now we'll just use the local URL for preview
      if (field === 'thumb_url') {
        setThumbnailPreview(fileUrl);
        setFormData(prev => ({ ...prev, thumb_url: fileUrl }));
      } else {
        setPosterPreview(fileUrl);
        setFormData(prev => ({ ...prev, poster_url: fileUrl }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name) {
      setErrorMessage('Vui lòng nhập tên phim');
      return;
    }
    
    if (!formData.origin_name) {
      setErrorMessage('Vui lòng nhập tên gốc phim');
      return;
    }
    
    if (!formData.content) {
      setErrorMessage('Vui lòng nhập nội dung phim');
      return;
    }
    
    if (!formData.release_date) {
      setErrorMessage('Vui lòng chọn ngày phát hành');
      return;
    }

    setErrorMessage('');
    onSubmit(formData);
  };

  return (
    <>
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <BackToListButton listPath="/admin/upcoming-movies" variant="outline-light" />
            <h4 className="mb-0">{movie ? 'Chỉnh sửa phim sắp ra mắt' : 'Thêm phim sắp ra mắt'}</h4>
            <div style={{ width: '120px' }}></div>
          </div>
        </Card.Header>
        <Card.Body>
          {errorMessage && (
            <Alert variant="danger" className="mb-4">
              {errorMessage}
            </Alert>
          )}

          <Tab.Container id="upcoming-movie-form-tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'basic')}>
            <Row>
              <Col md={3} className="mb-3">
                <Nav variant="pills" className="flex-column">
                  <Nav.Item>
                    <Nav.Link eventKey="basic" className="mb-2">Thông tin cơ bản</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="details" className="mb-2">Chi tiết phim</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="media" className="mb-2">Hình ảnh & Media</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="preview" className="mb-2">Xem trước</Nav.Link>
                  </Nav.Item>
                </Nav>
                
                {(thumbnailPreview || posterPreview) && (
                  <Card className="mt-4">
                    <Card.Header className="bg-light">Xem nhanh</Card.Header>
                    <Card.Body className="text-center">
                      {thumbnailPreview && (
                        <Image 
                          src={thumbnailPreview} 
                          alt="Thumbnail preview" 
                          style={{ maxWidth: '100%', height: 'auto', maxHeight: '150px' }}
                          className="mb-2"
                        />
                      )}
                    </Card.Body>
                  </Card>
                )}
              </Col>
              
              <Col md={9}>
                <Form onSubmit={handleSubmit}>
                  <Tab.Content>
                    {/* Basic Information Tab */}
                    <Tab.Pane eventKey="basic">
                      <Card>
                        <Card.Header className="bg-light">Thông tin cơ bản</Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Tên phim <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                  type="text"
                                  name="name"
                                  value={formData.name || ''}
                                  onChange={handleInputChange}
                                  required
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Tên gốc <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                  type="text"
                                  name="origin_name"
                                  value={formData.origin_name || ''}
                                  onChange={handleInputChange}
                                  required
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Năm sản xuất</Form.Label>
                                <Form.Control
                                  type="number"
                                  name="year"
                                  value={formData.year || new Date().getFullYear()}
                                  onChange={handleInputChange}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Ngày phát hành <span className="text-danger">*</span></Form.Label>
                                <DatePicker 
                                  selected={releaseDate}
                                  onChange={handleReleaseDateChange}
                                  className="form-control"
                                  dateFormat="dd/MM/yyyy"
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          <Row>
                            <Col md={12}>
                              <Form.Group className="mb-3">
                                <Form.Label>Nội dung <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                  as="textarea"
                                  name="content"
                                  value={formData.content || ''}
                                  onChange={handleInputChange}
                                  rows={4}
                                  required
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Check
                                  type="checkbox"
                                  label="Chiếu Rạp"
                                  name="chieurap"
                                  checked={formData.chieurap || false}
                                  onChange={handleCheckboxChange}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Check
                                  type="checkbox"
                                  label="Ẩn phim"
                                  name="isHidden"
                                  checked={formData.isHidden || false}
                                  onChange={handleCheckboxChange}
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>

                    {/* Details Tab */}
                    <Tab.Pane eventKey="details">
                      <Card>
                        <Card.Header className="bg-light">Chi tiết phim</Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Thể loại</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={2}
                                  placeholder="Nhập các thể loại, phân cách bằng dấu phẩy"
                                  value={formData.category?.map(cat => cat.name).join(', ') || ''}
                                  onChange={(e) => handleArrayInputChange('category', e.target.value)}
                                />
                                <Form.Text className="text-muted">
                                  Ví dụ: Hành động, Phiêu lưu, Viễn tưởng
                                </Form.Text>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Quốc gia</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={2}
                                  placeholder="Nhập các quốc gia, phân cách bằng dấu phẩy"
                                  value={formData.country?.map(country => country.name).join(', ') || ''}
                                  onChange={(e) => handleArrayInputChange('country', e.target.value)}
                                />
                                <Form.Text className="text-muted">
                                  Ví dụ: Việt Nam, Mỹ, Hàn Quốc
                                </Form.Text>
                              </Form.Group>
                            </Col>
                          </Row>

                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Đạo diễn</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={2}
                                  placeholder="Nhập tên các đạo diễn, phân cách bằng dấu phẩy"
                                  value={formData.director?.join(', ') || ''}
                                  onChange={(e) => handleArrayInputChange('director', e.target.value)}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Diễn viên</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={2}
                                  placeholder="Nhập tên các diễn viên, phân cách bằng dấu phẩy"
                                  value={formData.actor?.join(', ') || ''}
                                  onChange={(e) => handleArrayInputChange('actor', e.target.value)}
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Chất lượng</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="quality"
                                  value={formData.quality || ''}
                                  onChange={handleInputChange}
                                  placeholder="HD, FHD, etc."
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Ngôn ngữ</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="lang"
                                  value={formData.lang || ''}
                                  onChange={handleInputChange}
                                  placeholder="Vietsub, Thuyết minh, etc."
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>

                    {/* Media Tab */}
                    <Tab.Pane eventKey="media">
                      <Card>
                        <Card.Header className="bg-light">Hình ảnh & Media</Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Hình thu nhỏ (Thumbnail)</Form.Label>
                                <div className="d-flex mb-2">
                                  <Form.Control
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRefThumb}
                                    onChange={(e) => handleFileChange('thumb_url', e)}
                                    className="me-2"
                                  />
                                  <Button 
                                    variant="outline-secondary"
                                    onClick={() => fileInputRefThumb.current?.click()}
                                  >
                                    Chọn file
                                  </Button>
                                </div>
                                {thumbnailPreview && (
                                  <div className="mt-2">
                                    <Image 
                                      src={thumbnailPreview} 
                                      alt="Thumbnail preview" 
                                      style={{ maxWidth: '100%', height: 'auto', maxHeight: '150px' }}
                                    />
                                  </div>
                                )}
                                <Form.Text className="text-muted">
                                  Hoặc nhập URL hình ảnh
                                </Form.Text>
                                <Form.Control
                                  type="text"
                                  name="thumb_url"
                                  value={formData.thumb_url || ''}
                                  onChange={handleInputChange}
                                  placeholder="https://example.com/image.jpg"
                                  className="mt-2"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Poster</Form.Label>
                                <div className="d-flex mb-2">
                                  <Form.Control
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRefPoster}
                                    onChange={(e) => handleFileChange('poster_url', e)}
                                    className="me-2"
                                  />
                                  <Button 
                                    variant="outline-secondary"
                                    onClick={() => fileInputRefPoster.current?.click()}
                                  >
                                    Chọn file
                                  </Button>
                                </div>
                                {posterPreview && (
                                  <div className="mt-2">
                                    <Image 
                                      src={posterPreview} 
                                      alt="Poster preview" 
                                      style={{ maxWidth: '100%', height: 'auto', maxHeight: '200px' }}
                                    />
                                  </div>
                                )}
                                <Form.Text className="text-muted">
                                  Hoặc nhập URL poster
                                </Form.Text>
                                <Form.Control
                                  type="text"
                                  name="poster_url"
                                  value={formData.poster_url || ''}
                                  onChange={handleInputChange}
                                  placeholder="https://example.com/poster.jpg"
                                  className="mt-2"
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          <Row>
                            <Col md={12}>
                              <Form.Group className="mb-3">
                                <Form.Label>URL Trailer</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="trailer_url"
                                  value={formData.trailer_url || ''}
                                  onChange={handleInputChange}
                                  placeholder="https://www.youtube.com/watch?v=..."
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>

                    {/* Preview Tab */}
                    <Tab.Pane eventKey="preview">
                      <Card>
                        <Card.Header className="bg-light">Xem trước thông tin phim</Card.Header>
                        <Card.Body>
                          <div className="preview-container p-3 bg-light rounded">
                            <h4>{formData.name || 'Tên phim'}</h4>
                            <p className="text-muted">{formData.origin_name || 'Tên gốc'}</p>
                            
                            <Row className="my-3">
                              <Col md={6}>
                                <div className="preview-image">
                                  {thumbnailPreview ? (
                                    <Image 
                                      src={thumbnailPreview} 
                                      alt="Movie thumbnail" 
                                      style={{ maxWidth: '100%', height: 'auto', borderRadius: '5px' }}
                                    />
                                  ) : (
                                    <div className="no-image p-5 text-center bg-secondary text-white rounded">
                                      Chưa có hình thu nhỏ
                                    </div>
                                  )}
                                </div>
                              </Col>
                              <Col md={6}>
                                <div className="movie-details">
                                  <p><strong>Năm sản xuất:</strong> {formData.year}</p>
                                  <p><strong>Ngày phát hành:</strong> {releaseDate ? releaseDate.toLocaleDateString('vi-VN') : 'Chưa xác định'}</p>
                                  <p><strong>Thể loại:</strong> {formData.category?.map(c => c.name).join(', ') || 'Chưa xác định'}</p>
                                  <p><strong>Quốc gia:</strong> {formData.country?.map(c => c.name).join(', ') || 'Chưa xác định'}</p>
                                  <p><strong>Đạo diễn:</strong> {formData.director?.join(', ') || 'Chưa xác định'}</p>
                                  <p><strong>Diễn viên:</strong> {formData.actor?.join(', ') || 'Chưa xác định'}</p>
                                  <p><strong>Chất lượng:</strong> {formData.quality || 'Chưa xác định'}</p>
                                  <p><strong>Ngôn ngữ:</strong> {formData.lang || 'Chưa xác định'}</p>
                                </div>
                              </Col>
                            </Row>
                            
                            <div className="movie-synopsis mt-3">
                              <h5>Nội dung:</h5>
                              <p>{formData.content || 'Chưa có nội dung'}</p>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>
                  </Tab.Content>

                  <div className="d-flex justify-content-between mt-4">
                    <Button 
                      variant="secondary" 
                      onClick={onCancel || (() => window.history.back())}
                    >
                      Hủy
                    </Button>
                    <div>
                      {activeTab !== 'basic' && (
                        <Button 
                          variant="info" 
                          className="me-2" 
                          onClick={() => setActiveTab(tabs[tabs.indexOf(activeTab) - 1])}
                        >
                          Quay lại
                        </Button>
                      )}
                      {activeTab !== 'preview' && (
                        <Button 
                          variant="info" 
                          className="me-2" 
                          onClick={() => setActiveTab(tabs[tabs.indexOf(activeTab) + 1])}
                        >
                          Tiếp theo
                        </Button>
                      )}
                      <Button 
                        variant="success" 
                        type="submit" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Đang lưu...' : (movie ? 'Cập nhật' : 'Thêm mới')}
                      </Button>
                    </div>
                  </div>
                </Form>
              </Col>
            </Row>
          </Tab.Container>
        </Card.Body>
      </Card>
      <BackToTopButton />
    </>
  );
};

const tabs = ['basic', 'details', 'media', 'preview'];

export default UpcomingMovieForm;
