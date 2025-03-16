const mongoose = require('mongoose');

const ContractSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Por favor, informe um imóvel'],
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Por favor, informe um inquilino'],
  },
  startDate: {
    type: Date,
    required: [true, 'Por favor, informe a data de início'],
  },
  endDate: {
    type: Date,
    required: [true, 'Por favor, informe a data de término'],
  },
  monthlyRent: {
    type: Number,
    required: [true, 'Por favor, informe o valor do aluguel'],
  },
  deposit: {
    type: Number,
    default: 0,
  },
  paymentDay: {
    type: Number,
    default: 5,
    min: 1,
    max: 31,
  },
  status: {
    type: String,
    enum: ['Pendente', 'Ativo', 'Encerrado', 'Arquivado'],
    default: 'Pendente',
  },
  notes: {
    type: String,
    trim: true,
  },
  documents: [String],
  paymentHistory: [
    {
      date: Date,
      amount: Number,
      status: {
        type: String,
        enum: ['Pendente', 'Pago', 'Atrasado'],
        default: 'Pendente',
      },
      notes: String,
    },
  ],
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
ContractSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});

module.exports = mongoose.model('Contract', ContractSchema);