const express = require('express');
const router = express.Router();
const { query, esc } = require('../database/spiderApi');

// Helper: parse product JSON fields
function parseProduct(p) {
  if (!p) return null;
  try { p.tags = JSON.parse(p.tags || '[]'); } catch { p.tags = []; }
  try { p.extra_images = JSON.parse(p.extra_images || '[]'); } catch { p.extra_images = []; }
  try { p.esencia = JSON.parse(p.esencia || '{}'); } catch { p.esencia = {}; }
  p.sell_price = p.cost_price * (1 + (p.profit_percent || 0) / 100);
  return p;
}

// GET / - Index page
router.get('/', async (req, res) => {
  try {
    const { search = '', category = '', esencia_note = '' } = req.query;

    // Build filter
    let whereClauses = ['p.active = 1'];
    if (search) {
      const s = esc(`%${search}%`);
      whereClauses.push(`(p.name LIKE ${s} OR p.description LIKE ${s} OR p.tags LIKE ${s})`);
    }
    if (category) {
      whereClauses.push(`p.category = ${esc(category)}`);
    }
    if (esencia_note) {
      whereClauses.push(`p.esencia LIKE ${esc(`%"${esencia_note}"%`)}`);
    }

    const where = whereClauses.join(' AND ');

    // Fetch all active products
    const products = (await query(`
      SELECT * FROM products p WHERE ${where} ORDER BY rating DESC, created_at DESC
    `)).map(parseProduct);

    // Banner products: have banner, sorted by rating
    const bannerProducts = (await query(`
      SELECT * FROM products
      WHERE active = 1 AND banner_file_id IS NOT NULL AND banner_file_id != ''
      ORDER BY rating DESC
      LIMIT 5
    `)).map(parseProduct);

    // Active promotions
    const promotions = await query(`
      SELECT * FROM promotions WHERE active = 1 ORDER BY display_order ASC
    `);

    // Categories for filter and grouping
    let categories = [];
    try {
      const catRows = await query(`SELECT * FROM categories WHERE active = 1 ORDER BY name ASC`);
      if (catRows && catRows.length > 0) categories = catRows;
    } catch(e) {}
    if (categories.length === 0) {
      categories = [
        {name: 'perfume', icon: '🌸', color: '#a78bfa'},
        {name: 'crema', icon: '🧴', color: '#34d399'},
        {name: 'jabones', icon: '🧼', color: '#f59e0b'},
        {name: 'desodorantes', icon: '✨', color: '#60a5fa'}
      ];
    }

    // Top 6 products regardless of category
    const topProducts = (await query(`
      SELECT * FROM products WHERE active = 1 ORDER BY rating DESC, created_at DESC LIMIT 6
    `)).map(parseProduct);

    // All esencia notes for filter (collect unique)
    const allProducts = await query(`SELECT esencia FROM products WHERE active = 1`);
    const esenciaNotes = new Set();
    allProducts.forEach(p => {
      try {
        const e = JSON.parse(p.esencia || '{}');
        Object.keys(e).forEach(k => esenciaNotes.add(k));
      } catch {}
    });

    res.render('index', {
      title: 'Romaessence — Perfumes & Esencias · Mendoza',
      products,
      bannerProducts,
      promotions,
      categories,
      topProducts,
      esenciaNotes: [...esenciaNotes].sort(),
      search,
      selectedCategory: category,
      selectedEsencia: esencia_note
    });
  } catch (err) {
    console.error('Index error:', err);
    res.status(500).send('Error cargando el catálogo: ' + err.message);
  }
});

// GET /producto/:id - Product detail
router.get('/producto/:id', async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM products WHERE id = ${esc(req.params.id)} AND active = 1 LIMIT 1`);
    if (!rows || rows.length === 0) return res.status(404).redirect('/');

    const product = parseProduct(rows[0]);

    // Related products (same category, excluding current)
    const related = (await query(`
      SELECT * FROM products
      WHERE active = 1 AND category = ${esc(product.category)} AND id != ${esc(product.id)}
      ORDER BY rating DESC LIMIT 4
    `)).map(parseProduct);

    res.render('product', {
      title: `${product.name} — Romaessence`,
      product,
      related
    });
  } catch (err) {
    console.error('Product detail error:', err);
    res.status(500).send('Error: ' + err.message);
  }
});

module.exports = router;
