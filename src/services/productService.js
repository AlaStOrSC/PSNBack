const Product = require('../models/Product');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

const getProducts = async ({ page = 1, limit = 10, minRating, minPrice, maxPrice, category, sellerUsername, name }) => {
  const query = {};

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }
  if (category) {
    query.category = category;
  }
  if (name && name.trim()) {
    query.name = { $regex: name.trim(), $options: 'i' };
  }

  let sellerIds = [];
  if (sellerUsername) {
    const sellers = await User.find({
      username: { $regex: sellerUsername, $options: 'i' },
    }).select('_id');
    sellerIds = sellers.map(seller => seller._id);
    query.seller = { $in: sellerIds };
  }

  if (minRating) {
    const sellers = await User.find({
      averageRating: { $gte: parseFloat(minRating) },
    }).select('_id');
    const ratingSellerIds = sellers.map(seller => seller._id);
    if (sellerUsername) {
      query.seller = { $in: sellerIds.filter(id => ratingSellerIds.includes(id)) };
    } else {
      query.seller = { $in: ratingSellerIds };
    }
  }

  const products = await Product.find(query)
    .populate('seller', 'username averageRating')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

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
  const product = await Product.findById(productId).populate('seller');
  if (!product) {
    throw new Error('Producto no encontrado');
  }

  const seller = await User.findById(product.seller._id);
  seller.ratings.push({
    user: userId,
    rating,
    comment,
  });

  if (seller.ratings.length > 0) {
    const totalRating = seller.ratings.reduce((sum, r) => sum + r.rating, 0);
    seller.averageRating = totalRating / seller.ratings.length;
  } else {
    seller.averageRating = 0;
  }

  await seller.save();

  await Product.findByIdAndDelete(productId);

  await User.findByIdAndUpdate(product.seller._id, {
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