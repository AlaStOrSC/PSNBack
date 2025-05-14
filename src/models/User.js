const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'El nombre de usuario es obligatorio'],
    unique: true,
    trim: true,
    minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres'],
  },
  email: {
    type: String,
    required: [true, 'El correo electrónico es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor, ingresa un correo electrónico válido'],
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
  },
  role: {
    type: String,
    enum: ['usuario', 'admin'], 
    default: 'usuario',  
    required: true,
  },
  phone: {
    type: String,
    default: '',
  },
  city: {
    type: String,
    default: '',
  },
  score: {
    type: Number,
    default: 3.00,
    min: 0,
    max: 10,
  },
  matchesWon: {
    type: Number,
    default: 0,
  },
  matchesLost: {
    type: Number,
    default: 0,
  },
  matchesDrawn: {
    type: Number,
    default: 0,
  },
  totalMatches: {
    type: Number,
    default: 0,
  },
  profilePicture: {
    type: String,
    default: '',
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

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  this.updatedAt = Date.now();
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;