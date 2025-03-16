const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Por favor, informe um título'],
    trim: true,
    maxlength: [100, 'Título não pode ter mais de 100 caracteres'],
  },
  address: {
    type: String,
    required: [true, 'Por favor, informe um endereço'],
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Por favor, informe um tipo de imóvel'],
  },
  price: {
    type: Number,
    required: [true, 'Por favor, informe um valor de aluguel'],
  },
  size: {
    type: Number,
  },
  bedrooms: {
    type: Number,
  },
  bathrooms: {
    type: Number,
  },
  description: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Disponível', 'Alugado', 'Manutenção'],
    default: 'Disponível',
  },
  photos: [String],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  company: {
    type: String,
    required: true,
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

// Atualizar o campo updatedAt antes de cada update
PropertySchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});

module.exports = mongoose.model('Property', PropertySchema);