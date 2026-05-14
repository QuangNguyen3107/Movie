// routes/userRoutes.js
const express = require('express');
const router = express.Router();

// Import controller và middlewares
const accountStatusController = require('../controllers/accountStatusController');
const { isAuthenticated } = require('../middlewares/authMiddleware'); // Middleware xác thực token

// Route kiểm tra trạng thái tài khoản
router.get(
  '/account/status',
  isAuthenticated, // Chỉ yêu cầu người dùng đăng nhập, không cần quyền đặc biệt
  accountStatusController.checkAccountStatus // Sử dụng controller với tên mới
);

module.exports = router; // Export router