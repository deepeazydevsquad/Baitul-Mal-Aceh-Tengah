const { Sequelize } = require('sequelize');
const config = require('./config/config.js');

const sequelize = new Sequelize(config.development.database, config.development.username, config.development.password, {
  host: config.development.host,
  dialect: config.development.dialect,
  logging: false
});

async function checkSchema() {
  try {
    await sequelize.query("DELETE FROM submenus WHERE tab = '[56]';");
    await sequelize.query("DELETE FROM tabs WHERE id = 56;");
    console.log("Deleted redundant tab and submenu.");
  } catch (error) {
    console.error(error.message);
  } finally {
    await sequelize.close();
  }
}

checkSchema();
