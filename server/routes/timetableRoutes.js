import express from 'express';
import { getTimetableByUserId, updateTimetable } from '../services/timetableService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All timetable routes require authentication
router.use(authMiddleware);

// GET /api/timetable
router.get('/', async (req, res, next) => {
  try {
    const timetable = await getTimetableByUserId(req.user.id);
    return res.json({
      success: true,
      timetable
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/timetable
router.put('/', async (req, res, next) => {
  try {
    const timetableData = req.body.timetable || req.body;
    const updated = await updateTimetable(req.user.id, timetableData);
    return res.json({
      success: true,
      message: 'Timetable updated successfully!',
      timetable: updated
    });
  } catch (error) {
    next(error);
  }
});

export default router;
