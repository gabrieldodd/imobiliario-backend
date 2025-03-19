const PropertyType = require('../models/PropertyType');
const Property = require('../models/Property');

// @desc      Obter todos os tipos de imóveis
// @route     GET /api/property-types
// @access    Private
exports.getPropertyTypes = async (req, res) => {
  try {
    console.log('Buscando tipos de imóveis para empresa:', req.company);
    
    // Filtrar por empresa do usuário
    const propertyTypes = await PropertyType.find({ company: req.company });

    console.log(`Encontrados ${propertyTypes.length} tipos de imóveis`);
    
    return res.status(200).json({
      success: true,
      count: propertyTypes.length,
      data: propertyTypes
    });
  } catch (err) {
    console.error('Erro ao buscar tipos de imóveis:', err);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar tipos de imóveis'
    });
  }
};

// @desc      Obter tipo de imóvel único
// @route     GET /api/property-types/:id
// @access    Private
exports.getPropertyType = async (req, res) => {
  try {
    console.log('Buscando tipo de imóvel:', req.params.id);
    
    const propertyType = await PropertyType.findOne({
      _id: req.params.id,
      company: req.company
    });

    if (!propertyType) {
      console.log('Tipo de imóvel não encontrado:', req.params.id);
      return res.status(404).json({
        success: false,
        error: 'Tipo de imóvel não encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      data: propertyType
    });
  } catch (err) {
    console.error('Erro ao buscar tipo de imóvel:', err);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar tipo de imóvel'
    });
  }
};

// @desc      Criar tipo de imóvel
// @route     POST /api/property-types
// @access    Private
exports.createPropertyType = async (req, res) => {
  try {
    console.log('Tentativa de criar tipo de imóvel:', {
      body: req.body,
      user: req.user?.id,
      company: req.company
    });

    // Validação básica
    if (!req.body.name || typeof req.body.name !== 'string' || req.body.name.trim() === '') {
      console.log('Nome inválido para tipo de imóvel');
      return res.status(400).json({
        success: false,
        error: 'Por favor, informe um nome válido para o tipo de imóvel'
      });
    }

    // Verificar se já existe um tipo com esse nome na mesma empresa
    const normalizedName = req.body.name.trim().toLowerCase();
    const existing = await PropertyType.findOne({
      name: new RegExp(`^${normalizedName}$`, 'i'),
      company: req.company
    });

    if (existing) {
      console.log('Tipo de imóvel já existe:', normalizedName);
      return res.status(400).json({
        success: false,
        error: 'Tipo de imóvel com esse nome já existe'
      });
    }

    // Preparar dados para criação
    const typeData = {
      name: req.body.name.trim(),
      user: req.user.id,
      company: req.company
    };
    
    console.log('Criando tipo de imóvel com dados:', typeData);
    
    // Criar o tipo de imóvel de modo mais robusto
    const propertyType = new PropertyType(typeData);
    const savedType = await propertyType.save();
    
    console.log('Tipo de imóvel criado com sucesso:', savedType);

    return res.status(201).json({
      success: true,
      data: savedType
    });
  } catch (err) {
    console.error('Erro detalhado ao criar tipo de imóvel:', err);
    
    // Tratamento de erro para violação de índice único
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de imóvel com esse nome já existe'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar tipo de imóvel'
    });
  }
};

// @desc      Atualizar tipo de imóvel
// @route     PUT /api/property-types/:id
// @access    Private
exports.updatePropertyType = async (req, res) => {
  try {
    console.log('Tentativa de atualizar tipo de imóvel:', {
      id: req.params.id,
      body: req.body,
      company: req.company
    });

    // Validação básica
    if (!req.body.name || typeof req.body.name !== 'string' || req.body.name.trim() === '') {
      console.log('Nome inválido para atualização de tipo de imóvel');
      return res.status(400).json({
        success: false,
        error: 'Por favor, informe um nome válido para o tipo de imóvel'
      });
    }

    // Buscar o tipo para verificar se existe
    let propertyType = await PropertyType.findOne({
      _id: req.params.id,
      company: req.company
    });

    if (!propertyType) {
      console.log('Tipo de imóvel não encontrado para atualização:', req.params.id);
      return res.status(404).json({
        success: false,
        error: 'Tipo de imóvel não encontrado'
      });
    }

    // Verificar se o novo nome já existe para outro tipo na mesma empresa
    const normalizedName = req.body.name.trim().toLowerCase();
    if (normalizedName !== propertyType.name.toLowerCase()) {
      const existing = await PropertyType.findOne({
        name: new RegExp(`^${normalizedName}$`, 'i'),
        company: req.company,
        _id: { $ne: req.params.id }
      });

      if (existing) {
        console.log('Nome já existe para outro tipo:', normalizedName);
        return res.status(400).json({
          success: false,
          error: 'Tipo de imóvel com esse nome já existe'
        });
      }
    }

    // Guardar o nome antigo para atualizar imóveis
    const oldName = propertyType.name;
    const newName = req.body.name.trim();

    // Atualizar o tipo
    propertyType = await PropertyType.findByIdAndUpdate(
      req.params.id,
      { name: newName },
      { new: true, runValidators: true }
    );

    console.log('Tipo de imóvel atualizado:', propertyType);

    // Atualizar imóveis que usam este tipo
    if (oldName !== newName) {
      console.log(`Atualizando imóveis do tipo "${oldName}" para "${newName}"`);
      await Property.updateMany(
        { type: oldName, company: req.company },
        { type: newName }
      );
    }

    return res.status(200).json({
      success: true,
      data: propertyType
    });
  } catch (err) {
    console.error('Erro ao atualizar tipo de imóvel:', err);
    
    // Tratamento de erro para violação de índice único
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de imóvel com esse nome já existe'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar tipo de imóvel'
    });
  }
};

// @desc      Excluir tipo de imóvel
// @route     DELETE /api/property-types/:id
// @access    Private
exports.deletePropertyType = async (req, res) => {
  try {
    console.log('Tentativa de excluir tipo de imóvel:', req.params.id);

    // Buscar o tipo para verificar se existe
    const propertyType = await PropertyType.findOne({
      _id: req.params.id,
      company: req.company
    });

    if (!propertyType) {
      console.log('Tipo de imóvel não encontrado para exclusão:', req.params.id);
      return res.status(404).json({
        success: false,
        error: 'Tipo de imóvel não encontrado'
      });
    }

    // Verificar se há imóveis usando este tipo
    const inUse = await Property.exists({
      type: propertyType.name,
      company: req.company
    });

    if (inUse) {
      console.log('Tipo de imóvel está em uso, não pode ser excluído:', propertyType.name);
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir um tipo que está sendo usado por imóveis'
      });
    }

    // Excluir o tipo
    await PropertyType.deleteOne({ _id: req.params.id });
    console.log('Tipo de imóvel excluído com sucesso:', propertyType.name);

    return res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error('Erro ao excluir tipo de imóvel:', err);
    return res.status(500).json({
      success: false,
      error: 'Erro ao excluir tipo de imóvel'
    });
  }
};