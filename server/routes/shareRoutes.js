import express from 'express';
import { shareTimetable, getSharedTimetablesForUser, importSharedSchedule } from '../services/shareService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// POST /api/share
router.post('/', async (req, res, next) => {
  try {
    const { toRegNumber, timetableData } = req.body;

    if (!toRegNumber) {
      return res.status(400).json({ success: false, message: 'Target registration number is required.' });
    }

    const shareDoc = await shareTimetable({
      fromUserId: req.user.id,
      toRegNumber,
      timetableData
    });

    return res.status(201).json({
      success: true,
      message: `Timetable successfully shared with ${toRegNumber.toUpperCase()}`,
      shareDoc
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/share
router.get('/', async (req, res, next) => {
  try {
    const list = await getSharedTimetablesForUser(req.user.regNumber);
    return res.json({
      success: true,
      sharedTimetables: list
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/share/import
router.post('/import', async (req, res, next) => {
  try {
    const { shareId } = req.body;

    if (!shareId) {
      return res.status(400).json({ success: false, message: 'Share ID is required.' });
    }

    const result = await importSharedSchedule({
      userId: req.user.id,
      shareId
    });

    return res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

export default router;
