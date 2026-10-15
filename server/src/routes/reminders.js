const router = require('express').Router();
const ctrl   = require('../controllers/reminderController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/mine', ctrl.getMyReminders);

module.exports = router;
