const mongoose = require('mongoose');

const PropertyTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor, informe um nome para o tipo de imóvel'],
    trim: true,
    // Removida restrição unique global
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

// CORREÇÃO: Índice composto para garantir que nome+empresa sejam únicos juntos
// Isso cria unicidade apenas dentro da mesma empresa
PropertyTypeSchema.index({ name: 1, company: 1 }, { 
  unique: true,
  collation: { locale: 'pt', strength: 2 } // Tornar case-insensitive em português
});

module.exports = mongoose.model('PropertyType', PropertyTypeSchema);