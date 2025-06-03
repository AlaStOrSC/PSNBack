const productService = require('../services/productService');
const mongoose = require('mongoose');

const getProducts = async (req, res) => {
  try {
    const { page, limit, minRating, minPrice, maxPrice, category, sellerUsername, name } = req.query;
    const result = await productService.getProducts({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      minRating: minRating ? parseFloat(minRating) : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      category,
      sellerUsername,
      name,
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, price, description, category } = req.body;
    const image = req.file;
    const sellerId = req.user.userId;

    const product = await productService.createProduct({
      name,
      image,
      price,
      description,
      category,
      sellerId,
    });

    res.status(201).json({ message: 'Producto creado con éxito', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const purchaseProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const buyerId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'ID de producto inválido' });
    }

    const product = await productService.purchaseProduct(productId, buyerId);

    res.status(200).json({ message: 'Compra iniciada con éxito', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'ID de producto inválido' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'La valoración debe estar entre 1 y 5' });
    }

    const product = await productService.rateProduct(productId, userId, rating, comment);

    res.status(200).json({ message: 'Valoración añadida y producto eliminado con éxito', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  createProduct,
  purchaseProduct,
  rateProduct,
};