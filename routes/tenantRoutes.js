const express = require('express');
const {
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
} = require('../controllers/tenantController');

const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Proteger todas as rotas

router.route('/')
  .get(getTenants)
  .post(createTenant);

router.route('/:id')
  .get(getTenant)
  .put(updateTenant)
  .delete(deleteTenant);

module.exports = router;