const Feedback = require('../models/feedback');
const User = require('../models/user');
const responseHelper = require('../utils/responseHelper');

/**
 * Controller xử lý các chức năng liên quan đến góp ý của người dùng
 */
class FeedbackController {
  /**
   * Gửi góp ý mới
   * @route POST /api/feedback
   * @access Public
   */
  async submitFeedback(req, res) {
    try {
      const { name, email, subject, message, type } = req.body;

      // Validate input
      if (!name || !email || !subject || !message) {
        return responseHelper.error(res, 'Vui lòng điền đầy đủ thông tin', 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return responseHelper.error(res, 'Email không hợp lệ', 400);
      }

      // Lấy thông tin user nếu đã đăng nhập
      let userId = null;
      if (req.user) {
        userId = req.user._id;
      }

      // Tạo và lưu feedback mới
      const newFeedback = new Feedback({
        userId,
        name,
        email,
        subject,
        message,
        type: type || 'other'
      });

      const savedFeedback = await newFeedback.save();

      // Trả về thông báo thành công
      return responseHelper.success(
        res, 
        { feedback: savedFeedback }, 
        'Cảm ơn bạn đã gửi góp ý. Chúng tôi sẽ xem xét và phản hồi sớm nhất có thể.'
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return responseHelper.error(res, 'Đã có lỗi xảy ra khi gửi góp ý', 500);
    }
  }

  /**
   * Lấy danh sách góp ý (dành cho admin)
   * @route GET /api/feedback
   * @access Admin
   */
  async getAllFeedback(req, res) {
    try {
      const { status, type, page = 1, limit = 10, isRead } = req.query;
      
      // Tạo query conditions
      const conditions = {};
      
      if (status) {
        conditions.status = status;
      }
      
      if (type) {
        conditions.type = type;
      }
      
      if (isRead !== undefined) {
        conditions.isRead = isRead === 'true';
      }
      
      // Phân trang
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Lấy danh sách feedback và tổng số
      const [feedbacks, total] = await Promise.all([
        Feedback.find(conditions)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('userId', 'fullname email avatar'),
        Feedback.countDocuments(conditions)
      ]);
      
      // Trả về kết quả
      return responseHelper.success(res, {
        feedbacks,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error getting feedback list:', error);
      return responseHelper.error(res, 'Đã có lỗi xảy ra khi lấy danh sách góp ý', 500);
    }
  }

  /**
   * Lấy chi tiết một góp ý
   * @route GET /api/feedback/:id
   * @access Admin
   */
  async getFeedbackById(req, res) {
    try {
      const { id } = req.params;
      
      const feedback = await Feedback.findById(id).populate('userId', 'fullname email avatar');
      
      if (!feedback) {
        return responseHelper.error(res, 'Không tìm thấy góp ý này', 404);
      }
      
      // Đánh dấu là đã đọc
      if (!feedback.isRead) {
        feedback.isRead = true;
        await feedback.save();
      }
      
      return responseHelper.success(res, { feedback });
    } catch (error) {
      console.error('Error getting feedback details:', error);
      return responseHelper.error(res, 'Đã có lỗi xảy ra khi lấy chi tiết góp ý', 500);
    }
  }

  /**
   * Cập nhật trạng thái góp ý
   * @route PATCH /api/feedback/:id
   * @access Admin
   */
  async updateFeedbackStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, responseMessage } = req.body;
      
      const feedback = await Feedback.findById(id);
      
      if (!feedback) {
        return responseHelper.error(res, 'Không tìm thấy góp ý này', 404);
      }
      
      // Cập nhật trạng thái
      if (status) {
        feedback.status = status;
      }
      
      // Cập nhật phản hồi
      if (responseMessage) {
        feedback.responseMessage = responseMessage;
      }
      
      await feedback.save();
      
      return responseHelper.success(res, { feedback }, 'Cập nhật trạng thái góp ý thành công');
    } catch (error) {
      console.error('Error updating feedback status:', error);
      return responseHelper.error(res, 'Đã có lỗi xảy ra khi cập nhật trạng thái góp ý', 500);
    }
  }

  /**
   * Xóa góp ý
   * @route DELETE /api/feedback/:id
   * @access Admin
   */
  async deleteFeedback(req, res) {
    try {
      const { id } = req.params;
      
      const feedback = await Feedback.findById(id);
      
      if (!feedback) {
        return responseHelper.error(res, 'Không tìm thấy góp ý này', 404);
      }
      
      await Feedback.findByIdAndDelete(id);
      
      return responseHelper.success(res, null, 'Xóa góp ý thành công');
    } catch (error) {
      console.error('Error deleting feedback:', error);
      return responseHelper.error(res, 'Đã có lỗi xảy ra khi xóa góp ý', 500);
    }
  }

  /**
   * Đánh dấu góp ý là đã đọc
   * @route PATCH /api/feedback/:id/read
   * @access Admin
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      
      const feedback = await Feedback.findById(id);
      
      if (!feedback) {
        return responseHelper.error(res, 'Không tìm thấy góp ý này', 404);
      }
      
      feedback.isRead = true;
      await feedback.save();
      
      return responseHelper.success(res, { feedback }, 'Đánh dấu đã đọc thành công');
    } catch (error) {
      console.error('Error marking feedback as read:', error);
      return responseHelper.error(res, 'Đã có lỗi xảy ra', 500);
    }
  }

  /**
   * Lấy số lượng góp ý chưa đọc
   * @route GET /api/feedback/unread/count
   * @access Admin
   */
  async getUnreadCount(req, res) {
    try {
      const count = await Feedback.countDocuments({ isRead: false });
      
      return responseHelper.success(res, { count });
    } catch (error) {
      console.error('Error getting unread feedback count:', error);
      return responseHelper.error(res, 'Đã có lỗi xảy ra', 500);
    }
  }
}

module.exports = new FeedbackController();