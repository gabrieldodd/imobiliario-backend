const express = require('express');
const {
  getContracts,
  getContract,
  createContract,
  updateContract,
  deleteContract,
} = require('../controllers/contractController');

const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Proteger todas as rotas

router.route('/')
  .get(getContracts)
  .post(createContract);

router.route('/:id')
  .get(getContract)
  .put(updateContract)
  .delete(deleteContract);

module.exports = router;