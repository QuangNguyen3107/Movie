const mongoose = require('mongoose');
const { UserSubscription } = require('../src/models/subscription');
const User = require('../src/models/user');
const config = require('../src/config/db');

mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected for expired subscription check'))
  .catch(err => console.error('MongoDB connection error:', err));

async function checkExpiredSubscriptions() {
  const now = new Date();
  try {
    const expiredSubscriptions = await UserSubscription.find({
      isActive: true,
      status: 'active',
      endDate: { $lt: now }
    }).populate('userId');

    for (const subscription of expiredSubscriptions) {
      try {
        subscription.isActive = false;
        subscription.status = 'expired';
        await subscription.save();
        const AccountType = require('../src/models/accountType');
        const normalAccountType = await AccountType.findOne({ name: 'Normal' });

        const Role = require('../src/models/role');
        const userRole = await Role.findOne({ name: 'User' });

        if (!normalAccountType) {
          continue;
        }
        const updateData = {
          isPremium: false,
          subscriptionEndDate: null
        };

        if (normalAccountType) {
          updateData.accountTypeId = normalAccountType._id;
        }

        if (userRole) {
          const user = await User.findById(subscription.userId).populate('role_id');
          if (!user.role_id || (user.role_id.name !== 'Admin' && user.role_id.name !== 'Moderator')) {
            updateData.role_id = userRole._id;
          }
        }

        const updatedUser = await User.findByIdAndUpdate(
          subscription.userId,
          updateData,
          { new: true }
        );
      } catch {
      }
    }
  } catch {
  } finally {

    mongoose.disconnect();
  }
}

checkExpiredSubscriptions();