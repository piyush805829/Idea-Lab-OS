import express from 'express';
import { signupUser, loginUser, getCurrentUser } from '../services/authService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res, next) => {
  try {
    const { fullName, registrationNumber, password, confirmPassword, branch, year, section, batch } = req.body;

    if (!fullName || !registrationNumber || !password) {
      return res.status(400).json({ success: false, message: 'Full Name, Registration Number, and Password are required.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and Confirm Password do not match.' });
    }

    const result = await signupUser({
      fullName,
      registrationNumber,
      password,
      branch,
      year,
      section,
      batch
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token: result.token,
      user: result.user
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { registrationNumber, password } = req.body;

    if (!registrationNumber || !password) {
      return res.status(400).json({ success: false, message: 'Registration Number and Password are required.' });
    }

    const result = await loginUser({ registrationNumber, password });

    return res.json({
      success: true,
      message: 'Logged in successfully!',
      token: result.token,
      user: result.user
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user.id);
    return res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  return res.json({
    success: true,
    message: 'Logged out successfully.'
  });
});

export default router;
