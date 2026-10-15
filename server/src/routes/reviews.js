const router = require('express').Router();
const ctrl   = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.post('/',                ctrl.createReview);
router.get('/user/:userId',     ctrl.getUserReviews);
router.get('/admin/all',        adminOnly, ctrl.adminGetAllReviews);

module.exports = router;
