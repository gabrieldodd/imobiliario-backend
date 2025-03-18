const Tenant = require('../models/Tenant');
const Contract = require('../models/Contract');

// @desc      Obter todos os inquilinos
// @route     GET /api/tenants
// @access    Private
exports.getTenants = async (req, res, next) => {
  try {
    // Filtrar por empresa do usuário
    const tenants = await Tenant.find({ company: req.company });

    res.status(200).json({
      success: true,
      count: tenants.length,
      data: tenants,
    });
  } catch (err) {
    next(err);
  }
};

// @desc      Obter inquilino único
// @route     GET /api/tenants/:id
// @access    Private
exports.getTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findOne({
      _id: req.params.id,
      company: req.company
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Inquilino não encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: tenant,
    });
  } catch (err) {
    next(err);
  }
};

// @desc      Criar inquilino
// @route     POST /api/tenants
// @access    Private
exports.createTenant = async (req, res, next) => {
  try {
    // Adicionar usuário ao body
    req.body.user = req.user.id;
    req.body.company = req.company;

    const tenant = await Tenant.create(req.body);

    res.status(201).json({
      success: true,
      data: tenant,
    });
  } catch (err) {
    next(err);
  }
};

// @desc      Atualizar inquilino
// @route     PUT /api/tenants/:id
// @access    Private
exports.updateTenant = async (req, res, next) => {
  try {
    let tenant = await Tenant.findOne({
      _id: req.params.id,
      company: req.company
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Inquilino não encontrado',
      });
    }

    tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: tenant,
    });
  } catch (err) {
    next(err);
  }
};

// @desc      Excluir inquilino
// @route     DELETE /api/tenants/:id
// @access    Private
exports.deleteTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findOne({
      _id: req.params.id,
      company: req.company
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Inquilino não encontrado',
      });
    }

    // Verificar se há contratos ativos para este inquilino
    const hasActiveContracts = await Contract.exists({
      tenantId: req.params.id,
      company: req.company,
      status: { $in: ['Ativo', 'Pendente'] }
    });

    if (hasActiveContracts) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir um inquilino com contratos ativos',
      });
    }

    await tenant.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};