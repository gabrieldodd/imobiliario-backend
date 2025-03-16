const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Por favor, informe o nome'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Por favor, informe o sobrenome'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Por favor, informe um telefone'],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor, informe um email válido',
    ],
  },
  cpf: {
    type: String,
    trim: true,
  },
  rg: {
    type: String,
    trim: true,
  },
  profession: {
    type: String,
    trim: true,
  },
  income: {
    type: Number,
  },
  notes: {
    type: String,
    trim: true,
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
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Atualizar o campo updatedAt antes de cada update
TenantSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});

module.exports = mongoose.model('Tenant', TenantSchema);