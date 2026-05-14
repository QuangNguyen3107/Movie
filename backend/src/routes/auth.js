const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Role = require("../models/role");
const AccountType = require("../models/accountType");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cloudinary = require('../config/cloudinary');

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, "../../uploads");
const avatarDir = path.join(uploadDir, "avatars");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir);
}

// Cấu hình multer để lưu file avatar
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, avatarDir);
    },
    filename: function (req, file, cb) {
        // Lấy ID người dùng từ token
        const token = req.headers.authorization?.split(' ')[1];
        let userId = "unknown";
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.userId;
            } catch (error) {
                console.error("Lỗi giải mã token:", error);
            }
        }
        
        // Tạo tên file duy nhất dựa trên userId, timestamp và extension gốc
        const fileExt = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `user_${userId}_${uniqueSuffix}${fileExt}`);
    }
});

// Giới hạn loại file và kích thước
const fileFilter = (req, file, cb) => {
    // Chỉ chấp nhận file hình ảnh
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file hình ảnh'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
    fileFilter: fileFilter
});

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Quản lý xác thực người dùng
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký người dùng mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               email:
 *                 type: string
 *                 example: "example@example.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *               retype_password:
 *                 type: string
 *                 example: "123456"
 *               address:
 *                 type: string
 *                 example: "Hà Nội, Việt Nam"
 *               phone:
 *                 type: string
 *                 example: "0987654321"
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "2000-01-01"
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Lỗi dữ liệu đầu vào (Mật khẩu không khớp, email đã tồn tại, v.v.)
 *       500:
 *         description: Lỗi hệ thống
 */
router.post("/register", async (req, res) => {
    const { fullname, email, password, retype_password, address, phone, date_of_birth } = req.body;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Email không hợp lệ" });
    }

    if (password !== retype_password) {
        return res.status(400).json({ error: "Mật khẩu không khớp!" });
    }

    try {
        // Kiểm tra email đã tồn tại chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email đã tồn tại" });
        }

        // Lấy ObjectId của Role (User) và AccountType (Normal hoặc VIP)
        const role = await Role.findOne({ name: "User" });
        const accountType = await AccountType.findOne({ name: "Normal" });  // Hoặc "VIP"
        console.log("Role:", role);
        console.log("AccountType:", accountType);
        if (!role || !accountType) {
            return res.status(400).json({ error: "Không tìm thấy vai trò hoặc loại tài khoản" });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo người dùng mới với ObjectId của Role và AccountType
        const newUser = await User.create({
            fullname,
            email,
            password: hashedPassword,
            address,
            phone,
            date_of_birth,
            role_id: role._id,
            accountTypeId: accountType._id,  // Liên kết với loại tài khoản
        });

        // Tạo token JWT
        const token = jwt.sign({ userId: newUser._id, email: newUser.email, role: newUser.role_id }, process.env.JWT_SECRET, { expiresIn: "2h" });

        res.status(201).json({ message: "Đăng ký thành công", token });
    } catch (error) {
        console.error("Lỗi đăng ký:", error);
        res.status(500).json({ error: "Lỗi hệ thống" });
    }
});


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập người dùng
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "example@example.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về token JWT
 *       400:
 *         description: Sai email hoặc mật khẩu
 *       500:
 *         description: Lỗi hệ thống
 */
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Email không hợp lệ" });
    }
    try {
        // Kiểm tra xem người dùng có tồn tại không
        const user = await User.findOne({ email }).populate("role_id").populate("accountTypeId");
        if (!user) {
            return res.status(400).json({ error: "Email không tồn tại" });
        }

        // Kiểm tra mật khẩu
        if (!user.password || typeof user.password !== 'string') {
            return res.status(400).json({ error: "Tài khoản này cần đặt lại mật khẩu. Vui lòng dùng chức năng Quên mật khẩu." });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Mật khẩu không đúng" });
        }

        // Kiểm tra trạng thái tài khoản
        if (user.isActive === false) {
            return res.status(403).json({ 
                error: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.",
                isAccountLocked: true,
                userId: user._id
            });
        }

        // Tạo token JWT - update for longer expiration
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role_id.name, accountType: user.accountTypeId.name },
            process.env.JWT_SECRET,
            { expiresIn: "7d" } // Changed from "2h" to "7d" (7 days)
        );

        // Generate refresh token
        const refreshToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            { expiresIn: "30d" } // 30 days
        );

        res.status(200).json({ 
            message: "Đăng nhập thành công", 
            token,
            refreshToken 
        });
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        res.status(500).json({ error: "Lỗi hệ thống" });
    }
});

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Thay đổi mật khẩu người dùng (sử dụng token)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 example: "newpassword123"
 *               confirmPassword:
 *                 type: string
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Thay đổi mật khẩu thành công
 *       400:
 *         description: Mật khẩu cũ không đúng hoặc dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Không có quyền truy cập hoặc token không hợp lệ
 *       404:
 *         description: Người dùng không tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
router.post("/change-password", async (req, res) => {
    try {
        // Lấy thông tin người dùng từ token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: "Không có token xác thực" });
        }

        // Giải mã token để lấy userId
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Kiểm tra xác nhận mật khẩu mới
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: "Mật khẩu mới không khớp với xác nhận mật khẩu" });
        }

        // Kiểm tra mật khẩu mới hợp lệ (ví dụ: độ dài)
        if (newPassword.length < 6) {
            return res.status(400).json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự" });
        }

        // Tìm người dùng theo userId
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "Người dùng không tồn tại" });
        }

        // Kiểm tra mật khẩu hiện tại
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Mật khẩu hiện tại không đúng" });
        }

        // Mã hóa mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        // Lưu thông tin người dùng đã thay đổi mật khẩu
        await user.save();

        res.status(200).json({ 
            success: true,
            message: "Thay đổi mật khẩu thành công" 
        });
    } catch (error) {
        console.error("Lỗi thay đổi mật khẩu:", error);
        
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ error: "Token không hợp lệ" });
        }
        
        res.status(500).json({ error: "Lỗi hệ thống" });
    }
});


/**
 * @swagger
 * /api/auth/update:
 *   put:
 *     summary: Cập nhật thông tin người dùng
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "605c72ef153207001f85eaf"
 *               fullname:
 *                 type: string
 *                 example: "Nguyễn Văn B"
 *               email:
 *                 type: string
 *                 example: "newemail@example.com"
 *               address:
 *                 type: string
 *                 example: "Hà Nội, Việt Nam"
 *               phone:
 *                 type: string
 *                 example: "0987654321"
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "1995-01-01"
 *     responses:
 *       200:
 *         description: Cập nhật thông tin thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       404:
 *         description: Người dùng không tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
router.put("/update", async (req, res) => {
    const { userId, fullname, email, address, phone, date_of_birth } = req.body;

    try {
        // Tìm người dùng theo userId
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "Người dùng không tồn tại" });
        }

        // Cập nhật thông tin người dùng
        user.fullname = fullname || user.fullname;
        user.email = email || user.email;
        user.address = address || user.address;
        user.phone = phone || user.phone;
        user.date_of_birth = date_of_birth || user.date_of_birth;

        // Lưu thông tin người dùng đã cập nhật
        await user.save();

        res.status(200).json({ message: "Cập nhật thông tin thành công", user });
    } catch (error) {
        console.error("Lỗi cập nhật thông tin người dùng:", error);
        res.status(500).json({ error: "Lỗi hệ thống" });
    }
});


/**
 * @swagger
 * /api/auth/user-detail:
 *   get:
 *     summary: Lấy thông tin chi tiết người dùng
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin chi tiết người dùng
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Người dùng không tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
router.get("/user-detail", async (req, res) => {
  try {
    // Lấy thông tin người dùng từ token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "Không có token xác thực" });
    }

    // Giải mã token để lấy userId
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Tìm người dùng theo userId và populate các trường liên quan
    const user = await User.findById(userId)
      .populate("role_id")
      .populate("accountTypeId");

    if (!user) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }

    // Trả về thông tin chi tiết người dùng
    const userDetail = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      address: user.address || "",
      phone: user.phone || "",
      date_of_birth: user.date_of_birth || "",
      role: user.role_id?.name || "User",
      accountType: user.accountTypeId?.name || "Normal",
      bio: user.bio || "",
      favoriteGenres: user.favoriteGenres || [],
      avatar: user.avatar || ""
    };

    res.status(200).json({ user: userDetail });
  } catch (error) {
    console.error("Lỗi lấy thông tin chi tiết người dùng:", error);
    
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Token không hợp lệ" });
    }
    
    res.status(500).json({ error: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/auth/update-profile:
 *   put:
 *     summary: Cập nhật thông tin người dùng (sử dụng token)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *                 example: "Nguyễn Văn B"
 *               address:
 *                 type: string
 *                 example: "Hà Nội, Việt Nam"
 *               phone:
 *                 type: string
 *                 example: "0987654321"
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "1995-01-01"
 *               bio:
 *                 type: string
 *                 example: "Thích xem phim hành động"
 *               favoriteGenres:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Hành động", "Viễn tưởng"]
 *     responses:
 *       200:
 *         description: Cập nhật thông tin thành công
 *       401:
 *         description: Không có quyền truy cập hoặc token không hợp lệ
 *       404:
 *         description: Người dùng không tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
router.put("/update-profile", async (req, res) => {
    try {
        // Lấy thông tin người dùng từ token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: "Không có token xác thực" });
        }

        // Giải mã token để lấy userId
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // Lấy thông tin cập nhật từ body request
        const { fullname, address, phone, date_of_birth, bio, favoriteGenres } = req.body;

        // Tìm người dùng theo userId
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "Người dùng không tồn tại" });
        }

        // Cập nhật thông tin người dùng
        if (fullname) user.fullname = fullname;
        if (address !== undefined) user.address = address;
        if (phone !== undefined) user.phone = phone;
        if (date_of_birth !== undefined) user.date_of_birth = date_of_birth;
        if (bio !== undefined) user.bio = bio;
        if (favoriteGenres) user.favoriteGenres = favoriteGenres;

        // Lưu thông tin đã cập nhật
        await user.save();

        // Trả về thông tin chi tiết người dùng đã cập nhật
        const userDetail = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            address: user.address || "",
            phone: user.phone || "",
            date_of_birth: user.date_of_birth || "",
            role: decoded.role || "User",
            accountType: decoded.accountType || "Normal",
            bio: user.bio || "",
            favoriteGenres: user.favoriteGenres || [],
            avatar: user.avatar || ""
        };

        res.status(200).json({ 
            success: true,
            message: "Cập nhật thông tin thành công", 
            user: userDetail 
        });
    } catch (error) {
        console.error("Lỗi cập nhật thông tin người dùng:", error);
        
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ error: "Token không hợp lệ" });
        }
        
        res.status(500).json({ error: "Lỗi hệ thống" });
    }
});

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh an expired access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token provided during login
 *     responses:
 *       200:
 *         description: New access token generated successfully
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Server error
 */
router.post("/refresh-token", async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({ error: "Refresh token is required" });
        }
        
        // Verify the refresh token
        const decoded = jwt.verify(
            refreshToken, 
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
        );
        
        // Find the user
        const user = await User.findById(decoded.userId)
            .populate("role_id")
            .populate("accountTypeId");
            
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Generate a new access token
        const newToken = jwt.sign(
            { 
                userId: user._id, 
                email: user.email, 
                role: user.role_id.name, 
                accountType: user.accountTypeId.name 
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        
        res.status(200).json({
            success: true,
            message: "New access token generated successfully",
            token: newToken
        });
    } catch (error) {
        console.error("Error refreshing token:", error);
        
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Invalid or expired refresh token" });
        }
        
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @swagger
 * /api/auth/upload-avatar:
 *   post:
 *     summary: Upload avatar người dùng sử dụng Cloudinary
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: File hình ảnh avatar
 *     responses:
 *       200:
 *         description: Upload avatar thành công
 *       400:
 *         description: File không hợp lệ hoặc không có file được gửi
 *       401:
 *         description: Không có quyền truy cập hoặc token không hợp lệ
 *       404:
 *         description: Người dùng không tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
router.post("/upload-avatar", upload.single('avatar'), async (req, res) => {
    try {
        console.log("=== UPLOAD AVATAR REQUEST WITH CLOUDINARY ===");
        console.log("Headers:", JSON.stringify(req.headers));
        
        // Kiểm tra file đã được upload
        if (!req.file) {
            console.log("❌ Không có file nào được gửi lên");
            return res.status(400).json({ error: "Không có file nào được gửi lên" });
        }
        
        console.log("✅ Nhận được file:", req.file);
        console.log("File path:", req.file.path);
        console.log("File mimetype:", req.file.mimetype);
        console.log("File size:", req.file.size);

        // Lấy thông tin người dùng từ token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            console.log("❌ Không có token xác thực");
            return res.status(401).json({ error: "Không có token xác thực" });
        }

        // Giải mã token để lấy userId
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("✅ Token hợp lệ, userId:", decoded.userId);
        } catch (tokenError) {
            console.log("❌ Token không hợp lệ:", tokenError.message);
            return res.status(401).json({ error: "Token không hợp lệ" });
        }
        
        const userId = decoded.userId;

        // Tìm người dùng theo userId
        console.log("🔍 Tìm người dùng với ID:", userId);
        const user = await User.findById(userId);
        if (!user) {
            console.log("❌ Không tìm thấy người dùng");
            return res.status(404).json({ error: "Người dùng không tồn tại" });
        }
        
        console.log("✅ Đã tìm thấy người dùng:", user.email);

        // Import Cloudinary
        const cloudinary = require('../config/cloudinary');
        
        // Upload file lên Cloudinary
        console.log("☁️ Tải lên Cloudinary...");
        const cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
            folder: "movie-streaming/avatars",
            public_id: `user_${userId}_${Date.now()}`,
            resource_type: "image",
            transformation: [
                { width: 500, height: 500, crop: "limit" },
                { quality: "auto" }
            ]
        });
        
        console.log("☁️ Kết quả từ Cloudinary:", cloudinaryResult.secure_url);
        
        // Xóa file tạm sau khi upload lên Cloudinary
        try {
            fs.unlinkSync(req.file.path);
            console.log("✅ Đã xóa file tạm:", req.file.path);
        } catch (err) {
            console.log("⚠️ Không thể xóa file tạm:", err);
        }

        // Nếu người dùng đã có Cloudinary ID cho avatar cũ, xóa nó
        if (user.cloudinaryPublicId) {
            try {
                await cloudinary.uploader.destroy(user.cloudinaryPublicId);
                console.log("☁️ Đã xóa avatar cũ từ Cloudinary:", user.cloudinaryPublicId);
            } catch (cloudinaryError) {
                console.log("⚠️ Không thể xóa avatar cũ từ Cloudinary:", cloudinaryError);
            }
        }

        // Cập nhật đường dẫn avatar mới vào DB (sử dụng URL Cloudinary)
        user.avatar = cloudinaryResult.secure_url;
        user.cloudinaryPublicId = cloudinaryResult.public_id;
        
        try {
            await user.save();
            console.log("✅ Đã lưu đường dẫn avatar mới vào DB:", user.avatar);
        } catch (saveError) {
            console.log("❌ Lỗi khi lưu vào MongoDB:", saveError);
            return res.status(500).json({ error: "Lỗi khi lưu avatar vào cơ sở dữ liệu" });
        }

        // Trả về kết quả
        console.log("✅ Upload avatar thành công");
        res.status(200).json({
            success: true,
            message: "Upload avatar thành công",
            avatarUrl: cloudinaryResult.secure_url,
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                avatar: user.avatar,
                address: user.address || "",
                phone: user.phone || "",
                date_of_birth: user.date_of_birth || "",
                bio: user.bio || "",
                favoriteGenres: user.favoriteGenres || []
            }
        });
    } catch (error) {
        console.error("❌ Lỗi chung khi upload avatar:", error);
        
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ error: "Token không hợp lệ" });
        }
        
        if (error.name === "MulterError") {
            if (error.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ error: "Kích thước file quá lớn. Tối đa 5MB" });
            }
            return res.status(400).json({ error: `Lỗi upload: ${error.message}` });
        }
        
        res.status(500).json({ error: `Lỗi hệ thống: ${error.message}` });
    }
});

/**
 * @swagger
 * /api/auth/google-login:
 *   post:
 *     summary: Đăng nhập/Đăng ký với Google
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@gmail.com"
 *               name:
 *                 type: string
 *                 example: "Google User"
 *               googleId:
 *                 type: string
 *                 example: "123456789012345678901"
 *               picture:
 *                 type: string
 *                 example: "https://lh3.googleusercontent.com/a/photo.jpg"
 *     responses:
 *       200:
 *         description: Đăng nhập/Đăng ký Google thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       500:
 *         description: Lỗi hệ thống
 */
router.post("/google-login", async (req, res) => {
  try {
    console.log("=== GOOGLE LOGIN REQUEST ===");
    const { email, name, googleId, picture } = req.body;
    
    console.log("Google login data:", { email, name, googleId, picture });
    
    if (!email || !googleId) {
      return res.status(400).json({ error: "Email và Google ID là bắt buộc" });
    }
    
    console.log(`Đang xử lý đăng nhập Google cho ${email}`);
    
    // First, try to find a user with exactly matching email and googleId
    let user = await User.findOne({ 
      email: email,
      googleId: googleId 
    }).populate("role_id").populate("accountTypeId");
    
    // If exact match found, proceed with login
    if (user) {
      console.log("Đã tìm thấy tài khoản chính xác với cả email và Google ID:", user.email);
    } 
    // If no exact match, check if user exists with this googleId (but different email)
    else {
      const userByGoogleId = await User.findOne({ googleId: googleId })
        .populate("role_id").populate("accountTypeId");
      
      if (userByGoogleId) {
        console.log("⚠️ Tìm thấy tài khoản với Google ID này nhưng email khác");
        console.log(`Google ID này đã được liên kết với email: ${userByGoogleId.email}`);
        
        return res.status(400).json({ 
          error: `Tài khoản Google này đã được liên kết với email khác (${userByGoogleId.email}). Vui lòng sử dụng email đó để đăng nhập.`
        });
      }
      
      // Next, check if user exists with this email (but no googleId)
      const userByEmail = await User.findOne({ 
        email: email,
        $or: [
          { googleId: { $exists: false } },
          { googleId: null }
        ]
      }).populate("role_id").populate("accountTypeId");
      
      if (userByEmail) {
        console.log("Tìm thấy người dùng đã tồn tại:", userByEmail.email);
        
        // Cho phép liên kết tài khoản nếu email trùng khớp, bất kể có mật khẩu hay không
        console.log("Cập nhật Google ID cho tài khoản hiện có");
        
        // If user exists with email, update their account with Google ID
        console.log("Cập nhật Google ID cho tài khoản hiện có");
        userByEmail.googleId = googleId;
        
        // Update avatar if user doesn't have one
        if (picture && (userByEmail.avatar === "/img/avatar.png" || !userByEmail.avatar)) {
          console.log("Cập nhật avatar từ Google:", picture);
          userByEmail.avatar = picture;
        }
        
        await userByEmail.save();
        user = userByEmail;
      }
    }
    
    // If no user was found or linked, create a new account
    if (!user) {
      console.log("Tạo tài khoản mới với Google");
      
      // Lấy ObjectId của Role (User) và AccountType (Normal)
      const role = await Role.findOne({ name: "User" });
      const accountType = await AccountType.findOne({ name: "Normal" });
      
      if (!role || !accountType) {
        return res.status(400).json({ error: "Không tìm thấy vai trò hoặc loại tài khoản" });
      }
      
      // Tạo người dùng mới kèm avatar từ Google
      user = new User({
        fullname: name,
        email: email,
        googleId: googleId,
        password: null, // No password for Google users
        avatar: picture || "", // Lưu URL avatar từ Google
        role_id: role._id,
        accountTypeId: accountType._id,
        isVerified: true // Người dùng Google đã được xác minh email
      });
      
      await user.save();
      console.log("Đã tạo tài khoản mới với avatar:", user.avatar);
      
      // Populate role_id và accountTypeId sau khi tạo
      user = await User.findById(user._id)
        .populate("role_id")
        .populate("accountTypeId");
    }
    
    // Tạo token JWT
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role_id.name, 
        accountType: user.accountTypeId.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    // Tạo refresh token
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    
    console.log("Đăng nhập Google thành công cho:", user.email);
    console.log("Avatar URL sau khi đăng nhập:", user.avatar);
    
    // Trả về token và thông tin người dùng
    res.status(200).json({
      token,
      refreshToken,
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role_id.name,
        accountType: user.accountTypeId.name,
        avatar: user.avatar || "", // Đảm bảo trả về avatar
        address: user.address || "",
        phone: user.phone || "",
        date_of_birth: user.date_of_birth || "",
        bio: user.bio || "",
        favoriteGenres: user.favoriteGenres || []
      }
    });
  } catch (error) {
    console.error("Lỗi đăng nhập Google:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi xử lý đăng nhập Google" });
  }
});

/**
 * @swagger
 * /api/auth/facebook-login:
 *   post:
 *     summary: Đăng nhập/Đăng ký với Facebook
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@gmail.com"
 *               name:
 *                 type: string
 *                 example: "Facebook User"
 *               facebookId:
 *                 type: string
 *                 example: "123456789012345"
 *               picture:
 *                 type: string
 *                 example: "https://platform-lookaside.fbsbx.com/photo.jpg"
 *     responses:
 *       200:
 *         description: Đăng nhập/Đăng ký Facebook thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       500:
 *         description: Lỗi hệ thống
 */
router.post("/facebook-login", async (req, res) => {
  try {
    console.log("=== FACEBOOK LOGIN REQUEST ===");
    const { email, name, facebookId, picture } = req.body;
    
    if (!email || !facebookId) {
      return res.status(400).json({ error: "Email và Facebook ID là bắt buộc" });
    }
    
    console.log(`Đang xử lý đăng nhập Facebook cho ${email}`);
    
    // Tìm người dùng theo email hoặc facebookId
    let user = await User.findOne({ 
      $or: [{ email: email }, { facebookId: facebookId }] 
    }).populate("role_id").populate("accountTypeId");
    
    if (user) {
      console.log("Tìm thấy người dùng đã tồn tại:", user.email);
      
      // Cập nhật thông tin Facebook nếu cần
      if (!user.facebookId) {
        user.facebookId = facebookId;
        console.log("Cập nhật Facebook ID cho tài khoản hiện có");
      }
      
      // Cập nhật avatar nếu có
      if (picture && !user.avatar) {
        user.avatar = picture;
        console.log("Cập nhật avatar từ Facebook");
      }
      
      await user.save();
    } else {
      console.log("Tạo tài khoản mới với Facebook");
      
      // Lấy ObjectId của Role (User) và AccountType (Normal)
      const role = await Role.findOne({ name: "User" });
      const accountType = await AccountType.findOne({ name: "Normal" });
      
      if (!role || !accountType) {
        return res.status(400).json({ error: "Không tìm thấy vai trò hoặc loại tài khoản" });
      }
      
      // Tạo người dùng mới
      user = new User({
        fullname: name,
        email: email,
        facebookId: facebookId,
        avatar: picture || "",
        role_id: role._id,
        accountTypeId: accountType._id,
        isVerified: true // Người dùng Facebook đã được xác minh email
      });
      
      await user.save();
      console.log("Đã tạo tài khoản mới:", user.email);
      
      // Populate role_id và accountTypeId sau khi tạo
      user = await User.findById(user._id)
        .populate("role_id")
        .populate("accountTypeId");
    }
    
    // Tạo token JWT
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role_id.name, 
        accountType: user.accountTypeId.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    // Tạo refresh token
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    
    console.log("Đăng nhập Facebook thành công cho:", user.email);
    
    // Trả về token và thông tin người dùng
    res.status(200).json({
      token,
      refreshToken,
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role_id.name,
        accountType: user.accountTypeId.name,
        avatar: user.avatar || "",
        address: user.address || "",
        phone: user.phone || "",
        date_of_birth: user.date_of_birth || "",
        bio: user.bio || "",
        favoriteGenres: user.favoriteGenres || []
      }
    });
  } catch (error) {
    console.error("Lỗi đăng nhập Facebook:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi xử lý đăng nhập Facebook" });
  }
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Gửi email quên mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Email đặt lại mật khẩu đã được gửi
 *       400:
 *         description: Email không tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email là bắt buộc" });
    }

    // Tìm người dùng theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Email không tồn tại trong hệ thống" });
    }

    // Tạo token reset password
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Lưu token và thời gian hết hạn (15 phút)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 phút
    await user.save();

    // Gửi email
    const { transporter } = require('../config/email');
    
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Đặt lại mật khẩu - Movie Streaming',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Đặt lại mật khẩu</h2>
          <p>Xin chào,</p>
          <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Movie Streaming của mình.</p>
          <p>Vui lòng nhấp vào liên kết bên dưới để đặt lại mật khẩu:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetURL}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Đặt lại mật khẩu</a>
          </div>
          <p>Liên kết này sẽ hết hạn sau 15 phút.</p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">Đây là email tự động, vui lòng không trả lời.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      success: true,
      message: "Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn." 
    });
  } catch (error) {
    console.error("Lỗi gửi email quên mật khẩu:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi gửi email" });
  }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu với token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: "abc123xyz789"
 *               newPassword:
 *                 type: string
 *                 example: "newpassword123"
 *               confirmPassword:
 *                 type: string
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Mật khẩu đã được đặt lại thành công
 *       400:
 *         description: Token không hợp lệ hoặc mật khẩu không khớp
 *       500:
 *         description: Lỗi hệ thống
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "Tất cả các trường đều bắt buộc" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Mật khẩu xác nhận không khớp" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Mật khẩu phải có ít nhất 6 ký tự" });
    }

    // Tìm người dùng với token hợp lệ và chưa hết hạn
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Token không hợp lệ hoặc đã hết hạn" });
    }

    // Cập nhật mật khẩu
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ 
      success: true,
      message: "Mật khẩu đã được đặt lại thành công" 
    });
  } catch (error) {
    console.error("Lỗi đặt lại mật khẩu:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi đặt lại mật khẩu" });
  }
});

module.exports = router;
