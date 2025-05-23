// src/controllers/notificationEmailController.js
const User = require('../models/user');
const EmailNotificationLog = require('../models/emailNotificationLog');
const { transporter } = require('../config/email');
const asyncHandler = require('express-async-handler');

/**
 * Lấy danh sách email người dùng dựa trên bộ lọc
 * @param {Object} filter - Bộ lọc MongoDB
 * @returns {Promise<Array>} Danh sách người dùng
 */
const getUsersByFilter = async (filter = {}) => {
    // Thêm trường isActive vào filter nếu chưa có
    const finalFilter = { ...filter };
    if (!('isActive' in finalFilter)) {
        finalFilter.isActive = true;
    }
    
    // Lấy danh sách người dùng
    return await User.find(finalFilter).select('email fullname');
};

/**
 * Gửi email tới danh sách người dùng (được chia thành các nhóm nhỏ)
 * @param {Object} options - Tùy chọn email
 * @param {string} options.subject - Tiêu đề email
 * @param {string} options.htmlContent - Nội dung HTML
 * @param {Array} options.users - Danh sách người dùng
 * @param {number} options.batchSize - Kích thước mỗi batch (mặc định là 50)
 * @returns {Promise<number>} Số lượng email đã gửi
 */
const sendEmailToBatches = async ({ subject, htmlContent, users, batchSize = 50 }) => {
    // Chia thành các nhóm nhỏ để tránh bị chặn
    const batches = [];
    for (let i = 0; i < users.length; i += batchSize) {
        batches.push(users.slice(i, i + batchSize));
    }
    
    let totalSent = 0;
    
    // Gửi email theo từng batch
    for (const batch of batches) {
        const emailList = batch.map(user => user.email);
        
        // Tạo nội dung email
        const emailContent = {
            from: process.env.EMAIL_USER,
            bcc: emailList, // Sử dụng BCC để ẩn danh sách người nhận
            subject: subject,
            html: htmlContent
        };
        
        // Gửi email
        await transporter.sendMail(emailContent);
        totalSent += emailList.length;
        
        // Chờ một chút trước khi gửi batch tiếp theo (để tránh rate limiting)
        if (batch !== batches[batches.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    return totalSent;
};

/**
 * @desc    Gửi email thông báo về bảo trì hệ thống đến các người dùng
 * @route   POST /api/admin/notifications/send-maintenance
 * @access  Private/Admin
 */
const sendMaintenanceNotification = asyncHandler(async (req, res) => {
    try {
        const { subject, message, maintenanceTime, expectedDuration, userGroup, customFilter } = req.body;
        
        if (!subject || !message || !maintenanceTime || !expectedDuration) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng cung cấp đầy đủ thông tin: tiêu đề, nội dung, thời gian bảo trì và thời gian dự kiến hoàn thành' 
            });
        }

        // Xây dựng query dựa vào userGroup
        let query = { isActive: true };
        
        if (userGroup === 'premium') {
            // Lọc người dùng premium
            query.accountTypeId = { $ne: null }; // Giả sử accountTypeId null là người dùng miễn phí
        } else if (userGroup === 'free') {
            // Lọc người dùng miễn phí
            query.accountTypeId = null; // Giả sử accountTypeId null là người dùng miễn phí
        }
        // Nếu userGroup là 'all' hoặc không được cung cấp, sử dụng query mặc định

        // Lấy danh sách email của người dùng phù hợp
        const users = await User.find(query).select('email fullname');
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng nào phù hợp với điều kiện'
            });
        }

        const emailList = users.map(user => user.email);
        
        // Tạo nội dung email
        const emailContent = {
            from: process.env.EMAIL_USER,
            bcc: emailList, // Sử dụng BCC để ẩn danh sách người nhận
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #e50914;">Thông Báo Bảo Trì Hệ Thống</h2>
                    <p>Kính gửi Quý khách hàng,</p>
                    <p>${message}</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p><strong>Thời gian bắt đầu bảo trì:</strong> ${maintenanceTime}</p>
                        <p><strong>Thời gian dự kiến hoàn thành:</strong> ${expectedDuration}</p>
                    </div>
                    <p>Chúng tôi xin lỗi vì sự bất tiện này và cảm ơn sự thông cảm của quý khách.</p>
                    <p>Trân trọng,<br>Đội ngũ hỗ trợ Movie Streaming</p>
                </div>
            `
        };        // Gửi email
        await transporter.sendMail(emailContent);

        // Lưu lịch sử gửi thông báo
        await EmailNotificationLog.create({
            subject,
            message,
            type: 'maintenance',
            userGroup: userGroup || 'all',
            sentBy: req.user._id, // Từ middleware auth
            recipientCount: emailList.length,
            status: 'success',
            metadata: {
                maintenanceTime,
                expectedDuration
            }
        });

        return res.status(200).json({
            success: true,
            message: `Đã gửi thông báo thành công đến ${emailList.length} người dùng`,
            count: emailList.length
        });    } catch (error) {
        console.error('Error sending maintenance notification:', error);
        
        // Lưu lịch sử lỗi nếu có thông tin người dùng 
        if (req.user && req.user._id) {
            try {
                await EmailNotificationLog.create({
                    subject: req.body.subject || 'Thông báo bảo trì',
                    message: req.body.message || '',
                    type: 'maintenance',
                    userGroup: req.body.userGroup || 'all',
                    sentBy: req.user._id,
                    recipientCount: 0,
                    status: 'failed',
                    errorMessage: error.message || 'Unknown error'
                });
            } catch (logError) {
                console.error('Error logging email failure:', logError);
            }
        }
        
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi gửi thông báo bảo trì',
            error: error.message
        });
    }
});

/**
 * @desc    Gửi email thông báo tùy chỉnh đến tất cả người dùng
 * @route   POST /api/admin/notifications/send-custom
 * @access  Private/Admin
 */
const sendCustomNotification = asyncHandler(async (req, res) => {
    try {
        const { subject, message, htmlContent, userGroup } = req.body;
        
        if (!subject || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng cung cấp đầy đủ tiêu đề và nội dung thông báo' 
            });
        }

        // Xây dựng query dựa vào userGroup
        let query = { isActive: true };
        
        if (userGroup === 'premium') {
            // Lọc người dùng premium
            query.accountTypeId = { $ne: null }; // Giả sử accountTypeId null là người dùng miễn phí
        } else if (userGroup === 'free') {
            // Lọc người dùng miễn phí
            query.accountTypeId = null; // Giả sử accountTypeId null là người dùng miễn phí
        }
        // Nếu userGroup là 'all' hoặc không được cung cấp, sử dụng query mặc định

        // Lấy danh sách email của người dùng phù hợp
        const users = await User.find(query).select('email fullname');
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng nào phù hợp với điều kiện'
            });
        }

        const emailList = users.map(user => user.email);
        
        // Tạo nội dung email
        const emailContent = {
            from: process.env.EMAIL_USER,
            bcc: emailList, // Sử dụng BCC để ẩn danh sách người nhận
            subject: subject,
            html: htmlContent || `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #e50914;">Thông Báo Từ Movie Streaming</h2>
                    <p>Kính gửi Quý khách hàng,</p>
                    <p>${message}</p>
                    <p>Trân trọng,<br>Đội ngũ hỗ trợ Movie Streaming</p>
                </div>
            `
        };        // Gửi email
        await transporter.sendMail(emailContent);

        // Lưu lịch sử gửi thông báo
        await EmailNotificationLog.create({
            subject,
            message,
            type: 'custom',
            userGroup: userGroup || 'all',
            sentBy: req.user._id, // Từ middleware auth
            recipientCount: emailList.length,
            status: 'success',
            metadata: {
                hasHtmlContent: !!htmlContent
            }
        });

        return res.status(200).json({
            success: true,
            message: `Đã gửi thông báo thành công đến ${emailList.length} người dùng`,
            count: emailList.length
        });    } catch (error) {
        console.error('Error sending custom notification:', error);
        
        // Lưu lịch sử lỗi nếu có thông tin người dùng 
        if (req.user && req.user._id) {
            try {
                await EmailNotificationLog.create({
                    subject: req.body.subject || 'Thông báo tùy chỉnh',
                    message: req.body.message || '',
                    type: 'custom',
                    userGroup: req.body.userGroup || 'all',
                    sentBy: req.user._id,
                    recipientCount: 0,
                    status: 'failed',
                    errorMessage: error.message || 'Unknown error'
                });
            } catch (logError) {
                console.error('Error logging email failure:', logError);
            }
        }
        
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi gửi thông báo tùy chỉnh',
            error: error.message
        });
  }
});

/**
 * @desc    Lấy lịch sử gửi thông báo email
 * @route   GET /api/admin/notifications/history
 * @access  Private/Admin
 */
const getNotificationHistory = asyncHandler(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Lấy tổng số bản ghi
        const total = await EmailNotificationLog.countDocuments();
        
        // Lấy lịch sử thông báo với phân trang và populate thông tin user
        const logs = await EmailNotificationLog.find()
            .sort({ createdAt: -1 }) // Sắp xếp mới nhất lên đầu
            .skip(skip)
            .limit(limit)
            .populate('sentBy', 'fullname email')
            .lean();
        
        return res.status(200).json({
            success: true,
            data: {
                logs,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching notification history:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử thông báo',
            error: error.message
        });
    }
});

module.exports = {
    sendMaintenanceNotification,
    sendCustomNotification,
    getNotificationHistory
};
