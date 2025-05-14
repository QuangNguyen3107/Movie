/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    FIREBASE_API_KEY: "AIzaSyDdn690CyAJC33U4bVpMEQ9Ps1ginNMEIM", // Thay thế bằng giá trị thực của bạn
    FIREBASE_AUTH_DOMAIN: "moviestreaming-d7210.firebaseapp.com", // Thay thế bằng giá trị thực của bạn
    FIREBASE_PROJECT_ID: "moviestreaming-d7210", // Thay thế bằng giá trị thực của bạn
    FIREBASE_STORAGE_BUCKET: "moviestreaming-d7210.firebasestorage.app", // Thay thế bằng giá trị thực của bạn
    FIREBASE_MESSAGING_SENDER_ID: "1005086405014", // Thay thế bằng giá trị thực của bạn
    FIREBASE_APP_ID: "1:1005086405014:web:e3231ff38c6b7ed83b2db7", // Thay thế bằng giá trị thực của bạn
  }
}

module.exports = nextConfig