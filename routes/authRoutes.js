const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  logout,
  createUser,
  getUsers,
  getUser,
  updateUser,
  resetPassword,
  toggleUserStatus
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Rotas públicas
router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);

// Rotas protegidas - usuário atual
router.get('/me', protect, getMe);

// Rotas de administração de usuários - apenas para admins
router.route('/users')
  .get(protect, authorize('admin'), getUsers)
  .post(protect, authorize('admin'), createUser);

router.route('/users/:id')
  .get(protect, authorize('admin'), getUser)
  .put(protect, authorize('admin'), updateUser);

router.put('/users/:id/reset-password', protect, authorize('admin'), resetPassword);
router.put('/users/:id/toggle-status', protect, authorize('admin'), toggleUserStatus);

module.exports = router;