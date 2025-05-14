const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del usuario es obligatorio'],
  },
  player1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El jugador 1 es obligatorio'],
  },
  player2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El jugador 2 es obligatorio'],
  },
  player3: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El jugador 3 es obligatorio'],
  },
  player4: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El jugador 4 es obligatorio'],
  },
  date: {
    type: Date,
    required: [true, 'La fecha del partido es obligatoria'],
  },
  time: {
    type: String,
    required: [true, 'La hora del partido es obligatoria'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'La hora debe tener el formato HH:mm (24 horas)'],
  },
  city: {
    type: String,
    required: [true, 'La ciudad es obligatoria'],
    trim: true,
  },
  weather: {
    type: String,
    trim: true,
    default: null,
  },
  rainWarning: {
    type: Boolean,
    default: false,
  },
  results: {
    set1: {
      left: { type: Number, default: 0 },
      right: { type: Number, default: 0 },
    },
    set2: {
      left: { type: Number, default: 0 },
      right: { type: Number, default: 0 },
    },
    set3: {
      left: { type: Number, default: 0 },
      right: { type: Number, default: 0 },
    },
  },
  rivalStyle: {
    type: String,
    trim: true,
    default: '',
  },
  comments: {
    type: String,
    trim: true,
    default: '',
  },
  isSaved: {
    type: Boolean,
    default: false,
  },
  statsCalculated: {
    type: Boolean,
    default: false,
  },
  result: {
    type: String,
    enum: ['won', 'lost', 'draw', 'pending'],
    default: 'pending',
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

matchSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;