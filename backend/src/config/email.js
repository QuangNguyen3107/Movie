const nodemailer = require('nodemailer');
require('dotenv').config();

let transporterConfig;

if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    transporterConfig = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    };
} else {
    transporterConfig = {
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    };
}

const transporter = nodemailer.createTransport(transporterConfig);

const verifyEmailConfig = async () => {
    try {
        await transporter.verify();
        console.log('Email service is ready to send messages');
        return true;
    } catch (error) {
        console.error('Email service setup failed:', error);
        return false;
    }
};

module.exports = {
    transporter,
    verifyEmailConfig
};
