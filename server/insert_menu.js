const { Sequelize, DataTypes } = require('sequelize');
const config = require('./config/config.js');

const sequelize = new Sequelize(config.development.database, config.development.username, config.development.password, {
  host: config.development.host,
  dialect: config.development.dialect,
  logging: false
});

async function insertMenu() {
  try {
    // 1. Insert into tabs
    const [tab] = await sequelize.query(`
      INSERT INTO tabs (name, icon, path, title, \`desc\`, createdAt, updatedAt)
      VALUES (
        'Master Wakalah', 
        'fa-solid fa-users', 
        'daftar_wakalah', 
        'Daftar Wakalah', 
        'Halaman ini digunakan untuk mengelola Master Wakalah.', 
        NOW(), 
        NOW()
      )
    `);
    console.log("Tab inserted", tab);

    // Get the ID of the new tab (or find it)
    const [tabsRows] = await sequelize.query("SELECT id FROM tabs WHERE path = 'daftar_wakalah'");
    const tabId = tabsRows[0].id;

    // 2. Insert into menus (or use an existing menu like "Master Data")
    // Let's find "Master Data" menu
    const [menuRows] = await sequelize.query("SELECT id FROM menus WHERE name LIKE '%Master%'");
    let menuId = menuRows.length > 0 ? menuRows[0].id : 1; 

    // 3. Insert into submenus
    const [submenu] = await sequelize.query(`
      INSERT INTO submenus (menu_id, name, path, tab, createdAt, updatedAt)
      VALUES (
        ${menuId},
        'Master Wakalah',
        '#',
        '[${tabId}]',
        NOW(),
        NOW()
      )
    `);
    console.log("Submenu inserted", submenu);

  } catch (error) {
    console.error(error.message);
  } finally {
    await sequelize.close();
  }
}

insertMenu();
