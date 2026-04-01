const express = require('express');
const User = require('../models/user');
const Task = require('../models/task');

const router = express.Router();

// Admin page (HTML)
// GET /admin
router.get('/', (req, res) => {
  return res.render('admin', {
    title: 'Admin',
    user: req.session?.user,
  });
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username email'); // Fetch only username and email
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get tasks by user ID
router.get('/users/:userId/tasks', async (req, res) => {
  const { userId } = req.params;

  try {
    const tasks = await Task.find({ Creator: userId });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Example admin route
router.get('/dashboard', (req, res) => {
  res.send('Welcome to the admin dashboard.');
});

module.exports = router;
