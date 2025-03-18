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
    
    // Criar usuário com papel de admin para o primeiro cadastro
    console.log('Tentando criar usuário');
    const user = await User.create({
      name,
      email,
      password,
      company,
      role: 'admin' // Primeiro usuário é automaticamente admin
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
    const user = await User.findOne({ email, active: true }).select('+password');

    if (!user) {
      console.log('Usuário não encontrado ou inativo:', email);
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

// @desc      Criar usuário por admin
// @route     POST /api/auth/users
// @access    Private/Admin
exports.createUser = async (req, res, next) => {
  try {
    // Verificar se o usuário é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Não autorizado para criar usuários'
      });
    }

    const { name, email, password, role = 'user' } = req.body;

    // Verificar se o email já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso'
      });
    }

    // Criar novo usuário com a mesma empresa do admin
    const user = await User.create({
      name,
      email,
      password,
      company: req.company,
      role, // Pode ser 'user' ou 'admin'
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    next(err);
  }
};

// @desc      Obter todos os usuários da empresa
// @route     GET /api/auth/users
// @access    Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    // Verificar se o usuário é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Não autorizado para visualizar usuários'
      });
    }

    // Buscar todos os usuários da mesma empresa
    const users = await User.find({ company: req.company });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    console.error('Erro ao obter usuários:', err);
    next(err);
  }
};

// @desc      Obter usuário único
// @route     GET /api/auth/users/:id
// @access    Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    // Verificar se o usuário é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Não autorizado para visualizar usuários'
      });
    }

    // Buscar usuário da mesma empresa
    const user = await User.findOne({
      _id: req.params.id,
      company: req.company
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Erro ao obter usuário:', err);
    next(err);
  }
};

// @desc      Atualizar usuário
// @route     PUT /api/auth/users/:id
// @access    Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    // Verificar se o usuário é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Não autorizado para atualizar usuários'
      });
    }

    // Buscar usuário da mesma empresa
    let user = await User.findOne({
      _id: req.params.id,
      company: req.company
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Dados que podem ser atualizados
    const { name, email, role, active } = req.body;
    
    // Preparar objeto de atualização
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (active !== undefined) updateData.active = active;

    // Verificar se o email já está em uso por outro usuário
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email já está em uso por outro usuário'
        });
      }
    }

    // Atualizar usuário
    user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    next(err);
  }
};

// @desc      Redefinir senha de usuário
// @route     PUT /api/auth/users/:id/reset-password
// @access    Private/Admin
exports.resetPassword = async (req, res, next) => {
  try {
    // Verificar se o usuário é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Não autorizado para redefinir senhas'
      });
    }

    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, forneça uma senha com pelo menos 6 caracteres'
      });
    }

    // Buscar usuário da mesma empresa
    let user = await User.findOne({
      _id: req.params.id,
      company: req.company
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Atualizar a senha (a criptografia acontece no middleware pre-save)
    user.password = password;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Senha redefinida com sucesso'
    });
  } catch (err) {
    console.error('Erro ao redefinir senha:', err);
    next(err);
  }
};

// @desc      Desativar/reativar usuário
// @route     PUT /api/auth/users/:id/toggle-status
// @access    Private/Admin
exports.toggleUserStatus = async (req, res, next) => {
  try {
    // Verificar se o usuário é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Não autorizado para alterar status de usuários'
      });
    }

    // Buscar usuário da mesma empresa
    let user = await User.findOne({
      _id: req.params.id,
      company: req.company
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Não permitir desativar o próprio usuário
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível desativar seu próprio usuário'
      });
    }

    // Inverter o status
    user.active = !user.active;
    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Erro ao alterar status do usuário:', err);
    next(err);
  }
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