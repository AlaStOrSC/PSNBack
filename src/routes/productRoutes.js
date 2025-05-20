const express = require('express');
const router = express.Router();
const {
  getProducts,
  createProduct,
  purchaseProduct,
  rateProduct,
} = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/', getProducts);
router.post('/', authMiddleware(), upload.single('image'), createProduct);
router.post('/purchase/:productId', authMiddleware(), purchaseProduct);
router.post('/rate/:productId', authMiddleware(), rateProduct);

module.exports = router;