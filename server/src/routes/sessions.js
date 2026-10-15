const router = require('express').Router();
const ctrl   = require('../controllers/sessionController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

// Admin route (Member D) — must be before /:id to avoid conflict
router.get('/admin/all', adminOnly, ctrl.adminGetAllSessions);

router.post('/',                                   ctrl.createSession);
router.get('/mine',                                ctrl.getMySessions);
router.get('/overlap/:matchId',                    ctrl.getAvailabilityOverlap);
router.get('/:id',                                 ctrl.getSession);
router.put('/:id/schedule',                        ctrl.scheduleSession);
router.put('/:id/status',                          ctrl.updateSessionStatus);
router.post('/:id/notes',                          ctrl.addNote);
router.get('/:id/notes',                           ctrl.getNotes);
router.patch('/:id/notes/:noteId/milestone',       ctrl.toggleMilestone);

module.exports = router;
