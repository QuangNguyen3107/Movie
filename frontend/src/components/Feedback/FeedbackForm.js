import React, { useState, forwardRef } from 'react';
import { FaTimes, FaLightbulb } from 'react-icons/fa';
import { useAuth } from '../../utils/auth';
import axios from 'axios';

const FeedbackForm = forwardRef(({ isOpen, onClose }, ref) => {  const { user, isAuthenticated } = useAuth();  const [formData, setFormData] = useState({
    name: user?.fullmame || user?.name || 'Khách',
    email: user?.email || '',
    subject: 'Góp ý từ người dùng', // Đặt giá trị mặc định cho subject
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  // Cập nhật formData khi user thay đổi
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user?.fullName || user?.name || 'Khách',
        email: user?.email || prev.email
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };  const validateForm = () => {
    const { email, message } = formData;
    // Không cần kiểm tra name vì nó luôn là read-only
    if (!email.trim()) return 'Vui lòng nhập email';
    if (!message.trim()) return 'Vui lòng nhập nội dung';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Email không hợp lệ';
    
    return '';
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    
    setFormError('');
    setIsSubmitting(true);
      try {
      // Đảm bảo name luôn lấy từ user object nếu có
      // Xử lý tên hiển thị với thứ tự ưu tiên: fullName hoặc name từ user object, 
      // hoặc tên trong formData nếu không có user
      const submitData = {
        ...formData,
        name: user?.fullname || user?.name || formData.name
      };
      
      // Điều chỉnh cho backend nếu có user đăng nhập
      if (user && user._id) {
        submitData.user = user._id; // Gắn user ID nếu người dùng đã đăng nhập
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${baseUrl}/feedback`, submitData, {
        headers: {
          'Content-Type': 'application/json',
          ...(isAuthenticated && { Authorization: `Bearer ${localStorage.getItem('token')}` })
        }
      });
      
      if (response.data && response.data.success) {
        setSubmitSuccess(true);        
        // Reset form after successful submission
        setFormData({
          name: user?.fullname || user?.name || 'Khách',
          email: user?.email || '',
          subject: 'Góp ý từ người dùng',
          message: ''
        });
        
        // Close after 2 seconds
        setTimeout(() => {
          setSubmitSuccess(false);
          onClose();
        }, 2000);
      } else {
        setFormError(response.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setFormError(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau');
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!isOpen) return null;

  return (
    <div ref={ref} className="feedback-dropdown">
      <div className="feedback-header">
        <h6 className="m-0">Góp ý</h6>
        <button className="btn-close-feedback" onClick={onClose}>
          <FaTimes />
        </button>
      </div>
      
      <div className="feedback-content">
        {submitSuccess ? (
          <div className="feedback-success">
            <FaLightbulb className="success-icon" />
            <p>Cảm ơn bạn đã gửi góp ý!</p>
            <p className="success-message">Chúng tôi sẽ xem xét và phản hồi sớm nhất có thể.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {formError && (
              <div className="feedback-error alert alert-danger py-2">
                {formError}
              </div>
            )}              <div className="mb-2">
              <input
                type="text"
                name="name"
                value={user?.fullname || user?.name || formData.name}
                className="form-control form-control-sm bg-dark text-white border-secondary"
                placeholder="Tên người dùng"
                readOnly={true}
                style={{opacity: 1}}
              />
            </div>
            
            <div className="mb-2">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-control form-control-sm bg-dark text-white border-secondary"
                placeholder={user?.email || "Email"}
                readOnly={!!user?.email}
              />            </div>
              
              <div className="mb-3">
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="form-control form-control-sm bg-dark text-white border-secondary"
                placeholder="Nội dung"
                rows="4"
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-danger btn-sm w-100"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Đang gửi...
                </>
              ) : 'Gửi góp ý'}
            </button>
          </form>
        )}
      </div>
      
      <style jsx>{`        .feedback-dropdown {
          position: absolute;
          top: 55px;
          right: 60px;
          width: 320px;
          background-color: #212529;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          z-index: 1001;
          padding: 0;
          border: 1px solid rgba(255,255,255,0.1);
          overflow: hidden;
        }
          .feedback-dropdown:before {
          content: '';
          position: absolute;
          top: -8px;
          right: 60px;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 8px solid #212529;
        }
        
        @media (max-width: 992px) {
          .feedback-dropdown {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 320px;
          }
          
          .feedback-dropdown:before {
            display: none;
          }
        }
        
        .feedback-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          background-color: rgba(0,0,0,0.2);
        }
        
        .feedback-header h6 {
          font-weight: 600;
          color: #fff;
        }
        
        .btn-close-feedback {
          font-size: 14px;
          color: #aaa;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .btn-close-feedback:hover {
          color: #fff;
        }
        
        .feedback-content {
          padding: 15px;
          max-height: 400px;
          overflow-y: auto;
        }
        
        .feedback-error {
          font-size: 14px;
          margin-bottom: 15px;
        }
        
        .feedback-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px 15px;
          text-align: center;
        }
        
        .success-icon {
          font-size: 40px;
          color: #28a745;
          margin-bottom: 15px;
        }
        
        .feedback-success p {
          margin-bottom: 5px;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }
        
        .success-message {
          font-size: 14px !important;
          font-weight: normal !important;
          color: #aaa !important;
        }
      `}</style>
    </div>  );
});

export default FeedbackForm;
