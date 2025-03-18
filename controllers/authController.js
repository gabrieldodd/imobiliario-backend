const User = require('../models/User');
const PropertyType = require('../models/PropertyType');

// @desc      Registrar usuário
// @route     POST /api/auth/register
// @access    Public
exports.register = async (req, res, next) => {
  try {
    console.log('Dados de registro recebidos:', req.body);
    
    const { name, email, password, company } = req.body;

    // Verificar se o email já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Email já cadastrado:', email);
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso'
      });
    }
    
    // Criar usuário
    console.log('Tentando criar usuário');
    const user = await User.create({
      name,
      email,
      password,
      company,
    });
    console.log('Usuário criado com sucesso:', user._id);

    // Criar tipos de imóveis padrão para o usuário
    const defaultTypes = [
      'Apartamento', 'Casa', 'Comercial', 'Sala', 'Galpão', 'Terreno'
    ];

    console.log('Criando tipos de imóveis padrão');
    try {
      for (const type of defaultTypes) {
        console.log(`Criando tipo: ${type}`);
        await PropertyType.create({
          name: type,
          user: user._id,
          company: user.company
        });
      }
      console.log('Todos os tipos de imóveis criados com sucesso');
    } catch (typeError) {
      console.error('Erro ao criar tipos de imóveis:', typeError.message);
      // Continuar mesmo com erro nos tipos
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error('Erro no registro:', err.message);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      console.error('Erros de validação:', messages);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    if (err.code === 11000) {
      console.error('Erro de duplicação:', err);
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso'
      });
    }
    next(err);
  }
};

// @desc      Login de usuário
// @route     POST /api/auth/login
// @access    Public
exports.login = async (req, res, next) => {
  try {
    console.log('Tentativa de login:', req.body.email);
    const { email, password } = req.body;

    // Validar email e senha
    if (!email || !password) {
      console.log('Email ou senha não fornecidos');
      return res.status(400).json({
        success: false,
        error: 'Por favor, informe email e senha',
      });
    }

    // Verificar usuário
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('Usuário não encontrado:', email);
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
      });
    }

    // Verificar se a senha corresponde
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.log('Senha incorreta para usuário:', email);
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
      });
    }

    console.log('Login bem-sucedido para:', email);
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Erro no login:', err.message);
    next(err);
  }
};

// @desc      Obter usuário atual
// @route     GET /api/auth/me
// @access    Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error('Erro ao obter usuário atual:', err.message);
    next(err);
  }
};

// @desc      Logout de usuário / limpar cookie
// @route     GET /api/auth/logout
// @access    Private
exports.logout = async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {},
  });
};

// Função auxiliar para gerar token e enviar resposta
const sendTokenResponse = (user, statusCode, res) => {
  // Criar token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // Usar HTTPS em produção
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  console.log('Token gerado para usuário:', user._id);
  
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company
    }
  });
};