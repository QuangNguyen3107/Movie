const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/adminMiddleware');
const { rateLimiter } = require('../middlewares/rateLimitMiddleware');

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: Gửi góp ý từ người dùng
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên người dùng
 *               email:
 *                 type: string
 *                 description: Email người dùng
 *               subject:
 *                 type: string
 *                 description: Tiêu đề góp ý
 *               message:
 *                 type: string
 *                 description: Nội dung góp ý
 *               type:
 *                 type: string
 *                 enum: [bug, feature, content, other]
 *                 description: Loại góp ý
 *     responses:
 *       200:
 *         description: Gửi góp ý thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post('/', rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }), feedbackController.submitFeedback);

// Tất cả các routes phía dưới yêu cầu quyền admin
router.use(verifyToken, isAdmin);

/**
 * @swagger
 * /api/feedback:
 *   get:
 *     summary: Lấy danh sách góp ý người dùng (admin only)
 *     tags: [Feedback]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng kết quả trên mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, resolved]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [bug, feature, content, other]
 *         description: Lọc theo loại góp ý
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái đã đọc
 *     responses:
 *       200:
 *         description: Danh sách góp ý
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get('/', feedbackController.getAllFeedback);

/**
 * @swagger
 * /api/feedback/unread/count:
 *   get:
 *     summary: Lấy số lượng góp ý chưa đọc (admin only)
 *     tags: [Feedback]
 *     responses:
 *       200:
 *         description: Số lượng góp ý chưa đọc
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get('/unread/count', feedbackController.getUnreadCount);

/**
 * @swagger
 * /api/feedback/{id}:
 *   get:
 *     summary: Lấy chi tiết một góp ý (admin only)
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của góp ý
 *     responses:
 *       200:
 *         description: Chi tiết góp ý
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy góp ý
 *       500:
 *         description: Lỗi server
 */
router.get('/:id', feedbackController.getFeedbackById);

/**
 * @swagger
 * /api/feedback/{id}:
 *   patch:
 *     summary: Cập nhật trạng thái góp ý (admin only)
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của góp ý
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, reviewed, resolved]
 *               responseMessage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy góp ý
 *       500:
 *         description: Lỗi server
 */
router.patch('/:id', feedbackController.updateFeedbackStatus);

/**
 * @swagger
 * /api/feedback/{id}/read:
 *   patch:
 *     summary: Đánh dấu góp ý là đã đọc (admin only)
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của góp ý
 *     responses:
 *       200:
 *         description: Đánh dấu thành công
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy góp ý
 *       500:
 *         description: Lỗi server
 */
router.patch('/:id/read', feedbackController.markAsRead);

/**
 * @swagger
 * /api/feedback/{id}:
 *   delete:
 *     summary: Xóa góp ý (admin only)
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của góp ý
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy góp ý
 *       500:
 *         description: Lỗi server
 */
router.delete('/:id', feedbackController.deleteFeedback);

module.exports = router;