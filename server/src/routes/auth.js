const router = require('express').Router();
const ctrl   = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload }  = require('../middleware/upload');

router.post('/register', ctrl.registerValidation, ctrl.register);
router.post('/login',    ctrl.loginValidation,    ctrl.login);
router.get('/me',        protect, ctrl.getMe);
router.put('/me',        protect, upload.single('avatar'), ctrl.updateProfile);
router.get('/users/:id', protect, ctrl.getUserById);

module.exports = router;
