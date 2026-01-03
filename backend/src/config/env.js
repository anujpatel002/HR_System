require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  APP_NAME: process.env.APP_NAME || 'DayFlow',
  APP_DESCRIPTION: process.env.APP_DESCRIPTION || 'Smart HR Management System',
  APP_COMPANY: process.env.APP_COMPANY || 'DayFlow'
};