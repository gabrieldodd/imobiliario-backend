const express = require('express');
const {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
} = require('../controllers/propertyController');

const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Proteger todas as rotas

router.route('/')
  .get(getProperties)
  .post(createProperty);

router.route('/:id')
  .get(getProperty)
  .put(updateProperty)
  .delete(deleteProperty);

module.exports = router;