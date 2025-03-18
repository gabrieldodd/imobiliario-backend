const PropertyType = require('../models/PropertyType');
const Property = require('../models/Property');

// @desc      Obter todos os tipos de imóveis
// @route     GET /api/property-types
// @access    Private
exports.getPropertyTypes = async (req, res, next) => {
  try {
    // Filtrar por empresa do usuário
    const propertyTypes = await PropertyType.find({ company: req.company });

    res.status(200).json({
      success: true,
      count: propertyTypes.length,
      data: propertyTypes,
    });
  } catch (err) {
    next(err);
  }
};

// @desc      Obter tipo de imóvel único
// @route     GET /api/property-types/:id
// @access    Private
exports.getPropertyType = async (req, res, next) => {
  try {
    const propertyType = await PropertyType.findOne({
      _id: req.params.id,
      company: req.company
    });

    if (!propertyType) {
      return res.status(404).json({
        success: false,
        error: 'Tipo de imóvel não encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: propertyType,
    });
  } catch (err) {
    next(err);
  }
};

// @desc      Criar tipo de imóvel
// @route     POST /api/property-types
// @access    Private
exports.createPropertyType = async (req, res, next) => {
  try {
    // Adicionar usuário ao body
    req.body.user = req.user.id;
    req.body.company = req.company;

    // Verificar se já existe um tipo com esse nome
    const existing = await PropertyType.findOne({
      name: req.body.name,
      company: req.company
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de imóvel com esse nome já existe',
      });
    }

    const propertyType = await PropertyType.create(req.body);

    res.status(201).json({
      success: true,
      data: propertyType,
    });
  } catch (err) {
    next(err);
  }
};

// @desc      Atualizar tipo de imóvel
// @route     PUT /api/property-types/:id
// @access    Private
exports.updatePropertyType = async (req, res, next) => {
  try {
    let propertyType = await PropertyType.findOne({
      _id: req.params.id,
      company: req.company
    });

    if (!propertyType) {
      return res.status(404).json({
        success: false,
        error: 'Tipo de imóvel não encontrado',
      });
    }

    // Verificar se já existe outro tipo com o novo nome
    if (req.body.name && req.body.name !== propertyType.name) {
      const existing = await PropertyType.findOne({
        name: req.body.name,
        company: req.company,
        _id: { $ne: req.params.id }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de imóvel com esse nome já existe',
        });
      }
    }

    // Guardar o nome antigo para atualizar os imóveis
    const oldName = propertyType.name;

    propertyType = await PropertyType.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Atualizar o tipo em todos os imóveis que o utilizam
    if (req.body.name && req.body.name !== oldName) {
      await Property.updateMany(
        { type: oldName, company: req.company },
        { type: req.body.name }
      );
    }

    res.status(200).json({
      success: true,
      data: propertyType,
    });
  } catch (err) {
    next(err);
  }
};

// @desc      Excluir tipo de imóvel
// @route     DELETE /api/property-types/:id
// @access    Private
exports.deletePropertyType = async (req, res, next) => {
  try {
    const propertyType = await PropertyType.findOne({
      _id: req.params.id,
      company: req.company
    });

    if (!propertyType) {
      return res.status(404).json({
        success: false,
        error: 'Tipo de imóvel não encontrado',
      });
    }

    // Verificar se há imóveis usando este tipo
    const inUse = await Property.exists({
      type: propertyType.name,
      company: req.company
    });

    if (inUse) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir um tipo que está sendo usado por imóveis',
      });
    }

    await propertyType.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};