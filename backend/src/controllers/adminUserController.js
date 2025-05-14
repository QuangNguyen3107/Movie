// src/controllers/adminUserController.js

const User = require('../models/user');
const Role = require('../models/role');
const AccountType = require('../models/accountType');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const responseHelper = require('../utils/responseHelper');

/**
 * Lấy danh sách người dùng có phân trang
 */
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Áp dụng các bộ lọc nếu có
    const filter = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.role) {
      filter.role_id = req.query.role;
    }
    if (req.query.search) {
      filter.$or = [
        { fullname: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Tìm kiếm người dùng với populate roles và accountType
    const users = await User.find(filter)
      .populate('role_id', 'name')
      .populate('accountTypeId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Đếm tổng số người dùng
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    // Trả về kết quả
    return responseHelper.successResponse(res, 'Users retrieved successfully', {
      users: users.map(user => ({
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        avatar: user.avatar,
        role: user.role_id,
        accountType: user.accountTypeId,
        isActive: user.isActive !== false, // Handle undefined
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        usersPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error in getUsers:', error);
    return responseHelper.serverErrorResponse(res, 'Failed to retrieve users');
  }
};

/**
 * Lấy thông tin chi tiết của một người dùng theo ID
 */
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId)
      .populate('role_id', 'name')
      .populate('accountTypeId', 'name');

    if (!user) {
      return responseHelper.notFoundResponse(res, 'User not found');
    }

    // Không trả về password trong response
    const userData = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      address: user.address,
      phone: user.phone,
      date_of_birth: user.date_of_birth,
      avatar: user.avatar,
      bio: user.bio,
      favoriteGenres: user.favoriteGenres,
      role: user.role_id,
      accountType: user.accountTypeId,
      isActive: user.isActive !== false,
      googleId: user.googleId ? true : false,
      facebookId: user.facebookId ? true : false,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return responseHelper.successResponse(res, 'User retrieved successfully', userData);
  } catch (error) {
    console.error('Error in getUserById:', error);
    return responseHelper.serverErrorResponse(res, 'Failed to retrieve user');
  }
};

/**
 * Tạo người dùng mới (dành cho admin)
 */
exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHelper.badRequestResponse(res, 'Validation failed', errors.array());
    }

    const { fullname, email, password, role_id, accountTypeId, address, phone, date_of_birth } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return responseHelper.badRequestResponse(res, 'Email already in use');
    }

    // Kiểm tra role có tồn tại không
    const role = await Role.findById(role_id);
    if (!role) {
      return responseHelper.badRequestResponse(res, 'Invalid role');
    }

    // Kiểm tra accountType có tồn tại không
    const accountType = await AccountType.findById(accountTypeId);
    if (!accountType) {
      return responseHelper.badRequestResponse(res, 'Invalid account type');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Tạo người dùng mới
    const newUser = new User({
      fullname,
      email,
      password: hashedPassword,
      role_id,
      accountTypeId,
      address: address || null,
      phone: phone || null,
      date_of_birth: date_of_birth || null,
      isVerified: true // Admin created users are verified by default
    });

    await newUser.save();

    // Response không bao gồm password
    const userData = {
      _id: newUser._id,
      fullname: newUser.fullname,
      email: newUser.email,
      role: role_id,
      accountType: accountTypeId,
      createdAt: newUser.createdAt
    };

    return responseHelper.createdResponse(res, 'User created successfully', userData);
  } catch (error) {
    console.error('Error in createUser:', error);
    return responseHelper.serverErrorResponse(res, 'Failed to create user');
  }
};

/**
 * Cập nhật thông tin người dùng
 */
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { fullname, email, role_id, accountTypeId, address, phone, date_of_birth, isActive, password } = req.body;

    // Kiểm tra người dùng tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return responseHelper.notFoundResponse(res, 'User not found');
    }

    // Kiểm tra email có bị trùng không (nếu thay đổi email)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return responseHelper.badRequestResponse(res, 'Email already in use');
      }
    }

    // Kiểm tra role có tồn tại không (nếu thay đổi role)
    if (role_id) {
      const role = await Role.findById(role_id);
      if (!role) {
        return responseHelper.badRequestResponse(res, 'Invalid role');
      }
    }

    // Kiểm tra accountType có tồn tại không (nếu thay đổi accountType)
    if (accountTypeId) {
      const accountType = await AccountType.findById(accountTypeId);
      if (!accountType) {
        return responseHelper.badRequestResponse(res, 'Invalid account type');
      }
    }

    // Cập nhật thông tin người dùng
    if (fullname) user.fullname = fullname;
    if (email) user.email = email;
    if (role_id) user.role_id = role_id;
    if (accountTypeId) user.accountTypeId = accountTypeId;
    if (address !== undefined) user.address = address;
    if (phone !== undefined) user.phone = phone;
    if (date_of_birth !== undefined) user.date_of_birth = date_of_birth;
    if (isActive !== undefined) user.isActive = isActive;

    // Cập nhật password nếu có
    if (password) {
      user.password = await bcrypt.hash(password, 12);
    }

    await user.save();

    // Lấy thông tin đã cập nhật với populate
    const updatedUser = await User.findById(userId)
      .populate('role_id', 'name')
      .populate('accountTypeId', 'name');

    const userData = {
      _id: updatedUser._id,
      fullname: updatedUser.fullname,
      email: updatedUser.email,
      role: updatedUser.role_id,
      accountType: updatedUser.accountTypeId,
      address: updatedUser.address,
      phone: updatedUser.phone,
      date_of_birth: updatedUser.date_of_birth,
      isActive: updatedUser.isActive !== false,
      updatedAt: updatedUser.updatedAt
    };

    return responseHelper.successResponse(res, 'User updated successfully', userData);
  } catch (error) {
    console.error('Error in updateUser:', error);
    return responseHelper.serverErrorResponse(res, 'Failed to update user');
  }
};

/**
 * Xóa người dùng
 */
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Kiểm tra người dùng tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return responseHelper.notFoundResponse(res, 'User not found');
    }

    // Không cho phép xóa chính mình
    if (user._id.toString() === req.user._id.toString()) {
      return responseHelper.forbiddenResponse(res, 'Cannot delete yourself');
    }

    // Xóa người dùng
    await User.findByIdAndDelete(userId);

    return responseHelper.successResponse(res, 'User deleted successfully');
  } catch (error) {
    console.error('Error in deleteUser:', error);
    return responseHelper.serverErrorResponse(res, 'Failed to delete user');
  }
};

/**
 * Cấm người dùng
 */
exports.banUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Kiểm tra người dùng tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return responseHelper.notFoundResponse(res, 'User not found');
    }

    // Không cho phép cấm chính mình
    if (user._id.toString() === req.user._id.toString()) {
      return responseHelper.forbiddenResponse(res, 'Cannot ban yourself');
    }

    // Cập nhật trạng thái thành không hoạt động - Sử dụng findByIdAndUpdate để đảm bảo cập nhật thành công
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return responseHelper.notFoundResponse(res, 'Failed to update user status');
    }

    // Xác nhận lại trạng thái đã thay đổi
    console.log(`User ${userId} banned successfully. isActive set to: ${updatedUser.isActive}`);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User banned successfully',
      data: {
        user: {
          _id: updatedUser._id,
          fullname: updatedUser.fullname,
          email: updatedUser.email,
          isActive: false
        }
      }
    });
  } catch (error) {
    console.error('Error in banUser:', error);
    return responseHelper.serverErrorResponse(res, 'Failed to ban user');
  }
};

/**
 * Bỏ cấm người dùng
 */
exports.unbanUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Kiểm tra người dùng tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return responseHelper.notFoundResponse(res, 'User not found');
    }

    // Cập nhật trạng thái thành hoạt động - Sử dụng findByIdAndUpdate để đảm bảo cập nhật thành công
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return responseHelper.notFoundResponse(res, 'Failed to update user status');
    }

    // Xác nhận lại trạng thái đã thay đổi
    console.log(`User ${userId} unbanned successfully. isActive set to: ${updatedUser.isActive}`);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User unbanned successfully',
      data: {
        user: {
          _id: updatedUser._id,
          fullname: updatedUser.fullname,
          email: updatedUser.email,
          isActive: true
        }
      }
    });
  } catch (error) {
    console.error('Error in unbanUser:', error);
    return responseHelper.serverErrorResponse(res, 'Failed to unban user');
  }
};

/**
 * Thay đổi trạng thái hoạt động của người dùng (khóa/mở khóa)
 */
exports.toggleUserActiveStatus = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { isActive } = req.body; // Nhận giá trị isActive từ request body

    // Kiểm tra người dùng tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return responseHelper.notFoundResponse(res, 'User not found');
    }

    // Không cho phép thay đổi trạng thái chính mình
    if (user._id.toString() === req.user._id.toString()) {
      return responseHelper.forbiddenResponse(res, 'Cannot change your own status');
    }

    // Cập nhật trạng thái hoạt động
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive: isActive },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return responseHelper.notFoundResponse(res, 'Failed to update user status');
    }

    // Xác nhận lại trạng thái đã thay đổi
    console.log(`User ${userId} status changed successfully. isActive set to: ${updatedUser.isActive}`);

    // Gửi thông báo thời gian thực tới người dùng về thay đổi trạng thái tài khoản
    try {
      const websocket = req.app.get('websocket');
      if (websocket) {
        websocket.broadcast({
          type: 'account_status_changed',
          userId: userId,
          isActive: isActive,
          message: isActive 
            ? 'Tài khoản của bạn đã được mở khóa và hiện đang hoạt động bình thường.' 
            : 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.'
        });
        console.log(`Real-time notification sent to user ${userId} about account status change to ${isActive ? 'active' : 'locked'}`);
      }
    } catch (wsErr) {
      console.error('Error sending WebSocket notification for account status change:', wsErr);
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        user: {
          _id: updatedUser._id,
          fullname: updatedUser.fullname,
          email: updatedUser.email,
          isActive: updatedUser.isActive
        }
      }
    });
  } catch (error) {
    console.error('Error in toggleUserActiveStatus:', error);
    return responseHelper.serverErrorResponse(res, 'Failed to toggle user status');
  }
};

/**
 * Lấy danh sách vai trò
 */
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    
    return responseHelper.successResponse(res, 'Roles retrieved successfully', { roles });
  } catch (error) {
    console.error('Error in getRoles:', error);
    return responseHelper.serverErrorResponse(res, 'Failed to retrieve roles');
  }
};

/**
 * Tạo vai trò mới
 */
exports.createRole = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return responseHelper.badRequestResponse(res, 'Role name is required');
    }

    // Kiểm tra vai trò đã tồn tại chưa
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return responseHelper.badRequestResponse(res, 'Role already exists');
    }

    // Tạo vai trò mới
    const newRole = new Role({ name });
    await newRole.save();

    return responseHelper.createdResponse(res, 'Role created successfully', newRole);
  } catch (error) {
    console.error('Error in createRole:', error);
    return responseHelper.serverErrorResponse(res, 'Failed to create role');
  }
};

/**
 * Cập nhật vai trò
 */
exports.updateRole = async (req, res) => {
  try {
    const roleId = req.params.roleId;
    const { name } = req.body;

    if (!name) {
      return responseHelper.badRequestResponse(res, 'Role name is required');
    }

    // Kiểm tra vai trò tồn tại
    const role = await Role.findById(roleId);
    if (!role) {
      return responseHelper.notFoundResponse(res, 'Role not found');
    }

    // Kiểm tra tên vai trò đã tồn tại chưa
    const existingRole = await Role.findOne({ name, _id: { $ne: roleId } });
    if (existingRole) {
      return responseHelper.badRequestResponse(res, 'Role name already exists');
    }

    // Cập nhật vai trò
    role.name = name;
    await role.save();

    return responseHelper.successResponse(res, 'Role updated successfully', role);
  } catch (error) {
    console.error('Error in updateRole:', error);
    return responseHelper.serverErrorResponse(res, 'Failed to update role');
  }
};

/**
 * Xóa vai trò
 */
exports.deleteRole = async (req, res) => {
  try {
    const roleId = req.params.roleId;

    // Kiểm tra vai trò tồn tại
    const role = await Role.findById(roleId);
    if (!role) {
      return responseHelper.notFoundResponse(res, 'Role not found');
    }

    // Kiểm tra vai trò có đang được sử dụng không
    const usersWithRole = await User.countDocuments({ role_id: roleId });
    if (usersWithRole > 0) {
      return responseHelper.badRequestResponse(res, 'Cannot delete role because it is assigned to users');
    }

    // Xóa vai trò
    await Role.findByIdAndDelete(roleId);

    return responseHelper.successResponse(res, 'Role deleted successfully');
  } catch (error) {
    console.error('Error in deleteRole:', error);
    return responseHelper.serverErrorResponse(res, 'Failed to delete role');
  }
};

/**
 * Lấy danh sách loại tài khoản
 */
exports.getAccountTypes = async (req, res) => {
  try {
    const accountTypes = await AccountType.find().sort({ name: 1 });
    
    return responseHelper.successResponse(res, 'Account types retrieved successfully', { accountTypes });
  } catch (error) {
    console.error('Error in getAccountTypes:', error);
    return responseHelper.serverErrorResponse(res, 'Failed to retrieve account types');
  }
};