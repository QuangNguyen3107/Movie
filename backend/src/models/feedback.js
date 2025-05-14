const mongoose = require('mongoose');

/**
 * Schema lưu thông tin góp ý từ người dùng
 */
const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Có thể góp ý khi chưa đăng nhập
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String, 
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['bug', 'feature', 'content', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  responseMessage: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Cập nhật thời gian khi cập nhật document
feedbackSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

// Thêm index để tìm kiếm nhanh
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ type: 1 });
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ isRead: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;