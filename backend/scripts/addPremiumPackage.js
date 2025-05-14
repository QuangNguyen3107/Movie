// scripts/addPremiumPackage.js
const mongoose = require('mongoose');
const { SubscriptionPackage } = require('../src/models/subscription');
const AccountType = require('../src/models/accountType');
const { connectDB } = require('../src/config/db');

/**
 * Script tạo các gói Premium với nhiều mức giá khác nhau
 */
async function addPremiumPackages() {
  try {
    await connectDB();
    console.log('Bắt đầu thêm các gói Premium...');

    // Tìm loại tài khoản Premium
    const premiumAccountType = await AccountType.findOne({ name: 'Premium' });
    
    if (!premiumAccountType) {
      console.error('Không tìm thấy loại tài khoản Premium');
      // Tạo AccountType Premium nếu chưa có
      const newAccountType = new AccountType({
        name: 'Premium',
        description: 'Tài khoản Premium với đầy đủ quyền lợi'
      });
      await newAccountType.save();
      console.log('Đã tạo loại tài khoản Premium mới!');
      premiumAccountTypeId = newAccountType._id;
    } else {
      premiumAccountTypeId = premiumAccountType._id;
    }

    // Danh sách các gói cần thêm
    const packages = [
      {
        name: 'Starter',
        description: 'Gói khởi đầu với chi phí thấp, phù hợp cho người dùng mới',
        price: 15000,
        durationDays: 7, // 7 ngày
        features: [
          'Xem phim không quảng cáo',
          'Chất lượng HD',
          'Hỗ trợ trên mọi thiết bị'
        ],
        isActive: true,
        discount: 0
      },
      {
        name: 'Basic',
        description: 'Gói cơ bản với đầy đủ tính năng trong 30 ngày',
        price: 49000,
        durationDays: 30, // 30 ngày
        features: [
          'Xem phim không quảng cáo',
          'Chất lượng HD',
          'Hỗ trợ trên mọi thiết bị',
          'Xem offline'
        ],
        isActive: true,
        discount: 0
      },
      {
        name: 'Pro',
        description: 'Gói Premium đầy đủ trong 90 ngày với giá ưu đãi',
        price: 129000,
        durationDays: 90, // 90 ngày
        features: [
          'Xem phim không quảng cáo',
          'Chất lượng HD',
          'Hỗ trợ trên mọi thiết bị',
          'Xem offline',
          'Nội dung độc quyền'
        ],
        isActive: true,
        discount: 10
      },
      {
        name: 'VIP',
        description: 'Gói cao cấp nhất với đầy đủ đặc quyền trong 365 ngày',
        price: 399000,
        durationDays: 365, // 365 ngày
        features: [
          'Xem phim không quảng cáo',
          'Chất lượng HD & 4K',
          'Hỗ trợ trên mọi thiết bị',
          'Xem offline',
          'Nội dung độc quyền',
          'Ưu tiên xem phim mới',
          'Hỗ trợ khách hàng VIP 24/7'
        ],
        isActive: true,
        discount: 20
      }
    ];

    // Thêm từng gói
    for (const packageData of packages) {
      // Kiểm tra xem gói đã tồn tại chưa
      const existingPackage = await SubscriptionPackage.findOne({ name: packageData.name });
      
      if (existingPackage) {
        console.log(`Gói "${packageData.name}" đã tồn tại. Bỏ qua.`);
        continue;
      }

      // Tạo gói mới
      const newPackage = new SubscriptionPackage({
        ...packageData,
        accountTypeId: premiumAccountTypeId
      });

      await newPackage.save();
      console.log(`Đã thêm gói Premium "${packageData.name}" thành công!`);
    }
    
    console.log('Hoàn tất thêm các gói Premium!');
    
  } catch (error) {
    console.error('Lỗi khi thêm gói Premium:', error);
  } finally {
    // Đóng kết nối database
    await mongoose.connection.close();
    console.log('Đã đóng kết nối database');
  }
}

// Thực thi function
addPremiumPackages();