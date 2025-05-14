import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '@/components/Layout/AdminLayout';
import axios from 'axios';
import { FaCheck, FaTrash, FaEye, FaEnvelope, FaEnvelopeOpen, FaFilter, FaClock, FaCheckCircle, FaBug, FaLightbulb, FaFilm, FaQuestionCircle, FaTimes, FaSearch, FaInbox, FaSadTear } from 'react-icons/fa';
import styles from '@/styles/AdminDashboard.module.css';

const FeedbackListPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    isRead: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [totalFeedbacks, setTotalFeedbacks] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchFeedbacks();
    fetchUnreadCount();
  }, [page, filters]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await axios.get(
        'http://localhost:5000/api/feedback/unread/count',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setUnreadCount(response.data.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Xây dựng query parameters từ state filters
      let url = `http://localhost:5000/api/feedback?page=${page}&limit=10`;
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.type) url += `&type=${filters.type}`;
      if (filters.isRead !== '') url += `&isRead=${filters.isRead}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.data) {
        setFeedbacks(response.data.data.feedbacks);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalFeedbacks(response.data.data.pagination.total);
      } else {
        alert('Có lỗi khi tải dữ liệu góp ý');
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      alert('Có lỗi khi tải dữ liệu góp ý');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(1); // Reset về trang 1 khi thay đổi filter
  };

  const handleViewDetail = (id) => {
    router.push(`/admin/feedback/detail/${id}`);
  };

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await axios.patch(
        `http://localhost:5000/api/feedback/${id}/read`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Cập nhật danh sách feedback
        setFeedbacks(prev => prev.map(feedback => {
          if (feedback._id === id) {
            return { ...feedback, isRead: true };
          }
          return feedback;
        }));
        
        // Cập nhật số lượng chưa đọc
        fetchUnreadCount();
      } else {
        alert('Có lỗi xảy ra khi đánh dấu đã đọc');
      }
    } catch (error) {
      console.error('Error marking feedback as read:', error);
      alert('Có lỗi xảy ra khi đánh dấu đã đọc');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa góp ý này?')) {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const response = await axios.delete(
          `http://localhost:5000/api/feedback/${id}`, 
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          // Xóa feedback khỏi danh sách
          setFeedbacks(prev => prev.filter(feedback => feedback._id !== id));
          setTotalFeedbacks(prev => prev - 1);
          fetchUnreadCount(); // Cập nhật lại số lượng chưa đọc
          alert('Đã xóa góp ý thành công');
        } else {
          alert('Có lỗi xảy ra khi xóa góp ý');
        }
      } catch (error) {
        console.error('Error deleting feedback:', error);
        alert('Có lỗi xảy ra khi xóa góp ý');
      }
    }
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      type: '',
      isRead: ''
    });
    setPage(1);
  };

  // Hiển thị icon tương ứng với loại feedback
  const getTypeIcon = (type) => {
    switch(type) {
      case 'bug':
        return <FaBug />;
      case 'feature':
        return <FaLightbulb />;
      case 'content':
        return <FaFilm />;
      default:
        return <FaQuestionCircle />;
    }
  };

  // Hiển thị kiểu badge tương ứng với loại feedback
  const getTypeBadge = (type) => {
    switch(type) {
      case 'bug':
        return <span className="badge badge-danger px-2 py-1"><FaBug className="mr-1" /> Lỗi phần mềm</span>;
      case 'feature':
        return <span className="badge badge-warning px-2 py-1"><FaLightbulb className="mr-1" /> Tính năng mới</span>;
      case 'content':
        return <span className="badge badge-primary px-2 py-1"><FaFilm className="mr-1" /> Nội dung</span>;
      default:
        return <span className="badge badge-secondary px-2 py-1"><FaQuestionCircle className="mr-1" /> Khác</span>;
    }
  };

  // Hiển thị badge tương ứng với trạng thái
  const getStatusBadge = (status) => {
    switch(status) {
      case 'resolved':
        return <span className="badge badge-success px-2 py-1"><FaCheckCircle className="mr-1" /> Đã giải quyết</span>;
      case 'reviewed':
        return <span className="badge badge-info px-2 py-1"><FaEye className="mr-1" /> Đã xem xét</span>;
      default:
        return <span className="badge badge-light px-2 py-1"><FaClock className="mr-1" /> Đang chờ</span>;
    }
  };

  // Format thời gian
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Xây dựng các thẻ tóm tắt theo trạng thái
  const statusSummary = [
    {
      icon: <FaInbox className="text-primary" />,
      title: "Tổng số góp ý",
      value: totalFeedbacks,
      bgColor: "bg-white"
    },
    {
      icon: <FaEnvelope className="text-danger" />,
      title: "Chưa đọc",
      value: unreadCount,
      bgColor: "bg-light"
    },
    {
      icon: <FaClock className="text-warning" />,
      title: "Đang chờ",
      value: feedbacks.filter(f => f.status === 'pending').length,
      bgColor: "bg-white"
    },
    {
      icon: <FaCheckCircle className="text-success" />,
      title: "Đã giải quyết",
      value: feedbacks.filter(f => f.status === 'resolved').length,
      bgColor: "bg-light"
    }
  ];

  return (
    <>
      <Head>
        <title>Quản lý Góp ý Người dùng</title>
      </Head>

      <div className={styles.container}>
        <section className={styles.header}>
          <div className="container-fluid">
            <div className="row align-items-center">
              <div className="col-sm-6">
                <h1 className={styles.headerTitle}>Quản lý Góp ý</h1>
              </div>
              <div className="col-sm-6">
                <ol className={`breadcrumb float-sm-right ${styles.breadcrumb}`}>
                  <li className="breadcrumb-item"><a href="/admin">Home</a></li>
                  <li className="breadcrumb-item active">Góp ý người dùng</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            {/* Dashboard Cards */}
            <div className="row mb-4">
              {statusSummary.map((item, index) => (
                <div className="col-md-3 col-sm-6" key={index}>
                  <div className={`card card-hover shadow-sm ${item.bgColor}`}>
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="mb-0 font-weight-bold">{item.value}</h5>
                          <span className="text-muted small">{item.title}</span>
                        </div>
                        <div className="icon-circle">
                          {item.icon}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card card-outline card-primary shadow-sm">
              <div className="card-header bg-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h3 className="card-title">
                    <FaInbox className="mr-2" />
                    Danh sách góp ý
                  </h3>
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className="btn btn-light border"
                  >
                    <FaFilter className="mr-1" /> {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="card-body border-bottom bg-light py-3">
                  <div className="row">
                    <div className="col-md-4 mb-2">
                      <div className="form-group mb-md-0">
                        <label className="small font-weight-bold mb-1">Trạng thái</label>
                        <select
                          name="status"
                          value={filters.status}
                          onChange={handleFilterChange}
                          className="form-control shadow-sm"
                        >
                          <option value="">Tất cả trạng thái</option>
                          <option value="pending">Đang chờ</option>
                          <option value="reviewed">Đã xem xét</option>
                          <option value="resolved">Đã giải quyết</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4 mb-2">
                      <div className="form-group mb-md-0">
                        <label className="small font-weight-bold mb-1">Loại góp ý</label>
                        <select
                          name="type"
                          value={filters.type}
                          onChange={handleFilterChange}
                          className="form-control shadow-sm"
                        >
                          <option value="">Tất cả loại</option>
                          <option value="bug">Lỗi phần mềm</option>
                          <option value="feature">Tính năng mới</option>
                          <option value="content">Nội dung</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4 mb-2">
                      <div className="form-group mb-md-0">
                        <label className="small font-weight-bold mb-1">Trạng thái đọc</label>
                        <select
                          name="isRead"
                          value={filters.isRead}
                          onChange={handleFilterChange}
                          className="form-control shadow-sm"
                        >
                          <option value="">Tất cả</option>
                          <option value="true">Đã đọc</option>
                          <option value="false">Chưa đọc</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="row mt-3">
                    <div className="col-12 text-right">
                      <button
                        onClick={resetFilters}
                        className="btn btn-outline-secondary"
                      >
                        <FaTimes className="mr-1" /> Xóa bộ lọc
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="card-body">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                  </div>
                ) : feedbacks.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <FaSadTear size={50} className="text-muted" />
                    </div>
                    <h5 className="text-muted">Không có góp ý nào</h5>
                    <p className="text-muted">Không tìm thấy góp ý nào phù hợp với bộ lọc hiện tại</p>
                    <button className="btn btn-outline-primary" onClick={resetFilters}>
                      Xóa tất cả bộ lọc
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                      <thead className="thead-light">
                        <tr>
                          <th width="20%">Người gửi</th>
                          <th width="30%">Tiêu đề & Nội dung</th>
                          <th width="15%">Phân loại</th>
                          <th width="15%">Trạng thái</th>
                          <th width="10%">Thời gian</th>
                          <th width="10%">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feedbacks.map((feedback) => (
                          <tr 
                            key={feedback._id} 
                            className={!feedback.isRead ? 'bg-light font-weight-bold' : ''}
                            style={!feedback.isRead ? {borderLeft: '4px solid #e50914'} : {}}
                          >
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="mr-2">
                                  {!feedback.isRead ? 
                                    <FaEnvelope className="text-danger" title="Chưa đọc" /> : 
                                    <FaEnvelopeOpen className="text-muted" title="Đã đọc" />
                                  }
                                </div>
                                <div>
                                  <div className="font-weight-bold">{feedback.name}</div>
                                  <small className="text-muted">{feedback.email}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="font-weight-bold">{feedback.subject}</div>
                              <small className="text-muted">{feedback.message.length > 100 ? 
                                `${feedback.message.substring(0, 100)}...` : 
                                feedback.message}</small>
                            </td>
                            <td>
                              {getTypeBadge(feedback.type)}
                            </td>
                            <td>
                              {getStatusBadge(feedback.status)}
                            </td>
                            <td>
                              <div className="small">{formatDate(feedback.createdAt)}</div>
                            </td>
                            <td>
                              <div className="btn-group">
                                <button
                                  onClick={() => handleViewDetail(feedback._id)}
                                  className="btn btn-sm btn-primary"
                                  title="Xem chi tiết"
                                >
                                  <FaEye />
                                </button>
                                {!feedback.isRead && (
                                  <button
                                    onClick={() => handleMarkAsRead(feedback._id)}
                                    className="btn btn-sm btn-success"
                                    title="Đánh dấu đã đọc"
                                  >
                                    <FaEnvelopeOpen />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(feedback._id)}
                                  className="btn btn-sm btn-danger"
                                  title="Xóa"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Phân trang */}
                {!loading && feedbacks.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <span className="text-muted">Hiển thị {feedbacks.length} / {totalFeedbacks} góp ý</span>
                    </div>
                    <nav aria-label="Page navigation">
                      <ul className="pagination m-0">
                        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                          >
                            &laquo;
                          </button>
                        </li>
                        {[...Array(totalPages).keys()].map(num => {
                          // Hiển thị tối đa 5 trang
                          if (totalPages <= 5 || 
                              num + 1 === 1 || 
                              num + 1 === page || 
                              num + 1 === page - 1 || 
                              num + 1 === page + 1 || 
                              num + 1 === totalPages) {
                            return (
                              <li key={num + 1} className={`page-item ${page === num + 1 ? 'active' : ''}`}>
                                <button className="page-link" onClick={() => handlePageChange(num + 1)}>
                                  {num + 1}
                                </button>
                              </li>
                            );
                          } else if (num + 1 === page - 2 || num + 1 === page + 2) {
                            return (
                              <li key={num + 1} className="page-item disabled">
                                <button className="page-link">...</button>
                              </li>
                            );
                          }
                          return null;
                        })}
                        <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                          >
                            &raquo;
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .icon-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: rgba(0,0,0,0.1);
          font-size: 1.25rem;
        }
        
        .card-hover:hover {
          transform: translateY(-3px);
          transition: all 0.3s ease;
          box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
        }
        
        .badge {
          font-weight: 500;
          display: inline-flex;
          align-items: center;
        }
      `}</style>
    </>
  );
};

// Thêm getLayout để sử dụng AdminLayout
FeedbackListPage.getLayout = (page) => {
  return <AdminLayout>{page}</AdminLayout>;
};

export default FeedbackListPage;