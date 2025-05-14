import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '@/components/Layout/AdminLayout';
import axios from 'axios';
import { FaArrowLeft, FaBug, FaLightbulb, FaFilm, FaQuestionCircle, FaClock, FaEye, FaCheckCircle, FaUserCircle, FaEnvelope, FaCalendarAlt } from 'react-icons/fa';
import styles from '@/styles/AdminDashboard.module.css';

const FeedbackDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responseMessage, setResponseMessage] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Chỉ fetch feedback khi có ID
    if (id) {
      fetchFeedbackDetail();
    }
  }, [id]);

  const fetchFeedbackDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      const response = await axios.get(`http://localhost:5000/api/feedback/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.data && response.data.data.feedback) {
        setFeedback(response.data.data.feedback);
        setStatus(response.data.data.feedback.status);
        setResponseMessage(response.data.data.feedback.responseMessage || '');
        
        // Nếu feedback chưa đọc, đánh dấu là đã đọc
        if (!response.data.data.feedback.isRead) {
          markAsRead(id);
        }
      } else {
        alert('Không thể tải thông tin góp ý');
        router.push('/admin/feedback');
      }
    } catch (error) {
      console.error('Error fetching feedback detail:', error);
      alert('Có lỗi xảy ra khi tải thông tin góp ý');
      router.push('/admin/feedback');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (feedbackId) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      await axios.patch(
        `http://localhost:5000/api/feedback/${feedbackId}/read`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error marking feedback as read:', error);
    }
  };

  const handleSubmitResponse = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await axios.patch(
        `http://localhost:5000/api/feedback/${id}`, 
        {
          status,
          responseMessage
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert('Cập nhật phản hồi thành công');
        // Cập nhật feedback hiện tại
        setFeedback(prev => ({ ...prev, status, responseMessage }));
      } else {
        alert('Không thể cập nhật phản hồi');
      }
    } catch (error) {
      console.error('Error updating feedback response:', error);
      alert('Có lỗi xảy ra khi cập nhật phản hồi');
    } finally {
      setSubmitting(false);
    }
  };

  // Hiển thị icon tương ứng với loại feedback
  const getTypeIcon = (type) => {
    switch(type) {
      case 'bug':
        return <FaBug className="text-danger" style={{ fontSize: '1.5rem' }} />;
      case 'feature':
        return <FaLightbulb className="text-warning" style={{ fontSize: '1.5rem' }} />;
      case 'content':
        return <FaFilm className="text-primary" style={{ fontSize: '1.5rem' }} />;
      default:
        return <FaQuestionCircle className="text-secondary" style={{ fontSize: '1.5rem' }} />;
    }
  };

  // Hiển thị icon tương ứng với trạng thái
  const getStatusIcon = (status) => {
    switch(status) {
      case 'resolved':
        return <FaCheckCircle className="text-success" style={{ fontSize: '1.5rem' }} />;
      case 'reviewed':
        return <FaEye className="text-primary" style={{ fontSize: '1.5rem' }} />;
      default:
        return <FaClock className="text-secondary" style={{ fontSize: '1.5rem' }} />;
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

  return (
    <>
      <Head>
        <title>Chi tiết góp ý - Admin Panel</title>
      </Head>

      <div className={styles.container}>
        <section className={styles.header}>
          <div className="container-fluid">
            <div className="row align-items-center">
              <div className="col-sm-6">
                <h1 className={styles.headerTitle}>Chi tiết góp ý</h1>
              </div>
              <div className="col-sm-6">
                <ol className={`breadcrumb float-sm-right ${styles.breadcrumb}`}>
                  <li className="breadcrumb-item"><a href="/admin">Home</a></li>
                  <li className="breadcrumb-item"><a href="/admin/feedback">Góp ý người dùng</a></li>
                  <li className="breadcrumb-item active">Chi tiết</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            {loading ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            ) : feedback ? (
              <>
                <div className="card mb-4">
                  <div className="card-header">
                    <div className="d-flex align-items-center">
                      <button
                        onClick={() => router.push('/admin/feedback')}
                        className="btn btn-outline-secondary mr-3"
                      >
                        <FaArrowLeft />
                      </button>
                      <h3 className="card-title m-0">Thông tin góp ý</h3>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="d-flex flex-column flex-md-row justify-content-between mb-4">
                      <div className="d-flex align-items-center mb-3 mb-md-0">
                        <div className="mr-3">
                          {getTypeIcon(feedback.type)}
                        </div>
                        <div>
                          <h4 className="mb-1">{feedback.subject}</h4>
                          <p className="text-muted mb-0">
                            <span className="text-capitalize">{feedback.type}</span> • {formatDate(feedback.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        {getStatusIcon(feedback.status)}
                        <span className="ml-2 text-capitalize">{feedback.status}</span>
                      </div>
                    </div>
                    
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <div className="d-flex align-items-center mb-2">
                          <FaUserCircle className="text-muted mr-2" />
                          <span className="text-muted">Người gửi:</span>
                        </div>
                        <p className="ml-4 mb-3">{feedback.name}</p>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center mb-2">
                          <FaEnvelope className="text-muted mr-2" />
                          <span className="text-muted">Email:</span>
                        </div>
                        <p className="ml-4 mb-3">{feedback.email}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="d-flex align-items-center mb-2">
                        <FaCalendarAlt className="text-muted mr-2" />
                        <span className="text-muted">Thời gian gửi:</span>
                      </div>
                      <p className="ml-4 mb-0">{formatDate(feedback.createdAt)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="card mb-4">
                  <div className="card-header">
                    <h3 className="card-title">Nội dung góp ý</h3>
                  </div>
                  <div className="card-body">
                    <div className="bg-light p-3 rounded" style={{ whiteSpace: 'pre-wrap' }}>
                      {feedback.message}
                    </div>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Phản hồi góp ý</h3>
                  </div>
                  <div className="card-body">
                    <div className="form-group">
                      <label>Trạng thái xử lý</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="form-control"
                      >
                        <option value="pending">Đang chờ</option>
                        <option value="reviewed">Đã xem xét</option>
                        <option value="resolved">Đã giải quyết</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Nội dung phản hồi</label>
                      <textarea
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        className="form-control"
                        rows={5}
                        placeholder="Nhập nội dung phản hồi cho người dùng..."
                      ></textarea>
                    </div>
                    
                    <button
                      onClick={handleSubmitResponse}
                      disabled={submitting}
                      className="btn btn-primary"
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                          Đang cập nhật...
                        </>
                      ) : 'Cập nhật phản hồi'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="card">
                <div className="card-body text-center py-5">
                  <p className="text-muted mb-3">Không tìm thấy thông tin góp ý</p>
                  <button 
                    onClick={() => router.push('/admin/feedback')}
                    className="btn btn-primary"
                  >
                    Quay lại danh sách
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

// Thêm getLayout để sử dụng AdminLayout
FeedbackDetailPage.getLayout = (page) => {
  return <AdminLayout>{page}</AdminLayout>;
};

export default FeedbackDetailPage;