const mongoose = require('mongoose');
const { SubscriptionPackage } = require('../src/models/subscription');
const AccountType = require('../src/models/accountType');
const { connectDB } = require('../src/config/db');

async function addPremiumPackages() {
  try {
    await connectDB();
    const premiumAccountType = await AccountType.findOne({ name: 'Premium' });

    if (!premiumAccountType) {
      const newAccountType = new AccountType({
        name: 'Premium',
        description: 'Tài khoản Premium với đầy đủ quyền lợi'
      });
      await newAccountType.save();
      premiumAccountTypeId = newAccountType._id;
    } else {
      premiumAccountTypeId = premiumAccountType._id;
    }

    const packages = [
      {
        name: 'Cơ bản',
        description: 'Không hiển thị quảng cáo ở màn hình chính',
        price: 10000,
        durationDays: 30,
        features: [
          'Không hiển thị quảng cáo ở màn hình chính',
          'Trải nghiệm giao diện tốt hơn',
          'Hỗ trợ trên mọi thiết bị'
        ],
        isActive: true,
        discount: 0
      },
      {
        name: 'Premium',
        description: 'Trải nghiệm không quảng cáo hoàn toàn khi xem phim',
        price: 15000,
        durationDays: 30,
        features: [
          'Không hiển thị quảng cáo ở màn hình chính',
          'Không hiển thị video quảng cáo khi bấm vào nút play để xem phim',
          'Trải nghiệm xem phim tốt nhất',
          'Hỗ trợ trên mọi thiết bị'
        ],
        isActive: true,
        discount: 0
      }
    ];

    for (const packageData of packages) {
      const existingPackage = await SubscriptionPackage.findOne({ name: packageData.name });

      if (existingPackage) {
        continue;
      }

      const newPackage = new SubscriptionPackage({
        ...packageData,
        accountTypeId: premiumAccountTypeId
      });

      await newPackage.save();
    }

  } catch {
  } finally {
    await mongoose.connection.close();
  }
}
addPremiumPackages();