const router  = require('express').Router();
const ctrl    = require('../controllers/matchController');
const { protect }   = require('../middleware/auth');

router.use(protect);

router.get('/discover',  ctrl.discoverUsers);
router.post('/',         ctrl.createMatch);
router.get('/mine',      ctrl.getMyMatches);
router.get('/:id',       ctrl.getMatch);
router.put('/:id/status', ctrl.updateMatchStatus);

module.exports = router;
