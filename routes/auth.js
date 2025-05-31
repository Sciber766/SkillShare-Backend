const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const authenticate = require('../middleware/auth');

// Replace with your actual secret in .env
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

router.get('/', (req, res) => {
  res.send('Auth route is working!');
});

// Register route
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.log('Error registering user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route (with JWT)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Incorrect password' });

    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '1d' } // optional
    );

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/main', authenticate, (req, res) => {
  res.json({ message: `Welcome ${req.user.name}` });
});


// Logout route (client should just delete token, so this is optional)
router.post('/logout', (req, res) => {
  // In JWT, logout is handled on the client by removing token.
  res.json({ message: 'Logout successful (client should clear token)' });
});

module.exports = router;
