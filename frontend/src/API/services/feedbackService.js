import axiosInstance from '../config/axiosConfig';

/**
 * Service xử lý API liên quan đến góp ý của người dùng
 */
class FeedbackService {
  /**
   * Lấy danh sách feedback
   * @param {Object} queryParams Các tham số truy vấn
   * @param {number} queryParams.page Số trang
   * @param {number} queryParams.limit Số lượng mỗi trang
   * @param {string} queryParams.status Trạng thái feedback
   * @param {string} queryParams.type Loại feedback
   * @param {boolean} queryParams.isRead Trạng thái đã đọc
   * @returns {Promise<Object>} Danh sách feedback và thông tin phân trang
   */
  async getFeedbackList(queryParams = {}) {
    try {
      const { page = 1, limit = 10, status, type, isRead } = queryParams;
      let url = `/api/feedback?page=${page}&limit=${limit}`;
      
      if (status) url += `&status=${status}`;
      if (type) url += `&type=${type}`;
      if (isRead !== undefined) url += `&isRead=${isRead}`;
      
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching feedback list:', error);
      throw error;
    }
  }

  /**
   * Lấy chi tiết một feedback
   * @param {string} id ID của feedback
   * @returns {Promise<Object>} Chi tiết feedback
   */
  async getFeedbackById(id) {
    try {
      const response = await axiosInstance.get(`/api/feedback/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching feedback details:', error);
      throw error;
    }
  }

  /**
   * Đánh dấu feedback là đã đọc
   * @param {string} id ID của feedback
   * @returns {Promise<Object>} Kết quả cập nhật
   */
  async markAsRead(id) {
    try {
      const response = await axiosInstance.patch(`/api/feedback/${id}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking feedback as read:', error);
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái của feedback
   * @param {string} id ID của feedback
   * @param {Object} data Dữ liệu cập nhật
   * @param {string} data.status Trạng thái mới
   * @param {string} data.responseMessage Phản hồi cho feedback
   * @returns {Promise<Object>} Kết quả cập nhật
   */
  async updateFeedbackStatus(id, data) {
    try {
      const response = await axiosInstance.patch(`/api/feedback/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating feedback status:', error);
      throw error;
    }
  }

  /**
   * Xóa một feedback
   * @param {string} id ID của feedback
   * @returns {Promise<Object>} Kết quả xóa
   */
  async deleteFeedback(id) {
    try {
      const response = await axiosInstance.delete(`/api/feedback/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  }

  /**
   * Lấy số lượng feedback chưa đọc
   * @returns {Promise<number>} Số lượng feedback chưa đọc
   */
  async getUnreadCount() {
    try {
      const response = await axiosInstance.get('/api/feedback/unread/count');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread feedback count:', error);
      throw error;
    }
  }
}

export default new FeedbackService();