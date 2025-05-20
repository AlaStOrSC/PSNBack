const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del producto es obligatorio'],
    trim: true,
    minlength: [3, 'El nombre del producto debe tener al menos 3 caracteres'],
    maxlength: [100, 'El nombre del producto no puede exceder los 100 caracteres'],
  },
  image: {
    type: String,
    required: [true, 'La imagen del producto es obligatoria'],
  },
  price: {
    type: Number,
    required: [true, 'El precio del producto es obligatorio'],
    min: [0, 'El precio no puede ser negativo'],
  },
  description: {
    type: String,
    required: [true, 'La descripción del producto es obligatoria'],
    trim: true,
    maxlength: [100, 'La descripción no puede exceder las 100 palabras'],
    validate: {
      validator: function (value) {
        const wordCount = value.split(/\s+/).filter(word => word.length > 0).length;
        return wordCount <= 100;
      },
      message: 'La descripción no puede exceder las 100 palabras',
    },
  },
  category: {
    type: String,
    required: [true, 'La categoría del producto es obligatoria'],
    enum: ['Palas', 'Bolas', 'Ropa', 'Calzado', 'Accesorios'],
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El vendedor del producto es obligatorio'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

productSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;