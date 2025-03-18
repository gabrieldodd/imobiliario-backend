const Contract = require('../models/Contract');
const Property = require('../models/Property');

// @desc      Obter todos os contratos
// @route     GET /api/contracts
// @access    Private
exports.getContracts = async (req, res, next) => {
  try {
    // Filtrar por empresa do usuário
    const contracts = await Contract.find({ company: req.company });

    res.status(200).json({
      success: true,
      count: contracts.length,
      data: contracts,
    });
  } catch (err) {
    next(err);
  }
};

// @desc      Obter contrato único
// @route     GET /api/contracts/:id
// @access    Private
exports.getContract = async (req, res, next) => {
  try {
    const contract = await Contract.findOne({
      _id: req.params.id,
      company: req.company
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contrato não encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: contract,
    });
  } catch (err) {
    next(err);
  }
};

// @desc      Criar contrato
// @route     POST /api/contracts
// @access    Private
exports.createContract = async (req, res, next) => {
  try {
    // Adicionar usuário ao body
    req.body.user = req.user.id;
    req.body.company = req.company;

    // Verificar se o imóvel está disponível
    const property = await Property.findOne({
      _id: req.body.propertyId,
      company: req.company
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Imóvel não encontrado',
      });
    }

    if (property.status !== 'Disponível') {
      return res.status(400).json({
        success: false,
        error: 'Imóvel não está disponível para locação',
      });
    }

    const contract = await Contract.create(req.body);

    // Atualizar status do imóvel para "Alugado"
    await Property.findByIdAndUpdate(req.body.propertyId, { status: 'Alugado' });

    res.status(201).json({
      success: true,
      data: contract,
    });
  } catch (err) {
    next(err);
  }
};

// @desc      Atualizar contrato
// @route     PUT /api/contracts/:id
// @access    Private
exports.updateContract = async (req, res, next) => {
  try {
    let contract = await Contract.findOne({
      _id: req.params.id,
      company: req.company
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contrato não encontrado',
      });
    }

    // Verificar se está atualizando status para Encerrado
    if (req.body.status === 'Encerrado' && contract.status !== 'Encerrado') {
      // Atualizar imóvel para Disponível
      await Property.findByIdAndUpdate(contract.propertyId, { status: 'Disponível' });
    }

    // Verificar se está reativando um contrato Encerrado
    if (contract.status === 'Encerrado' && req.body.status === 'Ativo') {
      const property = await Property.findById(contract.propertyId);
      
      if (property.status !== 'Disponível') {
        return res.status(400).json({
          success: false,
          error: 'Este imóvel não está mais disponível',
        });
      }
      
      await Property.findByIdAndUpdate(contract.propertyId, { status: 'Alugado' });
    }

    contract = await Contract.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: contract,
    });
  } catch (err) {
    next(err);
  }
};

// @desc      Excluir contrato
// @route     DELETE /api/contracts/:id
// @access    Private
exports.deleteContract = async (req, res, next) => {
  try {
    const contract = await Contract.findOne({
      _id: req.params.id,
      company: req.company
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contrato não encontrado',
      });
    }

    // Se o contrato estiver ativo, atualizar o status do imóvel para Disponível
    if (contract.status === 'Ativo' || contract.status === 'Pendente') {
      await Property.findByIdAndUpdate(contract.propertyId, { status: 'Disponível' });
    }

    await contract.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};