const Product = require('../models/Product');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

const getProducts = async ({ page = 1, limit = 10, minRating, minPrice, maxPrice, category, sellerId }) => {
  const query = {};

  if (minRating) {
    query.averageRating = { $gte: minRating };
  }
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = minPrice;
    if (maxPrice) query.price.$lte = maxPrice;
  }
  if (category) {
    query.category = category;
  }
  if (sellerId) {
    query.seller = sellerId;
  }

  const products = await Product.find(query)
    .populate('seller', 'username averageRating')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ averageRating: -1, createdAt: -1 });

  const total = await Product.countDocuments(query);

  return {
    products,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
};

const createProduct = async ({ name, image, price, description, category, sellerId }) => {
  const uploadResponse = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(image.buffer);
  });

  const product = new Product({
    name,
    image: uploadResponse.secure_url,
    price,
    description,
    category,
    seller: sellerId,
  });

  await product.save();

  await User.findByIdAndUpdate(sellerId, {
    $push: { products: product._id },
  });

  return product;
};

const purchaseProduct = async (productId, buyerId) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error('Producto no encontrado');
  }

  return product;
};

const rateProduct = async (productId, userId, rating, comment) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error('Producto no encontrado');
  }

  product.ratings.push({
    user: userId,
    rating,
    comment,
  });

  if (product.ratings.length > 0) {
    const totalRating = product.ratings.reduce((sum, r) => sum + r.rating, 0);
    product.averageRating = totalRating / product.ratings.length;
  }

  await product.save();

  await Product.findByIdAndDelete(productId);

  await User.findByIdAndUpdate(product.seller, {
    $pull: { products: productId },
  });

  return product;
};

module.exports = {
  getProducts,
  createProduct,
  purchaseProduct,
  rateProduct,
};