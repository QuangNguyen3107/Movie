// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Apply authentication and admin-only middleware to all routes
// Using isAuthenticated instead of verifyToken to properly populate user data
router.use(authMiddleware.isAuthenticated);
router.use(adminMiddleware.isAdmin);

// User Management Routes
router.get('/users', adminUserController.getUsers);
router.get('/users/:userId', adminUserController.getUserById);
router.post('/users', adminUserController.createUser);
router.put('/users/:userId', adminUserController.updateUser);
router.delete('/users/:userId', adminUserController.deleteUser);
router.patch('/users/:userId/ban', adminUserController.banUser);
router.patch('/users/:userId/unban', adminUserController.unbanUser);
router.patch('/users/:userId/toggle-status', adminUserController.toggleUserActiveStatus);

// Role Management Routes
router.get('/roles', adminUserController.getRoles);
router.post('/roles', adminUserController.createRole);
router.put('/roles/:roleId', adminUserController.updateRole);
router.delete('/roles/:roleId', adminUserController.deleteRole);

// Account Type Routes
router.get('/account-types', adminUserController.getAccountTypes);

// Report Management Routes
router.get('/reports', reportController.getReports);
router.get('/reports/stats', reportController.getReportStats);
router.get('/reports/:reportId', reportController.getReportById);
router.patch('/reports/:reportId', reportController.updateReport);
router.delete('/reports/:reportId', reportController.deleteReport);

module.exports = router;