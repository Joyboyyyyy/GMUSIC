import express from 'express';

// Create a test router to debug route matching
const router = express.Router();

// Add debug middleware
router.use((req, res, next) => {
  console.log(`🔍 [DEBUG] Building route hit: ${req.method} ${req.path}`);
  console.log(`🔍 [DEBUG] Full URL: ${req.originalUrl}`);
  console.log(`🔍 [DEBUG] Headers:`, req.headers.authorization ? 'HAS AUTH HEADER' : 'NO AUTH HEADER');
  next();
});

// Simulate the exact same routes as in building.routes.js
router.get('/search', (req, res) => {
  console.log('✅ Matched /search');
  res.json({ route: '/search', auth: 'none' });
});

router.get('/public', (req, res) => {
  console.log('✅ Matched /public');
  res.json({ route: '/public', auth: 'none' });
});

router.get('/nearby', (req, res) => {
  console.log('✅ Matched /nearby');
  res.json({ route: '/nearby', auth: 'none' });
});

router.get('/with-music-rooms', (req, res) => {
  console.log('✅ Matched /with-music-rooms');
  res.json({ route: '/with-music-rooms', auth: 'none' });
});

router.get('/validate-code/:code', (req, res) => {
  console.log('✅ Matched /validate-code/:code');
  res.json({ route: '/validate-code/:code', auth: 'none' });
});

// This is the problematic route order
router.get('/', (req, res) => {
  console.log('✅ Matched / (should require auth)');
  res.json({ route: '/', auth: 'required' });
});

router.get('/all', (req, res) => {
  console.log('✅ Matched /all (should NOT require auth)');
  res.json({ route: '/all', auth: 'none' });
});

router.get('/my-building/courses', (req, res) => {
  console.log('✅ Matched /my-building/courses');
  res.json({ route: '/my-building/courses', auth: 'required' });
});

router.get('/:id', (req, res) => {
  console.log('✅ Matched /:id');
  res.json({ route: '/:id', auth: 'none', id: req.params.id });
});

// Create test app
const app = express();
app.use('/api/buildings', router);

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`🧪 Debug server running on http://localhost:${PORT}`);
  console.log('Test these URLs:');
  console.log('  http://localhost:3003/api/buildings/all');
  console.log('  http://localhost:3003/api/buildings/public');
  console.log('  http://localhost:3003/api/buildings/');
});