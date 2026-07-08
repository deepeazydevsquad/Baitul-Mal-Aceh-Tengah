require('dotenv').config();

const common = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || null,
  host: process.env.DB_HOST || '127.0.0.1',
  dialect: 'mysql'
};

module.exports = {
  development: {
    ...common,
    database: process.env.DB_NAME || 'db'
  },
  test: {
    ...common,
    database: process.env.DB_NAME_TEST || 'db'
  },
  production: {
    ...common,
    database: process.env.DB_NAME || 'db'
  }
};