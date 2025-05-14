import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaTimes, FaRegEnvelope, FaBug, FaLightbulb, FaFilm, FaQuestionCircle } from 'react-icons/fa';
import axios from 'axios';

/**
 * Component modal form góp ý cho người dùng
 * @param {Object} props
 * @param {boolean} props.isOpen - Trạng thái hiển thị của modal
 * @param {Function} props.onClose - Hàm đóng modal
 * @param {Object} props.user - Thông tin người dùng nếu đã đăng nhập
 */
const FeedbackForm = ({ isOpen, onClose, user }) => {
  const [formData, setFormData] = useState({
    name: user ? user.fullname || user.username : '',
    email: user ? user.email : '',
    subject: '',
    message: '',
    type: 'other' // Mặc định là loại khác
  });
  const [submitting, setSubmitting] = useState(false);

  // Xử lý khi thay đổi input form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gửi form feedback
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên của bạn');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Email không hợp lệ');
      return;
    }
    
    if (!formData.subject.trim()) {
      toast.error('Vui lòng nhập tiêu đề góp ý');
      return;
    }
    
    if (!formData.message.trim()) {
      toast.error('Vui lòng nhập nội dung góp ý');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Lấy token nếu đã đăng nhập
      const token = localStorage.getItem('auth_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.post('http://localhost:5000/api/feedback', formData, { headers });
      
      if (response.data.success) {
        toast.success('Cảm ơn bạn đã gửi góp ý! Chúng tôi sẽ xem xét và phản hồi sớm nhất có thể.');
        // Reset form và đóng modal
        setFormData({
          name: user ? user.fullname || user.username : '',
          email: user ? user.email : '',
          subject: '',
          message: '',
          type: 'other'
        });
        onClose();
      } else {
        toast.error(response.data.message || 'Có lỗi xảy ra khi gửi góp ý');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi góp ý');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-800 w-full max-w-md rounded-lg shadow-lg overflow-hidden relative">
        {/* Header */}
        <div className="bg-gray-700 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center">
            <FaRegEnvelope className="mr-2" />
            Góp ý của bạn
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        {/* Form body */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="name">
                  Họ tên của bạn
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Nhập họ tên của bạn"
                  disabled={user && user.fullname}
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Nhập email của bạn"
                  disabled={user && user.email}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="type">
                Loại góp ý
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div 
                  className={`p-3 rounded-md flex flex-col items-center cursor-pointer transition ${formData.type === 'bug' ? 'bg-red-900 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                  onClick={() => setFormData(prev => ({ ...prev, type: 'bug' }))}
                >
                  <FaBug className="text-2xl mb-1" />
                  <span className="text-sm">Lỗi</span>
                </div>
                <div 
                  className={`p-3 rounded-md flex flex-col items-center cursor-pointer transition ${formData.type === 'feature' ? 'bg-yellow-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                  onClick={() => setFormData(prev => ({ ...prev, type: 'feature' }))}
                >
                  <FaLightbulb className="text-2xl mb-1" />
                  <span className="text-sm">Tính năng</span>
                </div>
                <div 
                  className={`p-3 rounded-md flex flex-col items-center cursor-pointer transition ${formData.type === 'content' ? 'bg-blue-900 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                  onClick={() => setFormData(prev => ({ ...prev, type: 'content' }))}
                >
                  <FaFilm className="text-2xl mb-1" />
                  <span className="text-sm">Nội dung</span>
                </div>
                <div 
                  className={`p-3 rounded-md flex flex-col items-center cursor-pointer transition ${formData.type === 'other' ? 'bg-gray-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                  onClick={() => setFormData(prev => ({ ...prev, type: 'other' }))}
                >
                  <FaQuestionCircle className="text-2xl mb-1" />
                  <span className="text-sm">Khác</span>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="subject">
                Tiêu đề
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Nhập tiêu đề góp ý"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="message">
                Nội dung
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                placeholder="Nhập nội dung góp ý của bạn"
                rows={5}
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Đang gửi...
                  </>
                ) : 'Gửi góp ý'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default FeedbackForm;