const router = require('express').Router();
const ctrl   = require('../controllers/chatController');
const { protect }   = require('../middleware/auth');
const { upload }    = require('../middleware/upload');

router.use(protect);

router.get('/:matchId',          ctrl.getMessages);
router.post('/:matchId/message', upload.single('file'), ctrl.sendMessage);

module.exports = router;
