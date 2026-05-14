
require('dotenv').config();
const cloudinary = require('../src/config/cloudinary');
const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, '../..', 'frontend/public/img/Logo.png');

async function uploadLogo() {
  try {
    if (!fs.existsSync(logoPath)) {
      console.error(`Logo không được tìm thấy tại đường dẫn: ${logoPath}`);
      return;
    }

    console.log('Đang tải logo lên Cloudinary...');

    const result = await cloudinary.uploader.upload(logoPath, {
      folder: 'emails',
      public_id: 'logo',
      overwrite: true,
      resource_type: 'image'
    });

    console.log('Tải lên thành công!');
    console.log('URL của logo:', result.secure_url);
    console.log('Vui lòng lưu URL này để sử dụng trong email template');

    return result.secure_url;
  } catch (error) {
    console.error('Lỗi khi tải logo lên Cloudinary:', error);
  }
}

uploadLogo();
