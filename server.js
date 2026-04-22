require('dotenv').config();
const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');
const axios = require('axios');

const { initDb } = require('./database/initDb');
const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsers
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

// Method override for PUT/DELETE from forms
app.use(methodOverride('_method'));

// Sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'romaessence_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 8 } // 8 hours
}));

// Proxy route for Spider API images
app.get('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const response = await axios.get(
      `${process.env.SPIDER_API_URL}/storage/files/${fileId}`,
      {
        headers: { 'X-API-KEY': process.env.SPIDER_API_KEY },
        responseType: 'stream'
      }
    );
    const contentType = response.headers['content-type'] || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch (err) {
    res.status(404).send('Imagen no encontrada');
  }
});

// Routes
app.use('/', indexRouter);
app.use('/admin', adminRouter);

// 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Página no encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Error interno del servidor');
});

// Start
async function start() {
  try {
    console.log('🔄 Inicializando base de datos...');
    await initDb();
    console.log('✅ Base de datos lista');
    app.listen(PORT, () => {
      console.log(`🌹 Romaessence corriendo en http://localhost:${PORT}`);
      console.log(`🔐 Admin: http://localhost:${PORT}/admin`);
    });
  } catch (err) {
    console.error('❌ Error al iniciar:', err.message);
    process.exit(1);
  }
}

start();
