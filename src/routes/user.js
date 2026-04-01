const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const session = require('express-session');

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

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });

        // Save the user to the database
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' }).redirect('/user/login');
    } catch (error) {
        // En cas d'erreur, envoyer une réponse d'erreur
        res.status(500).json({ message: 'Server error', error });
    }
});

// User Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });
        console.log('User found:', user);
        console.log('Password provided:', password);
        console.log('Stored hashed password:',  user.password);
        console.log('Password match:', await bcrypt.compare(password, user.password));
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        // Generate JWT
        const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '1h' });

        // Save the user to the session
        req.session.user = user;

        // Redirect to the appropriate dashboard
        if (user.role === 'admin') {
            return res.redirect('/admin');
        }
        return res.redirect('/dashboard');
    } catch (error) {
        // En cas d'erreur, envoyer une réponse d'erreur
        console.error('Login error:', error);
        return res.render('login', { error: 'An error occurred. Please try again.' });
    }
});

module.exports = router;