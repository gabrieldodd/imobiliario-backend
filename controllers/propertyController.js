const Property = require('../models/Property');
const Contract = require('../models/Contract');

// @desc      Obter todos os imóveis
// @route     GET /api/properties
// @access    Private
exports.getProperties = async (req, res, next) => {
  try {
    // Filtrar por empresa do usuário
    const properties = await Property.find({ company: req.company });

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (err) {
    next(err);
  }
};

// @desc      Obter imóvel único
// @route     GET /api/properties/:id
// @access    Private
exports.getProperty = async (req, res, next) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      company: req.company
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Imóvel não encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: property,
    });
  } catch (err) {
    next(err);
  }
};

// @desc      Criar imóvel
// @route     POST /api/properties
// @access    Private
exports.createProperty = async (req, res, next) => {
  try {
    // Adicionar usuário e empresa ao body
    req.body.user = req.user.id;
    req.body.company = req.company;

    // Log para debugar o CEP
    console.log('CEP recebido na criação:', req.body.cep);

    const property = await Property.create(req.body);

    res.status(201).json({
      success: true,
      data: property,
    });
  } catch (err) {
    console.error('Erro ao criar imóvel:', err);
    next(err);
  }
};

// @desc      Atualizar imóvel
// @route     PUT /api/properties/:id
// @access    Private
exports.updateProperty = async (req, res, next) => {
  try {
    let property = await Property.findOne({
      _id: req.params.id,
      company: req.company
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Imóvel não encontrado',
      });
    }

    // Log para debugar o CEP
    console.log('CEP recebido na atualização:', req.body.cep);

    property = await Property.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: property,
    });
  } catch (err) {
    console.error('Erro ao atualizar imóvel:', err);
    next(err);
  }
};

// @desc      Excluir imóvel
// @route     DELETE /api/properties/:id
// @access    Private
exports.deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      company: req.company
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Imóvel não encontrado',
      });
    }

    // Verificar se há contratos ativos para este imóvel
    const hasActiveContracts = await Contract.exists({
      propertyId: req.params.id,
      company: req.company,
      status: { $in: ['Ativo', 'Pendente'] }
    });

    if (hasActiveContracts) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir um imóvel com contratos ativos',
      });
    }

    await property.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};