const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();

// User Registration
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if this is the first user (no users in DB)
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    // Create new user with appropriate role
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
    });

    // Save the user to the database
    await newUser.save();
    // Redirect to login page after successful registration
    res.redirect('/login');
  } catch (error) {
    // En cas d'erreur, envoyer une réponse d'erreur
    res.status(500).json({ message: 'Server error', error });
  }
});

// User Login
// Handles POST /login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    // If user not found or password is incorrect, show error
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    // Generate JWT (not used for session, but could be used for APIs)
    const token = jwt.sign({ id: user._id }, 'your_jwt_secret', {
      expiresIn: '1h',
    });

    // Save the user object in the session for authentication
    req.session.user = user;

    // Redirect to the appropriate dashboard based on user role
    if (user.role === 'admin') {
      return res.redirect('/admin');
    }
    // Redirect normal users to home page (tasks)
    return res.redirect('/');
  } catch (error) {
    // If error occurs, show error message
    console.error('Login error:', error);
    return res.render('login', {
      error: 'An error occurred. Please try again.',
    });
  }
});

// User Logout
// Handles POST /logout (and GET /logout for convenience)
function logout(req, res) {
  // If there is no session, just go back to login
  if (!req.session) {
    return res.redirect('/login');
  }

  // Destroy the session and redirect to login page
  return req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Logout failed');
    }
    // Clear default cookie used by express-session
    res.clearCookie('connect.sid');
    return res.redirect('/login');
  });
}

router.post('/logout', logout);
router.get('/logout', logout);

// Export the router to be used in app.js
module.exports = router;
