const mongoose = require('mongoose');

const PropertyTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor, informe um nome para o tipo de imóvel'],
    trim: true,
    // Removemos qualquer constraint unique para evitar problemas
  },
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
  }
});

// Índice composto para garantir que nome+empresa sejam únicos juntos
// Este índice é mais flexível que a opção unique no schema
PropertyTypeSchema.index({ name: 1, company: 1 }, { unique: true });

module.exports = mongoose.model('PropertyType', PropertyTypeSchema);