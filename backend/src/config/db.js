const mongoose = require("mongoose");
require("dotenv").config();

mongoose.set('strictQuery', true);

const connectDB = async () => {
    try {
        const dbURI = process.env.MONGODB_URI || "mongodb://localhost:27017/netflix-clone";

        const mongooseOptions = {
            maxPoolSize: 50,
            minPoolSize: 5,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
            maxIdleTimeMS: 30000,
            bufferCommands: false,
            retryWrites: true,
            w: 'majority',
            readPreference: 'primaryPreferred',
        };

        try {
            mongooseOptions.compressors = 'zlib';
        } catch (error) {
            console.log('⚠️ Compression not supported, continuing without it');
        }

        await mongoose.connect(dbURI, mongooseOptions);
        console.log("✅ Kết nối MongoDB thành công với tối ưu hóa!");

        mongoose.connection.on('connected', () => {
            console.log('🔗 MongoDB connected to', dbURI);
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('📤 MongoDB disconnected');
        });

        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('🔐 MongoDB connection closed through app termination');
                process.exit(0);
            } catch (error) {
                console.error('❌ Error closing MongoDB connection:', error);
                process.exit(1);
            }
        });

    } catch (error) {
        console.error("❌ Lỗi kết nối MongoDB:", error);
        process.exit(1);
    }
};

module.exports = { connectDB };
