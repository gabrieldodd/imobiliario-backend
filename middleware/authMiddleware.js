const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Proteger rotas
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Obter token do header
    token = req.headers.authorization.split(' ')[1];
  }

  // Verificar se o token existe
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Acesso não autorizado',
    });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey');

    // Adicionar usuário à requisição
    req.user = await User.findById(decoded.id);
    
    // Adicionar company à requisição para filtragem de dados
    req.company = decoded.company;
    
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Acesso não autorizado',
    });
  }
};

// Restringir acesso por função
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Usuário não tem permissão para acessar este recurso',
      });
    }
    next();
  };
};