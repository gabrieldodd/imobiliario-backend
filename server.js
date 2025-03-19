const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const contractRoutes = require('./routes/contractRoutes');
const propertyTypeRoutes = require('./routes/propertyTypeRoutes');

// Inicializar o app
const app = express();

// Conectar ao banco de dados
connectDB();

// Configuração CORS flexível
app.use(cors({
  origin: function(origin, callback) {
    // Permitir requisições sem origem (como apps mobile, postman, etc)
    if (!origin) {
      return callback(null, true);
    }
    
    // Permitir localhost para desenvolvimento
    if (origin === 'http://localhost:3000') {
      return callback(null, true);
    }
    
    // Permitir o domínio principal do Vercel
    if (origin === 'https://imobiliario-frontend.vercel.app') {
      return callback(null, true);
    }
    
    // Permitir qualquer subdomínio do Vercel para o projeto
    const vercelDeployRegex = /^https:\/\/imobiliario-frontend.*\.vercel\.app$/;
    if (vercelDeployRegex.test(origin)) {
      return callback(null, true);
    }
    
    // Permitir o domínio de produção do Render
    if (origin === 'https://imobiliario-app.onrender.com') {
      return callback(null, true);
    }
    
    // Registrar origens não permitidas para debug
    console.log(`Origin ${origin} not allowed by CORS`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware para preflight requests
app.options('*', cors());

// Middleware para JSON e logging
app.use(express.json());
app.use(morgan('dev'));

// Middleware para debug de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log('Request Headers:', req.headers);
  next();
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/property-types', propertyTypeRoutes);

// Rota padrão
app.get('/', (req, res) => {
  res.send('API do Sistema de Gerenciamento Imobiliário funcionando!');
});

// Middleware de erro CORS
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    console.error(`CORS Error: ${req.headers.origin} tried to access ${req.originalUrl}`);
    return res.status(403).json({
      success: false,
      error: 'CORS não permitido para esta origem'
    });
  }
  next(err);
});

// Manipulação geral de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Erro no servidor',
  });
});

// Iniciar o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});