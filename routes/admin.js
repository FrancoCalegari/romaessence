const express = require('express');
const router = express.Router();
const multer = require('multer');
const { query, uploadFile, deleteFile, esc } = require('../database/spiderApi');
const { requireAuth } = require('../middleware/auth');

// Multer: memory storage (files go to Spider API)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

const CATEGORIES = ['perfume', 'crema', 'jabones', 'desodorantes'];

function parseProduct(p) {
  if (!p) return null;
  try { p.tags = JSON.parse(p.tags || '[]'); } catch { p.tags = []; }
  try { p.extra_images = JSON.parse(p.extra_images || '[]'); } catch { p.extra_images = []; }
  try { p.esencia = JSON.parse(p.esencia || '{}'); } catch { p.esencia = {}; }
  p.sell_price = p.cost_price * (1 + (p.profit_percent || 0) / 100);
  return p;
}

// ─── AUTH ───────────────────────────────────────────────────────────────────

// GET /admin → redirect
router.get('/', requireAuth, (req, res) => res.redirect('/admin/dashboard'));

// GET /admin/login
router.get('/login', (req, res) => {
  if (req.session.admin) return res.redirect('/admin/dashboard');
  res.render('admin/login', { title: 'Admin — Romaessence', error: null });
});

// POST /admin/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    req.session.admin = true;
    const returnTo = req.session.returnTo || '/admin/dashboard';
    delete req.session.returnTo;
    return res.redirect(returnTo);
  }
  res.render('admin/login', { title: 'Admin — Romaessence', error: 'Credenciales incorrectas' });
});

// GET /admin/logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// ─── DASHBOARD ──────────────────────────────────────────────────────────────

router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const [totalProds, activeProds, noStockProds, totalPromos, activePromos] = await Promise.all([
      query(`SELECT COUNT(*) as c FROM products`),
      query(`SELECT COUNT(*) as c FROM products WHERE active = 1`),
      query(`SELECT COUNT(*) as c FROM products WHERE stock = 0 AND active = 1`),
      query(`SELECT COUNT(*) as c FROM promotions`),
      query(`SELECT COUNT(*) as c FROM promotions WHERE active = 1`)
    ]);

    const recentProducts = (await query(
      `SELECT * FROM products ORDER BY created_at DESC LIMIT 5`
    )).map(parseProduct);

    res.render('admin/dashboard', {
      title: 'Dashboard — Admin Romaessence',
      stats: {
        totalProducts: totalProds[0]?.c || 0,
        activeProducts: activeProds[0]?.c || 0,
        noStockProducts: noStockProds[0]?.c || 0,
        totalPromotions: totalPromos[0]?.c || 0,
        activePromotions: activePromos[0]?.c || 0,
      },
      recentProducts,
      admin: req.session.admin
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err.message);
  }
});

// ─── PRODUCTS ───────────────────────────────────────────────────────────────

// GET /admin/productos
router.get('/productos', requireAuth, async (req, res) => {
  try {
    const products = (await query(
      `SELECT * FROM products ORDER BY created_at DESC`
    )).map(parseProduct);
    res.render('admin/products/list', {
      title: 'Productos — Admin Romaessence',
      products
    });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

// GET /admin/productos/nuevo
router.get('/productos/nuevo', requireAuth, (req, res) => {
  res.render('admin/products/form', {
    title: 'Nuevo Producto — Admin Romaessence',
    product: null,
    categories: CATEGORIES,
    isEdit: false,
    error: null
  });
});

// POST /admin/productos - Create
router.post('/productos', requireAuth, upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
  { name: 'extra_images', maxCount: 10 }
]), async (req, res) => {
  try {
    const {
      name, description, cost_price, profit_percent,
      stock, category, rating, active,
      tags_json, esencia_json
    } = req.body;

    // Upload main photo
    let photo_file_id = null;
    if (req.files?.photo?.[0]) {
      const f = req.files.photo[0];
      const uploaded = await uploadFile(f.buffer, f.originalname, f.mimetype);
      photo_file_id = uploaded.id;
    }

    // Upload banner
    let banner_file_id = null;
    if (req.files?.banner?.[0]) {
      const f = req.files.banner[0];
      const uploaded = await uploadFile(f.buffer, f.originalname, f.mimetype);
      banner_file_id = uploaded.id;
    }

    // Upload extra images
    let extra_ids = [];
    if (req.files?.extra_images) {
      for (const f of req.files.extra_images) {
        const uploaded = await uploadFile(f.buffer, f.originalname, f.mimetype);
        extra_ids.push(uploaded.id);
      }
    }

    // Parse tags and esencia
    let tags = [];
    try { tags = JSON.parse(tags_json || '[]'); } catch { tags = []; }
    let esencia = {};
    try { esencia = JSON.parse(esencia_json || '{}'); } catch { esencia = {}; }

    const isActive = active === 'on' || active === '1' ? 1 : 0;

    await query(`
      INSERT INTO products (name, description, photo_file_id, cost_price, profit_percent, stock, category, tags, extra_images, rating, banner_file_id, esencia, active)
      VALUES (
        ${esc(name)},
        ${esc(description || '')},
        ${photo_file_id ? esc(String(photo_file_id)) : 'NULL'},
        ${parseFloat(cost_price) || 0},
        ${parseFloat(profit_percent) || 0},
        ${parseInt(stock) || 0},
        ${esc(category || 'perfume')},
        ${esc(JSON.stringify(tags))},
        ${esc(JSON.stringify(extra_ids))},
        ${parseFloat(rating) || 5},
        ${banner_file_id ? esc(String(banner_file_id)) : 'NULL'},
        ${esc(JSON.stringify(esencia))},
        ${isActive}
      )
    `);

    res.redirect('/admin/productos');
  } catch (err) {
    console.error(err);
    res.render('admin/products/form', {
      title: 'Nuevo Producto — Admin Romaessence',
      product: req.body,
      categories: CATEGORIES,
      isEdit: false,
      error: err.message
    });
  }
});

// GET /admin/productos/:id/editar
router.get('/productos/:id/editar', requireAuth, async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM products WHERE id = ${esc(req.params.id)} LIMIT 1`);
    if (!rows || rows.length === 0) return res.redirect('/admin/productos');
    const product = parseProduct(rows[0]);
    res.render('admin/products/form', {
      title: `Editar ${product.name} — Admin`,
      product,
      categories: CATEGORIES,
      isEdit: true,
      error: null
    });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

// PUT /admin/productos/:id - Update
router.put('/productos/:id', requireAuth, upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
  { name: 'extra_images', maxCount: 10 }
]), async (req, res) => {
  try {
    const {
      name, description, cost_price, profit_percent,
      stock, category, rating, active,
      tags_json, esencia_json,
      remove_extra_images
    } = req.body;

    // Get existing product
    const rows = await query(`SELECT * FROM products WHERE id = ${esc(req.params.id)} LIMIT 1`);
    if (!rows || rows.length === 0) return res.redirect('/admin/productos');
    const existing = parseProduct(rows[0]);

    // Photo
    let photo_file_id = existing.photo_file_id;
    if (req.files?.photo?.[0]) {
      const f = req.files.photo[0];
      const uploaded = await uploadFile(f.buffer, f.originalname, f.mimetype);
      photo_file_id = uploaded.id;
      if (existing.photo_file_id) deleteFile(existing.photo_file_id).catch(() => {});
    }

    // Banner
    let banner_file_id = existing.banner_file_id;
    if (req.files?.banner?.[0]) {
      const f = req.files.banner[0];
      const uploaded = await uploadFile(f.buffer, f.originalname, f.mimetype);
      banner_file_id = uploaded.id;
      if (existing.banner_file_id) deleteFile(existing.banner_file_id).catch(() => {});
    }
    // Remove banner if checkbox checked
    if (req.body.remove_banner === 'on') {
      if (banner_file_id) deleteFile(banner_file_id).catch(() => {});
      banner_file_id = null;
    }

    // Extra images: keep existing + add new ones - removed ones
    let extra_ids = [...existing.extra_images];
    // Remove checked ones
    const toRemove = Array.isArray(remove_extra_images)
      ? remove_extra_images
      : (remove_extra_images ? [remove_extra_images] : []);
    toRemove.forEach(id => {
      deleteFile(id).catch(() => {});
      extra_ids = extra_ids.filter(x => String(x) !== String(id));
    });
    // Add new ones
    if (req.files?.extra_images) {
      for (const f of req.files.extra_images) {
        const uploaded = await uploadFile(f.buffer, f.originalname, f.mimetype);
        extra_ids.push(uploaded.id);
      }
    }

    let tags = [];
    try { tags = JSON.parse(tags_json || '[]'); } catch { tags = []; }
    let esencia = {};
    try { esencia = JSON.parse(esencia_json || '{}'); } catch { esencia = {}; }

    const isActive = active === 'on' || active === '1' ? 1 : 0;

    await query(`
      UPDATE products SET
        name = ${esc(name)},
        description = ${esc(description || '')},
        photo_file_id = ${photo_file_id ? esc(String(photo_file_id)) : 'NULL'},
        cost_price = ${parseFloat(cost_price) || 0},
        profit_percent = ${parseFloat(profit_percent) || 0},
        stock = ${parseInt(stock) || 0},
        category = ${esc(category || 'perfume')},
        tags = ${esc(JSON.stringify(tags))},
        extra_images = ${esc(JSON.stringify(extra_ids))},
        rating = ${parseFloat(rating) || 5},
        banner_file_id = ${banner_file_id ? esc(String(banner_file_id)) : 'NULL'},
        esencia = ${esc(JSON.stringify(esencia))},
        active = ${isActive}
      WHERE id = ${esc(req.params.id)}
    `);

    res.redirect('/admin/productos');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/productos');
  }
});

// DELETE /admin/productos/:id
router.delete('/productos/:id', requireAuth, async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM products WHERE id = ${esc(req.params.id)} LIMIT 1`);
    if (rows && rows.length > 0) {
      const p = parseProduct(rows[0]);
      if (p.photo_file_id) deleteFile(p.photo_file_id).catch(() => {});
      if (p.banner_file_id) deleteFile(p.banner_file_id).catch(() => {});
      p.extra_images.forEach(id => deleteFile(id).catch(() => {}));
    }
    await query(`DELETE FROM products WHERE id = ${esc(req.params.id)}`);
    res.redirect('/admin/productos');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/productos');
  }
});

// PATCH /admin/productos/:id/toggle
router.patch('/productos/:id/toggle', requireAuth, async (req, res) => {
  try {
    await query(`
      UPDATE products SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END
      WHERE id = ${esc(req.params.id)}
    `);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ─── PROMOTIONS ─────────────────────────────────────────────────────────────

// GET /admin/promociones
router.get('/promociones', requireAuth, async (req, res) => {
  try {
    const promotions = await query(`SELECT * FROM promotions ORDER BY display_order ASC`);
    res.render('admin/promotions/list', {
      title: 'Promociones — Admin Romaessence',
      promotions
    });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

// POST /admin/promociones - Create
router.post('/promociones', requireAuth, upload.single('promo_image'), async (req, res) => {
  try {
    const { link, display_order, active } = req.body;

    if (!req.file) {
      return res.redirect('/admin/promociones?error=imagen_requerida');
    }

    const uploaded = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
    const isActive = active === 'on' || active === '1' ? 1 : 0;

    await query(`
      INSERT INTO promotions (image_file_id, link, display_order, active)
      VALUES (
        ${esc(String(uploaded.id))},
        ${link ? esc(link) : 'NULL'},
        ${parseInt(display_order) || 0},
        ${isActive}
      )
    `);

    res.redirect('/admin/promociones');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/promociones?error=' + encodeURIComponent(err.message));
  }
});

// PUT /admin/promociones/:id - Update
router.put('/promociones/:id', requireAuth, upload.single('promo_image'), async (req, res) => {
  try {
    const { link, display_order, active } = req.body;

    const rows = await query(`SELECT * FROM promotions WHERE id = ${esc(req.params.id)} LIMIT 1`);
    if (!rows || rows.length === 0) return res.redirect('/admin/promociones');
    const existing = rows[0];

    let image_file_id = existing.image_file_id;
    if (req.file) {
      const uploaded = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
      image_file_id = uploaded.id;
      if (existing.image_file_id) deleteFile(existing.image_file_id).catch(() => {});
    }

    const isActive = active === 'on' || active === '1' ? 1 : 0;

    await query(`
      UPDATE promotions SET
        image_file_id = ${esc(String(image_file_id))},
        link = ${link ? esc(link) : 'NULL'},
        display_order = ${parseInt(display_order) || 0},
        active = ${isActive}
      WHERE id = ${esc(req.params.id)}
    `);

    res.redirect('/admin/promociones');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/promociones');
  }
});

// DELETE /admin/promociones/:id
router.delete('/promociones/:id', requireAuth, async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM promotions WHERE id = ${esc(req.params.id)} LIMIT 1`);
    if (rows && rows.length > 0 && rows[0].image_file_id) {
      deleteFile(rows[0].image_file_id).catch(() => {});
    }
    await query(`DELETE FROM promotions WHERE id = ${esc(req.params.id)}`);
    res.redirect('/admin/promociones');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/promociones');
  }
});

// PATCH /admin/promociones/:id/toggle
router.patch('/promociones/:id/toggle', requireAuth, async (req, res) => {
  try {
    await query(`
      UPDATE promotions SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END
      WHERE id = ${esc(req.params.id)}
    `);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

module.exports = router;
