const express = require('express');
const {
  getPropertyTypes,
  getPropertyType,
  createPropertyType,
  updatePropertyType,
  deletePropertyType,
} = require('../controllers/propertyTypeController');

const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Proteger todas as rotas

router.route('/')
  .get(getPropertyTypes)
  .post(createPropertyType);

router.route('/:id')
  .get(getPropertyType)
  .put(updatePropertyType)
  .delete(deletePropertyType);

module.exports = router;