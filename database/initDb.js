const { query } = require('./spiderApi');

async function initDb() {
  // Create products table (MariaDB syntax)
  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      photo_file_id VARCHAR(100) DEFAULT NULL,
      cost_price DECIMAL(12,2) DEFAULT 0,
      profit_percent DECIMAL(8,2) DEFAULT 0,
      stock INT DEFAULT 0,
      category VARCHAR(50) DEFAULT 'perfume',
      tags TEXT,
      extra_images TEXT,
      rating DECIMAL(4,1) DEFAULT 5.0,
      banner_file_id VARCHAR(100) DEFAULT NULL,
      esencia TEXT,
      active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create promotions table (MariaDB syntax)
  await query(`
    CREATE TABLE IF NOT EXISTS promotions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      image_file_id VARCHAR(100) NOT NULL,
      link TEXT DEFAULT NULL,
      display_order INT DEFAULT 0,
      active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Tablas verificadas: products, promotions');
}

module.exports = { initDb };
