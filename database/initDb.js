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

  // Create categories table
  await query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      color VARCHAR(20) DEFAULT '#a78bfa',
      icon VARCHAR(10) DEFAULT '🏷️',
      active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default categories if none exist
  const existing = await query(`SELECT COUNT(*) as c FROM categories`);
  if ((existing[0]?.c || 0) === 0) {
    await query(`
      INSERT INTO categories (name, description, color, icon) VALUES
        ('perfume', 'Perfumes y fragancias', '#a78bfa', '🌸'),
        ('crema', 'Cremas corporales y faciales', '#34d399', '🧴'),
        ('jabones', 'Jabones artesanales', '#f59e0b', '🧼'),
        ('desodorantes', 'Desodorantes naturales', '#60a5fa', '✨')
    `);
  }

  console.log('✅ Tablas verificadas: products, promotions, categories');
}

module.exports = { initDb };
